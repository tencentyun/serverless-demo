#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Observability Monkey Patch for LangGraph.

This module provides monkey patches to inject observability callbacks
into LangGraph execution, enabling tracing without requiring changes
to the underlying ag_ui_langgraph library.

The patch uses a context variable to store the callback, making it available
to all LangChain runnables (including LLM) invoked during graph execution.
"""

from contextvars import ContextVar
from typing import Any, Callable, Optional

# Store original functions
_original_invoke: Optional[Callable[..., Any]] = None
_original_stream: Optional[Callable[..., Any]] = None

# Context variable to store the observability callback
# This allows the callback to be accessed by any LLM/Runnable during graph execution
_observability_callback_var: ContextVar[Optional[Any]] = ContextVar(
    "observability_callback", default=None
)


def set_observability_callback(callback: Any) -> None:
    """Set the observability callback for the current context.

    Args:
        callback: The callback handler to inject into LangGraph/LangChain execution
    """
    _observability_callback_var.set(callback)


def get_observability_callback() -> Optional[Any]:
    """Get the observability callback for the current context.

    Returns:
        The callback handler if set, otherwise None
    """
    return _observability_callback_var.get()


def clear_observability_callback() -> None:
    """Clear the observability callback for the current context."""
    _observability_callback_var.set(None)


def apply_observability_patch() -> None:
    """Apply monkey patches for observability support.

    This function patches:
    1. LangGraph's astream_events to inject callbacks
    2. LangChain's BaseRunnable to auto-inject callbacks from ContextVar
    """
    global _original_invoke, _original_stream

    if _original_stream is not None:
        return  # Already patched

    try:
        from langgraph.graph.state import CompiledStateGraph

        # Store original methods
        _original_invoke = CompiledStateGraph.ainvoke  # type: ignore
        _original_stream = CompiledStateGraph.astream_events  # type: ignore

        # Define patched astream_events
        async def _patched_astream_events(
            self: Any,
            input: Any,
            config: Any = None,
            *,
            version: Any = None,
            **kwargs: Any,
        ) -> Any:
            """Patched astream_events that injects observability callbacks."""
            if _original_stream is None:
                raise RuntimeError("Original astream_events not stored")

            # Get callback from context variable
            callback = get_observability_callback()

            if callback:
                # Inject callback into config's callbacks list
                if config is None:
                    config = {}
                callbacks = list(config.get("callbacks", []))
                callbacks.append(callback)
                config["callbacks"] = callbacks

                # Also inject into kwargs for LangChain's event system
                kwargs_callbacks = list(kwargs.get("callbacks", []))
                kwargs_callbacks.append(callback)
                kwargs["callbacks"] = kwargs_callbacks

            # Call original function and yield from its async generator
            async for event in _original_stream(self, input, config, version=version, **kwargs):
                yield event

        # Define patched ainvoke (for completeness, though less commonly used)
        async def _patched_ainvoke(
            self: Any,
            input: Any,
            config: Any = None,
            **kwargs: Any,
        ) -> Any:
            """Patched ainvoke that injects observability callbacks."""
            if _original_invoke is None:
                raise RuntimeError("Original ainvoke not stored")

            # Get callback from context variable
            callback = get_observability_callback()

            if callback:
                # Inject callback into config
                if config is None:
                    config = {}
                callbacks = list(config.get("callbacks", []))
                callbacks.append(callback)
                config["callbacks"] = callbacks

            # Call original function
            return await _original_invoke(self, input, config, **kwargs)

        # Apply patches to CompiledStateGraph
        CompiledStateGraph.astream_events = _patched_astream_events  # type: ignore
        CompiledStateGraph.ainvoke = _patched_ainvoke  # type: ignore

        # Also patch LangChain's BaseRunnable to auto-inject callbacks from ContextVar
        try:
            from langchain_core.runnables.base import BaseRunnable

            _original_ainvoke = BaseRunnable.ainvoke
            _original_ainvoke_async = BaseRunnable.ainvoke  # Same method for sync/async

            def _patched_runnable_invoke(self, input, config=None, **kwargs):
                # Auto-inject callback from ContextVar
                callback = get_observability_callback()
                if callback:
                    if config is None:
                        config = {}
                    callbacks = list(config.get("callbacks", []))
                    # Avoid duplicate callbacks
                    callback_ids = [id(cb) for cb in callbacks]
                    if id(callback) not in callback_ids:
                        callbacks.append(callback)
                    config["callbacks"] = callbacks

                return _original_ainvoke(self, input, config, **kwargs)

            async def _patched_runnable_ainvoke(self, input, config=None, **kwargs):
                # Auto-inject callback from ContextVar
                callback = get_observability_callback()
                if callback:
                    if config is None:
                        config = {}
                    callbacks = list(config.get("callbacks", []))
                    callback_ids = [id(cb) for cb in callbacks]
                    if id(callback) not in callback_ids:
                        callbacks.append(callback)
                    config["callbacks"] = callbacks

                return await _original_ainvoke(self, input, config, **kwargs)

            BaseRunnable.invoke = _patched_runnable_invoke
            BaseRunnable.ainvoke = _patched_runnable_ainvoke

        except ImportError:
            pass  # LangChain Core not available or different version

    except Exception:
        pass  # LangGraph not available


def remove_observability_patch() -> None:
    """Remove monkey patches for observability support."""
    global _original_invoke, _original_stream

    if _original_stream is None:
        return  # Not patched

    try:
        from langgraph.graph.state import CompiledStateGraph

        # Restore original methods
        if _original_invoke:
            CompiledStateGraph.ainvoke = _original_invoke  # type: ignore
        if _original_stream:
            CompiledStateGraph.astream_events = _original_stream  # type: ignore

        _original_invoke = None
        _original_stream = None

    except Exception:
        pass
