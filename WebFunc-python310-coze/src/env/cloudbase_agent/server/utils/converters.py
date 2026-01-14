#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Message and Tool Format Converters.

This module provides utility functions for working with ag_ui_protocol types.
Most conversion functions have been removed as ag_ui_protocol provides native types.
"""

import json


def is_valid_json(json_str: str) -> bool:
    """Check if string is valid JSON.

    Args:
        json_str: String to validate

    Returns:
        True if valid JSON, False otherwise
    """
    try:
        json.loads(json_str)
        return True
    except json.JSONDecodeError:
        return False
