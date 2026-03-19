"""
LangChain CallbackHandler for Observability.

Converts LangChain callback events into observations with OpenInference semantics.
Based on the Langfuse LangChain integration.
"""

import datetime
import logging
from typing import Any, Dict, List, Optional, Set, Union, cast
from uuid import UUID

from opentelemetry import context, trace
from opentelemetry.context import _RUNTIME_CONTEXT
from opentelemetry.trace import Status, StatusCode

from cloudbase_agent.observability import start_observation
from cloudbase_agent.observability.types import ObservationType, ObservationLevel

logger = logging.getLogger(__name__)

try:
    from langchain_core.agents import AgentAction, AgentFinish
    from langchain_core.callbacks import (
        BaseCallbackHandler as LangchainBaseCallbackHandler,
    )
    from langchain_core.documents import Document
    from langchain_core.messages import (
        AIMessage,
        BaseMessage,
        ChatMessage,
        FunctionMessage,
        HumanMessage,
        SystemMessage,
        ToolMessage,
    )
    from langchain_core.outputs import ChatGeneration, LLMResult
except ImportError:
    raise ModuleNotFoundError(
        "Please install langchain-core to use the langchain integration: "
        "'pip install langchain-core'"
    )

# Control flow exceptions from LangGraph
CONTROL_FLOW_EXCEPTION_TYPES: List[type] = []
try:
    from langgraph.errors import GraphBubbleUp
    CONTROL_FLOW_EXCEPTION_TYPES.append(GraphBubbleUp)
except ImportError:
    pass

# Reserved metadata keys that should be stripped from metadata
RESERVED_METADATA_KEYS = {
    "promptInfo",
    "userId",
    "sessionId",
    "tags",
    "version",
    "metadata",
}


def _serialize(obj: Any) -> Optional[str]:
    """Safely serialize an object to JSON string.

    Args:
        obj: Object to serialize.

    Returns:
        JSON string or None if null/undefined.
    """
    if obj is None:
        return None
    if isinstance(obj, str):
        return obj
    try:
        import json

        return json.dumps(obj, default=str)
    except Exception:
        return "<failed to serialize>"


def _convert_message_to_dict(message: BaseMessage) -> Dict[str, Any]:
    """Convert a LangChain message to a dictionary.

    Args:
        message: The LangChain message to convert.

    Returns:
        Dictionary representation of the message.
    """
    if isinstance(message, HumanMessage):
        message_dict: Dict[str, Any] = {"role": "user", "content": message.content}
    elif isinstance(message, AIMessage):
        message_dict = {"role": "assistant", "content": message.content}

        if hasattr(message, "tool_calls") and message.tool_calls:
            message_dict["tool_calls"] = message.tool_calls

    elif isinstance(message, SystemMessage):
        message_dict = {"role": "system", "content": message.content}
    elif isinstance(message, ToolMessage):
        message_dict = {
            "role": "tool",
            "content": message.content,
            "tool_call_id": message.tool_call_id,
        }
    elif isinstance(message, FunctionMessage):
        message_dict = {"role": "function", "content": message.content}
    elif isinstance(message, ChatMessage):
        message_dict = {"role": message.role, "content": message.content}
    else:
        raise ValueError(f"Got unknown message type: {type(message)}")

    if "name" in message.additional_kwargs:
        message_dict["name"] = message.additional_kwargs["name"]

    if message.additional_kwargs:
        message_dict["additional_kwargs"] = message.additional_kwargs

    return message_dict


def _get_run_name(serialized: Optional[Dict[str, Any]], **kwargs: Any) -> str:
    """Get the name of a serialized LangChain runnable.

    Args:
        serialized: Serialized runnable data.
        **kwargs: Additional keyword arguments.

    Returns:
        The name of the runnable.
    """
    if "name" in kwargs and kwargs["name"] is not None:
        return str(kwargs["name"])

    if serialized is None:
        return "<unknown>"

    try:
        return str(serialized["name"])
    except (KeyError, TypeError):
        pass

    try:
        return str(serialized["id"][-1])
    except (KeyError, TypeError):
        pass

    return "<unknown>"


def _extract_model_name(
    serialized: Optional[Dict[str, Any]], metadata: Optional[Dict[str, Any]], kwargs: Dict[str, Any]
) -> Optional[str]:
    """Extract the model name from various sources.

    Args:
        serialized: Serialized component data.
        metadata: Optional metadata.
        kwargs: Additional keyword arguments.

    Returns:
        The model name or None.
    """
    # Try metadata first
    if metadata and "ls_model_name" in metadata:
        return str(metadata["ls_model_name"])

    # Try invocation params
    invocation_params = kwargs.get("invocation_params", {})
    if "model" in invocation_params:
        return str(invocation_params["model"])
    if "model_name" in invocation_params:
        return str(invocation_params["model_name"])

    # Try serialized id
    if serialized and "id" in serialized:
        for part in serialized["id"]:
            if isinstance(part, str) and any(
                model in part.lower() for model in ["gpt", "claude", "llama", "mistral"]
            ):
                return part

    return None


