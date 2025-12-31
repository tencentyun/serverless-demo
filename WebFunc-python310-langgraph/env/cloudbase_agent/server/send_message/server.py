#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Send Message Server Adapter.

This module provides the server adapter for the send_message endpoint,
handling request processing, streaming responses, and resource cleanup.
"""

import inspect
import json
import logging
from typing import AsyncGenerator

from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from ..utils.sse import async_generator_from_string
from ..utils.types import AgentCreator
from .handler import handler
from .models import RunAgentInput

logger = logging.getLogger(__name__)


async def create_adapter(create_agent: AgentCreator, request: RunAgentInput) -> StreamingResponse:
    """Create a FastAPI adapter for send_message requests with streaming support.

    This function creates a streaming HTTP response adapter that processes
    send_message requests and returns Server-Sent Events (SSE) formatted responses.

    Args:
        create_agent: Function that creates and returns agent with optional cleanup
        request: The validated request input containing messages and tools

    Returns:
        Streaming response with SSE-formatted events and proper headers

    Raises:
        ValidationError: When request validation fails
        Exception: When agent processing fails or other errors occur
    """
    try:
        # Create agent and get optional cleanup function
        result = create_agent()
        if inspect.iscoroutine(result):
            result = await result

        agent = result["agent"]
        cleanup = result.get("cleanup")

        async def create_sse_stream() -> AsyncGenerator[str, None]:
            """Create Server-Sent Events stream with cleanup support.

            Yields:
                SSE-formatted event strings
            """
            try:
                async for event in handler(request, agent):
                    # Use by_alias=True for camelCase conversion
                    sse_chunk = f"data: {event.model_dump_json(by_alias=True, exclude_none=True)}\n\n"
                    yield sse_chunk

                yield "data: [DONE]\n\n"
            finally:
                # Ensure cleanup is called even if errors occur
                if cleanup:
                    if inspect.iscoroutinefunction(cleanup):
                        await cleanup()
                    else:
                        cleanup()

        return StreamingResponse(
            create_sse_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            },
        )

    except ValidationError as e:
        logger.error("Request validation failed: %s", str(e))
        error_stream = async_generator_from_string(
            f"data: {json.dumps({'error': 'Validation failed', 'details': str(e)})}\n\n"
        )
        return StreamingResponse(error_stream, media_type="text/event-stream")

    except Exception as e:
        logger.error("Server error occurred: %s", str(e))
        error_stream = async_generator_from_string(
            f"data: {json.dumps({'error': 'Server error', 'details': str(e)})}\n\n"
        )
        return StreamingResponse(error_stream, media_type="text/event-stream")
