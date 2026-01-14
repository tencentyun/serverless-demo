#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Server API types.

This module defines types for server API requests and responses.
"""

from typing import Any, List, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field

from .tools import ToolCall


class Tool(BaseModel):
    """Tool definition.
    
    :param name: The name of the tool
    :type name: str
    :param description: Human-readable description of the tool
    :type description: str
    :param parameters: JSON schema defining the tool's input parameters
    :type parameters: Any
    """
    name: str
    description: str
    parameters: Any


class SystemMessage(BaseModel):
    """System message."""
    role: Literal["system"] = "system"
    content: str
    
    class Config:
        """Pydantic model configuration."""
        validate_by_name = True
        validate_assignment = True


class UserMessage(BaseModel):
    """User message."""
    role: Literal["user"] = "user"
    content: str
    
    class Config:
        """Pydantic model configuration."""
        validate_by_name = True
        validate_assignment = True


class ToolMessage(BaseModel):
    """Tool result message."""
    role: Literal["tool"] = "tool"
    content: str
    tool_call_id: str = Field(..., alias="toolCallId")
    
    class Config:
        """Pydantic model configuration."""
        validate_by_name = True
        validate_assignment = True


class AssistantMessage(BaseModel):
    """AI assistant message."""
    id: str
    role: Literal["assistant"] = "assistant"
    content: Optional[str] = None
    tool_calls: Optional[List[ToolCall]] = Field(None, alias="toolCalls")
    
    class Config:
        """Pydantic model configuration."""
        validate_by_name = True
        validate_assignment = True


ClientMessage = Union[SystemMessage, UserMessage, ToolMessage, AssistantMessage]


class ResumeMessage(BaseModel):
    """Resume message for interrupted conversations."""
    interruptId: str
    payload: str


class SendMessageRequest(BaseModel):
    """Send message API request.
    
    :param messages: List of conversation messages
    :type messages: Optional[List[ClientMessage]]
    :param tools: Optional list of available tools
    :type tools: Optional[List[Tool]]
    :param resume: Optional resume message
    :type resume: Optional[ResumeMessage]
    :param conversationId: Unique identifier for the conversation
    :type conversationId: str
    """
    messages: Optional[List[ClientMessage]] = []
    tools: Optional[List[Tool]] = []
    resume: Optional[ResumeMessage] = None
    conversationId: str
    
    class Config:
        """Pydantic model configuration."""
        validate_by_name = True
        validate_assignment = True


class SendMessageResponse(BaseModel):
    """Send message API response."""
    model_config = ConfigDict(populate_by_name=True)
    
    type: str
    data: Any
