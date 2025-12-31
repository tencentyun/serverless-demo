#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Base Agent Class.

This module provides the abstract base class for all Cloudbase Agent agents.
It defines the common interface and functionality that all agent implementations
must provide, similar to the TypeScript Agent class.

Enhanced with optional callback support, context management, and event processing utilities.
"""

import json
from abc import ABC, abstractmethod
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any, AsyncGenerator, Dict, List, Optional, Protocol

from ag_ui.core import BaseEvent, EventType, RunAgentInput


# Callback Protocol
class AgentCallback(Protocol):
    """Agent callback protocol for event processing.

    Callbacks can be used to intercept and process events during agent execution,
    enabling features like logging, monitoring, state mutation, and custom event handling.

    All callback methods are optional - implement only the ones you need.
    """

    async def on_text_message_content(self, event: BaseEvent, buffer: str) -> Optional[Dict[str, Any]]:
        """Called when text message content is received.

        :param event: The text message content event
        :type event: BaseEvent
        :param buffer: Accumulated text buffer for this message
        :type buffer: str
        :return: Optional mutation dict to modify agent state
        :rtype: Optional[Dict[str, Any]]
        """
        ...

    async def on_tool_call_args(
        self, event: BaseEvent, buffer: str, partial_args: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Called when tool call arguments are received.

        :param event: The tool call args event
        :type event: BaseEvent
        :param buffer: Raw accumulated argument string
        :type buffer: str
        :param partial_args: Partially parsed arguments (if valid JSON)
        :type partial_args: Dict[str, Any]
        :return: Optional mutation dict to modify agent state
        :rtype: Optional[Dict[str, Any]]
        """
        ...

    async def on_run_started(self, event: BaseEvent) -> None:
        """Called when agent run starts.

        :param event: The run started event
        :type event: BaseEvent
        """
        ...

    async def on_run_finished(self, event: BaseEvent) -> None:
        """Called when agent run finishes.

        :param event: The run finished event
        :type event: BaseEvent
        """
        ...

    async def on_run_error(self, event: BaseEvent) -> None:
        """Called when agent run encounters an error.

        :param event: The run error event
        :type event: BaseEvent
        """
        ...


# ============ ToolProxy Protocol ============
class ToolCallResult:
    """Result of a tool call interception.

    This class encapsulates the result of a tool proxy's interception,
    allowing proxies to either allow, block, or modify tool calls.
    """

    def __init__(
        self,
        allowed: bool = True,
        modified_args: Optional[Dict[str, Any]] = None,
        override_result: Optional[Any] = None,
        error_message: Optional[str] = None,
    ):
        """Initialize tool call result.

        :param allowed: Whether the tool call is allowed to proceed
        :type allowed: bool
        :param modified_args: Modified arguments (if None, use original)
        :type modified_args: Optional[Dict[str, Any]]
        :param override_result: Override result without calling the tool
        :type override_result: Optional[Any]
        :param error_message: Error message if call is blocked
        :type error_message: Optional[str]
        """
        self.allowed = allowed
        self.modified_args = modified_args
        self.override_result = override_result
        self.error_message = error_message


