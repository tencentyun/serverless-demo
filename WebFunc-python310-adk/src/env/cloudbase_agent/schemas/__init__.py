#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cloudbase Agent type definitions organized by domain.

All type definitions are centralized here to avoid circular dependencies.
"""

from .core import Message, MessageRole, IMemoryEvent
from .streaming import StreamEvent, EventType, BaseEvent
from .tools import ToolCall, ToolResult, ToolFunction, ErrorType
from .server import (
    Tool,
    SystemMessage,
    UserMessage,
    ToolMessage,
    AssistantMessage,
    ClientMessage,
    ResumeMessage,
    SendMessageRequest,
    SendMessageResponse,
)
from .storage import Checkpoint, CheckpointMetadata, CheckpointConfig
from .types import JSON, Headers, Metadata, AgentState

__all__ = [
    # Core types
    "Message",
    "MessageRole",
    "IMemoryEvent",
    # Streaming types
    "StreamEvent",
    "EventType",
    "BaseEvent",
    # Tool types
    "ToolCall",
    "ToolResult",
    "ToolFunction",
    "ErrorType",
    # Server types
    "Tool",
    "SystemMessage",
    "UserMessage",
    "ToolMessage",
    "AssistantMessage",
    "ClientMessage",
    "ResumeMessage",
    "SendMessageRequest",
    "SendMessageResponse",
    # Storage types
    "Checkpoint",
    "CheckpointMetadata",
    "CheckpointConfig",
    # Common types
    "JSON",
    "Headers",
    "Metadata",
    "AgentState",
]
