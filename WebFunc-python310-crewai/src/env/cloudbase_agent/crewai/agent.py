#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CrewAI Agent Implementation.

This module provides the CrewAI agent implementation that extends the base
Cloudbase Agent agent class. It handles agent instantiation and ensures proper
integration with the Cloudbase Agent framework.
"""

import asyncio
from typing import AsyncGenerator

from ag_ui.core import BaseEvent, RunAgentInput
from crewai.flow.flow import Flow

from cloudbase_agent.base_agent import BaseAgent
from .context import flow_context
from .converters import crewai_prepare_inputs
from .events import (
    CrewFlowEventListener,
    create_queue,
    delete_queue,
)

GLOBAL_EVENT_LISTENER = None


class CrewAIAgent(BaseAgent):
    """CrewAI Agent implementation extending BaseAgent.

    This class wraps CrewAI Flow and provides a consistent interface
    following the Cloudbase Agent agent pattern.

    Enhanced with context management and event ID fixing.

    :param flow: CrewAI Flow instance defining the agent's workflow
    :type flow: Flow
    :param name: Human-readable name for the agent (default: "")
    :type name: str
    :param description: Detailed description of the agent's purpose and capabilities (default: "")
    :type description: str
    :param fix_event_ids: Enable automatic event ID fixing (default: True)
    :type fix_event_ids: bool

    Example:
        Creating a CrewAI agent::

            from crewai.flow.flow import Flow
            from cloudbase_agent.agents.crewai import CrewAIAgent

            # Define your flow
            class MyFlow(Flow):
                @start()
                def start_method(self):
                    # Flow logic
                    pass

            # Create agent (name and description are optional)
            flow = MyFlow()
            agent = CrewAIAgent(
                flow=flow,
                name="CrewBot",
                description="A helpful CrewAI assistant"
            )

    Note:
        This agent uses context management to track the current flow instance,
        replacing the global flow_context pattern.
    """

    def __init__(self, flow: Flow, name: str = "", description: str = "", fix_event_ids: bool = True):
        """Initialize the CrewAI agent.

        :param flow: CrewAI Flow instance
        :type flow: Flow
        :param name: Human-readable name for the agent (default: "")
        :type name: str
        :param description: Detailed description of the agent's purpose and capabilities (default: "")
        :type description: str
        :param fix_event_ids: Enable event ID fixing (default: True)
        :type fix_event_ids: bool
        """
        # Create the underlying agent (None for CrewAI)
        agui_agent = None

        # Initialize base class
        super().__init__(name=name, description=description, agent=agui_agent, flow=flow)

        # Store configuration
        self._should_fix_event_ids = fix_event_ids

    async def run(self, run_input: RunAgentInput) -> AsyncGenerator[BaseEvent, None]:
        """Execute the CrewAI agent with the given input.

        This method manages the CrewAI Flow execution and converts flow events
        to Cloudbase Agent events.

        Uses context management to track the current agent instance.

        :param run_input: Input data for the agent execution
        :type run_input: RunAgentInput

        :yield: Events representing the agent's execution progress
        :rtype: AsyncGenerator[BaseEvent, None]

        Example:
            Running the agent::

                from ag_ui.core import RunAgentInput

                agent = CrewAIAgent(flow=flow, name="CrewBot", description="...")

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
        # Use context manager to set current agent
        with self.as_current():
            if self._should_fix_event_ids:
                # Enhanced processing with event ID fixing
                async for event in self._run_internal(run_input):
                    event = super()._fix_event_ids(event, run_input.thread_id, run_input.run_id)
                    yield event
            else:
                # Simple delegation (zero overhead)
                async for event in self._run_internal(run_input):
                    yield event

    async def _run_internal(self, run_input: RunAgentInput) -> AsyncGenerator[BaseEvent, None]:
        """Internal run logic for CrewAI flow execution.

        :param run_input: Input data for the agent execution
        :type run_input: RunAgentInput
        :yield: Events from the flow execution
        :rtype: AsyncGenerator[BaseEvent, None]
        """
        global GLOBAL_EVENT_LISTENER
        if GLOBAL_EVENT_LISTENER is None:
            GLOBAL_EVENT_LISTENER = CrewFlowEventListener()

        flow_instance = self._flow
        inputs = crewai_prepare_inputs(inputs=run_input)

        try:
            queue = await create_queue(flow_instance)
            # CRITICAL: Set flow_context for CrewAI internal tools (converters.py)
            token = flow_context.set(flow_instance)

            # 1. Restore state if available
            if flow_instance._persistence and "id" in inputs:
                stored_state = flow_instance._persistence.load_state(inputs["id"])
                if stored_state:
                    flow_instance._restore_state(stored_state)
                else:
                    flow_instance.state.id = inputs["id"]

            # 2. Set current request data
            if "messages" in inputs:
                flow_instance.state.messages.extend(inputs["messages"])
            if "copilotkit" in inputs:
                flow_instance.state.copilotkit.actions = inputs["copilotkit"]["actions"]

            # 3. Clear completed methods to allow re-execution
            flow_instance._completed_methods.clear()
            flow_instance._is_execution_resuming = False

            # 4. Run the flow
            async def run_flow():
                try:
                    # Don't pass inputs as state is already set
                    await flow_instance.kickoff_async()
                except Exception as e:
                    print(f"[ERROR] Exception in flow: {e}")
                    import traceback

                    traceback.print_exc()
                finally:
                    queue.put_nowait(None)

            task = asyncio.create_task(run_flow())

            # 5. Yield events from queue
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield item

        except Exception as e:
            print(f"[ERROR] {e}")
        finally:
            await delete_queue(flow_instance)
            # CRITICAL: Reset flow_context to avoid memory leaks
            flow_context.reset(token)

    def destroy(self) -> None:
        """Clean up resources used by the agent.

        This method releases any resources held by the underlying CrewAI flow
        and clears callbacks/buffers.
        """
        # Call parent cleanup (clears callbacks and buffers)
        super().destroy()

        # The CrewAI flow doesn't have explicit cleanup
        # but we can add it here if needed in the future
