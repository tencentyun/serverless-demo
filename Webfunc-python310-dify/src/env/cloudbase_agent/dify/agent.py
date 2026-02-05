#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dify Agent Implementation.

This module provides the Dify agent implementation that extends the base
Cloudbase Agent agent class. It handles agent instantiation and ensures proper
integration with the Cloudbase Agent framework through Dify chat API.
"""

import asyncio
import json
import logging
import os
import threading
import uuid
from typing import Any, AsyncGenerator, Dict, Optional

from ag_ui.core import BaseEvent, EventType, RunAgentInput
from ag_ui.core.events import (
    RunErrorEvent,
    RunFinishedEvent,
    RunStartedEvent,
    StepFinishedEvent,
    StepStartedEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    TextMessageStartEvent,
)

import httpx

from cloudbase_agent.base_agent import BaseAgent
from .converters import dify_events_to_ag_ui_events, dify_prepare_inputs

# Configure logging
logger = logging.getLogger(__name__)


class DifyAgent(BaseAgent):
    """Dify Agent implementation extending BaseAgent.

    This class wraps Dify chat API and provides a consistent interface
    following the Cloudbase Agent agent pattern.

    Parameters
    ----------
    **Required Parameters:**
    
    name : str
        Human-readable name for the agent.
    description : str
        Detailed description of the agent's purpose and capabilities.
    api_key : str
        Dify API key. Set via DIFY_API_KEY environment variable
        or pass directly. Get API key from Dify Studio -> API Access.
    base_url : str, optional
        Dify API base URL. Defaults to 'https://api.dify.ai/v1'.
        Can be set via DIFY_API_BASE environment variable.

    **Optional Parameters:**
    
    fix_event_ids : bool, default=True
        Enable automatic event ID fixing for proper tracking.
    debug_mode : bool, default=False
        Enable debug logging for troubleshooting.

    Raises
    ------
    ValueError
        If any required parameter (api_key) is missing or invalid.

    Example
    -------
    ::

        from cloudbase_agent.dify import DifyAgent

        agent = DifyAgent(
            # Required
            name="DifyBot",
            description="A helpful Dify assistant",
            api_key="app-xxxxx",
            # Optional
            base_url="https://api.dify.ai/v1",
        )

    Note
    ----
    This class does NOT read environment variables. All configuration
    must be passed explicitly from the caller. For environment variable
    handling, see the examples in `examples/dify/agent.py`.

    See Also
    --------
    Dify Chat API: https://docs.dify.ai/api-reference/chat/send-chat-message
    """

    # Documentation URL for error messages
    _DOCS_URL = "https://docs.dify.ai/api-reference/chat/send-chat-message"

    def __init__(
        self,
        # Required parameters (no default values)
        name: str,
        description: str,
        api_key: str,
        # Optional parameters (with default values)
        base_url: Optional[str] = None,
        fix_event_ids: bool = True,
        debug_mode: bool = False,
    ):
        """Initialize the Dify agent.

        All required parameters must be provided explicitly. This class does not
        read environment variables - configuration should be handled in the
        application/example layer.

        Parameters
        ----------
        name : str
            **[Required]** Human-readable name for the agent.
        description : str
            **[Required]** Detailed description of the agent's purpose.
        api_key : str
            **[Required]** Dify API key (DIFY_API_KEY).
        base_url : str, optional
            Dify API base URL. Defaults to 'https://api.dify.ai/v1'.
        fix_event_ids : bool, default=True
            Enable event ID fixing.
        debug_mode : bool, default=False
            Enable debug logging.

        Raises
        ------
        ValueError
            If api_key is missing or invalid.
        """
        # Validate all required parameters with user-friendly error messages
        if not api_key or not isinstance(api_key, str) or not api_key.strip():
            raise ValueError(
                "DIFY_API_KEY is required but not provided or empty. "
                "Please set the DIFY_API_KEY environment variable or pass api_key parameter. "
                f"Refer to: {self._DOCS_URL}"
            )

        # Use default base_url if not provided
        final_base_url = base_url or os.environ.get("DIFY_API_BASE", "https://api.dify.ai/v1")
        if not isinstance(final_base_url, str) or not final_base_url.strip():
            raise ValueError(
                "DIFY_API_BASE must be a non-empty string if provided. "
                f"Refer to: {self._DOCS_URL}"
            )

        # Initialize base class
        super().__init__(name=name, description=description, agent=None)

        # Store all parameters directly - no environment variable reading
        self._api_key = api_key.strip()
        self._base_url = final_base_url.strip().rstrip("/")
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
        """Execute the Dify agent with the given input.

        This method manages the Dify chat API execution and converts Dify events
        to Cloudbase Agent events.

        :param run_input: Input data for the agent execution
        :type run_input: RunAgentInput

        :yield: Events representing the agent's execution progress
        :rtype: AsyncGenerator[BaseEvent, None]

        Example:
            Running the agent::

                from ag_ui.core import RunAgentInput

                agent = DifyAgent(name="DifyBot", description="...", ...)

                run_input = RunAgentInput(
                    messages=[{"role": "user", "content": "Hello"}],
                    run_id="run-123",
                    thread_id="thread-456",
                    state={},
                    context=[],
                    tools=[],
                    forwarded_props={"user": "user-123"}
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
        """Internal run logic for Dify chat execution.

        This method implements intelligent conversation_id handling:
        1. First tries to use thread_id as conversation_id (for continuing conversations)
        2. If that fails (invalid ID format), retries without conversation_id (creates new conversation)
        3. Uses Dify's returned conversation_id as the actual thread_id for all events

        :param run_input: Input data for the agent execution
        :type run_input: RunAgentInput
        :yield: Events from the chat execution
        :rtype: AsyncGenerator[BaseEvent, None]
        """
        # Prepare inputs for Dify API (strict mode may raise ValueError)
        try:
            dify_inputs = dify_prepare_inputs(run_input)
        except ValueError as e:
            yield RunErrorEvent(
                type=EventType.RUN_ERROR,
                thread_id=run_input.thread_id or "",
                run_id=run_input.run_id,
                message=str(e),
            )
            return

        # Get user identifier (required by Dify)
        user_id = dify_inputs.get("user", "")
        if not user_id:
            yield RunErrorEvent(
                type=EventType.RUN_ERROR,
                thread_id=run_input.thread_id or "",
                run_id=run_input.run_id,
                message=(
                    "User identifier is required. "
                    "Provide it in forwarded_props.user, or ensure the gateway extracts it from "
                    "the Authorization header (e.g. JWT 'sub') and writes it to forwarded_props.user."
                ),
            )
            return

        # Get response_mode (defaults to streaming)
        response_mode = dify_inputs.get("response_mode", "streaming")

        # Use thread_id directly as the initial conversation_id
        # Client should pass the Dify conversation_id from previous response as thread_id
        # If it's invalid (not a Dify ID), we'll retry without it
        initial_conversation_id = run_input.thread_id

        # Create queue for thread-safe communication
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue[tuple[str, Any]] = asyncio.Queue()

        # Use thread-safe dict to share actual_thread_id with worker thread
        shared_state: dict[str, Any] = {"thread_id": run_input.thread_id or ""}

        def worker(conversation_id_to_use: str | None):
            """Worker thread to handle synchronous HTTP requests to Dify API.
            
            Uses httpx to directly call Dify Chat API.
            Reference: https://docs.dify.ai/api-reference/chat/send-chat-message

            :param conversation_id_to_use: The conversation_id to use, or None to create new
            """
            try:
                # Build request payload
                request_payload: Dict[str, Any] = {
                    "query": dify_inputs["query"],
                    "user": user_id,
                    "inputs": dify_inputs.get("inputs", {}),
                    "response_mode": response_mode,
                }

                # Add conversation_id if provided
                if conversation_id_to_use:
                    request_payload["conversation_id"] = conversation_id_to_use

                # trace_id: Dify supports Header (X-Trace-Id), Query, or Body; we set both header and body
                # so logs show full body per doc, and header has highest priority per Dify API.
                if run_input.run_id:
                    request_payload["trace_id"] = run_input.run_id

                # Add optional parameters
                if "auto_generate_name" in dify_inputs:
                    request_payload["auto_generate_name"] = dify_inputs["auto_generate_name"]

                if "files" in dify_inputs:
                    request_payload["files"] = dify_inputs["files"]

                # Prepare HTTP headers
                headers = {
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                }
                # X-Trace-Id header: highest priority per Dify API doc (Header > Query > Body)
                if run_input.run_id:
                    headers["X-Trace-Id"] = run_input.run_id

                # Debug: Log full request body and headers before calling Dify
                if self._debug_mode:
                    logger.debug("[DifyAgent] Dify API request body (full):\n%s", json.dumps(request_payload, indent=2, ensure_ascii=False))
                    if run_input.run_id:
                        logger.debug("[DifyAgent] Dify API request headers: X-Trace-Id (from run_id): %s", run_input.run_id)

                # Call Dify API using httpx
                with httpx.Client(timeout=60.0) as client:
                    if response_mode == "streaming":
                        # Streaming mode: SSE response
                        url = f"{self._base_url}/chat-messages"
                        with client.stream(
                            "POST",
                            url,
                            json=request_payload,
                            headers=headers,
                        ) as response:
                            # Check status before parsing stream
                            # For streaming responses, we need to check status first
                            # and read error content if needed before raising exception
                            if response.status_code >= 400:
                                # Read error response content before raising exception
                                error_content = b""
                                error_code = ""
                                error_message = f"HTTP {response.status_code}"
                                
                                try:
                                    # Read error response with limit to avoid blocking
                                    # Most error responses are small, so limit to first 64KB
                                    max_error_size = 64 * 1024  # 64KB
                                    chunk_count = 0
                                    max_chunks = 100  # Limit number of chunks to read
                                    
                                    for chunk in response.iter_bytes():
                                        error_content += chunk
                                        chunk_count += 1
                                        # Stop reading if we've read enough or too many chunks
                                        if len(error_content) >= max_error_size or chunk_count >= max_chunks:
                                            break
                                    
                                    if error_content:
                                        error_text = error_content.decode("utf-8", errors="replace")
                                        # Try to parse as JSON
                                        try:
                                            error_data = json.loads(error_text)
                                            error_code = error_data.get("code", "")
                                            error_message = error_data.get("message", error_text)
                                        except json.JSONDecodeError:
                                            # Not JSON, use raw text
                                            error_message = error_text.strip() or error_message
                                    
                                    # Store parsed error info in response object for exception handler
                                    response._parsed_error = {
                                        "code": error_code,
                                        "message": error_message,
                                        "status_code": response.status_code,
                                    }
                                    
                                except Exception as e:
                                    # If reading fails, store generic error
                                    response._parsed_error = {
                                        "code": "",
                                        "message": f"Failed to read error response: {str(e)}",
                                        "status_code": response.status_code,
                                    }
                                
                                # Raise HTTPStatusError with parsed error info
                                # Don't call raise_for_status() as we've already read the stream
                                from httpx import HTTPStatusError
                                parsed_error = getattr(response, "_parsed_error", {})
                                raise HTTPStatusError(
                                    parsed_error.get("message", f"HTTP {response.status_code}"),
                                    request=response.request,
                                    response=response,
                                )
                            
                            # Track actual conversation_id from first event
                            actual_conversation_id: Optional[str] = None
                            actual_conversation_id_sent = False
                            # Fold repeated agent_message in debug logs
                            consecutive_agent_message_count = 0

                            # Parse SSE stream
                            for line in response.iter_lines():
                                if not line.strip():
                                    continue

                                # Parse SSE format: "data: {...}"
                                if line.startswith("data: "):
                                    data_str = line[6:].strip()  # Remove "data: " prefix
                                    if not data_str or data_str == "[DONE]":
                                        continue

                                    try:
                                        event_data = json.loads(data_str)
                                    except json.JSONDecodeError:
                                        if self._debug_mode:
                                            logger.debug(f"[DifyAgent] Skipping invalid JSON: {data_str[:50]}")
                                        continue

                                    # Extract conversation_id from first event
                                    if not actual_conversation_id_sent and "conversation_id" in event_data:
                                        actual_conv_id = event_data["conversation_id"]
                                        if actual_conv_id:
                                            actual_conversation_id = actual_conv_id
                                            loop.call_soon_threadsafe(
                                                queue.put_nowait,
                                                ("actual_thread_id", actual_conv_id),
                                            )
                                            actual_conversation_id_sent = True

                                    # Convert Dify event to AG-UI event(s)
                                    current_thread_id = shared_state.get("thread_id", run_input.thread_id or "")
                                    current_message_id = f"{current_thread_id}:{run_input.run_id}"
                                    
                                    event_type = event_data.get("event")

                                    # Debug: Log raw Dify event; fold consecutive agent_message to reduce log lines
                                    if self._debug_mode:
                                        if event_type == "agent_message":
                                            consecutive_agent_message_count += 1
                                            if consecutive_agent_message_count == 1:
                                                logger.debug(
                                                    f"[DifyAgent] Raw Dify event received: "
                                                    f"event={event_type}, "
                                                    f"conversation_id={event_data.get('conversation_id')}, "
                                                    f"message_id={event_data.get('message_id')}, "
                                                    f"task_id={event_data.get('task_id')}"
                                                )
                                        else:
                                            if consecutive_agent_message_count > 1:
                                                logger.debug(
                                                    "[DifyAgent] (%d more agent_message events)",
                                                    consecutive_agent_message_count - 1,
                                                )
                                            consecutive_agent_message_count = 0
                                            logger.debug(
                                                f"[DifyAgent] Raw Dify event received: "
                                                f"event={event_type}, "
                                                f"conversation_id={event_data.get('conversation_id')}, "
                                                f"message_id={event_data.get('message_id')}, "
                                                f"task_id={event_data.get('task_id')}"
                                            )
                                        
                                        # For agent_thought events, log more details
                                        if event_type == "agent_thought":
                                            logger.debug(
                                                f"[DifyAgent] agent_thought details: "
                                                f"id={event_data.get('id')}, "
                                                f"position={event_data.get('position')}, "
                                                f"thought_length={len(event_data.get('thought', ''))}, "
                                                f"observation_length={len(event_data.get('observation', ''))}, "
                                                f"has_tool={bool(event_data.get('tool'))}, "
                                                f"tool={event_data.get('tool')}, "
                                                f"has_tool_input={bool(event_data.get('tool_input'))}, "
                                                f"has_observation={bool(event_data.get('observation'))}"
                                            )
                                            # Log full event JSON for agent_thought
                                            try:
                                                event_json = json.dumps(event_data, ensure_ascii=False, indent=2)
                                                logger.debug(f"[DifyAgent] Full agent_thought event JSON:\n{event_json}")
                                            except Exception as e:
                                                logger.debug(f"[DifyAgent] Failed to serialize event JSON: {e}")
                                        
                                        # For message events, log answer preview
                                        elif event_type == "message":
                                            answer = event_data.get("answer", "")
                                            logger.debug(
                                                f"[DifyAgent] message event: "
                                                f"answer_length={len(answer)}, "
                                                f"answer_preview={answer[:100] if len(answer) > 100 else answer}"
                                            )
                                    
                                    ag_ui_events = dify_events_to_ag_ui_events(
                                        event_data,
                                        current_thread_id,
                                        run_input.run_id,
                                        message_id=current_message_id,
                                        debug_mode=self._debug_mode,
                                    )

                                    if ag_ui_events:
                                        # Handle both single event and list of events
                                        if isinstance(ag_ui_events, list):
                                            for event in ag_ui_events:
                                                loop.call_soon_threadsafe(queue.put_nowait, ("event", event))
                                        else:
                                            loop.call_soon_threadsafe(queue.put_nowait, ("event", ag_ui_events))

                                    # Check if conversation is completed (message_end event)
                                    if event_type == "message_end":
                                        # Store conversation_id for next run if available
                                        if actual_conversation_id:
                                            loop.call_soon_threadsafe(
                                                queue.put_nowait,
                                                ("conversation_id", actual_conversation_id),
                                            )
                                        
                                        # Signal completion
                                        loop.call_soon_threadsafe(queue.put_nowait, ("done", None))
                                        break
                                    
                                    # Check if error event occurred (should terminate stream)
                                    if event_data.get("event") == "error":
                                        # Error event will be converted to RUN_ERROR by converter
                                        # Signal completion after error
                                        loop.call_soon_threadsafe(queue.put_nowait, ("done", None))
                                        break

                    else:
                        # Blocking mode: get complete JSON response
                        url = f"{self._base_url}/chat-messages"
                        response = client.post(
                            url,
                            json=request_payload,
                            headers=headers,
                        )
                        response.raise_for_status()
                        
                        response_data = response.json()
                        
                        # Extract conversation_id from response
                        conversation_id = response_data.get("conversation_id")
                        if conversation_id:
                            loop.call_soon_threadsafe(
                                queue.put_nowait,
                                ("actual_thread_id", conversation_id),
                            )

                        # Convert to events
                        events = _blocking_response_to_events(
                            response_data,
                            conversation_id or run_input.thread_id or "",
                            run_input.run_id
                        )
                        for event in events:
                            loop.call_soon_threadsafe(queue.put_nowait, ("event", event))

                        if conversation_id:
                            loop.call_soon_threadsafe(
                                queue.put_nowait,
                                ("conversation_id", conversation_id),
                            )

                        loop.call_soon_threadsafe(queue.put_nowait, ("done", None))

            except httpx.HTTPStatusError as exc:
                # HTTP error (4xx, 5xx)
                status_code = exc.response.status_code
                error_str = str(exc).lower()
                
                # Try to parse error response
                # For streaming responses, we may have pre-parsed the error
                error_code = ""
                error_message = str(exc)
                
                # Check if we pre-parsed the error (for streaming responses)
                if hasattr(exc.response, "_parsed_error"):
                    parsed_error = exc.response._parsed_error
                    error_code = parsed_error.get("code", "")
                    error_message = parsed_error.get("message", str(exc))
                else:
                    # Try to read response content (for non-streaming responses)
                    try:
                        error_data = exc.response.json()
                        error_code = error_data.get("code", "")
                        error_message = error_data.get("message", str(exc))
                    except (json.JSONDecodeError, AttributeError, httpx.ResponseNotRead):
                        # If JSON parsing fails or response not read, use exception message
                        error_message = str(exc)

                # Check if this is an invalid conversation_id error that should trigger retry
                # Only retry on 400 with invalid_param code and conversation_id mentioned
                has_code_400 = status_code == 400
                mentions_conversation_id = "conversation_id" in error_str or "conversation" in error_str
                is_invalid_param = error_code == "invalid_param" or "invalid" in error_str

                should_retry = mentions_conversation_id and has_code_400 and is_invalid_param

                if should_retry:
                    # Signal that we need to retry without conversation_id
                    if self._debug_mode:
                        logger.debug(f"[DifyAgent] conversation_id error, will retry: {error_message[:100]}")
                    loop.call_soon_threadsafe(queue.put_nowait, ("retry_without_conversation_id", exc))
                else:
                    # Create a more informative error message
                    error_msg = f"Dify API error ({status_code}): {error_message}"
                    if error_code:
                        error_msg = f"Dify API error ({status_code}, code={error_code}): {error_message}"
                    loop.call_soon_threadsafe(queue.put_nowait, ("error", Exception(error_msg)))

            except Exception as exc:
                # Other exceptions (network errors, etc.)
                loop.call_soon_threadsafe(queue.put_nowait, ("error", exc))

        # Track the actual thread_id (from Dify's conversation_id)
        actual_thread_id: str | None = None
        run_started_emitted = False
        retry_count = 0  # Track retry attempts (max 1 retry allowed)

        def start_worker(conv_id: str | None):
            """Start worker thread with given conversation_id."""
            thread = threading.Thread(target=worker, args=(conv_id,), daemon=True)
            thread.start()
            return thread

        # First attempt: try with initial_conversation_id
        if self._debug_mode:
            logger.debug(f"[DifyAgent] First attempt with conversation_id: {initial_conversation_id}")
        start_worker(initial_conversation_id)

        # Process events from queue
        try:
            while True:
                kind, payload = await queue.get()

                if kind == "actual_thread_id":
                    # Got the actual conversation_id from Dify
                    actual_thread_id = payload
                    # Update shared_state so worker thread can use it for message_id
                    shared_state["thread_id"] = actual_thread_id
                    if self._debug_mode:
                        logger.debug(f"[DifyAgent] Using actual_thread_id: {actual_thread_id}")

                    # Now we can emit RUN_STARTED with the correct thread_id
                    if not run_started_emitted:
                        yield RunStartedEvent(
                            type=EventType.RUN_STARTED,
                            thread_id=actual_thread_id,
                            run_id=run_input.run_id,
                        )
                        # Emit STEP_STARTED event
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
                            logger.debug(f"[DifyAgent] Max retry reached, raising error")
                        raise original_error if original_error else Exception("conversation_id retry failed")

                    retry_count += 1
                    if self._debug_mode:
                        logger.debug(f"[DifyAgent] Invalid conversation_id, retrying without it (attempt {retry_count})...")
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
                        yield StepStartedEvent(
                            type=EventType.STEP_STARTED,
                            step_name="chat",
                        )
                        run_started_emitted = True
                    yield payload

                elif kind == "conversation_id":
                    # Store conversation_id for next run
                    pass

                elif kind == "done":
                    # Use actual_thread_id if available, otherwise fall back to run_input.thread_id
                    final_thread_id = actual_thread_id or run_input.thread_id or ""

                    # Emit STEP_FINISHED (AG-UI protocol standard event)
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
            final_thread_id = actual_thread_id or run_input.thread_id or ""
            # Emit error event (do not re-raise: stream already has RUN_ERROR;
            # re-raising would cause the server layer to emit a second RUN_ERROR)
            yield RunErrorEvent(
                type=EventType.RUN_ERROR,
                thread_id=final_thread_id,
                run_id=run_input.run_id,
                message=str(e),
            )
            return

    def destroy(self) -> None:
        """Clean up resources used by the agent.

        This method releases any resources held by the Dify client
        and clears callbacks/buffers.
        """
        # Call parent cleanup (clears callbacks and buffers)
        super().destroy()

        # httpx clients are managed via context managers, no explicit cleanup needed


def _blocking_response_to_events(
    response_data: Dict[str, Any],
    thread_id: str,
    run_id: str,
) -> list[BaseEvent]:
    """Convert blocking mode response to event sequence.

    Parameters
    ----------
    response_data : Dict[str, Any]
        Dify blocking response JSON data
    thread_id : str
        Thread ID (conversation_id)
    run_id : str
        Run ID

    Returns
    -------
    list[BaseEvent]
        List of AG-UI events
    """
    events = []
    msg_id = f"{thread_id}:{run_id}"

    # Extract answer from response
    answer = response_data.get("answer", "")

    # 1. RUN_STARTED
    events.append(RunStartedEvent(
        type=EventType.RUN_STARTED,
        thread_id=thread_id,
        run_id=run_id,
    ))
    events.append(StepStartedEvent(
        type=EventType.STEP_STARTED,
        step_name="chat",
    ))

    # 2. TEXT_MESSAGE_START
    events.append(TextMessageStartEvent(
        type=EventType.TEXT_MESSAGE_START,
        message_id=msg_id,
        role="assistant",
    ))

    # 3. TEXT_MESSAGE_CONTENT (complete content as single delta)
    if answer:
        events.append(TextMessageContentEvent(
            type=EventType.TEXT_MESSAGE_CONTENT,
            message_id=msg_id,
            delta=answer,
        ))

    # 4. TEXT_MESSAGE_END
    events.append(TextMessageEndEvent(
        type=EventType.TEXT_MESSAGE_END,
        message_id=msg_id,
    ))

    # 5. STEP_FINISHED and RUN_FINISHED
    events.append(StepFinishedEvent(
        type=EventType.STEP_FINISHED,
        step_name="chat",
    ))
    events.append(RunFinishedEvent(
        type=EventType.RUN_FINISHED,
        thread_id=thread_id,
        run_id=run_id,
    ))

    return events
