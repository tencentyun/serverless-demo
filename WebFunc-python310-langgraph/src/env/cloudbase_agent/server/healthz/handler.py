#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Health Check Handler.

This module provides the handler function for health check endpoints.
"""

import platform
from datetime import datetime
from typing import Any, Callable, Optional

from .models import HealthzConfig


def create_healthz_handler(
    config: Optional[HealthzConfig] = None,
    base_path: str = "",
    agent_name: Optional[str] = None,
) -> Callable[[], dict[str, Any]]:
    """Create a health check handler function.

    This function creates a handler that can be used as a FastAPI route handler
    for health check endpoints. The handler performs basic health checks and
    optionally executes custom health check logic.

    :param config: Health check configuration
    :type config: Optional[HealthzConfig]
    :param base_path: Base path of the service
    :type base_path: str
    :param agent_name: Optional agent name to include in response
    :type agent_name: Optional[str]
    :return: Handler function that returns health check response
    :rtype: Callable[[], dict[str, Any]]

    Example:
        Basic usage::

            handler = create_healthz_handler()

            @app.get("/healthz")
            def healthz():
                return handler()

        With configuration::

            config = HealthzConfig(
                service_name="my-service",
                version="2.0.0"
            )
            handler = create_healthz_handler(config, base_path="/api")

            @app.get("/api/healthz")
            def healthz():
                return handler()

        With custom checks::

            async def check_redis():
                if not redis.ping():
                    raise Exception("Redis not available")
                return {"redis": "connected"}

            config = HealthzConfig(custom_checks=check_redis)
            handler = create_healthz_handler(config)
    """
    # Use default config if not provided
    if config is None:
        config = HealthzConfig()

    def handler() -> dict[str, Any]:
        """Health check handler function.

        This function performs health checks and returns a structured response.
        If custom checks are configured and fail, it returns an unhealthy status.

        :return: Health check response as dictionary
        :rtype: dict[str, Any]
        """
        # Build base response
        response_data = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service": config.service_name,
            "version": config.version,
            "python_version": platform.python_version(),
            "base_path": base_path or "/",
        }

        # Add agent info if enabled
        if config.include_agent_info and agent_name:
            response_data["agent_info"] = {
                "name": agent_name,
                "endpoints": [
                    f"{base_path}/send-message",
                    f"{base_path}/healthz",
                ],
            }

        # Execute custom checks if provided
        if config.custom_checks:
            try:
                custom_results = config.custom_checks()
                if custom_results:
                    response_data["custom"] = custom_results
            except Exception as e:
                # Custom check failed, mark as unhealthy
                response_data["status"] = "unhealthy"
                response_data["error"] = str(e)

        return response_data

    return handler


def create_async_healthz_handler(
    config: Optional[HealthzConfig] = None,
    base_path: str = "",
    agent_name: Optional[str] = None,
) -> Callable[[], dict[str, Any]]:
    """Create an async health check handler function.

    This is the async version of create_healthz_handler, supporting
    async custom health check functions.

    :param config: Health check configuration
    :type config: Optional[HealthzConfig]
    :param base_path: Base path of the service
    :type base_path: str
    :param agent_name: Optional agent name to include in response
    :type agent_name: Optional[str]
    :return: Async handler function that returns health check response
    :rtype: Callable[[], dict[str, Any]]

    Example:
        With async custom checks::

            async def check_database():
                if not await db.is_connected():
                    raise Exception("Database not connected")
                return {"database": "connected"}

            config = HealthzConfig(custom_checks=check_database)
            handler = create_async_healthz_handler(config)

            @app.get("/healthz")
            async def healthz():
                return await handler()
    """
    # Use default config if not provided
    if config is None:
        config = HealthzConfig()

    async def handler() -> dict[str, Any]:
        """Async health check handler function.

        This function performs health checks asynchronously and returns
        a structured response. If custom checks are configured and fail,
        it returns an unhealthy status.

        :return: Health check response as dictionary
        :rtype: dict[str, Any]
        """
        # Build base response
        response_data = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service": config.service_name,
            "version": config.version,
            "python_version": platform.python_version(),
            "base_path": base_path or "/",
        }

        # Add agent info if enabled
        if config.include_agent_info and agent_name:
            response_data["agent_info"] = {
                "name": agent_name,
                "endpoints": [
                    f"{base_path}/send-message",
                    f"{base_path}/healthz",
                ],
            }

        # Execute custom checks if provided
        if config.custom_checks:
            try:
                # Support both sync and async custom checks
                import inspect

                if inspect.iscoroutinefunction(config.custom_checks):
                    custom_results = await config.custom_checks()
                else:
                    custom_results = config.custom_checks()

                if custom_results:
                    response_data["custom"] = custom_results
            except Exception as e:
                # Custom check failed, mark as unhealthy
                response_data["status"] = "unhealthy"
                response_data["error"] = str(e)

        return response_data

    return handler
