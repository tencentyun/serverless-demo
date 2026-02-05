"""Dify Agent Implementation.

This module provides agent configuration and JWT authentication for Dify platform.
"""

import os
from typing import Optional

from cloudbase_agent.dify import DifyAgent
from auth import extract_user_id_from_request


def build_dify_agent(
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    debug_mode: Optional[bool] = None,
) -> DifyAgent:
    """Build and return a Dify agent instance.
    
    Parameters can be provided via arguments or environment variables:
    - DIFY_API_KEY (required)
    - DIFY_API_BASE (optional, defaults to https://api.dify.ai/v1)
    - DEBUG (optional, true/1/yes to enable)
    
    Note: user identifier should be provided per-request via forwarded_props.user
    """
    final_api_key = api_key or os.environ.get("DIFY_API_KEY")
    final_base_url = base_url or os.environ.get("DIFY_API_BASE", "https://api.dify.ai/v1")
    
    if debug_mode is None:
        debug_mode = os.environ.get("DEBUG", "").lower() in ("true", "1", "yes")

    agent = DifyAgent(
        name="agentic_chat",
        description="A conversational chatbot agent that can engage in natural dialogue",
        api_key=final_api_key,
        base_url=final_base_url,
        fix_event_ids=True,
        debug_mode=debug_mode,
    )

    return agent


def create_jwt_request_preprocessor():
    """Create request preprocessor for JWT authentication.
    
    Extracts user_id from JWT 'sub' field in Authorization header
    and writes to request.forwarded_props.user.
    """
    from ag_ui.core import RunAgentInput
    from fastapi import Request
    
    def jwt_preprocessor(request: RunAgentInput, http_context: Request) -> None:
        user_id = extract_user_id_from_request(http_context)
        if user_id:
            if not request.forwarded_props:
                request.forwarded_props = {}
            # Dify uses 'user' field instead of 'user_id'
            request.forwarded_props["user"] = user_id
    
    return jwt_preprocessor
