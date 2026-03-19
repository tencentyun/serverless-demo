"""
LangChain integration for observability.

This module provides a CallbackHandler that automatically traces LangChain
and LangGraph workflows using OpenTelemetry with OpenInference semantic conventions.
"""

from cloudbase_agent.observability.langchain.callback_handler import CallbackHandler

__all__ = ["CallbackHandler"]
