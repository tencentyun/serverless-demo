#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cloudbase Agent API Application.

This module provides a convenient FastAPI application wrapper for Cloudbase Agent agents,
offering both quick one-line startup and advanced customization options.
"""

import os
from typing import Any, Callable, Optional
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .send_message.models import RunAgentInput

from .errors import install_exception_handlers
from .healthz.handler import create_healthz_handler
from .healthz.models import HealthzConfig
from .openai.models import OpenAIChatCompletionRequest
from .openai.server import create_adapter as create_openai_adapter
from .send_message.server import create_adapter as create_send_message_adapter
from .utils.types import AgentCreator


class AgentServiceApp:
    r"""FastAPI Application Wrapper for Cloudbase Agent Agents.

    This class provides a simple and flexible way to deploy Cloudbase Agent agents
    as web services. It supports both quick one-line startup and advanced
    customization through the build() method.

    Key Features:
        - One-line server startup with run()
        - Flexible configuration with method chaining
        - Advanced customization with build()
        - Automatic environment detection (e.g., Tencent Cloud SCF)
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

    def __init__(self, auto_detect_env: bool = True):
        """Initialize the Cloudbase Agent API application.

        :param auto_detect_env: Automatically detect runtime environment
                               (e.g., Tencent Cloud SCF) and configure accordingly
        :type auto_detect_env: bool
        """
        self._cors_config: Optional[dict[str, Any]] = None
        self._base_path: str = ""

        # Auto-detect environment if enabled
        if auto_detect_env:
            self._detect_environment()

    def _detect_environment(self) -> None:
        """Detect runtime environment and apply environment-specific configuration."""
        # Tencent Cloud SCF
        if os.getenv("TENCENTCLOUD_RUNENV") == "SCF":
            self._base_path = "/v1/aibot/bots"

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

        :param create_agent: Function that creates and returns agent with optional cleanup
        :type create_agent: AgentCreator
        :param base_path: Base path for agent routes (overrides environment-detected path)
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
            Build and customize::

                app = AgentServiceApp()
                fastapi_app = app.build(
                    create_agent,
                    base_path="/api",
                    title="My Agent API",
                    version="1.0.0"
                )

                # Add custom routes
                @fastapi_app.get("/custom")
                def custom_route():
                    return {"custom": "data"}

                # Add custom middleware
                @fastapi_app.middleware("http")
                async def add_custom_header(request, call_next):
                    response = await call_next(request)
                    response.headers["X-Custom-Header"] = "value"
                    return response

                # Run the application
                import uvicorn
                uvicorn.run(fastapi_app, host="0.0.0.0", port=8000)

            With custom health check::

                from cloudbase_agent.server import HealthzConfig

                def check_database():
                    # Perform database health check
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

            Disable health check::

                fastapi_app = AgentServiceApp().build(
                    create_agent,
                    enable_healthz=False  # No /healthz endpoint
                )
        """
        # Create FastAPI instance
        app = FastAPI(**fastapi_kwargs)

        # Install global exception handlers (automatic for Method 2/3)
        # This ensures all exceptions are caught and formatted as AG-UI error events
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

        # Determine final path (environment base path + user base path)
        final_path = self._base_path + base_path

        # Register send_message endpoint
        @app.post(f"{final_path}/{{agent_id}}/send-message")
        async def send_message_endpoint(
            agent_id: str, 
            http_context: Request,  # HTTP request context (for headers, IP, etc.)
        ):
            """Main agent endpoint for processing messages with Cloudbase Agent native format.
            
            Args:
                agent_id: Agent identifier (reserved for future use)
                http_context: HTTP request context for accessing headers, IP, etc.
            """
            # Parse request body and provide default values (matches TypeScript server behavior)
            body = await http_context.json()
            request_data = {
                "tools": [],
                "context": [],
                "state": {},
                "forwarded_props": {},
                **body,
            }
            
            # Auto-generate runId if missing (matches TypeScript behavior)
            # Pydantic will automatically convert camelCase (runId) to snake_case (run_id) via populate_by_name
            run_id = request_data.get("runId")
            if not run_id or (isinstance(run_id, str) and not run_id.strip()):
                request_data["runId"] = str(uuid4())
            
            # Auto-generate message.id if missing (matches TypeScript behavior)
            # TypeScript server generates UUID for each message if id is not provided
            if "messages" in request_data and isinstance(request_data["messages"], list):
                for message in request_data["messages"]:
                    if isinstance(message, dict):
                        # Generate id if missing, None, or empty string
                        message_id = message.get("id")
                        if not message_id or (isinstance(message_id, str) and not message_id.strip()):
                            message["id"] = str(uuid4())
            
            # Parse as RunAgentInput
            request = RunAgentInput(**request_data)
            
            return await create_send_message_adapter(
                create_agent, 
                request, 
                http_context,
                request_preprocessor=request_preprocessor,
            )

        # Register health check endpoint if enabled
        if enable_healthz:
            healthz_handler = create_healthz_handler(
                config=healthz_config,
                base_path=final_path,
            )

            @app.get(f"{final_path}/healthz")
            def healthz_endpoint() -> dict[str, Any]:
                """Health check endpoint.

                Returns server status and metadata for monitoring and diagnostics.
                This endpoint is automatically added to all Cloudbase Agent servers and can
                be used by load balancers, monitoring systems, and orchestration
                platforms to verify service health.

                The response includes:
                - Service status (healthy/unhealthy)
                - Timestamp of the check
                - Service name and version
                - Python runtime version
                - Base path configuration
                - Optional custom check results

                Returns:
                    dict: Health check response with status and metadata

                Example Response:
                    {
                        "status": "healthy",
                        "timestamp": "2024-01-01T00:00:00.000Z",
                        "service": "Cloudbase Agent-python-server",
                        "version": "1.0.0",
                        "python_version": "3.11.0",
                        "base_path": "/"
                    }
                """
                return healthz_handler()

        # Register OpenAI-compatible endpoint if enabled
        if enable_openai_endpoint:

            @app.post(f"{final_path}/chat/completions")
            async def chat_completions_endpoint(request: OpenAIChatCompletionRequest):
                """OpenAI-compatible chat completions endpoint.

                This endpoint provides compatibility with OpenAI's chat completion API,
                allowing Cloudbase Agent agents to be used as drop-in replacements for OpenAI models.
                """
                return await create_openai_adapter(create_agent, request)

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
