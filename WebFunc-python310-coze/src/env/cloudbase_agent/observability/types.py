"""
Type definitions for observability.
"""

from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Union
from dataclasses import dataclass, field


@dataclass
class LLMMessage:
    """LLM message for input/output tracking.

    Follows OpenInference semantic convention:
    - llm.input_messages.{i}.message.role
    - llm.input_messages.{i}.message.content
    """

    role: str
    content: Optional[str] = None
    tool_calls: Optional[List["ToolCall"]] = None
    tool_call_id: Optional[str] = None


@dataclass
class ToolCall:
    """Tool call details.

    Follows OpenInference semantic convention:
    - tool_call.id
    - tool_call.function.name
    - tool_call.function.arguments
    """

    id: str
    function: "ToolCallFunction"


@dataclass
class ToolCallFunction:
    """Tool call function details."""

    name: str
    arguments: str


@dataclass
class Document:
    """Document for retrieval tracking.

    Follows OpenInference semantic convention:
    - retrieval.documents.{i}.document.id
    - retrieval.documents.{i}.document.content
    - retrieval.documents.{i}.document.score
    - retrieval.documents.{i}.document.metadata
    """

    id: Optional[str] = None
    content: Optional[str] = None
    score: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class ObservationType(str, Enum):
    """Types of observations/spans supported by observability."""

    CHAIN = "chain"
    LLM = "llm"
    EMBEDDING = "embedding"
    AGENT = "agent"
    TOOL = "tool"
    RETRIEVER = "retriever"
    RERANKER = "reranker"
    EVALUATOR = "evaluator"
    GUARDRAIL = "guardrail"


class ObservationLevel(str, Enum):
    """Severity/attention level for observations."""

    DEBUG = "DEBUG"
    DEFAULT = "DEFAULT"
    WARNING = "WARNING"
    ERROR = "ERROR"


# Base attributes
@dataclass
class BaseSpanAttributes:
    """Base attributes for all observation types."""

    input: Optional[Any] = None
    output: Optional[Any] = None
    metadata: Optional[Dict[str, Any]] = None
    level: Optional[ObservationLevel] = None
    status_message: Optional[str] = None
    version: Optional[str] = None


@dataclass
class LLMAttributes(BaseSpanAttributes):
    """Attributes specific to LLM observations."""

    model: Optional[str] = None
    system: Optional[str] = None
    provider: Optional[str] = None
    model_parameters: Optional[Dict[str, Any]] = None
    usage_details: Optional[Dict[str, int]] = None
    completion_start_time: Optional[Any] = None
    input_messages: Optional[List[LLMMessage]] = None
    output_messages: Optional[List[LLMMessage]] = None
    input_mime_type: Optional[str] = None
    output_mime_type: Optional[str] = None


@dataclass
class EmbeddingAttributes(BaseSpanAttributes):
    """Attributes specific to embedding observations."""

    model: Optional[str] = None
    model_parameters: Optional[Dict[str, Any]] = None
    embedding_vector: Optional[List[float]] = None


@dataclass
class ToolAttributes(BaseSpanAttributes):
    """Attributes specific to tool observations."""

    tool_name: Optional[str] = None
    tool_description: Optional[str] = None
    tool_parameters: Optional[Dict[str, Any]] = None
    tool_params: Optional[Dict[str, Any]] = None  # Legacy alias
    tool_call: Optional[ToolCall] = None


@dataclass
class AgentAttributes(BaseSpanAttributes):
    """Attributes specific to agent observations."""

    agent_name: Optional[str] = None
    agent_params: Optional[Dict[str, Any]] = None


@dataclass
class ChainAttributes(BaseSpanAttributes):
    """Attributes specific to chain observations."""

    chain_type: Optional[str] = None


@dataclass
class RetrieverAttributes(BaseSpanAttributes):
    """Attributes specific to retriever observations."""

    retriever_type: Optional[str] = None
    top_k: Optional[int] = None
    documents: Optional[List[Document]] = None
    query: Optional[str] = None


@dataclass
class RerankerAttributes(BaseSpanAttributes):
    """Attributes specific to reranker observations."""

    reranker_type: Optional[str] = None
    top_n: Optional[int] = None


@dataclass
class EvaluatorAttributes(BaseSpanAttributes):
    """Attributes specific to evaluator observations."""

    evaluator_type: Optional[str] = None
    score: Optional[float] = None
    label: Optional[str] = None


@dataclass
class GuardrailAttributes(BaseSpanAttributes):
    """Attributes specific to guardrail observations."""

    guardrail_type: Optional[str] = None
    passed: Optional[bool] = None


# Union type for all observation attributes
ObservationAttributes = Union[
    BaseSpanAttributes,
    LLMAttributes,
    EmbeddingAttributes,
    ToolAttributes,
    AgentAttributes,
    ChainAttributes,
    RetrieverAttributes,
    RerankerAttributes,
    EvaluatorAttributes,
    GuardrailAttributes,
]


# Trace attributes
@dataclass
class TraceAttributes:
    """Attributes for the entire trace."""

    name: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    version: Optional[str] = None
    release: Optional[str] = None
    input: Optional[Any] = None
    output: Optional[Any] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    environment: Optional[str] = None
    public: Optional[bool] = None
