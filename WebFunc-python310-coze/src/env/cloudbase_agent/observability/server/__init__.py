# -*- coding: utf-8 -*-
"""Server utilities for observability.

Provides server-side observability features like AUTO_TRACES_STDOUT
and unified trace exporter configuration.
"""

from .config import (
    BatchConfig,
    ConsoleTraceConfig,
    OTLPTraceConfig,
    CustomTraceConfig,
    ObservabilityConfig,
)

from .setup import (
    setup_observability,
    setup_observability_async,
)

__all__ = [
    # Unified setup API
    "setup_observability",
    "setup_observability_async",
    # Configuration types
    "BatchConfig",
    "ConsoleTraceConfig",
    "OTLPTraceConfig",
    "CustomTraceConfig",
    "ObservabilityConfig",
]
