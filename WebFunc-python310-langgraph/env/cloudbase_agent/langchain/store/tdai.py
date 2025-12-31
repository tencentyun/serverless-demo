#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LangChain store implementation using TDAI Memory.

This module provides a key-value store for LangChain that uses TDAI Memory
as the backend storage, enabling persistent caching and storage.
"""

import base64
import json
from datetime import datetime
from typing import Iterator, List, Optional, Sequence, Tuple

try:
    from langchain_core.stores import BaseStore
except ImportError:
    raise ImportError("langchain-core is required for TDAIStore. Install it with: pip install langchain-core")

from cloudbase_agent.tdaimemory import MemoryClient


class TDAIStore(BaseStore[str, bytes]):
    """LangChain key-value store using TDAI Memory as backend.

    This class implements the BaseStore interface for persistent key-value storage
    using TDAI Memory's record storage system.

    :param client: TDAI Memory client instance
    :type client: MemoryClient
    :param namespace: Optional namespace for keys
    :type namespace: Optional[str]
    :param default_session_id: Default session ID for storing records
    :type default_session_id: str
    :param default_strategy: Default strategy for storing records
    :type default_strategy: str
    :param ttl_seconds: Optional TTL for records in seconds
    :type ttl_seconds: Optional[int]
    :param yield_keys_scan_batch_size: Batch size for yielding keys
    :type yield_keys_scan_batch_size: int

    Example::

        from cloudbase_agent.storage.tdaimemory import MemoryClient
        from cloudbase_agent.storage.langchain.store import TDAIStore

        client = MemoryClient(
            endpoint="https://memory.tdai.tencentyun.com",
            api_key="your-api-key",
            memory_id="your-memory-id"
        )

        store = TDAIStore(
            client=client,
            namespace="cache"
        )

        # Store values
        store.mset([
            ("key1", b"value1"),
            ("key2", b"value2"),
        ])

        # Get values
        values = store.mget(["key1", "key2"])

        # Delete values
        store.mdelete(["key1"])
    """

    def __init__(
        self,
        client: MemoryClient,
        namespace: Optional[str] = None,
        default_session_id: str = "session-lc_store",
        default_strategy: str = "Persona_Profile",
        ttl_seconds: Optional[int] = None,
        yield_keys_scan_batch_size: int = 100,
    ):
        """Initialize the TDAI store.

        :param client: TDAI Memory client instance
        :type client: MemoryClient
        :param namespace: Optional namespace for keys
        :type namespace: Optional[str]
        :param default_session_id: Default session ID (must start with 'session-' and be 16-20 chars)
        :type default_session_id: str
        :param default_strategy: Default storage strategy (must be configured on TDAI server)
        :type default_strategy: str
        :param ttl_seconds: Optional TTL in seconds
        :type ttl_seconds: Optional[int]
        :param yield_keys_scan_batch_size: Batch size for key iteration (max 100)
        :type yield_keys_scan_batch_size: int
        """
        self.client = client
        self.namespace = namespace
        self.default_session_id = default_session_id
        self.default_strategy = default_strategy
        self.ttl_seconds = ttl_seconds
        self.yield_keys_scan_batch_size = min(yield_keys_scan_batch_size, 100)  # Max 100
        self._session_cache: Optional[str] = None

    def _get_prefixed_key(self, key: str) -> str:
        """Get prefixed key with namespace.

        :param key: Original key
        :type key: str
        :return: Prefixed key
        :rtype: str
        """
        if self.namespace:
            return f"{self.namespace}/{key}"
        return key

    def _get_deprefixed_key(self, key: str) -> str:
        """Remove prefix from key.

        :param key: Prefixed key
        :type key: str
        :return: Original key
        :rtype: str
        """
        if self.namespace:
            prefix = f"{self.namespace}/"
            if key.startswith(prefix):
                return key[len(prefix) :]
        return key

    def _get_session(self) -> str:
        """Get or create session for the store.

        :return: Session ID
        :rtype: str
        """
        if self._session_cache:
            return self._session_cache

        try:
            # Try to find existing session
            result = self.client.query_sessions(limit=1)
            sessions = result.get("sessions", [])

            if sessions:
                self._session_cache = sessions[0].get("session_id")
            else:
                # Create new session
                result = self.client.create_session(name=f"langchain_store_{self.namespace or 'default'}")
                self._session_cache = result.get("session_id")

            return self._session_cache
        except Exception:
            # Fallback to default session
            return self.default_session_id

    def _create_record_content(self, key: str, value: bytes) -> str:
        """Create record content for storage.

        :param key: Key
        :type key: str
        :param value: Value as bytes
        :type value: bytes
        :return: JSON string for storage
        :rtype: str
        """
        # Use base64 encoding to handle binary data safely
        content = {
            "key": self._get_prefixed_key(key),
            "value": base64.b64encode(value).decode("ascii"),
            "timestamp": datetime.now().isoformat(),
            "ttl": self.ttl_seconds,
        }
        return json.dumps(content)

    def _parse_record_content(self, content: str) -> Optional[dict]:
        """Parse record content from storage.

        :param content: JSON string from storage
        :type content: str
        :return: Parsed data or None if expired/invalid
        :rtype: Optional[dict]
        """
        try:
            data = json.loads(content)

            # Check TTL if present
            if data.get("ttl") and data.get("timestamp"):
                timestamp = datetime.fromisoformat(data["timestamp"])
                now = datetime.now()
                if (now - timestamp).total_seconds() > data["ttl"]:
                    return None  # Expired

            # Decode base64 value back to bytes
            return {
                "key": data["key"],
                "value": base64.b64decode(data["value"]),
                "timestamp": data["timestamp"],
                "ttl": data.get("ttl"),
            }
        except Exception:
            return None

    def mget(self, keys: Sequence[str]) -> List[Optional[bytes]]:
        """Get multiple keys from the store.

        :param keys: List of keys to retrieve
        :type keys: Sequence[str]
        :return: List of values (None if key not found)
        :rtype: List[Optional[bytes]]
        """
        if not keys:
            return []

        try:
            session_id = self._get_session()
            results: List[Optional[bytes]] = [None] * len(keys)

            # Build a map of prefixed keys to original indices
            prefixed_keys = {self._get_prefixed_key(key): i for i, key in enumerate(keys)}

            # Query all records for this session and strategy
            try:
                result = self.client.query_records(
                    session_id=session_id,
                    strategies=[self.default_strategy],
                    limit=100,  # Max allowed by API
                )

                records = result.get("records", [])

                # Parse each record and match against requested keys
                for record in records:
                    parsed = self._parse_record_content(record["record_content"])
                    if parsed and parsed["key"] in prefixed_keys:
                        idx = prefixed_keys[parsed["key"]]
                        results[idx] = parsed["value"]
            except Exception:
                # If query fails, try search_records as fallback for each key
                for i, key in enumerate(keys):
                    prefixed_key = self._get_prefixed_key(key)
                    try:
                        result = self.client.search_records(
                            content=prefixed_key,
                            session_id=session_id,
                            strategies=[self.default_strategy],
                            limit=1,
                        )

                        records = result.get("records", [])
                        if records:
                            record = records[0]
                            parsed = self._parse_record_content(record["record_content"])

                            if parsed and parsed["key"] == prefixed_key:
                                results[i] = parsed["value"]
                    except Exception:
                        results[i] = None

            return results
        except Exception:
            return [None] * len(keys)

    def mset(self, key_value_pairs: Sequence[Tuple[str, bytes]]) -> None:
        """Set multiple keys in the store.

        :param key_value_pairs: List of (key, value) tuples
        :type key_value_pairs: Sequence[Tuple[str, bytes]]
        """
        if not key_value_pairs:
            return

        try:
            session_id = self._get_session()

            # Set each key-value pair
            for key, value in key_value_pairs:
                content = self._create_record_content(key, value)

                try:
                    self.client.append_record(
                        session_id=session_id,
                        content=content,
                        strategy=self.default_strategy,
                    )
                except Exception as e:
                    print(f"Failed to set key {key}: {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to set keys: {e}")

    def mdelete(self, keys: Sequence[str]) -> None:
        """Delete multiple keys from the store.

        :param keys: List of keys to delete
        :type keys: Sequence[str]
        """
        if not keys:
            return

        try:
            session_id = self._get_session()

            # Build a map of prefixed keys to original keys
            prefixed_keys = {self._get_prefixed_key(key): key for key in keys}

            # Query all records to find the ones to delete
            try:
                result = self.client.query_records(
                    session_id=session_id,
                    strategies=[self.default_strategy],
                    limit=100,
                )

                records = result.get("records", [])

                # Find and delete matching records
                for record in records:
                    parsed = self._parse_record_content(record["record_content"])
                    if parsed and parsed["key"] in prefixed_keys:
                        try:
                            self.client.delete_record(
                                session_id=session_id,
                                record_id=record["record_id"],
                            )
                        except Exception as e:
                            print(f"Failed to delete key {prefixed_keys[parsed['key']]}: {e}")
            except Exception:
                # Fallback to search_records for each key
                for key in keys:
                    prefixed_key = self._get_prefixed_key(key)
                    try:
                        result = self.client.search_records(
                            content=prefixed_key,
                            session_id=session_id,
                            strategies=[self.default_strategy],
                            limit=1,
                        )

                        records = result.get("records", [])
                        if records:
                            record = records[0]
                            self.client.delete_record(
                                session_id=session_id,
                                record_id=record["record_id"],
                            )
                    except Exception as e:
                        print(f"Failed to delete key {key}: {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to delete keys: {e}")

    def yield_keys(self, prefix: Optional[str] = None) -> Iterator[str]:
        """Yield keys from the store.

        :param prefix: Optional prefix to filter keys
        :type prefix: Optional[str]
        :yield: Keys from the store
        :rtype: Iterator[str]
        """
        try:
            session_id = self._get_session()
            offset = 0
            has_more = True

            while has_more:
                try:
                    result = self.client.query_records(
                        session_id=session_id,
                        strategies=[self.default_strategy],
                        limit=self.yield_keys_scan_batch_size,
                        offset=offset,
                    )

                    records = result.get("records", [])
                    if not records:
                        has_more = False
                        break

                    for record in records:
                        parsed = self._parse_record_content(record["record_content"])
                        if parsed:
                            deprefixed_key = self._get_deprefixed_key(parsed["key"])

                            if not prefix or deprefixed_key.startswith(prefix):
                                yield deprefixed_key

                    offset += len(records)

                    # If we got fewer records than requested, we've reached the end
                    if len(records) < self.yield_keys_scan_batch_size:
                        has_more = False
                except Exception as e:
                    print(f"Error yielding keys at offset {offset}: {e}")
                    has_more = False
        except Exception as e:
            print(f"Error yielding keys: {e}")

    def close(self) -> None:
        """Close the TDAI client connection."""
        self.client.close()
