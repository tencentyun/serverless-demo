"""CrewAI Utility Functions.

This module provides utility functions for CrewAI integration.
"""

import asyncio


async def yield_control() -> None:
    """Yield control to the event loop.

    This function allows other coroutines to run by yielding control
    back to the event loop. Useful for ensuring responsive async execution
    during long-running operations.

    Example::

        async def long_operation():
            for i in range(1000):
                process_item(i)
                await yield_control()  # Allow other tasks to run
    """
    loop = asyncio.get_running_loop()
    future = loop.create_future()
    loop.call_soon(future.set_result, None)
    await future
