"""
Attribute creation utilities for observability.

Maps observation attributes to OpenInference and OpenTelemetry semantic conventions.
"""

import json
import logging
from typing import Any, Dict, Optional

from opentelemetry import trace
from opentelemetry.util.types import AttributeValue
from openinference.semconv.trace import SpanAttributes, OpenInferenceSpanKindValues

from cloudbase_agent.observability.types import (
    BaseSpanAttributes,
    LLMAttributes,
    ObservationType,
    ObservationAttributes,
    TraceAttributes,
    LLMMessage,
    Document,
    ToolCall,
)
from cloudbase_agent.observability.constants import (
    OtelSpanAttributes,
    OpenInferenceSpanKind,
)

logger = logging.getLogger(__name__)

def _serialize(value: Any) -> Optional[str]:
    """Safely serialize a value to a JSON string.

    Args:
        value: The value to serialize.

    Returns:
        JSON string representation, or None if value is None/empty.
    """
    if value is None:
        return None
    if isinstance(value, str):
        return value
    try:
        return json.dumps(value, default=str)
    except Exception:
        return "<failed to serialize>"


def _flatten_metadata(
    metadata: Optional[Dict[str, Any]], prefix: str
) -> Dict[str, str]:
    """Flatten and serialize metadata into OpenTelemetry attribute format.

    Converts nested metadata objects into dot-notation attribute keys.
    For example, `{ "database": { "host": "localhost" } }` becomes
    `{ "metadata.database.host": "localhost" }`.

    Args:
        metadata: Metadata object to flatten.
        prefix: Attribute prefix (e.g., 'metadata' or 'observation.metadata').

    Returns:
        Flattened metadata attributes with string values.
    """
    metadata_attributes: Dict[str, str] = {}

    if metadata is None:
        return metadata_attributes

    if not isinstance(metadata, dict):
        serialized = _serialize(metadata)
        if serialized:
            metadata_attributes[prefix] = serialized
        return metadata_attributes

    for key, value in metadata.items():
        serialized = value if isinstance(value, str) else _serialize(value)
        if serialized:
            metadata_attributes[f"{prefix}.{key}"] = serialized

    return metadata_attributes


def _flatten_llm_messages(
    messages: Optional[list], prefix: str
) -> Dict[str, str]:
    """Flatten LLM messages into OpenTelemetry attributes.

    Follows OpenInference convention:
    - llm.input_messages.{i}.message.role
    - llm.input_messages.{i}.message.content

    Args:
        messages: List of LLMMessage objects or dicts.
        prefix: Attribute prefix ('llm.input_messages' or 'llm.output_messages').

    Returns:
        Flattened message attributes.
    """
    attributes: Dict[str, str] = {}

    if not messages or not isinstance(messages, list):
        return attributes

    try:
        for index, msg in enumerate(messages):
            if not msg:
                continue

            # Handle both dataclass and dict
            if isinstance(msg, dict):
                role = msg.get("role")
                content = msg.get("content")
                tool_calls = msg.get("tool_calls")
                tool_call_id = msg.get("tool_call_id")
            else:
                role = getattr(msg, "role", None)
                content = getattr(msg, "content", None)
                tool_calls = getattr(msg, "tool_calls", None)
                tool_call_id = getattr(msg, "tool_call_id", None)

            base_key = f"{prefix}.{index}.message"

            if role is not None:
                attributes[f"{base_key}.role"] = str(role)
            if content is not None:
                attributes[f"{base_key}.content"] = str(content)
            if tool_call_id is not None:
                attributes[f"{base_key}.tool_call_id"] = str(tool_call_id)

            # Flatten tool calls if present
            if tool_calls and isinstance(tool_calls, list):
                for tc_index, tool_call in enumerate(tool_calls):
                    if not tool_call:
                        continue

                    if isinstance(tool_call, dict):
                        tc_id = tool_call.get("id")
                        func = tool_call.get("function", {})
                    else:
                        tc_id = getattr(tool_call, "id", None)
                        func = getattr(tool_call, "function", {}) or {}

                    tc_key = f"{base_key}.tool_calls.{tc_index}"

                    if tc_id is not None:
                        attributes[f"{tc_key}.id"] = str(tc_id)
                    if isinstance(func, dict):
                        if func.get("name") is not None:
                            attributes[f"{tc_key}.function.name"] = str(func["name"])
                        if func.get("arguments") is not None:
                            attributes[f"{tc_key}.function.arguments"] = str(func["arguments"])
                    else:
                        func_name = getattr(func, "name", None)
                        func_args = getattr(func, "arguments", None)
                        if func_name is not None:
                            attributes[f"{tc_key}.function.name"] = str(func_name)
                        if func_args is not None:
                            attributes[f"{tc_key}.function.arguments"] = str(func_args)
    except Exception:
        # Silent fail - don't block business logic for observability
        pass

    return attributes


