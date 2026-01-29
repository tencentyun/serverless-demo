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

import logging
from ag_ui.core import BaseEvent, RunAgentInput
from ag_ui_langgraph import LangGraphAgent as AGUILangGraphAgent
from langgraph.graph.state import CompiledStateGraph

from ..base_agent import BaseAgent
from .ag_ui_langgraph_patch import apply_monkey_patch

logger = logging.getLogger(__name__)

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

        # Observability support (lazy loaded)
        self._observability_callback: Optional[Any] = None
        self._observability_load_attempted = False

    def _load_observability_callback(self) -> None:
        """Lazy load the observability CallbackHandler.

        This method attempts to import and create the CallbackHandler from
        cloudbase_agent.observability.langchain. If the package is not available or
        import fails, the callback remains None and agent continues normally.
        """
        if self._observability_load_attempted:
            return

        self._observability_load_attempted = True

        try:
            from cloudbase_agent.observability.langchain import CallbackHandler
            from cloudbase_agent.langgraph.observability_patch import apply_observability_patch

            # Apply the observability patch to LangGraph
            apply_observability_patch()

            self._observability_callback = CallbackHandler(adapter_name="LangGraph")
        except ImportError:
            pass
        except Exception as e:
            logger.debug(f"Observability not available: {e}")

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
        # Lazy load observability callback (first run only)
        if not self._observability_load_attempted:
            self._load_observability_callback()

        # Check if we have server context from forwardedProps
        if (
            self._observability_callback
            and run_input.forwarded_props
            and "__agui_server_context" in run_input.forwarded_props
        ):
            server_context_data = run_input.forwarded_props["__agui_server_context"]

            # Convert dict to proper SpanContext
            from opentelemetry.trace import SpanContext, TraceFlags
            server_span_context = SpanContext(
                trace_id=int(server_context_data["trace_id"], 16),
                span_id=int(server_context_data["span_id"], 16),
                is_remote=False,
                trace_flags=TraceFlags(server_context_data.get("trace_flags", 1)),
            )

            # Set the external parent context to link to Cloudbase Agent.Server span
            self._observability_callback.set_external_parent_context(server_span_context)

        # Store observability callback on self._agent for monkey patch to pick up
        # This avoids context variable propagation issues and serialization problems
        if self._observability_callback:
            self._agent._observability_callback = self._observability_callback

            # Set the callback in the ContextVar for the observability patch
            # This makes the callback available to all LangChain runnables during graph execution
            from cloudbase_agent.langgraph.observability_patch import set_observability_callback
            set_observability_callback(self._observability_callback)

        # Use original run_input (don't inject callback into forwarded_props)

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
