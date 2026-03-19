"""
CrewAI Callback Handler for OpenTelemetry Observability.

This handler provides automatic instrumentation for CrewAI workflows using
OpenInference's wrapt-based approach. Unlike LangChain's callback mechanism,
CrewAI requires method-level instrumentation.

The handler wraps:
- Task._execute_core: Individual task execution
- Crew.kickoff: Crew workflow kickoff
- Flow.kickoff_async: Flow async execution
- Flow._execute_method: Flow method execution (custom)
- ToolUsage._use: Tool calls
- Memory operations: LongTermMemory and ShortTermMemory
"""

import importlib
import logging
from typing import TYPE_CHECKING, Any, Callable, Dict, Optional
from functools import wraps

if TYPE_CHECKING:
    from opentelemetry.sdk.trace import TracerProvider

logger = logging.getLogger(__name__)

__version__ = "0.1.0"

# LLM SDK instrumentor 映射表
# key: 标识名, value: (模块导入路径, 类名)
# Note: Only includes packages verified to exist on PyPI
# Note: LangChain is excluded as CrewAI's instrumentor already handles it
LLM_INSTRUMENTOR_MAP = {
    "litellm": ("openinference.instrumentation.litellm", "LiteLLMInstrumentor"),
    "openai": ("openinference.instrumentation.openai", "OpenAIInstrumentor"),
}