def _flatten_documents(
    documents: Optional[list],
) -> Dict[str, str]:
    """Flatten documents into OpenTelemetry attributes.

    Follows OpenInference convention:
    - retrieval.documents.{i}.document.id
    - retrieval.documents.{i}.document.content
    - retrieval.documents.{i}.document.score
    - retrieval.documents.{i}.document.metadata

    Args:
        documents: List of Document objects or dicts.

    Returns:
        Flattened document attributes.
    """
    attributes: Dict[str, str] = {}

    if not documents or not isinstance(documents, list):
        return attributes

    try:
        for index, doc in enumerate(documents):
            if not doc:
                continue

            # Handle both dataclass and dict
            if isinstance(doc, dict):
                doc_id = doc.get("id")
                content = doc.get("content")
                score = doc.get("score")
                metadata = doc.get("metadata")
            else:
                doc_id = getattr(doc, "id", None)
                content = getattr(doc, "content", None)
                score = getattr(doc, "score", None)
                metadata = getattr(doc, "metadata", None)

            base_key = f"retrieval.documents.{index}.document"

            if doc_id is not None:
                attributes[f"{base_key}.id"] = str(doc_id)
            if content is not None:
                attributes[f"{base_key}.content"] = str(content)
            if score is not None:
                attributes[f"{base_key}.score"] = str(score)
            if metadata is not None and isinstance(metadata, dict):
                metadata_serialized = _serialize(metadata)
                if metadata_serialized:
                    attributes[f"{base_key}.metadata"] = metadata_serialized
    except Exception:
        # Silent fail - don't block business logic for observability
        pass

    return attributes


def _flatten_tool_call(
    tool_call: Any,
) -> Dict[str, str]:
    """Flatten tool call into OpenTelemetry attributes.

    Follows OpenInference convention:
    - tool_call.id
    - tool_call.function.name
    - tool_call.function.arguments

    Args:
        tool_call: ToolCall object or dict.

    Returns:
        Flattened tool call attributes.
    """
    attributes: Dict[str, str] = {}

    if not tool_call:
        return attributes

    try:
        # Handle both dataclass and dict
        if isinstance(tool_call, dict):
            tc_id = tool_call.get("id")
            func = tool_call.get("function", {})
        else:
            tc_id = getattr(tool_call, "id", None)
            func = getattr(tool_call, "function", {}) or {}

        if tc_id is not None:
            attributes["tool_call.id"] = str(tc_id)

        if isinstance(func, dict):
            if func.get("name") is not None:
                attributes["tool_call.function.name"] = str(func["name"])
            if func.get("arguments") is not None:
                attributes["tool_call.function.arguments"] = str(func["arguments"])
        else:
            func_name = getattr(func, "name", None)
            func_args = getattr(func, "arguments", None)
            if func_name is not None:
                attributes["tool_call.function.name"] = str(func_name)
            if func_args is not None:
                attributes["tool_call.function.arguments"] = str(func_args)
    except Exception:
        # Silent fail - don't block business logic for observability
        pass

    return attributes


