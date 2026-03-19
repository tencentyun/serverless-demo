# -*- coding: utf-8 -*-
"""Observability setup implementation for the server.

Merges configuration from environment variables and parameters,
then applies each exporter configuration.

This module mirrors the TypeScript SDK's server/setup.ts implementation.
"""

from __future__ import annotations

import os
import sys
import json
import logging
from dataclasses import dataclass, field
from typing import Any, List, Optional, Union

from opentelemetry.sdk.trace.export import SpanExporter, SpanExportResult

from .config import (
    BatchConfig,
    ConsoleTraceConfig,
    OTLPTraceConfig,
    CustomTraceConfig,
    ObservabilityConfig,
)


class SingleLineConsoleSpanExporter(SpanExporter):
    """Custom console exporter that outputs single-line JSON.
    
    This exporter outputs spans as single-line JSON for easier parsing
    with line-based tools (grep, jq, etc.).
    
    To switch back to standard multi-line output, use ConsoleSpanExporter instead.
    
    Example:
        # Single-line (current default)
        exporter = SingleLineConsoleSpanExporter()
        
        # Multi-line (standard OTel)
        from opentelemetry.sdk.trace.export import ConsoleSpanExporter
        exporter = ConsoleSpanExporter()
    """
    
    def __init__(self, out=sys.stdout):
        self.out = out
    
    def export(self, spans) -> SpanExportResult:
        """Export spans as single-line JSON."""
        try:
            for span in spans:
                # Convert span to dict (similar to ConsoleSpanExporter)
                span_dict = self._span_to_dict(span)
                # Single-line JSON output
                json_line = json.dumps(span_dict, separators=(',', ':'), ensure_ascii=False)
                self.out.write(json_line + '\n')
            self.out.flush()
            return SpanExportResult.SUCCESS
        except Exception:
            return SpanExportResult.FAILURE
    
    def _span_to_dict(self, span) -> dict:
        """Convert an SDKSpan to a dictionary for JSON serialization."""
        try:
            context = span.get_span_context()

            result = {
                "name": span.name,
                "context": {
                    "trace_id": format(context.trace_id, "032x"),
                    "span_id": format(context.span_id, "016x"),
                    "trace_flags": int(context.trace_flags),
                },
                "kind": span.kind.name if span.kind else None,
                "parent_id": format(span.parent.span_id, "016x") if span.parent else None,
                "start_time": span.start_time,
                "end_time": span.end_time,
                "status": {
                    "status_code": span.status.status_code.name if span.status else None,
                    "description": span.status.description if span.status else None,
                },
                "attributes": dict(span.attributes) if span.attributes else {},
                "events": [
                    {
                        "name": event.name,
                        "timestamp": event.timestamp,
                        "attributes": dict(event.attributes) if event.attributes else {},
                    }
                    for event in span.events
                ],
                "links": [
                    {
                        "context": {
                            "trace_id": format(link.context.trace_id, "032x"),
                            "span_id": format(link.context.span_id, "016x"),
                        },
                        "attributes": dict(link.attributes) if link.attributes else {},
                    }
                    for link in span.links
                ],
                "resource": {
                    "attributes": dict(span.resource.attributes) if span.resource else {},
                },
            }

            # Uses OBSERVABILITY_TRACER_NAME to identify spans from Cloudbase Agent observability
            try:
                from ..constants import OBSERVABILITY_TRACER_NAME
                result["_log_from"] = OBSERVABILITY_TRACER_NAME
            except Exception:
                pass

            return result
        except Exception:
            return {}
    
    def shutdown(self) -> None:
        """Shutdown the exporter."""
        pass
    
    def force_flush(self, timeout_millis: int = 30000) -> bool:
        """Force flush the exporter."""
        return True


# Toggle between single-line and multi-line console output
# Set CONSOLE_EXPORTER_SINGLE_LINE=false to use standard multi-line output
CONSOLE_EXPORTER_SINGLE_LINE = os.getenv("CONSOLE_EXPORTER_SINGLE_LINE", "true").lower() in ("true", "1", "yes", "on")


# Environment variable truthy values
# Matches Python SDK implementation for consistency
TRUTHY_ENV_VALUES = frozenset(["true", "1", "yes", "on"])


