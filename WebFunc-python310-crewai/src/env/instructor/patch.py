"""Backwards compatibility module for instructor.patch.

This module provides lazy imports to maintain backwards compatibility.
"""

import warnings


def __getattr__(name: str):
    """Lazy import to provide backward compatibility for patch imports."""
    warnings.warn(
        f"Importing from 'instructor.patch' is deprecated and will be removed in v2.0.0. "
        f"Please update your imports to use 'instructor.core.patch.{name}' instead:\n"
        "  from instructor.core.patch import patch, apatch",
        DeprecationWarning,
        stacklevel=2,
    )

    from .core import patch as core_patch

    # Try to get the attribute from the core.patch module
    if hasattr(core_patch, name):
        return getattr(core_patch, name)

    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
