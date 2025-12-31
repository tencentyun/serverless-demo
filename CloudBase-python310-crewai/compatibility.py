# -*- coding: utf-8 -*-
"""Runtime Compatibility Fixes for SCF Environment.

This module handles compatibility issues between dependencies and the runtime environment.
All fixes are automatically applied when this module is imported.

Compatibility Fixes:
1. Pydantic v2 Parameter Compatibility
"""

from pydantic import BaseModel


def fix_pydantic_v2_compatibility() -> None:
    """Fix Pydantic v2 compatibility issues.
    
    This fix silently removes the unsupported parameter.
    """
    _original_model_dump_json = BaseModel.model_dump_json

    def _patched_model_dump_json(self, *args, **kwargs):
        kwargs.pop("ensure_ascii", None)  # Remove unsupported parameter
        return _original_model_dump_json(self, *args, **kwargs)

    BaseModel.model_dump_json = _patched_model_dump_json


def apply_all_fixes() -> None:
    """Apply all compatibility fixes."""
    fix_pydantic_v2_compatibility()


apply_all_fixes()
