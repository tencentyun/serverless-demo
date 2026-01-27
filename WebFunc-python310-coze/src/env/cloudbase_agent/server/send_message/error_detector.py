#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Error Detection for AG-UI Events.

This module provides centralized error detection logic for AG-UI protocol events.
It analyzes event content to identify errors that should be converted to RunError events.

The detector focuses on catching errors that are wrapped in normal events (e.g., LLM
API errors returned as AI message content instead of raising exceptions).

Key Features:
    - Detects error patterns in STATE_SNAPSHOT events
    - Detects error patterns in MESSAGES_SNAPSHOT events
    - Detects error patterns in TEXT_MESSAGE_CONTENT events (optional)
    - Provides structured error information (message and code)
    - Easy to extend with new error patterns

Example:
    Basic usage in streaming handler::
    
        from .error_detector import detect_error_in_event
        from .models import RunErrorEvent
        
        async for event in handler(request, agent):
            has_error, error_message, error_code = detect_error_in_event(event)
            
            if has_error:
                # Convert to RunError and terminate stream
                error_event = RunErrorEvent(
                    thread_id=request.thread_id,
                    run_id=request.run_id,
                    message=error_message,
                    code=error_code,
                )
                yield error_event
                return  # Terminate stream
            
            # Normal event
            yield event
"""

import re
from typing import Optional, Tuple

from ag_ui.core import EventType

from .models import Event


def detect_error_in_event(event: Event) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detect if an event contains error information.
    
    This function analyzes AG-UI protocol events to identify errors that are
    embedded in normal event content (e.g., API errors returned as message content).
    
    Args:
        event: AG-UI protocol event to analyze
        
    Returns:
        Tuple of (has_error, error_message, error_code):
        - has_error: True if error detected, False otherwise
        - error_message: Extracted error message (up to 500 chars), None if no error
        - error_code: Machine-readable error code, None if no error
        
    Example:
        Detecting error in STATE_SNAPSHOT::
        
            event = StateSnapshotEvent(
                snapshot={
                    "messages": [{
                        "content": "Error: Error code: 401 - Invalid API key"
                    }]
                }
            )
            
            has_error, msg, code = detect_error_in_event(event)
            # Returns: (True, "Error: Error code: 401 - Invalid API key", "HTTP_401")
    """
    # STATE_SNAPSHOT: Check messages in snapshot
    if event.type == EventType.STATE_SNAPSHOT:
        return _check_state_snapshot(event)
    
    # MESSAGES_SNAPSHOT: Check message list
    elif event.type == EventType.MESSAGES_SNAPSHOT:
        return _check_messages_snapshot(event)
    
    # TEXT_MESSAGE_CONTENT: Check streaming content (optional, may cause false positives)
    # Commented out by default - uncomment if needed
    # elif event.type == EventType.TEXT_MESSAGE_CONTENT:
    #     return _check_text_content(event)
    
    # No error detected
    return False, None, None


def _check_state_snapshot(event: Event) -> Tuple[bool, Optional[str], Optional[str]]:
    """Check STATE_SNAPSHOT event for errors.
    
    Analyzes the last message in the snapshot to detect error patterns.
    
    Args:
        event: STATE_SNAPSHOT event
        
    Returns:
        (has_error, error_message, error_code) tuple
    """
    snapshot = getattr(event, 'snapshot', {})
    messages = snapshot.get("messages", [])
    
    if not messages:
        return False, None, None
    
    # Check last message (most likely to contain error)
    last_msg = messages[-1]
    content = getattr(last_msg, "content", None) or last_msg.get("content")
    
    return _analyze_content(content)


def _check_messages_snapshot(event: Event) -> Tuple[bool, Optional[str], Optional[str]]:
    """Check MESSAGES_SNAPSHOT event for errors.
    
    Analyzes the last message in the messages list to detect error patterns.
    
    Args:
        event: MESSAGES_SNAPSHOT event
        
    Returns:
        (has_error, error_message, error_code) tuple
    """
    messages = getattr(event, 'messages', [])
    
    if not messages:
        return False, None, None
    
    # Check last message
    last_msg = messages[-1]
    content = getattr(last_msg, "content", None) or last_msg.get("content")
    
    return _analyze_content(content)


