#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cloudbase Agent Server Exception Classes.

This module defines a hierarchy of exceptions for Cloudbase Agent server operations,
following best practices from Google ADK and AWS Bedrock AgentCore.

Exception Hierarchy:
    Exception
    └── AgentServiceError (base)
        ├── ResourceNotFoundError (404)
        ├── InvalidRequestError (400)
        ├── AuthenticationError (401)
        ├── InsufficientQuotaError (403)
        ├── RateLimitError (429)
        └── ThirdPartyServiceError (502/504)
            ├── UpstreamUnavailableError (502)
            └── UpstreamTimeoutError (504)
"""

from typing import Any, Optional


class AgentServiceError(Exception):
    """Base exception for all Cloudbase Agent server errors.

    All custom exceptions should inherit from this class to enable
    consistent error handling and logging.

    Attributes:
        message: Human-readable error description
        status_code: HTTP status code to return
        error_type: Machine-readable error type identifier
        details: Optional additional error context
    """

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_type: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        """Initialize AgentServiceError.

        Args:
            message: Human-readable error description
            status_code: HTTP status code (default: 500)
            error_type: Machine-readable error type (default: snake_case class name)
            details: Optional additional error context
        """
        self.message = message
        self.status_code = status_code
        self.error_type = error_type or self._generate_error_type()
        self.details = details or {}
        super().__init__(self.message)

    def _generate_error_type(self) -> str:
        """Generate error type from class name (e.g., RateLimitError -> rate_limit_error)."""
        import re

        name = self.__class__.__name__
        # Convert CamelCase to snake_case
        snake_case = re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()
        return snake_case


class ResourceNotFoundError(AgentServiceError):
    """Exception raised when a requested resource does not exist.

    This maps to HTTP 404 and should be used for agent IDs, session IDs,
    artifacts, or any other resource that cannot be found.

    Example:
        >>> raise ResourceNotFoundError("agent", "gpt-4")
        >>> raise ResourceNotFoundError("session", "sess_123", details={"user_id": "user_456"})
    """

    def __init__(
        self,
        resource_type: str,
        resource_id: str,
        details: Optional[dict[str, Any]] = None,
    ):
        """Initialize ResourceNotFoundError.

        Args:
            resource_type: Type of resource (e.g., "agent", "session", "artifact")
            resource_id: Identifier of the missing resource
            details: Optional additional context
        """
        message = f"{resource_type.capitalize()} '{resource_id}' not found"
        super().__init__(
            message=message,
            status_code=404,
            details={"resource_type": resource_type, "resource_id": resource_id, **(details or {})},
        )


class InvalidRequestError(AgentServiceError):
    """Exception raised when the client request is malformed or invalid.

    This maps to HTTP 400 and should be used for validation errors,
    missing required fields, or invalid parameter values.

    Example:
        >>> raise InvalidRequestError("Missing required field: messages")
        >>> raise InvalidRequestError("Invalid message format", details={"field": "messages[0]"})
    """

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        """Initialize InvalidRequestError.

        Args:
            message: Description of what is invalid
            details: Optional field-level validation errors
        """
        super().__init__(message=message, status_code=400, details=details)


class AuthenticationError(AgentServiceError):
    """Exception raised when authentication fails.

    This maps to HTTP 401 and should be used for invalid API keys,
    expired tokens, or missing authentication credentials.

    Example:
        >>> raise AuthenticationError("Invalid API key")
        >>> raise AuthenticationError("API key expired", details={"expires_at": "2024-01-01"})
    """

    def __init__(self, message: str = "Authentication failed", details: Optional[dict[str, Any]] = None):
        """Initialize AuthenticationError.

        Args:
            message: Authentication failure reason
            details: Optional additional context (avoid leaking sensitive info)
        """
        super().__init__(message=message, status_code=401, details=details)


class InsufficientQuotaError(AgentServiceError):
    """Exception raised when usage quota is exceeded.

    This maps to HTTP 403 and should be used when the user has exhausted
    their API quota, token limits, or other resource allocations.

    Example:
        >>> raise InsufficientQuotaError()
        >>> raise InsufficientQuotaError(details={"current": 1000, "limit": 1000})
    """

    def __init__(
        self,
        message: str = "Insufficient quota. Please check your plan and billing.",
        details: Optional[dict[str, Any]] = None,
    ):
        """Initialize InsufficientQuotaError.

        Args:
            message: Quota error description
            details: Optional quota details (current usage, limit, etc.)
        """
        super().__init__(message=message, status_code=403, details=details)


class RateLimitError(AgentServiceError):
    """Exception raised when rate limit is exceeded.

    This maps to HTTP 429 and should be used when the client has sent
    too many requests in a given time window.

    The error includes a retry_after value that indicates when the client
    can retry the request (in seconds).

    Example:
        >>> raise RateLimitError()
        >>> raise RateLimitError(retry_after=120, details={"limit": 60, "window": "1m"})
    """

    def __init__(
        self,
        message: str = "Rate limit exceeded. Please retry after some time.",
        retry_after: int = 60,
        details: Optional[dict[str, Any]] = None,
    ):
        """Initialize RateLimitError.

        Args:
            message: Rate limit error description
            retry_after: Seconds until the client can retry
            details: Optional rate limit details (limit, window, remaining, etc.)
        """
        self.retry_after = retry_after
        error_details = {"retry_after": retry_after, **(details or {})}
        super().__init__(message=message, status_code=429, details=error_details)


class ThirdPartyServiceError(AgentServiceError):
    """Base exception for errors from third-party services (LLM APIs, databases, etc.).

    This should not be raised directly. Use specific subclasses:
    - UpstreamUnavailableError (502): Service is down or unreachable
    - UpstreamTimeoutError (504): Request timed out
    """

    def __init__(
        self,
        service_name: str,
        message: str,
        status_code: int = 502,
        original_error: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        """Initialize ThirdPartyServiceError.

        Args:
            service_name: Name of the failing service (e.g., "OpenAI", "LangChain")
            message: Error description
            status_code: HTTP status code (502 or 504)
            original_error: Original error message from third-party service
            details: Optional additional context
        """
        self.service_name = service_name
        self.original_error = original_error
        error_details = {
            "service": service_name,
            **({"original_error": original_error} if original_error else {}),
            **(details or {}),
        }
        super().__init__(message=message, status_code=status_code, details=error_details)


class UpstreamUnavailableError(ThirdPartyServiceError):
    """Exception raised when an upstream service is unavailable.

    This maps to HTTP 502 (Bad Gateway) and should be used when:
    - LLM API (OpenAI, Anthropic, etc.) is down
    - Database connection fails
    - External API returns 5xx errors

    Example:
        >>> raise UpstreamUnavailableError("OpenAI")
        >>> raise UpstreamUnavailableError(
        ...     "OpenAI",
        ...     original_error="Connection refused",
        ...     details={"endpoint": "https://api.openai.com/v1/chat/completions"}
        ... )
    """

    def __init__(
        self,
        service_name: str,
        message: Optional[str] = None,
        original_error: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        """Initialize UpstreamUnavailableError.

        Args:
            service_name: Name of the unavailable service
            message: Optional custom message
            original_error: Original error from the service
            details: Optional additional context
        """
        default_message = f"Upstream service '{service_name}' is unavailable"
        super().__init__(
            service_name=service_name,
            message=message or default_message,
            status_code=502,
            original_error=original_error,
            details=details,
        )


class UpstreamTimeoutError(ThirdPartyServiceError):
    """Exception raised when an upstream service request times out.

    This maps to HTTP 504 (Gateway Timeout) and should be used when:
    - LLM API response takes too long
    - Database query exceeds timeout
    - External API request hangs

    Example:
        >>> raise UpstreamTimeoutError("OpenAI", timeout=30.0)
        >>> raise UpstreamTimeoutError(
        ...     "Database",
        ...     timeout=5.0,
        ...     details={"query": "SELECT * FROM large_table"}
        ... )
    """

    def __init__(
        self,
        service_name: str,
        timeout: float,
        message: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        """Initialize UpstreamTimeoutError.

        Args:
            service_name: Name of the service that timed out
            timeout: Timeout value in seconds
            message: Optional custom message
            details: Optional additional context
        """
        self.timeout = timeout
        default_message = f"Request to '{service_name}' timed out after {timeout}s"
        error_details = {"timeout": timeout, **(details or {})}
        super().__init__(
            service_name=service_name,
            message=message or default_message,
            status_code=504,
            original_error=None,
            details=error_details,
        )
