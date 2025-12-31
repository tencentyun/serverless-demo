"""Abstract base class for long-term memory implementations

This module defines the core interface and common functionality for long-term memory systems.
Concrete implementations can be based on different storage backends such as vector databases,
graph databases, or other persistent storage solutions.
"""

import random
import string
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional, Union

from ..memory.memory_base import Message


@dataclass
class MemoryEntity:
    """Memory entity interface representing a stored memory item

    Attributes:
        id: Unique identifier for the memory
        strategy: Memory strategy/category for classification
        role: Role of the message creator
        content: Memory content text
        metadata: Additional metadata for the memory
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    id: str
    strategy: str
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    role: Optional[Literal["user", "assistant"]] = None
    updated_at: Optional[datetime] = None


@dataclass
class MemoryQuery:
    """Memory query interface for searching and filtering memories

    Attributes:
        query: Semantic query text for content matching
        strategy: Strategy filter - single strategy or array of strategies
        limit: Maximum number of results to return
        offset: Number of results to skip for pagination
        order_by: Sorting criteria with field names and directions
    """

    query: Optional[str] = None
    strategy: Optional[Union[str, List[str]]] = None
    limit: Optional[int] = None
    offset: Optional[int] = None
    order_by: Optional[Dict[str, Literal[1, -1]]] = None
    # Allow implementers to add any custom query conditions
    extra_filters: Optional[Dict[str, Any]] = None


class BaseLongTermMemory(ABC):
    """Abstract base class for long-term memory implementations

    This base class defines the core interface and common functionality for long-term memory systems.
    Concrete implementations can be based on different storage backends such as vector databases,
    graph databases, or other persistent storage solutions.

    Example:
        ```python
        class CustomLongTermMemory(BaseLongTermMemory):
            async def record(self, memory: MemoryEntity) -> None:
        # Custom implementation
        pass
        # ... implement other required methods
        ```
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Creates a new BaseLongTermMemory instance

        Args:
            config: Configuration object for the memory implementation
        """
        self.config = config or {}

    # ==================== Core Methods ====================

    @abstractmethod
    async def record(self, memory: MemoryEntity) -> None:
        """Record a new memory entity

        Args:
            memory: The memory entity to store
        """
        pass

    @abstractmethod
    async def record_batch(self, memories: List[MemoryEntity]) -> None:
        """Record multiple memory entities in batch

        Args:
            memories: Array of memory entities to store
        """
        pass

    @abstractmethod
    async def retrieve(self, query: MemoryQuery) -> List[MemoryEntity]:
        """Retrieve memories based on query conditions

        Args:
            query: Query conditions for filtering and searching

        Returns:
            Array of matching memory entities
        """
        pass

    @abstractmethod
    async def delete(self, memory_id: Union[str, MemoryQuery]) -> None:
        """Delete memory by ID or query conditions

        Args:
            memory_id: Memory ID (string) or query conditions (MemoryQuery)
        """
        pass

    @abstractmethod
    async def update(self, memory_id: str, updates: Dict[str, Any]) -> None:
        """Update an existing memory entity

        Args:
            memory_id: ID of the memory to update
            updates: Partial memory entity with fields to update
        """
        pass

    @abstractmethod
    async def clear(self, strategy: Optional[str] = None) -> None:
        """Clear all memories for a specific strategy or all memories

        Args:
            strategy: Optional strategy filter; if not specified, clears all memories
        """
        pass

    # ==================== Advanced Features ====================

    @abstractmethod
    async def extract_and_record(self, messages: List[Message], context: Dict[str, Any]) -> List[MemoryEntity]:
        """Extract and record memories from conversation messages

        Args:
            messages: Array of conversation messages to analyze
            context: Additional context information for extraction

        Returns:
            Array of extracted memory entities
        """
        pass

    @abstractmethod
    async def semantic_search(self, query: str, options: Optional[MemoryQuery] = None) -> List[MemoryEntity]:
        """Perform semantic search on stored memories

        Args:
            query: Search query text for semantic matching
            options: Optional search parameters and filters

        Returns:
            Array of semantically similar memories
        """
        pass

    @abstractmethod
    async def get_related_memories(self, memory_id: str, depth: int = 1) -> List[MemoryEntity]:
        """Get memories related to a specific memory entity

        Args:
            memory_id: ID of the memory to find relations for
            depth: Relationship depth to traverse, defaults to 1

        Returns:
            Array of related memory entities
        """
        pass

    @abstractmethod
    async def consolidate(self) -> None:
        """Consolidate and optimize stored memories

        Includes operations like deduplication, merging, decay, and reinforcement
        """
        pass

    # ==================== Helper Methods ====================

    def generate_memory_id(self) -> str:
        """Generate a unique memory ID

        Implementers can override this method to customize ID generation strategy

        Returns:
            Unique memory identifier string
        """
        timestamp = int(time.time() * 1000)
        random_str = "".join(random.choices(string.ascii_lowercase + string.digits, k=9))
        return f"memory_{timestamp}_{random_str}"