class ToolProxy(Protocol):
    """Tool proxy protocol for intercepting and modifying tool calls.

    Tool proxies can be used to:
    - Validate and modify tool arguments before execution
    - Implement permission checks and access control
    - Cache tool results
    - Log tool usage
    - Implement human-in-the-loop approval
    - Transform or filter tool results

    All proxy methods are optional - implement only the ones you need.
    """

    async def before_tool_call(self, tool_name: str, args: Dict[str, Any], context: Dict[str, Any]) -> ToolCallResult:
        """Called before a tool is invoked.

        This method can:
        - Validate arguments
        - Modify arguments
        - Block the tool call
        - Return a cached result
        - Request human approval

        :param tool_name: Name of the tool being called
        :type tool_name: str
        :param args: Tool arguments
        :type args: Dict[str, Any]
        :param context: Additional context (thread_id, run_id, etc.)
        :type context: Dict[str, Any]
        :return: Result indicating whether to proceed and any modifications
        :rtype: ToolCallResult
        """
        ...

    async def after_tool_call(
        self,
        tool_name: str,
        args: Dict[str, Any],
        result: Any,
        context: Dict[str, Any],
    ) -> Any:
        """Called after a tool has been invoked.

        This method can:
        - Transform the result
        - Cache the result
        - Log the result
        - Trigger side effects

        :param tool_name: Name of the tool that was called
        :type tool_name: str
        :param args: Tool arguments that were used
        :type args: Dict[str, Any]
        :param result: Result returned by the tool
        :type result: Any
        :param context: Additional context (thread_id, run_id, etc.)
        :type context: Dict[str, Any]
        :return: Potentially modified result
        :rtype: Any
        """
        ...

    async def on_tool_error(
        self,
        tool_name: str,
        args: Dict[str, Any],
        error: Exception,
        context: Dict[str, Any],
    ) -> Optional[Any]:
        """Called when a tool call raises an error.

        This method can:
        - Handle the error gracefully
        - Return a fallback result
        - Re-raise the error
        - Log the error

        :param tool_name: Name of the tool that failed
        :type tool_name: str
        :param args: Tool arguments that were used
        :type args: Dict[str, Any]
        :param error: The exception that was raised
        :type error: Exception
        :param context: Additional context (thread_id, run_id, etc.)
        :type context: Dict[str, Any]
        :return: Optional fallback result (None to re-raise)
        :rtype: Optional[Any]
        """
        ...


# Context Management
_current_agent: ContextVar[Optional["BaseAgent"]] = ContextVar("current_agent", default=None)


