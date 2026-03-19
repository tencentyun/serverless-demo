#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Send Message Server Adapter.

This module provides the server adapter for the send_message endpoint,
handling request processing, streaming responses, and resource cleanup.
"""

import inspect
import logging
from typing import AsyncGenerator, Optional, Any

from fastapi import Request
from fastapi.responses import StreamingResponse

# Optional observability imports
# These are only used if cloudbase_agent.observability package is installed
try:
    from opentelemetry import trace
    from opentelemetry.trace import SpanContext
    HAS_OBSERVABILITY = True
except ImportError:
    # When observability package is not installed, use Any type
    SpanContext = Any  # type: ignore
    HAS_OBSERVABILITY = False

from ..utils.sse import async_generator_from_string
from ..utils.types import AgentCreator
from .handler import handler
from .models import RunAgentInput

logger = logging.getLogger(__name__)


def _try_create_server_span(
    request: RunAgentInput, http_context: Optional[Request] = None
) -> tuple[Optional[Any], Optional[Any]]:
    """Try to create an AG-UI.Server span for observability.

    This function attempts to create a server-level span that wraps the entire
    request processing. The span context is then propagated to adapter layers
    for unified trace hierarchy.

    Supports external trace context inheritance via HTTP headers:
    - x-trace-id: External trace ID to inherit
    - x-parent-span-id: External parent span ID to link to

    Args:
        request: The validated request input
        http_context: Optional HTTP request context for accessing URL, headers, etc.

    Returns:
        Tuple of (server_span, span_context) where both may be None if observability
        is not available or fails.
    """
    try:
        # Try to import observability module
        from cloudbase_agent.observability import (
            start_observation,
            process_trace_context_from_headers,
        )

        # Build span attributes
        span_attributes: dict[str, Any] = {
            "http.method": "POST",
            "agui.thread_id": request.thread_id,
            "agui.run_id": request.run_id,
        }

        # Extract URL from HTTP context if available
        if http_context is not None:
            try:
                span_attributes["http.url"] = str(http_context.url)
            except Exception:
                pass

            # Extract request ID from headers (x-request-id, x-correlation-id, x-trace-id)
            # Priority: x-request-id > x-correlation-id > x-trace-id
            try:
                headers = http_context.headers
                request_id = (
                    headers.get("x-request-id")
                    or headers.get("x-correlation-id")
                    or headers.get("x-trace-id")
                )
                if request_id:
                    span_attributes["agui.request_id"] = request_id
            except Exception:
                pass

        # Process external trace context (extraction, validation, link creation)
        trace_context = process_trace_context_from_headers(
            dict(http_context.headers) if http_context else {},
            logger_instance=logger,
        )

        # Merge trace context attributes into span attributes
        if trace_context.is_inherited:
            span_attributes.update(trace_context.span_attributes)

        # Create server-level span with HTTP attributes and optional links
        server_span = start_observation(
            "AG-UI.Server",
            span_attributes,
            as_type="chain",
            links=trace_context.links if trace_context.links else None,
        )

        # Extract SpanContext for propagation
        span_context = server_span.otel_span.get_span_context()

        return server_span, span_context

    except Exception:
        # Note: This warning is commented out because when the observability package is not installed,
        return None, None


def _inject_server_context(
    request: RunAgentInput, span_context: Optional[Any]
) -> RunAgentInput:
    """Inject server SpanContext into request forwarded_props for trace propagation.

    This function serializes the SpanContext and injects it into the request's
    forwarded_props, allowing adapter layers to restore the trace hierarchy.

    Args:
        request: The original request
        span_context: The server span's SpanContext

    Returns:
        Modified request with injected context, or original if injection fails
    """
    if span_context is None:
        return request

    try:
        # Serialize SpanContext for propagation
        # Note: span_id and trace_id are TraceIDs (not simple hex strings)
        # We need to convert them properly
        server_context_data = {
            "trace_id": format(span_context.trace_id, "032x"),
            "span_id": format(span_context.span_id, "016x"),
            "trace_flags": int(span_context.trace_flags),
        }

        # Get existing forwarded_props or create new dict
        forwarded_props = dict(request.forwarded_props) if request.forwarded_props else {}

        # Inject server context for trace propagation to adapter layers
        forwarded_props["__agui_server_context"] = server_context_data

        return RunAgentInput(
            thread_id=request.thread_id,
            run_id=request.run_id,
            messages=request.messages,
            state=request.state,
            tools=request.tools,
            context=request.context,
            forwarded_props=forwarded_props,
        )

    except Exception as e:
        logger.warning(f"Failed to inject server context: {e}")
        return request



async def create_adapter(
    create_agent: AgentCreator,
    request: RunAgentInput,
    http_context: Optional[Request] = None,
) -> StreamingResponse:
    """Create streaming adapter for send_message requests.

    Args:
        create_agent: Function that creates and returns agent with optional cleanup
        request: AG-UI protocol request body
        http_context: HTTP request context for accessing headers, etc.

    Returns:
        Streaming response with SSE-formatted events
    """
    server_span = None

    try:
        # Create agent and get optional cleanup function
        result = create_agent()
        if inspect.iscoroutine(result):
            result = await result

        agent = result["agent"]
        cleanup = result.get("cleanup")

        # Try to create server-level span and inject context for trace propagation
        server_span, span_context = _try_create_server_span(request, http_context)
        if span_context is not None:
            request = _inject_server_context(request, span_context)

        async def create_sse_stream() -> AsyncGenerator[str, None]:
            """Create Server-Sent Events stream with error detection and cleanup.

            This function handles TWO types of errors:
            1. Errors embedded in event content (detected by error_detector)
            2. Exceptions during agent execution (caught here and converted to RUN_ERROR)

            Yields:
                SSE-formatted event strings (normal events or RunError)
            """
            from ag_ui.core import EventType

            from .error_detector import detect_error_in_event
            from .models import RunErrorEvent

            try:
                async for event in handler(request, agent):
                    # Check 1: Detect errors embedded in event content
                    has_error, error_message, error_code = detect_error_in_event(event)

                    if has_error:
                        # Convert to RunError event
                        error_event = RunErrorEvent(
                            thread_id=request.thread_id or "unknown",
                            run_id=request.run_id or "unknown",
                            message=error_message,
                            code=error_code,
                        )

                        # Send RunError event
                        sse_chunk = f"data: {error_event.model_dump_json(by_alias=True, exclude_none=True)}\n\n"
                        yield sse_chunk

                        logger.warning(
                            "Error detected in event content, terminating stream: "
                            + "thread_id=%s run_id=%s code=%s",
                            request.thread_id,
                            request.run_id,
                            error_code,
                        )

                        return

                    # Normal event: send as-is
                    # Use by_alias=True for camelCase conversion
                    sse_chunk = f"data: {event.model_dump_json(by_alias=True, exclude_none=True)}\n\n"
                    yield sse_chunk

            except Exception as e:
                # Check 2: Handle exceptions during agent execution
                # This is where we implement the error code extraction logic from the documentation
                
                # Priority 1: Extract code from exception attributes
                error_code = None
                for attr_name in ["code", "error_code", "errCode", "status_code"]:
                    if hasattr(e, attr_name):
                        value = getattr(e, attr_name)
                        if value is not None:
                            error_code = str(value)
                            break
                
                # Priority 2: Fallback to INTERNAL_ERROR if no code found
                if not error_code:
                    error_code = "INTERNAL_ERROR"

                # Set server span error status if available
                if server_span is not None:
                    try:
                        from opentelemetry.trace import Status, StatusCode
                        server_span.set_status(Status(StatusCode.ERROR, str(e)))
                        server_span.otel_span.set_attribute("error.type", error_code)
                        server_span.otel_span.set_attribute("error.message", str(e))
                    except Exception:
                        pass

                # Create RunError event
                error_event = RunErrorEvent(
                    thread_id=request.thread_id or "unknown",
                    run_id=request.run_id or "unknown",
                    message=str(e),
                    code=error_code,
                )

                # Send RunError event
                sse_chunk = f"data: {error_event.model_dump_json(by_alias=True, exclude_none=True)}\n\n"
                yield sse_chunk

                logger.error(
                    "Exception during agent execution: thread_id=%s run_id=%s code=%s error=%s",
                    request.thread_id,
                    request.run_id,
                    error_code,
                    str(e),
                    exc_info=True,
                )

            finally:
                # Ensure cleanup is called even if errors occur
                if cleanup:
                    if inspect.iscoroutinefunction(cleanup):
                        await cleanup()
                    else:
                        cleanup()

        return StreamingResponse(
            create_sse_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            },
        )

    except Exception as e:
        # Errors before SSE stream is established are handled by global exception handlers
        # They will return HTTP 400/500 JSON responses
        
        # Set server span error status if available
        if server_span is not None:
            try:
                from opentelemetry.trace import Status, StatusCode
                server_span.set_status(Status(StatusCode.ERROR, str(e)))
                server_span.otel_span.set_attribute("error.type", "INIT_ERROR")
                server_span.otel_span.set_attribute("error.message", str(e))
            except Exception:
                pass
        
        logger.error("Failed to create agent or initialize stream: %s", str(e), exc_info=True)
        raise

    finally:
        # End server span if it was created
        if server_span is not None:
            try:
                server_span.end()
            except Exception:
                pass
