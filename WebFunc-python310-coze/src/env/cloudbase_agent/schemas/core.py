#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Core message and event types.

This module defines the fundamental message and event types used throughout Cloudbase Agent.
"""

from typing import Literal, Optional
from pydantic import BaseModel


class MessageRole:
    """Message role constants."""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class Message(BaseModel):
    """Base message model."""
    role: Literal["system", "user", "assistant", "tool"]
    content: str
    
    class Config:
        """Pydantic model configuration."""
        validate_by_name = True
        validate_assignment = True


class IMemoryEvent(BaseModel):
    """Memory event interface."""
    type: str
    timestamp: float
    data: dict
