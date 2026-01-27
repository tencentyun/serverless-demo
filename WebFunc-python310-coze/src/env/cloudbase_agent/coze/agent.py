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

    **Optional Parameters:**
    
    base_url : str, optional
        Coze API base URL. Defaults to 'https://api.coze.cn' (China).
        Use 'https://api.coze.com' for international.
        Can be set via COZE_API_BASE environment variable.
    fix_event_ids : bool, default=True
        Enable automatic event ID fixing for proper tracking.
    debug_mode : bool, default=False
        Enable debug logging for troubleshooting.

    **Custom User Variables (via forwarded_props):**
    
    Coze supports custom user variables that can be passed dynamically via
    ``forwarded_props`` in the run input. The entire ``forwarded_props`` dict
    is passed directly to Coze as ``parameters``, enabling transparent passthrough
    of custom variables for workflow/dialog flow start nodes.
    
    Example::
    
        run_input = RunAgentInput(
            messages=[...],
            forwarded_props={
                "user": [{"user_id": "123456", "user_name": "John"}]
            }
        )
    
    See: https://www.coze.cn/open/docs/developer_guides/chat_v3

    Raises
    ------
    ValueError
        If any required parameter (api_token, bot_id) is missing or invalid.

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
            # Optional
            base_url="https://api.coze.cn",
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
        # Optional parameters (with default values)
        base_url: Optional[str] = None,
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
        base_url : str, optional
            Coze API base URL. Defaults to 'https://api.coze.cn'.
        fix_event_ids : bool, default=True
            Enable event ID fixing.
        debug_mode : bool, default=False
            Enable debug logging.

        Raises
        ------
        ValueError
            If api_token or bot_id are missing or invalid.
        
        Note
        ----
        user_id must be provided per-request via forwarded_props.user_id.
        It cannot be set during initialization.
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

    def _get_user_id(self, run_input: RunAgentInput) -> str:
        """Get user_id from run_input.forwarded_props.user_id.
        
        Gateway extracts user_id from Authorization header (JWT `sub` field) and writes to 
        forwarded_props.user_id. Gateway value is trusted and should override client-provided 
        value (client value may be forged).
        
        This method validates user_id before calling Coze SDK to provide clear error messages.
        If user_id is missing or empty, Coze SDK would also raise an error, but our validation
        provides more helpful error messages.
        
        :param run_input: Input data for the agent execution
        :type run_input: RunAgentInput
        :return: User ID to use for Coze API
        :rtype: str
        :raises ValueError: If user_id is not provided in forwarded_props.user_id or is empty string
        """
        forwarded_props = run_input.forwarded_props or {}
        
        # Get user_id from forwarded_props.user_id (from gateway JWT or request)
        if "user_id" not in forwarded_props:
            raise ValueError(
                "user_id is required but not provided in forwarded_props.user_id. "
                "Please ensure the gateway extracts user_id from JWT 'sub' field and writes it to "
                "forwarded_props.user_id, or provide it in the request. "
                f"Refer to: {self._DOCS_URL}"
            )
        
        user_id = forwarded_props["user_id"]
        
        # Validate user_id is not empty
        if not user_id or not isinstance(user_id, str) or not user_id.strip():
            raise ValueError(
                "user_id in forwarded_props.user_id is empty or invalid. "
                "Coze SDK requires a non-empty user_id. "
                "Please ensure JWT 'sub' field is not empty or provide a valid user_id. "
                f"Refer to: {self._DOCS_URL}"
            )
        
        if self._debug_mode:
            logger.debug(f"[CozeAgent] Using user_id from forwarded_props.user_id: {user_id.strip()}")
        
        return user_id.strip()

    async def _run_internal(self, run_input: RunAgentInput) -> AsyncGenerator[BaseEvent, None]:
        """Internal run logic for Coze chat execution.

        This method implements intelligent conversation_id handling:
        1. First tries to use thread_id as conversation_id (for continuing conversations)
        2. If that fails (invalid ID), retries without conversation_id (creates new conversation)
        3. Uses Coze's returned conversation_id as the actual thread_id for all events

        :param run_input: Input data for the agent execution
        :type run_input: RunAgentInput
        :yield: Events from the chat execution
        :rtype: AsyncGenerator[BaseEvent, None]
        """
        # Get dynamic user_id from run_input (supports per-request user identity)
        dynamic_user_id = self._get_user_id(run_input)
        
        # Check if this is a tool output submission (local plugin flow)
        # If messages contain ToolMessage, it means client has executed the tool
        # and we need to submit the result to Coze via submit_tool_outputs API
        tool_messages = [
            msg for msg in run_input.messages 
            if getattr(msg, "role", None) == "tool" and hasattr(msg, "tool_call_id")
        ]
        
        if tool_messages:
            # For tool output submission, use original thread_id
            # Emit run started event
            yield RunStartedEvent(
                type=EventType.RUN_STARTED,
                thread_id=run_input.thread_id,
                run_id=run_input.run_id,
            )
            # Emit STEP_STARTED event
            from ag_ui.core.events import StepStartedEvent
            yield StepStartedEvent(
                type=EventType.STEP_STARTED,
                step_name="chat",
            )
            # This is a tool output submission for local plugin
            # Reference: https://docs.coze.cn/guides/use_local_plugin
            async for event in self._handle_tool_outputs_submission(run_input, tool_messages):
                yield event
            return

        # Prepare inputs for Coze API (normal chat flow)
        coze_inputs = coze_prepare_inputs(run_input)

        additional_messages = coze_inputs.get("additional_messages", [])
        # Get custom user variables (forwarded_props.parameters)
        coze_parameters = coze_inputs.get("parameters")

        if not additional_messages:
            # No user message to send
            yield RunStartedEvent(
                type=EventType.RUN_STARTED,
                thread_id=run_input.thread_id,
                run_id=run_input.run_id,
            )
            yield RunFinishedEvent(
                type=EventType.RUN_FINISHED,
                thread_id=run_input.thread_id,
                run_id=run_input.run_id,
            )
            return

        # Use thread_id directly as the initial conversation_id
        # Client should pass the Coze conversation_id from previous response as thread_id
        # If it's invalid (not a Coze ID), we'll retry without it
        initial_conversation_id = run_input.thread_id

        # Create queue for thread-safe communication
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue[tuple[str, Any]] = asyncio.Queue()

        def worker(conversation_id_to_use: str | None):
            """Worker thread to handle synchronous Coze SDK calls.
            
            Uses cozepy SDK's chat.stream() for Coze Chat V3 API.
            Reference: https://www.coze.cn/open/docs/developer_guides/chat_v3
            
            :param conversation_id_to_use: The conversation_id to use, or None to create new
            """
            try:
                # Call Coze Chat V3 stream API via cozepy SDK
                # Use dynamic user_id from run_input (supports per-request user identity)
                stream_kwargs = {
                    "bot_id": self._bot_id,
                    "user_id": dynamic_user_id,  # Use dynamic user_id instead of self._user_id
                    "additional_messages": additional_messages,
                }
                if conversation_id_to_use:
                    stream_kwargs["conversation_id"] = conversation_id_to_use
                # Pass custom user variables to Coze
                if coze_parameters:
                    stream_kwargs["parameters"] = coze_parameters
                
                # Debug: Log the full request parameters
                if self._debug_mode:
                    logger.debug(f"[CozeAgent] Coze API request parameters:")
                    logger.debug(f"  bot_id: {self._bot_id}")
                    logger.debug(f"  user_id: {dynamic_user_id} (from forwarded_props.user_id)")
                    logger.debug(f"  conversation_id: {conversation_id_to_use}")
                    logger.debug(f"  parameters (from forwarded_props.parameters): {coze_parameters}")
                
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
                
                # Flag to track if we've sent the actual_thread_id
                actual_thread_id_sent = False
                
                for coze_event in stream:
                    # Handle CONVERSATION_CHAT_CREATED event to get the actual conversation_id
                    # This is the first event in the stream and contains the Coze-generated conversation_id
                    if hasattr(coze_event, "event") and coze_event.event == ChatEventType.CONVERSATION_CHAT_CREATED:
                        if hasattr(coze_event, "chat") and hasattr(coze_event.chat, "conversation_id"):
                            actual_conv_id = coze_event.chat.conversation_id
                            if self._debug_mode:
                                logger.debug(f"[CozeAgent] Got conversation_id from chat.created: {actual_conv_id}")
                            # Send the actual thread_id (Coze's conversation_id) to the main loop
                            loop.call_soon_threadsafe(
                                queue.put_nowait,
                                ("actual_thread_id", actual_conv_id),
                            )
                            actual_thread_id_sent = True
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
                    # Use actual_thread_id if available (from shared_state)
                    current_thread_id = shared_state.get("thread_id", run_input.thread_id)
                    current_message_id = f"{current_thread_id}:{run_input.run_id}"
                    ag_ui_events = coze_events_to_ag_ui_events(
                        coze_event,
                        current_thread_id,
                        run_input.run_id,
                        message_id=current_message_id,
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
                        current_thread_id = shared_state.get("thread_id", run_input.thread_id)
                        buffer_key = f"{current_thread_id}:{run_input.run_id}"
                        if _message_started.get(buffer_key, False):
                            msg_id = f"{current_thread_id}:{run_input.run_id}"
                            end_event = TextMessageEndEvent(
                                type=EventType.TEXT_MESSAGE_END,
                                message_id=msg_id,
                            )
                            loop.call_soon_threadsafe(queue.put_nowait, ("event", end_event))
                            _message_started[buffer_key] = False
                        
                        # Clear content buffer for this run
                        from .converters import _content_buffer
                        current_thread_id = shared_state.get("thread_id", run_input.thread_id)
                        buffer_prefix = f"{current_thread_id}:{run_input.run_id}"
                        keys_to_remove = [k for k in list(_content_buffer.keys()) if k.startswith(buffer_prefix)]
                        for k in keys_to_remove:
                            del _content_buffer[k]
                        
                        # Store conversation_id and chat_id for next run if available
                        # These are needed for submit_tool_outputs API (local plugin flow)
                        if self._debug_mode:
                            logger.debug(f"  coze_event has chat: {hasattr(coze_event, 'chat')}")
                            if hasattr(coze_event, "chat"):
                                logger.debug(f"  coze_event.chat: {coze_event.chat}")
                        if hasattr(coze_event, "chat"):
                            if hasattr(coze_event.chat, "conversation_id"):
                                conv_id = coze_event.chat.conversation_id
                                if self._debug_mode:
                                    logger.debug(f"  Coze returned conversation_id: {conv_id}")
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    ("conversation_id", conv_id),
                                )
                            if hasattr(coze_event.chat, "id"):
                                chat_id = coze_event.chat.id
                                if self._debug_mode:
                                    logger.debug(f"  Coze returned chat_id: {chat_id}")
                                # Store chat_id for tool output submission
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    ("chat_id", chat_id),
                                )
                        
                        # Signal completion (snapshots will be emitted in main loop)
                        loop.call_soon_threadsafe(queue.put_nowait, ("done", None))
                        break
                    
                    # Handle chat failed event
                    if hasattr(coze_event, "event") and coze_event.event == ChatEventType.CONVERSATION_CHAT_FAILED:
                        # Clear message started flag on error
                        from .converters import _message_started
                        current_thread_id = shared_state.get("thread_id", run_input.thread_id)
                        buffer_key = f"{current_thread_id}:{run_input.run_id}"
                        _message_started[buffer_key] = False
                        
                        # Clear content buffer on error
                        from .converters import _content_buffer
                        buffer_prefix = f"{current_thread_id}:{run_input.run_id}"
                        keys_to_remove = [k for k in list(_content_buffer.keys()) if k.startswith(buffer_prefix)]
                        for k in keys_to_remove:
                            del _content_buffer[k]
                        
                        error_msg = "Chat failed"
                        if hasattr(coze_event, "chat") and hasattr(coze_event.chat, "last_error"):
                            error_msg = f"Chat failed: {coze_event.chat.last_error}"
                        loop.call_soon_threadsafe(queue.put_nowait, ("error", Exception(error_msg)))
                        break

            except Exception as exc:
                # Check if this is an invalid conversation_id error that should trigger retry
                # We must be strict: require BOTH error code AND error message to match
                # 
                # Retry conditions (must satisfy ALL):
                # 1. Error code is 4000 (format error only)
                # 2. Error message mentions "conversation_id"
                # 3. Error message contains specific validation error text
                #
                # Error patterns that trigger retry (format errors only):
                # - code=4000 + "conversation_id" + "not a valid int64": non-numeric string (format error)
                # - code=4000 + "conversation_id" + "must be greater than 0": out-of-range (format error)
                #
                # Error patterns that should NOT retry (fail immediately):
                # - code=4101 + "conversation_id" + "does not have permission": permission error
                #   Reason: User may have provided another user's conversation_id. Should fail to
                #   prevent unauthorized access attempts and inform user of the issue.
                #
                # - code=4200 + "conversation_id" + "does not exist": resource not found
                #   Reason: If user provided a conversation_id that doesn't exist, they should know
                #   about it rather than silently creating a new conversation. This could indicate:
                #   1. User made a typo in conversation_id
                #   2. Conversation was deleted
                #   3. Conversation belongs to different user/environment
                #   In all cases, silently creating a new conversation would be unexpected behavior.
                #
                # Industry best practices (HTTP status codes):
                # - 400 (Bad Request): Fix request format before retrying - format errors can be retried
                # - 401/403 (Unauthorized/Forbidden): Get fresh credentials - permission errors should fail
                # - 404 (Not Found): Resource doesn't exist - should fail unless resource may appear later
                error_str = str(exc).lower()
                
                # Check error code (only 4000 for format errors)
                has_code_4000 = "code: 4000" in error_str or "code=4000" in error_str
                
                # Check if error mentions conversation_id field
                mentions_conversation_id = "conversation_id" in error_str
                
                # Check for specific error messages (format errors only)
                has_int64_error = "not a valid int64" in error_str
                has_range_error = "must be greater than 0" in error_str
                
                # Determine if should retry: only format errors (4000) should retry
                # Permission errors (4101) and not found errors (4200) should fail immediately
                should_retry = mentions_conversation_id and has_code_4000 and (has_int64_error or has_range_error)
                
                if should_retry:
                    # Signal that we need to retry without conversation_id
                    if self._debug_mode:
                        logger.debug(f"[CozeAgent] conversation_id error, will retry: {str(exc)[:100]}")
                    loop.call_soon_threadsafe(queue.put_nowait, ("retry_without_conversation_id", exc))
                else:
                    loop.call_soon_threadsafe(queue.put_nowait, ("error", exc))

        # Track the actual thread_id (from Coze's conversation_id)
        actual_thread_id: str | None = None
        run_started_emitted = False
        retry_count = 0  # Track retry attempts (max 1 retry allowed)
        
        # Use thread-safe dict to share actual_thread_id with worker thread
        # This allows message_id to be updated when actual_thread_id is received
        shared_state: dict[str, Any] = {"thread_id": run_input.thread_id}
        
        # Generate consistent message ID for this response
        # Will be updated when actual_thread_id is received
        def get_message_id() -> str:
            """Get message_id using actual_thread_id if available, otherwise use run_input.thread_id."""
            thread_id = shared_state.get("thread_id", run_input.thread_id)
            return f"{thread_id}:{run_input.run_id}"
        
        message_id = get_message_id()

        def start_worker(conv_id: str | None):
            """Start worker thread with given conversation_id."""
            thread = threading.Thread(target=worker, args=(conv_id,), daemon=True)
            thread.start()
            return thread

        # First attempt: try with initial_conversation_id
        if self._debug_mode:
            logger.debug(f"[CozeAgent] First attempt with conversation_id: {initial_conversation_id}")
        start_worker(initial_conversation_id)

        # Process events from queue
        try:
            while True:
                kind, payload = await queue.get()

                if kind == "actual_thread_id":
                    # Got the actual conversation_id from Coze
                    actual_thread_id = payload
                    # Update shared_state so worker thread can use it for message_id
                    shared_state["thread_id"] = actual_thread_id
                    # Update message_id to use actual_thread_id
                    message_id = get_message_id()
                    if self._debug_mode:
                        logger.debug(f"[CozeAgent] Using actual_thread_id: {actual_thread_id}")
                        logger.debug(f"[CozeAgent] Updated message_id: {message_id}")
                    
                    # Now we can emit RUN_STARTED with the correct thread_id
                    if not run_started_emitted:
                        yield RunStartedEvent(
                            type=EventType.RUN_STARTED,
                            thread_id=actual_thread_id,
                            run_id=run_input.run_id,
                        )
                        # Emit STEP_STARTED event
                        from ag_ui.core.events import StepStartedEvent
                        yield StepStartedEvent(
                            type=EventType.STEP_STARTED,
                            step_name="chat",
                        )
                        run_started_emitted = True
                
                elif kind == "retry_without_conversation_id":
                    # Invalid conversation_id, retry without it (max 1 retry)
                    if retry_count >= 1:
                        # Already retried once, don't retry again
                        original_error = payload  # The original exception
                        if self._debug_mode:
                            logger.debug(f"[CozeAgent] Max retry reached, raising error")
                        raise original_error if original_error else Exception("conversation_id retry failed")
                    
                    retry_count += 1
                    if self._debug_mode:
                        logger.debug(f"[CozeAgent] Invalid conversation_id, retrying without it (attempt {retry_count})...")
                    # Start fresh without conversation_id
                    start_worker(None)
                
                elif kind == "event":
                    # Ensure RUN_STARTED was emitted before any other events
                    if not run_started_emitted and actual_thread_id:
                        yield RunStartedEvent(
                            type=EventType.RUN_STARTED,
                            thread_id=actual_thread_id,
                            run_id=run_input.run_id,
                        )
                        from ag_ui.core.events import StepStartedEvent
                        yield StepStartedEvent(
                            type=EventType.STEP_STARTED,
                            step_name="chat",
                        )
                        run_started_emitted = True
                    yield payload
                
                elif kind == "conversation_id":
                    # This is the conversation_id from completed/requires_action events
                    # We already have actual_thread_id from chat.created
                    pass
                
                elif kind == "chat_id":
                    # Store chat_id in state for tool output submission
                    pass
                
                elif kind == "done":
                    # Use actual_thread_id if available, otherwise fall back to run_input.thread_id
                    final_thread_id = actual_thread_id or run_input.thread_id
                    
                    # Emit STEP_FINISHED (AG-UI protocol standard event)
                    from ag_ui.core.events import StepFinishedEvent
                    yield StepFinishedEvent(
                        type=EventType.STEP_FINISHED,
                        step_name="chat",
                    )
                    
                    # Emit RUN_FINISHED (AG-UI protocol standard event)
                    yield RunFinishedEvent(
                        type=EventType.RUN_FINISHED,
                        thread_id=final_thread_id,
                        run_id=run_input.run_id,
                    )
                    
                    break
                
                elif kind == "error":
                    raise payload

        except Exception as e:
            # Use actual_thread_id if available for error event
            final_thread_id = actual_thread_id or run_input.thread_id
            # Emit error event
            yield RunErrorEvent(
                type=EventType.RUN_ERROR,
                thread_id=final_thread_id,
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
        
        # Use conversation_id (actual thread_id) for message_id generation
        # conversation_id is the actual Coze conversation_id stored from previous run
        actual_thread_id = conversation_id  # This is the actual thread_id from Coze
        message_id = f"{actual_thread_id}:{run_input.run_id}"
        
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
                    # Use actual_thread_id (conversation_id) instead of run_input.thread_id
                    ag_ui_events = coze_events_to_ag_ui_events(
                        coze_event,
                        actual_thread_id,
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
                        buffer_key = f"{actual_thread_id}:{run_input.run_id}"
                        if _message_started.get(buffer_key, False):
                            msg_id = message_id
                            end_event = TextMessageEndEvent(
                                type=EventType.TEXT_MESSAGE_END,
                                message_id=msg_id,
                            )
                            loop.call_soon_threadsafe(queue.put_nowait, ("event", end_event))
                            _message_started[buffer_key] = False
                        
                        # Clear content buffer
                        from .converters import _content_buffer
                        buffer_prefix = f"{actual_thread_id}:{run_input.run_id}"
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
                        buffer_key = f"{actual_thread_id}:{run_input.run_id}"
                        _message_started[buffer_key] = False
                        
                        buffer_prefix = f"{actual_thread_id}:{run_input.run_id}"
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
                    # TODO: Implement proper state management for multi-turn conversations
                    pass
                elif kind == "chat_id":
                    # Store chat_id in state for next tool output submission
                    # TODO: Implement proper state management for multi-turn conversations
                    pass
                elif kind == "done":
                    # Emit STEP_FINISHED
                    from ag_ui.core.events import StepFinishedEvent
                    yield StepFinishedEvent(
                        type=EventType.STEP_FINISHED,
                        step_name="chat",
                    )
                    
                    # Emit RUN_FINISHED
                    # Use actual_thread_id (conversation_id) instead of run_input.thread_id
                    yield RunFinishedEvent(
                        type=EventType.RUN_FINISHED,
                        thread_id=actual_thread_id,
                        run_id=run_input.run_id,
                    )
                    
                    break
                elif kind == "error":
                    raise payload
                    
        except Exception as e:
            # Use actual_thread_id if available, otherwise fall back to run_input.thread_id
            error_thread_id = actual_thread_id or run_input.thread_id
            yield RunErrorEvent(
                type=EventType.RUN_ERROR,
                thread_id=error_thread_id,
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

