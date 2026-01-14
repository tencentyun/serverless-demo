#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ADK Agent Implementation.

This module provides the ADK agent implementation that extends the base
Cloudbase Agent agent class. It wraps Google ADK agents with AG-UI protocol support,
enabling seamless integration with the Cloudbase Agent framework.

The module supports Google ADK's LLM agents with features like:
- Multi-turn conversation with session management
- AG-UI protocol compatibility
- Streaming event support
- Tool integration via AG-UI dynamic injection
- In-memory service configuration for development/demo
"""

from typing import AsyncGenerator, Callable, Iterable, Optional

from ag_ui.core import BaseEvent, RunAgentInput
from ag_ui_adk import ADKAgent as AGUIADKAgent
from ag_ui_adk.config import PredictStateMapping
from google.adk.agents.base_agent import BaseAgent as ADKBaseAgent
from google.adk.artifacts import BaseArtifactService
from google.adk.auth.credential_service.base_credential_service import BaseCredentialService
from google.adk.memory import BaseMemoryService
from google.adk.sessions import BaseSessionService

from cloudbase_agent.base_agent import BaseAgent


class ADKAgent(BaseAgent):
    """Google ADK agent adapter for Cloudbase Agent.

    This class wraps Google ADK agents to work with the Cloudbase Agent framework,
    providing AG-UI protocol support, session management, and seamless
    integration with Cloudbase Agent Server.

    The adapter delegates to ag_ui_adk.ADKAgent for AG-UI protocol handling,
    tool conversion, and event streaming, while providing a simplified and
    consistent API aligned with other Cloudbase Agent agent implementations.

    Args:
        adk_agent: Google ADK agent instance (required). Typically created using
            google.adk.agents.llm_agent.Agent.
        name: Human-readable name for the agent (default: from adk_agent.name or "")
        description: Agent description (default: from adk_agent.description or "")
        app_name: Application name for session management (default: from adk_agent.name or "default_app")
        user_id: User identifier for session isolation (optional, can use user_id_extractor instead)
        user_id_extractor: Function to extract user_id from RunAgentInput (optional)
        session_timeout_seconds: Session timeout in seconds (default: 3600)
        session_service: Custom session service (optional, default: InMemorySessionService)
        artifact_service: Custom artifact service (optional, default: InMemoryArtifactService)
        memory_service: Custom memory service (optional, default: InMemoryMemoryService)
        credential_service: Custom credential service (optional)
        use_in_memory_services: Use in-memory services for dev/demo (default: True)
        execution_timeout_seconds: Maximum execution time in seconds (default: 600)
        tool_timeout_seconds: Maximum tool execution time in seconds (default: 300)
        max_concurrent_executions: Maximum concurrent executions (default: 10)
        cleanup_interval_seconds: Cleanup interval in seconds (default: 300)
        predict_state: State prediction mappings for AG-UI (optional)
        emit_messages_snapshot: Emit message snapshots in events (default: False)

    Example:
        Basic usage with Google ADK agent::

            from google.adk.agents.llm_agent import Agent
            from cloudbase_agent.adk import ADKAgent
            from cloudbase_agent.server import create_app

            # Create Google ADK agent
            adk_agent = Agent(
                model='gemini-2.5-flash',
                name='assistant',
                description='A helpful assistant for user questions.',
                instruction='Answer user questions to the best of your knowledge',
            )

            # Create Cloudbase Agent agent wrapper
            agent = ADKAgent(
                adk_agent=adk_agent,
                user_id="demo_user"
            )

            # Create server
            app = create_app(agent)

        Advanced usage with custom configuration::

            agent = ADKAgent(
                adk_agent=adk_agent,
                app_name="my_app",
                user_id="user123",
                session_timeout_seconds=7200,
                execution_timeout_seconds=900,
                use_in_memory_services=True,
            )

        Using user_id extractor::

            def extract_user_id(run_input: RunAgentInput) -> str:
                # Extract from forwarded_props or other sources
                return run_input.forwarded_props.get("user_id", "anonymous")

            agent = ADKAgent(
                adk_agent=adk_agent,
                user_id_extractor=extract_user_id,
            )

    Note:
        - The adapter uses ADK's default InMemorySessionService and InMemoryMemoryService
          for session and memory management when use_in_memory_services=True
        - For production use, provide custom session_service and memory_service
        - Tool conversion (AG-UI tools -> ADK tools) is handled automatically by ag_ui_adk
        - Thread ID from AG-UI protocol is automatically mapped to ADK session ID
    """

    def __init__(
        self,
        adk_agent: ADKBaseAgent,
        name: str = "",
        description: str = "",
        app_name: Optional[str] = None,
        user_id: Optional[str] = None,
        user_id_extractor: Optional[Callable[[RunAgentInput], str]] = None,
        session_timeout_seconds: int = 3600,
        session_service: Optional[BaseSessionService] = None,
        artifact_service: Optional[BaseArtifactService] = None,
        memory_service: Optional[BaseMemoryService] = None,
        credential_service: Optional[BaseCredentialService] = None,
        use_in_memory_services: bool = True,
        execution_timeout_seconds: int = 600,
        tool_timeout_seconds: int = 300,
        max_concurrent_executions: int = 10,
        cleanup_interval_seconds: int = 300,
        predict_state: Optional[Iterable[PredictStateMapping]] = None,
        emit_messages_snapshot: bool = False,
    ):
        """Initialize the ADK agent wrapper.

        Args:
            adk_agent: Google ADK agent instance (required)
            name: Human-readable name (default: from adk_agent)
            description: Agent description (default: from adk_agent)
            app_name: Application name (default: from adk_agent.name)
            user_id: User identifier (optional)
            user_id_extractor: Function to extract user_id from input (optional)
            session_timeout_seconds: Session timeout (default: 3600)
            session_service: Custom session service (optional)
            artifact_service: Custom artifact service (optional)
            memory_service: Custom memory service (optional)
            credential_service: Custom credential service (optional)
            use_in_memory_services: Use in-memory services (default: True)
            execution_timeout_seconds: Execution timeout (default: 600)
            tool_timeout_seconds: Tool timeout (default: 300)
            max_concurrent_executions: Max concurrent executions (default: 10)
            cleanup_interval_seconds: Cleanup interval (default: 300)
            predict_state: State prediction mappings (optional)
            emit_messages_snapshot: Emit message snapshots (default: False)

        Raises:
            ValueError: If adk_agent is None or if both user_id and user_id_extractor are provided
            TypeError: If adk_agent is not an instance of google.adk.agents.base_agent.BaseAgent
        """
        # Validate required parameters
        if not adk_agent:
            raise ValueError("adk_agent is required")

        if not isinstance(adk_agent, ADKBaseAgent):
            raise TypeError(
                f"adk_agent must be an instance of google.adk.agents.base_agent.BaseAgent, "
                f"got {type(adk_agent).__name__}"
            )

        # Validate conflicting parameters
        if user_id and user_id_extractor:
            raise ValueError("Cannot specify both 'user_id' and 'user_id_extractor'")

        # Extract defaults from adk_agent if not provided
        agent_name = name or getattr(adk_agent, "name", "")
        agent_description = description or getattr(adk_agent, "description", "")
        agent_app_name = app_name or getattr(adk_agent, "name", "default_app")

        # Create the underlying ag_ui_adk agent
        agui_agent = AGUIADKAgent(
            adk_agent=adk_agent,
            app_name=agent_app_name,
            user_id=user_id,
            user_id_extractor=user_id_extractor,
            session_timeout_seconds=session_timeout_seconds,
            session_service=session_service,
            artifact_service=artifact_service,
            memory_service=memory_service,
            credential_service=credential_service,
            use_in_memory_services=use_in_memory_services,
            execution_timeout_seconds=execution_timeout_seconds,
            tool_timeout_seconds=tool_timeout_seconds,
            max_concurrent_executions=max_concurrent_executions,
            cleanup_interval_seconds=cleanup_interval_seconds,
            predict_state=predict_state,
            emit_messages_snapshot=emit_messages_snapshot,
        )

        # Initialize base class
        super().__init__(
            agent=agui_agent,
            name=agent_name,
            description=agent_description,
            flow=adk_agent,  # Store reference to original ADK agent
        )

        # Store ADK-specific configuration
        self._adk_agent = adk_agent
        self._app_name = agent_app_name
        self._user_id = user_id
        self._user_id_extractor = user_id_extractor

    @property
    def adk_agent(self) -> ADKBaseAgent:
        """Get the underlying Google ADK agent.

        Returns:
            The Google ADK agent instance
        """
        return self._adk_agent

    @property
    def app_name(self) -> str:
        """Get the application name.

        Returns:
            The application name used for session management
        """
        return self._app_name

    async def run(self, run_input: RunAgentInput) -> AsyncGenerator[BaseEvent, None]:
        """Execute the ADK agent with the given input.

        This method delegates to the underlying ag_ui_adk.ADKAgent's run method
        to process the input and yield AG-UI protocol events.

        The method handles:
        - AG-UI protocol event streaming
        - Tool call interception and execution (via ag_ui_adk)
        - Session management and context persistence
        - Multi-turn conversation support

        Args:
            run_input: Standard AG-UI run agent input containing messages, run_id,
                thread_id, state, context, tools, and forwarded_props

        Yields:
            AG-UI protocol events (RUN_STARTED, TEXT_MESSAGE_CONTENT, TOOL_CALL_*,
            RUN_FINISHED, etc.)

        Raises:
            Exception: If agent execution fails (propagated from underlying agent)

        Example:
            Running the agent::

                from ag_ui.core import RunAgentInput

                agent = ADKAgent(adk_agent=adk_agent, user_id="demo_user")

                run_input = RunAgentInput(
                    messages=[{"role": "user", "content": "Hello"}],
                    run_id="run-123",
                    thread_id="thread-456",
                    state={},
                    context=[],
                    tools=[],
                    forwarded_props={}
                )

                async for event in agent.run(run_input):
                    print(f"Event: {event.type}")
        """
        # Simple delegation to underlying ag_ui_adk agent
        # All AG-UI protocol handling, tool conversion, and event streaming
        # is handled by ag_ui_adk.ADKAgent
        async for event in self._agent.run(run_input):
            yield event

    def destroy(self) -> None:
        """Clean up resources used by the agent.

        This method releases resources held by the agent, including:
        - Callback and tool proxy registrations (from BaseAgent)
        - Internal buffers (from BaseAgent)
        - Resources held by ag_ui_adk.ADKAgent (if any)

        Note:
            ag_ui_adk.ADKAgent handles cleanup of ADK sessions and services internally.
        """
        # Call parent cleanup (clears callbacks, proxies, and buffers)
        super().destroy()

        # ag_ui_adk.ADKAgent doesn't expose explicit cleanup methods
        # Session cleanup is handled by its internal SessionManager
        # No additional cleanup needed here
