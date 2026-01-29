#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""FastAPI Exception Handlers for Cloudbase Agent Server.

This module provides global exception handlers that ensure consistent error
responses across all Cloudbase Agent servers. The handlers:

1. Catch all exceptions to prevent service crashes (inspired by AWS Bedrock)
2. Log structured logs with requestId, threadId, runId
3. Return HTTP JSON error responses with INVALID_REQUEST or INTERNAL_ERROR codes
4. Only handle errors BEFORE SSE stream is established

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

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .exceptions import AgentServiceError

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


def _create_error_response(
    error_code: str,
    error_message: str,
    status_code: int,
    request_id: str = "unknown",
) -> JSONResponse:
    """Create HTTP JSON error response.
    
    Returns HTTP JSON format as specified in the documentation:
    {
      "error": {
        "code": "INVALID_REQUEST" | "INTERNAL_ERROR",
        "message": "..."
      },
      "requestId": "..."
    }
    
    Note: This is ONLY used for errors that occur BEFORE SSE stream is established.
          Errors during SSE streaming are handled in the event generator.
    
    Args:
        error_code: Error code (INVALID_REQUEST or INTERNAL_ERROR)
        error_message: Human-readable error message
        status_code: HTTP status code (400 or 500)
        request_id: Request ID for tracking
        
    Returns:
        JSONResponse with HTTP JSON formatted error
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": error_code,
                "message": error_message,
            },
            "requestId": request_id,
        },
    )


def _extract_validation_error_message(error: RequestValidationError) -> str:
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
    - Catch InvalidRequestError and return HTTP 400 with INVALID_REQUEST code
    - Catch Pydantic validation errors and return HTTP 400 with INVALID_REQUEST code
    - Catch all other exceptions and return HTTP 500 with INTERNAL_ERROR code
    - All handlers return HTTP JSON format (never SSE format)
    
    Note: These handlers ONLY handle errors that occur BEFORE SSE stream is established.
          Errors during SSE streaming are handled by the event generator in server.py.
    
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
                raise InvalidRequestError("Invalid parameters")
                
        Method 2/3 (automatic installation)::
        
            # AgentServiceApp automatically installs handlers
            AgentServiceApp().run(create_agent, port=9000)
    """

    @app.exception_handler(AgentServiceError)
    async def handle_agent_service_error(request: Request, exc: AgentServiceError):
        """Handle known Cloudbase Agent errors.
        
        This handler catches all AgentServiceError subclasses and returns
        HTTP JSON responses with appropriate error codes.
        
        Error code mapping:
        - InvalidRequestError → INVALID_REQUEST (HTTP 400)
        - Other AgentServiceError → INTERNAL_ERROR (HTTP 4xx/5xx)
        """
        context = _extract_request_context(request)
        
        # Log warning for client errors (4xx), error for server errors (5xx)
        log_level = "warning" if exc.status_code < 500 else "error"
        _log_error(exc, request, level=log_level)
        
        # Determine error code based on exception type
        from .exceptions import InvalidRequestError
        if isinstance(exc, InvalidRequestError):
            error_code = "INVALID_REQUEST"
        else:
            # Other AgentServiceError types → INTERNAL_ERROR
            error_code = "INTERNAL_ERROR"
        
        return _create_error_response(
            error_code=error_code,
            error_message=exc.message,
            status_code=exc.status_code,
            request_id=context["request_id"],
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        """Handle Pydantic request validation errors.
        
        This handler catches FastAPI's RequestValidationError (raised when
        request body, query params, or path params fail validation) and
        returns HTTP 400 with INVALID_REQUEST code.
        """
        context = _extract_request_context(request)
        
        # Extract user-friendly message
        friendly_message = _extract_validation_error_message(exc)
        
        _log_error(exc, request, level="warning")
        
        return _create_error_response(
            error_code="INVALID_REQUEST",
            error_message=friendly_message,
            status_code=400,
            request_id=context["request_id"],
        )

    @app.exception_handler(Exception)
    async def handle_generic_error(request: Request, exc: Exception):
        """Handle all other exceptions (safety net).
        
        This is the catch-all handler that prevents service crashes by
        catching any unhandled exceptions. It logs the full stack trace
        and returns HTTP 500 with INTERNAL_ERROR code.
        
        Inspired by AWS Bedrock AgentCore's approach to resilient error handling.
        """
        context = _extract_request_context(request)
        
        # Always log full stack trace for unknown errors
        _log_error(exc, request, level="error")
        
        return _create_error_response(
            error_code="INTERNAL_ERROR",
            error_message=str(exc),
            status_code=500,
            request_id=context["request_id"],
        )



