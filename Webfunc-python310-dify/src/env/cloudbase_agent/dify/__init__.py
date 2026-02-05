"""Dify Agent Implementation Package.

This package provides Dify-specific agent implementations for Cloudbase Agent,
including message converters, event bridging, and conversation management utilities.

Available Classes:
    - DifyAgent: Dify agent implementation extending BaseAgent

Available Modules:
    - converters: Message and event conversion utilities
    - agent: Dify agent implementation
"""

from .agent import DifyAgent
from .converters import (
    dify_prepare_inputs,
    dify_events_to_ag_ui_events,
)

__all__ = [
    "DifyAgent",
    "dify_prepare_inputs",
    "dify_events_to_ag_ui_events",
]