def _extract_tool_attributes(
    serialized: Optional[Dict[str, Any]], input_str: str
) -> Dict[str, Any]:
    """Extract tool attributes from serialized tool data for OpenInference semantics.

    Args:
        serialized: Serialized tool data from LangChain.
        input_str: Tool input string (may contain JSON arguments).

    Returns:
        Dictionary with tool_name, tool_description, tool_parameters if available.
    """
    attributes: Dict[str, Any] = {}

    if not serialized:
        return attributes

    try:
        # Extract tool name from serialized id or name
        if "name" in serialized:
            attributes["tool_name"] = str(serialized["name"])
        elif "id" in serialized and isinstance(serialized["id"], list):
            # Use last part of id as name (e.g., ["langchain", "tools", "ToolName"])
            attributes["tool_name"] = str(serialized["id"][-1])

        # Extract description if available
        if "description" in serialized:
            attributes["tool_description"] = str(serialized["description"])

        # Try to parse input_str as JSON for tool parameters
        if input_str:
            try:
                import json

                parsed_input = json.loads(input_str)
                if isinstance(parsed_input, dict):
                    attributes["tool_parameters"] = parsed_input
            except (json.JSONDecodeError, ValueError):
                # input_str is not valid JSON, store as raw input
                pass

        # Also check for args_schema in serialized (structured tools)
        if "args_schema" in serialized:
            try:
                args_schema = serialized["args_schema"]
                if isinstance(args_schema, dict) and "properties" in args_schema:
                    if "tool_parameters" not in attributes:
                        attributes["tool_parameters"] = args_schema
            except Exception:
                pass

    except Exception:
        # Silent fail - don't block business logic for observability
        pass

    return attributes


def _extract_system_from_metadata(
    metadata: Optional[Dict[str, Any]], kwargs: Dict[str, Any]
) -> Optional[str]:
    """Extract the AI system/vendor identifier from various sources.

    Args:
        metadata: Optional metadata.
        kwargs: Additional keyword arguments.

    Returns:
        System identifier (e.g., 'openai', 'anthropic') or None.
    """
    # Try metadata first
    if metadata:
        if "ls_provider" in metadata:
            return str(metadata["ls_provider"])
        if "system" in metadata:
            return str(metadata["system"])

    # Try to infer from model name in kwargs
    invocation_params = kwargs.get("invocation_params", {})
    model = invocation_params.get("model") or invocation_params.get("model_name", "")
    if model:
        model_lower = str(model).lower()
        if "gpt" in model_lower or "openai" in model_lower:
            return "openai"
        elif "claude" in model_lower or "anthropic" in model_lower:
            return "anthropic"
        elif "llama" in model_lower:
            return "meta"
        elif "mistral" in model_lower:
            return "mistral"

    return None


def _extract_provider_from_metadata(
    metadata: Optional[Dict[str, Any]], kwargs: Dict[str, Any]
) -> Optional[str]:
    """Extract the hosting provider from various sources.

    Args:
        metadata: Optional metadata.
        kwargs: Additional keyword arguments.

    Returns:
        Provider identifier (e.g., 'openai', 'azure', 'aws') or None.
    """
    # Try metadata first
    if metadata:
        if "ls_provider" in metadata:
            return str(metadata["ls_provider"])
        if "provider" in metadata:
            return str(metadata["provider"])

    # Try to infer from invocation params
    invocation_params = kwargs.get("invocation_params", {})
    model = invocation_params.get("model") or invocation_params.get("model_name", "")
    if model:
        model_lower = str(model).lower()
        if "azure" in model_lower:
            return "azure"
        elif "aws" in model_lower or "bedrock" in model_lower:
            return "aws"

    return None


def _parse_model_parameters(kwargs: Dict[str, Any]) -> Dict[str, Any]:
    """Parse model parameters from invocation params.

    Args:
        kwargs: Callback keyword arguments.

    Returns:
        Dictionary of model parameters.
    """
    if "invocation_params" not in kwargs:
        return {}

    invocation_params = kwargs["invocation_params"]

    return {
        key: value
        for key, value in {
            "temperature": invocation_params.get("temperature"),
            "max_tokens": invocation_params.get("max_tokens"),
            "max_completion_tokens": invocation_params.get("max_completion_tokens"),
            "top_p": invocation_params.get("top_p"),
            "frequency_penalty": invocation_params.get("frequency_penalty"),
            "presence_penalty": invocation_params.get("presence_penalty"),
        }.items()
        if value is not None
    }


