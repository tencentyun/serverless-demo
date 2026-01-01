#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Server-Sent Events (SSE) Utilities.

This module provides utility functions for working with Server-Sent Events
in streaming HTTP responses.
"""

from typing import AsyncGenerator


async def async_generator_from_string(content: str) -> AsyncGenerator[str, None]:
    r"""Create an async generator from a string.

    This utility function converts a string into an async generator,
    which is useful for creating error responses in streaming format
    that are compatible with StreamingResponse.

    :param content: The string content to yield
    :type content: str

    :yields: The input content as a single item
    :ytype: str

    Example:
        Creating an error stream::

            error_content = "data: {'error': 'Something went wrong'}\\n\\n"
            error_stream = async_generator_from_string(error_content)
            return StreamingResponse(error_stream, media_type="text/event-stream")
    """
    yield content