@dataclass
class MergedConfig:
    """Merged configuration result.

    Console config allows merge (param overrides env),
    while OTLP and custom configs are arrays (additive).
    """

    console: Optional[ConsoleTraceConfig] = None
    otlp: List[OTLPTraceConfig] = field(default_factory=list)
    custom: List[CustomTraceConfig] = field(default_factory=list)


# Default batch configuration (used by OTLP exporter)
DEFAULT_BATCH_CONFIG = BatchConfig(
    max_export_batch_size=100,
    scheduled_delay_millis=1000,
    max_queue_size=2048,
    export_timeout_millis=30000,
)


def resolve_batch_config(batch: Optional[BatchConfig]) -> BatchConfig:
    """Apply batch configuration with defaults.

    Args:
        batch: Optional batch configuration

    Returns:
        BatchConfig with defaults applied
    """
    if batch is None:
        return DEFAULT_BATCH_CONFIG
    return BatchConfig(
        max_export_batch_size=batch.max_export_batch_size or DEFAULT_BATCH_CONFIG.max_export_batch_size,
        scheduled_delay_millis=batch.scheduled_delay_millis or DEFAULT_BATCH_CONFIG.scheduled_delay_millis,
        max_queue_size=batch.max_queue_size or DEFAULT_BATCH_CONFIG.max_queue_size,
        export_timeout_millis=batch.export_timeout_millis or DEFAULT_BATCH_CONFIG.export_timeout_millis,
    )


def merge_configs(param_configs: List[ObservabilityConfig]) -> MergedConfig:
    """Merge environment variable and parameter configurations.

    - AUTO_TRACES_STDOUT env adds a console config
    - Parameter configs override/extend env configs

    Args:
        param_configs: Configuration list from parameters

    Returns:
        Merged configuration
    """
    logger = logging.getLogger(__name__)
    result = MergedConfig()

    # 1. Check AUTO_TRACES_STDOUT env
    auto_traces_stdout = os.getenv("AUTO_TRACES_STDOUT", "").lower()
    if auto_traces_stdout in TRUTHY_ENV_VALUES:
        result.console = ConsoleTraceConfig()
        logger.debug(
            f"[Observability] AUTO_TRACES_STDOUT={auto_traces_stdout}, console exporter enabled"
        )

    # 2. Process parameter configs
    for config in param_configs:
        if isinstance(config, ConsoleTraceConfig):
            # Parameter overrides env
            result.console = config
        elif isinstance(config, OTLPTraceConfig):
            result.otlp.append(config)
        elif isinstance(config, CustomTraceConfig):
            result.custom.append(config)

    return result


def setup_console_exporter(config: ConsoleTraceConfig) -> None:
    """Setup console exporter.

    Uses SimpleSpanProcessor for immediate export without batching.
    This is optimal for console output (stdout.write is microsecond-level)
    and ensures reliable data export in serverless environments (e.g., SCF)
    where batch background threads may be frozen.

    Args:
        config: Console exporter configuration
    """
    logger = logging.getLogger(__name__)
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import ConsoleSpanExporter, SimpleSpanProcessor
        from opentelemetry.sdk.resources import Resource

        # Choose exporter type based on CONSOLE_EXPORTER_SINGLE_LINE env var
        # Single-line: easier for parsing with line-based tools (grep, jq, etc.)
        # Multi-line: more human-readable for debugging
        if CONSOLE_EXPORTER_SINGLE_LINE:
            exporter: SpanExporter = SingleLineConsoleSpanExporter()
            exporter_type = "single-line"
        else:
            exporter = ConsoleSpanExporter()
            exporter_type = "multi-line"

        # Check if a real TracerProvider already exists
        provider = trace.get_tracer_provider()
        is_real_provider = hasattr(provider, "add_span_processor")

        processor = SimpleSpanProcessor(exporter)

        if is_real_provider:
            # Add processor to existing provider
            provider.add_span_processor(processor)
        else:
            # Create new provider with console exporter
            resource = Resource.create({
                "service.name": os.getenv("OTEL_SERVICE_NAME", "ag-ui-server"),
                "service.version": "1.0.0",
            })

            tracer_provider = TracerProvider(resource=resource)
            tracer_provider.add_span_processor(processor)
            trace.set_tracer_provider(tracer_provider)

        logger.info(
            f"[Observability] Console exporter configured ({exporter_type}, simple processor)"
        )

    except ImportError as e:
        logger.warning(
            "[Observability] Failed to setup console exporter: missing package. "
            f"Install with: pip install opentelemetry-sdk - {e}"
        )
        # Silent failure - observability should never block main flow
    except Exception as e:
        logger.warning(f"[Observability] Failed to setup console exporter: {e}")
        # Silent failure - observability should never block main flow


