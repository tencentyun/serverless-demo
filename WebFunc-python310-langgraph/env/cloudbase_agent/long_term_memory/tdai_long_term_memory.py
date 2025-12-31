"""TDAI Memory-based long-term memory implementation

Long-term memory implementation using TDAI Memory SDK's record functionality as backend storage.
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from ..memory.memory_base import Message
from .long_term_memory_base import BaseLongTermMemory, MemoryEntity, MemoryQuery


class TDAILongTermMemory(BaseLongTermMemory):
    """TDAI Memory SDK-based long-term memory implementation

    Uses TDAI Memory service's record functionality as backend storage, providing persistent long-term memory management.

    Example:
        ```python
        from cloudbase_agent.storage.long_term_memory import TDAILongTermMemory

        # Method 1: Initialize with explicit parameters
        memory = TDAILongTermMemory(
            endpoint="https://memory.tdai.tencentyun.com",
            api_key="your-api-key",
            memory_id="your-memory-id",
            actor_id="user123"
        )

        # Method 2: Initialize with environment variables
        # export TDAI_ENDPOINT=https://memory.tdai.tencentyun.com
        # export TDAI_API_KEY=your-api-key
        # export TDAI_MEMORY_ID=your-memory-id
        memory = TDAILongTermMemory(actor_id="user123")

        # Create session
        session_id = await memory.create_session(name="long-term-memory")

        # Record memory
        await memory.record(MemoryEntity(
            id="mem_1",
            strategy="important_facts",
            content="User prefers dark mode",
            metadata={"category": "preference"}
        ))

        # Retrieve memories
        memories = await memory.retrieve(MemoryQuery(
            strategy="important_facts",
            limit=10
        ))
        ```
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        memory_id: Optional[str] = None,
        actor_id: str = "",
        session_id: Optional[str] = None,
        timeout: int = 10,
        config: Optional[Dict[str, Any]] = None,
    ):
        """Initialize TDAI long-term memory instance

        Args:
            endpoint: TDAI Memory service endpoint (defaults to TDAI_ENDPOINT env var)
            api_key: API key (defaults to TDAI_API_KEY env var)
            memory_id: Memory ID (defaults to TDAI_MEMORY_ID env var)
            actor_id: Actor ID
            session_id: Session ID (optional, will be auto-created if not provided)
            timeout: Request timeout in seconds
            config: Additional configuration options
        """
        super().__init__(config)

        # Get parameters from environment variables if not provided
        endpoint = endpoint or os.getenv("TDAI_ENDPOINT", "https://memory.tdai.tencentyun.com")
        api_key = api_key or os.getenv("TDAI_API_KEY")
        memory_id = memory_id or os.getenv("TDAI_MEMORY_ID")

        # Validate required parameters
        if not api_key:
            raise ValueError(
                "api_key is required. Please provide it as parameter or set TDAI_API_KEY environment variable."
            )
        if not memory_id:
            raise ValueError(
                "memory_id is required. Please provide it as parameter or set TDAI_MEMORY_ID environment variable."
            )

        # Lazy import to avoid forced dependency
        try:
            from ..tdaimemory.tdaimemory import MemoryClient
        except ImportError:
            raise ImportError(
                "tdaimemory is required for TDAILongTermMemory. "
                "Please ensure tdaimemory module is available in storage folder."
            )

        self.client = MemoryClient(
            endpoint=endpoint, api_key=api_key, memory_id=memory_id, default_actor_id=actor_id, timeout=timeout
        )
        self.memory_id = memory_id
        self.actor_id = actor_id
        self._session_id = session_id

    async def _ensure_session(self) -> str:
        """Ensure session exists, create if not exists

        Returns:
            Session ID
        """
        if not self._session_id:
            result = self.client.create_session(
                memory_id=self.memory_id, actor_id=self.actor_id, name="long_term_memory_session"
            )
            self._session_id = result.get("session_id")
        return self._session_id

    async def record(self, memory: MemoryEntity) -> None:
        """Record a new memory entity

        Args:
            memory: The memory entity to store

        Raises:
            TDAIException: If the strategy is not configured or other API errors occur
        """
        from ..tdaimemory.errors import TDAIException

        try:
            session_id = await self._ensure_session()

            self.client.append_record(
                memory_id=self.memory_id,
                actor_id=self.actor_id,
                session_id=session_id,
                content=memory.content,
                strategy=memory.strategy,
            )
        except TDAIException as e:
            # Re-raise TDAI exceptions (like "strategy not exist")
            print(f"Error recording memory: {e}")
            raise
        except Exception as e:
            # Log and re-raise other exceptions
            print(f"Error recording memory: {e}")
            raise

    async def record_batch(self, memories: List[MemoryEntity]) -> None:
        """Record multiple memory entities in batch

        Args:
            memories: Array of memory entities to store
        """
        # TDAI Memory currently doesn't support batch recording, use loop
        for memory in memories:
            await self.record(memory)

    async def retrieve(self, query: MemoryQuery) -> List[MemoryEntity]:
        """Retrieve memories based on query conditions

        Args:
            query: Query conditions for filtering and searching

        Returns:
            Array of matching memory entities

        Raises:
            TDAIException: If the strategy is not configured or other API errors occur
        """
        from ..tdaimemory.errors import TDAIException

        try:
            session_id = await self._ensure_session()

            # Build query parameters
            query_params: Dict[str, Any] = {
                "memory_id": self.memory_id,
                "actor_id": self.actor_id,
                "session_id": session_id,
            }

            if query.strategy:
                if isinstance(query.strategy, str):
                    query_params["strategies"] = [query.strategy]
                else:
                    query_params["strategies"] = query.strategy

            if query.limit:
                query_params["limit"] = query.limit

            if query.offset:
                query_params["offset"] = query.offset

            if query.order_by:
                query_params["order_by"] = query.order_by

            if query.extra_filters:
                query_params["where"] = query.extra_filters

            # Query records
            result = self.client.query_records(**query_params)
            records_data = result.get("records", [])
        except TDAIException as e:
            # Re-raise TDAI exceptions (like "strategy not exist")
            print(f"Error retrieving memories: {e}")
            raise
        except Exception as e:
            # Log and re-raise other exceptions
            print(f"Error retrieving memories: {e}")
            raise

        # Convert to MemoryEntity format
        memories = []
        for record in records_data:
            # Handle timestamp conversion (API returns Unix timestamp in seconds)
            created_at = datetime.now()
            if record.get("created_at"):
                try:
                    created_at = datetime.fromtimestamp(record["created_at"])
                except (ValueError, TypeError):
                    pass

            updated_at = None
            if record.get("updated_at"):
                try:
                    updated_at = datetime.fromtimestamp(record["updated_at"])
                except (ValueError, TypeError):
                    pass

            memory = MemoryEntity(
                id=record.get("record_id", ""),
                strategy=record.get("strategy_name", ""),
                content=record.get("record_content", ""),
                metadata={
                    "session_id": session_id,
                    "record_id": record.get("record_id"),
                    "score": record.get("score"),
                    "event_ids": record.get("event_ids"),
                },
                created_at=created_at,
                updated_at=updated_at,
            )
            memories.append(memory)

        return memories

    async def delete(self, memory_id: Union[str, MemoryQuery]) -> None:
        """Delete memory by ID or query conditions

        Args:
            memory_id: Memory ID (string) or query conditions (MemoryQuery)
        """
        try:
            session_id = await self._ensure_session()

            if isinstance(memory_id, str):
                # Delete record by ID directly
                self.client.delete_record(
                    memory_id=self.memory_id, actor_id=self.actor_id, session_id=session_id, record_id=memory_id
                )
            else:
                # Find and delete by query conditions
                memories = await self.retrieve(memory_id)
                for memory in memories:
                    self.client.delete_record(
                        memory_id=self.memory_id, actor_id=self.actor_id, session_id=session_id, record_id=memory.id
                    )
        except Exception as e:
            # Log error but don't raise
            print(f"Error deleting memory: {e}")

    async def update(self, memory_id: str, updates: Dict[str, Any]) -> None:
        """Update an existing memory entity

        Args:
            memory_id: ID of the memory to update
            updates: Fields to update
        """
        try:
            session_id = await self._ensure_session()

            # TDAI Memory only supports updating content
            if "content" in updates:
                self.client.update_record(
                    memory_id=self.memory_id,
                    actor_id=self.actor_id,
                    session_id=session_id,
                    record_id=memory_id,
                    content=updates["content"],
                )
        except Exception as e:
            # Log error but don't raise
            print(f"Error updating memory: {e}")

    async def clear(self, strategy: Optional[str] = None) -> None:
        """Clear all memories for a specific strategy or all memories

        Args:
            strategy: Optional strategy filter; if not specified, clears all memories
        """
        # Query memories to delete
        query = MemoryQuery(strategy=strategy) if strategy else MemoryQuery()
        memories = await self.retrieve(query)

        # Delete all matching memories
        for memory in memories:
            await self.delete(memory.id)

    async def extract_and_record(self, messages: List[Message], context: Dict[str, Any]) -> List[MemoryEntity]:
        """Extract and record memories from conversation messages

        Note: This is a simplified implementation, actual applications may need to use LLM for intelligent extraction

        Args:
            messages: Array of conversation messages to analyze
            context: Additional context information for extraction

        Returns:
            Array of extracted memory entities
        """
        extracted_memories = []
        strategy = context.get("strategy", "conversation")

        # Simple implementation: treat each message as a memory
        for message in messages:
            memory = MemoryEntity(
                id=self.generate_memory_id(),
                strategy=strategy,
                content=message.content,
                role=message.role.value if hasattr(message.role, "value") else message.role,
                metadata={
                    "message_id": message.id,
                    "timestamp": message.timestamp.isoformat() if message.timestamp else None,
                    **context,
                },
            )
            await self.record(memory)
            extracted_memories.append(memory)

        return extracted_memories

    async def semantic_search(self, query: str, options: Optional[MemoryQuery] = None) -> List[MemoryEntity]:
        """Perform semantic search on stored memories

        Args:
            query: Search query text for semantic matching
            options: Optional search parameters and filters

        Returns:
            Array of semantically similar memories

        Raises:
            TDAIException: If the strategy is not configured or other API errors occur
        """
        from ..tdaimemory.errors import TDAIException

        try:
            session_id = await self._ensure_session()

            # Build search parameters
            search_params: Dict[str, Any] = {
                "memory_id": self.memory_id,
                "actor_id": self.actor_id,
                "session_id": session_id,
                "content": query,
            }

            if options:
                if options.strategy:
                    if isinstance(options.strategy, str):
                        search_params["strategies"] = [options.strategy]
                    else:
                        search_params["strategies"] = options.strategy

                if options.limit:
                    search_params["limit"] = options.limit

                if options.order_by:
                    search_params["order_by"] = options.order_by

                if options.extra_filters:
                    search_params["where"] = options.extra_filters

            # Execute search
            result = self.client.search_records(**search_params)
            records_data = result.get("records", [])
        except TDAIException as e:
            # Re-raise TDAI exceptions (like "strategy not exist")
            print(f"Error searching memories: {e}")
            raise
        except Exception as e:
            # Log and re-raise other exceptions
            print(f"Error searching memories: {e}")
            raise

        # Convert to MemoryEntity format
        memories = []
        for record in records_data:
            # Handle timestamp conversion (API returns Unix timestamp in seconds)
            created_at = datetime.now()
            if record.get("created_at"):
                try:
                    created_at = datetime.fromtimestamp(record["created_at"])
                except (ValueError, TypeError):
                    pass

            updated_at = None
            if record.get("updated_at"):
                try:
                    updated_at = datetime.fromtimestamp(record["updated_at"])
                except (ValueError, TypeError):
                    pass

            memory = MemoryEntity(
                id=record.get("record_id", ""),
                strategy=record.get("strategy_name", ""),
                content=record.get("record_content", ""),
                metadata={
                    "session_id": session_id,
                    "record_id": record.get("record_id"),
                    "score": record.get("score"),  # Search relevance score
                    "event_ids": record.get("event_ids"),
                },
                created_at=created_at,
                updated_at=updated_at,
            )
            memories.append(memory)

        return memories

    async def get_related_memories(self, memory_id: str, depth: int = 1) -> List[MemoryEntity]:
        """Get memories related to a specific memory entity

        Note: This is a simplified implementation, TDAI Memory may not directly support relationship queries

        Args:
            memory_id: ID of the memory to find relations for
            depth: Relationship depth to traverse, defaults to 1

        Returns:
            Array of related memory entities
        """
        try:
            # Simplified implementation: return other memories with the same strategy
            # First get the target memory
            all_memories = await self.retrieve(MemoryQuery())
            target_memory = None

            for memory in all_memories:
                if memory.id == memory_id:
                    target_memory = memory
                    break

            if not target_memory:
                return []

            # Return other memories with the same strategy
            related = await self.retrieve(MemoryQuery(strategy=target_memory.strategy, limit=10))

            # Exclude the target memory itself
            return [m for m in related if m.id != memory_id]
        except Exception as e:
            # Return empty list on error (matches TypeScript implementation)
            print(f"Error getting related memories: {e}")
            return []

    async def consolidate(self) -> None:
        """Consolidate and optimize stored memories

        Note: This is a placeholder implementation, actual applications need to implement deduplication, merging, etc.
        """
        # TODO: Implement memory consolidation logic
        # - Deduplication
        # - Merge similar memories
        # - Decay old memories
        # - Reinforce important memories
        pass

    async def create_session(self, name: Optional[str] = None) -> str:
        """Create a new session

        Args:
            name: Session name

        Returns:
            Session ID
        """
        result = self.client.create_session(
            memory_id=self.memory_id, actor_id=self.actor_id, name=name or "long_term_memory_session"
        )
        session_id = result.get("session_id")
        self._session_id = session_id
        return session_id

    def close(self):
        """Close client connection"""
        self.client.close()
