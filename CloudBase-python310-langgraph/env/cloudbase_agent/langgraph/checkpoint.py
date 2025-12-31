#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LangGraph checkpoint saver implementation using TDAI Memory.

This module provides a checkpoint saver for LangGraph that uses TDAI Memory
as the backend storage, enabling persistent state management for LangGraph agents.
"""

from typing import Any, AsyncIterator, Dict, Iterator, Optional, Sequence, Tuple

from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
)
from langgraph.checkpoint.serde.base import SerializerProtocol

from cloudbase_agent.tdaimemory import MemoryClient


class TDAICheckpointSaver(BaseCheckpointSaver):
    """LangGraph checkpoint saver using TDAI Memory as backend.

    This class implements the BaseCheckpointSaver interface to store and retrieve
    checkpoints using TDAI Memory's event storage system.

    :param client: TDAI Memory client instance
    :type client: MemoryClient
    :param checkpoint_type: Collection name for checkpoints (default: "checkpoints")
    :type checkpoint_type: str
    :param checkpoint_writes_type: Collection name for checkpoint writes (default: "checkpoint_writes")
    :type checkpoint_writes_type: str
    :param serde: Optional serializer for checkpoint data
    :type serde: Optional[SerializerProtocol]

    Example::

        from cloudbase_agent.storage.tdaimemory import MemoryClient
        from cloudbase_agent.storage.langgraph import TDAICheckpointSaver

        client = MemoryClient(
            endpoint="https://memory.tdai.tencentyun.com",
            api_key="your-api-key",
            memory_id="your-memory-id"
        )

        saver = TDAICheckpointSaver(client=client)

        # Use with LangGraph
        graph = workflow.compile(checkpointer=saver)
    """

    def __init__(
        self,
        client: MemoryClient,
        checkpoint_type: str = "checkpoints",
        checkpoint_writes_type: str = "checkpoint_writes",
        serde: Optional[SerializerProtocol] = None,
    ):
        """Initialize the TDAI checkpoint saver.

        :param client: TDAI Memory client instance
        :type client: MemoryClient
        :param checkpoint_type: Collection name for checkpoints
        :type checkpoint_type: str
        :param checkpoint_writes_type: Collection name for checkpoint writes
        :type checkpoint_writes_type: str
        :param serde: Optional serializer for checkpoint data
        :type serde: Optional[SerializerProtocol]
        """
        super().__init__(serde=serde)
        self.client = client
        self.checkpoint_type = checkpoint_type
        self.checkpoint_writes_type = checkpoint_writes_type

    def get_tuple(self, config: Dict[str, Any]) -> Optional[CheckpointTuple]:
        """Retrieve a checkpoint tuple from TDAI Memory.

        :param config: Configuration containing thread_id, checkpoint_ns, and optionally checkpoint_id
        :type config: Dict[str, Any]
        :return: Checkpoint tuple if found, None otherwise
        :rtype: Optional[CheckpointTuple]
        """
        configurable = config.get("configurable", {})
        thread_id = configurable.get("thread_id")
        checkpoint_ns = configurable.get("checkpoint_ns", "")
        checkpoint_id = configurable.get("checkpoint_id")

        if not thread_id:
            return None

        try:
            # Query all events for this session
            # Note: TDAI Memory API doesn't support filtering by custom fields in where clause
            # So we query all events and filter client-side
            result = self.client.query_events(
                session_id=thread_id,
            )

            events = result.get("events", [])

            # Filter events client-side
            matching_events = []
            for event in events:
                # Check if event matches our criteria
                if event.get("collection") != self.checkpoint_type:
                    continue
                if event.get("checkpoint_ns") != checkpoint_ns:
                    continue
                if checkpoint_id and event.get("checkpoint_id") != checkpoint_id:
                    continue
                matching_events.append(event)

            if not matching_events:
                return None

            # Sort by checkpoint_id descending and take first
            matching_events.sort(key=lambda x: x.get("checkpoint_id", ""), reverse=True)
            doc = matching_events[0]
            configurable_values = {
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": doc["checkpoint_id"],
            }

            # Get checkpoint data
            checkpoint = doc["checkpoint"]

            # Get pending writes
            writes_result = self.client.query_events(
                session_id=thread_id,
            )

            pending_writes = []
            for write_doc in writes_result.get("events", []):
                # Filter client-side
                if write_doc.get("collection") != self.checkpoint_writes_type:
                    continue
                if write_doc.get("checkpoint_ns") != configurable_values["checkpoint_ns"]:
                    continue
                if write_doc.get("checkpoint_id") != configurable_values["checkpoint_id"]:
                    continue

                pending_writes.append(
                    (
                        write_doc["task_id"],
                        write_doc["channel"],
                        write_doc["value"],
                    )
                )

            # Get metadata
            metadata = doc.get("metadata", {})

            # Build parent config if exists
            parent_config = None
            if doc.get("parent_checkpoint_id"):
                parent_config = {
                    "configurable": {
                        "thread_id": thread_id,
                        "checkpoint_ns": checkpoint_ns,
                        "checkpoint_id": doc["parent_checkpoint_id"],
                    }
                }

            return CheckpointTuple(
                config={"configurable": configurable_values},
                checkpoint=checkpoint,
                metadata=metadata,
                parent_config=parent_config,
                pending_writes=pending_writes,
            )

        except Exception as e:
            print(f"Error getting checkpoint: {e}")
            return None

    def list(
        self,
        config: Optional[Dict[str, Any]] = None,
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
    ) -> Iterator[CheckpointTuple]:
        """List checkpoint tuples from TDAI Memory.

        :param config: Configuration containing thread_id and checkpoint_ns
        :type config: Optional[Dict[str, Any]]
        :param filter: Metadata filters
        :type filter: Optional[Dict[str, Any]]
        :param before: Return checkpoints before this config
        :type before: Optional[Dict[str, Any]]
        :param limit: Maximum number of checkpoints to return
        :type limit: Optional[int]
        :yield: Checkpoint tuples
        :rtype: Iterator[CheckpointTuple]
        """
        if not config or not config.get("configurable", {}).get("thread_id"):
            return

        configurable = config.get("configurable", {})
        thread_id = configurable["thread_id"]
        checkpoint_ns = configurable.get("checkpoint_ns")

        try:
            # Query all events for this session
            # Note: TDAI Memory API doesn't support filtering by custom fields in where clause
            # So we query all events and filter client-side
            result = self.client.query_events(
                session_id=thread_id,
            )

            events = result.get("events", [])

            # Filter events client-side
            matching_events = []
            for event in events:
                # Check collection type
                if event.get("collection") != self.checkpoint_type:
                    continue

                # Check checkpoint_ns
                if checkpoint_ns is not None and event.get("checkpoint_ns") != checkpoint_ns:
                    continue

                # Apply metadata filters
                if filter:
                    event_metadata = event.get("metadata", {})
                    if not all(event_metadata.get(k) == v for k, v in filter.items()):
                        continue

                # Apply before filter
                if before:
                    before_checkpoint_id = before.get("configurable", {}).get("checkpoint_id")
                    if before_checkpoint_id and event.get("checkpoint_id", "") >= before_checkpoint_id:
                        continue

                matching_events.append(event)

            # Sort by checkpoint_id descending
            matching_events.sort(key=lambda x: x.get("checkpoint_id", ""), reverse=True)

            # Apply limit
            if limit:
                matching_events = matching_events[:limit]

            for doc in matching_events:
                checkpoint = doc["checkpoint"]
                metadata = doc.get("metadata", {})

                parent_config = None
                if doc.get("parent_checkpoint_id"):
                    parent_config = {
                        "configurable": {
                            "thread_id": thread_id,
                            "checkpoint_ns": doc["checkpoint_ns"],
                            "checkpoint_id": doc["parent_checkpoint_id"],
                        }
                    }

                yield CheckpointTuple(
                    config={
                        "configurable": {
                            "thread_id": thread_id,
                            "checkpoint_ns": doc["checkpoint_ns"],
                            "checkpoint_id": doc["checkpoint_id"],
                        }
                    },
                    checkpoint=checkpoint,
                    metadata=metadata,
                    parent_config=parent_config,
                )

        except Exception as e:
            print(f"Error listing checkpoints: {e}")

    def put(
        self,
        config: Dict[str, Any],
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Save a checkpoint to TDAI Memory.

        :param config: Configuration containing thread_id and checkpoint_ns
        :type config: Dict[str, Any]
        :param checkpoint: Checkpoint data to save
        :type checkpoint: Checkpoint
        :param metadata: Checkpoint metadata
        :type metadata: CheckpointMetadata
        :param new_versions: New version information
        :type new_versions: Dict[str, Any]
        :return: Updated configuration
        :rtype: Dict[str, Any]
        """
        configurable = config.get("configurable", {})
        thread_id = configurable.get("thread_id")
        checkpoint_ns = configurable.get("checkpoint_ns", "")
        checkpoint_id = checkpoint["id"]

        if not thread_id:
            raise ValueError("thread_id is required in config.configurable")

        try:
            # Prepare document
            doc = {
                "collection": self.checkpoint_type,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
                "parent_checkpoint_id": configurable.get("checkpoint_id"),
                "checkpoint": checkpoint,
                "metadata": metadata,
            }

            # Check if checkpoint already exists
            existing = self.client.query_events(
                session_id=thread_id,
            )

            # Filter client-side to find existing checkpoint
            for event in existing.get("events", []):
                if (
                    event.get("collection") == self.checkpoint_type
                    and event.get("checkpoint_ns") == checkpoint_ns
                    and event.get("checkpoint_id") == checkpoint_id
                ):
                    # Delete existing checkpoint
                    try:
                        self.client.delete_event(
                            session_id=thread_id,
                            event_id=event["event_id"],
                        )
                    except Exception as delete_error:
                        # Ignore "not exist" errors - event may have been deleted already
                        error_msg = str(delete_error).lower()
                        if "not exist" not in error_msg:
                            raise
                    break

            # Append new checkpoint
            self.client.append_event(
                session_id=thread_id,
                messages=doc,
            )

            return {
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": checkpoint_id,
                }
            }

        except Exception as e:
            print(f"Error saving checkpoint: {e}")
            raise

    def put_writes(
        self,
        config: Dict[str, Any],
        writes: Sequence[Tuple[str, Any]],
        task_id: str,
    ) -> None:
        """Save intermediate writes associated with a checkpoint.

        :param config: Configuration containing thread_id, checkpoint_ns, and checkpoint_id
        :type config: Dict[str, Any]
        :param writes: List of (channel, value) tuples to save
        :type writes: Sequence[Tuple[str, Any]]
        :param task_id: Task identifier
        :type task_id: str
        """
        configurable = config.get("configurable", {})
        thread_id = configurable.get("thread_id")
        checkpoint_ns = configurable.get("checkpoint_ns")
        checkpoint_id = configurable.get("checkpoint_id")

        if not all([thread_id, checkpoint_ns is not None, checkpoint_id]):
            raise ValueError("thread_id, checkpoint_ns, and checkpoint_id are required in config.configurable")

        try:
            # Save each write
            for idx, (channel, value) in enumerate(writes):
                write_doc = {
                    "collection": self.checkpoint_writes_type,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": checkpoint_id,
                    "task_id": task_id,
                    "idx": idx,
                    "channel": channel,
                    "value": value,
                }

                self.client.append_event(
                    session_id=thread_id,
                    messages=write_doc,
                )

        except Exception as e:
            print(f"Error storing writes: {e}")
            raise

    # Async methods (delegate to sync methods for now)
    async def aget_tuple(self, config: Dict[str, Any]) -> Optional[CheckpointTuple]:
        """Async version of get_tuple."""
        return self.get_tuple(config)

    async def alist(
        self,
        config: Optional[Dict[str, Any]] = None,
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        """Async version of list."""
        for item in self.list(config, filter=filter, before=before, limit=limit):
            yield item

    async def aput(
        self,
        config: Dict[str, Any],
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Async version of put."""
        return self.put(config, checkpoint, metadata, new_versions)

    async def aput_writes(
        self,
        config: Dict[str, Any],
        writes: Sequence[Tuple[str, Any]],
        task_id: str,
    ) -> None:
        """Async version of put_writes."""
        self.put_writes(config, writes, task_id)
