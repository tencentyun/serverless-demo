#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tool-related types.

This module defines types for tool calls, results, and errors.
"""

from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, Field


class ErrorType:
    """Tool error type constants."""
    VALIDATION_ERROR = "validation_error"
    EXECUTION_ERROR = "execution_error"
    TIMEOUT_ERROR = "timeout_error"
    PERMISSION_ERROR = "permission_error"


class ToolFunction(BaseModel):
    """Tool function definition.
    
    :param name: The name of the function to call
    :type name: str
    :param arguments: JSON-serialized function arguments as a string
    :type arguments: str
    """
    name: str
    arguments: str


class ToolCall(BaseModel):
    """Tool function call.
    
    :param id: Unique identifier for this tool call
    :type id: str
    :param type: Type of the call, always "function"
    :type type: Literal["function"]
    :param function: The function being called with its arguments
    :type function: ToolFunction
    """
    id: str
    type: Literal["function"] = "function"
    function: ToolFunction


class ToolResult(BaseModel):
    """Tool execution result.
    
    :param tool_call_id: ID of the tool call this result corresponds to
    :type tool_call_id: str
    :param result: The tool execution result
    :type result: str
    :param error: Optional error message if execution failed
    :type error: Optional[str]
    """
    tool_call_id: str = Field(..., alias="toolCallId")
    result: Optional[str] = None
    error: Optional[str] = None
