"""CrewAI Agent Implementation Package.

This package provides CrewAI-specific agent implementations for Cloudbase Agent,
including message converters, event bridging, and flow management utilities.

Available Classes:
    - CrewAIAgent: CrewAI agent implementation extending BaseAgent

Available Modules:
    - converters: Message and state conversion utilities
    - events: Event bridging and queue management
    - context: Flow context management
    - utils: Helper utilities
"""

from .agent import CrewAIAgent
from .converters import (
    CopilotKitProperties,
    CopilotKitState,
    copilotkit_emit_state,
    copilotkit_exit,
    copilotkit_predict_state,
    copilotkit_stream,
    crewai_prepare_inputs,
    litellm_messages_to_ag_ui_messages,
)
from .events import (
    BridgedCustomEvent,
    BridgedStateSnapshotEvent,
    BridgedTextMessageChunkEvent,
    BridgedToolCallChunkEvent,
    BridgedToolCallEndEvent,
    BridgedToolCallStartEvent,
    CrewFlowEventListener,
    create_queue,
    delete_queue,
    get_queue,
)

__all__ = [
    "CrewAIAgent",
    # Converters
    "crewai_prepare_inputs",
    "litellm_messages_to_ag_ui_messages",
    "copilotkit_stream",
    "copilotkit_emit_state",
    "copilotkit_predict_state",
    "copilotkit_exit",
    "CopilotKitState",
    "CopilotKitProperties",
    # Events
    "create_queue",
    "get_queue",
    "delete_queue",
    "CrewFlowEventListener",
    "BridgedTextMessageChunkEvent",
    "BridgedToolCallChunkEvent",
    "BridgedToolCallEndEvent",
    "BridgedToolCallStartEvent",
    "BridgedCustomEvent",
    "BridgedStateSnapshotEvent",
]
