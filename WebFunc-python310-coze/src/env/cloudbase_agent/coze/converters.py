"""Message and event converters for Coze integration.

This module provides utilities for converting between Coze chat events
and AG-UI protocol events, as well as preparing inputs for Coze chat API.
"""

import json
import uuid
from typing import Any, Dict, List, Optional

from ag_ui.core import EventType, Message, RunAgentInput
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
from cozepy import ChatEventType, Message as CozeMessage

# Global buffers to track cumulative content and message state
_content_buffer: Dict[str, str] = {}
_message_started: Dict[str, bool] = {}


def ag_ui_tools_to_coze_tools(tools: List[Any]) -> List[Dict[str, Any]]:
    """Convert AG-UI tools to Coze API tool format.
    
    Parameters
    ----------
    tools : List[Any]
        List of AG-UI Tool objects
        
    Returns
    -------
    List[Dict[str, Any]]
        List of Coze API tool dictionaries
    """
    coze_tools = []
    for tool in tools:
        # Extract tool information
        name = getattr(tool, "name", None) or (tool.get("name") if isinstance(tool, dict) else None)
        description = getattr(tool, "description", None) or (tool.get("description") if isinstance(tool, dict) else None)
        parameters = getattr(tool, "parameters", None) or (tool.get("parameters") if isinstance(tool, dict) else None)
        
        if not name:
            continue
            
        # Convert parameters to Coze format (JSON Schema)
        # Coze API expects parameters as a JSON Schema object
        if isinstance(parameters, str):
            try:
                parameters = json.loads(parameters)
            except json.JSONDecodeError:
                parameters = {}
        elif parameters is None:
            parameters = {}
        
        coze_tool = {
            "name": name,
            "description": description or "",
            "parameters": parameters,
        }
        coze_tools.append(coze_tool)
    
    return coze_tools


def coze_prepare_inputs(run_input: RunAgentInput) -> Dict[str, Any]:
    """Prepare inputs for Coze chat API.

    Converts Cloudbase Agent RunAgentInput to Coze chat API format.

    Parameters
    ----------
    run_input : RunAgentInput
        The Cloudbase Agent run agent input containing messages, tools, and state.

    Returns
    -------
    dict
        A dictionary containing:
        - additional_messages: List of Coze Message objects
        - conversation_id: Optional conversation ID for continuing a conversation
        - tools: Optional list of Coze API tool dictionaries
    """
    # Extract the latest user message
    user_message = None
    for msg in reversed(run_input.messages):
        if getattr(msg, "role", None) == "user" and getattr(msg, "content", None):
            user_message = msg.content
            break

    # Convert to Coze Message format
    additional_messages: List[CozeMessage] = []
    if user_message:
        additional_messages.append(CozeMessage.build_user_question_text(user_message))

    # Get conversation_id from state if available
    conversation_id = run_input.state.get("conversation_id") if run_input.state else None
    
    # Convert tools from AG-UI format to Coze API format
    tools = None
    if run_input.tools:
        tools = ag_ui_tools_to_coze_tools(run_input.tools)

    result = {
        "additional_messages": additional_messages,
        "conversation_id": conversation_id,
    }
    
    if tools:
        result["tools"] = tools
    
    return result