def setup_otlp_exporter(config: OTLPTraceConfig) -> None:
    """Setup OTLP exporter.

    Args:
        config: OTLP exporter configuration
    """
    logger = logging.getLogger(__name__)
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

        batch_config = resolve_batch_config(config.batch)

        # Check if a real TracerProvider already exists
        provider = trace.get_tracer_provider()
        is_real_provider = hasattr(provider, "add_span_processor")

        if is_real_provider:
            # Add processor to existing provider
            exporter = OTLPSpanExporter(
                endpoint=config.url,
                headers=config.headers or {},
                timeout=config.timeout,
            )

            processor = BatchSpanProcessor(
                exporter,
                max_queue_size=batch_config.max_queue_size,
                schedule_delay_millis=batch_config.scheduled_delay_millis,
                max_export_batch_size=batch_config.max_export_batch_size,
                export_timeout_millis=batch_config.export_timeout_millis,
            )
            provider.add_span_processor(processor)

            logger.info(
                f"[Observability] OTLP exporter configured (url={config.url}, "
                f"batch={batch_config.max_export_batch_size}, "
                f"delay={batch_config.scheduled_delay_millis}ms)"
            )
        else:
            # Create new provider with OTLP exporter
            resource = Resource.create({
                "service.name": os.getenv("OTEL_SERVICE_NAME", "ag-ui-server"),
                "service.version": "1.0.0",
            })

            exporter = OTLPSpanExporter(
                endpoint=config.url,
                headers=config.headers or {},
                timeout=config.timeout,
            )

            processor = BatchSpanProcessor(
                exporter,
                max_queue_size=batch_config.max_queue_size,
                schedule_delay_millis=batch_config.scheduled_delay_millis,
                max_export_batch_size=batch_config.max_export_batch_size,
                export_timeout_millis=batch_config.export_timeout_millis,
            )

            tracer_provider = TracerProvider(resource=resource)
            tracer_provider.add_span_processor(processor)
            trace.set_tracer_provider(tracer_provider)

            logger.info(
                f"[Observability] OTLP exporter configured (url={config.url}, "
                f"batch={batch_config.max_export_batch_size}, "
                f"delay={batch_config.scheduled_delay_millis}ms)"
            )

    except ImportError as e:
        logger.warning(
            "[Observability] OTLP exporter requested but package not found. "
            f"Install with: pip install opentelemetry-exporter-otlp-proto-http - {e}"
        )
        # Silent failure - observability should never block main flow
    except Exception as e:
        logger.warning(f"[Observability] Failed to setup OTLP exporter: {e}")
        # Silent failure - observability should never block main flow


def setup_custom_exporter(config: CustomTraceConfig) -> None:
    """Setup custom exporter.

    Args:
        config: Custom exporter configuration
    """
    logger = logging.getLogger(__name__)
    try:
        # Call user's setup function
        if callable(config.setup):
            result = config.setup()
            # Check if it's a coroutine
            import inspect
            if inspect.iscoroutine(result):
                # For now, warn that async setup isn't supported in sync context
                logger.warning(
                    "[Observability] Custom setup function is async, "
                    "but called in sync context. Use setup_observability_async instead."
                )
        logger.info("[Observability] Custom exporter setup completed")
    except Exception as e:
        logger.warning(f"[Observability] Failed to setup custom exporter: {e}")
        # Silent failure - observability should never block main flow


def apply_merged_configs(merged: MergedConfig) -> None:
    """Setup observability from merged configuration.

    Args:
        merged: Merged configuration
    """
    # Apply console
    if merged.console:
        setup_console_exporter(merged.console)

    # Apply otlp
    for otlp in merged.otlp:
        setup_otlp_exporter(otlp)

    # Apply custom
    for custom in merged.custom:
        setup_custom_exporter(custom)

    if merged.console or merged.otlp or merged.custom:
        logging.getLogger(__name__).info("[Observability] Setup completed")


