#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Send Message Server Adapter.

This module provides the server adapter for the send_message endpoint,
handling request processing, streaming responses, and resource cleanup.
"""

import inspect
import logging
from typing import AsyncGenerator, Callable, Optional

from fastapi import Request
from fastapi.responses import StreamingResponse

from ..utils.types import AgentCreator
from .handler import handler
from .models import RunAgentInput

logger = logging.getLogger(__name__)

RequestPreprocessor = Optional[Callable[[RunAgentInput, Request], None]]
"""Request preprocessor function type.

Called before agent execution to modify request (e.g., extract user_id from JWT).
"""


async def create_adapter(
    create_agent: AgentCreator, 
    request: RunAgentInput,
    http_context: Optional[Request] = None,
    request_preprocessor: RequestPreprocessor = None,
) -> StreamingResponse:
    """Create streaming adapter for send_message requests.

    Args:
        create_agent: Function that creates and returns agent with optional cleanup
        request: AG-UI protocol request body
        http_context: HTTP request context for accessing headers, etc.
        request_preprocessor: Optional function to preprocess request (e.g., extract user_id from JWT)

    Returns:
        Streaming response with SSE-formatted events
    """
    try:
        if request_preprocessor and http_context:
            request_preprocessor(request, http_context)
        # Create agent and get optional cleanup function
        result = create_agent()
        if inspect.iscoroutine(result):
            result = await result

        agent = result["agent"]
        cleanup = result.get("cleanup")

        async def create_sse_stream() -> AsyncGenerator[str, None]:
            """Create Server-Sent Events stream with error detection and cleanup.

            Yields:
                SSE-formatted event strings (normal events or RunError)
            """
            from ag_ui.core import EventType

            from .error_detector import detect_error_in_event
            from .models import RunErrorEvent

            try:
                async for event in handler(request, agent):
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
        # in the correct AG-UI format (SSE or JSON based on Accept header)
        logger.error("Failed to create agent or initialize stream: %s", str(e), exc_info=True)
        raise
