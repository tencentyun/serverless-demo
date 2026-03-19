"""Tracer provider and utilities for observability."""

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SpanExporter
from typing import Optional

from .constants import OBSERVABILITY_TRACER_NAME

# Global tracer provider
_tracer_provider: Optional[TracerProvider] = None
_tracer: Optional[trace.Tracer] = None


def get_tracer_provider() -> TracerProvider:
    """Get or create the global tracer provider.

    Returns:
        The global TracerProvider instance.
    """
    global _tracer_provider
    if _tracer_provider is None:
        # Check if a provider is already set in OpenTelemetry
        existing_provider = trace.get_tracer_provider()
        # Check if it's not just a ProxyTracerProvider (which means no real provider)
        if not isinstance(existing_provider, trace.ProxyTracerProvider):
            # Use the existing provider
            _tracer_provider = existing_provider
        else:
            # Create a new provider
            _tracer_provider = TracerProvider()
            # Try to register with global trace provider
            try:
                trace.set_tracer_provider(_tracer_provider)
            except Exception:
                # Provider might already be set by another library
                # In this case, just keep our reference for local use
                pass
    return _tracer_provider


def set_tracer_provider(provider: TracerProvider) -> None:
    """Set the global tracer provider.

    Args:
        provider: The TracerProvider to use globally.
    """
    global _tracer_provider, _tracer
    try:
        trace.set_tracer_provider(provider)
        _tracer_provider = provider
        _tracer = None  # Reset tracer so it will be recreated with new provider
    except Exception:
        # Provider may already be set - use the existing one instead
        existing_provider = trace.get_tracer_provider()
        if not isinstance(existing_provider, trace.ProxyTracerProvider):
            _tracer_provider = existing_provider


def get_tracer() -> trace.Tracer:
    """Get or create the tracer.

    Returns:
        The OpenTelemetry Tracer instance.
    """
    global _tracer
    if _tracer is None:
        _tracer = get_tracer_provider().get_tracer(
            OBSERVABILITY_TRACER_NAME,
            # Keep schema_url unset to avoid emitting brand identifiers.
        )
    return _tracer


def add_span_exporter(exporter: SpanExporter) -> None:
    """Add a span exporter to the tracer provider.

    Args:
        exporter: The SpanExporter to add.
    """
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor, BatchSpanProcessor

    provider = get_tracer_provider()
    # Use BatchSpanProcessor for better performance
    processor = BatchSpanProcessor(exporter)
    provider.add_span_processor(processor)


def get_trace_id() -> Optional[str]:
    """Get the current trace ID from the active span.

    Returns:
        The trace ID as a hex string, or None if no active span.
    """
    current_span = trace.get_current_span()
    if current_span and current_span.is_recording():
        span_context = current_span.get_span_context()
        return format(span_context.trace_id, "032x")
    return None


def get_span_id() -> Optional[str]:
    """Get the current span ID from the active span.

    Returns:
        The span ID as a hex string, or None if no active span.
    """
    current_span = trace.get_current_span()
    if current_span and current_span.is_recording():
        span_context = current_span.get_span_context()
        return format(span_context.span_id, "016x")
    return None
