"""AG-UI LangGraph Stability Patches.

This module provides critical monkey patches to fix regeneration logic issues
in the ag-ui-langgraph library. The patches address problems with automatic
message regeneration that can cause "Message ID not found in history" errors
and improve overall streaming stability.

Key Fixes Applied:
    - Prevents automatic regeneration on message count mismatch
    - Improves error handling in regenerate stream preparation
    - Adds proper fallback mechanisms for missing checkpoints
    - Enhanced logging for debugging regeneration issues
    - Fixes streaming event handling edge cases

The patches are applied globally and automatically when creating new agents
through the new_agent function. All subsequent LangGraphAgent instances
will use the patched methods.

Security Note:
    These patches modify the ag-ui-langgraph library at runtime. They are
    necessary for stable operation but should be reviewed when updating
    the underlying library versions.
"""

import json
import logging
from typing import Any, AsyncGenerator, List, Optional

from ag_ui.core import (
    CustomEvent,
    EventType,
    MessagesSnapshotEvent,
    RawEvent,
    RunAgentInput,
    RunErrorEvent,
    RunFinishedEvent,
    RunStartedEvent,
    StateSnapshotEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    TextMessageStartEvent,
    ThinkingEndEvent,
    ThinkingTextMessageEndEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
    ToolCallResultEvent,
    ToolCallStartEvent,
)
from ag_ui_langgraph.types import (
    CustomEventNames,
    LangGraphEventTypes,
    MessageInProgress,
    State,
)
from ag_ui_langgraph.utils import (
    agui_messages_to_langchain,
    json_safe_stringify,
    langchain_messages_to_agui,
    resolve_message_content,
    resolve_reasoning_content,
)
from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.runnables import RunnableConfig, ensure_config

logger = logging.getLogger(__name__)

# Store original methods for reference and potential restoration
_original_prepare_stream = None
_original_prepare_regenerate_stream = None


def monkey_patch_ag_ui_langgraph() -> None:
    """Apply stability patches directly to the ag-ui-langgraph library.

    This function replaces problematic methods in LangGraphAgent with patched
    versions that fix regeneration logic issues, improve error handling, and
    enhance streaming stability. The patches are applied globally to the class.

    Patched Methods:
        - prepare_stream: Fixes automatic regeneration logic
        - prepare_regenerate_stream: Improves error handling for missing checkpoints
        - _handle_stream_events: Enhances streaming event processing

    :raises ImportError: When ag_ui_langgraph.agent module cannot be imported
    :raises Exception: When method replacement fails

    Note:
        This function modifies the LangGraphAgent class globally. All subsequent
        instances created after this call will use the patched methods.
        The original methods are stored for potential future restoration.
    """
    global _original_prepare_stream, _original_prepare_regenerate_stream

    try:
        from ag_ui_langgraph.agent import LangGraphAgent

        # Store original methods
        _original_prepare_stream = LangGraphAgent.prepare_stream
        _original_prepare_regenerate_stream = LangGraphAgent.prepare_regenerate_stream
        _original_handle_stream_events = LangGraphAgent._handle_stream_events
        _original_handle_single_event = LangGraphAgent._handle_single_event

        # Apply our patches
        LangGraphAgent.prepare_stream = patched_prepare_stream  # type: ignore[method-assign]
        LangGraphAgent.prepare_regenerate_stream = patched_prepare_regenerate_stream  # type: ignore[method-assign]
        LangGraphAgent._handle_stream_events = patched_handle_stream_events  # type: ignore[method-assign]
        LangGraphAgent._handle_single_event = patched_handle_single_event

        logger.info("🔧 MONKEY PATCH APPLIED: LangGraphAgent methods replaced successfully")

    except ImportError as e:
        logger.error("🔧 MONKEY PATCH FAILED: Could not import ag_ui_langgraph.agent: %s", e)
        raise


