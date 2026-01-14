"""Agents Package.

This package provides agent creation utilities for the Cloudbase Agent Python SDK.
It includes base agent classes and framework-specific implementations with
lazy loading support for optional dependencies.

Framework Support:
    - LangGraph: Install with `pip install cloudbase_agent_py[langgraph]`
    - CrewAI: Install with `pip install cloudbase_agent_py[crewai]`
    - All frameworks: Install with `pip install cloudbase_agent_py[all]`

Available Classes:
    - BaseAgent: Abstract base class for all Cloudbase Agent agents
    - AgentCallback: Protocol for event callbacks
    - ToolProxy: Protocol for tool call interception
    - ToolCallResult: Result of tool proxy interception
    - LangGraphAgent: LangGraph-based agent implementation (lazy-loaded)
    - CrewAIAgent: CrewAI-based agent implementation (lazy-loaded)

Example:
    Using LangGraph::

        # Install: pip install cloudbase_agent_py[langgraph]
        from cloudbase_agent.agents import LangGraphAgent
        from langgraph.graph import StateGraph

        workflow = StateGraph(State)
        compiled_graph = workflow.compile()
        agent = LangGraphAgent("MyAgent", "Description", compiled_graph)

    Using CrewAI::

        # Install: pip install cloudbase_agent_py[crewai]
        from cloudbase_agent.agents import CrewAIAgent
        from crewai.flow.flow import Flow

        class MyFlow(Flow):
            pass

        flow = MyFlow()
        agent = CrewAIAgent("MyAgent", "Description", flow)

Note:
    Framework-specific agents are lazy-loaded. If you try to import an agent
    without installing its dependencies, you'll get a helpful error message
    indicating which package to install.
"""

import lazy_loader as lazy

# Eager imports (always available, no optional dependencies)
from .base_agent import AgentCallback, BaseAgent, ToolCallResult, ToolProxy

# Lazy imports setup (framework-specific agents loaded on demand)
__getattr__, __dir__, __all__ = lazy.attach_stub(__name__, __file__)

# Ensure base classes and lazy-loaded agents are in __all__
__all__ = [
    "BaseAgent",
    "AgentCallback",
    "ToolProxy",
    "ToolCallResult",
    "LangGraphAgent",  # Lazy-loaded when accessed
    "CrewAIAgent",     # Lazy-loaded when accessed
]

# CRITICAL: Re-inject eager imports into globals after lazy loader setup
# The lazy loader's attach_stub() may override __getattr__, which could
# interfere with direct imports. We explicitly add the base classes back
# to ensure "from cloudbase_agent import BaseAgent" works correctly.
globals().update({
    'BaseAgent': BaseAgent,
    'AgentCallback': AgentCallback,
    'ToolProxy': ToolProxy,
    'ToolCallResult': ToolCallResult,
})