def create_trace_attributes(attributes: TraceAttributes) -> Dict[str, AttributeValue]:
    """Create OpenTelemetry trace attributes from TraceAttributes.

    Args:
        attributes: Trace attributes to convert.

    Returns:
        OpenTelemetry-compatible trace attributes.
    """
    result = {
        OtelSpanAttributes.TRACE_NAME: attributes.name,
        OtelSpanAttributes.USER_ID: attributes.user_id,
        OtelSpanAttributes.SESSION_ID: attributes.session_id,
        OtelSpanAttributes.VERSION: attributes.version,
        OtelSpanAttributes.RELEASE: attributes.release,
        OtelSpanAttributes.TRACE_INPUT: _serialize(attributes.input),
        OtelSpanAttributes.TRACE_OUTPUT: _serialize(attributes.output),
        OtelSpanAttributes.TRACE_TAGS: (
            ",".join(attributes.tags) if attributes.tags else None
        ),
        OtelSpanAttributes.ENVIRONMENT: attributes.environment,
        OtelSpanAttributes.TRACE_PUBLIC: attributes.public,
    }

    # Add flattened metadata
    metadata_attrs = _flatten_and_serialize_metadata(
        attributes.metadata, OtelSpanAttributes.TRACE_METADATA.value
    )
    result.update(metadata_attrs)

    # Filter out None values
    return {k: v for k, v in result.items() if v is not None}


