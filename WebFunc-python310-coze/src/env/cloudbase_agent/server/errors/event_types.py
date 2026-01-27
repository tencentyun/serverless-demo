#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AG-UI Event Type Definitions.

This module defines event types following the AG-UI protocol standard.
Reference: https://docs.ag-ui.com/introduction
TypeScript implementation: typescript-sdk/packages/agents/src/core/events.ts
"""

from enum import Enum


class EventType(str, Enum):
    """AG-UI standard event types.
    
    These event types are used throughout the AG-UI protocol for
    streaming agent responses and error reporting.
    
    Attributes:
        RUN_ERROR: Error event during agent execution
        TEXT: Text message content
        TOOL_CALL_START: Tool invocation start
        TOOL_CALL_END: Tool invocation end
        TOOL_RESULT: Tool execution result
        INTERRUPT: Execution interruption request
    """

    RUN_ERROR = "RUN_ERROR"
    TEXT = "text"
    TOOL_CALL_START = "tool-call-start"
    TOOL_CALL_END = "tool-call-end"
    TOOL_RESULT = "tool-result"
    INTERRUPT = "interrupt"
