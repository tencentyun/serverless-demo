"""
Public API for observability.

Provides convenient functions for creating and managing observations.
"""

from datetime import datetime
from typing import Any, Dict, Optional, Union, overload, Sequence

from opentelemetry import context, trace
from opentelemetry.trace import SpanContext, Status, StatusCode, Link
from opentelemetry.util.types import AttributeValue

from cloudbase_agent.observability.types import (
    ObservationType,
    BaseSpanAttributes,
    LLMAttributes,
    EmbeddingAttributes,
    AgentAttributes,
    ToolAttributes,
    ChainAttributes,
    RetrieverAttributes,
    RerankerAttributes,
    EvaluatorAttributes,
    GuardrailAttributes,
    ObservationAttributes,
    TraceAttributes,
)
from cloudbase_agent.observability.span_wrapper import (
    Observation,
    ObservationLLM,
    ObservationEmbedding,
    ObservationAgent,
    ObservationTool,
    ObservationChain,
    ObservationRetriever,
    ObservationReranker,
    ObservationEvaluator,
    ObservationGuardrail,
)
from cloudbase_agent.observability.tracer import get_tracer
from cloudbase_agent.observability.attributes import (
    update_active_trace as _update_active_trace,
    get_active_trace_id as _get_active_trace_id,
    get_active_span_id as _get_active_span_id,
)


def _create_parent_context(
    parent_span_context: Optional[SpanContext],
) -> context.Context:
    """Create a parent context from a span context.

    Args:
        parent_span_context: The span context to use as parent.

    Returns:
        The created context (returns current context if no parent).
    """
    # Create a NonRecordingSpan with the parent context
    from opentelemetry.trace import NonRecordingSpan
    parent_span = NonRecordingSpan(parent_span_context)

    # Use the parent context to set the span in context
    return trace.set_span_in_context(parent_span)


@overload
def start_observation(
    name: str,
    attributes: LLMAttributes,
    *,
    as_type: "Literal['llm']",
    parent_span_context: Optional[SpanContext] = None,
    start_time: Optional[datetime] = None,
    links: Optional[Sequence[Link]] = None,
) -> ObservationLLM:
    ...


@overload
def start_observation(
    name: str,
    attributes: EmbeddingAttributes,
    *,
    as_type: "Literal['embedding']",
    parent_span_context: Optional[SpanContext] = None,
    start_time: Optional[datetime] = None,
    links: Optional[Sequence[Link]] = None,
) -> ObservationEmbedding:
    ...


@overload
def start_observation(
    name: str,
    attributes: AgentAttributes,
    *,
    as_type: "Literal['agent']",
    parent_span_context: Optional[SpanContext] = None,
    start_time: Optional[datetime] = None,
    links: Optional[Sequence[Link]] = None,
) -> ObservationAgent:
    ...


@overload
def start_observation(
    name: str,
    attributes: ToolAttributes,
    *,
    as_type: "Literal['tool']",
    parent_span_context: Optional[SpanContext] = None,
    start_time: Optional[datetime] = None,
    links: Optional[Sequence[Link]] = None,
) -> ObservationTool:
    ...


@overload
def start_observation(
    name: str,
    attributes: ChainAttributes,
    *,
    as_type: "Literal['chain']",
    parent_span_context: Optional[SpanContext] = None,
    start_time: Optional[datetime] = None,
    links: Optional[Sequence[Link]] = None,
) -> ObservationChain:
    ...


@overload
def start_observation(
    name: str,
    attributes: RetrieverAttributes,
    *,
    as_type: "Literal['retriever']",
    parent_span_context: Optional[SpanContext] = None,
    start_time: Optional[datetime] = None,
    links: Optional[Sequence[Link]] = None,
) -> ObservationRetriever:
    ...


@overload
def start_observation(
    name: str,
    attributes: RerankerAttributes,
    *,
    as_type: "Literal['reranker']",
    parent_span_context: Optional[SpanContext] = None,
    start_time: Optional[datetime] = None,
    links: Optional[Sequence[Link]] = None,
) -> ObservationReranker:
    ...


@overload
def start_observation(
    name: str,
    attributes: EvaluatorAttributes,
    *,
    as_type: "Literal['evaluator']",
    parent_span_context: Optional[SpanContext] = None,
    start_time: Optional[datetime] = None,
    links: Optional[Sequence[Link]] = None,
) -> ObservationEvaluator:
    ...


