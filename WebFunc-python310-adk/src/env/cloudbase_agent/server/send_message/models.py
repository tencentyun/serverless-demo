#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Send Message Data Models.

This module re-exports standard types from ag_ui_protocol for HTTP communication.
All types conform to ag_ui_protocol standards for interoperability.
"""

from ag_ui.core import (
    # Input types
    RunAgentInput,
    Message,
    Tool,
    Context,
    # Event types - Lifecycle
    Event,
    RunStartedEvent,
    RunFinishedEvent,
    RunErrorEvent,
    StepStartedEvent,
    StepFinishedEvent,
    # Event types - Text Messages
    TextMessageStartEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    # Event types - Tool Calls
    ToolCallStartEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
    ToolCallResultEvent,
    # Event types - State Management
    StateSnapshotEvent,
    MessagesSnapshotEvent,
    # Event types - Thinking (Reasoning)
    ThinkingStartEvent,
    ThinkingTextMessageContentEvent,
    ThinkingEndEvent,
    # Event types - Special
    RawEvent,
    CustomEvent,
    # Supporting types
    ToolCall,
    FunctionCall,
    # Message types
    SystemMessage,
    UserMessage,
    ToolMessage,
    AssistantMessage,
)

# Legacy compatibility types (will be removed in future versions)
from typing import Union

ClientMessage = Union[SystemMessage, UserMessage, ToolMessage, AssistantMessage]

# Re-export for convenience
__all__ = [
    # Input types
    "RunAgentInput",
    "Message",
    "Tool",
    "Context",
    # Event base
    "Event",
    # Lifecycle events
    "RunStartedEvent",
    "RunFinishedEvent",
    "RunErrorEvent",
    "StepStartedEvent",
    "StepFinishedEvent",
    # Text message events
    "TextMessageStartEvent",
    "TextMessageContentEvent",
    "TextMessageEndEvent",
    # Tool call events
    "ToolCallStartEvent",
    "ToolCallArgsEvent",
    "ToolCallEndEvent",
    "ToolCallResultEvent",
    # State management events
    "StateSnapshotEvent",
    "MessagesSnapshotEvent",
    # Thinking events
    "ThinkingStartEvent",
    "ThinkingTextMessageContentEvent",
    "ThinkingEndEvent",
    # Special events
    "RawEvent",
    "CustomEvent",
    # Supporting types
    "ToolCall",
    "FunctionCall",
    # Message types
    "SystemMessage",
    "UserMessage",
    "ToolMessage",
    "AssistantMessage",
    "ClientMessage",
]