class CallbackHandler:
    """
    Callback Handler for CrewAI observability.

    This class manages the lifecycle of OpenInference's CrewAI instrumentation.
    It provides a simple interface to enable/disable tracing for CrewAI workflows.

    Unlike LangChain's BaseCallbackHandler which uses official callbacks,
    this handler uses OpenInference's wrapt-based instrumentation to wrap
    CrewAI's internal methods.

    **Multi-LLM SDK Support**
    This handler automatically instruments popular LLM SDKs without requiring
    any code changes. The following instrumentations are included by default:
    - LangChain (openinference-instrumentation-langchain)
    - LiteLLM (openinference-instrumentation-litellm)
    - OpenAI (openinference-instrumentation-openai, also covers Azure OpenAI)

    Simply use any supported LLM SDK in your CrewAI code and it will be
    automatically instrumented when setup() is called.

    :param adapter_name: Name of the adapter for span naming (default: "CrewAI")
    :type adapter_name: str
    :param enabled: Whether to enable instrumentation (default: True)
    :type enabled: bool

    Example:
        Basic usage::

            from cloudbase_agent.observability.crewai import CallbackHandler

            handler = CallbackHandler()
            handler.setup()

            # Your CrewAI code here - any LLM SDK works automatically
            # ...

            handler.teardown()

        With custom adapter name::

            handler = CallbackHandler(adapter_name="MyCrewAIAdapter")

        Disabled by default (enable later)::

            handler = CallbackHandler(enabled=False)
            # ... later ...
            handler.setup()
    """

    def __init__(
        self,
        adapter_name: str = "CrewAI",
        enabled: bool = True,
    ):
        """Initialize the CrewAI Callback Handler.

        :param adapter_name: Name for the adapter in span names
        :type adapter_name: str
        :param enabled: Whether instrumentation is enabled
        :type enabled: bool
        """
        self._adapter_name = adapter_name
        self._enabled = enabled
        self._instrumentor = None
        self._is_instrumented = False

        # Lazy import OpenInference components
        self._CrewAIInstrumentor = None
        self._TraceConfig = None

        # Custom wrappers for Flow methods
        self._original_flow_execute_method = None
        self._tracer = None

        # LLM SDK instrumentors (auto-detected and enabled, includes LangChain)
        self._llm_instrumentors: Dict[str, Any] = {}

        # External parent context for Server layer trace propagation
        self.external_parent_context = None
        self.external_metadata: Optional[Dict[str, str]] = None

    def _load_openinference(self) -> bool:
        """Lazy load OpenInference CrewAI instrumentation.

        Returns True if successfully loaded, False otherwise.
        """
        if self._CrewAIInstrumentor is not None:
            return True

        try:
            from openinference.instrumentation.crewai import CrewAIInstrumentor
            from openinference.instrumentation import TraceConfig

            self._CrewAIInstrumentor = CrewAIInstrumentor
            self._TraceConfig = TraceConfig
            logger.debug("✓ OpenInference CrewAI loaded")

            return True

        except ImportError as e:
            logger.warning(
                f"✗ OpenInference not available: {e}. "
                "Install with: pip install openinference-instrumentation-crewai"
            )
            return False
        except Exception as e:
            logger.error(f"✗ Failed to load OpenInference: {e}")
            return False

    def _load_llm_instrumentors(self) -> Dict[str, Any]:
        """Lazy load available LLM SDK instrumentors.

        Auto-detects and loads instrumentors for popular LLM SDKs.
        Returns a dict of {name: instrumentor_class} for successfully loaded instrumentors.
        """
        loaded = {}

        for name, (module_path, class_name) in LLM_INSTRUMENTOR_MAP.items():
            try:
                module = importlib.import_module(module_path)
                instrumentor_class = getattr(module, class_name)
                loaded[name] = instrumentor_class
                logger.debug(f"✓ LLM instrumentor loaded: {name}")
            except ImportError:
                logger.debug(f"ℹ LLM instrumentor not available: {name}")
            except Exception as e:
                logger.warning(f"✗ Failed to load LLM instrumentor {name}: {e}")

        return loaded

    def set_external_parent_context(
        self, span_context, metadata: Optional[Dict[str, str]] = None
    ) -> None:
        """Set external parent span context from server layer.

        This allows linking adapter-level observations to the server span,
        enabling proper trace hierarchy across the stack.

        Args:
            span_context: OpenTelemetry SpanContext from the server layer
            metadata: Optional metadata from server (e.g., thread_id, run_id)

        Example:
            In the agent, after receiving server context from forwardedProps::

                server_context_data = run_input.forwarded_props["__agui_server_context"]
                server_span_context = SpanContext(
                    trace_id=int(server_context_data["trace_id"], 16),
                    span_id=int(server_context_data["span_id"], 16),
                    is_remote=False,
                    trace_flags=TraceFlags(server_context_data.get("trace_flags", 1)),
                )
                handler.set_external_parent_context(server_span_context, {
                    "thread_id": run_input.thread_id,
                    "run_id": run_input.run_id,
                })
        """
        self.external_parent_context = span_context
        self.external_metadata = metadata
        logger.debug(
            f"✓ External parent context set: "
            f"trace_id={format(span_context.trace_id, 'x')[:16]}..."
        )

    def setup(
        self,
        tracer_provider: Optional["TracerProvider"] = None,
        config: Optional[object] = None,
    ) -> None:
        """
        Set up CrewAI instrumentation.

        This method initializes the OpenInference CrewAI instrumentor and
        applies wrapt-based instrumentation to CrewAI's internal methods.
        Call this before running any CrewAI workflows.

        :param tracer_provider: Optional OpenTelemetry tracer provider.
                               If None, uses the global tracer provider set by trace.set_tracer_provider().
                               **Note:** Typically you should NOT pass this parameter.
                               Let OpenInference use the global provider instead.
        :type tracer_provider: Optional[TracerProvider]
        :param config: Optional TraceConfig for OpenInference.
        :type config: Optional[object]

        Example:
            Set up with global tracer provider (recommended)::

                # In your test/app entry point:
                from opentelemetry import trace
                from opentelemetry.sdk.trace import TracerProvider
                
                provider = TracerProvider()
                trace.set_tracer_provider(provider)  # Set global
                
                # Later, in agent code:
                handler = CallbackHandler()
                handler.setup()  # Uses global provider automatically

        Note:
            - This method is idempotent - calling it multiple times has no effect
              after the first successful instrumentation.
            - The global TracerProvider set by trace.set_tracer_provider() is
              automatically used by OpenInference if tracer_provider is None.
        """
        if not self._enabled:
            logger.debug("Instrumentation disabled, skipping setup")
            return

        if self._is_instrumented:
            logger.debug("Already instrumented, skipping setup")
            return

        # Lazy load OpenInference
        if not self._load_openinference():
            return

        try:
            # Create instrumentor instance
            self._instrumentor = self._CrewAIInstrumentor()

            # Prepare instrumentation kwargs
            instrument_kwargs = {}
            if tracer_provider is not None:
                instrument_kwargs["tracer_provider"] = tracer_provider
            if config is not None:
                instrument_kwargs["config"] = config
            elif self._TraceConfig is not None:
                instrument_kwargs["config"] = self._TraceConfig()

            # Apply instrumentation
            self._instrumentor.instrument(**instrument_kwargs)

            # Auto-detect and instrument popular LLM SDKs (including LangChain)
            llm_instrumentor_classes = self._load_llm_instrumentors()
            for name, instrumentor_class in llm_instrumentor_classes.items():
                try:
                    instrumentor = instrumentor_class()
                    instrumentor.instrument(**instrument_kwargs)
                    self._llm_instrumentors[name] = instrumentor
                    logger.debug(f"✓ LLM instrumentation applied: {name}")
                except Exception as e:
                    logger.warning(f"✗ LLM instrumentation failed for {name}: {e}")

            # Get tracer for custom wrappers
            from opentelemetry import trace
            self._tracer = trace.get_tracer(__name__, __version__)

            # Wrap Flow._execute_method to create spans for each flow method execution
            self._wrap_flow_execute_method()

            self._is_instrumented = True

            logger.debug(f"✓ Instrumentation enabled for {self._adapter_name}")

        except Exception as e:
            logger.warning(f"✗ Failed to setup instrumentation: {e}")
            # Silent failure - observability should never block main flow
            self._is_instrumented = False

    def _wrap_flow_execute_method(self) -> None:
        """Wrap Flow._execute_method to create spans for each flow method execution.

        OpenInference only wraps Flow.kickoff_async, but doesn't create spans
        for individual flow methods. This custom wrapper adds that functionality.

        Key insight: start_as_current_span() automatically uses the current span
        in the OpenTelemetry context as parent. When Flow.kickoff_async (wrapped by
        OpenInference) calls _execute_method, the current span will be the OpenInference
        span, and our new span will automatically be its child.

        Server layer propagation: When Agent sets Server context using use_span(),
        OpenInference's wrapper uses it as parent, so all Flow spans share the same trace_id.
        """
        try:
            from crewai.flow import Flow
            from opentelemetry import trace

            # Store original method
            self._original_flow_execute_method = Flow._execute_method

            # Capture self for use in closure
            handler_self = self

            # Create wrapper that creates spans
            @wraps(Flow._execute_method)
            async def _execute_method_wrapper(flow_instance, method_name, method, *args, **kwargs):
                """Wrapper that creates a span for each flow method execution."""
                span_name = f"Flow.{method_name}"

                # start_as_current_span will automatically use current span as parent!
                with handler_self._tracer.start_as_current_span(span_name) as span:
                    # Add OpenInference span kind attribute
                    from openinference.semconv.trace import SpanAttributes
                    span.set_attribute(
                        SpanAttributes.OPENINFERENCE_SPAN_KIND,
                        "CHAIN"
                    )
                    span.set_attribute("flow_method.name", method_name)
                    span.set_attribute("flow_method.id", str(method_name))

                    # Call original method
                    return await handler_self._original_flow_execute_method(
                        flow_instance, method_name, method, *args, **kwargs
                    )

            # Replace the method
            Flow._execute_method = _execute_method_wrapper
            logger.debug("✓ Flow._execute_method wrapped")

        except ImportError:
            logger.warning("✗ CrewAI Flow not available, skipping _execute_method wrapper")
        except Exception as e:
            logger.error(f"✗ Failed to wrap Flow._execute_method: {e}")

    def _unwrap_flow_execute_method(self) -> None:
        """Restore original Flow._execute_method."""
        if self._original_flow_execute_method is not None:
            try:
                from crewai.flow import Flow
                Flow._execute_method = self._original_flow_execute_method
                self._original_flow_execute_method = None
                logger.debug("✓ Flow._execute_method restored")
            except Exception as e:
                logger.warning(f"✗ Failed to unwrap Flow._execute_method: {e}")

    def teardown(self) -> None:
        """
        Remove CrewAI instrumentation.

        This method uninstalls the wrapt-based instrumentation from CrewAI's
        internal methods. Call this when shutting down your application or
        when you no longer need tracing.

        Example:
            Basic teardown::

                handler = CallbackHandler()
                handler.setup()

                # ... your CrewAI code ...

                handler.teardown()

        Note:
            After teardown, you can call setup() again to re-enable instrumentation.
        """
        if not self._is_instrumented:
            logger.debug("Not instrumented, skipping teardown")
            return

        if self._instrumentor is None:
            logger.debug("No instrumentor to teardown")
            return

        try:
            # Unwrap Flow._execute_method first
            self._unwrap_flow_execute_method()

            # Uninstrument all LLM SDKs (including LangChain)
            for name, instrumentor in self._llm_instrumentors.items():
                try:
                    instrumentor.uninstrument()
                    logger.debug(f"✓ LLM instrumentation removed: {name}")
                except Exception as e:
                    logger.warning(f"✗ LLM uninstrument failed for {name}: {e}")
            self._llm_instrumentors.clear()

            # Uninstrument OpenInference CrewAI
            self._instrumentor.uninstrument()
            self._is_instrumented = False
            logger.info(f"✓ Instrumentation disabled for {self._adapter_name}")

        except Exception as e:
            logger.warning(f"✗ Failed to teardown instrumentation: {e}")
            # Silent failure - observability should never block main flow

    @property
    def is_instrumented(self) -> bool:
        """
        Check if instrumentation is currently active.

        :return: True if instrumentation is active, False otherwise
        :rtype: bool

        Example:
            Check instrumentation status::

                handler = CallbackHandler()
                print(handler.is_instrumented)  # False

                handler.setup()
                print(handler.is_instrumented)  # True

                handler.teardown()
                print(handler.is_instrumented)  # False
        """
        return self._is_instrumented

    def __enter__(self):
        """Context manager entry - setup instrumentation.

        Example:
            Using as context manager::

                with CallbackHandler() as handler:
                    # Your CrewAI code here
                    # ...
                # Instrumentation automatically torn down
        """
        self.setup()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - teardown instrumentation."""
        self.teardown()
        return False


__all__ = ["CallbackHandler"]