def create_observation_attributes(
    observation_type: ObservationType, attributes: ObservationAttributes
) -> Dict[str, AttributeValue]:
    """Create OpenTelemetry span attributes from observation attributes.

    Maps observation attributes to OpenInference semantic conventions:
    - Uses `openinference.span.kind` for span type
    - Uses `llm.*` for LLM-specific attributes
    - Uses `tool.*` for tool-specific attributes
    - Falls back to `observation.*` for non-standard attributes

    Args:
        observation_type: The type of observation (llm, tool, chain, etc.)
        attributes: Observation attributes to convert.

    Returns:
        OpenTelemetry-compatible span attributes.
    """
    # Base attributes for all observation types
    # Handle both dataclass instances and dict input
    level = None
    status_message = None
    version = None

    if isinstance(attributes, dict):
        level = attributes.get("level")
        status_message = attributes.get("status_message")
        version = attributes.get("version")
        input_value = attributes.get("input")
        output_value = attributes.get("output")
        metadata = attributes.get("metadata")
    else:
        level = attributes.level
        status_message = attributes.status_message
        version = attributes.version
        input_value = attributes.input
        output_value = attributes.output
        metadata = attributes.metadata

    # Get OpenInference span kind with fallback to CHAIN (generic catch-all)
    try:
        span_kind = OpenInferenceSpanKind[observation_type.upper()].value
    except KeyError:
        logger.warning(
            f"Unknown observation type '{observation_type}', using CHAIN span kind"
        )
        span_kind = OpenInferenceSpanKindValues.CHAIN.value

    otel_attributes: Dict[str, AttributeValue] = {
        SpanAttributes.OPENINFERENCE_SPAN_KIND: span_kind,
        OtelSpanAttributes.OBSERVATION_TYPE.value: observation_type,
        OtelSpanAttributes.OBSERVATION_LEVEL.value: (
            level.value if level and hasattr(level, "value") else level
        ),
        OtelSpanAttributes.OBSERVATION_STATUS_MESSAGE.value: status_message,
        OtelSpanAttributes.VERSION.value: version,
        # Use OpenInference input.value convention
        SpanAttributes.INPUT_VALUE: _serialize(input_value),
        # Also set legacy observation.input for compatibility
        OtelSpanAttributes.OBSERVATION_INPUT.value: _serialize(input_value),
        # Use OpenInference output.value convention
        SpanAttributes.OUTPUT_VALUE: _serialize(output_value),
        # Also set legacy observation.output for compatibility
        OtelSpanAttributes.OBSERVATION_OUTPUT.value: _serialize(output_value),
    }

    # LLM-specific attributes
    if observation_type == ObservationType.LLM:
        # Handle both dict and dataclass for LLM attributes
        model = None
        model_parameters = None
        usage_details = None
        completion_start_time = None
        
        if isinstance(attributes, dict):
            model = attributes.get("model")
            model_parameters = attributes.get("model_parameters")
            usage_details = attributes.get("usage_details")
            completion_start_time = attributes.get("completion_start_time")
        elif hasattr(attributes, "model"):
            model = attributes.model
            model_parameters = attributes.model_parameters
            usage_details = attributes.usage_details
            completion_start_time = attributes.completion_start_time
        
        if model:
            otel_attributes[
                SpanAttributes.LLM_MODEL_NAME
            ] = model
        if model_parameters:
            otel_attributes[
                SpanAttributes.LLM_INVOCATION_PARAMETERS
            ] = _serialize(model_parameters)
            # Also set legacy llm.model_parameters for compatibility
            otel_attributes[
                OtelSpanAttributes.LLM_MODEL_PARAMETERS.value
            ] = _serialize(model_parameters)
        if usage_details:
            usage = usage_details
            if isinstance(usage, dict):
                if usage.get("input") is not None:
                    otel_attributes[
                        SpanAttributes.LLM_TOKEN_COUNT_PROMPT
                    ] = usage["input"]
                if usage.get("output") is not None:
                    otel_attributes[
                        SpanAttributes.LLM_TOKEN_COUNT_COMPLETION
                    ] = usage["output"]
                if usage.get("total") is not None:
                    otel_attributes[
                        SpanAttributes.LLM_TOKEN_COUNT_TOTAL
                    ] = usage["total"]
            # Also set legacy llm.usage_details for compatibility
            otel_attributes[
                OtelSpanAttributes.LLM_USAGE_DETAILS.value
            ] = _serialize(usage_details)
        if completion_start_time:
            otel_attributes[
                OtelSpanAttributes.LLM_COMPLETION_START_TIME.value
            ] = _serialize(completion_start_time)

        # Extract new LLM attributes safely
        system = None
        provider = None
        input_messages = None
        output_messages = None
        input_mime_type = None
        output_mime_type = None

        if isinstance(attributes, dict):
            system = attributes.get("system")
            provider = attributes.get("provider")
            input_messages = attributes.get("input_messages")
            output_messages = attributes.get("output_messages")
            input_mime_type = attributes.get("input_mime_type")
            output_mime_type = attributes.get("output_mime_type")
        else:
            system = getattr(attributes, "system", None)
            provider = getattr(attributes, "provider", None)
            input_messages = getattr(attributes, "input_messages", None)
            output_messages = getattr(attributes, "output_messages", None)
            input_mime_type = getattr(attributes, "input_mime_type", None)
            output_mime_type = getattr(attributes, "output_mime_type", None)

        if system is not None:
            otel_attributes[SpanAttributes.LLM_SYSTEM] = str(system)
        if provider is not None:
            otel_attributes[SpanAttributes.LLM_PROVIDER] = str(provider)
        if input_mime_type is not None:
            otel_attributes[SpanAttributes.INPUT_MIME_TYPE] = str(input_mime_type)
        if output_mime_type is not None:
            otel_attributes[SpanAttributes.OUTPUT_MIME_TYPE] = str(output_mime_type)

        # Flatten LLM messages
        if input_messages is not None:
            try:
                message_attrs = _flatten_llm_messages(input_messages, "llm.input_messages")
                otel_attributes.update(message_attrs)
            except Exception:
                pass  # Silent fail

        if output_messages is not None:
            try:
                message_attrs = _flatten_llm_messages(output_messages, "llm.output_messages")
                otel_attributes.update(message_attrs)
            except Exception:
                pass  # Silent fail

    # Embedding-specific attributes
    if observation_type == ObservationType.EMBEDDING:
        # Handle both dict and dataclass for embedding attributes
        model = None
        model_parameters = None
        
        if isinstance(attributes, dict):
            model = attributes.get("model")
            model_parameters = attributes.get("model_parameters")
        elif hasattr(attributes, "model"):
            model = attributes.model
            model_parameters = attributes.model_parameters
        
        if model:
            otel_attributes[
                SpanAttributes.EMBEDDING_MODEL_NAME
            ] = model
        if model_parameters:
            otel_attributes[
                SpanAttributes.LLM_INVOCATION_PARAMETERS
            ] = _serialize(model_parameters)

    # Tool-specific attributes
    if observation_type == ObservationType.TOOL:
        tool_name = None
        tool_description = None
        tool_parameters = None
        tool_call = None

        if isinstance(attributes, dict):
            tool_name = attributes.get("tool_name")
            tool_description = attributes.get("tool_description")
            tool_parameters = attributes.get("tool_parameters")
            tool_call = attributes.get("tool_call")
        else:
            tool_name = getattr(attributes, "tool_name", None)
            tool_description = getattr(attributes, "tool_description", None)
            tool_parameters = getattr(attributes, "tool_parameters", None)
            tool_call = getattr(attributes, "tool_call", None)

        if tool_name is not None:
            otel_attributes[SpanAttributes.TOOL_NAME] = str(tool_name)
        if tool_description is not None:
            otel_attributes[SpanAttributes.TOOL_DESCRIPTION] = str(tool_description)
        if tool_parameters is not None:
            otel_attributes[SpanAttributes.TOOL_PARAMETERS] = _serialize(tool_parameters)
        # Flatten tool call if present
        if tool_call is not None:
            try:
                tool_call_attrs = _flatten_tool_call(tool_call)
                otel_attributes.update(tool_call_attrs)
            except Exception:
                pass  # Silent fail

    # Agent-specific attributes
    if observation_type == ObservationType.AGENT:
        agent_name = None
        if isinstance(attributes, dict):
            agent_name = attributes.get("agent_name")
        else:
            agent_name = getattr(attributes, "agent_name", None)

        if agent_name is not None:
            otel_attributes[SpanAttributes.AGENT_NAME] = str(agent_name)

    # Retriever-specific attributes
    if observation_type == ObservationType.RETRIEVER:
        documents = None
        query = None

        if isinstance(attributes, dict):
            documents = attributes.get("documents")
            query = attributes.get("query")
        else:
            documents = getattr(attributes, "documents", None)
            query = getattr(attributes, "query", None)

        if documents is not None:
            try:
                doc_attrs = _flatten_documents(documents)
                otel_attributes.update(doc_attrs)
            except Exception:
                pass  # Silent fail
        if query is not None:
            otel_attributes["retriever.query"] = str(query)

    # Add metadata (use OpenInference metadata convention)
    metadata_attrs = _flatten_and_serialize_metadata(
        metadata, SpanAttributes.METADATA
    )
    otel_attributes.update(metadata_attrs)

    # Also add observation.metadata for compatibility
    obsetvability_metadata_attrs = _flatten_and_serialize_metadata(
        metadata, OtelSpanAttributes.OBSERVATION_METADATA.value
    )
    otel_attributes.update(obsetvability_metadata_attrs)

    # Pass through any additional custom attributes (e.g., agui.thread_id, agui.run_id)
    # Only pass through attributes that haven't been set yet to avoid overwriting internal ones
    if isinstance(attributes, dict):
        for key, value in attributes.items():
            if key not in otel_attributes and value is not None:
                otel_attributes[key] = value if isinstance(value, str) else _serialize(value)

    # Filter out None values
    return {k: v for k, v in otel_attributes.items() if v is not None}