# Thread-safe setup cache
import threading

_setup_lock = threading.Lock()
_setup_completed = False


def setup_observability(
    configs: Optional[Union[ObservabilityConfig, List[ObservabilityConfig]]] = None,
) -> None:
    """Setup observability from configuration.

    Merges environment variable (AUTO_TRACES_STDOUT) with parameter configs,
    then applies each exporter configuration.

    Environment variables act as presets, parameter configs override or extend.

    This function uses a cache to prevent duplicate setup - subsequent calls
    are no-ops once setup is complete.

    Thread-safe: Uses double-checked locking pattern to prevent race conditions
    in concurrent initialization scenarios.

    Args:
        configs: Observability configuration(s)

    Examples:
        Console only (from env):
        >>> setup_observability()

        Console only (from parameter):
        >>> setup_observability(ConsoleTraceConfig())

        Console + OTLP:
        >>> setup_observability([
        ...     ConsoleTraceConfig(),
        ...     OTLPTraceConfig(url="http://localhost:4318/v1/traces")
        ... ])

        OTLP only:
        >>> setup_observability(OTLPTraceConfig(
        ...     url="https://cloud.langfuse.com/api/public/otlp/v1/traces",
        ...     headers={"Authorization": "Basic xxx"}
        ... ))
    """
    global _setup_completed

    # Fast path: Check without lock (avoids lock contention)
    if _setup_completed:
        return

    # Slow path: Acquire lock and double-check
    with _setup_lock:
        # Double-checked locking pattern
        if _setup_completed:
            return

        try:
            # Normalize to list
            configs_list: List[ObservabilityConfig] = []
            if configs is None:
                configs_list = []
            elif isinstance(configs, list):
                configs_list = configs
            else:
                configs_list = [configs]

            # Merge env and parameter configs
            merged = merge_configs(configs_list)

            # Apply merged configs
            apply_merged_configs(merged)

            # Mark as completed
            _setup_completed = True

        except Exception as e:
            # Silent failure - observability should never block main flow
            logging.getLogger(__name__).warning(
                f"[Observability] Setup failed: {e}"
            )


async def setup_observability_async(
    configs: Optional[Union[ObservabilityConfig, List[ObservabilityConfig]]] = None,
) -> None:
    """Async version of setup_observability.

    This function supports async custom setup functions.

    Thread-safe: Uses double-checked locking pattern to prevent race conditions
    in concurrent initialization scenarios.

    Args:
        configs: Observability configuration(s)

    Examples:
        >>> await setup_observability_async([
        ...     CustomTraceConfig(setup=async_my_setup)
        ... ])
    """
    global _setup_completed

    logger = logging.getLogger(__name__)

    # Fast path: Check without lock (avoids lock contention)
    if _setup_completed:
        return

    # Slow path: Acquire lock and double-check
    with _setup_lock:
        # Double-checked locking pattern
        if _setup_completed:
            return

        try:
            # Normalize to list
            configs_list: List[ObservabilityConfig] = []
            if configs is None:
                configs_list = []
            elif isinstance(configs, list):
                configs_list = configs
            else:
                configs_list = [configs]

            # Merge env and parameter configs
            merged = merge_configs(configs_list)

            # Apply console and otlp (sync)
            if merged.console:
                setup_console_exporter(merged.console)

            for otlp in merged.otlp:
                setup_otlp_exporter(otlp)

            # Mark as completed before async operations
            _setup_completed = True

        except Exception as e:
            logger.warning(f"[Observability] Setup failed: {e}")
            return

    # Apply custom exporters (async) outside the lock
    # This prevents blocking other threads during async operations
    for custom in merged.custom:
        try:
            result = custom.setup()
            import inspect
            if inspect.iscoroutine(result):
                await result
            logger.info("[Observability] Custom exporter setup completed")
        except Exception as e:
            logger.warning(f"[Observability] Failed to setup custom exporter: {e}")
            # Silent failure - observability should never block main flow

    if merged.console or merged.otlp or merged.custom:
        logger.info("[Observability] Setup completed")
