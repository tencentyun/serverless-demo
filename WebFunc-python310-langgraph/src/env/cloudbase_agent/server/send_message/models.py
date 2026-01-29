#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Send Message Data Models.

This module re-exports standard types from ag_ui_protocol for HTTP communication.
All types conform to ag_ui_protocol standards for interoperability.
"""

from typing import Optional, Union

from ag_ui.core import (
    # Input types
    RunAgentInput as BaseRunAgentInput,
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


class RunAgentInput(BaseRunAgentInput):
    """Extended RunAgentInput with optional thread_id for HTTP requests.
    
    This class extends the base RunAgentInput to allow thread_id to be optional,
    enabling clients to omit thread_id (which will create a new conversation).
    The thread_id field can be None or empty string, both will be treated as
    "create new conversation" by adapters like Coze.
    """
    thread_id: Optional[str] = None

# Legacy compatibility types (will be removed in future versions)
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
