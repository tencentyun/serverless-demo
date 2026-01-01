"""Backwards compatibility module for instructor.multimodal.

This module provides lazy imports to maintain backwards compatibility.
"""

import warnings


def __getattr__(name: str):
    """Lazy import to provide backward compatibility for multimodal imports."""
    # Issue deprecation warning when accessing multimodal imports
    warnings.warn(
        "Importing from 'instructor.multimodal' is deprecated and will be removed in v2.0.0. "
        f"Please update your imports to use 'instructor.processing.multimodal.{name}' instead:\n"
        "  from instructor.processing.multimodal import PDF, Image, Audio",
        DeprecationWarning,
        stacklevel=2,
    )

    from .processing import multimodal as processing_multimodal

    # Try to get the attribute from the processing.multimodal module
    if hasattr(processing_multimodal, name):
        return getattr(processing_multimodal, name)

    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