def _parse_usage(response: LLMResult) -> Optional[Dict[str, int]]:
    """Parse token usage from LLM response.

    Args:
        response: The LLMResult from LangChain.

    Returns:
        Dictionary with usage metrics including:
        - input: Prompt tokens
        - output: Completion tokens
        - total: Total tokens
        - input_tokens_details: Optional detailed breakdown (e.g., cache tokens)
        - output_tokens_details: Optional detailed breakdown (e.g., reasoning tokens)
    """
    llm_usage = None

    # Check llm_output
    if response.llm_output:
        for key in ["token_usage", "usage"]:
            if key in response.llm_output and response.llm_output[key]:
                usage = response.llm_output[key]
                if isinstance(usage, dict):
                    llm_usage = {
                        "input": usage.get("prompt_tokens", usage.get("input")),
                        "output": usage.get("completion_tokens", usage.get("output")),
                        "total": usage.get("total_tokens", usage.get("total")),
                    }
                    # Parse token details if available
                    llm_usage.update(_parse_token_details(usage))
                break

    # Check generation_info in generations
    if not llm_usage and hasattr(response, "generations"):
        for generation in response.generations:
            for generation_chunk in generation:
                if hasattr(generation_chunk, "generation_info") and generation_chunk.generation_info:
                    if "usage_metadata" in generation_chunk.generation_info:
                        usage = generation_chunk.generation_info["usage_metadata"]
                        llm_usage = {
                            "input": usage.get("prompt_tokens", usage.get("input")),
                            "output": usage.get("completion_tokens", usage.get("output")),
                            "total": usage.get("total_tokens", usage.get("total")),
                        }
                        llm_usage.update(_parse_token_details(usage))
                        break

                # Check response_metadata on message
                message_chunk = getattr(generation_chunk, "message", None)
                if message_chunk:
                    response_metadata = getattr(message_chunk, "response_metadata", {})
                    if isinstance(response_metadata, dict):
                        usage = response_metadata.get("usage")
                        if usage:
                            llm_usage = {
                                "input": usage.get("prompt_tokens", usage.get("input")),
                                "output": usage.get("completion_tokens", usage.get("output")),
                                "total": usage.get("total_tokens", usage.get("total")),
                            }
                            llm_usage.update(_parse_token_details(usage))

            if llm_usage:
                break

    return llm_usage


def _parse_token_details(usage: Dict[str, Any]) -> Dict[str, Any]:
    """Parse token details from usage metadata.

    Handles various provider-specific token detail formats:
    - OpenAI: reasoning_tokens, cache_read_prompt_tokens, cache_write_prompt_tokens
    - Anthropic: cache_read_input_tokens, cache_creation_input_tokens
    - Vertex AI: cached_content_tokens

    Args:
        usage: Usage dictionary from LLM response.

    Returns:
        Dictionary with input_tokens_details and/or output_tokens_details.
    """
    token_details: Dict[str, Any] = {}

    # Input token details
    input_details: Dict[str, int] = {}
    for key in ["cache_read_prompt_tokens", "cache_write_prompt_tokens", "cached_content_tokens"]:
        if key in usage:
            # Map to standard names
            if key == "cache_read_prompt_tokens":
                input_details["cache"] = input_details.get("cache", 0) + usage[key]
            elif key == "cache_write_prompt_tokens":
                input_details["cache_creation"] = input_details.get("cache_creation", 0) + usage[key]
            elif key == "cached_content_tokens":
                input_details["cache"] = input_details.get("cache", 0) + usage[key]

    # Anthropic-specific cache tokens
    for key in ["cache_read_input_tokens", "cache_creation_input_tokens"]:
        if key in usage:
            if "read" in key:
                input_details["cache"] = input_details.get("cache", 0) + usage[key]
            else:
                input_details["cache_creation"] = input_details.get("cache_creation", 0) + usage[key]

    if input_details:
        token_details["input_tokens_details"] = input_details

    # Output token details
    output_details: Dict[str, int] = {}
    for key in ["reasoning_tokens"]:
        if key in usage and isinstance(usage[key], int):
            output_details["reasoning"] = usage[key]

    if output_details:
        token_details["output_tokens_details"] = output_details

    return token_details


def _get_observation_type_from_serialized(
    serialized: Optional[Dict[str, Any]], callback_type: str, **kwargs: Any
) -> str:
    """Determine observation type from LangChain component.

    Args:
        serialized: LangChain's serialized component dict.
        callback_type: The type of callback.
        **kwargs: Additional keyword arguments.

    Returns:
        The appropriate observation type string.
    """
    if callback_type == "tool":
        return "tool"
    elif callback_type == "retriever":
        return "retriever"
    elif callback_type == "llm":
        return "llm"
    elif callback_type == "chain":
        # Detect if it's an agent
        if serialized and "id" in serialized:
            class_path = serialized["id"]
            if any("agent" in str(part).lower() for part in class_path):
                return "agent"

        name = _get_run_name(serialized, **kwargs)
        if "agent" in name.lower():
            return "agent"

        return "chain"

    return "chain"


def _extract_agent_name(serialized: Optional[Dict[str, Any]], **kwargs: Any) -> Optional[str]:
    """Extract agent name from serialized data or kwargs.

    Args:
        serialized: Serialized component data.
        **kwargs: Additional keyword arguments.

    Returns:
        Agent name or None.
    """
    # Try kwargs name first
    if "name" in kwargs and kwargs["name"] is not None:
        return str(kwargs["name"])

    # Try serialized name
    if serialized:
        if "name" in serialized:
            return str(serialized["name"])

        # Try to extract from id path (e.g., ["langchain", "agents", "AgentName"])
        if "id" in serialized and isinstance(serialized["id"], list):
            # Find the part that contains "agent" in the path
            for part in reversed(serialized["id"]):
                part_str = str(part)
                if "agent" in part_str.lower():
                    return part_str
            # Fallback to last part
            return str(serialized["id"][-1])

    return None


