#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AG-UI Error Formatters.

This module provides formatters for converting Python exceptions into
AG-UI protocol error events. It handles both Cloudbase Agent custom exceptions
and standard Python exceptions.

The formatters ensure consistent error reporting across all Cloudbase Agent servers
and maintain compatibility with the AG-UI protocol specification.
"""

import json
import os
from typing import Optional

from .agui_models import RunErrorEvent
from .event_types import EventType
from .exceptions import AgentServiceError

# Maximum size for error context (1KB to prevent oversized responses)
MAX_CONTEXT_SIZE = 1024

# Environment-aware error messages
# In production, provide user-friendly messages; in development, show details
ERROR_MESSAGE_MAPPING = {
    "KeyError": "Configuration parameter missing. Please check request parameters.",
    "ValueError": "Invalid parameter value. Please check your input.",
    "TypeError": "Invalid parameter type. Please check your input format.",
    "TimeoutError": "Request processing timeout. Please try again later.",
    "ConnectionError": "Service connection failed. Please try again later.",
}


def _get_friendly_message(error: Exception) -> str:
    """Get user-friendly error message based on exception type.
    
    Args:
        error: The exception to format
        
    Returns:
        User-friendly error message
    """
    error_type = type(error).__name__
    
    # Return mapped message in production
    if os.getenv("ENV") == "production":
        return ERROR_MESSAGE_MAPPING.get(error_type, "Internal server error occurred")
    
    # Return original message in development
    return str(error)


def _safe_serialize_context(context: Optional[dict]) -> Optional[dict]:
    """Safely serialize error context, handling non-serializable objects.
    
    This prevents infinite recursion and JSON serialization errors when
    context contains complex objects.
    
    Args:
        context: Error context dictionary
        
    Returns:
        Serializable context or None
    """
    if not context:
        return None
    
    try:
        # Test serialization
        json.dumps(context)
        
        # Limit context size
        if len(str(context)) > MAX_CONTEXT_SIZE:
            return {
                "_truncated": True,
                "message": "Context too large and has been truncated",
            }
        
        return context
    except (TypeError, ValueError):
        # Return safe fallback if serialization fails
        return {
            "_serialization_error": True,
            "message": "Error context contains non-serializable data",
        }


def _extract_error_code(error: Exception) -> Optional[str]:
    """Extract error code from exception attributes.
    
    Attempts to extract code from various common attribute names:
    - code / error_code / errCode / status_code
    
    Args:
        error: Exception to extract code from
        
    Returns:
        Extracted code as string, or None if not found
    """
    # Try different attribute names (in priority order)
    for attr_name in ["code", "error_code", "errCode", "status_code"]:
        if hasattr(error, attr_name):
            value = getattr(error, attr_name)
            if value is not None:
                return str(value)
    
    return None


def format_agui_error(
    error: Exception,
    thread_id: str,
    run_id: str,
    execution_time: Optional[int] = None,
) -> dict:
    """Format an exception as AG-UI error event.
    
    This function converts any Python exception into an AG-UI compatible
    RunErrorEvent structure. It handles both Cloudbase Agent custom exceptions
    (AgentServiceError) and standard Python exceptions.
    
    Error code filling strategy (按文档规范):
    1. Priority 1: Use user-provided code from AgentServiceError
    2. Priority 2: Extract from exception attributes (code/error_code/errCode/status_code)
    3. Priority 3: Fallback to INTERNAL_ERROR for unknown errors
    
    Args:
        error: The exception to format
        thread_id: Thread/conversation ID (required by AG-UI)
        run_id: Run ID (required by AG-UI)
        execution_time: Optional execution time in milliseconds
        
    Returns:
        Dictionary in AG-UI RunErrorEvent format with camelCase fields
        
    Example:
        Cloudbase Agent exception::
        
            error = ResourceNotFoundError("agent", "gpt-4")
            result = format_agui_error(error, "thread_1", "run_1")
            # {
            #     "type": "RUN_ERROR",
            #     "threadId": "thread_1",
            #     "runId": "run_1",
            #     "message": "Agent 'gpt-4' not found",
            #     "code": "RESOURCE_NOT_FOUND",
            #     "context": {"resource_type": "agent", "resource_id": "gpt-4"},
            #     "timestamp": 1705651200000
            # }
            
        Standard Python exception with code attribute::
        
            error = Exception("Rate limited")
            error.status_code = 429
            result = format_agui_error(error, "thread_1", "run_1")
            # {
            #     "type": "RUN_ERROR",
            #     "threadId": "thread_1",
            #     "runId": "run_1",
            #     "message": "Rate limited",
            #     "code": "429",
            #     "timestamp": 1705651200000
            # }
            
        Standard Python exception without code::
        
            error = ValueError("Invalid input")
            result = format_agui_error(error, "thread_1", "run_1")
            # {
            #     "type": "RUN_ERROR",
            #     "threadId": "thread_1",
            #     "runId": "run_1",
            #     "message": "Invalid parameter value. Please check your input.",
            #     "code": "INTERNAL_ERROR",
            #     "timestamp": 1705651200000
            # }
    """
    # Extract error information based on exception type
    if isinstance(error, AgentServiceError):
        message = error.message
        code = error.error_type.upper()
        context = _safe_serialize_context(error.details)
    else:
        # Handle generic Python exceptions
        message = _get_friendly_message(error)
        
        # Priority 2: Try to extract code from exception attributes
        extracted_code = _extract_error_code(error)
        
        # Priority 3: Fallback to INTERNAL_ERROR if no code found
        code = extracted_code if extracted_code else "INTERNAL_ERROR"
        context = None
    
    # Create AG-UI RunErrorEvent
    event = RunErrorEvent(
        type=EventType.RUN_ERROR,
        thread_id=thread_id,
        run_id=run_id,
        message=message,
        code=code,
        context=context,
        execution_time=execution_time,
    )
    
    # Serialize with camelCase field names (exclude None values)
    return event.model_dump(by_alias=True, exclude_none=True)


def format_sse_error(
    error: Exception,
    thread_id: str,
    run_id: str,
) -> str:
    """Format error as Server-Sent Events (SSE) string.
    
    This function wraps the AG-UI error event in SSE format for streaming
    responses. The output follows SSE specification with "data: " prefix
    and double newline terminator.
    
    Args:
        error: The exception to format
        thread_id: Thread/conversation ID
        run_id: Run ID
        
    Returns:
        SSE formatted string: "data: {json}\\n\\n"
        
    Example:
        Basic usage::
        
            error = ResourceNotFoundError("agent", "gpt-4")
            sse_string = format_sse_error(error, "thread_1", "run_1")
            # Returns: 'data: {"type":"RUN_ERROR","threadId":"thread_1",...}\n\n'
            
        Streaming to client::
        
            from fastapi.responses import StreamingResponse
            
            def error_stream():
                yield format_sse_error(error, thread_id, run_id)
            
            return StreamingResponse(
                error_stream(),
                media_type="text/event-stream"
            )
    """
    error_data = format_agui_error(error, thread_id, run_id)
    return f"data: {json.dumps(error_data)}\n\n"


def safe_stream_wrapper(generator, thread_id: str, run_id: str):
    """Wrap SSE generator to catch and format errors during streaming.
    
    This wrapper ensures that errors occurring during SSE generation are
    properly caught and formatted as AG-UI error events. This prevents
    the stream from abruptly terminating without proper error notification.
    
    Args:
        generator: The original SSE generator
        thread_id: Thread/conversation ID
        run_id: Run ID
        
    Yields:
        SSE event strings (both normal events and error events)
        
    Example:
        Protecting a streaming endpoint::
        
            async def stream_agent_response():
                try:
                    async for chunk in agent.stream(request):
                        yield format_sse_event(chunk)
                except Exception as e:
                    # This won't be caught by global exception handler
                    pass  # Stream just ends
            
            # Better: Use safe wrapper
            async def stream_agent_response():
                async for chunk in safe_stream_wrapper(
                    agent.stream(request),
                    thread_id,
                    run_id
                ):
                    yield chunk
    """
    try:
        for item in generator:
            yield item
    except Exception as e:
        # Format error as SSE event
        yield format_sse_error(e, thread_id, run_id)