async def patched_prepare_stream(
    self: Any, input: RunAgentInput, agent_state: Any, config: RunnableConfig
) -> dict[str, Any]:
    """Fixed version of prepare_stream that prevents automatic regeneration issues.

    This patched method fixes critical issues with automatic message regeneration
    that occurs when the LangGraph state contains more messages than the input.
    It only performs regeneration when explicitly requested via forwarded_props,
    preventing the "Message ID not found in history" error.

    :param self: LangGraphAgent instance
    :param input: Agent run input containing messages and configuration
    :type input: RunAgentInput
    :param agent_state: Current agent state from LangGraph
    :param config: Runnable configuration for the agent
    :type config: RunnableConfig

    :return: Dictionary containing stream, state, config, and optional events
    :rtype: dict

    :raises Exception: When stream preparation fails or agent execution errors occur

    Note:
        This method replaces the original prepare_stream to fix automatic
        regeneration logic. It maintains compatibility with explicit regeneration
        requests while preventing problematic automatic regeneration.
    """
    logger.info("🔧 MONKEY PATCHED prepare_stream called for thread %s", input.thread_id)
    logger.info("🔧 PATCH: input.forwarded_props = %s", input.forwarded_props)

    state_input = input.state or {}
    messages = input.messages or []
    forwarded_props = input.forwarded_props or {}
    thread_id = input.thread_id

    state_input["messages"] = agent_state.values.get("messages", [])
    self.active_run["current_graph_state"] = agent_state.values.copy()

    # Import the utility function

    langchain_messages = agui_messages_to_langchain(messages)

    state = self.langgraph_default_merge_state(state_input, langchain_messages, input)
    self.active_run["current_graph_state"].update(state)
    config["configurable"]["thread_id"] = thread_id

    interrupts = agent_state.tasks[0].interrupts if agent_state.tasks and len(agent_state.tasks) > 0 else []
    has_active_interrupts = len(interrupts) > 0
    resume_input = forwarded_props.get("command", {}).get("resume", None)

    self.active_run["schema_keys"] = self.get_schema_keys(config)

    # FIX: Remove automatic regeneration logic that causes problems
    # The original logic tried to do regeneration when it detected more messages
    # in the LangGraph state than in the received messages, but this causes
    # the error "Message ID not found in history"

    # Instead, let's check if it's really an explicit regeneration
    is_explicit_regeneration = forwarded_props and forwarded_props.get("command", {}).get("resume") is not None

    logger.info("🔧 PATCH: is_explicit_regeneration = %s", is_explicit_regeneration)
    logger.info("🔧 PATCH: agent_state messages count = %s", len(agent_state.values.get("messages", [])))
    logger.info("🔧 PATCH: input messages count = %s", len(langchain_messages))

    if is_explicit_regeneration:
        logger.info("🔧 PATCH: Processing explicit regeneration for thread %s", thread_id)
        # Only do regeneration if explicitly requested
        from langchain_core.messages import SystemMessage

        non_system_messages = [msg for msg in langchain_messages if not isinstance(msg, SystemMessage)]
        if len(agent_state.values.get("messages", [])) > len(non_system_messages):
            # Find the last user message by working backwards from the last message
            last_user_message = None
            for i in range(len(langchain_messages) - 1, -1, -1):
                if isinstance(langchain_messages[i], HumanMessage):
                    last_user_message = langchain_messages[i]
                    break

            if last_user_message:
                logger.info("🔧 PATCH: Starting regenerate_stream for message %s", last_user_message.id)
                result = await patched_prepare_regenerate_stream(
                    self=self, input=input, message_checkpoint=last_user_message, config=config
                )
                if result is not None:
                    return result
    else:
        logger.info("🔧 PATCH: Using normal flow for thread %s (no regeneration)", thread_id)

    events_to_dispatch: List[Any] = []
    if has_active_interrupts and not resume_input:
        from ag_ui.core import CustomEvent, EventType, RunFinishedEvent, RunStartedEvent
        from ag_ui_langgraph.types import LangGraphEventTypes
        from ag_ui_langgraph.utils import json_safe_stringify

        events_to_dispatch.append(
            RunStartedEvent(type=EventType.RUN_STARTED, thread_id=thread_id, run_id=self.active_run["id"])
        )

        for interrupt in interrupts:
            events_to_dispatch.append(
                CustomEvent(
                    type=EventType.CUSTOM,
                    name=LangGraphEventTypes.OnInterrupt.value,
                    value=(
                        json_safe_stringify(interrupt.value)
                        if not isinstance(interrupt.value, str)
                        else interrupt.value
                    ),
                    raw_event=interrupt,
                )
            )

        events_to_dispatch.append(
            RunFinishedEvent(type=EventType.RUN_FINISHED, thread_id=thread_id, run_id=self.active_run["id"])
        )
        return {
            "stream": None,
            "state": None,
            "config": None,
            "events_to_dispatch": events_to_dispatch,
        }

    if self.active_run["mode"] == "continue":
        await self.graph.aupdate_state(config, state, as_node=self.active_run.get("node_name"))

    if resume_input:
        from langgraph.types import Command

        stream_input: Any = Command(resume=resume_input)
    else:
        from ag_ui_langgraph.utils import get_stream_payload_input

        payload_input = get_stream_payload_input(
            mode=self.active_run["mode"],
            state=state,
            schema_keys=self.active_run["schema_keys"],
        )
        stream_input = {**forwarded_props, **payload_input} if payload_input else None

    subgraphs_stream_enabled = input.forwarded_props.get("stream_subgraphs") if input.forwarded_props else False

    kwargs = self.get_stream_kwargs(
        input=stream_input,
        config=config,
        subgraphs=bool(subgraphs_stream_enabled),
        version="v2",
    )

    stream = self.graph.astream_events(**kwargs)

    return {"stream": stream, "state": state, "config": config}


