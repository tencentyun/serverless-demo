# -*- coding: utf-8 -*-
"""Observability configuration types for the server.

Provides a unified configuration interface for trace exporters:
- Console: Development/debugging output
- OTLP: Production export to Langfuse, Jaeger, etc.
- Custom: User-defined setup logic

This module mirrors the TypeScript SDK's server/config.ts implementation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional, Union


@dataclass
class BatchConfig:
    """Batch processing configuration for span exporters.

    Used by BatchSpanProcessor to optimize performance:
    - Collects spans in memory and exports them in batches
    - Reduces I/O operations (console) or network requests (OTLP)
    - Recommended for production environments

    Attributes:
        max_export_batch_size: Maximum number of spans per export batch (default: 100)
        scheduled_delay_millis: Maximum delay in milliseconds before exporting (default: 5000)
        max_queue_size: Maximum queue size (default: 2048)
        export_timeout_millis: Export timeout in milliseconds (default: 30000)
    """

    max_export_batch_size: int = 100
    scheduled_delay_millis: int = 5000
    max_queue_size: int = 2048
    export_timeout_millis: int = 30000


@dataclass
class ConsoleTraceConfig:
    """Console trace exporter configuration.

    Outputs traces to stdout in JSON format using ConsoleSpanExporter.
    Uses SimpleSpanProcessor for immediate export (no batching).
    Useful for development and debugging.

    Example:
        >>> ConsoleTraceConfig()
    """

    pass


@dataclass
class OTLPTraceConfig:
    """OTLP trace exporter configuration.

    Exports traces via OTLP protocol to any compatible backend:
    - Langfuse: https://cloud.langfuse.com/api/public/otlp/v1/traces
    - Jaeger: http://localhost:4318/v1/traces
    - OTel Collector: custom endpoint

    Example:
        >>> config = OTLPTraceConfig(
        ...     url="https://cloud.langfuse.com/api/public/otlp/v1/traces",
        ...     headers={"Authorization": "Basic xxx"}
        ... )
    """

    url: str
    headers: Optional[Dict[str, str]] = None
    timeout: int = 10000
    batch: Optional[BatchConfig] = None


@dataclass
class CustomTraceConfig:
    """Custom trace exporter configuration.

    Allows users to provide custom trace setup logic.
    Useful for integrations not covered by console/otlp.

    Example:
        >>> def my_setup():
        ...     exporter = MyCustomExporter()
        ...     provider = TracerProvider()
        ...     provider.add_span_processor(SimpleSpanProcessor(exporter))
        ...     provider.register()
        >>> config = CustomTraceConfig(setup=my_setup)
    """

    setup: Any  # Callable[[], None] | Callable[[], Awaitable[None]]


# Union type for all supported trace exporter configurations
ObservabilityConfig = Union[
    ConsoleTraceConfig,
    OTLPTraceConfig,
    CustomTraceConfig,
]
