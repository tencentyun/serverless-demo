#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Coze Agent Implementation.

This module provides the Coze agent implementation that extends the base
Cloudbase Agent agent class. It handles agent instantiation and ensures proper
integration with the Cloudbase Agent framework through Coze chat API.
"""

import asyncio
import json
import logging
import threading
import uuid
from typing import Any, AsyncGenerator, Dict, Optional

from ag_ui.core import BaseEvent, EventType, RunAgentInput
from ag_ui.core.events import RunErrorEvent, RunFinishedEvent, RunStartedEvent
from cozepy import ChatEventType, Coze, COZE_CN_BASE_URL, TokenAuth, ToolOutput

from cloudbase_agent.base_agent import BaseAgent
from .converters import coze_events_to_ag_ui_events, coze_prepare_inputs

# Configure logging
logger = logging.getLogger(__name__)


class CozeAgent(BaseAgent):
    """Coze Agent implementation extending BaseAgent.

    This class wraps Coze chat API and provides a consistent interface
    following the Cloudbase Agent agent pattern.

    Enhanced with context management and event ID fixing.

    Parameters
    ----------
    **Required Parameters:**
    
    name : str
        Human-readable name for the agent.
    description : str
        Detailed description of the agent's purpose and capabilities.
    api_token : str
        Coze API token. Set via COZE_API_TOKEN environment variable
        or pass directly. Get token from: https://www.coze.cn/open/oauth/pats
    bot_id : str
        Bot ID for Coze conversations. Set via COZE_BOT_ID environment variable
        or pass directly.
    user_id : str
        User ID for Coze conversations. Set via COZE_USER_ID environment variable
        or pass directly.

    **Optional Parameters:**
    
    base_url : str, optional
        Coze API base URL. Defaults to 'https://api.coze.cn' (China).
        Use 'https://api.coze.com' for international.
        Can be set via COZE_API_BASE environment variable.
    parameters : dict, optional
        Parameters for Coze chat API (e.g., temperature, max_tokens).
    fix_event_ids : bool, default=True
        Enable automatic event ID fixing for proper tracking.
    debug_mode : bool, default=False
        Enable debug logging for troubleshooting.

    Raises
    ------
    ValueError
        If any required parameter (api_token, bot_id, user_id) is missing or invalid.

    Example
    -------
    ::

        from cloudbase_agent.coze import CozeAgent

        agent = CozeAgent(
            # Required
            name="CozeBot",
            description="A helpful Coze assistant",
            api_token="pat_xxxx",
            bot_id="7123456789012345678",
            user_id="user_123",
            # Optional
            base_url="https://api.coze.cn",
            parameters={"temperature": 0.7},
        )

    Note
    ----
    This class does NOT read environment variables. All configuration
    must be passed explicitly from the caller. For environment variable
    handling, see the examples in `examples/coze/agent.py`.

    See Also
    --------
    Coze Chat V3 API: https://docs.coze.cn/developer_guides/chat_v3
    """

    # Documentation URL for error messages
    _DOCS_URL = "https://docs.coze.cn/developer_guides/chat_v3"

    def __init__(
        self,
        # Required parameters (no default values)
        name: str,
        description: str,
        api_token: str,
        bot_id: str,
        user_id: str,
        # Optional parameters (with default values)
        base_url: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
        fix_event_ids: bool = True,
        debug_mode: bool = False,
    ):
        """Initialize the Coze agent.

        All required parameters must be provided explicitly. This class does not
        read environment variables - configuration should be handled in the
        application/example layer.

        Parameters
        ----------
        name : str
            **[Required]** Human-readable name for the agent.
        description : str
            **[Required]** Detailed description of the agent's purpose.
        api_token : str
            **[Required]** Coze API token (COZE_API_TOKEN).
        bot_id : str
            **[Required]** Bot ID for Coze conversations (COZE_BOT_ID).
        user_id : str
            **[Required]** User ID for Coze conversations (COZE_USER_ID).
        base_url : str, optional
            Coze API base URL. Defaults to 'https://api.coze.cn'.
        parameters : dict, optional
            Parameters for Coze chat API.
        fix_event_ids : bool, default=True
            Enable event ID fixing.
        debug_mode : bool, default=False
            Enable debug logging.

        Raises
        ------
        ValueError
            If api_token, bot_id, or user_id are missing or invalid.
        """
        # Validate all required parameters with user-friendly error messages
        if not api_token or not isinstance(api_token, str) or not api_token.strip():
            raise ValueError(
                "COZE_API_TOKEN is required but not provided or empty. "
                "Please set the COZE_API_TOKEN environment variable or pass api_token parameter. "
                f"Refer to: {self._DOCS_URL}"
            )

        if not bot_id or not isinstance(bot_id, str) or not bot_id.strip():
            raise ValueError(
                "COZE_BOT_ID is required but not provided or empty. "
                "Please set the COZE_BOT_ID environment variable or pass bot_id parameter. "
                f"Refer to: {self._DOCS_URL}"
            )

        if not user_id or not isinstance(user_id, str) or not user_id.strip():
            raise ValueError(
                "COZE_USER_ID is required but not provided or empty. "
                "Please set the COZE_USER_ID environment variable or pass user_id parameter. "
                f"Refer to: {self._DOCS_URL}"
            )

        # Use default base_url if not provided
        final_base_url = base_url or COZE_CN_BASE_URL
        if not isinstance(final_base_url, str) or not final_base_url.strip():
            raise ValueError(
                "COZE_API_BASE must be a non-empty string if provided. "
                "Use 'https://api.coze.cn' for China or 'https://api.coze.com' for international. "
                f"Refer to: {self._DOCS_URL}"
            )

        # Create the Coze client - all validation passed
        final_client = Coze(
            auth=TokenAuth(token=api_token.strip()),
            base_url=final_base_url.strip()
        )

        # Initialize base class
        super().__init__(name=name, description=description, agent=None)

        # Store all parameters directly - no environment variable reading
        self._coze_client = final_client
        self._bot_id = bot_id.strip()
        self._user_id = user_id.strip()
        self._parameters = parameters or {}
        self._should_fix_event_ids = fix_event_ids
        self._debug_mode = debug_mode
        
        # Configure logging level based on debug_mode
        if debug_mode:
            # Only set logger level, don't call basicConfig to avoid conflicts
            logger.setLevel(logging.DEBUG)
            # Ensure at least one handler exists
            if not logger.handlers:
                handler = logging.StreamHandler()
                handler.setFormatter(logging.Formatter(
                    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
                ))
                logger.addHandler(handler)

    async def run(self, run_input: RunAgentInput) -> AsyncGenerator[BaseEvent, None]:
        """Execute the Coze agent with the given input.

        This method manages the Coze chat API execution and converts Coze events
        to Cloudbase Agent events.

        :param run_input: Input data for the agent execution
        :type run_input: RunAgentInput

        :yield: Events representing the agent's execution progress
        :rtype: AsyncGenerator[BaseEvent, None]

        Example:
            Running the agent::

                from ag_ui.core import RunAgentInput

                agent = CozeAgent(name="CozeBot", description="...", ...)

                run_input = RunAgentInput(
                    messages=[{"role": "user", "content": "Hello"}],
                    run_id="run-123",
                    thread_id="thread-456",
                    state={},
                    context=[],
                    tools=[],
                    forwarded_props={}
                )

                async for event in agent.run(run_input):
                    print(f"Event: {event.type}")
        """
        # Use context manager to set current agent
        with self.as_current():
            if self._should_fix_event_ids:
                # Enhanced processing with event ID fixing
                async for event in self._run_internal(run_input):
                    event = super()._fix_event_ids(event, run_input.thread_id, run_input.run_id)
                    yield event
            else:
                # Simple delegation
                async for event in self._run_internal(run_input):
                    yield event

    async def _run_internal(self, run_input: RunAgentInput) -> AsyncGenerator[BaseEvent, None]:
        """Internal run logic for Coze chat execution.

        :param run_input: Input data for the agent execution
        :type run_input: RunAgentInput
        :yield: Events from the chat execution
        :rtype: AsyncGenerator[BaseEvent, None]
        """
        # Emit run started event
        yield RunStartedEvent(
            type=EventType.RUN_STARTED,
            thread_id=run_input.thread_id,
            run_id=run_input.run_id,
        )

        # Emit STEP_STARTED event (for consistency with CrewAI)
        from ag_ui.core.events import StepStartedEvent
        yield StepStartedEvent(
            type=EventType.STEP_STARTED,
            step_name="chat",
        )

        # Check if this is a tool output submission (local plugin flow)
        # If messages contain ToolMessage, it means client has executed the tool
        # and we need to submit the result to Coze via submit_tool_outputs API
        tool_messages = [
            msg for msg in run_input.messages 
            if getattr(msg, "role", None) == "tool" and hasattr(msg, "tool_call_id")
        ]
        
        if tool_messages:
            # This is a tool output submission for local plugin
            # Reference: https://docs.coze.cn/guides/use_local_plugin
            async for event in self._handle_tool_outputs_submission(run_input, tool_messages):
                yield event
            return

        # Prepare inputs for Coze API (normal chat flow)
        coze_inputs = coze_prepare_inputs(run_input)

        # Get conversation_id from state if available
        conversation_id = coze_inputs.get("conversation_id")
        additional_messages = coze_inputs.get("additional_messages", [])
        # Note: tools parameter is not used - Coze tools are configured in the platform
        # AG-UI tools parameter is for client-side tools, not server-side Coze plugins

        if not additional_messages:
            # No user message to send
            yield RunFinishedEvent(
                type=EventType.RUN_FINISHED,
                thread_id=run_input.thread_id,
                run_id=run_input.run_id,
            )
            return

        # Create queue for thread-safe communication
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue[tuple[str, Any]] = asyncio.Queue()

        # Generate consistent message ID for this response (used for tracking cumulative content)
        message_id = f"{run_input.thread_id}:{run_input.run_id}"

        def worker():
            """Worker thread to handle synchronous Coze SDK calls.
            
            Uses cozepy SDK's chat.stream() for Coze Chat V3 API.
            Reference: https://www.coze.cn/open/docs/developer_guides/chat_v3
            """
            try:
                # Call Coze Chat V3 stream API via cozepy SDK
                stream_kwargs = {
                    "bot_id": self._bot_id,
                    "user_id": self._user_id,
                    "additional_messages": additional_messages,
                }
                if conversation_id:
                    stream_kwargs["conversation_id"] = conversation_id
                # Tools must be configured in Coze platform (not passed via API):
                # - Server plugins: Auto-executed by Coze (results in message content)
                # - Local plugins: Emit REQUIRES_ACTION event for client execution
                if self._parameters:
                    stream_kwargs["parameters"] = self._parameters
                
                stream = self._coze_client.chat.stream(**stream_kwargs)
                
                # Log logid if available (useful for debugging)
                if hasattr(stream, "response") and hasattr(stream.response, "logid"):
                    logid = stream.response.logid
                    # Could be logged or stored for debugging purposes

                # Process stream events
                # Track event counts for compact logging (only in debug mode)
                if self._debug_mode:
                    event_counter = {}
                    last_event_type = None
                    # Track AG-UI events for compact logging
                    agui_event_counter = {}
                    last_agui_event_type = None
                    text_content_batch_start = False
                
                for coze_event in stream:
                    # DEBUG: Log Coze events with compact counting (controlled by debug_mode)
                    if self._debug_mode and hasattr(coze_event, "event"):
                        event_type = coze_event.event
                        
                        # Count events
                        event_counter[event_type] = event_counter.get(event_type, 0) + 1
                        
                        # Only log when event type changes or for important events
                        should_log = (
                            event_type != last_event_type or
                            event_type != ChatEventType.CONVERSATION_MESSAGE_DELTA
                        )
                        
                        if should_log:
                            # Log summary of previous event type if it was MESSAGE_DELTA
                            if last_event_type == ChatEventType.CONVERSATION_MESSAGE_DELTA:
                                count = event_counter[last_event_type]
                                logger.debug(f"  ... ({count} total MESSAGE_DELTA events)")
                            
                            # Log new event
                            logger.debug(f"[Coze Event] Type: {event_type}")
                            
                            # Show event-specific details
                            if event_type == ChatEventType.CONVERSATION_MESSAGE_DELTA:
                                if hasattr(coze_event, "message"):
                                    msg = coze_event.message
                                    # Show message metadata
                                    msg_role = getattr(msg, "role", "unknown")
                                    msg_type = getattr(msg, "type", "unknown")
                                    logger.debug(f"  Message role={msg_role} type={msg_type}")
                                    
                                    content = getattr(msg, "content", "")
                                    if content:
                                        preview = content[:50] + "..." if len(content) > 50 else content
                                        logger.debug(f"  Content streaming: {preview}")
                            
                            elif event_type == ChatEventType.CONVERSATION_CHAT_REQUIRES_ACTION:
                                logger.debug("  Local Plugin - Needs client execution")
                                if hasattr(coze_event, "data"):
                                    logger.debug(f"  Data: {coze_event.data}")
                            
                            elif event_type == ChatEventType.CONVERSATION_CHAT_COMPLETED:
                                logger.debug("  Chat completed")
                            
                            elif event_type == ChatEventType.CONVERSATION_CHAT_FAILED:
                                logger.warning("  Chat failed")
                                if hasattr(coze_event, "error"):
                                    logger.error(f"  Error: {coze_event.error}")
                            
                            elif event_type == ChatEventType.CONVERSATION_MESSAGE_COMPLETED:
                                # Show completed message details
                                if hasattr(coze_event, "message"):
                                    msg = coze_event.message
                                    msg_role = getattr(msg, "role", "unknown")
                                    msg_type = getattr(msg, "type", "unknown")
                                    content = getattr(msg, "content", "")
                                    content_preview = (content[:30] + "...") if len(content) > 30 else content
                                    logger.debug(f"  Message completed: role={msg_role} type={msg_type} content={content_preview}")
                                else:
                                    logger.debug("  Message completed")
                            
                            last_event_type = event_type
                    
                    # Convert Coze event to AG-UI event(s)
                    # Note: coze_events_to_ag_ui_events may return a list of events
                    ag_ui_events = coze_events_to_ag_ui_events(
                        coze_event,
                        run_input.thread_id,
                        run_input.run_id,
                        message_id=message_id,
                        debug_mode=self._debug_mode,
                    )

                    # Debug: Log conversion result (only for important events)
                    if self._debug_mode and hasattr(coze_event, "event"):
                        if coze_event.event == ChatEventType.CONVERSATION_MESSAGE_COMPLETED:
                            if ag_ui_events:
                                logger.debug(f"[Agent] Converted to {len(ag_ui_events) if isinstance(ag_ui_events, list) else 1} AG-UI event(s)")
                            else:
                                logger.debug(f"[Agent] Conversion returned None (no AG-UI events)")

                    if ag_ui_events:
                        # Debug: Log AG-UI events being emitted (compact for TEXT_MESSAGE_CONTENT)
                        if self._debug_mode:
                            events_to_log = ag_ui_events if isinstance(ag_ui_events, list) else [ag_ui_events]
                            # Group events by type for compact logging
                            for event in events_to_log:
                                event_type = event.type
                                
                                # Count events
                                agui_event_counter[event_type] = agui_event_counter.get(event_type, 0) + 1
                                
                                # Handle high-frequency events specially - batch and summarize
                                # TEXT_MESSAGE_CONTENT and THINKING_TEXT_MESSAGE_CONTENT can be very frequent
                                if event_type in (EventType.TEXT_MESSAGE_CONTENT, EventType.THINKING_TEXT_MESSAGE_CONTENT):
                                    # Log summary of previous event type if switching between different types
                                    if last_agui_event_type and last_agui_event_type not in (EventType.TEXT_MESSAGE_CONTENT, EventType.THINKING_TEXT_MESSAGE_CONTENT):
                                        # Just switched to a high-frequency event type
                                        pass
                                    
                                    # Don't log individual high-frequency events
                                    last_agui_event_type = event_type
                                    continue
                                
                                # If switching away from high-frequency events, log the summary
                                if last_agui_event_type in (EventType.TEXT_MESSAGE_CONTENT, EventType.THINKING_TEXT_MESSAGE_CONTENT):
                                    # Log summary for each type
                                    if EventType.TEXT_MESSAGE_CONTENT in agui_event_counter and agui_event_counter[EventType.TEXT_MESSAGE_CONTENT] > 0:
                                        count = agui_event_counter[EventType.TEXT_MESSAGE_CONTENT]
                                        logger.debug(f"  ... ({count} total TEXT_MESSAGE_CONTENT events)")
                                        agui_event_counter[EventType.TEXT_MESSAGE_CONTENT] = 0  # Reset counter
                                    
                                    if EventType.THINKING_TEXT_MESSAGE_CONTENT in agui_event_counter and agui_event_counter[EventType.THINKING_TEXT_MESSAGE_CONTENT] > 0:
                                        count = agui_event_counter[EventType.THINKING_TEXT_MESSAGE_CONTENT]
                                        logger.debug(f"  ... ({count} total THINKING_TEXT_MESSAGE_CONTENT events)")
                                        agui_event_counter[EventType.THINKING_TEXT_MESSAGE_CONTENT] = 0  # Reset counter
                                
                                # Log other important events
                                logger.debug(f"[AG-UI Event] Emitting: {event_type}")
                                last_agui_event_type = event_type
                        
                        # Handle both single event and list of events
                        if isinstance(ag_ui_events, list):
                            for event in ag_ui_events:
                                loop.call_soon_threadsafe(queue.put_nowait, ("event", event))
                        else:
                            loop.call_soon_threadsafe(queue.put_nowait, ("event", ag_ui_events))

                    # Store chat_id when we receive REQUIRES_ACTION event (for local plugin flow)
                    # This event indicates the chat requires client-side action (local plugin execution)
                    # Reference: https://docs.coze.cn/guides/use_local_plugin
                    # Note: Server-side plugins do NOT emit this event - they are executed automatically by Coze
                    if hasattr(coze_event, "event") and coze_event.event == ChatEventType.CONVERSATION_CHAT_REQUIRES_ACTION:
                        if hasattr(coze_event, "chat"):
                            if hasattr(coze_event.chat, "conversation_id"):
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    ("conversation_id", coze_event.chat.conversation_id),
                                )
                            if hasattr(coze_event.chat, "id"):
                                # Store chat_id for tool output submission
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    ("chat_id", coze_event.chat.id),
                                )

                    # Check if conversation is completed
                    if hasattr(coze_event, "event") and coze_event.event == ChatEventType.CONVERSATION_CHAT_COMPLETED:
                        # Log final summary for high-frequency events if any
                        if self._debug_mode and last_agui_event_type in (EventType.TEXT_MESSAGE_CONTENT, EventType.THINKING_TEXT_MESSAGE_CONTENT):
                            # Log TEXT_MESSAGE_CONTENT summary
                            text_count = agui_event_counter.get(EventType.TEXT_MESSAGE_CONTENT, 0)
                            if text_count > 0:
                                logger.debug(f"  ... ({text_count} total TEXT_MESSAGE_CONTENT events)")
                            
                            # Log THINKING_TEXT_MESSAGE_CONTENT summary
                            thinking_count = agui_event_counter.get(EventType.THINKING_TEXT_MESSAGE_CONTENT, 0)
                            if thinking_count > 0:
                                logger.debug(f"  ... ({thinking_count} total THINKING_TEXT_MESSAGE_CONTENT events)")
                        
                        # Emit TEXT_MESSAGE_END event before completion
                        from .converters import _message_started, TextMessageEndEvent
                        buffer_key = f"{run_input.thread_id}:{run_input.run_id}"
                        if _message_started.get(buffer_key, False):
                            msg_id = message_id or f"{run_input.thread_id}:{run_input.run_id}"
                            end_event = TextMessageEndEvent(
                                type=EventType.TEXT_MESSAGE_END,
                                message_id=msg_id,
                            )
                            loop.call_soon_threadsafe(queue.put_nowait, ("event", end_event))
                            _message_started[buffer_key] = False
                        
                        # Clear content buffer for this run
                        from .converters import _content_buffer
                        buffer_prefix = f"{run_input.thread_id}:{run_input.run_id}"
                        keys_to_remove = [k for k in list(_content_buffer.keys()) if k.startswith(buffer_prefix)]
                        for k in keys_to_remove:
                            del _content_buffer[k]
                        
                        # Store conversation_id and chat_id for next run if available
                        # These are needed for submit_tool_outputs API (local plugin flow)
                        if hasattr(coze_event, "chat"):
                            if hasattr(coze_event.chat, "conversation_id"):
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    ("conversation_id", coze_event.chat.conversation_id),
                                )
                            if hasattr(coze_event.chat, "id"):
                                # Store chat_id for tool output submission
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    ("chat_id", coze_event.chat.id),
                                )
                        
                        # Signal completion (snapshots will be emitted in main loop)
                        loop.call_soon_threadsafe(queue.put_nowait, ("done", None))
                        break
                    
                    # Handle chat failed event
                    if hasattr(coze_event, "event") and coze_event.event == ChatEventType.CONVERSATION_CHAT_FAILED:
                        # Clear message started flag on error
                        from .converters import _message_started
                        buffer_key = f"{run_input.thread_id}:{run_input.run_id}"
                        _message_started[buffer_key] = False
                        
                        # Clear content buffer on error
                        from .converters import _content_buffer
                        buffer_prefix = f"{run_input.thread_id}:{run_input.run_id}"
                        keys_to_remove = [k for k in list(_content_buffer.keys()) if k.startswith(buffer_prefix)]
                        for k in keys_to_remove:
                            del _content_buffer[k]
                        
                        error_msg = "Chat failed"
                        if hasattr(coze_event, "chat") and hasattr(coze_event.chat, "last_error"):
                            error_msg = f"Chat failed: {coze_event.chat.last_error}"
                        loop.call_soon_threadsafe(queue.put_nowait, ("error", Exception(error_msg)))
                        break

            except Exception as exc:
                loop.call_soon_threadsafe(queue.put_nowait, ("error", exc))

        # Start worker thread
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()

        # Process events from queue
        try:
            while True:
                kind, payload = await queue.get()

                if kind == "event":
                    yield payload
                elif kind == "conversation_id":
                    # Store conversation_id in state for next run
                    # This would need to be persisted by the caller
                    pass
                elif kind == "chat_id":
                    # Store chat_id in state for tool output submission
                    # This would need to be persisted by the caller
                    pass
                elif kind == "done":
                    # Emit STEP_FINISHED (AG-UI protocol standard event)
                    from ag_ui.core.events import StepFinishedEvent
                    yield StepFinishedEvent(
                        type=EventType.STEP_FINISHED,
                        step_name="chat",
                    )
                    
                    # Emit RUN_FINISHED (AG-UI protocol standard event)
                    yield RunFinishedEvent(
                        type=EventType.RUN_FINISHED,
                        thread_id=run_input.thread_id,
                        run_id=run_input.run_id,
                    )
                    
                    break
                elif kind == "error":
                    raise payload

        except Exception as e:
            # Emit error event
            yield RunErrorEvent(
                type=EventType.RUN_ERROR,
                thread_id=run_input.thread_id,
                run_id=run_input.run_id,
                message=str(e),
            )
            raise

    async def _handle_tool_outputs_submission(
        self, 
        run_input: RunAgentInput, 
        tool_messages: list
    ) -> AsyncGenerator[BaseEvent, None]:
        """Handle tool output submission for local plugins.
        
        This method is called when the client has executed a local plugin tool
        and returns the result via ToolMessage. We need to submit the result
        to Coze via submit_tool_outputs API.
        
        Reference: https://docs.coze.cn/guides/use_local_plugin
        
        :param run_input: Input data containing tool messages
        :type run_input: RunAgentInput
        :param tool_messages: List of ToolMessage objects from client
        :type tool_messages: list
        :yield: Events from the tool output submission
        :rtype: AsyncGenerator[BaseEvent, None]
        """
        # Get conversation_id and chat_id from state
        # These should have been stored from the previous CONVERSATION_CHAT_REQUIRES_ACTION event
        state = run_input.state or {}
        conversation_id = state.get("conversation_id")
        chat_id = state.get("chat_id")
        
        if not conversation_id or not chat_id:
            # Missing required IDs for tool output submission
            yield RunErrorEvent(
                type=EventType.RUN_ERROR,
                thread_id=run_input.thread_id,
                run_id=run_input.run_id,
                message="Missing conversation_id or chat_id in state. These should be stored from the previous CONVERSATION_CHAT_REQUIRES_ACTION event.",
            )
            return
        
        # Convert ToolMessage to Coze ToolOutput format
        tool_outputs: list[ToolOutput] = []
        for tool_msg in tool_messages:
            tool_call_id = getattr(tool_msg, "tool_call_id", None)
            content = getattr(tool_msg, "content", "")
            
            if tool_call_id:
                # Convert content to string if needed
                if not isinstance(content, str):
                    import json
                    content = json.dumps(content, ensure_ascii=False)
                
                tool_outputs.append(ToolOutput(
                    tool_call_id=tool_call_id,
                    output=content,
                ))
        
        if not tool_outputs:
            yield RunErrorEvent(
                type=EventType.RUN_ERROR,
                thread_id=run_input.thread_id,
                run_id=run_input.run_id,
                message="No valid tool outputs found in ToolMessage objects.",
            )
            return
        
        # Create queue for thread-safe communication
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue[tuple[str, Any]] = asyncio.Queue()
        
        # Generate consistent message ID for this response
        message_id = f"{run_input.thread_id}:{run_input.run_id}"
        
        def worker():
            """Worker thread to handle Coze SDK submit_tool_outputs call."""
            try:
                # Call submit_tool_outputs API with streaming
                # Reference: https://docs.coze.cn/guides/use_local_plugin
                stream = self._coze_client.chat.submit_tool_outputs(
                    conversation_id=conversation_id,
                    chat_id=chat_id,
                    tool_outputs=tool_outputs,
                    stream=True,
                )
                
                # Process stream events (same as chat.stream())
                for coze_event in stream:
                    # Convert Coze event to AG-UI event(s)
                    ag_ui_events = coze_events_to_ag_ui_events(
                        coze_event,
                        run_input.thread_id,
                        run_input.run_id,
                        message_id=message_id,
                        debug_mode=self._debug_mode,
                    )
                    
                    if ag_ui_events:
                        if isinstance(ag_ui_events, list):
                            for event in ag_ui_events:
                                loop.call_soon_threadsafe(queue.put_nowait, ("event", event))
                        else:
                            loop.call_soon_threadsafe(queue.put_nowait, ("event", ag_ui_events))
                    
                    # Check if conversation is completed
                    if hasattr(coze_event, "event") and coze_event.event == ChatEventType.CONVERSATION_CHAT_COMPLETED:
                        from .converters import _message_started, TextMessageEndEvent
                        buffer_key = f"{run_input.thread_id}:{run_input.run_id}"
                        if _message_started.get(buffer_key, False):
                            msg_id = message_id or f"{run_input.thread_id}:{run_input.run_id}"
                            end_event = TextMessageEndEvent(
                                type=EventType.TEXT_MESSAGE_END,
                                message_id=msg_id,
                            )
                            loop.call_soon_threadsafe(queue.put_nowait, ("event", end_event))
                            _message_started[buffer_key] = False
                        
                        # Clear content buffer
                        from .converters import _content_buffer
                        buffer_prefix = f"{run_input.thread_id}:{run_input.run_id}"
                        keys_to_remove = [k for k in list(_content_buffer.keys()) if k.startswith(buffer_prefix)]
                        for k in keys_to_remove:
                            del _content_buffer[k]
                        
                        # Store conversation_id and chat_id for next run
                        if hasattr(coze_event, "chat"):
                            if hasattr(coze_event.chat, "conversation_id"):
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    ("conversation_id", coze_event.chat.conversation_id),
                                )
                            if hasattr(coze_event.chat, "id"):
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    ("chat_id", coze_event.chat.id),
                                )
                        
                        loop.call_soon_threadsafe(queue.put_nowait, ("done", None))
                        break
                    
                    # Handle chat failed event
                    if hasattr(coze_event, "event") and coze_event.event == ChatEventType.CONVERSATION_CHAT_FAILED:
                        from .converters import _message_started, _content_buffer
                        buffer_key = f"{run_input.thread_id}:{run_input.run_id}"
                        _message_started[buffer_key] = False
                        
                        buffer_prefix = f"{run_input.thread_id}:{run_input.run_id}"
                        keys_to_remove = [k for k in list(_content_buffer.keys()) if k.startswith(buffer_prefix)]
                        for k in keys_to_remove:
                            del _content_buffer[k]
                        
                        error_msg = "Chat failed"
                        if hasattr(coze_event, "chat") and hasattr(coze_event.chat, "last_error"):
                            error_msg = f"Chat failed: {coze_event.chat.last_error}"
                        loop.call_soon_threadsafe(queue.put_nowait, ("error", Exception(error_msg)))
                        break
                        
            except Exception as exc:
                loop.call_soon_threadsafe(queue.put_nowait, ("error", exc))
        
        # Start worker thread
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        
        # Process events from queue
        try:
            while True:
                kind, payload = await queue.get()
                
                if kind == "event":
                    yield payload
                elif kind == "conversation_id":
                    # Store conversation_id in state for next run
                    pass
                elif kind == "chat_id":
                    # Store chat_id in state for next tool output submission
                    pass
                elif kind == "done":
                    # Emit STEP_FINISHED
                    from ag_ui.core.events import StepFinishedEvent
                    yield StepFinishedEvent(
                        type=EventType.STEP_FINISHED,
                        step_name="chat",
                    )
                    
                    # Emit RUN_FINISHED
                    yield RunFinishedEvent(
                        type=EventType.RUN_FINISHED,
                        thread_id=run_input.thread_id,
                        run_id=run_input.run_id,
                    )
                    
                    break
                elif kind == "error":
                    raise payload
                    
        except Exception as e:
            yield RunErrorEvent(
                type=EventType.RUN_ERROR,
                thread_id=run_input.thread_id,
                run_id=run_input.run_id,
                message=str(e),
            )
            raise

    def destroy(self) -> None:
        """Clean up resources used by the agent.

        This method releases any resources held by the Coze client
        and clears callbacks/buffers.
        """
        # Call parent cleanup (clears callbacks and buffers)
        super().destroy()

        # Coze client doesn't need explicit cleanup
        # but we can add it here if needed in the future

