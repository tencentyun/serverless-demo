#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""FastAPI Exception Handlers for Cloudbase Agent Server.

This module provides global exception handlers that ensure consistent error
responses across all Cloudbase Agent servers. The handlers:

1. Catch all exceptions to prevent service crashes (inspired by AWS Bedrock)
2. Log structured logs with requestId, threadId, runId
3. Return AG-UI compatible error events
4. Support both JSON and Server-Sent Events (SSE) responses

The exception handlers are automatically installed by AgentServiceApp and
can be manually installed for custom FastAPI applications.

Example:
    Manual installation for Method 1 (core adapters)::
    
        from cloudbase_agent.server.errors import install_exception_handlers
        from fastapi import FastAPI
        
        app = FastAPI()
        install_exception_handlers(app)
        
        # Now all exceptions are automatically handled
        @app.post("/send-message")
        async def send_message(request: RunAgentInput):
            # Exceptions are caught and formatted automatically
            return await process_message(request)
"""

import logging
from typing import Optional, Union

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import ValidationError

from .exceptions import AgentServiceError
from .formatters import format_agui_error, format_sse_error

logger = logging.getLogger(__name__)


def _extract_request_context(request: Request) -> dict:
    """Extract error context from FastAPI request.
    
    This function retrieves error context stored in request.state by
    middleware. If context is not available, it returns "unknown" as
    default values.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Dictionary with threadId, runId, and requestId
    """
    return {
        "thread_id": getattr(request.state, "thread_id", "unknown"),
        "run_id": getattr(request.state, "run_id", "unknown"),
        "request_id": request.headers.get("X-Request-ID", "unknown"),
    }


def _log_error(error: Exception, request: Request, level: str = "error") -> None:
    """Log error with structured context (inspired by AWS Bedrock).
    
    This function creates structured log entries that include request
    identifiers and error details for better traceability and debugging.
    
    Args:
        error: The exception to log
        request: FastAPI request object
        level: Log level ("warning" for 4xx, "error" for 5xx)
    """
    context = _extract_request_context(request)
    
    log_data = {
        "requestId": context["request_id"],
        "threadId": context["thread_id"],
        "runId": context["run_id"],
        "errorType": type(error).__name__,
        "errorMessage": str(error),
        "path": request.url.path,
        "method": request.method,
    }
    
    # Add status code for known errors
    if isinstance(error, AgentServiceError):
        log_data["statusCode"] = error.status_code
    
    # Log with appropriate level
    if level == "warning":
        logger.warning("Request failed with client error", extra=log_data)
    else:
        logger.exception("Request failed with server error", extra=log_data)


def _is_sse_request(request: Request) -> bool:
    """Check if the request expects Server-Sent Events response.
    
    Args:
        request: FastAPI request object
        
    Returns:
        True if SSE response is expected, False otherwise
    """
    return request.headers.get("Accept") == "text/event-stream"


def _create_error_response(
    error: Exception,
    status_code: int,
    context: dict,
) -> Union[JSONResponse, StreamingResponse]:
    """Create appropriate error response based on request type.
    
    Args:
        error: The exception to format
        status_code: HTTP status code
        context: Request context with threadId, runId
        
    Returns:
        JSONResponse or StreamingResponse with AG-UI formatted error
    """
    # Format error as AG-UI event
    error_data = format_agui_error(
        error,
        context["thread_id"],
        context["run_id"],
    )
    
    # Return JSON response
    return JSONResponse(
        status_code=status_code,
        content=error_data,
    )


def _create_sse_error_response(
    error: Exception,
    context: dict,
) -> StreamingResponse:
    """Create SSE error response.
    
    Args:
        error: The exception to format
        context: Request context with threadId, runId
        
    Returns:
        StreamingResponse with AG-UI formatted error in SSE format
    """
    sse_data = format_sse_error(
        error,
        context["thread_id"],
        context["run_id"],
    )
    
    return StreamingResponse(
        iter([sse_data]),
        media_type="text/event-stream",
    )


def _extract_validation_error_message(error: Union[RequestValidationError, ValidationError]) -> str:
    """Extract user-friendly message from Pydantic validation error.
    
    Pydantic validation errors contain technical details that are not
    user-friendly. This function extracts and formats the most relevant
    error information.
    
    Args:
        error: Pydantic validation error
        
    Returns:
        User-friendly error message
    """
    if not error.errors():
        return "Request validation failed"
    
    # Get first error (usually most relevant)
    first_error = error.errors()[0]
    field = " -> ".join(str(loc) for loc in first_error["loc"])
    msg = first_error["msg"]
    
    return f"Invalid field '{field}': {msg}"


def install_exception_handlers(app: FastAPI) -> None:
    """Install global exception handlers for Cloudbase Agent server.
    
    This function registers exception handlers that:
    - Catch AgentServiceError and return appropriate responses
    - Catch Pydantic validation errors with user-friendly messages
    - Catch all other exceptions to prevent service crashes
    - Support both JSON and SSE response formats
    - Log all errors with structured context
    
    The handlers are automatically called by AgentServiceApp.build() and
    AgentServiceApp.run(). For Method 1 (core adapters), users must call
    this function manually.
    
    Args:
        app: FastAPI application instance
        
    Example:
        Method 1 (manual installation)::
        
            from cloudbase_agent.server.errors import install_exception_handlers
            
            app = FastAPI()
            install_exception_handlers(app)
            
            @app.post("/send-message")
            async def send_message(request: RunAgentInput):
                # Exceptions are automatically handled
                raise ResourceNotFoundError("agent", "gpt-4")
                
        Method 2/3 (automatic installation)::
        
            # AgentServiceApp automatically installs handlers
            AgentServiceApp().run(create_agent, port=9000)
    """

    @app.exception_handler(AgentServiceError)
    async def handle_agent_service_error(request: Request, exc: AgentServiceError):
        """Handle known Cloudbase Agent errors.
        
        This handler catches all AgentServiceError subclasses and returns
        appropriate HTTP responses with AG-UI formatted error events.
        """
        context = _extract_request_context(request)
        
        # Log warning for client errors (4xx), error for server errors (5xx)
        log_level = "warning" if exc.status_code < 500 else "error"
        _log_error(exc, request, level=log_level)
        
        # Return SSE or JSON response based on request type
        if _is_sse_request(request):
            return _create_sse_error_response(exc, context)
        
        return _create_error_response(exc, exc.status_code, context)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        """Handle Pydantic request validation errors.
        
        This handler catches FastAPI's RequestValidationError (raised when
        request body, query params, or path params fail validation) and
        returns user-friendly error messages.
        """
        context = _extract_request_context(request)
        
        # Extract user-friendly message
        friendly_message = _extract_validation_error_message(exc)
        
        # Create a temporary InvalidRequestError for consistent formatting
        from .exceptions import InvalidRequestError

        temp_error = InvalidRequestError(
            message=friendly_message,
            details={"validation_errors": exc.errors()},
        )
        
        _log_error(temp_error, request, level="warning")
        
        # Return SSE or JSON response based on request type
        if _is_sse_request(request):
            return _create_sse_error_response(temp_error, context)
        
        return _create_error_response(temp_error, 400, context)

    @app.exception_handler(Exception)
    async def handle_generic_error(request: Request, exc: Exception):
        """Handle all other exceptions (safety net).
        
        This is the catch-all handler that prevents service crashes by
        catching any unhandled exceptions. It logs the full stack trace
        and returns a generic error response to the client.
        
        Inspired by AWS Bedrock AgentCore's approach to resilient error handling.
        """
        context = _extract_request_context(request)
        
        # Always log full stack trace for unknown errors
        _log_error(exc, request, level="error")
        
        # Return SSE or JSON response based on request type
        if _is_sse_request(request):
            return _create_sse_error_response(exc, context)
        
        return _create_error_response(exc, 500, context)


# Legacy compatibility functions (for backwards compatibility with existing code)
def classify_exception(error: Exception) -> AgentServiceError:
    """Classify a generic exception into an AgentServiceError.
    
    This function is provided for backwards compatibility. New code should
    use install_exception_handlers() instead.
    
    Args:
        error: Exception to classify
        
    Returns:
        Classified AgentServiceError
    """
    if isinstance(error, AgentServiceError):
        return error
    
    from .exceptions import InvalidRequestError

    return InvalidRequestError(str(error))


def create_error_response(error: Exception, request_id: Optional[str] = None) -> dict:
    """Create error response dictionary.
    
    This function is provided for backwards compatibility. New code should
    use install_exception_handlers() instead.
    
    Args:
        error: Exception to format
        request_id: Optional request ID
        
    Returns:
        Error response dictionary
    """
    return format_agui_error(error, "unknown", "unknown")


def handle_agent_error(error: Exception, request_id: Optional[str] = None):
    """Handle agent error and return appropriate response.
    
    This function is provided for backwards compatibility. New code should
    use install_exception_handlers() instead.
    
    Args:
        error: Exception to handle
        request_id: Optional request ID
        
    Returns:
        JSONResponse with error details
    """
    classified_error = classify_exception(error)
    error_data = create_error_response(classified_error, request_id)
    
    return JSONResponse(
        status_code=getattr(classified_error, "status_code", 500),
        content=error_data,
    )
