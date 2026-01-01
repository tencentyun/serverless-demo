"""Backwards compatibility module for instructor.client.

This module provides lazy imports to maintain backwards compatibility.
"""

import warnings


def __getattr__(name: str):
    """Lazy import to provide backward compatibility for client imports."""
    warnings.warn(
        f"Importing from 'instructor.client' is deprecated and will be removed in v2.0.0. "
        f"Please update your imports to use 'instructor.core.client.{name}' instead:\n"
        "  from instructor.core.client import Instructor, AsyncInstructor, from_openai, from_litellm",
        DeprecationWarning,
        stacklevel=2,
    )

    from .core import client as core_client

    # Try to get the attribute from the core.client module
    if hasattr(core_client, name):
        return getattr(core_client, name)

    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
