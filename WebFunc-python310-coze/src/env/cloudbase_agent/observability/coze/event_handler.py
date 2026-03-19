"""
Coze EventHandler for Observability.

Converts Coze stream events into observations with OpenInference
semantic conventions.

This handler is designed to work with Coze's event streaming model (ChatEventType)
and provides similar functionality to LangChain's CallbackHandler but adapted
for Coze's specific event patterns.
"""

import datetime
import json
import logging
from typing import Any, Dict, Optional

from opentelemetry import trace
from opentelemetry.trace import SpanContext, Status, StatusCode

from cloudbase_agent.observability import start_observation
from cloudbase_agent.observability.types import ObservationLevel

logger = logging.getLogger(__name__)


def _serialize_message(msg: Any) -> Dict[str, Any]:
    """Convert a message object to a dictionary format.

    Args:
        msg: Message object (dict or object with role/content attributes).

    Returns:
        Dictionary with role and content.
    """
    if isinstance(msg, dict):
        return {
            "role": msg.get("role", "unknown"),
            "content": msg.get("content", ""),
        }
    else:
        return {
            "role": getattr(msg, "role", "unknown"),
            "content": getattr(msg, "content", ""),
        }


def _serialize_messages(messages: Any) -> list:
    """Convert messages to a list of dictionaries.

    Args:
        messages: Messages object (list, dict, or object with content attribute).

    Returns:
        List of message dictionaries.
    """
    if not messages:
        return []

    if isinstance(messages, list):
        return [_serialize_message(msg) for msg in messages]
    elif isinstance(messages, dict) and "content" in messages:
        # Single message as dict
        return [_serialize_message(messages)]
    else:
        # Try to get content attribute
        content = getattr(messages, "content", None)
        if content:
            if isinstance(content, list):
                return [_serialize_message(msg) for msg in content]
            else:
                return [{"role": "user", "content": str(content)}]

    return []


