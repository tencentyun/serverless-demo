#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""OpenAI-Compatible Data Models.

This module defines data models for OpenAI-compatible API endpoints,
enabling Cloudbase Agent agents to work with OpenAI client libraries.
"""

from typing import List, Optional

from pydantic import BaseModel

from ..send_message.models import Tool, ToolCall


class OpenAIMessage(BaseModel):
    """OpenAI-compatible message model.

    :param role: Message role (system, user, assistant, tool)
    :type role: str
    :param content: Message content
    :type content: Optional[str]
    :param tool_calls: Tool calls made by assistant
    :type tool_calls: Optional[List[ToolCall]]
    :param tool_call_id: ID of tool call (for tool role messages)
    :type tool_call_id: Optional[str]
    """

    role: str
    content: Optional[str] = None
    tool_calls: Optional[List[ToolCall]] = None
    tool_call_id: Optional[str] = None


class OpenAIChatCompletionRequest(BaseModel):
    """OpenAI-compatible chat completion request model.

    :param model: Model identifier (ignored, uses configured agent)
    :type model: str
    :param messages: List of conversation messages
    :type messages: List[OpenAIMessage]
    :param stream: Whether to stream the response
    :type stream: bool
    :param tools: Optional list of available tools
    :type tools: Optional[List[Tool]]
    :param temperature: Sampling temperature (ignored)
    :type temperature: Optional[float]
    :param max_tokens: Maximum tokens to generate (ignored)
    :type max_tokens: Optional[int]
    """

    model: str
    messages: List[OpenAIMessage]
    stream: bool = True
    tools: Optional[List[Tool]] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