@overload
def start_observation(
    name: str,
    attributes: GuardrailAttributes,
    *,
    as_type: "Literal['guardrail']",
    parent_span_context: Optional[SpanContext] = None,
    start_time: Optional[datetime] = None,
    links: Optional[Sequence[Link]] = None,
) -> ObservationGuardrail:
    ...


def start_observation(
    name: str,
    attributes: Optional[ObservationAttributes] = None,
    *,
    as_type: ObservationType = "chain",
    parent_span_context: Optional[SpanContext] = None,
    start_time: Optional[datetime] = None,
    links: Optional[Sequence[Link]] = None,
) -> Observation:
    """Create and start a new observation.

    Supports multiple observation types with full type safety:
    - **chain**: Multi-step workflows (default for generic operations)
    - **llm**: LLM calls and AI model interactions
    - **embedding**: Text embedding and vector operations
    - **agent**: AI agent workflows
    - **tool**: Individual tool calls
    - **retriever**: Document retrieval
    - **reranker**: Result reranking
    - **evaluator**: Quality assessment
    - **guardrail**: Safety checks

    Args:
        name: Descriptive name for the observation.
        attributes: Type-specific attributes.
        as_type: Type of observation to create. Defaults to 'chain'.
        parent_span_context: Optional parent span context for linking.
        start_time: Optional custom start time.
        links: Optional sequence of Links to external or related spans.

    Returns:
        Strongly-typed observation object.

    Examples:
        LLM observation:
        >>> llm = start_observation('openai-gpt-4', {
        ...     'input': [{'role': 'user', 'content': 'Hello'}],
        ...     'model': 'gpt-4',
        ...     'model_parameters': {'temperature': 0.7}
        ... }, as_type='llm')

        Tool observation:
        >>> tool = start_observation('weather-api', {
        ...     'input': {'location': 'SF'}
        ... }, as_type='tool')

        Chain observation with external link:
        >>> from opentelemetry.trace import Link, SpanContext, TraceFlags
        >>> external_context = SpanContext(
        ...     trace_id=int('0af7651916cd43dd8448eb211c80319c', 16),
        ...     span_id=int('00f067aa0ba902b7', 16),
        ...     is_remote=True,
        ...     trace_flags=TraceFlags(0x01)
        ... )
        >>> link = Link(context=external_context)
        >>> chain = start_observation('my-operation', links=[link])
    """
    tracer = get_tracer()

    # Start the OTEL span with optional parent context and links
    if parent_span_context:
        # Create a non-recording span from the parent context and set it as parent
        # This properly propagates the trace hierarchy without manual context management
        from opentelemetry.trace import NonRecordingSpan
        parent_span = NonRecordingSpan(parent_span_context)
        parent_ctx = trace.set_span_in_context(parent_span)

        # Start span with explicit parent context and links
        # Note: We don't manually attach/detach contexts in async environments
        # as this causes "token was created in a different Context" errors
        # OpenTelemetry will handle context propagation automatically
        otel_span = tracer.start_span(
            name,
            context=parent_ctx,
            start_time=start_time,
            links=links or [],
        )
    else:
        # Start span without explicit parent (uses current context)
        otel_span = tracer.start_span(
            name,
            start_time=start_time,
            links=links or [],
        )

    # Create the appropriate observation wrapper
    if as_type == "llm":
        return ObservationLLM(otel_span, attributes)
    elif as_type == "embedding":
        return ObservationEmbedding(otel_span, attributes)
    elif as_type == "agent":
        return ObservationAgent(otel_span, attributes)
    elif as_type == "tool":
        return ObservationTool(otel_span, attributes)
    elif as_type == "chain":
        return ObservationChain(otel_span, attributes)
    elif as_type == "retriever":
        return ObservationRetriever(otel_span, attributes)
    elif as_type == "reranker":
        return ObservationReranker(otel_span, attributes)
    elif as_type == "evaluator":
        return ObservationEvaluator(otel_span, attributes)
    elif as_type == "guardrail":
        return ObservationGuardrail(otel_span, attributes)
    else:
        return ObservationChain(otel_span, attributes)


def update_active_trace(attributes: TraceAttributes) -> None:
    """Update the currently active trace with new attributes.

    Args:
        attributes: Trace attributes to set.
    """
    _update_active_trace(attributes)


def get_active_trace_id() -> Optional[str]:
    """Get the current active trace ID.

    Returns:
        The trace ID as a hex string, or None if no active span.
    """
    return _get_active_trace_id()


def get_active_span_id() -> Optional[str]:
    """Get the current active observation ID.

    Returns:
        The span ID as a hex string, or None if no active span.
    """
    return _get_active_span_id()
