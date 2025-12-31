"""OpenAI Compatibility Module.

This module provides OpenAI-compatible chat completions endpoint implementation,
allowing Cloudbase Agent agents to be used as drop-in replacements for OpenAI models.

Available Functions:
    - create_adapter: Create a FastAPI endpoint adapter for chat/completions
"""

from .server import create_adapter

__all__ = [
    "create_adapter",
]
