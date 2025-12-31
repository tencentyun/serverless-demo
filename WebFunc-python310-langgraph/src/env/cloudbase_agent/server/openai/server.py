#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""OpenAI-Compatible Server Adapter.

This module provides the server adapter for OpenAI-compatible chat/completions endpoint.
"""

from fastapi.responses import StreamingResponse

from ..send_message.server import create_adapter as create_send_message_adapter
from ..utils.types import AgentCreator
from .converter import convert_openai_to_agkit
from .models import OpenAIChatCompletionRequest


async def create_adapter(create_agent: AgentCreator, request: OpenAIChatCompletionRequest) -> StreamingResponse:
    """Create a FastAPI adapter for OpenAI-compatible chat/completions requests.

    This function provides OpenAI API compatibility by converting OpenAI-formatted
    requests to Cloudbase Agent format and delegating to the send_message adapter.

    :param create_agent: Function that creates and returns agent with optional cleanup
    :type create_agent: AgentCreator
    :param request: OpenAI-formatted chat completion request
    :type request: OpenAIChatCompletionRequest
    :return: Streaming response with SSE-formatted events
    :rtype: StreamingResponse

    Example:
        Using the adapter in a FastAPI route::

            from fastapi import FastAPI
            from cloudbase_agent.server.openai import create_adapter
            from cloudbase_agent.server.openai.models import OpenAIChatCompletionRequest

            app = FastAPI()

            @app.post("/chat/completions")
            async def chat_completions(request: OpenAIChatCompletionRequest):
                return await create_adapter(create_agent, request)
    """
    # Convert OpenAI format to Cloudbase Agent format
    agkit_request = convert_openai_to_agkit(request)

    # Delegate to send_message adapter
    return await create_send_message_adapter(create_agent, agkit_request)