async def patched_prepare_regenerate_stream(
    self: Any, input: RunAgentInput, message_checkpoint: Any, config: RunnableConfig
) -> Optional[dict[str, Any]]:
    """Fixed version of prepare_regenerate_stream with enhanced error handling.

    This patched method provides robust error handling for message regeneration
    by gracefully handling cases where checkpoints or message history cannot
    be found. Instead of raising exceptions, it returns None to allow fallback
    to normal stream preparation, preventing application crashes.

    :param self: LangGraphAgent instance
    :param input: Agent run input containing messages and configuration
    :type input: RunAgentInput
    :param message_checkpoint: The human message to regenerate from
    :type message_checkpoint: HumanMessage
    :param config: Runnable configuration for the agent
    :type config: RunnableConfig

    :return: Dictionary containing stream, state, and config, or None for fallback
    :rtype: dict or None

    :raises ValueError: When unexpected errors occur during checkpoint retrieval
    :raises Exception: When stream preparation fails after successful checkpoint retrieval

    Note:
        Returns None when checkpoint or message history cannot be found,
        signaling the caller to fall back to normal stream preparation.
        This prevents the "Message ID not found in history" crashes.
    """
    # tools = input.tools or []  # Unused variable
    thread_id = input.thread_id

    logger.info(
        "🔧 MONKEY PATCHED prepare_regenerate_stream called for thread %s, message %s", thread_id, message_checkpoint.id
    )

    try:
        time_travel_checkpoint = await self.get_checkpoint_before_message(message_checkpoint.id, thread_id)
        if time_travel_checkpoint is None:
            logger.warning(
                "🔧 PATCH: No checkpoint found for message %s, falling back to normal flow", message_checkpoint.id
            )
            # If unable to find the checkpoint, return None to force a new stream
            return None
    except ValueError as e:
        if "Message ID not found in history" in str(e):
            logger.warning(
                "🔧 PATCH: Message %s not found in history, falling back to normal flow", message_checkpoint.id
            )
            # If unable to find the message in history, return None
            # so the system uses normal flow instead of regeneration
            return None
        else:
            logger.error("🔧 PATCH: Unexpected error in prepare_regenerate_stream: %s", e)
            raise

    logger.info("🔧 PATCH: Found checkpoint for message %s, proceeding with regeneration", message_checkpoint.id)

    fork = await self.graph.aupdate_state(
        time_travel_checkpoint.config,
        time_travel_checkpoint.values,
        as_node=time_travel_checkpoint.next[0] if time_travel_checkpoint.next else "__start__",
    )

    stream_input = self.langgraph_default_merge_state(time_travel_checkpoint.values, [message_checkpoint], input)
    subgraphs_stream_enabled = input.forwarded_props.get("stream_subgraphs") if input.forwarded_props else False

    kwargs = self.get_stream_kwargs(
        input=stream_input,
        fork=fork,
        subgraphs=bool(subgraphs_stream_enabled),
        version="v2",
    )
    stream = self.graph.astream_events(**kwargs)

    return {"stream": stream, "state": time_travel_checkpoint.values, "config": config}


