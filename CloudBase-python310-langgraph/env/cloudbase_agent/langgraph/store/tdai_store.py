#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LangGraph store implementation using TDAI Memory.

This module provides a store for LangGraph that uses TDAI Memory
as the backend storage, enabling persistent key-value storage for LangGraph agents.
"""

import json
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

try:
    from langgraph.store.base import BaseStore, GetOp, Item, ListNamespacesOp, Op, PutOp, SearchOp
except ImportError:
    raise ImportError("langgraph is required for TDAIStore. Install it with: pip install langgraph")

from cloudbase_agent.tdaimemory import MemoryClient


class TDAIStore(BaseStore):
    """LangGraph store using TDAI Memory as backend.

    This class implements the BaseStore interface to store and retrieve
    items using TDAI Memory's record storage system.

    :param client: TDAI Memory client instance
    :type client: MemoryClient
    :param session_id: Session ID for storing records
    :type session_id: str
    :param namespace_prefix: Optional namespace prefix for all operations
    :type namespace_prefix: Optional[List[str]]
    :param default_strategy: Default strategy for storing records (default: "Persona_Profile")
    :type default_strategy: str
    :param ttl_seconds: Optional TTL for records in seconds
    :type ttl_seconds: Optional[int]
    :param ensure_tables: Whether to ensure tables/collections exist on startup
    :type ensure_tables: bool

    Example::

        from cloudbase_agent.storage.tdaimemory import MemoryClient
        from cloudbase_agent.storage.langgraph.store import TDAIStore

        client = MemoryClient(
            endpoint="https://memory.tdai.tencentyun.com",
            api_key="your-api-key",
            memory_id="your-memory-id"
        )

        store = TDAIStore(
            client=client,
            session_id="my_session"
        )

        # Use with LangGraph
        await store.put(["users"], "user1", {"name": "Alice"})
        item = await store.get(["users"], "user1")
    """

    def __init__(
        self,
        client: MemoryClient,
        session_id: str,
        namespace_prefix: Optional[List[str]] = None,
        default_strategy: str = "Persona_Profile",
        ttl_seconds: Optional[int] = None,
        ensure_tables: bool = True,
    ):
        """Initialize the TDAI store.

        :param client: TDAI Memory client instance
        :type client: MemoryClient
        :param session_id: Session ID for storing records
        :type session_id: str
        :param namespace_prefix: Optional namespace prefix
        :type namespace_prefix: Optional[List[str]]
        :param default_strategy: Default storage strategy (default: "Persona_Profile")
        :type default_strategy: str
        :param ttl_seconds: Optional TTL in seconds
        :type ttl_seconds: Optional[int]
        :param ensure_tables: Whether to ensure tables exist
        :type ensure_tables: bool
        """
        self.client = client
        self.session_id = session_id
        self.namespace_prefix = namespace_prefix or []
        self.default_strategy = default_strategy
        self.ttl_seconds = ttl_seconds
        self.ensure_tables = ensure_tables
        self._is_setup = False

    def _create_storage_key(self, namespace: List[str], key: str) -> str:
        """Create a storage key from namespace and key.

        :param namespace: Namespace path
        :type namespace: List[str]
        :param key: Item key
        :type key: str
        :return: Storage key
        :rtype: str
        """
        full_namespace = self.namespace_prefix + namespace
        return f"{':'.join(full_namespace)}:{key}"

    def _parse_storage_key(self, storage_key: str) -> Tuple[List[str], str]:
        """Parse a storage key back to namespace and key.

        :param storage_key: Storage key
        :type storage_key: str
        :return: Tuple of (namespace, key)
        :rtype: Tuple[List[str], str]
        """
        parts = storage_key.split(":")
        prefix_length = len(self.namespace_prefix)
        namespace = parts[prefix_length:-1]
        key = parts[-1]
        return namespace, key

    async def put(
        self,
        namespace: Tuple[str, ...],
        key: str,
        value: Dict[str, Any],
    ) -> None:
        """Put an item into the store.

        :param namespace: Namespace tuple
        :type namespace: Tuple[str, ...]
        :param key: Item key
        :type key: str
        :param value: Item value
        :type value: Dict[str, Any]
        """
        if not self._is_setup and self.ensure_tables:
            await self.setup()

        storage_key = self._create_storage_key(list(namespace), key)

        # Check if item already exists and delete it (to implement update)
        try:
            result = self.client.query_records(
                session_id=self.session_id,
                limit=100,
            )

            for record in result.get("records", []):
                try:
                    data = json.loads(record["record_content"])
                    if data.get("storage_key") == storage_key:
                        # Delete existing record
                        self.client.delete_record(
                            session_id=self.session_id,
                            record_id=record["record_id"],
                        )
                        break
                except Exception:
                    continue
        except Exception:
            pass  # If query fails, just proceed with append

        # Prepare the content with metadata
        content = json.dumps(
            {
                "storage_key": storage_key,
                "namespace": list(namespace),
                "key": key,
                "value": value,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }
        )

        # Store in TDAI Memory
        self.client.append_record(
            session_id=self.session_id,
            content=content,
            strategy=self.default_strategy,
        )

    async def get(
        self,
        namespace: Tuple[str, ...],
        key: str,
    ) -> Optional[Item]:
        """Get an item from the store.

        :param namespace: Namespace tuple
        :type namespace: Tuple[str, ...]
        :param key: Item key
        :type key: str
        :return: Item if found, None otherwise
        :rtype: Optional[Item]
        """
        if not self._is_setup and self.ensure_tables:
            await self.setup()

        storage_key = self._create_storage_key(list(namespace), key)

        try:
            # Use query_records for exact matching instead of semantic search
            result = self.client.query_records(
                session_id=self.session_id,
                limit=100,  # Max limit allowed by API
            )

            records = result.get("records", [])

            # Find the exact match by storage_key
            for record in records:
                try:
                    data = json.loads(record["record_content"])
                    if data.get("storage_key") == storage_key:
                        # Check TTL if present
                        if self.ttl_seconds and data.get("created_at"):
                            created_time = datetime.fromisoformat(data["created_at"])
                            now = datetime.now()
                            if (now - created_time).total_seconds() > self.ttl_seconds:
                                # Item has expired, delete it
                                await self.delete(namespace, key)
                                return None

                        # Parse timestamps from ISO format strings to datetime objects
                        created_at_str = data.get("created_at")
                        updated_at_str = data.get("updated_at")

                        return Item(
                            namespace=list(namespace),
                            key=key,
                            value=data["value"],
                            created_at=datetime.fromisoformat(created_at_str) if created_at_str else datetime.now(),
                            updated_at=datetime.fromisoformat(updated_at_str) if updated_at_str else datetime.now(),
                        )
                except Exception:
                    continue

            return None
        except Exception:
            return None

    async def delete(
        self,
        namespace: Tuple[str, ...],
        key: str,
    ) -> None:
        """Delete an item from the store.

        :param namespace: Namespace tuple
        :type namespace: Tuple[str, ...]
        :param key: Item key
        :type key: str
        """
        if not self._is_setup and self.ensure_tables:
            await self.setup()

        storage_key = self._create_storage_key(list(namespace), key)

        try:
            # Use query_records for exact matching
            result = self.client.query_records(
                session_id=self.session_id,
                limit=100,  # Max limit allowed by API
            )

            records = result.get("records", [])

            # Find and delete the exact match
            for record in records:
                try:
                    data = json.loads(record["record_content"])
                    if data.get("storage_key") == storage_key:
                        self.client.delete_record(
                            session_id=self.session_id,
                            record_id=record["record_id"],
                        )
                        break
                except Exception:
                    continue
        except Exception:
            # Ignore errors if item doesn't exist
            pass

    async def search(
        self,
        namespace_prefix: Tuple[str, ...],
        *,
        filter: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        offset: int = 0,
    ) -> List[Item]:
        """Search for items in the store.

        :param namespace_prefix: Namespace prefix to search
        :type namespace_prefix: Tuple[str, ...]
        :param filter: Optional filter conditions
        :type filter: Optional[Dict[str, Any]]
        :param limit: Maximum number of results
        :type limit: int
        :param offset: Number of results to skip
        :type offset: int
        :return: List of matching items
        :rtype: List[Item]
        """
        if not self._is_setup and self.ensure_tables:
            await self.setup()

        # Build search query
        namespace_key = ":".join(self.namespace_prefix + list(namespace_prefix))

        try:
            result = self.client.query_records(
                session_id=self.session_id,
                limit=min(limit + offset, 100),  # Max limit allowed by API
            )

            items = []
            now = datetime.now()

            for record in result.get("records", [])[offset : offset + limit]:
                try:
                    data = json.loads(record["record_content"])

                    # Filter by namespace prefix
                    if namespace_key and not data.get("storage_key", "").startswith(namespace_key):
                        continue

                    # Check TTL
                    if self.ttl_seconds and data.get("created_at"):
                        created_time = datetime.fromisoformat(data["created_at"])
                        if (now - created_time).total_seconds() > self.ttl_seconds:
                            continue  # Skip expired items

                    # Apply filters
                    if filter:
                        matches = all(data.get("value", {}).get(key) == value for key, value in filter.items())
                        if not matches:
                            continue

                    # Parse timestamps from ISO format strings to datetime objects
                    created_at_str = data.get("created_at")
                    updated_at_str = data.get("updated_at")

                    items.append(
                        Item(
                            namespace=tuple(data["namespace"]),
                            key=data["key"],
                            value=data["value"],
                            created_at=datetime.fromisoformat(created_at_str) if created_at_str else datetime.now(),
                            updated_at=datetime.fromisoformat(updated_at_str) if updated_at_str else datetime.now(),
                        )
                    )
                except Exception:
                    # Skip invalid records
                    continue

            return items
        except Exception:
            return []

    async def list_namespaces(
        self,
        *,
        prefix: Optional[Tuple[str, ...]] = None,
        suffix: Optional[Tuple[str, ...]] = None,
        max_depth: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Tuple[str, ...]]:
        """List namespaces with optional filtering.

        :param prefix: Optional namespace prefix filter
        :type prefix: Optional[Tuple[str, ...]]
        :param suffix: Optional namespace suffix filter
        :type suffix: Optional[Tuple[str, ...]]
        :param max_depth: Optional maximum namespace depth
        :type max_depth: Optional[int]
        :param limit: Maximum number of results
        :type limit: int
        :param offset: Number of results to skip
        :type offset: int
        :return: List of namespace tuples
        :rtype: List[Tuple[str, ...]]
        """
        if not self._is_setup and self.ensure_tables:
            await self.setup()

        try:
            # Get all records to extract namespaces
            result = self.client.query_records(
                session_id=self.session_id,
                limit=100,  # Max limit allowed by API
            )

            namespace_set = set()

            for record in result.get("records", []):
                try:
                    data = json.loads(record["record_content"])
                    if "namespace" in data:
                        namespace = tuple(data["namespace"])

                        # Apply prefix filter
                        if prefix and not namespace[: len(prefix)] == prefix:
                            continue

                        # Apply suffix filter
                        if suffix and not namespace[-len(suffix) :] == suffix:
                            continue

                        # Apply max_depth filter
                        if max_depth is not None and len(namespace) > max_depth:
                            continue

                        namespace_set.add(namespace)
                except Exception:
                    # Skip invalid records
                    continue

            # Convert to list and apply pagination
            namespaces = sorted(list(namespace_set))[offset : offset + limit]
            return namespaces
        except Exception:
            return []

    async def batch(self, ops: List[Op]) -> List[Any]:
        """Execute multiple operations in a single batch.

        :param ops: List of operations to execute
        :type ops: List[Op]
        :return: List of operation results
        :rtype: List[Any]
        """
        if not self._is_setup and self.ensure_tables:
            await self.setup()

        results = []

        for op in ops:
            if isinstance(op, PutOp):
                await self.put(op.namespace, op.key, op.value)
                results.append(None)
            elif isinstance(op, GetOp):
                result = await self.get(op.namespace, op.key)
                results.append(result)
            elif isinstance(op, SearchOp):
                result = await self.search(
                    op.namespace_prefix,
                    filter=op.filter,
                    limit=op.limit,
                    offset=op.offset,
                )
                results.append(result)
            elif isinstance(op, ListNamespacesOp):
                result = await self.list_namespaces(
                    prefix=op.prefix,
                    suffix=op.suffix,
                    max_depth=op.max_depth,
                    limit=op.limit,
                    offset=op.offset,
                )
                results.append(result)
            else:
                raise ValueError(f"Unsupported operation type: {type(op)}")

        return results

    async def abatch(self, ops: List[Op]) -> List[Any]:
        """Execute multiple operations in a single batch (async version).

        This is an alias for batch() since all operations are already async.

        :param ops: List of operations to execute
        :type ops: List[Op]
        :return: List of operation results
        :rtype: List[Any]
        """
        return await self.batch(ops)

    async def setup(self) -> None:
        """Initialize the store."""
        if self._is_setup:
            return

        # No specific setup needed for TDAI Memory
        self._is_setup = True

    async def start(self) -> None:
        """Start the store."""
        if self.ensure_tables and not self._is_setup:
            await self.setup()

    async def stop(self) -> None:
        """Stop the store and close all connections."""
        self.client.close()

    def close(self) -> None:
        """Close the TDAI client connection."""
        self.client.close()
