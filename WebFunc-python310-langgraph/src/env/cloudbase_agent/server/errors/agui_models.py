#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AG-UI Protocol Event Models.

This module implements AG-UI standard event structures for error handling.
These models are compatible with the AG-UI protocol and match the TypeScript
implementation.

Reference:
    - AG-UI Documentation: https://docs.ag-ui.com/introduction
    - TypeScript Implementation: typescript-sdk/packages/agents/src/core/events.ts
"""

import time
from typing import Any, Optional

from pydantic import BaseModel, Field

from .event_types import EventType


class BaseEvent(BaseModel):
    """Base event for all AG-UI events.
    
    This base class provides common fields that all AG-UI events share,
    including event type and timestamp. All specific event types should
    inherit from this class.
    
    Attributes:
        type: Event type identifier (AG-UI standard)
        timestamp: Event creation timestamp in Unix milliseconds
    """

    type: EventType = Field(
        ...,
        description="Event type (AG-UI standard)",
    )
    timestamp: Optional[int] = Field(
        default_factory=lambda: int(time.time() * 1000),
        description="Event timestamp in Unix milliseconds",
    )

    model_config = {
        "use_enum_values": True,  # Serialize enum as string value
    }


class RunErrorEvent(BaseEvent):
    """AG-UI standard error event.
    
    This event structure matches the TypeScript RunErrorEvent and is used
    to report errors during agent execution. It follows the AG-UI protocol
    specification for error reporting.
    
    The event includes required fields (threadId, runId, message) and optional
    context information. All field names follow camelCase convention in JSON
    output while allowing snake_case in Python code.
    
    Attributes:
        type: Always EventType.RUN_ERROR
        threadId: Thread/conversation identifier (required)
        runId: Run identifier (required)
        message: Human-readable error message (required)
        code: Machine-readable error code (optional)
        context: Additional error context (optional, Cloudbase Agent extension)
        executionTime: Execution time in milliseconds (optional)
        timestamp: Event timestamp in Unix milliseconds (auto-generated)
    
    Example:
        Basic error event::
        
            event = RunErrorEvent(
                thread_id="thread_abc123",
                run_id="run_xyz456",
                message="Agent 'gpt-4' not found",
                code="RESOURCE_NOT_FOUND"
            )
            
        With additional context::
        
            event = RunErrorEvent(
                thread_id="thread_abc123",
                run_id="run_xyz456",
                message="Rate limit exceeded",
                code="RATE_LIMIT_ERROR",
                context={"retry_after": 60, "limit": 10},
                execution_time=150
            )
            
        JSON output::
        
            {
                "type": "RUN_ERROR",
                "threadId": "thread_abc123",
                "runId": "run_xyz456",
                "message": "Agent 'gpt-4' not found",
                "code": "RESOURCE_NOT_FOUND",
                "timestamp": 1705651200000
            }
    """

    type: EventType = Field(
        default=EventType.RUN_ERROR,
        description="Event type, always 'RUN_ERROR' for error events",
    )
    threadId: str = Field(
        ...,
        alias="thread_id",
        description="Thread/conversation ID (AG-UI required field)",
    )
    runId: str = Field(
        ...,
        alias="run_id",
        description="Run ID (AG-UI required field)",
    )
    message: str = Field(
        ...,
        description="Human-readable error message",
    )
    code: Optional[str] = Field(
        None,
        description="Machine-readable error code (e.g., RESOURCE_NOT_FOUND)",
    )
    context: Optional[dict[str, Any]] = Field(
        None,
        description="Additional error context (Cloudbase Agent extension)",
    )
    executionTime: Optional[int] = Field(
        None,
        alias="execution_time",
        description="Execution time in milliseconds",
    )

    model_config = {
        "populate_by_name": True,  # Allow both snake_case and camelCase
        "use_enum_values": True,
        "json_schema_extra": {
            "example": {
                "type": "RUN_ERROR",
                "threadId": "thread_abc123",
                "runId": "run_xyz456",
                "message": "Agent 'gpt-4' not found",
                "code": "RESOURCE_NOT_FOUND",
                "context": {"resource_type": "agent", "resource_id": "gpt-4"},
                "executionTime": 150,
                "timestamp": 1705651200000,
            }
        },
    }