def coze_events_to_ag_ui_events(
    coze_event: Any,
    thread_id: str,
    run_id: str,
    message_id: Optional[str] = None,
) -> Optional[List[Any]]:
    """Convert Coze chat event to AG-UI protocol event.

    Parameters
    ----------
    coze_event : Any
        The Coze chat event from cozepy SDK
    thread_id : str
        The thread ID for the conversation
    run_id : str
        The run ID for this execution
    message_id : Optional[str]
        Optional message ID for text message chunks

    Returns
    -------
    Optional[List[BaseEvent]]
        List of AG-UI protocol events, or None if event should be ignored
        Returns a list to support emitting multiple events (e.g., START + CONTENT)
    """
    global _content_buffer, _message_started
    
    if not hasattr(coze_event, "event"):
        return None

    event_type = coze_event.event
    events = []

    # Handle REQUIRES_ACTION events (tool calls from Coze LOCAL plugins only)
    # Coze emits CONVERSATION_CHAT_REQUIRES_ACTION when the bot needs CLIENT to execute a local plugin
    # Note: Server-side plugins are executed automatically by Coze and do NOT emit this event
    # Tools are configured in the Coze platform, not passed via API
    if event_type == ChatEventType.CONVERSATION_CHAT_REQUIRES_ACTION:
        # Extract tool call information from the event
        if hasattr(coze_event, "data"):
            data = coze_event.data
            # Coze REQUIRES_ACTION event structure may vary
            # Try to extract tool call information for local plugin execution
            tool_call_id = None
            tool_call_name = None
            tool_call_args = None
            
            # Try different possible structures
            if isinstance(data, dict):
                tool_call_id = data.get("tool_call_id") or data.get("id") or str(uuid.uuid4())
                tool_call_name = data.get("name") or data.get("function", {}).get("name", "unknown")
                tool_call_args = data.get("arguments") or data.get("function", {}).get("arguments", "{}")
            elif hasattr(data, "tool_call_id"):
                tool_call_id = data.tool_call_id
                tool_call_name = getattr(data, "name", "unknown")
                tool_call_args = getattr(data, "arguments", "{}")
            
            if tool_call_id and tool_call_name:
                # Emit TOOL_CALL_START
                events.append(ToolCallStartEvent(
                    type=EventType.TOOL_CALL_START,
                    tool_call_id=tool_call_id,
                    tool_call_name=tool_call_name,
                ))
                
                # Emit TOOL_CALL_ARGS (if arguments are available)
                if tool_call_args:
                    if isinstance(tool_call_args, dict):
                        tool_call_args = json.dumps(tool_call_args, ensure_ascii=False)
                    events.append(ToolCallArgsEvent(
                        type=EventType.TOOL_CALL_ARGS,
                        tool_call_id=tool_call_id,
                        delta=tool_call_args,
                    ))
                
                # Emit TOOL_CALL_END
                events.append(ToolCallEndEvent(
                    type=EventType.TOOL_CALL_END,
                    tool_call_id=tool_call_id,
                ))
        
        return events if events else None
    
    # Handle message delta events (streaming text and tool calls)
    # Reference: https://github.com/coze-dev/coze-py/blob/main/examples/chat_stream.py
    # Note: According to Coze SDK docs, message.content is cumulative (full content so far)
    # We need to calculate delta by comparing with previous content
    if event_type == ChatEventType.CONVERSATION_MESSAGE_DELTA:
        if hasattr(coze_event, "message"):
            message = coze_event.message
            # Use a consistent message_id for the entire run to track cumulative content
            msg_id = message_id or f"{thread_id}:{run_id}"
            buffer_key = f"{thread_id}:{run_id}"
            
            # Handle tool calls if present
            # Coze SDK may include tool_calls in the message
            if hasattr(message, "tool_calls") and message.tool_calls:
                for tool_call in message.tool_calls:
                    tool_call_id = getattr(tool_call, "id", None) or str(uuid.uuid4())
                    tool_call_name = getattr(tool_call, "name", None) or getattr(tool_call, "function", {}).get("name", "unknown")
                    tool_call_args = getattr(tool_call, "arguments", None) or getattr(tool_call, "function", {}).get("arguments", "{}")
                    
                    # Emit TOOL_CALL_START
                    events.append(ToolCallStartEvent(
                        type=EventType.TOOL_CALL_START,
                        tool_call_id=tool_call_id,
                        tool_call_name=tool_call_name,
                    ))
                    
                    # Emit TOOL_CALL_ARGS (if arguments are available)
                    if tool_call_args:
                        # Convert args to string if it's a dict
                        if isinstance(tool_call_args, dict):
                            tool_call_args = json.dumps(tool_call_args, ensure_ascii=False)
                        events.append(ToolCallArgsEvent(
                            type=EventType.TOOL_CALL_ARGS,
                            tool_call_id=tool_call_id,
                            delta=tool_call_args,
                        ))
                    
                    # Emit TOOL_CALL_END
                    events.append(ToolCallEndEvent(
                        type=EventType.TOOL_CALL_END,
                        tool_call_id=tool_call_id,
                    ))
            
            # Emit TEXT_MESSAGE_START event on first content chunk (if not already started)
            if not _message_started.get(buffer_key, False):
                events.append(TextMessageStartEvent(
                    type=EventType.TEXT_MESSAGE_START,
                    message_id=msg_id,
                    role="assistant",
                ))
                _message_started[buffer_key] = True
            
            # Handle reasoning_content (thinking process) - use ThinkingTextMessageContentEvent
            # This is used by models like DeepSeek-R1 that return reasoning/thinking process
            if hasattr(message, "reasoning_content") and message.reasoning_content:
                import logging
                import os
                DEBUG_MODE = os.environ.get("DEBUG", "").lower() in ("true", "1", "yes")
                
                reasoning_key = f"{buffer_key}:reasoning"
                current_reasoning = message.reasoning_content
                previous_reasoning = _content_buffer.get(reasoning_key, "")
                
                # Log on first reasoning content (for DeepSeek-R1 debugging)
                if DEBUG_MODE and not previous_reasoning:
                    logger = logging.getLogger(__name__)
                    logger.debug(f"[Converter] Detected reasoning_content (DeepSeek-R1 model)")
                    preview = current_reasoning[:50] + "..." if len(current_reasoning) > 50 else current_reasoning
                    logger.debug(f"  Reasoning preview: {preview}")
                
                # Calculate delta (new content since last event)
                if current_reasoning.startswith(previous_reasoning):
                    delta = current_reasoning[len(previous_reasoning):]
                else:
                    # If not cumulative, use the whole content (fallback)
                    delta = current_reasoning
                
                if delta:
                    _content_buffer[reasoning_key] = current_reasoning
                    events.append(ThinkingTextMessageContentEvent(
                        type=EventType.THINKING_TEXT_MESSAGE_CONTENT,
                        delta=delta,
                    ))
            
            # Handle regular content
            if hasattr(message, "content") and message.content:
                content_key = f"{buffer_key}:content"
                current_content = message.content
                previous_content = _content_buffer.get(content_key, "")
                
                # Calculate delta (new content since last event)
                # Coze SDK sends cumulative content, so we extract only the new part
                if current_content.startswith(previous_content):
                    delta = current_content[len(previous_content):]
                else:
                    # If not cumulative (shouldn't happen), use the whole content
                    delta = current_content
                
                if delta:
                    _content_buffer[content_key] = current_content
                    # Use TEXT_MESSAGE_CONTENT (standard AG-UI event) instead of TEXT_MESSAGE_CHUNK
                    # TEXT_MESSAGE_CONTENT is the standard event type for streaming text content
                    events.append(TextMessageContentEvent(
                        type=EventType.TEXT_MESSAGE_CONTENT,
                        message_id=msg_id,
                        delta=delta,
                    ))
        
        return events if events else None
    
    # Handle message completed event (includes server-side plugin calls)
    # Reference: https://github.com/coze-dev/coze-studio/wiki/6.-API-Reference
    # When Coze completes a message, it includes the message type which can be:
    # - "answer": Normal text response
    # - "function_call": Server-side plugin execution
    # - "tool_output": Tool execution result
    # - "follow_up": Follow-up question
    elif event_type == ChatEventType.CONVERSATION_MESSAGE_COMPLETED:
        if hasattr(coze_event, "message"):
            message = coze_event.message
            msg_type = getattr(message, "type", None)
            
            # Debug: Log message type for all completed messages
            import logging
            import os
            DEBUG_MODE = os.environ.get("DEBUG", "").lower() in ("true", "1", "yes")
            if DEBUG_MODE:
                logger = logging.getLogger(__name__)
                logger.debug(f"[Converter] MESSAGE_COMPLETED: msg_type={msg_type}")
            
            # Handle server-side plugin calls (function_call type)
            # Example message.content: '{"name":"search","arguments":{"query":"latest news"}}'
            if msg_type == "function_call":
                tool_call_id = getattr(message, "id", None) or str(uuid.uuid4())
                content = getattr(message, "content", "")
                
                # Parse function call from content (JSON string)
                tool_call_name = "unknown"
                tool_call_args = "{}"
                
                if content:
                    try:
                        # Content is a JSON string containing name and arguments
                        func_data = json.loads(content)
                        tool_call_name = func_data.get("name", "unknown")
                        tool_call_args = func_data.get("arguments", {})
                    except (json.JSONDecodeError, AttributeError):
                        # If parsing fails, try to extract from tool_calls attribute
                        pass
                
                # Check if message has tool_calls attribute (alternative structure)
                if hasattr(message, "tool_calls") and message.tool_calls:
                    for tool_call in message.tool_calls:
                        tc_id = getattr(tool_call, "id", None) or tool_call_id
                        tc_name = getattr(tool_call, "name", None) or getattr(tool_call, "function", {}).get("name", tool_call_name)
                        tc_args = getattr(tool_call, "arguments", None) or getattr(tool_call, "function", {}).get("arguments", tool_call_args)
                        
                        # Emit TOOL_CALL_START
                        events.append(ToolCallStartEvent(
                            type=EventType.TOOL_CALL_START,
                            tool_call_id=tc_id,
                            tool_call_name=tc_name,
                        ))
                        
                        # Emit TOOL_CALL_ARGS
                        if tc_args:
                            if isinstance(tc_args, dict):
                                tc_args = json.dumps(tc_args, ensure_ascii=False)
                            events.append(ToolCallArgsEvent(
                                type=EventType.TOOL_CALL_ARGS,
                                tool_call_id=tc_id,
                                delta=tc_args,
                            ))
                        
                        # Emit TOOL_CALL_END
                        events.append(ToolCallEndEvent(
                            type=EventType.TOOL_CALL_END,
                            tool_call_id=tc_id,
                        ))
                else:
                    # No tool_calls attribute, use parsed data from content
                    events.append(ToolCallStartEvent(
                        type=EventType.TOOL_CALL_START,
                        tool_call_id=tool_call_id,
                        tool_call_name=tool_call_name,
                    ))
                    
                    if tool_call_args:
                        if isinstance(tool_call_args, dict):
                            tool_call_args = json.dumps(tool_call_args, ensure_ascii=False)
                        events.append(ToolCallArgsEvent(
                            type=EventType.TOOL_CALL_ARGS,
                            tool_call_id=tool_call_id,
                            delta=tool_call_args,
                        ))
                    
                    events.append(ToolCallEndEvent(
                        type=EventType.TOOL_CALL_END,
                        tool_call_id=tool_call_id,
                    ))
                
                return events if events else None
            
            # Handle tool output (tool_response or tool_output type)
            # This represents the result returned after executing a tool
            elif msg_type in ("tool_response", "tool_output"):
                import logging
                import os
                DEBUG_MODE = os.environ.get("DEBUG", "").lower() in ("true", "1", "yes")
                logger = logging.getLogger(__name__)
                
                tool_call_id = getattr(message, "id", None) or str(uuid.uuid4())
                content = getattr(message, "content", "")
                
                if DEBUG_MODE:
                    logger.debug(f"[Converter] Converting tool_response to ToolCallResultEvent")
                    logger.debug(f"  tool_call_id: {tool_call_id}")
                    logger.debug(f"  content type: {type(content)}, length: {len(content) if content else 0}")
                    logger.debug(f"  content preview: {content[:100] if content else 'empty'}...")
                    logger.debug(f"  message_id: {thread_id}:{run_id}")
                
                # Content must not be empty - this is a required field
                if not content:
                    if DEBUG_MODE:
                        logger.warning(f"[Converter] tool_response has empty content, skipping ToolCallResultEvent")
                    return None
                
                # Emit TOOL_CALL_RESULT event
                # Note: We need to find the corresponding tool call ID
                # For now, use the message ID as the tool call ID
                events.append(ToolCallResultEvent(
                    type=EventType.TOOL_CALL_RESULT,
                    message_id=f"{thread_id}:{run_id}",
                    tool_call_id=tool_call_id,
                    content=content,
                    role="tool",
                ))
                
                return events if events else None
        
        # For other message types (answer, follow_up, etc.), return None
        return None

    # Handle chat completed event  
    # RUN_FINISHED is emitted by agent.py, not here
    elif event_type == ChatEventType.CONVERSATION_CHAT_COMPLETED:
        # Return None - agent.py will handle emitting RUN_FINISHED
        return None

    # Handle chat failed event
    elif event_type == ChatEventType.CONVERSATION_CHAT_FAILED:
        # This will be handled in agent.py to raise an exception
        # Return None here, agent will handle the error
        return None

    # Ignore other event types for now
    return None


def ag_ui_messages_to_coze_messages(messages: List[Message]) -> List[CozeMessage]:
    """Convert AG-UI messages to Coze Message format.

    Parameters
    ----------
    messages : List[Message]
        List of AG-UI protocol messages

    Returns
    -------
    List[CozeMessage]
        List of Coze Message objects
    """
    coze_messages: List[CozeMessage] = []

    for msg in messages:
        role = getattr(msg, "role", None)
        content = getattr(msg, "content", None)

        if not content:
            continue

        if role == "user":
            coze_messages.append(CozeMessage.build_user_question_text(content))
        elif role == "assistant":
            # Coze SDK might have different methods for assistant messages
            # For now, we'll use user question format as a fallback
            coze_messages.append(CozeMessage.build_user_question_text(content))

    return coze_messages