class CozeEventHandler:
    """Coze event handler for observability.

    This handler intercepts Coze stream events and converts them into
    Observations following OpenInference semantic conventions.

    The handler supports:
    - AGENT span for Coze bot execution
    - TOOL spans for local plugin calls
    - LLM spans for model interactions (when available)
    - Proper context propagation from AG-UI.Server

    Attributes:
        adapter_name: Optional adapter name for prefixing ROOT spans (default: "Coze").
        external_parent_span_context: Optional external parent span context from AG-UI.Server.

    Example:
        Basic usage:
        >>> from cloudbase_agent.observability.coze import CozeEventHandler
        >>> handler = CozeEventHandler()
        >>> handler.on_chat_start(run_input)
        >>> # ... process events ...
        >>> handler.on_chat_completed(run_id, output=result)

        With external parent context (for server integration):
        >>> handler = CozeEventHandler(adapter_name="Coze")
        >>> handler.set_external_parent_context(server_span_context)
        >>> handler.on_chat_start(run_input)
    """

    def __init__(
        self,
        *,
        adapter_name: Optional[str] = "Coze",
        **kwargs: Any,
    ) -> None:
        """Initialize the CozeEventHandler.

        Args:
            adapter_name: Optional adapter name for ROOT span prefix. Defaults to "Coze".
            **kwargs: Additional keyword arguments (for compatibility).
        """
        self.adapter_name = adapter_name
        self.external_parent_span_context: Optional[SpanContext] = None
        self.external_metadata: Optional[Dict[str, str]] = None

        # State management for tracking active observations
        self._observations: Dict[str, Any] = {}
        self._child_to_parent_map: Dict[str, Optional[str]] = {}

        # Track tool calls for proper span nesting
        self._active_tools: Dict[str, Any] = {}

    def set_external_parent_context(
        self, span_context: SpanContext, metadata: Optional[Dict[str, str]] = None
    ) -> None:
        """Set external parent SpanContext from AG-UI.Server span.

        This allows the EventHandler to link Coze spans to the server-level
        span, creating a unified trace hierarchy.

        Args:
            span_context: SpanContext from the AG-UI.Server span.
            metadata: Optional metadata from server (e.g., thread_id, run_id).
        """
        self.external_parent_span_context = span_context
        self.external_metadata = metadata

    def on_chat_start(
        self,
        run_input: Any,
        **kwargs: Any,
    ) -> Optional[Any]:
        """Handle chat start event.

        Creates the ROOT AGENT span for the Coze bot execution, and a nested
        CHAIN span for the bot interaction.

        Args:
            run_input: The RunAgentInput containing messages, bot_id, user_id, etc.
            **kwargs: Additional keyword arguments.

        Returns:
            The created observation or None if an error occurred.
        """
        try:
            adapter_name = f"Adapter.{self.adapter_name}"

            # Extract messages from run_input
            messages = []
            if hasattr(run_input, "messages"):
                messages = _serialize_messages(run_input.messages)

            # Build observation attributes
            attributes = {
                "input": messages,
                "metadata": {},
            }

            # Add Coze-specific metadata if available
            if hasattr(run_input, "bot_id"):
                attributes["metadata"]["bot_id"] = run_input.bot_id
            if hasattr(run_input, "user_id"):
                attributes["metadata"]["user_id"] = run_input.user_id

            # Add server metadata (thread_id, run_id) for ROOT spans with external parent
            if self.external_parent_span_context and self.external_metadata:
                if "thread_id" in self.external_metadata:
                    attributes["agui.thread_id"] = self.external_metadata["thread_id"]
                if "run_id" in self.external_metadata:
                    attributes["agui.run_id"] = self.external_metadata["run_id"]

            # Use external parent context if available (for server integration)
            parent_span_context = self.external_parent_span_context

            # Create Adapter CHAIN span (container/workflow level)
            adapter_observation = start_observation(
                adapter_name,
                attributes,
                as_type="chain",
                parent_span_context=parent_span_context,
            )

            # Generate run_id for tracking
            run_id = f"{getattr(run_input, 'thread_id', 'unknown')}:{getattr(run_input, 'run_id', 'unknown')}"

            # Store adapter observation
            self._observations[run_id] = adapter_observation

            # Create nested "Coze.Bot" AGENT span (intelligent agent level)
            # Use adapter span's context as parent
            adapter_span_context = adapter_observation.otel_span.get_span_context()
            bot_observation = start_observation(
                "Coze.Bot",
                attributes,
                as_type="agent",
                parent_span_context=adapter_span_context,
            )

            # Store bot observation with special key
            self._observations[f"{run_id}:bot"] = bot_observation

            logger.debug(f"[CozeEventHandler] Started adapter and bot observations: {adapter_name}")
            return adapter_observation

        except Exception as e:
            logger.debug(f"[CozeEventHandler] Error in on_chat_start: {e}")
            return None

    def on_message_delta(
        self,
        content: str,
        run_id: str,
        **kwargs: Any,
    ) -> None:
        """Handle message delta event (streaming content).

        Tracks the first token time for TTFT (Time To First Token) measurement.

        Args:
            content: The streaming content fragment.
            run_id: The run identifier.
            **kwargs: Additional keyword arguments.
        """
        try:
            observation = self._observations.get(run_id)
            if observation:
                # Record first token time for TTFT
                if not hasattr(observation, "_first_token_recorded"):
                    observation.update(
                        completion_start_time=datetime.datetime.now(datetime.timezone.utc)
                    )
                    observation._first_token_recorded = True
                    logger.debug(f"[CozeEventHandler] First token received for run_id: {run_id}")

        except Exception as e:
            logger.debug(f"[CozeEventHandler] Error in on_message_delta: {e}")

    def on_tool_call_start(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        run_id: str,
        **kwargs: Any,
    ) -> Optional[Any]:
        """Handle tool call start event (local plugin).

        Creates a TOOL span for local plugin execution.

        Args:
            tool_name: Name of the tool being called.
            tool_input: Input parameters for the tool.
            run_id: The parent run identifier.
            **kwargs: Additional keyword arguments.

        Returns:
            The created tool observation or None.
        """
        try:
            parent_obs = self._observations.get(run_id)
            if not parent_obs:
                logger.debug(f"[CozeEventHandler] Parent observation not found for tool call: {run_id}")
                return None

            parent_span_context = parent_obs.otel_span.get_span_context()

            # Create TOOL span
            tool_observation = start_observation(
                tool_name,
                {
                    "input": tool_input,
                },
                as_type="tool",
                parent_span_context=parent_span_context,
            )

            # Track tool observation
            tool_run_id = f"{run_id}:tool:{tool_name}"
            self._observations[tool_run_id] = tool_observation
            self._child_to_parent_map[tool_run_id] = run_id

            logger.debug(f"[CozeEventHandler] Started tool observation: {tool_name}")
            return tool_observation

        except Exception as e:
            logger.debug(f"[CozeEventHandler] Error in on_tool_call_start: {e}")
            return None

    def on_tool_call_end(
        self,
        tool_name: str,
        tool_output: Any,
        run_id: str,
        **kwargs: Any,
    ) -> None:
        """Handle tool call end event.

        Ends the TOOL span with the tool output.

        Args:
            tool_name: Name of the tool that was called.
            tool_output: Output from the tool execution.
            run_id: The parent run identifier.
            **kwargs: Additional keyword arguments.
        """
        try:
            tool_run_id = f"{run_id}:tool:{tool_name}"
            tool_observation = self._observations.pop(tool_run_id, None)

            if tool_observation:
                tool_observation.update({"output": tool_output})
                tool_observation.end()
                logger.debug(f"[CozeEventHandler] Ended tool observation: {tool_name}")

        except Exception as e:
            logger.debug(f"[CozeEventHandler] Error in on_tool_call_end: {e}")

    def on_platform_plugin_call_start(
        self,
        plugin_name: str,
        plugin_input: Dict[str, Any],
        run_id: str,
        **kwargs: Any,
    ) -> Optional[Any]:
        """Handle Coze platform plugin call start event (FUNCTION_CALL).

        Creates a TOOL span for Coze platform plugin execution.

        Args:
            plugin_name: Name of the platform plugin (from message.name or function.name).
            plugin_input: Input parameters for the plugin (from message.arguments or function.arguments).
            run_id: The parent run identifier.
            **kwargs: Additional keyword arguments.

        Returns:
            The created tool observation or None.
        """
        try:
            parent_obs = self._observations.get(run_id)
            if not parent_obs:
                logger.debug(f"[CozeEventHandler] Parent observation not found for platform plugin: {run_id}")
                return None

            parent_span_context = parent_obs.otel_span.get_span_context()

            # Create TOOL span for platform plugin
            tool_observation = start_observation(
                plugin_name,
                {
                    "input": plugin_input,
                },
                as_type="tool",
                parent_span_context=parent_span_context,
            )

            # Track tool observation with unique key for platform plugins
            tool_run_id = f"{run_id}:platform_plugin:{plugin_name}"
            self._observations[tool_run_id] = tool_observation
            self._child_to_parent_map[tool_run_id] = run_id

            logger.debug(f"[CozeEventHandler] Started platform plugin observation: {plugin_name}")
            return tool_observation

        except Exception as e:
            logger.debug(f"[CozeEventHandler] Error in on_platform_plugin_call_start: {e}")
            return None

    def on_platform_plugin_call_end(
        self,
        plugin_name: str,
        plugin_output: Any,
        run_id: str,
        **kwargs: Any,
    ) -> None:
        """Handle Coze platform plugin call end event (TOOL_RESPONSE).

        Ends the TOOL span with the plugin output.

        Args:
            plugin_name: Name of the platform plugin.
            plugin_output: Output from the plugin execution.
            run_id: The parent run identifier.
            **kwargs: Additional keyword arguments.
        """
        try:
            tool_run_id = f"{run_id}:platform_plugin:{plugin_name}"
            tool_observation = self._observations.pop(tool_run_id, None)

            if tool_observation:
                tool_observation.update({"output": plugin_output})
                tool_observation.end()
                logger.debug(f"[CozeEventHandler] Ended platform plugin observation: {plugin_name}")

        except Exception as e:
            logger.debug(f"[CozeEventHandler] Error in on_platform_plugin_call_end: {e}")

    def on_chat_completed(
        self,
        run_id: str,
        **kwargs: Any,
    ) -> None:
        """Handle chat completed event.

        Ends both the Bot CHAIN span and the Adapter AGENT span with the final output.

        Args:
            run_id: The run identifier.
            **kwargs: Additional keyword arguments (may include 'output').
        """
        try:
            # End bot observation first
            bot_observation = self._observations.pop(f"{run_id}:bot", None)
            if bot_observation:
                if "output" in kwargs:
                    bot_observation.update({"output": kwargs["output"]})
                bot_observation.end()
                logger.debug(f"[CozeEventHandler] Completed bot observation: {run_id}")

            # Then end adapter observation
            observation = self._observations.pop(run_id, None)
            if observation:
                # Update with output if provided
                if "output" in kwargs:
                    observation.update({"output": kwargs["output"]})

                observation.end()
                logger.debug(f"[CozeEventHandler] Completed adapter observation: {run_id}")

        except Exception as e:
            logger.debug(f"[CozeEventHandler] Error in on_chat_completed: {e}")

    def on_chat_failed(
        self,
        run_id: str,
        error: Exception,
        **kwargs: Any,
    ) -> None:
        """Handle chat failed event.

        Ends the ROOT AGENT span with error status.

        Args:
            run_id: The run identifier.
            error: The exception that caused the failure.
            **kwargs: Additional keyword arguments.
        """
        try:
            error_message = str(error)

            # End bot observation first with error
            bot_observation = self._observations.pop(f"{run_id}:bot", None)
            if bot_observation:
                bot_observation.update(
                    {
                        "level": ObservationLevel.ERROR,
                        "status_message": error_message,
                    }
                )
                # Set span status to ERROR
                bot_observation.otel_span.set_status(
                    Status(StatusCode.ERROR, error_message)
                )
                bot_observation.end()
                logger.debug(f"[CozeEventHandler] Failed bot observation: {run_id}")

            # Then end adapter observation with error
            observation = self._observations.pop(run_id, None)
            if observation:
                observation.update(
                    {
                        "level": ObservationLevel.ERROR,
                        "status_message": error_message,
                    }
                )
                # Set span status to ERROR
                observation.otel_span.set_status(
                    Status(StatusCode.ERROR, error_message)
                )
                observation.end()
                logger.debug(f"[CozeEventHandler] Failed adapter observation: {run_id}")

        except Exception as e:
            logger.debug(f"[CozeEventHandler] Error in on_chat_failed: {e}")

    def handle(
        self,
        coze_event: Any,
        run_id: str,
    ) -> None:
        """Handle Coze stream event for observability.

        This is the main entry point for processing Coze events in the
        agent's event loop. It routes events to appropriate handlers based
        on event type.

        Args:
            coze_event: The Coze stream event from cozepy SDK.
            run_id: The run identifier (thread_id:run_id format).
        """
        if not hasattr(coze_event, "event"):
            return

        event_type = coze_event.event

        # CONVERSATION_MESSAGE_DELTA: Track TTFT
        if str(event_type) == "ChatEventType.CONVERSATION_MESSAGE_DELTA":
            if hasattr(coze_event, "message") and hasattr(coze_event.message, "content"):
                content = coze_event.message.content
                if content:
                    self.on_message_delta(content, run_id)

        # CONVERSATION_CHAT_REQUIRES_ACTION: Local plugin calls
        elif str(event_type) == "ChatEventType.CONVERSATION_CHAT_REQUIRES_ACTION":
            if hasattr(coze_event, "data"):
                tool_calls = coze_event.data
                if isinstance(tool_calls, list):
                    for tool_call in tool_calls:
                        tool_name = getattr(tool_call, "function", {}).get("name", "unknown")
                        tool_arguments = getattr(tool_call, "function", {}).get("arguments", {})
                        self.on_tool_call_start(tool_name, tool_arguments, run_id)

        # CONVERSATION_MESSAGE_COMPLETED: Platform plugins (FUNCTION_CALL / TOOL_RESPONSE)
        elif str(event_type) == "ChatEventType.CONVERSATION_MESSAGE_COMPLETED":
            if hasattr(coze_event, "message"):
                msg = coze_event.message
                msg_type = getattr(msg, "type", None)

                # FUNCTION_CALL: Platform plugin started
                if str(msg_type) == "MessageType.FUNCTION_CALL":
                    content = getattr(msg, "content", "")
                    try:
                        if isinstance(content, str):
                            plugin_info = json.loads(content)
                        else:
                            plugin_info = content

                        plugin_name = plugin_info.get("name", plugin_info.get("plugin_name", "unknown"))
                        plugin_input = plugin_info.get("arguments", {})
                        self.on_platform_plugin_call_start(plugin_name, plugin_input, run_id)
                    except json.JSONDecodeError:
                        logger.debug(f"[CozeEventHandler] Failed to parse FUNCTION_CALL content")

                # TOOL_RESPONSE: Platform plugin finished
                elif str(msg_type) == "MessageType.TOOL_RESPONSE":
                    content = getattr(msg, "content", "")
                    # Find and end the pending platform plugin
                    for key in list(self._observations.keys()):
                        if key.startswith(f"{run_id}:platform_plugin:"):
                            plugin_name = key.replace(f"{run_id}:platform_plugin:", "")
                            self.on_platform_plugin_call_end(plugin_name, content, run_id)
                            break

        # CONVERSATION_CHAT_COMPLETED: End agent span
        elif str(event_type) == "ChatEventType.CONVERSATION_CHAT_COMPLETED":
            self.on_chat_completed(run_id)

        # CONVERSATION_CHAT_FAILED: End agent span with error
        elif str(event_type) == "ChatEventType.CONVERSATION_CHAT_FAILED":
            error_msg = "Chat failed"
            if hasattr(coze_event, "chat") and hasattr(coze_event.chat, "last_error"):
                error_msg = f"Chat failed: {coze_event.chat.last_error}"
            self.on_chat_failed(run_id, Exception(error_msg))

    def reset(self) -> None:
        """Reset the handler state.

        Clears all tracked observations and mappings.
        Call this between different runs to ensure clean state.
        """
        self._observations.clear()
        self._child_to_parent_map.clear()
        self._active_tools.clear()