def apply_monkey_patch() -> None:
    """Apply stability patches to fix LangGraph agent issues.

    This is the main entry point for applying all necessary stability patches
    to the ag-ui-langgraph library. It calls monkey_patch_ag_ui_langgraph() to
    replace problematic methods with fixed versions that handle edge cases
    and prevent common runtime errors.

    :raises ImportError: When required libraries are not available
    :raises Exception: When patch application fails

    Example:
        Apply patches before creating agents::

            from cloudbase_agent_py.agents.langgraph.ag_ui_langgraph_patch import apply_monkey_patch

            # Apply patches once at application startup
            apply_monkey_patch()

            # Now create agents safely - all will use patched methods
            agent = new_agent("MyAgent", "Description", graph)

    Note:
        This function should be called once at application startup.
        The patches are applied globally and affect all subsequent
        LangGraphAgent instances.
    """
    monkey_patch_ag_ui_langgraph()


async def patched_handle_stream_events(self: Any, input: RunAgentInput) -> AsyncGenerator[str, None]:
    """Enhanced version of _handle_stream_events with improved error handling.

    This patched method provides enhanced streaming event handling with better
    error recovery, proper state management, and improved event dispatching.
    It handles edge cases in the streaming workflow and ensures proper cleanup.

    :param self: LangGraphAgent instance
    :param input: Agent run input containing messages and configuration
    :type input: RunAgentInput

    :yields: Formatted event strings for client consumption
    :ytype: str

    :raises Exception: When critical streaming errors occur that cannot be recovered

    Note:
        This method handles the complete streaming lifecycle including
        initialization, event processing, interrupts, and cleanup.
    """
    import json
    import uuid

    from ag_ui.core import CustomEvent, EventType
    from ag_ui_langgraph.types import LangGraphEventTypes

    thread_id = input.thread_id or str(uuid.uuid4())
    INITIAL_ACTIVE_RUN = {
        "id": input.run_id,
        "thread_id": thread_id,
        "thinking_process": None,
        "node_name": None,
        "has_function_streaming": False,
    }
    self.active_run = INITIAL_ACTIVE_RUN

    forwarded_props = input.forwarded_props
    node_name_input = forwarded_props.get("node_name", None) if forwarded_props else None

    self.active_run["manually_emitted_state"] = None

    config = ensure_config(self.config.copy() if self.config else None)
    config["configurable"] = {**(config.get("configurable", {})), "thread_id": thread_id}

    agent_state = await self.graph.aget_state(config)
    resume_input = forwarded_props.get("command", {}).get("resume", None)

    if (
        resume_input is None
        and thread_id
        and self.active_run.get("node_name") != "__end__"
        and self.active_run.get("node_name")
    ):
        self.active_run["mode"] = "continue"
    else:
        self.active_run["mode"] = "start"

    prepared_stream_response = await self.prepare_stream(input=input, agent_state=agent_state, config=config)

    yield self._dispatch_event(
        RunStartedEvent(type=EventType.RUN_STARTED, thread_id=thread_id, run_id=self.active_run["id"])
    )
    self.handle_node_change(node_name_input)

    # In case of resume (interrupt), re-start resumed step
    if resume_input and self.active_run.get("node_name"):
        for ev in self.handle_node_change(self.active_run.get("node_name")):
            yield ev

    state = prepared_stream_response["state"]
    stream = prepared_stream_response["stream"]
    config = prepared_stream_response["config"]
    events_to_dispatch = prepared_stream_response.get("events_to_dispatch", None)

    if events_to_dispatch is not None and len(events_to_dispatch) > 0:
        for event in events_to_dispatch:
            yield self._dispatch_event(event)
        return

    should_exit = False
    current_graph_state = state

    async for event in stream:
        # subgraphs_stream_enabled = input.forwarded_props.get("stream_subgraphs") if input.forwarded_props else False
        # is_subgraph_stream = subgraphs_stream_enabled and (
        #     event.get("event", "").startswith("events") or event.get("event", "").startswith("values")
        # )  # Unused variable
        if event["event"] == "error":
            yield self._dispatch_event(
                RunErrorEvent(type=EventType.RUN_ERROR, message=event["data"]["message"], raw_event=event)
            )
            break

        current_node_name = event.get("metadata", {}).get("langgraph_node")
        event_type = event.get("event")
        self.active_run["id"] = event.get("run_id")
        exiting_node = False

        if event_type == "on_chain_end" and isinstance(event.get("data", {}).get("output"), dict):
            current_graph_state.update(event["data"]["output"])
            exiting_node = self.active_run["node_name"] == current_node_name

        should_exit = should_exit or (event_type == "on_custom_event" and event["name"] == "exit")

        if current_node_name and current_node_name != self.active_run.get("node_name"):
            for ev in self.handle_node_change(current_node_name):
                yield ev

        updated_state = self.active_run.get("manually_emitted_state") or current_graph_state
        has_state_diff = updated_state != state
        if exiting_node or (has_state_diff and not self.get_message_in_progress(self.active_run["id"])):
            state = updated_state
            self.active_run["prev_node_name"] = self.active_run["node_name"]
            current_graph_state.update(updated_state)
            yield self._dispatch_event(
                StateSnapshotEvent(
                    type=EventType.STATE_SNAPSHOT,
                    snapshot=self.get_state_snapshot(state),
                    raw_event=event,
                )
            )

        yield self._dispatch_event(RawEvent(type=EventType.RAW, event=event))

        async for single_event in self._handle_single_event(event, state):
            yield single_event

    state = await self.graph.aget_state(config)

    tasks = state.tasks if len(state.tasks) > 0 else None
    interrupts = tasks[0].interrupts if tasks else []

    writes = state.metadata.get("writes", {}) or {}
    node_name = self.active_run["node_name"] if interrupts else next(iter(writes), None)
    next_nodes = state.next or ()
    is_end_node = len(next_nodes) == 0 and not interrupts

    node_name = "__end__" if is_end_node else node_name

    for interrupt in interrupts:
        yield self._dispatch_event(
            CustomEvent(
                type=EventType.CUSTOM,
                name=LangGraphEventTypes.OnInterrupt.value,
                value=(
                    json.dumps(interrupt.value, default=json_safe_stringify)
                    if not isinstance(interrupt.value, str)
                    else interrupt.value
                ),
                raw_event=interrupt.id,
            )
        )

    if self.active_run.get("node_name") != node_name:
        for ev in self.handle_node_change(node_name):
            yield ev

    state_values = state.values if state.values else state
    yield self._dispatch_event(
        StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=self.get_state_snapshot(state_values))
    )

    yield self._dispatch_event(
        MessagesSnapshotEvent(
            type=EventType.MESSAGES_SNAPSHOT,
            messages=langchain_messages_to_agui(state_values.get("messages", [])),
        )
    )

    for ev in self.handle_node_change(None):
        yield ev

    yield self._dispatch_event(
        RunFinishedEvent(type=EventType.RUN_FINISHED, thread_id=thread_id, run_id=self.active_run["id"])
    )
    # Reset active run to how it was before the stream started
    self.active_run = INITIAL_ACTIVE_RUN


