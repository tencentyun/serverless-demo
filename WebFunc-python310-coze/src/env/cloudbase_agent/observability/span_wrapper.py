"""
Span wrapper classes for observability.

Provides type-safe wrappers around OpenTelemetry spans with OpenInference
semantic conventions.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, Optional, Union

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
from opentelemetry.util.types import AttributeValue

from cloudbase_agent.observability.types import (
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
    ObservationType,
    ObservationAttributes,
    TraceAttributes,
)
from cloudbase_agent.observability.attributes import (
    create_observation_attributes,
    create_trace_attributes,
)
from cloudbase_agent.observability.tracer import get_tracer


class BaseObservation(ABC):
    """Base class for all observation wrappers.

    Provides common functionality for all observation types including:
    - OpenTelemetry span integration
    - Unique identification (span ID, trace ID)
    - Lifecycle management (update, end)
    - Trace context management
    """

    def __init__(
        self,
        otel_span: trace.Span,
        observation_type: ObservationType,
        attributes: Optional[ObservationAttributes] = None,
    ):
        """Initialize the observation wrapper.

        Args:
            otel_span: The underlying OpenTelemetry span.
            observation_type: The type of observation.
            attributes: Optional initial attributes to set.
        """
        self._otel_span = otel_span
        self._type = observation_type
        self.id = format(otel_span.get_span_context().span_id, "016x")
        self.trace_id = format(otel_span.get_span_context().trace_id, "032x")

        # Set initial attributes if provided
        if attributes:
            obs_attrs = create_observation_attributes(observation_type, attributes)
            self._otel_span.set_attributes(obs_attrs)

    @property
    def otel_span(self) -> trace.Span:
        """Get the underlying OpenTelemetry span."""
        return self._otel_span

    @property
    def type(self) -> ObservationType:
        """Get the observation type."""
        return self._type

    def set_status(self, status: trace.Status) -> None:
        """Set the span status.

        Args:
            status: The status to set on the span.
        """
        self._otel_span.set_status(status)

    def set_error_status(self, message: str) -> None:
        """Set the span status to ERROR.

        Convenience method for marking the span as failed.

        Args:
            message: Error description message.
        """
        self._otel_span.set_status(Status(StatusCode.ERROR, message))

    def end(self, end_time: Optional[datetime] = None) -> None:
        """End the observation, marking it as complete.

        Args:
            end_time: Optional end time, defaults to current time.
        """
        self._otel_span.end(end_time=end_time)

    def _update_attributes(self, attributes: ObservationAttributes) -> "BaseObservation":
        """Update the OTEL span attributes.

        Args:
            attributes: Attributes to update.

        Returns:
            Self for method chaining.
        """
        obs_attrs = create_observation_attributes(self._type, attributes)
        self._otel_span.set_attributes(obs_attrs)
        return self

    def update_trace(self, attributes: TraceAttributes) -> "BaseObservation":
        """Update the parent trace with new attributes.

        Args:
            attributes: Trace attributes to set.

        Returns:
            Self for method chaining.
        """
        trace_attrs = create_trace_attributes(attributes)
        self._otel_span.set_attributes(trace_attrs)
        return self

class ObservationLLM(BaseObservation):
    """LLM observation for tracking language model calls."""

    def __init__(
        self,
        otel_span: trace.Span,
        attributes: Optional[LLMAttributes] = None,
    ):
        super().__init__(otel_span, ObservationType.LLM, attributes)
        self._attributes = attributes or LLMAttributes()

    def update(self, attributes: LLMAttributes) -> "ObservationLLM":
        """Update the observation with new attributes.

        Args:
            attributes: LLM-specific attributes to update.

        Returns:
            Self for method chaining.
        """
        self._update_attributes(attributes)
        return self


class ObservationEmbedding(BaseObservation):
    """Embedding observation for tracking embedding operations."""

    def __init__(
        self,
        otel_span: trace.Span,
        attributes: Optional[EmbeddingAttributes] = None,
    ):
        super().__init__(otel_span, ObservationType.EMBEDDING, attributes)
        self._attributes = attributes or EmbeddingAttributes()

    def update(self, attributes: EmbeddingAttributes) -> "ObservationEmbedding":
        """Update the observation with new attributes.

        Args:
            attributes: Embedding-specific attributes to update.

        Returns:
            Self for method chaining.
        """
        self._update_attributes(attributes)
        return self


class ObservationAgent(BaseObservation):
    """Agent observation for tracking AI agent workflows."""

    def __init__(
        self,
        otel_span: trace.Span,
        attributes: Optional[AgentAttributes] = None,
    ):
        super().__init__(otel_span, ObservationType.AGENT, attributes)
        self._attributes = attributes or AgentAttributes()

    def update(self, attributes: AgentAttributes) -> "ObservationAgent":
        """Update the observation with new attributes.

        Args:
            attributes: Agent-specific attributes to update.

        Returns:
            Self for method chaining.
        """
        self._update_attributes(attributes)
        return self


class ObservationTool(BaseObservation):
    """Tool observation for tracking tool calls."""

    def __init__(
        self,
        otel_span: trace.Span,
        attributes: Optional[ToolAttributes] = None,
    ):
        super().__init__(otel_span, ObservationType.TOOL, attributes)
        self._attributes = attributes or ToolAttributes()

    def update(self, attributes: ToolAttributes) -> "ObservationTool":
        """Update the observation with new attributes.

        Args:
            attributes: Tool-specific attributes to update.

        Returns:
            Self for method chaining.
        """
        self._update_attributes(attributes)
        return self


class ObservationChain(BaseObservation):
    """Chain observation for tracking multi-step workflows."""

    def __init__(
        self,
        otel_span: trace.Span,
        attributes: Optional[ChainAttributes] = None,
    ):
        super().__init__(otel_span, ObservationType.CHAIN, attributes)
        self._attributes = attributes or ChainAttributes()

    def update(self, attributes: ChainAttributes) -> "ObservationChain":
        """Update the observation with new attributes.

        Args:
            attributes: Chain-specific attributes to update.

        Returns:
            Self for method chaining.
        """
        self._update_attributes(attributes)
        return self


class ObservationRetriever(BaseObservation):
    """Retriever observation for tracking document retrieval."""

    def __init__(
        self,
        otel_span: trace.Span,
        attributes: Optional[RetrieverAttributes] = None,
    ):
        super().__init__(otel_span, ObservationType.RETRIEVER, attributes)
        self._attributes = attributes or RetrieverAttributes()

    def update(self, attributes: RetrieverAttributes) -> "ObservationRetriever":
        """Update the observation with new attributes.

        Args:
            attributes: Retriever-specific attributes to update.

        Returns:
            Self for method chaining.
        """
        self._update_attributes(attributes)
        return self


class ObservationReranker(BaseObservation):
    """Reranker observation for tracking reranking operations."""

    def __init__(
        self,
        otel_span: trace.Span,
        attributes: Optional[RerankerAttributes] = None,
    ):
        super().__init__(otel_span, ObservationType.RERANKER, attributes)
        self._attributes = attributes or RerankerAttributes()

    def update(self, attributes: RerankerAttributes) -> "ObservationReranker":
        """Update the observation with new attributes.

        Args:
            attributes: Reranker-specific attributes to update.

        Returns:
            Self for method chaining.
        """
        self._update_attributes(attributes)
        return self


class ObservationEvaluator(BaseObservation):
    """Evaluator observation for tracking evaluation operations."""

    def __init__(
        self,
        otel_span: trace.Span,
        attributes: Optional[EvaluatorAttributes] = None,
    ):
        super().__init__(otel_span, ObservationType.EVALUATOR, attributes)
        self._attributes = attributes or EvaluatorAttributes()

    def update(self, attributes: EvaluatorAttributes) -> "ObservationEvaluator":
        """Update the observation with new attributes.

        Args:
            attributes: Evaluator-specific attributes to update.

        Returns:
            Self for method chaining.
        """
        self._update_attributes(attributes)
        return self


class ObservationGuardrail(BaseObservation):
    """Guardrail observation for tracking safety checks."""

    def __init__(
        self,
        otel_span: trace.Span,
        attributes: Optional[GuardrailAttributes] = None,
    ):
        super().__init__(otel_span, ObservationType.GUARDRAIL, attributes)
        self._attributes = attributes or GuardrailAttributes()

    def update(self, attributes: GuardrailAttributes) -> "ObservationGuardrail":
        """Update the observation with new attributes.

        Args:
            attributes: Guardrail-specific attributes to update.

        Returns:
            Self for method chaining.
        """
        self._update_attributes(attributes)
        return self


# Union type representing any observation wrapper
Observation = Union[
    ObservationLLM,
    ObservationEmbedding,
    ObservationAgent,
    ObservationTool,
    ObservationChain,
    ObservationRetriever,
    ObservationReranker,
    ObservationEvaluator,
    ObservationGuardrail,
]
