#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""OpenAI Format Converter.

This module provides conversion utilities between OpenAI API format
and Cloudbase Agent native format.
"""

from uuid import uuid4

from ..send_message.models import (
    AssistantMessage,
    RunAgentInput,
    SystemMessage,
    ToolMessage,
    UserMessage,
)
from .models import OpenAIChatCompletionRequest


def convert_openai_to_agkit(openai_request: OpenAIChatCompletionRequest) -> RunAgentInput:
    """Convert OpenAI chat completion request to Cloudbase Agent format.

    This function transforms OpenAI-compatible request format into Cloudbase Agent's
    native RunAgentInput format, enabling OpenAI API compatibility.

    Args:
        openai_request: OpenAI-formatted chat completion request

    Returns:
        Cloudbase Agent formatted run agent input
    """
    # Convert messages
    agkit_messages = []
    for msg in openai_request.messages:
        msg_id = str(uuid4())
        if msg.role == "system":
            agkit_messages.append(SystemMessage(id=msg_id, role="system", content=msg.content or ""))
        elif msg.role == "user":
            agkit_messages.append(UserMessage(id=msg_id, role="user", content=msg.content or ""))
        elif msg.role == "assistant":
            agkit_messages.append(
                AssistantMessage(
                    id=msg_id,
                    role="assistant",
                    content=msg.content,
                    tool_calls=msg.tool_calls,
                )
            )
        elif msg.role == "tool":
            agkit_messages.append(
                ToolMessage(
                    id=msg_id,
                    role="tool",
                    content=msg.content or "",
                    tool_call_id=msg.tool_call_id or "",
                )
            )

    # Create Cloudbase Agent request
    return RunAgentInput(
        thread_id=str(uuid4()),  # Generate new thread ID
        run_id=str(uuid4()),  # Generate new run ID
        messages=agkit_messages,
        tools=openai_request.tools or [],
        context=[],
        state={},
        forwarded_props={},
    )