async def patched_handle_single_event(self, event: Any, state: State) -> AsyncGenerator[str, None]:
    """Handle a single event from LangGraph and convert it to AG-UI events.

    :param event: The event to handle
    :type event: Any
    :param state: The current state
    :type state: State
    :return: Generator yielding AG-UI event strings
    :rtype: AsyncGenerator[str, None]
    """
    event_type = event.get("event")
    
    if event_type == LangGraphEventTypes.OnChatModelStream:
        should_emit_messages = event["metadata"].get("emit-messages", True)
        should_emit_tool_calls = event["metadata"].get("emit-tool-calls", True)

        if event["data"]["chunk"].response_metadata.get("finish_reason", None):
            return

        current_stream = self.get_message_in_progress(self.active_run["id"])
        has_current_stream = bool(current_stream and current_stream.get("id"))
        tool_call_data = event["data"]["chunk"].tool_call_chunks[0] if event["data"]["chunk"].tool_call_chunks else None
        
        predict_state_metadata = event["metadata"].get("predict_state", [])
        tool_call_used_to_predict_state = False
        if tool_call_data and tool_call_data.get("name") and predict_state_metadata:
            tool_call_used_to_predict_state = any(
                predict_tool.get("tool") == tool_call_data["name"] for predict_tool in predict_state_metadata
            )
        if (
            tool_call_data
            and tool_call_data.get("name")
            and has_current_stream
            and not current_stream.get("tool_call_id")
        ):
            self.messages_in_process[self.active_run["id"]] = {}
            current_stream = None
            has_current_stream = False

        is_tool_call_start_event = not has_current_stream and tool_call_data and tool_call_data.get("name")
        is_tool_call_args_event = (
            has_current_stream and current_stream.get("tool_call_id") and tool_call_data and tool_call_data.get("args")
        )
        is_tool_call_end_event = has_current_stream and current_stream.get("tool_call_id") and not tool_call_data

        if is_tool_call_start_event or is_tool_call_end_event or is_tool_call_args_event:
            self.active_run["has_function_streaming"] = True

        reasoning_data = resolve_reasoning_content(event["data"]["chunk"]) if event["data"]["chunk"] else None
        message_content = (
            resolve_message_content(event["data"]["chunk"].content)
            if event["data"]["chunk"] and event["data"]["chunk"].content
            else None
        )
        is_message_content_event = tool_call_data is None and message_content
        is_message_end_event = (
            has_current_stream and not current_stream.get("tool_call_id") and not is_message_content_event
        )

        if reasoning_data:
            self.handle_thinking_event(reasoning_data)
            return

        if reasoning_data is None and self.active_run.get("thinking_process", None) is not None:
            yield self._dispatch_event(
                ThinkingTextMessageEndEvent(
                    type=EventType.THINKING_TEXT_MESSAGE_END,
                )
            )
            yield self._dispatch_event(
                ThinkingEndEvent(
                    type=EventType.THINKING_END,
                )
            )
            self.active_run["thinking_process"] = None

        if tool_call_used_to_predict_state:
            yield self._dispatch_event(
                CustomEvent(type=EventType.CUSTOM, name="PredictState", value=predict_state_metadata, raw_event=event)
            )

        if is_tool_call_end_event:
            yield self._dispatch_event(
                ToolCallEndEvent(
                    type=EventType.TOOL_CALL_END, tool_call_id=current_stream["tool_call_id"], raw_event=event
                )
            )
            self.messages_in_process[self.active_run["id"]] = {}
            return

        if is_message_end_event:
            yield self._dispatch_event(
                TextMessageEndEvent(type=EventType.TEXT_MESSAGE_END, message_id=current_stream["id"], raw_event=event)
            )
            self.messages_in_process[self.active_run["id"]] = {}
            return

        if is_tool_call_start_event and should_emit_tool_calls:
            yield self._dispatch_event(
                ToolCallStartEvent(
                    type=EventType.TOOL_CALL_START,
                    tool_call_id=tool_call_data["id"],
                    tool_call_name=tool_call_data["name"],
                    parent_message_id=event["data"]["chunk"].id,
                    raw_event=event,
                )
            )
            self.set_message_in_progress(
                self.active_run["id"],
                MessageInProgress(
                    id=event["data"]["chunk"].id,
                    tool_call_id=tool_call_data["id"],
                    tool_call_name=tool_call_data["name"],
                ),
            )
            return

        if is_tool_call_args_event and should_emit_tool_calls:
            yield self._dispatch_event(
                ToolCallArgsEvent(
                    type=EventType.TOOL_CALL_ARGS,
                    tool_call_id=current_stream["tool_call_id"],
                    delta=tool_call_data["args"],
                    raw_event=event,
                )
            )
            return

        if is_message_content_event and should_emit_messages:
            if not bool(current_stream and current_stream.get("id")):
                yield self._dispatch_event(
                    TextMessageStartEvent(
                        type=EventType.TEXT_MESSAGE_START,
                        role="assistant",
                        message_id=event["data"]["chunk"].id,
                        raw_event=event,
                    )
                )
                self.set_message_in_progress(
                    self.active_run["id"],
                    MessageInProgress(id=event["data"]["chunk"].id, tool_call_id=None, tool_call_name=None),
                )
                current_stream = self.get_message_in_progress(self.active_run["id"])

            yield self._dispatch_event(
                TextMessageContentEvent(
                    type=EventType.TEXT_MESSAGE_CONTENT,
                    message_id=current_stream["id"],
                    delta=message_content,
                    raw_event=event,
                )
            )
            return

    elif event_type == LangGraphEventTypes.OnChatModelEnd:
        
        if self.get_message_in_progress(self.active_run["id"]) and self.get_message_in_progress(
            self.active_run["id"]
        ).get("tool_call_id"):
            resolved = self._dispatch_event(
                ToolCallEndEvent(
                    type=EventType.TOOL_CALL_END,
                    tool_call_id=self.get_message_in_progress(self.active_run["id"])["tool_call_id"],
                    raw_event=event,
                )
            )
            if resolved:
                self.messages_in_process[self.active_run["id"]] = {}
            yield resolved
        elif self.get_message_in_progress(self.active_run["id"]) and self.get_message_in_progress(
            self.active_run["id"]
        ).get("id"):
            resolved = self._dispatch_event(
                TextMessageEndEvent(
                    type=EventType.TEXT_MESSAGE_END,
                    message_id=self.get_message_in_progress(self.active_run["id"])["id"],
                    raw_event=event,
                )
            )
            if resolved:
                self.messages_in_process[self.active_run["id"]] = {}
            yield resolved

    elif event_type == LangGraphEventTypes.OnCustomEvent:
        if event["name"] == CustomEventNames.ManuallyEmitMessage:
            yield self._dispatch_event(
                TextMessageStartEvent(
                    type=EventType.TEXT_MESSAGE_START,
                    role="assistant",
                    message_id=event["data"]["message_id"],
                    raw_event=event,
                )
            )
            yield self._dispatch_event(
                TextMessageContentEvent(
                    type=EventType.TEXT_MESSAGE_CONTENT,
                    message_id=event["data"]["message_id"],
                    delta=event["data"]["message"],
                    raw_event=event,
                )
            )
            yield self._dispatch_event(
                TextMessageEndEvent(
                    type=EventType.TEXT_MESSAGE_END, message_id=event["data"]["message_id"], raw_event=event
                )
            )

        elif event["name"] == CustomEventNames.ManuallyEmitToolCall:
            yield self._dispatch_event(
                ToolCallStartEvent(
                    type=EventType.TOOL_CALL_START,
                    tool_call_id=event["data"]["id"],
                    tool_call_name=event["data"]["name"],
                    parent_message_id=event["data"]["id"],
                    raw_event=event,
                )
            )
            yield self._dispatch_event(
                ToolCallArgsEvent(
                    type=EventType.TOOL_CALL_ARGS,
                    tool_call_id=event["data"]["id"],
                    delta=event["data"]["args"],
                    raw_event=event,
                )
            )
            yield self._dispatch_event(
                ToolCallEndEvent(type=EventType.TOOL_CALL_END, tool_call_id=event["data"]["id"], raw_event=event)
            )

        elif event["name"] == CustomEventNames.ManuallyEmitState:
            self.active_run["manually_emitted_state"] = event["data"]
            yield self._dispatch_event(
                StateSnapshotEvent(
                    type=EventType.STATE_SNAPSHOT,
                    snapshot=self.get_state_snapshot(self.active_run["manually_emitted_state"]),
                    raw_event=event,
                )
            )

        yield self._dispatch_event(
            CustomEvent(type=EventType.CUSTOM, name=event["name"], value=event["data"], raw_event=event)
        )

    elif event_type == LangGraphEventTypes.OnToolEnd:
        
        if self.active_run["has_function_streaming"]:
            return
        
        tool_call_output = event["data"]["output"]
        
        yield self._dispatch_event(
            ToolCallStartEvent(
                type=EventType.TOOL_CALL_START,
                tool_call_id=tool_call_output.tool_call_id,
                tool_call_name=tool_call_output.name,
                parent_message_id=tool_call_output.id,
                raw_event=event,
            )
        )
        
        yield self._dispatch_event(
            ToolCallArgsEvent(
                type=EventType.TOOL_CALL_ARGS,
                tool_call_id=tool_call_output.tool_call_id,
                delta=json.dumps(event["data"]["input"]),
                raw_event=event,
            )
        )
        
        yield self._dispatch_event(
            ToolCallEndEvent(type=EventType.TOOL_CALL_END, tool_call_id=tool_call_output.tool_call_id, raw_event=event)
        )
    elif event_type == LangGraphEventTypes.OnChainEnd:
        output = event.get("data", {}).get("output")
        if not isinstance(output, dict):
            return
        messages = output.get("messages")
        if not isinstance(messages, list) or not messages:
            return
        last_message = messages[-1]
        if isinstance(last_message, ToolMessage):
            yield self._dispatch_event(
                ToolCallResultEvent(
                    type=EventType.TOOL_CALL_RESULT,
                    message_id=last_message.id,
                    tool_call_id=last_message.tool_call_id,
                    content=last_message.content,
                    role="tool",
                )
            )