class CallbackHandler(LangchainBaseCallbackHandler):
    """LangChain CallbackHandler for Observability.

    This handler intercepts LangChain callbacks and converts them into
    Observations following OpenInference semantic conventions.

    Attributes:
        adapter_name: Optional adapter name (e.g., "LangGraph" or "LangChain")
            for prefixing ROOT spans.
        user_id: Optional user ID for trace-level attribution.
        session_id: Optional session ID for trace-level grouping.
        tags: Optional list of tags to apply to all traces.
        version: Optional version string for trace-level versioning.
        trace_metadata: Optional metadata dictionary for trace-level attributes.

    Example:
        Basic usage:
        >>> from cloudbase_agent.observability.langchain import CallbackHandler
        >>> handler = CallbackHandler()
        >>> llm.invoke("Hello!", callbacks=[handler])

        With trace-level attributes:
        >>> handler = CallbackHandler(
        ...     user_id="user-123",
        ...     session_id="session-456",
        ...     tags=["production", "v1.0"],
        ...     version="1.0.0",
        ...     adapter_name="LangGraph"
        ... )
    """

    def __init__(
        self,
        *,
        adapter_name: Optional[str] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        version: Optional[str] = None,
        trace_metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """Initialize the CallbackHandler.

        Args:
            adapter_name: Optional adapter name for ROOT span prefix (e.g., "LangGraph", "LangChain").
            user_id: Optional user ID for trace-level attribution.
            session_id: Optional session ID for trace-level grouping.
            tags: Optional list of tags to apply to ROOT spans.
            version: Optional version string for trace-level versioning.
            trace_metadata: Optional metadata dictionary for trace-level attributes.
            **kwargs: Additional keyword arguments (for compatibility).
        """
        super().__init__()

        self.adapter_name = adapter_name
        self.user_id = user_id
        self.session_id = session_id
        self.tags = tags or []
        self.version = version
        self.trace_metadata = trace_metadata

        # State management
        self.runs: Dict[UUID, Any] = {}
        self._child_to_parent_run_id_map: Dict[UUID, Optional[UUID]] = {}
        self.context_tokens: Dict[UUID, Any] = {}
        self.last_trace_id: Optional[str] = None
        self.external_parent_span_context: Optional[Any] = None
        self.external_metadata: Optional[Dict[str, str]] = None

        # Streaming support - track completion start times
        self.completion_start_times: Dict[UUID, datetime.datetime] = {}
        self.updated_completion_start_time_memo: Set[UUID] = set()

        # Prompt registration for linking prompts to generations
        self.prompt_to_parent_run_map: Dict[UUID, Dict[str, Any]] = {}

    def set_external_parent_context(
        self, span_context: Any, metadata: Optional[Dict[str, str]] = None
    ) -> None:
        """Set external parent SpanContext from AG-UI.Server span.

        This allows the CallbackHandler to link LangChain/LangGraph spans
        to the server-level span, creating a unified trace hierarchy.

        Args:
            span_context: SpanContext from the AG-UI.Server span.
            metadata: Optional metadata from server (e.g., thread_id, run_id).
        """
        self.external_parent_span_context = span_context
        self.external_metadata = metadata

    def _get_parent_observation(self, parent_run_id: Optional[UUID]) -> Any:
        """Get the parent observation for a run.

        Args:
            parent_run_id: The parent run ID.

        Returns:
            The parent observation or None if no parent.
        """
        if parent_run_id and parent_run_id in self.runs:
            return self.runs[parent_run_id]
        return None

    def _get_parent_span_context(self, parent_run_id: Optional[UUID]) -> Optional[Any]:
        """Get the parent span context for linking child observations.

        Args:
            parent_run_id: The parent run ID.

        Returns:
            The parent span context or external parent context if no parent run.
        """
        # First check if we have a parent observation
        if parent_run_id and parent_run_id in self.runs:
            parent_obs = self.runs[parent_run_id]
            return parent_obs.otel_span.get_span_context()
        
        # If no parent observation, use external parent context (if set)
        # This links adapter spans to the server span
        if self.external_parent_span_context:
            return self.external_parent_span_context
        
        return None

    def _attach_observation(self, run_id: UUID, observation: Any) -> None:
        """Attach an observation to the OTEL context.

        Args:
            run_id: The run ID.
            observation: The observation to attach.
        """
        ctx = trace.set_span_in_context(observation.otel_span)
        token = context.attach(ctx)

        self.runs[run_id] = observation
        self.context_tokens[run_id] = token

    def _detach_observation(self, run_id: UUID) -> Optional[Any]:
        """Detach an observation from the OTEL context.

        Args:
            run_id: The run ID.

        Returns:
            The detached observation or None.
        """
        token = self.context_tokens.pop(run_id, None)

        if token:
            try:
                _RUNTIME_CONTEXT.detach(token)
            except ValueError:
                # ValueError: token was created in a different Context
                # This is expected in async scenarios where the token was created
                # in one async context but we're trying to detach in another.
                # OpenTelemetry's context variables are bound to the context where
                # they were created, and cannot be detached from a different context.
                pass
            except Exception:
                # Catch any other unexpected errors during detach
                pass

        return self.runs.pop(run_id, None)

    def _strip_observability_keys_from_metadata(
        self, metadata: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Strip reserved observability keys from metadata.

        Reserved keys are those used for trace-level attributes like:
        promptInfo, userId, sessionId, tags, version, metadata

        Args:
            metadata: The metadata dictionary to clean.

        Returns:
            A new dictionary with reserved keys removed.
        """
        if not metadata:
            return {}

        return {
            key: value
            for key, value in metadata.items()
            if key not in RESERVED_METADATA_KEYS
        }

    def _parse_trace_attributes_from_metadata(
        self, metadata: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Parse trace-level attributes from metadata.

        Extracts special keys from metadata for trace-level attribution:
        - userId: User identifier
        - sessionId: Session identifier
        - tags: List of tags

        Args:
            metadata: The metadata dictionary to parse.

        Returns:
            Dictionary with trace-level attributes.
        """
        attributes: Dict[str, Any] = {}

        if not metadata:
            return attributes

        if "userId" in metadata and isinstance(metadata["userId"], str):
            attributes["user_id"] = metadata["userId"]

        if "sessionId" in metadata and isinstance(metadata["sessionId"], str):
            attributes["session_id"] = metadata["sessionId"]

        if "tags" in metadata and isinstance(metadata["tags"], list):
            # Merge instance tags with metadata tags
            attributes["tags"] = list(set(self.tags + [str(tag) for tag in metadata["tags"]]))
        elif self.tags:
            attributes["tags"] = self.tags

        if "version" in metadata and isinstance(metadata["version"], str):
            attributes["version"] = metadata["version"]
        elif self.version:
            attributes["version"] = self.version

        return attributes

    def _register_prompt_info(
        self, parent_run_id: Optional[UUID], metadata: Optional[Dict[str, Any]]
    ) -> None:
        """Register prompt information from metadata.

        Links a prompt to a parent run for later association with generations.

        Args:
            parent_run_id: The parent run ID.
            metadata: Metadata dictionary that may contain promptInfo.
        """
        if parent_run_id is None:
            return

        if metadata and "promptInfo" in metadata:
            prompt_info = metadata["promptInfo"]
            if isinstance(prompt_info, dict):
                self.prompt_to_parent_run_map[parent_run_id] = prompt_info

    def _deregister_prompt_info(self, run_id: UUID) -> None:
        """Deregister prompt information for a run.

        Args:
            run_id: The run ID to deregister.
        """
        if run_id in self.prompt_to_parent_run_map:
            del self.prompt_to_parent_run_map[run_id]

    def on_llm_new_token(
        self,
        token: str,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle new LLM token during streaming.

        Tracks the completion start time on the first token to measure
        time-to-first-token (TTFT) latency.

        Args:
            token: The token text.
            run_id: The run ID.
            parent_run_id: The parent run ID.
            **kwargs: Additional keyword arguments.
        """
        logger.debug(f"on_llm_new_token: run_id={run_id}, parent_run_id={parent_run_id}")

        if (
            run_id in self.runs
            and run_id not in self.updated_completion_start_time_memo
        ):
            observation = self.runs[run_id]
            # Update completion start time to current timestamp
            try:
                observation.update(completion_start_time=datetime.datetime.now(datetime.timezone.utc))
                self.updated_completion_start_time_memo.add(run_id)
            except Exception as e:
                logger.debug(f"Failed to update completion_start_time: {e}")

    def on_agent_action(
        self,
        action: AgentAction,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle agent action event.

        Called when an agent executes a tool/action. Updates the observation
        type to "agent" and records the action as output.

        Args:
            action: The AgentAction object.
            run_id: The run ID.
            parent_run_id: The parent run ID.
            **kwargs: Additional keyword arguments.
        """
        logger.debug(f"on_agent_action: run_id={run_id}, action.tool={action.tool}")

        try:
            agent_run = self.runs.get(run_id)

            if agent_run is not None:
                # Update span kind to agent directly on OTEL span
                agent_run.otel_span.set_attribute("openinference.span.kind", "agent")
                # Update observation attributes
                agent_run.update(
                    output=action,
                    input=kwargs.get("inputs"),
                )
        except Exception as e:
            logger.exception(f"Error in on_agent_action: {e}")

    def on_agent_finish(
        self,
        finish: AgentFinish,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle agent finish event.

        Called when an agent completes execution. Updates the observation
        with the finish result.

        Args:
            finish: The AgentFinish object.
            run_id: The run ID.
            parent_run_id: The parent run ID.
            **kwargs: Additional keyword arguments.
        """
        logger.debug(f"on_agent_finish: run_id={run_id}")

        try:
            agent_run = self.runs.get(run_id)

            if agent_run is not None:
                # Update span kind to agent directly on OTEL span
                agent_run.otel_span.set_attribute("openinference.span.kind", "agent")
                # Update observation attributes
                agent_run.update(
                    output=finish,
                    input=kwargs.get("inputs"),
                )
        except Exception as e:
            logger.exception(f"Error in on_agent_finish: {e}")

    def on_chain_start(
        self,
        serialized: Optional[Dict[str, Any]],
        inputs: Dict[str, Any],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle chain start event."""
        self._child_to_parent_run_id_map[run_id] = parent_run_id

        try:
            run_name = _get_run_name(serialized, **kwargs)
            observation_type = _get_observation_type_from_serialized(
                serialized, "chain", **kwargs
            )

            # Add adapter prefix to ROOT span
            if parent_run_id is None and self.adapter_name:
                run_name = f"Adapter.{self.adapter_name}"

            # Register prompt info if present
            self._register_prompt_info(parent_run_id, metadata)

            # Get parent span context (from parent observation or external parent)
            parent_span_context = self._get_parent_span_context(parent_run_id)

            # Add agui.thread_id and agui.run_id to ALL spans if external metadata available
            # This ensures consistent tagging across the entire trace hierarchy
            server_metadata = {}
            if self.external_metadata:
                server_metadata = {
                    "agui.thread_id": self.external_metadata.get("thread_id"),
                    "agui.run_id": self.external_metadata.get("run_id"),
                }

            # Prepare observation attributes
            observation_attrs: Dict[str, Any] = {
                "input": inputs,
                "metadata": self._join_tags_and_metadata(tags, self._strip_observability_keys_from_metadata(metadata)),
                **server_metadata,
            }

            # Add agent_name if this is an agent observation
            if observation_type == "agent":
                agent_name = _extract_agent_name(serialized, **kwargs)
                if agent_name:
                    observation_attrs["agent_name"] = agent_name

            span = start_observation(
                run_name,
                observation_attrs,
                as_type=cast(Any, observation_type),
                parent_span_context=parent_span_context,
            )

            # Update trace-level attributes for ROOT spans
            if parent_run_id is None:
                trace_attrs = self._parse_trace_attributes_from_metadata(metadata)
                if trace_attrs or self.trace_metadata:
                    # Update ROOT span with trace attributes
                    span.update(
                        **trace_attrs,
                        metadata=self.trace_metadata,
                    )

            self._attach_observation(run_id, span)
            self.last_trace_id = span.trace_id

        except Exception:
            pass

    def on_chain_end(
        self,
        outputs: Dict[str, Any],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle chain end event."""
        try:
            span = self._detach_observation(run_id)
            if span is not None:
                span.update({"output": outputs})
                span.end()

            # Deregister prompt info
            self._deregister_prompt_info(run_id)

        except Exception as e:
            logger.exception(f"Error in on_chain_end: {e}")

        finally:
            if parent_run_id is None:
                self._reset()

    def on_chain_error(
        self,
        error: BaseException,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> None:
        """Handle chain error event."""
        try:
            if any(isinstance(error, t) for t in CONTROL_FLOW_EXCEPTION_TYPES):
                level = None
            else:
                level = ObservationLevel.ERROR

            span = self._detach_observation(run_id)

            if span is not None:
                span.update(
                    {
                        "level": level,
                        "status_message": str(error) if level else None,
                    }
                )
                # Set span status to ERROR for observability
                if level == ObservationLevel.ERROR:
                    try:
                        span.set_status(Status(StatusCode.ERROR, str(error)))
                    except Exception:
                        pass
                span.end()

        except Exception as e:
            logger.exception(f"Error in on_chain_error: {e}")

    def on_chat_model_start(
        self,
        serialized: Optional[Dict[str, Any]],
        messages: List[List[BaseMessage]],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle chat model start event."""
        self._child_to_parent_run_id_map[run_id] = parent_run_id

        try:
            run_name = _get_run_name(serialized, **kwargs)
            model_name = _extract_model_name(serialized, metadata, kwargs)
            model_params = _parse_model_parameters(kwargs)

            # Check for registered prompt
            if parent_run_id is not None and parent_run_id in self.prompt_to_parent_run_map:
                self._deregister_prompt_info(parent_run_id)

            # Convert messages to dict format for input
            prompts = []
            input_messages = []
            for message_list in messages:
                for message in message_list:
                    msg_dict = _convert_message_to_dict(message)
                    prompts.append(msg_dict)
                    input_messages.append(msg_dict)

            # Extract system and provider from metadata or kwargs
            system = _extract_system_from_metadata(metadata, kwargs)
            provider = _extract_provider_from_metadata(metadata, kwargs)

            # Add agui.thread_id and agui.run_id if external metadata available
            server_metadata = {}
            if self.external_metadata:
                server_metadata = {
                    "agui.thread_id": self.external_metadata.get("thread_id"),
                    "agui.run_id": self.external_metadata.get("run_id"),
                }

            parent_span_context = self._get_parent_span_context(parent_run_id)
            generation = start_observation(
                run_name,
                {
                    "input": prompts,
                    "model": model_name,
                    "model_parameters": model_params,
                    "system": system,
                    "provider": provider,
                    "input_messages": input_messages,
                    "input_mime_type": "application/json",
                    "metadata": self._join_tags_and_metadata(tags, self._strip_observability_keys_from_metadata(metadata)),
                    **server_metadata,
                },
                as_type="llm",
                parent_span_context=parent_span_context,
            )

            self._attach_observation(run_id, generation)
            self.last_trace_id = generation.trace_id

        except Exception as e:
            logger.exception(f"Error in on_chat_model_start: {e}")

    def on_llm_start(
        self,
        serialized: Optional[Dict[str, Any]],
        prompts: List[str],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle LLM start event."""
        self._child_to_parent_run_id_map[run_id] = parent_run_id

        try:
            run_name = _get_run_name(serialized, **kwargs)
            model_name = _extract_model_name(serialized, metadata, kwargs)
            model_params = _parse_model_parameters(kwargs)

            # Check for registered prompt
            if parent_run_id is not None and parent_run_id in self.prompt_to_parent_run_map:
                self._deregister_prompt_info(parent_run_id)

            # Convert prompts to input_messages format for non-chat models
            input_messages = [{"role": "user", "content": p} for p in prompts]

            # Extract system and provider
            system = _extract_system_from_metadata(metadata, kwargs)
            provider = _extract_provider_from_metadata(metadata, kwargs)

            # Add agui.thread_id and agui.run_id if external metadata available
            server_metadata = {}
            if self.external_metadata:
                server_metadata = {
                    "agui.thread_id": self.external_metadata.get("thread_id"),
                    "agui.run_id": self.external_metadata.get("run_id"),
                }

            parent_span_context = self._get_parent_span_context(parent_run_id)
            generation = start_observation(
                run_name,
                {
                    "input": prompts[0] if len(prompts) == 1 else prompts,
                    "model": model_name,
                    "model_parameters": model_params,
                    "system": system,
                    "provider": provider,
                    "input_messages": input_messages,
                    "input_mime_type": "application/json",
                    "metadata": self._join_tags_and_metadata(tags, self._strip_observability_keys_from_metadata(metadata)),
                    **server_metadata,
                },
                as_type="llm",
                parent_span_context=parent_span_context,
            )

            self._attach_observation(run_id, generation)
            self.last_trace_id = generation.trace_id

        except Exception as e:
            logger.exception(f"Error in on_llm_start: {e}")

    def on_llm_end(
        self,
        response: LLMResult,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle LLM end event."""
        try:
            generation = self._detach_observation(run_id)

            if generation is not None:
                # Extract output
                response_generation = response.generations[-1][-1]
                output_messages = []
                if isinstance(response_generation, ChatGeneration):
                    output = _convert_message_to_dict(response_generation.message)
                    output_messages.append(output)
                else:
                    output = response_generation.text
                    # Create a synthetic assistant message for output_messages
                    output_messages.append({"role": "assistant", "content": output})

                # Parse usage
                usage = _parse_usage(response)

                generation.update(
                    {
                        "output": output,
                        "usage_details": usage,
                        "output_messages": output_messages,
                        "output_mime_type": "application/json",
                    }
                )
                generation.end()

        except Exception as e:
            logger.exception(f"Error in on_llm_end: {e}")

        finally:
            if parent_run_id is None:
                self._reset()

    def on_llm_error(
        self,
        error: BaseException,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle LLM error event."""
        try:
            generation = self._detach_observation(run_id)

            if generation is not None:
                generation.update(
                    {
                        "level": ObservationLevel.ERROR,
                        "status_message": str(error),
                    }
                )
                # Set span status to ERROR for observability
                try:
                    generation.set_status(Status(StatusCode.ERROR, str(error)))
                except Exception:
                    pass
                generation.end()

        except Exception as e:
            logger.exception(f"Error in on_llm_error: {e}")

    def on_tool_start(
        self,
        serialized: Optional[Dict[str, Any]],
        input_str: str,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle tool start event."""
        self._child_to_parent_run_id_map[run_id] = parent_run_id

        try:
            run_name = _get_run_name(serialized, **kwargs)

            # Extract tool attributes from serialized for OpenInference semantics
            tool_attributes = self._extract_tool_attributes(serialized, input_str)

            parent_span_context = self._get_parent_span_context(parent_run_id)
            span = start_observation(
                run_name,
                {
                    "input": input_str,
                    **tool_attributes,
                    "metadata": self._join_tags_and_metadata(tags, self._strip_observability_keys_from_metadata(metadata)),
                },
                as_type="tool",
                parent_span_context=parent_span_context,
            )

            self._attach_observation(run_id, span)

        except Exception as e:
            logger.exception(f"Error in on_tool_start: {e}")

    def on_tool_end(
        self,
        output: str,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle tool end event."""
        try:
            span = self._detach_observation(run_id)

            if span is not None:
                span.update({"output": output})
                span.end()

        except Exception as e:
            logger.exception(f"Error in on_tool_end: {e}")

    def on_tool_error(
        self,
        error: BaseException,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle tool error event."""
        try:
            span = self._detach_observation(run_id)

            if span is not None:
                span.update(
                    {
                        "level": ObservationLevel.ERROR,
                        "status_message": str(error),
                    }
                )
                # Set span status to ERROR for observability
                try:
                    span.set_status(Status(StatusCode.ERROR, str(error)))
                except Exception:
                    pass
                span.end()

        except Exception as e:
            logger.exception(f"Error in on_tool_error: {e}")

    def on_retriever_start(
        self,
        serialized: Optional[Dict[str, Any]],
        query: str,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle retriever start event."""
        self._child_to_parent_run_id_map[run_id] = parent_run_id

        try:
            run_name = _get_run_name(serialized, **kwargs)

            parent_span_context = self._get_parent_span_context(parent_run_id)
            span = start_observation(
                run_name,
                {
                    "input": query,
                    "query": query,
                    "metadata": self._join_tags_and_metadata(tags, self._strip_observability_keys_from_metadata(metadata)),
                },
                as_type="retriever",
                parent_span_context=parent_span_context,
            )

            self._attach_observation(run_id, span)

        except Exception as e:
            logger.exception(f"Error in on_retriever_start: {e}")

    def on_retriever_end(
        self,
        documents: List[Document],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle retriever end event."""
        try:
            span = self._detach_observation(run_id)

            if span is not None:
                # Convert LangChain documents to OpenInference format
                docs_for_observability = self._convert_documents(documents)

                span.update({
                    "output": documents,
                    "documents": docs_for_observability,
                })
                span.end()

        except Exception as e:
            logger.exception(f"Error in on_retriever_end: {e}")

    def on_retriever_error(
        self,
        error: BaseException,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        """Handle retriever error event."""
        try:
            span = self._detach_observation(run_id)

            if span is not None:
                span.update(
                    {
                        "level": ObservationLevel.ERROR,
                        "status_message": str(error),
                    }
                )
                # Set span status to ERROR for observability
                try:
                    span.set_status(Status(StatusCode.ERROR, str(error)))
                except Exception:
                    pass
                span.end()

        except Exception as e:
            logger.exception(f"Error in on_retriever_error: {e}")

    def _extract_tool_attributes(
        self,
        serialized: Optional[Dict[str, Any]],
        input_str: str,
    ) -> Dict[str, Any]:
        """Extract tool attributes from serialized tool data.

        Args:
            serialized: Serialized tool data from LangChain.
            input_str: Tool input string.

        Returns:
            Dictionary with tool_name, tool_description, tool_parameters if available.
        """
        return _extract_tool_attributes(serialized, input_str)

    def _convert_documents(
        self,
        documents: List[Any],
    ) -> List[Dict[str, Any]]:
        """Convert LangChain documents to OpenInference format.

        Args:
            documents: List of LangChain Document objects.

        Returns:
            List of document dictionaries in OpenInference format.
        """
        from cloudbase_agent.observability.types import Document as OIDocument

        result: List[Dict[str, Any]] = []

        if not documents:
            return result

        try:
            for doc in documents:
                if not doc:
                    continue

                # Handle LangChain Document objects
                if hasattr(doc, "page_content"):
                    doc_dict: Dict[str, Any] = {
                        "content": str(doc.page_content),
                    }
                    # Extract ID if available
                    if hasattr(doc, "id") and doc.id is not None:
                        doc_dict["id"] = str(doc.id)
                    # Extract metadata if available
                    if hasattr(doc, "metadata") and doc.metadata is not None:
                        doc_dict["metadata"] = doc.metadata
                        # Try to extract score from metadata
                        if isinstance(doc.metadata, dict) and "score" in doc.metadata:
                            try:
                                doc_dict["score"] = float(doc.metadata["score"])
                            except (ValueError, TypeError):
                                pass
                    result.append(doc_dict)
                elif isinstance(doc, dict):
                    # Already a dict, ensure required fields
                    doc_dict = {
                        "content": str(doc.get("content", doc.get("page_content", ""))),
                    }
                    if "id" in doc:
                        doc_dict["id"] = str(doc["id"])
                    if "metadata" in doc:
                        doc_dict["metadata"] = doc["metadata"]
                    if "score" in doc:
                        try:
                            doc_dict["score"] = float(doc["score"])
                        except (ValueError, TypeError):
                            pass
                    result.append(doc_dict)
        except Exception:
            # Silent fail - don't block business logic for observability
            pass

        return result

    def _join_tags_and_metadata(
        self,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Join tags and metadata into a single dict.

        Args:
            tags: Optional list of tags.
            metadata: Optional metadata dict.

        Returns:
            Combined dictionary or None.
        """
        final_dict = {}
        if tags is not None and len(tags) > 0:
            final_dict["tags"] = tags
        if metadata is not None:
            final_dict.update(metadata)

        return final_dict if final_dict else None

    def _reset(self) -> None:
        """Reset the handler state."""
        self._child_to_parent_run_id_map = {}
        self.prompt_to_parent_run_map = {}
        self.completion_start_times = {}
        self.updated_completion_start_time_memo = set()
