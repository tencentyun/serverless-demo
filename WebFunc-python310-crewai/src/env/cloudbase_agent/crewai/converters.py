"""Message and state converters for CrewAI integration.

This module provides utilities for converting between different message formats,
streaming responses, and preparing inputs for CrewAI flows.
"""

import json
import uuid
from typing import Any, Dict, List, Literal, Mapping, Optional, TypedDict

from ag_ui.core import EventType, Message, RunAgentInput
from crewai.events.event_bus import crewai_event_bus
from crewai.flow.flow import FlowState
from litellm.types.utils import (
    ChatCompletionMessageToolCall,
    Choices,
    ModelResponse,
)
from litellm.types.utils import (
    Function as LiteLLMFunction,
)
from litellm.types.utils import (
    Message as LiteLLMMessage,
)
from pydantic import BaseModel, Field, TypeAdapter

from .context import flow_context
from .events import (
    BridgedCustomEvent,
    BridgedStateSnapshotEvent,
    BridgedTextMessageChunkEvent,
    BridgedToolCallChunkEvent,
    BridgedToolCallEndEvent,
    BridgedToolCallStartEvent,
)
from .utils import yield_control


class CopilotKitProperties(BaseModel):
    """CopilotKit properties."""

    actions: List[Any] = Field(default_factory=list)


