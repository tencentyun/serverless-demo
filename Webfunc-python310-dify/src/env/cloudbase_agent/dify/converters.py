"""Message and event converters for Dify integration.

This module provides utilities for converting between Dify chat events
and AG-UI protocol events, as well as preparing inputs for Dify chat API.
"""

import json
import logging
import re
import uuid
from typing import Any, Dict, List, Optional

from ag_ui.core import EventType, RunAgentInput
from ag_ui.core.events import (
    TextMessageContentEvent,
    TextMessageStartEvent,
    TextMessageEndEvent,
    ThinkingTextMessageContentEvent,
    ToolCallStartEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
    ToolCallResultEvent,
)

# Configure logging
logger = logging.getLogger(__name__)

# Set logger level to DEBUG if not already set
# This ensures debug logs are visible when debug_mode is enabled
if logger.level == logging.NOTSET:
    logger.setLevel(logging.INFO)  # Default to INFO, will be overridden by debug_mode

# Global buffers to track cumulative content and message state
_content_buffer: Dict[str, str] = {}
_message_started: Dict[str, bool] = {}
# Track message content to detect if agent_thought contains duplicate content
_message_content_buffer: Dict[str, str] = {}


def dify_prepare_inputs(run_input: RunAgentInput) -> Dict[str, Any]:
    """Prepare inputs for Dify chat API (strict mode).

    Converts Cloudbase Agent RunAgentInput to Dify chat API format.
    Uses strict mode: only user role messages are allowed in a single request.

    Parameters
    ----------
    run_input : RunAgentInput
        The Cloudbase Agent run agent input containing messages, tools, state, and forwarded_props.

    Returns
    -------
    dict
        A dictionary containing Dify API request parameters:
        - query: User input/question content (required)
        - user: User identifier (required)
        - conversation_id: Conversation ID (optional)
        - inputs: App variables (optional)
        - response_mode: streaming or blocking (optional)
        - files: File list for Vision models (optional)
        - auto_generate_name: Auto-generate conversation title (optional)

    Raises
    ------
    ValueError
        If non-user role messages are found (strict mode) or no user message is found.

    Notes
    -----
    Strict mode validation:
    - Only `role="user"` messages are allowed in a single request
    - Any other role (assistant, system, tool, developer) will raise ValueError
    - This prevents semantic inconsistencies from silently dropping context

    Example
    -------
    ::

        run_input = RunAgentInput(
            messages=[
                {"role": "user", "content": "Hello"}
            ],
            forwarded_props={
                "user": "user-123",
                "inputs": {"key": "value"},
            }
        )

        dify_params = dify_prepare_inputs(run_input)
        # Returns: {
        #     "query": "Hello",
        #     "user": "user-123",
        #     "inputs": {"key": "value"},
        #     "response_mode": "streaming",
        #     ...
        # }

    See Also
    --------
    Dify Chat API: https://docs.dify.ai/api-reference/chat/send-chat-message
    """
    # 1) Strict validation: Check for non-user role messages
    for msg in run_input.messages:
        role = getattr(msg, "role", None)
        if role and role != "user":
            raise ValueError(
                "Dify adapter (strict mode) only supports role='user' messages in a single request. "
                f"Found unsupported role={role!r}. "
                "Please do not include assistant/system/tool/developer messages in the request."
            )

    # 2) Extract the latest user message
    user_message = None
    for msg in reversed(run_input.messages):
        role = getattr(msg, "role", None)
        content = getattr(msg, "content", None)
        
        if role == "user" and content:
            user_message = content
            break

    if not user_message:
        raise ValueError(
            "No user message found in messages. "
            "Dify API requires at least one message with role='user'."
        )

    # 3) Build Dify request parameters
    forwarded_props = run_input.forwarded_props or {}

    dify_request: Dict[str, Any] = {
        "query": user_message,
        "user": forwarded_props.get("user", ""),
    }

    # Optional parameters
    if run_input.thread_id:
        dify_request["conversation_id"] = run_input.thread_id

    if forwarded_props.get("inputs"):
        dify_request["inputs"] = forwarded_props["inputs"]

    # response_mode defaults to streaming
    dify_request["response_mode"] = forwarded_props.get("response_mode", "streaming")

    # auto_generate_name defaults to True
    if "auto_generate_name" in forwarded_props:
        dify_request["auto_generate_name"] = forwarded_props["auto_generate_name"]
    else:
        dify_request["auto_generate_name"] = True

    # Handle files (images for Vision models)
    if forwarded_props.get("files"):
        dify_request["files"] = _convert_files_format(forwarded_props["files"])

    return dify_request


