"""Backwards compatibility module for instructor.dsl.validators.

This module provides lazy imports to avoid circular import issues.
"""


def __getattr__(name: str):
    """Lazy import to avoid circular dependencies."""
    from ..processing import validators as processing_validators
    from .. import validation

    # Try processing.validators first
    if hasattr(processing_validators, name):
        return getattr(processing_validators, name)

    # Then try validation module
    if hasattr(validation, name):
        return getattr(validation, name)

    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
