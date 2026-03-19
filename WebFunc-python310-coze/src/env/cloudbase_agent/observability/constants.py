"""
OTEL attribute constants for observability.

Uses OpenInference semantic conventions where applicable:
https://github.com/Arize-ai/openinference/tree/main/spec

Falls back to non-standard attributes where OpenInference doesn't define a standard.
"""

from enum import Enum
from openinference.semconv.trace import SpanAttributes, OpenInferenceSpanKindValues


# Re-export OpenInference SpanAttributes for standard attributes
# Use this for all OpenInference standard conventions (input.value, llm.model_name, etc.)
OpenInferenceAttributes = SpanAttributes


# Re-export OpenInference span kind values
class OpenInferenceSpanKind(str, Enum):
    """OpenInference span kind values."""

    AGENT = OpenInferenceSpanKindValues.AGENT.value
    CHAIN = OpenInferenceSpanKindValues.CHAIN.value
    LLM = OpenInferenceSpanKindValues.LLM.value
    TOOL = OpenInferenceSpanKindValues.TOOL.value
    RETRIEVER = OpenInferenceSpanKindValues.RETRIEVER.value
    EMBEDDING = OpenInferenceSpanKindValues.EMBEDDING.value
    RERANKER = OpenInferenceSpanKindValues.RERANKER.value
    EVALUATOR = OpenInferenceSpanKindValues.EVALUATOR.value
    GUARDRAIL = OpenInferenceSpanKindValues.GUARDRAIL.value


# SDK information
"""Constants for observability.

Note: keep identifiers brandless. Users can still set OTEL_SERVICE_NAME.
"""

OBSERVABILITY_TRACER_NAME = "agui-tracer"
OBSERVABILITY_SDK_NAME = "observability"
OBSERVABILITY_SDK_VERSION = "0.1.0"


class OtelSpanAttributes(str, Enum):
    """
    Specific (non-standard) OTEL attributes.

    For standard OpenInference attributes (input.value, llm.model_name, etc.),
    use OpenInferenceAttributes (SpanAttributes) instead.
    """

    # Trace attributes (non-standard)
    TRACE_NAME = "trace.name"
    TRACE_TAGS = "trace.tags"
    TRACE_PUBLIC = "trace.public"
    TRACE_METADATA = "trace.metadata"
    TRACE_INPUT = "trace.input"
    TRACE_OUTPUT = "trace.output"

    # Observation attributes (non-standard)
    OBSERVATION_TYPE = "observation.type"
    OBSERVATION_LEVEL = "observation.level"
    OBSERVATION_STATUS_MESSAGE = "observation.status_message"
    OBSERVATION_INPUT = "observation.input"
    OBSERVATION_OUTPUT = "observation.output"
    OBSERVATION_METADATA = "observation.metadata"

    # LLM-specific (non-standard)
    LLM_COMPLETION_START_TIME = "llm.completion_start_time"
    LLM_MODEL_PARAMETERS = "llm.model_parameters"
    LLM_USAGE_DETAILS = "llm.usage_details"
    LLM_COST_DETAILS = "llm.cost_details"

    # Retriever-specific (non-standard)
    RETRIEVER_NAME = "retriever.name"
    RETRIEVER_QUERY = "retriever.query"
    RETRIEVER_INDEX_ID = "retriever.index_id"
    RETRIEVER_TOP_K = "retriever.top_k"

    # General (non-standard)
    ENVIRONMENT = "environment"
    RELEASE = "release"
    VERSION = "version"
