#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Health Check Data Models.

This module defines the data models for health check configuration and responses.
"""

from typing import Any, Callable, Optional

from pydantic import BaseModel, Field


class HealthzConfig(BaseModel):
    """Configuration for health check endpoint.

    This class allows customization of the health check endpoint behavior,
    including service metadata and custom health checks.

    Attributes:
        service_name: Name of the service (default: "Cloudbase Agent-python-server")
        version: Service version (default: "1.0.0")
        include_agent_info: Whether to include agent information in response
        custom_checks: Optional async function that performs additional health checks
                      Should return a dict of check results or raise an exception if unhealthy

    Example:
        Basic configuration::

            config = HealthzConfig(
                service_name="my-agent-service",
                version="2.0.0"
            )

        With custom checks::

            async def check_database():
                # Check database connection
                if not await db.is_connected():
                    raise Exception("Database not connected")
                return {"database": "connected"}

            config = HealthzConfig(
                service_name="my-service",
                custom_checks=check_database
            )
    """

    service_name: str = Field(default="Cloudbase Agent-python-server", description="Name of the service")

    version: str = Field(default="1.0.0", description="Service version")

    include_agent_info: bool = Field(default=False, description="Whether to include agent information in the response")

    custom_checks: Optional[Callable[[], dict[str, Any]]] = Field(
        default=None, description="Optional function that performs custom health checks"
    )

    class Config:
        arbitrary_types_allowed = True


class HealthzResponse(BaseModel):
    """Health check response model.

    This model defines the structure of health check responses,
    following common health check patterns used in production systems.

    Attributes:
        status: Health status ("healthy" or "unhealthy")
        timestamp: ISO 8601 timestamp of the health check
        service: Service name
        version: Service version
        python_version: Python runtime version
        base_path: Base path of the service
        agent_info: Optional agent information (if enabled)
        custom: Optional custom check results
        error: Optional error message (if unhealthy)

    Example:
        Healthy response::

            {
                "status": "healthy",
                "timestamp": "2024-01-01T00:00:00Z",
                "service": "my-agent-service",
                "version": "1.0.0",
                "python_version": "3.11.0",
                "base_path": "/api"
            }

        Unhealthy response::

            {
                "status": "unhealthy",
                "timestamp": "2024-01-01T00:00:00Z",
                "service": "my-agent-service",
                "version": "1.0.0",
                "python_version": "3.11.0",
                "base_path": "/api",
                "error": "Database connection failed"
            }
    """

    status: str = Field(description="Health status: 'healthy' or 'unhealthy'")

    timestamp: str = Field(description="ISO 8601 timestamp of the health check")

    service: str = Field(description="Service name")

    version: str = Field(description="Service version")

    python_version: str = Field(description="Python runtime version")

    base_path: str = Field(description="Base path of the service")

    agent_info: Optional[dict[str, Any]] = Field(default=None, description="Optional agent information")

    custom: Optional[dict[str, Any]] = Field(default=None, description="Optional custom check results")

    error: Optional[str] = Field(default=None, description="Error message if unhealthy")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2024-01-01T00:00:00.000Z",
                "service": "Cloudbase Agent-python-server",
                "version": "1.0.0",
                "python_version": "3.11.0",
                "base_path": "/",
            }
        }