def _convert_files_format(files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert AG-UI file format to Dify file format.

    Parameters
    ----------
    files : List[Dict[str, Any]]
        AG-UI file format list

    Returns
    -------
    List[Dict[str, Any]]
        Dify file format list

    Example
    -------
    AG-UI format::
        [{"type": "image", "url": "https://example.com/image.png"}]

    Dify format::
        [{
            "type": "image",
            "transfer_method": "remote_url",
            "url": "https://example.com/image.png"
        }]
    """
    dify_files = []
    for file_item in files:
        file_type = file_item.get("type", "image")
        url = file_item.get("url")
        upload_file_id = file_item.get("upload_file_id")

        if url:
            dify_files.append({
                "type": file_type,
                "transfer_method": "remote_url",
                "url": url,
            })
        elif upload_file_id:
            dify_files.append({
                "type": file_type,
                "transfer_method": "local_file",
                "upload_file_id": upload_file_id,
            })

    return dify_files


def dify_events_to_ag_ui_events(
    dify_event: Dict[str, Any],
    thread_id: str,
    run_id: str,
    message_id: Optional[str] = None,
    debug_mode: bool = False,
) -> Optional[List[Any]]:
    """Convert Dify SSE event to AG-UI protocol event.
    
    When debug_mode is True, sets logger level to DEBUG for detailed logging.
    """
    # Set logger level to DEBUG when debug_mode is enabled
    if debug_mode:
        logger.setLevel(logging.DEBUG)
        # Ensure handler exists and is set to DEBUG level
        if not logger.handlers:
            handler = logging.StreamHandler()
            handler.setLevel(logging.DEBUG)
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        else:
            for handler in logger.handlers:
                handler.setLevel(logging.DEBUG)
    """Convert Dify SSE event to AG-UI protocol event.

    Parameters
    ----------
    dify_event : Dict[str, Any]
        The Dify SSE event parsed from JSON (from `data: {...}` line)
    thread_id : str
        The thread ID for the conversation (Dify conversation_id)
    run_id : str
        The run ID for this execution
    message_id : Optional[str]
        Optional message ID for text message chunks
    debug_mode : bool
        Enable debug logging

    Returns
    -------
    Optional[List[BaseEvent]]
        List of AG-UI protocol events, or None if event should be ignored
        Returns a list to support emitting multiple events (e.g., START + CONTENT)

    Notes
    -----
    Dify SSE events are JSON objects with an "event" field indicating the event type.
    The "answer" field in streaming mode contains incremental content (delta), not cumulative.

    Event types handled:
    - "message": Text content streaming (incremental)
    - "message_end": Message completion
    - "agent_thought": Agent thinking process (may include tool calls)
    - "message_file": Tool execution result (file)
    - "agent_message": Agent final message
    """
    global _content_buffer, _message_started, _message_content_buffer

    if not isinstance(dify_event, dict) or "event" not in dify_event:
        return None

    event_type = dify_event.get("event")
    events = []
    
    # Use conversation_id from event if available, otherwise use thread_id parameter
    # This ensures we use the actual conversation_id returned by Dify, not the initial thread_id
    actual_conversation_id = dify_event.get("conversation_id", thread_id)
    msg_id = message_id or f"{actual_conversation_id}:{run_id}"
    buffer_key = f"{actual_conversation_id}:{run_id}"

    # Handle "message" event (text content streaming)
    if event_type == "message":
        answer = dify_event.get("answer", "")
        # Use conversation_id from event, which may differ from initial thread_id
        conversation_id = dify_event.get("conversation_id", actual_conversation_id)
        # Update msg_id and buffer_key to use actual conversation_id
        msg_id = f"{conversation_id}:{run_id}"
        buffer_key = f"{conversation_id}:{run_id}"

        # Emit TEXT_MESSAGE_START on first message event
        if not _message_started.get(buffer_key, False):
            events.append(TextMessageStartEvent(
                type=EventType.TEXT_MESSAGE_START,
                message_id=msg_id,
                role="assistant",
            ))
            _message_started[buffer_key] = True

        # Emit TEXT_MESSAGE_CONTENT with incremental delta
        # Dify's "answer" field is already incremental, not cumulative
        if answer:
            # Track cumulative message content to detect duplicate agent_thought content
            if buffer_key not in _message_content_buffer:
                _message_content_buffer[buffer_key] = ""
            _message_content_buffer[buffer_key] += answer
            
            if debug_mode:
                logger.debug(
                    f"[DifyConverter] message event: delta_length={len(answer)}, "
                    f"accumulated_length={len(_message_content_buffer[buffer_key])}, "
                    f"delta_preview={answer[:50] if len(answer) > 50 else answer}"
                )
            
            events.append(TextMessageContentEvent(
                type=EventType.TEXT_MESSAGE_CONTENT,
                message_id=msg_id,
                delta=answer,
            ))

        return events if events else None

    # Handle "message_end" event
    elif event_type == "message_end":
        if _message_started.get(buffer_key, False):
            events.append(TextMessageEndEvent(
                type=EventType.TEXT_MESSAGE_END,
                message_id=msg_id,
            ))
            _message_started[buffer_key] = False

        # Clear content buffer
        keys_to_remove = [k for k in list(_content_buffer.keys()) if k.startswith(buffer_key)]
        for k in keys_to_remove:
            del _content_buffer[k]
        
        # Clear message content buffer
        keys_to_remove = [k for k in list(_message_content_buffer.keys()) if k.startswith(buffer_key)]
        for k in keys_to_remove:
            del _message_content_buffer[k]

        return events if events else None

    # Handle "agent_thought" event (Agent thinking process, may include tool calls)
    elif event_type == "agent_thought":
        thought = dify_event.get("thought", "")
        observation = dify_event.get("observation", "")  # Tool call return result
        tool = dify_event.get("tool")
        tool_input = dify_event.get("tool_input")
        position = dify_event.get("position", 0)  # Position in message (1 for first iteration)
        message_files = dify_event.get("message_files", [])  # Associated file IDs
        thought_id = dify_event.get("id") or str(uuid.uuid4())
        
        # Debug: Log full event structure first (before any processing)
        if debug_mode:
            logger.debug(
                f"[DifyConverter] ========== agent_thought event processing =========="
            )
            logger.debug(
                f"[DifyConverter] Raw event fields: "
                f"id={thought_id}, position={position}, "
                f"thought_length={len(thought)}, observation_length={len(observation)}, "
                f"tool={tool}, tool_input_length={len(str(tool_input)) if tool_input else 0}, "
                f"message_files={message_files}"
            )
            logger.debug(
                f"[DifyConverter] Full event JSON: {json.dumps(dify_event, ensure_ascii=False, indent=2)}"
            )
        
        # Use conversation_id from event if available (to ensure consistent thread_id)
        conversation_id_from_event = dify_event.get("conversation_id")
        if conversation_id_from_event:
            actual_conversation_id = conversation_id_from_event
            msg_id = f"{actual_conversation_id}:{run_id}"
            buffer_key = f"{actual_conversation_id}:{run_id}"
            if debug_mode:
                logger.debug(
                    f"[DifyConverter] Using conversation_id from event: {actual_conversation_id}, "
                    f"msg_id={msg_id}, buffer_key={buffer_key}"
                )

        # Per Dify/Gemini mapping: when agent_thought has no tool (plain text summary),
        # drop thought to avoid duplicate with already-streamed agent_message content.
        # Only emit THINKING when there is a tool call (thought + tool info).
        if not (tool and str(tool).strip()):
            thought = ""
            if debug_mode:
                logger.debug(
                    f"[DifyConverter] agent_thought with empty tool: drop thought (plain text summary)"
                )

        # Emit thinking content (only when tool is present; otherwise thought already cleared above)
        # Note: Dify's agent_thought.thought field may contain incremental or cumulative content
        # However, sometimes Dify returns the complete message content in thought field,
        # which duplicates the TEXT_MESSAGE_CONTENT events. We should filter this out.
        # Also, sometimes thought field may contain observation content, which should be handled separately.
        
        # Check if thought field contains observation content
        # If thought is the same as observation, don't emit it as thinking content
        # Observation should be handled separately as TOOL_CALL_RESULT
        if thought and observation:
            # Normalize for comparison
            thought_normalized_for_obs = re.sub(r'\s+', '', thought.strip())
            observation_normalized = re.sub(r'\s+', '', observation.strip())
            
            # If thought contains observation or is identical to observation, skip thought
            # Observation will be handled as TOOL_CALL_RESULT below
            if observation_normalized and (
                observation_normalized in thought_normalized_for_obs or 
                thought_normalized_for_obs == observation_normalized or
                len(observation_normalized) > 100 and thought_normalized_for_obs.startswith(observation_normalized[:100])
            ):
                if debug_mode:
                    logger.debug(
                        f"[DifyConverter] ⚠️ agent_thought.thought contains observation content, "
                        f"skipping thought emission. thought_length={len(thought)}, "
                        f"observation_length={len(observation)}"
                    )
                # Don't emit thought as THINKING_TEXT_MESSAGE_CONTENT
                # Observation will be handled as TOOL_CALL_RESULT below
                thought = ""  # Clear thought to skip its processing
        
        if thought:
            # Debug: Log raw Dify event to understand the structure
            if debug_mode:
                logger.debug(
                    f"[DifyConverter] Raw agent_thought event: "
                    f"id={thought_id}, position={position}, "
                    f"thought_length={len(thought)}, "
                    f"has_tool={bool(tool)}, has_observation={bool(observation)}, "
                    f"message_files={message_files}"
                )
                logger.debug(
                    f"[DifyConverter] agent_thought.thought preview (first 200 chars): "
                    f"{thought[:200]}"
                )
            
            # Check if thought content matches the accumulated message content
            # If it does, it's likely a duplicate and we should skip it
            accumulated_message = _message_content_buffer.get(buffer_key, "")
            
            if debug_mode:
                logger.debug(
                    f"[DifyConverter] Comparison: "
                    f"accumulated_message_length={len(accumulated_message)}, "
                    f"thought_length={len(thought)}, "
                    f"accumulated_preview={accumulated_message[:200] if accumulated_message else '(empty)'}"
                )
            
            # Normalize both strings for comparison
            # Remove all whitespace (spaces, newlines, tabs) for comparison
            thought_normalized = re.sub(r'\s+', '', thought.strip())
            message_normalized = re.sub(r'\s+', '', accumulated_message.strip())
            
            # Calculate similarity: if thought contains most of message content, it's likely duplicate
            # Use a threshold-based approach: if >90% of message content is in thought, skip it
            similarity_threshold = 0.9
            
            if thought_normalized and message_normalized:
                # Check if thought contains message content (duplicate case)
                if message_normalized in thought_normalized:
                    # Message content is fully contained in thought
                    similarity = len(message_normalized) / len(thought_normalized) if thought_normalized else 0
                    if similarity >= similarity_threshold or len(message_normalized) / max(len(thought_normalized), 1) >= 0.8:
                        if debug_mode:
                            logger.debug(
                                f"[DifyConverter] ✅ Skipping agent_thought (duplicate): "
                                f"id={thought_id}, thought_length={len(thought)}, "
                                f"message_length={len(accumulated_message)}, "
                                f"similarity={similarity:.2%}"
                            )
                        # Don't emit THINKING_TEXT_MESSAGE_CONTENT if it's duplicate
                        # But still process tool call events if present
                    else:
                        # Thought contains message but has significant additional content
                        if debug_mode:
                            logger.debug(
                                f"[DifyConverter] ⚠️ agent_thought contains message but extends it: "
                                f"id={thought_id}, similarity={similarity:.2%}, "
                                f"thought_length={len(thought)}, message_length={len(accumulated_message)}"
                            )
                        events.append(ThinkingTextMessageContentEvent(
                            type=EventType.THINKING_TEXT_MESSAGE_CONTENT,
                            delta=thought,
                        ))
                elif thought_normalized in message_normalized:
                    # Thought is contained in message (thought came before message events)
                    if debug_mode:
                        logger.debug(
                            f"[DifyConverter] ⚠️ agent_thought content is subset of message "
                            f"(thought arrived before message events): "
                            f"id={thought_id}, thought_length={len(thought)}, "
                            f"message_length={len(accumulated_message)}"
                        )
                    # Don't emit duplicate content
                else:
                    # Thought and message are different
                    # Calculate character-level similarity
                    common_chars = sum(1 for c in thought_normalized if c in message_normalized)
                    similarity = common_chars / max(len(thought_normalized), len(message_normalized), 1)
                    
                    if similarity >= similarity_threshold:
                        if debug_mode:
                            logger.debug(
                                f"[DifyConverter] ✅ Skipping agent_thought (high similarity): "
                                f"id={thought_id}, similarity={similarity:.2%}, "
                                f"thought_length={len(thought)}, message_length={len(accumulated_message)}"
                            )
                        # Don't emit if highly similar
                    else:
                        # Emit thinking content as it's different from message
                        if debug_mode:
                            logger.debug(
                                f"[DifyConverter] ✅ Emitting agent_thought (different content): "
                                f"id={thought_id}, similarity={similarity:.2%}, "
                                f"thought_length={len(thought)}, message_length={len(accumulated_message)}, "
                                f"thought_preview={thought[:100] if len(thought) > 100 else thought}"
                            )
                        events.append(ThinkingTextMessageContentEvent(
                            type=EventType.THINKING_TEXT_MESSAGE_CONTENT,
                            delta=thought,
                        ))
            elif not message_normalized:
                # No accumulated message content yet (agent_thought arrived before message events)
                if debug_mode:
                    logger.debug(
                        f"[DifyConverter] ⚠️ agent_thought arrived before message events: "
                        f"id={thought_id}, thought_length={len(thought)}"
                    )
                # Emit thinking content as it's not a duplicate
                events.append(ThinkingTextMessageContentEvent(
                    type=EventType.THINKING_TEXT_MESSAGE_CONTENT,
                    delta=thought,
                ))
            else:
                # No thought content (shouldn't happen, but handle gracefully)
                if debug_mode:
                    logger.debug(
                        f"[DifyConverter] ⚠️ agent_thought has empty thought field: id={thought_id}"
                    )

        # If tool call information is present, emit tool call events FIRST
        # Note: tool field may contain multiple tools separated by semicolon
        # IMPORTANT: Process tool calls before observation, as observation is the result
        if debug_mode:
            logger.debug(
                f"[DifyConverter] Tool call check: tool={tool}, tool_input={bool(tool_input)}, "
                f"observation={bool(observation)}"
            )
        
        if tool and tool_input:
            # Parse tool field - may be semicolon-separated list
            tool_names = [t.strip() for t in tool.split(";") if t.strip()]
            primary_tool = tool_names[0] if tool_names else tool

            # Dify sends two agent_thought events per tool call:
            # 1. Invocation: tool + tool_input, no observation -> emit START/ARGS/END only
            # 2. Result: tool + tool_input + observation -> emit TOOL_CALL_RESULT only (do NOT re-emit START/ARGS/END)
            if observation:
                # This is the "result" event; we already emitted START/ARGS/END from the first event
                if debug_mode:
                    logger.debug(
                        f"[DifyConverter] ✅ Emitting TOOL_CALL_RESULT from observation (tool call result event): "
                        f"tool_call_id={thought_id}, observation_length={len(observation)}, "
                        f"observation_preview={observation[:200] if len(observation) > 200 else observation}"
                    )
                events.append(ToolCallResultEvent(
                    type=EventType.TOOL_CALL_RESULT,
                    message_id=msg_id,
                    tool_call_id=thought_id,
                    content=observation,
                    role="tool",
                ))
                # Keep mapping for message_file resolution
                if not hasattr(dify_events_to_ag_ui_events, "_tool_call_mapping"):
                    dify_events_to_ag_ui_events._tool_call_mapping = {}
                dify_events_to_ag_ui_events._tool_call_mapping[thought_id] = {
                    "tool_name": primary_tool,
                    "tool_names": tool_names,
                    "conversation_id": dify_event.get("conversation_id", thread_id),
                    "message_files": message_files,
                }
            else:
                # Invocation event: emit START/ARGS/END only (no observation yet)
                # Parse tool_input if it's a JSON string
                if isinstance(tool_input, str):
                    try:
                        tool_input_parsed = json.loads(tool_input)
                    except json.JSONDecodeError:
                        tool_input_parsed = tool_input
                else:
                    tool_input_parsed = tool_input

                # Convert tool_input to JSON string for TOOL_CALL_ARGS
                if isinstance(tool_input_parsed, dict):
                    tool_input_str = json.dumps(tool_input_parsed, ensure_ascii=False)
                else:
                    tool_input_str = str(tool_input_parsed)

                if debug_mode:
                    logger.debug(
                        f"[DifyConverter] Emitting TOOL_CALL_START for tool_call_id={thought_id}, tool_name={primary_tool}"
                    )
                events.append(ToolCallStartEvent(
                    type=EventType.TOOL_CALL_START,
                    tool_call_id=thought_id,
                    tool_call_name=primary_tool,
                ))

                if debug_mode:
                    logger.debug(
                        f"[DifyConverter] Emitting TOOL_CALL_ARGS for tool_call_id={thought_id}, delta_length={len(tool_input_str)}"
                    )
                events.append(ToolCallArgsEvent(
                    type=EventType.TOOL_CALL_ARGS,
                    tool_call_id=thought_id,
                    delta=tool_input_str,
                ))

                if debug_mode:
                    logger.debug(f"[DifyConverter] Emitting TOOL_CALL_END for tool_call_id={thought_id}")
                events.append(ToolCallEndEvent(
                    type=EventType.TOOL_CALL_END,
                    tool_call_id=thought_id,
                ))

                # Store mapping for tool result association (used by message_file etc.)
                if not hasattr(dify_events_to_ag_ui_events, "_tool_call_mapping"):
                    dify_events_to_ag_ui_events._tool_call_mapping = {}
                dify_events_to_ag_ui_events._tool_call_mapping[thought_id] = {
                    "tool_name": primary_tool,
                    "tool_names": tool_names,
                    "conversation_id": dify_event.get("conversation_id", thread_id),
                    "message_files": message_files,
                }
                if debug_mode:
                    logger.debug(
                        f"[DifyConverter] No observation in agent_thought (invocation event): "
                        f"tool_call_id={thought_id}, tool={tool}"
                    )
        
        # Handle observation WITHOUT tool call information (edge case)
        # IMPORTANT: observation should ALWAYS be emitted as TOOL_CALL_RESULT, never as THINKING_TEXT_MESSAGE_CONTENT
        # The observation is the tool execution result and should follow TOOL_CALL_END
        # We only handle observation here if there's no tool call information (edge case)
        # DO NOT emit observation as THINKING_TEXT_MESSAGE_CONTENT under any circumstances
        elif observation:
            if debug_mode:
                logger.debug(
                    f"[DifyConverter] ⚠️ agent_thought observation WITHOUT tool call info: "
                    f"id={thought_id}, observation_length={len(observation)}, "
                    f"observation_preview={observation[:200] if len(observation) > 200 else observation}"
                )
            # If observation exists but no tool call info, emit as TOOL_CALL_RESULT
            # This handles edge cases where observation comes without explicit tool info
            events.append(ToolCallResultEvent(
                type=EventType.TOOL_CALL_RESULT,
                message_id=msg_id,
                tool_call_id=thought_id,
                content=observation,
                role="tool",
            ))
            
            # Handle message_files if present (files associated with this agent_thought)
            # These are file IDs that will be resolved to URLs in message_file events
            if message_files and isinstance(message_files, list):
                if debug_mode:
                    logger.debug(
                        f"[DifyConverter] agent_thought has associated files: "
                        f"id={thought_id}, file_ids={message_files}"
                    )
                # Store file IDs for later resolution when message_file events arrive
                if not hasattr(dify_events_to_ag_ui_events, "_pending_file_ids"):
                    dify_events_to_ag_ui_events._pending_file_ids = {}
                for file_id in message_files:
                    if isinstance(file_id, dict):
                        # If file_id is a dict with 'file_id' field
                        actual_file_id = file_id.get("file_id", str(file_id))
                    else:
                        actual_file_id = str(file_id)
                    dify_events_to_ag_ui_events._pending_file_ids[actual_file_id] = thought_id

        return events if events else None

    # Handle "message_file" event (tool execution result)
    elif event_type == "message_file":
        file_id = dify_event.get("id") or str(uuid.uuid4())
        file_url = dify_event.get("url", "")
        file_type = dify_event.get("type", "image")
        belongs_to = dify_event.get("belongs_to", "assistant")  # user or assistant

        # Try to find associated tool_call_id from agent_thought mapping or pending_file_ids
        tool_call_id = file_id
        
        # First, check if this file_id is in pending_file_ids (from agent_thought.message_files)
        if hasattr(dify_events_to_ag_ui_events, "_pending_file_ids"):
            if file_id in dify_events_to_ag_ui_events._pending_file_ids:
                tool_call_id = dify_events_to_ag_ui_events._pending_file_ids[file_id]
                # Remove from pending after use
                del dify_events_to_ag_ui_events._pending_file_ids[file_id]
        
        # If not found in pending_file_ids, try tool_call_mapping
        if tool_call_id == file_id and hasattr(dify_events_to_ag_ui_events, "_tool_call_mapping"):
            # Try to find by file_id or use the most recent tool call
            if file_id in dify_events_to_ag_ui_events._tool_call_mapping:
                tool_call_id = file_id
            elif dify_events_to_ag_ui_events._tool_call_mapping:
                # Use the most recent tool call ID
                tool_call_id = list(dify_events_to_ag_ui_events._tool_call_mapping.keys())[-1]

        # Emit TOOL_CALL_RESULT
        # Only emit for assistant files (as per Dify API: interface returns only assistant)
        if file_url and belongs_to == "assistant":
            events.append(ToolCallResultEvent(
                type=EventType.TOOL_CALL_RESULT,
                message_id=msg_id,
                tool_call_id=tool_call_id,
                content=file_url,
                role="tool",
            ))
        elif debug_mode:
            logger.debug(
                f"[DifyConverter] Skipping message_file with belongs_to={belongs_to}: "
                f"file_id={file_id}, file_type={file_type}"
            )

        return events if events else None

    # Handle "agent_message" event (Agent final message)
    elif event_type == "agent_message":
        answer = dify_event.get("answer", "")
        # Use conversation_id from event (may differ from initial thread_id)
        conversation_id_from_event = dify_event.get("conversation_id")
        if conversation_id_from_event:
            # Update actual_conversation_id, msg_id, and buffer_key to use event's conversation_id
            actual_conversation_id = conversation_id_from_event
            msg_id = f"{actual_conversation_id}:{run_id}"
            buffer_key = f"{actual_conversation_id}:{run_id}"

        # Ensure message started
        if not _message_started.get(buffer_key, False):
            events.append(TextMessageStartEvent(
                type=EventType.TEXT_MESSAGE_START,
                message_id=msg_id,
                role="assistant",
            ))
            _message_started[buffer_key] = True

        # Emit TEXT_MESSAGE_CONTENT and accumulate for duplicate detection
        # In Agent mode Dify streams via agent_message (not "message"), so we must
        # update _message_content_buffer here. Otherwise when a later agent_thought
        # event contains the full reply text, we have no accumulated content to
        # compare against and wrongly emit it as THINKING_TEXT_MESSAGE_CONTENT.
        if answer:
            if buffer_key not in _message_content_buffer:
                _message_content_buffer[buffer_key] = ""
            is_first_chunk = len(_message_content_buffer[buffer_key]) == 0
            _message_content_buffer[buffer_key] += answer
            if debug_mode and is_first_chunk:
                logger.debug(
                    "[DifyConverter] agent_message stream started (first chunk delta=%d, further chunks folded)",
                    len(answer),
                )
            events.append(TextMessageContentEvent(
                type=EventType.TEXT_MESSAGE_CONTENT,
                message_id=msg_id,
                delta=answer,
            ))

        return events if events else None

    # Handle "error" event (streaming error)
    elif event_type == "error":
        status = dify_event.get("status", 500)
        code = dify_event.get("code", "")
        error_message = dify_event.get("message", "Unknown error")
        
        # Create comprehensive error message
        error_msg = f"Dify API error ({status})"
        if code:
            error_msg += f", code={code}"
        error_msg += f": {error_message}"
        
        # Return error event (will be handled by agent.py to emit RUN_ERROR)
        # We return a special marker that agent.py can detect
        from ag_ui.core.events import RunErrorEvent
        events.append(RunErrorEvent(
            type=EventType.RUN_ERROR,
            thread_id=thread_id,
            run_id=run_id,
            message=error_msg,
            code=code or str(status),
        ))
        
        return events if events else None

    # Handle "message_replace" event (content moderation replacement)
    elif event_type == "message_replace":
        answer = dify_event.get("answer", "")
        
        # When content moderation triggers, replace the message content
        # This should replace any existing message content
        if answer:
            # Clear existing message state and emit replacement
            _message_started[buffer_key] = False
            _message_content_buffer[buffer_key] = answer
            
            # Emit new message start and content
            events.append(TextMessageStartEvent(
                type=EventType.TEXT_MESSAGE_START,
                message_id=msg_id,
                role="assistant",
            ))
            events.append(TextMessageContentEvent(
                type=EventType.TEXT_MESSAGE_CONTENT,
                message_id=msg_id,
                delta=answer,
            ))
            _message_started[buffer_key] = True
        
        return events if events else None

    # Handle "ping" event (keep-alive, every 10 seconds)
    elif event_type == "ping":
        # Ping events are for connection keep-alive, no action needed
        # Just log if debug mode is enabled
        if debug_mode:
            logger.debug(f"[DifyConverter] Received ping event (keep-alive)")
        return None

    # Handle "tts_message" event (TTS audio stream)
    elif event_type == "tts_message":
        # TTS events contain Base64-encoded audio blocks
        # AG-UI protocol doesn't have a standard event for TTS audio
        # We can log it but don't emit an AG-UI event
        if debug_mode:
            audio_length = len(dify_event.get("audio", ""))
            logger.debug(
                f"[DifyConverter] Received tts_message event: "
                f"message_id={dify_event.get('message_id')}, audio_length={audio_length}"
            )
        # Note: TTS audio is not mapped to AG-UI events as there's no standard event type
        return None

    # Handle "tts_message_end" event (TTS audio stream end)
    elif event_type == "tts_message_end":
        # TTS end event, no action needed
        if debug_mode:
            logger.debug(
                f"[DifyConverter] Received tts_message_end event: "
                f"message_id={dify_event.get('message_id')}"
            )
        return None

    # Ignore other event types
    if debug_mode:
        logger.debug(f"[DifyConverter] Ignoring unknown event type: {event_type}")

    return None
