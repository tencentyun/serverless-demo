#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LangGraph Agent Implementation.

This module provides the LangGraph agent implementation that extends the base
Cloudbase Agent agent class. It handles agent instantiation, monkey patch application,
and ensures proper integration with the Cloudbase Agent framework.

The module automatically applies fixes for known issues in the ag-ui-langgraph
library, particularly around message regeneration and streaming event handling.
"""

from typing import AsyncGenerator

from ag_ui.core import BaseEvent, RunAgentInput
from ag_ui_langgraph import LangGraphAgent as AGUILangGraphAgent
from langgraph.graph.state import CompiledStateGraph

from ..base_agent import BaseAgent
from .ag_ui_langgraph_patch import apply_monkey_patch


class LangGraphAgent(BaseAgent):
    """LangGraph Agent implementation extending BaseAgent.

    This class wraps the ag-ui-langgraph LangGraphAgent with stability patches
    and provides a consistent interface following the Cloudbase Agent agent pattern.

    Enhanced with optional callback support and event ID fixing.

    :param graph: Compiled LangGraph state graph defining the agent's workflow
    :type graph: CompiledStateGraph
    :param name: Human-readable name for the agent (default: "")
    :type name: str
    :param description: Detailed description of the agent's purpose and capabilities (default: "")
    :type description: str
    :param use_callbacks: Enable callback processing for events (default: False)
    :type use_callbacks: bool
    :param fix_event_ids: Enable automatic event ID fixing (default: True)
    :type fix_event_ids: bool

    Example:
        Creating a conversational chat agent::

            from langgraph.graph import StateGraph, MessagesState
            from cloudbase_agent_py.agents.langgraph import LangGraphAgent

            # Define your state
            class State(MessagesState):
                tools: List[Any] = []

            # Build your workflow
            workflow = StateGraph(State)
            workflow.add_node("chat", chat_node)
            workflow.set_entry_point("chat")
            compiled_graph = workflow.compile()

            # Create agent (name and description are optional)
            agent = LangGraphAgent(
                graph=compiled_graph,
                name="ChatBot",
                description="A helpful conversational assistant"
            )

        Using callbacks::

            # Enable callback support
            agent = LangGraphAgent(
                graph=compiled_graph,
                name="ChatBot",
                description="...",
                use_callbacks=True
            )

            # Add callback
            class LoggingCallback:
                async def on_text_message_content(self, event, buffer):
                    print(f"Message: {buffer}")

            agent.add_callback(LoggingCallback())

    Note:
        The monkey patches are applied automatically during initialization
        and affect all LangGraphAgent instances.
    """

    def __init__(
        self,
        graph: CompiledStateGraph,
        name: str = "",
        description: str = "",
        use_callbacks: bool = False,
        fix_event_ids: bool = True,
    ):
        """Initialize the LangGraph agent with stability patches.

        :param graph: Compiled LangGraph state graph defining the agent's workflow
        :type graph: CompiledStateGraph
        :param name: Human-readable name for the agent (default: "")
        :type name: str
        :param description: Detailed description of the agent's purpose and capabilities (default: "")
        :type description: str
        :param use_callbacks: Enable callback processing (default: False)
        :type use_callbacks: bool
        :param fix_event_ids: Enable event ID fixing (default: True)
        :type fix_event_ids: bool
        """
        # Apply stability patches before creating the agent
        apply_monkey_patch()

        # Create the underlying ag-ui-langgraph agent
        agui_agent = AGUILangGraphAgent(name=name, description=description, graph=graph)

        # Initialize base class
        super().__init__(name=name, description=description, agent=agui_agent, flow=graph)

        # Store configuration
        self._use_callbacks = use_callbacks
        self._should_fix_event_ids = fix_event_ids

    async def run(self, run_input: RunAgentInput) -> AsyncGenerator[BaseEvent, None]:
        """Execute the LangGraph agent with the given input.

        This method delegates to the underlying ag-ui-langgraph agent's
        run method to process the input and yield events.

        If callbacks are enabled, events will be processed through the callback
        system before being yielded.

        :param run_input: Input data for the agent execution
        :type run_input: RunAgentInput

        :yield: Events representing the agent's execution progress
        :rtype: AsyncGenerator[BaseEvent, None]

        Example:
            Running the agent::

                from ag_ui.core import RunAgentInput

                agent = LangGraphAgent(name="ChatBot", description="...", graph=graph)

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
        if self._use_callbacks or self._should_fix_event_ids:
            # Enhanced processing with callbacks and/or event ID fixing
            async for event in self._agent.run(run_input):
                # Fix event IDs if enabled
                if self._should_fix_event_ids:
                    event = super()._fix_event_ids(event, run_input.thread_id, run_input.run_id)

                # Process through callbacks if enabled
                if self._use_callbacks:
                    async for processed_event in self._process_event(event):
                        yield processed_event
                else:
                    yield event
        else:
            # Simple delegation (current behavior, zero overhead)
            async for event in self._agent.run(run_input):
                yield event

    def destroy(self) -> None:
        """Clean up resources used by the agent.

        This method releases any resources held by the underlying
        ag-ui-langgraph agent and clears callbacks/buffers.
        """
        # Call parent cleanup (clears callbacks and buffers)
        super().destroy()

        # The ag-ui-langgraph agent doesn't have explicit cleanup
        # but we can add it here if needed in the future