class BaseAgent(ABC):
    """Abstract base class for all Cloudbase Agent agents.

    This class defines the common interface that all agent implementations
    must follow. It provides the basic structure for agent configuration,
    execution, and event handling.

    Enhanced with optional features:
    - Callback system for event processing (monitoring, logging)
    - Tool proxy system for tool call interception (validation, control)
    - Context management for accessing current agent
    - Event ID fixing utilities
    - Buffer management for streaming events

    :param name: Human-readable name for the agent
    :type name: str
    :param description: Detailed description of the agent's purpose and capabilities
    :type description: str
    :param agent: The underlying agent implementation (e.g., LangGraphAgent)
    :type agent: Any
    :param flow: Optional flow/graph object for the agent
    :type flow: Any

    Example:
        Creating a custom agent implementation::

            class MyCustomAgent(BaseAgent):
                def __init__(self, name: str, description: str, custom_config: dict):
                    # Initialize with custom agent implementation
                    agent = create_custom_agent(custom_config)
                    super().__init__(name, description, agent)

                async def run(
                    self,
                    run_input: RunAgentInput
                ) -> AsyncGenerator[BaseEvent, None]:
                    # Implement custom run logic
                    pass

        Using callbacks::

            class LoggingCallback:
                async def on_text_message_content(self, event, buffer):
                    print(f"Message: {buffer}")
                    return None

            agent = MyCustomAgent(...)
            agent.add_callback(LoggingCallback())

    Note:
        All concrete agent implementations must implement the abstract `run` method.
    """

    def __init__(self, agent: Any, name: str = "", description: str = "", flow: Any = None):
        """Initialize the base agent.

        :param name: Human-readable name for the agent
        :type name: str
        :param description: Detailed description of the agent's purpose and capabilities
        :type description: str
        :param agent: The underlying agent implementation
        :type agent: Any
        :param flow: Optional flow/graph object
        :type flow: Any
        """
        self._name = name
        self._description = description
        self._agent = agent
        self._flow = flow

        # Optional callback support
        self._callbacks: List[AgentCallback] = []

        # Optional tool proxy support
        self._tool_proxies: List[ToolProxy] = []

        # Optional buffer management for streaming events
        self._text_buffers: Dict[str, str] = {}
        self._tool_call_buffers: Dict[str, Dict[str, Any]] = {}

    @property
    def name(self) -> str:
        """Get the agent name.

        :return: Agent name
        :rtype: str
        """
        return self._name

    @property
    def description(self) -> str:
        """Get the agent description.

        :return: Agent description
        :rtype: str
        """
        return self._description

    @property
    def agent(self) -> Any:
        """Get the underlying agent implementation.

        :return: The underlying agent instance
        :rtype: Any
        """
        return self._agent

    @property
    def flow(self) -> Any:
        """Get the flow/graph object.

        :return: The flow/graph instance
        :rtype: Any
        """
        return self._flow

    # ============ Callback System ============

    def add_callback(self, callback: AgentCallback) -> None:
        """Add a callback for event processing.

        :param callback: Callback instance implementing AgentCallback protocol
        :type callback: AgentCallback
        """
        self._callbacks.append(callback)

    def remove_callback(self, callback: AgentCallback) -> None:
        """Remove a callback.

        :param callback: Callback instance to remove
        :type callback: AgentCallback
        """
        if callback in self._callbacks:
            self._callbacks.remove(callback)

    def clear_callbacks(self) -> None:
        """Remove all callbacks."""
        self._callbacks.clear()

    # Tool Proxy Management

    def add_tool_proxy(self, proxy: ToolProxy) -> None:
        """Add a tool proxy to intercept tool calls.

        Tool proxies are invoked in the order they are added.
        Each proxy can modify arguments, block calls, or transform results.

        :param proxy: Tool proxy instance to add
        :type proxy: ToolProxy

        Example::

            class PermissionProxy:
                async def before_tool_call(self, tool_name, args, context):
                    if not self.has_permission(tool_name):
                        return ToolCallResult(allowed=False, error_message="Permission denied")
                    return ToolCallResult(allowed=True)

            agent.add_tool_proxy(PermissionProxy())
        """
        self._tool_proxies.append(proxy)

    def remove_tool_proxy(self, proxy: ToolProxy) -> None:
        """Remove a tool proxy.

        :param proxy: Tool proxy instance to remove
        :type proxy: ToolProxy
        """
        if proxy in self._tool_proxies:
            self._tool_proxies.remove(proxy)

    def clear_tool_proxies(self) -> None:
        """Remove all tool proxies."""
        self._tool_proxies.clear()

    async def _invoke_tool_proxies_before(
        self, tool_name: str, args: Dict[str, Any], context: Dict[str, Any]
    ) -> ToolCallResult:
        """Invoke all tool proxies before a tool call.

        Proxies are invoked in order. If any proxy blocks the call,
        the chain stops and the blocking result is returned.

        :param tool_name: Name of the tool being called
        :type tool_name: str
        :param args: Tool arguments
        :type args: Dict[str, Any]
        :param context: Additional context (thread_id, run_id, etc.)
        :type context: Dict[str, Any]
        :return: Aggregated result from all proxies
        :rtype: ToolCallResult
        """
        if not self._tool_proxies:
            return ToolCallResult(allowed=True)

        current_args = args
        for proxy in self._tool_proxies:
            if hasattr(proxy, "before_tool_call"):
                result = await proxy.before_tool_call(tool_name, current_args, context)

                # If blocked, stop the chain
                if not result.allowed:
                    return result

                # If result has override, stop the chain
                if result.override_result is not None:
                    return result

                # If args were modified, use them for next proxy
                if result.modified_args is not None:
                    current_args = result.modified_args

        # All proxies passed, return final args
        return ToolCallResult(allowed=True, modified_args=current_args)

    async def _invoke_tool_proxies_after(
        self,
        tool_name: str,
        args: Dict[str, Any],
        result: Any,
        context: Dict[str, Any],
    ) -> Any:
        """Invoke all tool proxies after a tool call.

        Proxies are invoked in order. Each proxy can transform the result.

        :param tool_name: Name of the tool that was called
        :type tool_name: str
        :param args: Tool arguments that were used
        :type args: Dict[str, Any]
        :param result: Result returned by the tool
        :type result: Any
        :param context: Additional context (thread_id, run_id, etc.)
        :type context: Dict[str, Any]
        :return: Potentially transformed result
        :rtype: Any
        """
        if not self._tool_proxies:
            return result

        current_result = result
        for proxy in self._tool_proxies:
            if hasattr(proxy, "after_tool_call"):
                current_result = await proxy.after_tool_call(tool_name, args, current_result, context)

        return current_result

    async def _invoke_tool_proxies_error(
        self,
        tool_name: str,
        args: Dict[str, Any],
        error: Exception,
        context: Dict[str, Any],
    ) -> Optional[Any]:
        """Invoke all tool proxies when a tool call fails.

        Proxies are invoked in order. The first proxy that returns a non-None
        result will provide the fallback value.

        :param tool_name: Name of the tool that failed
        :type tool_name: str
        :param args: Tool arguments that were used
        :type args: Dict[str, Any]
        :param error: The exception that was raised
        :type error: Exception
        :param context: Additional context (thread_id, run_id, etc.)
        :type context: Dict[str, Any]
        :return: Optional fallback result (None to re-raise)
        :rtype: Optional[Any]
        """
        if not self._tool_proxies:
            return None

        for proxy in self._tool_proxies:
            if hasattr(proxy, "on_tool_error"):
                fallback = await proxy.on_tool_error(tool_name, args, error, context)
                if fallback is not None:
                    return fallback

        return None

    # ============ Callback Management ============

    async def _invoke_callbacks(self, event: BaseEvent) -> Optional[Dict[str, Any]]:
        """Invoke callbacks for an event.

        This method processes events through registered callbacks and manages
        internal buffers for streaming events.

        :param event: Event to process
        :type event: BaseEvent
        :return: Aggregated mutations from all callbacks
        :rtype: Optional[Dict[str, Any]]
        """
        if not self._callbacks:
            return None

        mutations = {}

        # Handle text message events
        if event.type == EventType.TEXT_MESSAGE_CONTENT:
            message_id = getattr(event, "message_id", None)
            if message_id:
                # Update buffer
                delta = getattr(event, "delta", "")
                self._text_buffers[message_id] = self._text_buffers.get(message_id, "") + delta

                # Invoke callbacks
                for callback in self._callbacks:
                    if hasattr(callback, "on_text_message_content"):
                        result = await callback.on_text_message_content(event, self._text_buffers[message_id])
                        if result:
                            mutations.update(result)

        # Handle tool call events
        elif event.type == EventType.TOOL_CALL_ARGS:
            tool_call_id = getattr(event, "tool_call_id", None)
            if tool_call_id:
                # Update buffer
                delta = getattr(event, "delta", "")
                if tool_call_id not in self._tool_call_buffers:
                    self._tool_call_buffers[tool_call_id] = {
                        "buffer": "",
                        "partial_args": {},
                    }

                self._tool_call_buffers[tool_call_id]["buffer"] += delta

                # Try to parse partial JSON
                try:
                    partial_args = json.loads(self._tool_call_buffers[tool_call_id]["buffer"])
                    self._tool_call_buffers[tool_call_id]["partial_args"] = partial_args
                except (json.JSONDecodeError, ValueError):
                    # Not valid JSON yet, keep accumulating
                    pass

                # Invoke callbacks
                for callback in self._callbacks:
                    if hasattr(callback, "on_tool_call_args"):
                        result = await callback.on_tool_call_args(
                            event,
                            self._tool_call_buffers[tool_call_id]["buffer"],
                            self._tool_call_buffers[tool_call_id]["partial_args"],
                        )
                        if result:
                            mutations.update(result)

        # Handle lifecycle events
        elif event.type == EventType.RUN_STARTED:
            for callback in self._callbacks:
                if hasattr(callback, "on_run_started"):
                    await callback.on_run_started(event)

        elif event.type == EventType.RUN_FINISHED:
            # Clear buffers on run finish
            self._text_buffers.clear()
            self._tool_call_buffers.clear()

            for callback in self._callbacks:
                if hasattr(callback, "on_run_finished"):
                    await callback.on_run_finished(event)

        elif event.type == EventType.RUN_ERROR:
            for callback in self._callbacks:
                if hasattr(callback, "on_run_error"):
                    await callback.on_run_error(event)

        return mutations if mutations else None

    async def _process_event(self, event: BaseEvent) -> AsyncGenerator[BaseEvent, None]:
        """Process an event through callbacks and yield result.

        This is a helper method that subclasses can use to integrate callbacks
        into their event processing pipeline.

        :param event: Event to process
        :type event: BaseEvent
        :yield: Processed event (potentially modified by callbacks)
        :rtype: AsyncGenerator[BaseEvent, None]
        """
        # Invoke callbacks
        mutations = await self._invoke_callbacks(event)

        # Apply mutations if any
        if mutations:
            await self._apply_mutations(mutations)

        # Yield the event
        yield event

    async def _apply_mutations(self, mutations: Dict[str, Any]) -> None:
        """Apply mutations to agent state.

        Subclasses should override this to implement state mutation logic.
        By default, this method does nothing.

        :param mutations: Mutations to apply
        :type mutations: Dict[str, Any]
        """
        pass

    # Context Management

    @contextmanager
    def as_current(self):
        """Context manager to set this agent as current.

        This allows accessing the current agent from anywhere in the call stack
        using BaseAgent.get_current().

        :yields: The current agent instance
        :ytype: BaseAgent

        Example::

            with agent.as_current():
                # agent is now accessible via BaseAgent.get_current()
                current = BaseAgent.get_current()
                assert current is agent
        """
        token = _current_agent.set(self)
        try:
            yield self
        finally:
            _current_agent.reset(token)

    @staticmethod
    def get_current() -> Optional["BaseAgent"]:
        """Get the current agent from context.

        :return: Current agent or None if no agent is set
        :rtype: Optional[BaseAgent]
        """
        return _current_agent.get()

    # ============ Event ID Fixing ============

    def _fix_event_ids(self, event: BaseEvent, thread_id: str, run_id: str) -> BaseEvent:
        """Fix event IDs to match run context.

        Useful for frameworks that don't set thread_id/run_id correctly.
        This method modifies the event in-place.

        :param event: Event to fix
        :type event: BaseEvent
        :param thread_id: Correct thread ID
        :type thread_id: str
        :param run_id: Correct run ID
        :type run_id: str
        :return: Fixed event (same instance)
        :rtype: BaseEvent
        """
        if hasattr(event, "thread_id") and not event.thread_id:
            event.thread_id = thread_id
        if hasattr(event, "run_id") and not event.run_id:
            event.run_id = run_id
        return event

    # Core Interface

    @abstractmethod
    def run(self, run_input: RunAgentInput) -> AsyncGenerator[BaseEvent, None]:
        """Execute the agent with the given input.

        This is the main execution method that all agent implementations must provide.
        It should process the input, execute the agent logic, and yield events
        representing the agent's progress and results.

        :param run_input: Input data for the agent execution containing messages, run_id,
                         thread_id, state, context, tools, and forwarded_props
        :type run_input: RunAgentInput

        :yield: Events representing the agent's execution progress
        :rtype: AsyncGenerator[BaseEvent, None]

        :raises NotImplementedError: If the method is not implemented by subclass

        Example:
            Implementing the run method::

                from ag_ui.core import RunAgentInput

                async def run(
                    self,
                    run_input: RunAgentInput
                ) -> AsyncGenerator[BaseEvent, None]:
                    # Emit run started event
                    yield RunStartedEvent(
                        type=EventType.RUN_STARTED,
                        thread_id=run_input.thread_id,
                        run_id=run_input.run_id
                    )

                    try:
                        # Execute agent logic
                        result = await self._agent.execute(run_input)

                        # Emit result events
                        yield TextMessageStartEvent(...)
                        yield TextMessageContentEvent(...)
                        yield TextMessageEndEvent(...)

                        # Emit run finished event
                        yield RunFinishedEvent(
                            type=EventType.RUN_FINISHED,
                            thread_id=run_input.thread_id,
                            run_id=run_input.run_id
                        )
                    except Exception as e:
                        # Emit error event
                        yield RunErrorEvent(
                            type=EventType.RUN_ERROR,
                            thread_id=run_input.thread_id,
                            run_id=run_input.run_id,
                            message=str(e)
                        )
        """
        raise NotImplementedError("Subclasses must implement the run method")

    def destroy(self) -> None:
        """Clean up resources used by the agent.

        This method should be called when the agent is no longer needed
        to properly release any resources (connections, memory, etc.).

        Subclasses can override this method to provide custom cleanup logic.
        """
        # Clear callbacks, proxies, and buffers
        self._callbacks.clear()
        self._tool_proxies.clear()
        self._text_buffers.clear()
        self._tool_call_buffers.clear()
