"""
Observability - OpenTelemetry-based tracing with OpenInference semantic conventions.

This package provides observability capabilities for agents using OpenTelemetry
and OpenInference semantic conventions.
"""

from cloudbase_agent.observability.span_wrapper import (
    Observation,
    ObservationAgent,
    ObservationChain,
    ObservationEmbedding,
    ObservationLLM,
    ObservationRetriever,
    ObservationReranker,
    ObservationTool,
)
from cloudbase_agent.observability.tracer import get_tracer, set_tracer_provider
from cloudbase_agent.observability.attributes import (
    create_observation_attributes,
    create_trace_attributes,
)
from cloudbase_agent.observability.types import (
    ObservationLevel,
    ObservationType,
    LLMMessage,
    ToolCall,
    ToolCallFunction,
    Document,
)
from cloudbase_agent.observability.api import (
    start_observation,
    update_active_trace,
    get_active_trace_id,
    get_active_span_id,
)
from cloudbase_agent.observability.trace_context import (
    validate_trace_id,
    validate_span_id,
    validate_trace_context,
    create_span_link_from_context,
    extract_trace_context_from_headers,
    process_trace_context_from_headers,
    TraceContextValidation,
    ProcessedTraceContext,
)
from cloudbase_agent.observability.constants import (
    OpenInferenceAttributes,
    OpenInferenceSpanKind,
    OtelSpanAttributes,
    OBSERVABILITY_TRACER_NAME,
    OBSERVABILITY_SDK_NAME,
    OBSERVABILITY_SDK_VERSION,
)

# Server utilities (optional import - requires opentelemetry-sdk)
try:
    from cloudbase_agent.observability.server import (
        setup_observability,
        setup_observability_async,
        BatchConfig,
        ConsoleTraceConfig,
        OTLPTraceConfig,
        CustomTraceConfig,
        ObservabilityConfig,
    )
    SERVER_AVAILABLE = True
except ImportError:
    SERVER_AVAILABLE = False

__all__ = [
    # Span wrapper classes
    "Observation",
    "ObservationLLM",
    "ObservationEmbedding",
    "ObservationAgent",
    "ObservationTool",
    "ObservationChain",
    "ObservationRetriever",
    "ObservationReranker",
    # Tracer functions
    "get_tracer",
    "set_tracer_provider",
    # Attribute functions
    "create_observation_attributes",
    "create_trace_attributes",
    # Types
    "ObservationType",
    "ObservationLevel",
    "LLMMessage",
    "ToolCall",
    "ToolCallFunction",
    "Document",
    # API functions
    "start_observation",
    "update_active_trace",
    "get_active_trace_id",
    "get_active_span_id",
    # Trace context utilities
    "validate_trace_id",
    "validate_span_id",
    "validate_trace_context",
    "create_span_link_from_context",
    "extract_trace_context_from_headers",
    "process_trace_context_from_headers",
    "TraceContextValidation",
    "ProcessedTraceContext",
    # Constants
    "OpenInferenceAttributes",
    "OpenInferenceSpanKind",
    "OtelSpanAttributes",
    "OBSERVABILITY_TRACER_NAME",
    "OBSERVABILITY_SDK_NAME",
    "OBSERVABILITY_SDK_VERSION",
]

# Server exports (available only when opentelemetry-sdk is installed)
if SERVER_AVAILABLE:
    __all__.extend([
        # Server setup API
        "setup_observability",
        "setup_observability_async",
        # Server configuration types
        "BatchConfig",
        "ConsoleTraceConfig",
        "OTLPTraceConfig",
        "CustomTraceConfig",
        "ObservabilityConfig",
    ])

__version__ = "0.1.0"