class CopilotKitState(FlowState):
    """CopilotKit state."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    messages: List[Any] = Field(default_factory=list)
    copilotkit: CopilotKitProperties = Field(default_factory=CopilotKitProperties)


class PredictStateConfig(TypedDict):
    """Predict State Config."""

    tool_name: str
    tool_argument: Optional[str]


async def copilotkit_predict_state(config: Dict[str, PredictStateConfig]) -> Literal[True]:
    """Stream tool calls as state to CopilotKit.

    To emit a tool call as streaming CrewAI state, pass the destination key in state,
    the tool name and optionally the tool argument. (If you don't pass the argument name,
    all arguments are emitted under the state key.)

    ```python
    from copilotkit.crewai import copilotkit_predict_state

    await copilotkit_predict_state(
        {
            "steps": {
                "tool": "SearchTool",
                "tool_argument": "steps",
            },
        }
    )
    ```

    Parameters
    ----------
    config : Dict[str, CopilotKitPredictStateConfig]
        The configuration to predict the state.

    Returns:
    -------
    Awaitable[bool]
        Always return True.
    """
    flow = flow_context.get(None)

    value = [{"state_key": k, "tool": v["tool_name"], "tool_argument": v["tool_argument"]} for k, v in config.items()]
    crewai_event_bus.emit(flow, BridgedCustomEvent(type=EventType.CUSTOM, name="PredictState", value=value))

    await yield_control()

    return True


async def copilotkit_emit_state(state: Any) -> Literal[True]:
    """Emits intermediate state to CopilotKit.

    Useful if you have a longer running node and you want to update the user with the current state of the node.

    To install the CopilotKit SDK, run:

    ```bash
    pip install copilotkit[crewai]
    ```

    ### Examples

    ```python
    from copilotkit.crewai import copilotkit_emit_state

    for i in range(10):
        await some_long_running_operation(i)
        await copilotkit_emit_state({"progress": i})
    ```

    Parameters
    ----------
    state : Any
        The state to emit (Must be JSON serializable).

    Returns:
    -------
    Awaitable[bool]
        Always return True.

    """
    flow = flow_context.get(None)
    crewai_event_bus.emit(flow, BridgedStateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=state))

    await yield_control()

    return True


async def copilotkit_stream(response):
    """Stream litellm responses token by token to CopilotKit.

    ```python
    response = await copilotkit_stream(
        completion(
            model="openai/gpt-4o",
            messages=messages,
            tools=tools,
            stream=True # this must be set to True for streaming
        )
    )
    ```
    """
    if isinstance(response, ModelResponse):
        return _copilotkit_stream_response(response)
    # Check if response has streaming methods (duck typing)
    if hasattr(response, '__aiter__'):
        return await _copilotkit_stream_custom_stream_wrapper(response)
    raise ValueError("Invalid response type")


async def _copilotkit_stream_custom_stream_wrapper(response: Any):
    """Stream CustomStreamWrapper responses to CopilotKit.
    
    Args:
        response: CustomStreamWrapper or similar streaming response object
    """
    flow = flow_context.get(None)

    message_id: Optional[str] = None
    tool_call_id: str = ""
    content = ""
    created = 0
    model = ""
    system_fingerprint = ""
    finish_reason = None
    all_tool_calls = []

    async for chunk in response:
        if message_id is None:
            message_id = chunk["id"]

        text_content = chunk["choices"][0]["delta"]["content"] or None

        # Stream text messages
        if text_content is not None:
            # add to the current text message
            content += text_content
            crewai_event_bus.emit(
                flow,
                BridgedTextMessageChunkEvent(
                    type=EventType.TEXT_MESSAGE_CHUNK,
                    message_id=message_id,
                    role="assistant",
                    delta=text_content,
                ),
            )
            # yield control to the event loop
            await yield_control()

        # Stream tool calls
        tool_calls = chunk["choices"][0]["delta"]["tool_calls"] or None
        tool_call_id = tool_calls[0].id if tool_calls is not None else None
        tool_call_arguments = tool_calls[0].function["arguments"] if tool_calls is not None else None
        tool_call_name = tool_calls[0].function["name"] if tool_calls is not None else None

        if tool_call_name and not all_tool_calls:
            crewai_event_bus.emit(
                flow,
                BridgedToolCallStartEvent(
                    type=EventType.TOOL_CALL_START,
                    tool_call_name=tool_call_name,
                    tool_call_id=tool_call_id,
                ),
            )
            await yield_control()

        if tool_call_id is not None:
            all_tool_calls.append(
                {
                    "id": tool_call_id,
                    "name": tool_call_name,
                    "arguments": "",
                }
            )

        if tool_call_arguments is not None:
            # add to the current tool call
            all_tool_calls[-1]["arguments"] += tool_call_arguments
            crewai_event_bus.emit(
                flow,
                BridgedToolCallChunkEvent(
                    type=EventType.TOOL_CALL_CHUNK,
                    tool_call_id=all_tool_calls[0]["id"],
                    tool_call_name=tool_call_name,
                    delta=tool_call_arguments,
                ),
            )
            # yield control to the event loop
            await yield_control()

        # Stream finish reason
        finish_reason = chunk["choices"][0]["finish_reason"]
        created = chunk["created"]
        model = chunk["model"]
        system_fingerprint = chunk["system_fingerprint"]

        if finish_reason == "tool_calls":
            crewai_event_bus.emit(
                flow,
                BridgedToolCallEndEvent(
                    type=EventType.TOOL_CALL_END,
                    tool_call_id=all_tool_calls[0]["id"],
                ),
            )
        if finish_reason is not None:
            break

    tool_calls = [
        ChatCompletionMessageToolCall(
            function=LiteLLMFunction(arguments=tool_call["arguments"], name=tool_call["name"]),
            id=tool_call["id"],
            type="function",
        )
        for tool_call in all_tool_calls
    ]
    all_tool_calls = []
    return ModelResponse(
        id=message_id,
        created=created,
        model=model,
        object="chat.completion",
        system_fingerprint=system_fingerprint,
        choices=[
            Choices(
                finish_reason=finish_reason,
                index=0,
                message=LiteLLMMessage(
                    content=content,
                    role="assistant",
                    tool_calls=tool_calls if len(tool_calls) > 0 else None,
                    function_call=None,
                ),
            )
        ],
    )


def _copilotkit_stream_response(response: ModelResponse):
    return response


message_adapter = TypeAdapter(Message)


def litellm_messages_to_ag_ui_messages(messages: List[LiteLLMMessage]) -> List[Message]:
    """Converts a list of LiteLLM messages to a list of ag_ui messages."""
    ag_ui_messages: List[Message] = []
    for message in messages:
        message_dict = message.model_dump() if not isinstance(message, Mapping) else message

        # whitelist the fields we want to keep
        whitelist = ["content", "role", "tool_calls", "id", "name", "tool_call_id"]
        message_dict = {k: v for k, v in message_dict.items() if k in whitelist}
        if "id" not in message_dict:
            message_dict["id"] = str(uuid.uuid4())
        # remove all None values
        message_dict = {k: v for k, v in message_dict.items() if v is not None}

        if "tool_calls" in message_dict:
            tool_call_name = None
            tool_call_id = None
            for tool_call in message_dict["tool_calls"]:
                tool_call["type"] = tool_call.get("type", "function")
                function = tool_call.get("function", {})
                function["name"] = (
                    function["name"] if "name" in function and function["name"] is not None else tool_call_name
                )
                tool_call_name = function.get("name", tool_call_name)
                tool_call["id"] = tool_call["id"] if tool_call.get("id") else tool_call_id
                tool_call_id = tool_call.get("id", tool_call_id)
                tool_call["function"] = function

        ag_ui_message = message_adapter.validate_python(message_dict)
        ag_ui_messages.append(ag_ui_message)

    return ag_ui_messages


async def copilotkit_exit() -> Literal[True]:
    """Exits the current agent after the run completes.

    This function signals to CopilotKit to stop the agent after the run completes.
    It does not immediately stop the agent.

    ### Examples

    ```python
    from copilotkit.crewai import copilotkit_exit

    def my_function():
        await copilotkit_exit()
        return state
    ```

    Returns:
    -------
    Awaitable[bool]
        Always return True.
    """
    flow = flow_context.get(None)

    crewai_event_bus.emit(flow, BridgedCustomEvent(type=EventType.CUSTOM, name="Exit", value=""))

    await yield_control()

    return True


def crewai_prepare_inputs(inputs: RunAgentInput) -> dict:
    """Prepare inputs for CrewAI Flow kickoff.

    Converts Cloudbase Agent RunAgentInput to CrewAI Flow state format.

    Note: The state field names must match the ChatState model definition in agent.py

    Parameters
    ----------
    inputs : RunAgentInput
        The Cloudbase Agent run agent input containing messages, tools, and state.

    Returns:
    -------
    dict
        A dictionary containing the prepared state for CrewAI Flow.
    """
    messages = [message.model_dump() for message in inputs.messages]

    if len(messages) > 0:
        if "role" in messages[0] and messages[0]["role"] == "system":
            messages = messages[1:]

    actions = [
        {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": json.loads(tool.parameters) if isinstance(tool.parameters, str) else tool.parameters,
            },
        }
        for tool in inputs.tools
    ]

    new_state = {
        **inputs.state,
        "id": inputs.thread_id,
        "messages": messages,
        "copilotkit": {"actions": actions},
    }

    return new_state
