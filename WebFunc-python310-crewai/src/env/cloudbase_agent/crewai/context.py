"""CrewAI Flow Context Management.

This module provides context variable management for CrewAI flows,
enabling access to the current flow instance from anywhere in the call stack.
"""

import contextvars
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from crewai.flow.flow import Flow

# Context variable for tracking the current CrewAI flow instance
flow_context: contextvars.ContextVar["Flow"] = contextvars.ContextVar("flow")