def _check_text_content(event: Event) -> Tuple[bool, Optional[str], Optional[str]]:
    """Check TEXT_MESSAGE_CONTENT event for errors.
    
    NOTE: This can cause false positives if the agent is discussing errors
    as part of normal conversation. Use with caution.
    
    Args:
        event: TEXT_MESSAGE_CONTENT event
        
    Returns:
        (has_error, error_message, error_code) tuple
    """
    delta = getattr(event, 'delta', None)
    return _analyze_content(delta)


def _analyze_content(content: Optional[str]) -> Tuple[bool, Optional[str], Optional[str]]:
    """Analyze content for error patterns.
    
    This function uses pattern matching to identify common error formats from:
    - LLM API errors (OpenAI, Anthropic, Aliyun, etc.)
    - Python exceptions and tracebacks
    - Generic error messages
    
    Args:
        content: Content string to analyze
        
    Returns:
        (has_error, error_message, error_code) tuple
        
    Pattern Priority (NEW - API keywords have highest priority):
        1. API-specific error patterns (invalid_api_key, rate_limit, etc.) - HIGHEST PRIORITY
        2. "Exception:" at the beginning
        3. Python traceback
        4. "Error:" or "Error code:" at the beginning (HTTP codes)
    """
    if not content:
        return False, None, None
    
    content_str = str(content)
    content_lower = content_str.lower()
    
    # Pattern 1: API-specific error patterns (HIGHEST PRIORITY)
    # These are more specific than HTTP codes and should be preferred
    # Common error strings from LLM provider APIs
    api_error_patterns = [
        (r"invalid_api_key", "INVALID_API_KEY"),
        (r"invalid_request_error", "INVALID_REQUEST_ERROR"),
        (r"rate_limit_exceeded", "RATE_LIMIT_ERROR"),
        (r"rate_limit", "RATE_LIMIT_ERROR"),
        (r"authentication_failed", "AUTHENTICATION_ERROR"),
        (r"authentication_error", "AUTHENTICATION_ERROR"),
        (r"unauthorized", "AUTHENTICATION_ERROR"),
        (r"connection_error", "CONNECTION_ERROR"),
        (r"connection refused", "CONNECTION_ERROR"),
        (r"timeout", "TIMEOUT_ERROR"),
        (r"timed out", "TIMEOUT_ERROR"),
        (r"model_not_found", "MODEL_NOT_FOUND_ERROR"),
        (r"model does not exist", "MODEL_NOT_FOUND_ERROR"),
        (r"insufficient_quota", "QUOTA_ERROR"),
        (r"quota_exceeded", "QUOTA_ERROR"),
    ]
    
    for pattern, code in api_error_patterns:
        if re.search(pattern, content_lower):
            return True, content_str[:500], code
    
    # Pattern 2: "Exception: message"
    # Python exceptions that somehow ended up in content
    if re.match(r'^Exception:', content_str, re.IGNORECASE):
        return True, content_str[:500], "EXCEPTION"
    
    # Pattern 3: Python traceback
    # Full stack traces that leaked into content
    if 'Traceback (most recent call last)' in content_str:
        return True, content_str[:500], "TRACEBACK_ERROR"
    
    # Pattern 4: "Error: message" or "Error code: 401 - message"
    # Generic error pattern with optional HTTP status code
    # This is now lower priority than API-specific patterns
    if re.match(r'^Error:', content_str, re.IGNORECASE):
        # Extract HTTP error code if present
        code_match = re.search(r'Error code:\s*(\d+)', content_str)
        error_code = f"HTTP_{code_match.group(1)}" if code_match else "AGENT_ERROR"
        
        # Limit message to 500 characters for readability
        error_message = content_str[:500]
        return True, error_message, error_code
    
    # No error detected
    return False, None, None
