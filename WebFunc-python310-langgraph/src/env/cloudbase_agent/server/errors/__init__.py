#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cloudbase Agent Server Error Handling.

This module provides a comprehensive error handling system for Cloudbase Agent servers,
following the AG-UI protocol standard.

Key Features:
    - AG-UI compliant error events (RunErrorEvent)
    - Automatic exception handling via install_exception_handlers()
    - Support for both JSON and SSE responses
    - Structured logging with request context
    - Type-safe event models with Pydantic

Design Principles:
    - Complete AG-UI protocol compliance
    - 100% compatibility with TypeScript SDK
    - Type safety (Enum + Pydantic)
    - Catch all exceptions to prevent crashes
    - User-friendly error messages

Example:
    Basic usage::

        from cloudbase_agent.server.errors import ResourceNotFoundError, RateLimitError

        # Raise specific exceptions
        raise ResourceNotFoundError("agent", "gpt-4")
        raise RateLimitError(retry_after=60)

    Method 1 - Manual installation (core adapters)::

        from cloudbase_agent.server.errors import install_exception_handlers
        from fastapi import FastAPI

        app = FastAPI()
        install_exception_handlers(app)  # Required for Method 1

        @app.post("/send-message")
        async def send_message(request: RunAgentInput):
            # Exceptions are automatically handled
            raise ResourceNotFoundError("agent", "gpt-4")

    Method 2/3 - Automatic installation (AgentServiceApp)::

        # No manual installation needed - handlers are automatic
        AgentServiceApp().run(create_agent, port=9000)

Reference:
    - AG-UI Documentation: https://docs.ag-ui.com/introduction
    - TypeScript Implementation: typescript-sdk/packages/agents/src/core/events.ts
"""

from .agui_models import BaseEvent, RunErrorEvent
from .event_types import EventType
from .exceptions import (
    AgentServiceError,
    AuthenticationError,
    InsufficientQuotaError,
    InvalidRequestError,
    RateLimitError,
    ResourceNotFoundError,
    ThirdPartyServiceError,
    UpstreamTimeoutError,
    UpstreamUnavailableError,
)
from .formatters import format_agui_error, format_sse_error, safe_stream_wrapper
from .handlers import install_exception_handlers

__all__ = [
    # Exception classes
    "AgentServiceError",
    "ResourceNotFoundError",
    "InvalidRequestError",
    "AuthenticationError",
    "InsufficientQuotaError",
    "RateLimitError",
    "ThirdPartyServiceError",
    "UpstreamUnavailableError",
    "UpstreamTimeoutError",
    # AG-UI event models
    "EventType",
    "BaseEvent",
    "RunErrorEvent",
    # Formatters
    "format_agui_error",
    "format_sse_error",
    "safe_stream_wrapper",
    # Exception handlers
    "install_exception_handlers",
]
