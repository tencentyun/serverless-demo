"""Cloudbase Agent Server Package.

This package provides server components for the Cloudbase Agent Python SDK,
including FastAPI integration, request handling, streaming responses,
and resource cleanup support.

Core Capabilities (Primary Exports):
    - create_send_message_adapter: Create adapter for Cloudbase Agent native send_message endpoint
    - create_openai_adapter: Create adapter for OpenAI-compatible chat/completions endpoint

Convenience Tools (Secondary Exports):
    - AgentServiceApp: FastAPI application wrapper for quick server setup

Data Models:
    - RunAgentInput: Request model for send_message endpoint
    - OpenAIChatCompletionRequest: Request model for OpenAI-compatible endpoint
    - AgentCreatorResult: TypedDict for agent creator return type
    - AgentCreator: Type alias for agent creator functions

Example:
    Using core capabilities (advanced users)::

        from fastapi import FastAPI
        from cloudbase_agent.server import create_send_message_adapter, create_openai_adapter
        from cloudbase_agent.server import RunAgentInput, OpenAIChatCompletionRequest

        def create_agent():
            return {"agent": MyAgent()}

        app = FastAPI()

        @app.post("/custom/send-message")
        async def send_message(request: RunAgentInput):
            return await create_send_message_adapter(create_agent, request)

        @app.post("/custom/chat/completions")
        async def chat_completions(request: OpenAIChatCompletionRequest):
            return await create_openai_adapter(create_agent, request)

    Using convenience tool (quick start)::

        from cloudbase_agent.server import AgentServiceApp

        def create_agent():
            return {"agent": MyAgent()}

        AgentServiceApp().run(create_agent, port=8000)

    With resource cleanup::

        from cloudbase_agent.server import AgentServiceApp, AgentCreatorResult

        def create_agent() -> AgentCreatorResult:
            db = connect_database()
            agent = MyAgent(db)

            def cleanup():
                db.close()
                print("Resources cleaned up")

            return {"agent": agent, "cleanup": cleanup}

        AgentServiceApp().run(create_agent, port=8000)
"""

# Core capabilities (primary exports)
# Convenience tool (secondary export)
from .app import AgentServiceApp
from .healthz.models import HealthzConfig, HealthzResponse
from .openai.models import OpenAIChatCompletionRequest
from .openai.server import create_adapter as create_openai_adapter

# Data models
from .send_message.models import RunAgentInput
from .send_message.server import create_adapter as create_send_message_adapter
from .utils.types import AgentCreator, AgentCreatorResult

__all__ = [
    # Core capabilities (primary)
    "create_send_message_adapter",
    "create_openai_adapter",
    # Convenience tool (secondary)
    "AgentServiceApp",
    # Data models
    "RunAgentInput",
    "OpenAIChatCompletionRequest",
    "HealthzConfig",
    "HealthzResponse",
    "AgentCreatorResult",
    "AgentCreator",
]
