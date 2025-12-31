#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Streaming event types.

This module defines event types for streaming agent responses.
"""

from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class EventType:
    """Event type constants."""
    RUN_STARTED = "run-started"
    RUN_FINISHED = "run-finished"
    RUN_ERROR = "run-error"
    TEXT_MESSAGE_START = "text-message-start"
    TEXT_MESSAGE_CONTENT = "text-message-content"
    TEXT_MESSAGE_END = "text-message-end"
    TOOL_CALL_START = "tool-call-start"
    TOOL_CALL_ARGS = "tool-call-args"
    TOOL_CALL_END = "tool-call-end"
    TOOL_RESULT = "tool-result"
    INTERRUPT = "interrupt"
    ERROR = "error"


class BaseEvent(BaseModel):
    """Base event model."""
    model_config = ConfigDict(populate_by_name=True)
    
    type: str
    thread_id: Optional[str] = Field(None, alias="threadId")
    run_id: Optional[str] = Field(None, alias="runId")


class StreamEvent(BaseEvent):
    """Generic streaming event."""
    data: Optional[Any] = None
