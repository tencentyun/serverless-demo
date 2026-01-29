#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HTTP Request Handler for Send Message.

This module provides HTTP protocol-level mapping and request handling
for the Cloudbase Agent send_message endpoint. It processes incoming requests,
converts between client and internal message formats, and manages agent
execution with real-time event streaming support.
"""

import json
import logging
import re
from typing import Any, AsyncGenerator, Optional

from ag_ui.core.events import EventType

from .models import (
    Event,
    # Lifecycle events
    RunStartedEvent,
    RunFinishedEvent,
    RunErrorEvent,
    StepStartedEvent,
    StepFinishedEvent,
    # Text message events
    TextMessageStartEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    # Tool call events
    ToolCallStartEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
    ToolCallResultEvent,
    # State management events
    StateSnapshotEvent,
    MessagesSnapshotEvent,
    # Thinking events
    ThinkingStartEvent,
    ThinkingTextMessageContentEvent,
    ThinkingEndEvent,
    # Special events
    CustomEvent,
    # Input
    RunAgentInput,
)

logger = logging.getLogger(__name__)


def _parse_error(error: Exception) -> tuple[str, Optional[str]]:
    """Parse error to extract message and code.
    
    Handles common error formats:
    - "code: XXX, msg: YYY" (e.g., Coze errors)
    - JSON format: {"code": 123, "msg": "error"}
    
    Parameters
    ----------
    error : Exception
        The exception to parse
        
    Returns
    -------
    tuple[str, Optional[str]]
        A tuple of (message, code) where code may be None
    """
    error_str = str(error)
    
    # Try to parse "code: XXX, msg: YYY" format
    match = re.match(r"code:\s*(\d+),\s*msg:\s*(.+)", error_str)
    if match:
        code = match.group(1)
        message = match.group(2).strip()
        return message, code
    
    # Try to parse JSON format: {"code": 123, "msg": "error"}
    try:
        error_data = json.loads(error_str)
        if isinstance(error_data, dict):
            code = error_data.get("code")
            message = error_data.get("msg") or error_data.get("message") or error_str
            if code is not None:
                return str(message), str(code)
    except (json.JSONDecodeError, TypeError):
        pass
    
    # Fallback: return original error string without code
    return error_str, None


async def handler(input_data: RunAgentInput, agent: Any) -> AsyncGenerator[Event, None]:
    """Handle HTTP requests and process agent execution with streaming.

    This function serves as the main request handler for the send_message endpoint.
    It processes agent events and streams back properly formatted events conforming
    to ag_ui_protocol standards.

    Args:
        input_data: Standard run agent input containing messages and config
        agent: The agent instance to execute (must have a 'run' method)

    Yields:
        Standard protocol events (RUN_STARTED, TEXT_MESSAGE_CONTENT, TOOL_CALL_*, RUN_FINISHED, etc.)

    Raises:
        RuntimeError: When agent execution or message processing fails
    """
    error_emitted = False  # Track if RUN_ERROR has been emitted to avoid duplicates
    
    try:
        logger.info("Agent run started: run_id=%s thread_id=%s", input_data.run_id, input_data.thread_id)
        
        event_count = 0

        async for event in agent.run(input_data):
            event_count += 1
            
            # Handle run lifecycle events
            # Use thread_id from the event (agent may have modified it, e.g., Coze adapter)
            # Fall back to input_data.thread_id if not available in event
            # Handle None thread_id (for optional thread_id support)
            if event.type == EventType.RUN_STARTED:
                event_thread_id = getattr(event, 'thread_id', None) or input_data.thread_id or "unknown"
                yield RunStartedEvent(
                    run_id=input_data.run_id,
                    thread_id=event_thread_id,
                )
            
            elif event.type == EventType.RUN_FINISHED:
                event_thread_id = getattr(event, 'thread_id', None) or input_data.thread_id or "unknown"
                yield RunFinishedEvent(
                    run_id=input_data.run_id,
                    thread_id=event_thread_id,
                )
            
            elif event.type == EventType.RUN_ERROR:
                # Parse error message to extract code if not already provided
                original_message = getattr(event, 'message', str(event))
                original_code = getattr(event, 'code', None)
                
                if original_code is None:
                    # Try to parse code from message
                    message, code = _parse_error(Exception(original_message))
                else:
                    message, code = original_message, original_code
                
                yield RunErrorEvent(
                    run_id=input_data.run_id,
                    thread_id=input_data.thread_id or "unknown",
                    message=message,
                    code=code,
                )
                error_emitted = True  # Mark that we've already emitted an error
            
            # Handle different event types with raw_event tracking for delta extraction
            elif event.type == EventType.TEXT_MESSAGE_CONTENT:
                # Extract delta from framework-specific raw event structure
                # Priority: raw_event (for framework compatibility) -> event.delta (standard fallback)
                content = None
                
                if event.raw_event:
                    raw_data = event.raw_event.get("data", {})
                    chunk = raw_data.get("chunk", {})
                    content = chunk.get("content")
                
                # Fallback to event.delta if raw_event extraction failed
                if content is None:
                    content = getattr(event, "delta", None)

                if content:
                    yield TextMessageContentEvent(
                        message_id=event.message_id,
                        delta=content,
                    )

            elif event.type == EventType.TEXT_MESSAGE_CHUNK:
                # Handle text chunk events with fallback to event.delta
                # Priority: raw_event (for framework compatibility) -> event.delta (standard fallback)
                content = None
                
                if event.raw_event:
                    raw_data = event.raw_event.get("data", {})
                    chunk = raw_data.get("chunk", {})
                    content = chunk.get("content")
                
                # Fallback to event.delta if raw_event extraction failed
                if content is None:
                    content = getattr(event, "delta", None)

                if content:
                    yield TextMessageContentEvent(
                        message_id=event.message_id,
                        delta=content,
                    )

            elif event.type == EventType.TOOL_CALL_START:
                # Emit tool call start event
                yield ToolCallStartEvent(
                    tool_call_id=event.tool_call_id,
                    tool_call_name=event.tool_call_name,
                )

                # Some frameworks provide initial args in start event
                start_delta = None
                if event.raw_event is not None:
                    start_delta = (
                        event.raw_event.get("data", {})
                        .get("chunk", {})
                        .get("tool_call_chunks", [{}])[0]
                        .get("args")
                    )

                if start_delta is not None:
                    yield ToolCallArgsEvent(
                        tool_call_id=event.tool_call_id,
                        delta=start_delta,
                    )

            elif event.type in (EventType.TOOL_CALL_ARGS, EventType.TOOL_CALL_CHUNK):
                # Handle streaming tool arguments
                yield ToolCallArgsEvent(
                    tool_call_id=event.tool_call_id,
                    delta=event.delta,
                )

            elif event.type == EventType.TOOL_CALL_END:
                # Tool call arguments complete
                yield ToolCallEndEvent(
                    tool_call_id=event.tool_call_id,
                )

            elif event.type == EventType.TOOL_CALL_RESULT:
                # Tool execution result
                yield ToolCallResultEvent(
                    tool_call_id=event.tool_call_id,
                    content=event.content,
                    message_id=getattr(event, 'message_id', None),
                    role=getattr(event, 'role', None),
                )
            
            # ==========================================
            # ADDITIONAL IMPORTANT EVENTS
            # ==========================================
            
            elif event.type == EventType.TEXT_MESSAGE_START:
                # Text message starting
                yield TextMessageStartEvent(
                    message_id=event.message_id,
                    role=getattr(event, 'role', 'assistant'),
                )
            
            elif event.type == EventType.TEXT_MESSAGE_END:
                # Text message ending
                yield TextMessageEndEvent(
                    message_id=event.message_id,
                )
            
            elif event.type == EventType.STEP_STARTED:
                # Agent step starting (for progress tracking)
                yield StepStartedEvent(
                    step_id=getattr(event, 'step_id', None),
                    step_name=getattr(event, 'step_name', None),
                )
            
            elif event.type == EventType.STEP_FINISHED:
                # Agent step finished
                yield StepFinishedEvent(
                    step_id=getattr(event, 'step_id', None),
                    step_name=getattr(event, 'step_name', ''),
                )
            
            elif event.type == EventType.STATE_SNAPSHOT:
                # Complete state snapshot
                yield StateSnapshotEvent(
                    snapshot=getattr(event, 'snapshot', {}),
                )
            
            elif event.type == EventType.MESSAGES_SNAPSHOT:
                # Conversation messages snapshot
                yield MessagesSnapshotEvent(
                    messages=getattr(event, 'messages', []),
                )
            
            elif event.type == EventType.THINKING_START:
                # Thinking/reasoning process starting (e.g., OpenAI o1)
                yield ThinkingStartEvent()
            
            elif event.type == EventType.THINKING_TEXT_MESSAGE_CONTENT:
                # Thinking process content streaming
                yield ThinkingTextMessageContentEvent(
                    delta=getattr(event, 'delta', ''),
                )
            
            elif event.type == EventType.THINKING_END:
                # Thinking process ending
                yield ThinkingEndEvent()
            
            elif event.type == EventType.CUSTOM:
                # Custom application events
                yield CustomEvent(
                    name=getattr(event, 'name', 'custom'),
                    value=getattr(event, 'value', None),
                )

            # Note: RAW events and other advanced events can be added here as needed

        logger.info("Agent run completed: run_id=%s total_events=%d", input_data.run_id, event_count)

    except Exception as e:
        logger.error("Agent run failed: run_id=%s error=%s", input_data.run_id, str(e))
        # Only emit RUN_ERROR if agent hasn't already emitted one
        if not error_emitted:
            message, code = _parse_error(e)
            yield RunErrorEvent(
                run_id=input_data.run_id,
                thread_id=input_data.thread_id or "unknown",
                message=message,
                code=code,
            )
        raise RuntimeError(f"Failed to process agent request: {str(e)}") from e
