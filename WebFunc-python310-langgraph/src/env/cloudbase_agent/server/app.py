#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cloudbase Agent API Application.

This module provides a convenient FastAPI application wrapper for Cloudbase Agent agents,
offering both quick one-line startup and advanced customization options.
"""

import os
from typing import Any, Callable, Optional, Union, List, TYPE_CHECKING
from uuid import uuid4

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .send_message.models import RunAgentInput

from .errors import install_exception_handlers
from .healthz.handler import create_healthz_handler
from .healthz.models import HealthzConfig
from .openai.models import OpenAIChatCompletionRequest
from .openai.server import create_adapter as create_openai_adapter
from .send_message.server import create_adapter as create_send_message_adapter
from .utils.types import AgentCreator

# Import observability types for type checking only (not at runtime)
if TYPE_CHECKING:
    from cloudbase_agent.observability.server import ObservabilityConfig

# Try to import observability configuration (optional)
try:
    from cloudbase_agent.observability.server import setup_observability
    OBSERVABILITY_AVAILABLE = True
except ImportError:
    OBSERVABILITY_AVAILABLE = False

# Environment variable truthy values
TRUTHY_ENV_VALUES = frozenset(["true", "1", "yes", "on"])


class AgentServiceApp:
    r"""FastAPI Application Wrapper for Cloudbase Agent Agents.

    This class provides a simple and flexible way to deploy Cloudbase Agent agents
    as web services. It supports both quick one-line startup and advanced
    customization through the build() method.

    Key Features:
        - One-line server startup with run()
        - Flexible configuration with method chaining
        - Advanced customization with build()
        - Dual route support (long route with agent_id + short route)
        - Resource cleanup support

    Example:
        Quick start (one line)::

            AgentServiceApp().run(create_agent, port=8000)

        With configuration (method chaining)::

            AgentServiceApp() \
                .set_cors_config(allow_origins=["*"]) \
                .run(create_agent, port=8000, reload=True)

        Advanced usage (build method)::

            app = AgentServiceApp()
            fastapi_app = app.build(create_agent, base_path="/api")

            # Add custom routes
            @fastapi_app.get("/custom")
            def custom_route():
                return {"custom": "data"}

            # Run manually
            import uvicorn
            uvicorn.run(fastapi_app, port=8000)
    """

    def __init__(
        self,
        observability: Optional[Union["ObservabilityConfig", List["ObservabilityConfig"]]] = None,
    ):
        """Initialize the Cloudbase Agent API application.

        :param observability: Optional observability configuration for trace exporters
        :type observability: Optional[Union[ObservabilityConfig, List[ObservabilityConfig]]]
        """
        self._cors_config: Optional[dict[str, Any]] = None
        self._observability: Optional[Union["ObservabilityConfig", List["ObservabilityConfig"]]] = observability

        # Auto-configure observability from environment and parameters
        self._setup_observability()

    def _setup_observability(self) -> None:
        """Setup observability from environment variable and/or parameter configuration.

        Merges AUTO_TRACES_STDOUT environment variable with parameter configs:
        - AUTO_TRACES_STDOUT env adds a console config
        - Parameter configs override/extend env configs

        If the new setup_observability API is available, it will be used.
        Otherwise, falls back to the legacy AUTO_TRACES_STDOUT implementation.
        """
        import logging

        logger = logging.getLogger(__name__)

        # Try to use the new unified setup API if available
        if OBSERVABILITY_AVAILABLE:
            try:
                setup_observability(self._observability)
                return
            except Exception as e:
                logger.warning(f"[Server] Failed to setup observability via new API: {e}")
                # Fall through to legacy implementation

        # Legacy implementation for AUTO_TRACES_STDOUT only
        # Check environment variable
        auto_traces_stdout = os.getenv("AUTO_TRACES_STDOUT", "").lower()
        if auto_traces_stdout not in TRUTHY_ENV_VALUES:
            return

        try:
            # Try to import OpenTelemetry packages
            from opentelemetry import trace
            from opentelemetry.sdk.trace import TracerProvider
            from opentelemetry.sdk.trace.export import ConsoleSpanExporter, BatchSpanProcessor
            from opentelemetry.sdk.resources import Resource

            # Get the global TracerProvider
            provider = trace.get_tracer_provider()

            # Check if it's a real TracerProvider (not ProxyTracerProvider)
            if not hasattr(provider, "add_span_processor"):
                # No TracerProvider configured - create one automatically!
                logger.info(
                    "[Server] No TracerProvider found, creating default TracerProvider for AUTO_TRACES_STDOUT"
                )

                # Create resource with service attributes
                resource = Resource.create({
                    "service.name": os.getenv("OTEL_SERVICE_NAME", "ag-ui-server"),
                    "service.version": "1.0.0",
                })

                # Create and register TracerProvider with BatchSpanProcessor
                provider = TracerProvider(resource=resource)
                trace.set_tracer_provider(provider)

                logger.info("[Server] Created TracerProvider with resource: %s", resource.attributes)

            # Add ConsoleSpanExporter with BatchSpanProcessor
            # BatchSpanProcessor config for optimal serverless performance:
            # - max_queue_size: 2048 (prevent memory issues)
            # - schedule_delay_millis: 1000 (1 second delay)
            # - max_export_batch_size: 100 (export after 100 spans or 1 second)
            processor = BatchSpanProcessor(
                ConsoleSpanExporter(),
                max_queue_size=2048,
                schedule_delay_millis=1000,
                max_export_batch_size=100,
            )
            provider.add_span_processor(processor)

            logger.info(
                "[Server] Auto-configured batch console trace exporter (AUTO_TRACES_STDOUT=%s). "
                "Traces will be printed to stdout in JSON format (batch export).",
                auto_traces_stdout,
            )

        except ImportError as e:
            logger.warning(
                "[Server] AUTO_TRACES_STDOUT is enabled but OpenTelemetry packages not found (%s). "
                "Install observability support with: pip install cloudbase-agent-observability",
                str(e),
            )
        except Exception as e:
            logger.warning(
                "[Server] Failed to auto-configure trace exporter: %s",
                str(e),
            )

    def set_cors_config(
        self,
        allow_origins: Optional[list[str]] = None,
        allow_credentials: bool = True,
        allow_methods: Optional[list[str]] = None,
        allow_headers: Optional[list[str]] = None,
        **kwargs: Any,
    ) -> "AgentServiceApp":
        r"""Set CORS configuration for the application.

        :param allow_origins: List of allowed origins, defaults to ["*"]
        :type allow_origins: Optional[list[str]]
        :param allow_credentials: Whether to allow credentials, defaults to True
        :type allow_credentials: bool
        :param allow_methods: List of allowed HTTP methods, defaults to ["*"]
        :type allow_methods: Optional[list[str]]
        :param allow_headers: List of allowed headers, defaults to ["*"]
        :type allow_headers: Optional[list[str]]
        :param kwargs: Additional CORS configuration options
        :type kwargs: Any
        :return: Self for method chaining
        :rtype: AgentServiceApp

        Example:
            Method chaining::

                AgentServiceApp() \
                    .set_cors_config(
                        allow_origins=["https://example.com"],
                        allow_credentials=True
                    ) \
                    .run(create_agent, port=8000)
        """
        self._cors_config = {
            "allow_origins": allow_origins or ["*"],
            "allow_credentials": allow_credentials,
            "allow_methods": allow_methods or ["*"],
            "allow_headers": allow_headers or ["*"],
            **kwargs,
        }
        return self

    def build(
        self,
        create_agent: AgentCreator,
        base_path: str = "",
        enable_cors: bool = False,
        enable_openai_endpoint: bool = False,
        enable_healthz: bool = True,
        healthz_config: Optional[HealthzConfig] = None,
        request_preprocessor: Optional[Callable[[RunAgentInput, Request], None]] = None,
        **fastapi_kwargs: Any,
    ) -> FastAPI:
        """Build and return a configured FastAPI application.

        This method creates a FastAPI instance with all routes and middleware
        configured. Use this when you need to customize the application before
        running it (e.g., adding custom routes, middleware, or event handlers).

        Routes behavior:
            - If base_path is empty (default):
                * Registers /v1/aibot/bots/{agent_id}/send-message (long route with agent_id)
                * Registers /send-message (short route without agent_id)
            - If base_path is provided:
                * Only registers {base_path}/send-message (custom route without agent_id)

        :param create_agent: Function that creates and returns agent with optional cleanup
        :type create_agent: AgentCreator
        :param base_path: Custom base path for routes. Empty = dual routes, Non-empty = single custom route
        :type base_path: str
        :param enable_cors: Whether to enable CORS middleware
        :type enable_cors: bool
        :param enable_openai_endpoint: Whether to enable OpenAI-compatible /chat/completions endpoint
        :type enable_openai_endpoint: bool
        :param enable_healthz: Whether to enable health check endpoint (default: True)
        :type enable_healthz: bool
        :param healthz_config: Optional health check configuration
        :type healthz_config: Optional[HealthzConfig]
        :param request_preprocessor: Optional function to preprocess request before agent execution.
                                   Called with (request, http_request) and can modify request in-place.
                                   Useful for extracting user_id from JWT and adding to forwarded_props.
        :type request_preprocessor: Optional[Callable[[RunAgentInput, Request], None]]
        :param fastapi_kwargs: Additional keyword arguments to pass to FastAPI constructor
                              (e.g., title, description, version)
        :type fastapi_kwargs: Any
        :return: Configured FastAPI application
        :rtype: FastAPI

        Example:
            Default dual routes::

                app = AgentServiceApp()
                fastapi_app = app.build(create_agent)
                # Registers: /v1/aibot/bots/{agent_id}/send-message
                #            /send-message

            Custom single route::

                app = AgentServiceApp()
                fastapi_app = app.build(create_agent, base_path="/api")
                # Registers: /api/send-message

            With custom health check::

                from cloudbase_agent.server import HealthzConfig

                def check_database():
                    if not db.is_connected():
                        raise Exception("Database not connected")
                    return {"database": "connected"}

                config = HealthzConfig(
                    service_name="my-agent-service",
                    version="2.0.0",
                    custom_checks=check_database
                )

                fastapi_app = AgentServiceApp().build(
                    create_agent,
                    healthz_config=config
                )
        """
        # Create FastAPI instance
        app = FastAPI(**fastapi_kwargs)

        # Install global exception handlers
        install_exception_handlers(app)

        # Apply CORS middleware if enabled
        if enable_cors:
            cors_config = self._cors_config or {
                "allow_origins": ["*"],
                "allow_credentials": True,
                "allow_methods": ["*"],
                "allow_headers": ["*"],
            }
            app.add_middleware(CORSMiddleware, **cors_config)

        # Shared handler for send-message endpoint
        async def send_message_handler(http_context: Request, agent_id: Optional[str] = None):
            """Shared handler for send-message endpoint.
            
            This handler validates incoming requests and ensures proper error handling:
            1. Validates JSON format
            2. Validates required fields (messages)
            3. Auto-generates missing IDs (runId, message.id)
            4. Applies default values for optional fields
            
            Args:
                http_context: HTTP request context for accessing headers, IP, etc.
                agent_id: Optional agent identifier (reserved for future use, currently ignored)
                
            Returns:
                StreamingResponse with AG-UI formatted events
                
            Raises:
                InvalidRequestError: If JSON is invalid or required fields are missing
            """
            from pydantic import ValidationError
            from fastapi.exceptions import RequestValidationError
            from .errors.exceptions import InvalidRequestError
            
            body = None
            
            try:
                # Step 1: Parse JSON and catch parsing errors
                try:
                    body = await http_context.json()
                except Exception as json_error:
                    raise InvalidRequestError(
                        message=f"Invalid JSON format: {str(json_error)}",
                        details={"parse_error": str(json_error)}
                    )
                
                # Step 2: Add default values (matches TypeScript server behavior)
                request_data = {
                    "tools": [],
                    "context": [],
                    "state": {},
                    "forwarded_props": {},
                    **body,
                }

                # Step 3: Auto-generate runId if missing (matches TypeScript behavior)
                run_id = request_data.get("runId")
                if not run_id or (isinstance(run_id, str) and not run_id.strip()):
                    request_data["runId"] = str(uuid4())

                # Step 4: Auto-generate message.id if missing (matches TypeScript behavior)
                if "messages" in request_data and isinstance(request_data["messages"], list):
                    for message in request_data["messages"]:
                        if isinstance(message, dict):
                            message_id = message.get("id")
                            if not message_id or (isinstance(message_id, str) and not message_id.strip()):
                                message["id"] = str(uuid4())

                # Step 5: Validate with Pydantic
                request = RunAgentInput(**request_data)
                
            except ValidationError as e:
                # Convert Pydantic ValidationError to FastAPI RequestValidationError
                # This ensures proper handling by handle_validation_error handler
                raise RequestValidationError(errors=e.errors(), body=body or {})

            return await create_send_message_adapter(
                create_agent,
                request,
                http_context,
                request_preprocessor=request_preprocessor,
            )

        # Shared healthz handler
        healthz_handler = None
        if enable_healthz:
            healthz_handler = create_healthz_handler(
                config=healthz_config,
                base_path=base_path,
            )

        # Shared OpenAI handler
        async def openai_handler(request: OpenAIChatCompletionRequest):
            """Shared handler for OpenAI-compatible endpoint."""
            return await create_openai_adapter(create_agent, request)

        # Register routes based on base_path
        if base_path:
            # Case B: Custom base_path - only register custom route (no agent_id)
            custom_router = APIRouter(prefix=base_path, tags=["Custom"])

            @custom_router.post("/send-message")
            async def custom_send_message(http_context: Request):
                """Custom route for send-message endpoint (no agent_id parameter)."""
                return await send_message_handler(http_context)

            if enable_healthz and healthz_handler:
                custom_router.add_api_route(
                    path="/healthz",
                    endpoint=healthz_handler,
                    methods=["GET"],
                    summary="Health check endpoint"
                )

            if enable_openai_endpoint:
                @custom_router.post("/chat/completions")
                async def custom_chat_completions(request: OpenAIChatCompletionRequest):
                    """OpenAI-compatible chat completions endpoint (custom route)."""
                    return await openai_handler(request)

            app.include_router(custom_router)

        else:
            # Case A: Default - register both long route (with agent_id) and short route

            # Long route: /v1/aibot/bots/{agent_id}/*
            long_router = APIRouter(prefix="/v1/aibot/bots", tags=["Tencent Cloud SCF"])

            @long_router.post("/{agent_id}/send-message")
            async def long_send_message(agent_id: str, http_context: Request):
                """Long route for Tencent Cloud SCF (with agent_id parameter).
                
                Note: agent_id is currently reserved for future use and not validated.
                """
                return await send_message_handler(http_context, agent_id)

            if enable_healthz and healthz_handler:
                long_router.add_api_route(
                    path="/healthz",
                    endpoint=healthz_handler,
                    methods=["GET"],
                    summary="Health check endpoint (long route)"
                )

            if enable_openai_endpoint:
                @long_router.post("/chat/completions")
                async def long_chat_completions(request: OpenAIChatCompletionRequest):
                    """OpenAI-compatible chat completions endpoint (long route)."""
                    return await openai_handler(request)

            # Short route: /*
            short_router = APIRouter(tags=["General"])

            @short_router.post("/send-message")
            async def short_send_message(http_context: Request):
                """Short route for general use (no agent_id parameter)."""
                return await send_message_handler(http_context)

            if enable_healthz and healthz_handler:
                short_router.add_api_route(
                    path="/healthz",
                    endpoint=healthz_handler,
                    methods=["GET"],
                    summary="Health check endpoint (short route)"
                )

            if enable_openai_endpoint:
                @short_router.post("/chat/completions")
                async def short_chat_completions(request: OpenAIChatCompletionRequest):
                    """OpenAI-compatible chat completions endpoint (short route)."""
                    return await openai_handler(request)

            # Register both routers
            app.include_router(long_router)
            app.include_router(short_router)

        return app

    def run(
        self,
        create_agent: AgentCreator,
        base_path: str = "",
        host: str = "0.0.0.0",
        port: int = 9000,
        enable_openai_endpoint: bool = False,
        enable_healthz: bool = True,
        healthz_config: Optional[HealthzConfig] = None,
        request_preprocessor: Optional[Callable[[RunAgentInput, Request], None]] = None,
        **uvicorn_kwargs: Any,
    ) -> None:
        r"""Build and run the FastAPI application (one-line startup).

        This is the simplest way to start an Cloudbase Agent server. It builds the
        FastAPI application and immediately starts the uvicorn server.

        :param create_agent: Function that creates and returns agent with optional cleanup
        :type create_agent: AgentCreator
        :param base_path: Base path for agent routes
        :type base_path: str
        :param host: Server host address
        :type host: str
        :param port: Server port number
        :type port: int
        :param enable_openai_endpoint: Whether to enable OpenAI-compatible /chat/completions endpoint
        :type enable_openai_endpoint: bool
        :param enable_healthz: Whether to enable health check endpoint (default: True)
        :type enable_healthz: bool
        :param healthz_config: Optional health check configuration
        :type healthz_config: Optional[HealthzConfig]
        :param request_preprocessor: Optional function to preprocess request before agent execution.
                                   Called with (request, http_request) and can modify request in-place.
                                   Useful for extracting user_id from JWT and adding to forwarded_props.
        :type request_preprocessor: Optional[Callable[[RunAgentInput, Request], None]]
        :param uvicorn_kwargs: Additional keyword arguments to pass to uvicorn.run
                              Examples: reload=True, workers=4, log_level="debug"
        :type uvicorn_kwargs: Any

        Example:
            Simplest usage::

                AgentServiceApp().run(create_agent, port=8000)

            With JWT authentication::

                from agent import create_jwt_request_preprocessor

                AgentServiceApp().run(
                    create_agent,
                    port=8000,
                    request_preprocessor=create_jwt_request_preprocessor()
                )

            With configuration::

                AgentServiceApp() \
                    .set_cors_config(allow_origins=["https://example.com"]) \
                    .run(create_agent, port=8000, reload=True)

            Development mode::

                AgentServiceApp().run(
                    create_agent,
                    port=8000,
                    reload=True,
                    log_level="debug"
                )

            Production mode::

                AgentServiceApp().run(
                    create_agent,
                    port=8000,
                    workers=4,
                    access_log=False
                )
        """
        # Build the FastAPI application
        app = self.build(
            create_agent,
            base_path,
            enable_openai_endpoint=enable_openai_endpoint,
            enable_healthz=enable_healthz,
            healthz_config=healthz_config,
            request_preprocessor=request_preprocessor,
        )

        # Run the server
        import uvicorn

        uvicorn.run(app, host=host, port=port, **uvicorn_kwargs)
