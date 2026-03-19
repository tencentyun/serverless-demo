"""
CrewAI integration for observability.

This module provides instrumentation for CrewAI workflows using OpenTelemetry
with OpenInference semantic conventions. It leverages OpenInference's wrapt-based
instrumentation to automatically trace CrewAI Crews, Tasks, Agents, and Tools.

Unlike LangChain's official callback mechanism, CrewAI does not provide a built-in
callback system. This module uses OpenInference's proven instrumentation approach
which wraps CrewAI's internal methods to capture execution traces.

Example:
    Basic usage with CrewAI Flow::

        from crewai.flow import Flow
        from cloudbase_agent.observability.crewai import CallbackHandler

        # Initialize instrumentation
        handler = CallbackHandler()
        handler.setup()

        # Your CrewAI flow code here
        # ...

        # Cleanup when done
        handler.teardown()

    Integration with CrewAIAgent::

        from cloudbase_agent.crewai import CrewAIAgent
        from cloudbase_agent.observability.crewai import CallbackHandler

        handler = CallbackHandler()
        agent = CrewAIAgent(
            flow=my_flow,
            observability_handler=handler
        )
"""

from cloudbase_agent.observability.crewai.callback_handler import CallbackHandler

__all__ = ["CallbackHandler"]