def _flatten_and_serialize_metadata(
    metadata: Optional[Dict[str, Any]], prefix: str
) -> Dict[str, str]:
    """Flatten and serialize metadata into OpenTelemetry attribute format.

    This is an alias for _flatten_metadata for backward compatibility.
    """
    return _flatten_metadata(metadata, prefix)


def update_active_trace(attributes: TraceAttributes) -> None:
    """Update the currently active trace with new attributes.

    Args:
        attributes: Trace attributes to set.
    """
    current_span = trace.get_current_span()
    if not current_span or not current_span.is_recording():
        logger.debug(
            "No active OTEL span in context. Skipping trace update."
        )
        return

    trace_attrs = create_trace_attributes(attributes)
    current_span.set_attributes(trace_attrs)


def get_active_trace_id() -> Optional[str]:
    """Get the current active trace ID.

    Returns:
        The trace ID as a hex string, or undefined if no active span.
    """
    current_span = trace.get_current_span()
    if not current_span or not current_span.is_recording():
        return None
    span_context = current_span.get_span_context()
    return format(span_context.trace_id, "032x")


def get_active_span_id() -> Optional[str]:
    """Get the current active observation ID.

    Returns:
        The span ID as a hex string, or undefined if no active span.
    """
    current_span = trace.get_current_span()
    if not current_span or not current_span.is_recording():
        return None
    span_context = current_span.get_span_context()
    return format(span_context.span_id, "016x")
