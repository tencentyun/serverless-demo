"""
Coze integration for observability.

This module provides a CozeEventHandler that automatically traces Coze
bot workflows using OpenTelemetry with OpenInference semantic conventions.
"""

from cloudbase_agent.observability.coze.event_handler import CozeEventHandler

__all__ = ["CozeEventHandler"]
