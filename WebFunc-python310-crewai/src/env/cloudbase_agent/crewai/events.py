"""Bridge events from the crewai event bus to the ag-ui event bus.

This module manages event queues and listeners for CrewAI flows.
"""

import asyncio
from typing import Optional

from ag_ui.core import EventType
from ag_ui.core.events import (
    CustomEvent,
    MessagesSnapshotEvent,
    RunFinishedEvent,
    RunStartedEvent,
    StateSnapshotEvent,
    StepFinishedEvent,
    StepStartedEvent,
    TextMessageChunkEvent,
    ToolCallChunkEvent,
    ToolCallEndEvent,
    ToolCallStartEvent,
)
from crewai.events import (
    FlowFinishedEvent,
    FlowStartedEvent,
    MethodExecutionFinishedEvent,
    MethodExecutionStartedEvent,
)
from crewai.events.base_event_listener import BaseEventListener
from crewai.events.base_events import BaseEvent


# Bridged Event Classes
class BridgedToolCallChunkEvent(BaseEvent, ToolCallChunkEvent):
    """Bridged tool call chunk event."""


class BridgedTextMessageChunkEvent(BaseEvent, TextMessageChunkEvent):
    """Bridged text message chunk event."""


class BridgedCustomEvent(BaseEvent, CustomEvent):
    """Bridged custom event."""


class BridgedStateSnapshotEvent(BaseEvent, StateSnapshotEvent):
    """Bridged state snapshot event."""


class BridgedToolCallEndEvent(BaseEvent, ToolCallEndEvent):
    """Bridged tool call end event."""


class BridgedToolCallStartEvent(BaseEvent, ToolCallStartEvent):
    """Bridged tool call start event."""


# Queue Management
QUEUES = {}
QUEUES_LOCK = asyncio.Lock()


async def create_queue(flow: object) -> asyncio.Queue:
    """Create a queue for a flow."""
    queue_id = id(flow)
    async with QUEUES_LOCK:
        queue = asyncio.Queue()
        QUEUES[queue_id] = queue
        return queue


def get_queue(flow: object) -> Optional[asyncio.Queue]:
    """Get the queue for a flow."""
    queue_id = id(flow)
    # not using a lock here should be fine
    return QUEUES.get(queue_id)


async def delete_queue(flow: object) -> None:
    """Delete the queue for a flow."""
    queue_id = id(flow)
    async with QUEUES_LOCK:
        if queue_id in QUEUES:
            del QUEUES[queue_id]


# Event Listener
class CrewFlowEventListener(BaseEventListener):
    """FastAPI CrewFlow event listener."""

    def setup_listeners(self, crewai_event_bus):
        """Setup listeners for the FastAPI CrewFlow event listener."""
        from .converters import litellm_messages_to_ag_ui_messages

        @crewai_event_bus.on(FlowStartedEvent)
        def _(source, event):  # pylint: disable=unused-argument
            queue = get_queue(source)
            if queue is not None:
                queue.put_nowait(
                    RunStartedEvent(
                        type=EventType.RUN_STARTED,
                        # will be replaced by the correct thread_id/run_id when sending the event
                        thread_id="?",
                        run_id="?",
                    ),
                )

        @crewai_event_bus.on(FlowFinishedEvent)
        def _(source, event):  # pylint: disable=unused-argument
            queue = get_queue(source)
            if queue is not None:
                queue.put_nowait(
                    RunFinishedEvent(
                        type=EventType.RUN_FINISHED,
                        thread_id="?",
                        run_id="?",
                    ),
                )
                queue.put_nowait(None)

        @crewai_event_bus.on(MethodExecutionStartedEvent)
        def _(source, event):
            queue = get_queue(source)
            if queue is not None:
                queue.put_nowait(StepStartedEvent(type=EventType.STEP_STARTED, step_name=event.method_name))

        @crewai_event_bus.on(MethodExecutionFinishedEvent)
        def _(source, event):
            queue = get_queue(source)
            if queue is not None:
                messages = litellm_messages_to_ag_ui_messages(source.state.messages)

                queue.put_nowait(MessagesSnapshotEvent(type=EventType.MESSAGES_SNAPSHOT, messages=messages))
                queue.put_nowait(StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=source.state))
                queue.put_nowait(StepFinishedEvent(type=EventType.STEP_FINISHED, step_name=event.method_name))

        @crewai_event_bus.on(BridgedTextMessageChunkEvent)
        def _(source, event):
            queue = get_queue(source)
            if queue is not None:
                queue.put_nowait(
                    TextMessageChunkEvent(
                        type=EventType.TEXT_MESSAGE_CHUNK,
                        message_id=event.message_id,
                        role=event.role,
                        delta=event.delta,
                    )
                )

        @crewai_event_bus.on(BridgedToolCallChunkEvent)
        def _(source, event):
            queue = get_queue(source)
            if queue is not None:
                queue.put_nowait(
                    ToolCallChunkEvent(
                        type=EventType.TOOL_CALL_CHUNK,
                        tool_call_id=event.tool_call_id,
                        delta=event.delta,
                    )
                )

        @crewai_event_bus.on(BridgedCustomEvent)
        def _(source, event):
            queue = get_queue(source)
            if queue is not None:
                queue.put_nowait(CustomEvent(type=EventType.CUSTOM, name=event.name, value=event.value))

        @crewai_event_bus.on(BridgedStateSnapshotEvent)
        def _(source, event):
            queue = get_queue(source)
            if queue is not None:
                queue.put_nowait(StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=event.snapshot))

        @crewai_event_bus.on(BridgedToolCallEndEvent)
        def _(source, event):
            queue = get_queue(source)
            if queue is not None:
                tool_call_id = event.tool_call_id
                queue.put_nowait(ToolCallEndEvent(type=EventType.TOOL_CALL_END, tool_call_id=tool_call_id))

        @crewai_event_bus.on(BridgedToolCallStartEvent)
        def _(source, event):
            queue = get_queue(source)
            if queue is not None:
                queue.put_nowait(
                    ToolCallStartEvent(
                        type=EventType.TOOL_CALL_START,
                        tool_call_name=event.tool_call_name,
                        tool_call_id=event.tool_call_id,
                    )
                )
