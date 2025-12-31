#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Storage and checkpoint types.

This module defines types for checkpoint storage and state management.
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel


class CheckpointMetadata(BaseModel):
    """Checkpoint metadata.
    
    :param source: Source of the checkpoint (e.g., "update", "input")
    :type source: str
    :param step: Step number in the execution
    :type step: int
    :param writes: Optional writes metadata
    :type writes: Optional[Dict[str, Any]]
    """
    source: str = "update"
    step: int = -1
    writes: Optional[Dict[str, Any]] = None


class CheckpointConfig(BaseModel):
    """Checkpoint configuration.
    
    :param thread_id: Thread identifier
    :type thread_id: str
    :param checkpoint_ns: Checkpoint namespace
    :type checkpoint_ns: str
    :param checkpoint_id: Optional checkpoint identifier
    :type checkpoint_id: Optional[str]
    """
    thread_id: str
    checkpoint_ns: str = ""
    checkpoint_id: Optional[str] = None


class Checkpoint(BaseModel):
    """Checkpoint data.
    
    :param v: Checkpoint version
    :type v: int
    :param id: Checkpoint identifier
    :type id: str
    :param ts: Timestamp
    :type ts: str
    :param channel_values: Channel values
    :type channel_values: Dict[str, Any]
    :param channel_versions: Channel versions
    :type channel_versions: Dict[str, Any]
    :param versions_seen: Versions seen
    :type versions_seen: Dict[str, Any]
    :param pending_sends: Pending sends
    :type pending_sends: list
    """
    v: int = 1
    id: str
    ts: str
    channel_values: Dict[str, Any]
    channel_versions: Dict[str, Any]
    versions_seen: Dict[str, Any]
    pending_sends: list = []
