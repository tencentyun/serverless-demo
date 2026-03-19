#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Type Definitions for Cloudbase Agent Server.

This module defines common types used throughout the Cloudbase Agent server,
including agent creator function signatures and result types.
"""

from typing import Any, Awaitable, Callable, Generator, Optional, TypedDict, Union

# Import for type hints only
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from fastapi import Request
    from ..send_message.models import RunAgentInput


class AgentCreatorResult(TypedDict, total=False):
    """Result type for agent creator functions.

    This type defines the structure returned by agent creator functions,
    which includes the agent instance and an optional cleanup callback.

    :param agent: The agent instance to handle requests
    :type agent: Any
    :param cleanup: Optional cleanup function called after stream completes.
                   Can be sync or async function.
    :type cleanup: Optional[Callable[[], Union[None, Awaitable[None]]]]

    Example:
        Synchronous cleanup::

            def create_agent() -> AgentCreatorResult:
                db = connect_database()
                agent = MyAgent(db)

                def cleanup():
                    db.close()
                    print("Database closed")

                return {"agent": agent, "cleanup": cleanup}

        Asynchronous cleanup::

            async def create_agent() -> AgentCreatorResult:
                db = await async_connect_database()
                agent = MyAgent(db)

                async def cleanup():
                    await db.close()
                    print("Database closed")

                return {"agent": agent, "cleanup": cleanup}
    """

    agent: Any
    cleanup: Optional[Callable[[], Union[None, Awaitable[None]]]]


# Type alias for agent creator functions
AgentCreator = Callable[[], Union[AgentCreatorResult, Awaitable[AgentCreatorResult]]]
"""Type alias for agent creator functions.

Agent creator functions are responsible for creating agent instances
and optionally providing cleanup callbacks. They can be either
synchronous or asynchronous.

Example:
    Synchronous creator::
    
        def create_agent() -> AgentCreatorResult:
            return {"agent": MyAgent()}
    
    Asynchronous creator::
    
        async def create_agent() -> AgentCreatorResult:
            agent = await initialize_agent()
            return {"agent": agent}
"""


# Type alias for middleware functions
MiddlewareFunction = Callable[["RunAgentInput", "Request"], Generator[None, None, None]]
"""Type alias for middleware functions.

Middleware functions use generator pattern with yield to control execution flow.
They receive input_data and request, can modify input_data, and yield control
to the next middleware or agent.

Example:
    Basic middleware::
    
        def my_middleware(input_data, request):
            # Pre-processing
            print("Before agent execution")
            yield  # Transfer control to next middleware/agent
            # Post-processing (optional)
            print("After agent execution")
    
    JWT authentication middleware::
    
        def jwt_middleware(input_data, request):
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header[7:]
                user_id = extract_user_id_from_jwt(token)
                if user_id:
                    if not input_data.forwarded_props:
                        input_data.forwarded_props = {}
                    input_data.forwarded_props["user_id"] = user_id
            yield
"""
