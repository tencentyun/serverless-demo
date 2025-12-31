"""In-memory implementation of short-term memory

In-memory implementation for development and testing. Stores events in memory and provides basic CRUD operations and content-based similarity search.
Data is volatile and will be lost when the process terminates.
"""

from copy import deepcopy
from typing import Dict, List, Optional

from .memory_base import (
    AddOptions,
    BaseMemory,
    ClearOptions,
    DeleteOptions,
    IMemoryEvent,
    ListOptions,
    RetrieveOptions,
)


class InMemoryMemory(BaseMemory):
    """In-memory implementation of BaseMemory for development and testing

    Stores events in memory and provides basic CRUD operations and content-based similarity search.
    Data is volatile and will be lost when the process terminates.
    Supports multiple sessions through session_id-based event storage.

    Example:
        ```python
        from datetime import datetime
        from cloudbase_agent.storage.memory import (
            InMemoryMemory, IMemoryEvent, Message, MessageRole,
            AddOptions, ListOptions
        )

        memory = InMemoryMemory()
        await memory.add(
            IMemoryEvent(
                message=Message(
                    id='1',
                    role=MessageRole.USER,
                    content='Hello',
                    timestamp=datetime.now()
                ),
                state={'user_id': 'user123'}
            ),
            AddOptions(session_id='session-123')
        )
        events = await memory.list(ListOptions(limit=10, session_id='session-123'))
        ```
    """

    DEFAULT_SESSION_ID = "default"

    def __init__(self):
        """Create a new InMemoryMemory instance"""
        super().__init__()
        self._events_map: Dict[str, List[IMemoryEvent]] = {}

    def _get_session_events(self, session_id: str) -> List[IMemoryEvent]:
        """Get events array for a specific session, creating if it doesn't exist

        Args:
            session_id: The session identifier

        Returns:
            List of events for the session
        """
        if session_id not in self._events_map:
            self._events_map[session_id] = []
        return self._events_map[session_id]

    async def list(self, options: Optional[ListOptions] = None) -> List[IMemoryEvent]:
        """Returns a list of events with filtering, pagination and token limits

        Args:
            options: Optional filtering, pagination, and session options

        Returns:
            Array of filtered memory events
        """
        sid = (options.session_id if options and options.session_id else None) or self.DEFAULT_SESSION_ID
        events = self._get_session_events(sid).copy()

        # Apply sorting
        if options and options.order == "desc":
            events.reverse()

        # Apply pagination
        start_index = options.offset if options and options.offset else 0
        end_index = len(events)

        if options and options.limit:
            end_index = min(start_index + options.limit, len(events))

        events = events[start_index:end_index]

        # TODO: Implement token limit functionality
        # if options and options.max_tokens:
        #     events = self._trim_by_tokens(events, options.max_tokens)

        # Return deep copy to prevent external modifications
        result = [self._deep_copy(event) for event in events]
        return result if options and options.order != "desc" else result

    async def add(self, event: IMemoryEvent, options: Optional[AddOptions] = None) -> None:
        """Add a single event to memory storage

        Args:
            event: The memory event to store
            options: Optional session options
        """
        sid = (options.session_id if options and options.session_id else None) or self.DEFAULT_SESSION_ID
        self._get_session_events(sid).append(self._deep_copy(event))

    async def add_list(self, events: List[IMemoryEvent], options: Optional[AddOptions] = None) -> None:
        """Add multiple events efficiently, better performance than sequential addition

        Args:
            events: Array of memory events to store
            options: Optional session options
        """
        sid = (options.session_id if options and options.session_id else None) or self.DEFAULT_SESSION_ID
        self._get_session_events(sid).extend([self._deep_copy(event) for event in events])

    async def delete(self, id_or_index: str | int, options: Optional[DeleteOptions] = None) -> None:
        """Delete a specific event by ID or index

        Args:
            id_or_index: Message ID (string) or array index (integer) of the event to delete
            options: Optional session options
        """
        sid = (options.session_id if options and options.session_id else None) or self.DEFAULT_SESSION_ID
        events = self._get_session_events(sid)

        if isinstance(id_or_index, int):
            # Delete by index
            if 0 <= id_or_index < len(events):
                events.pop(id_or_index)
        else:
            # Delete by message ID
            for i, event in enumerate(events):
                if event.message.id == id_or_index:
                    events.pop(i)
                    break

    async def retrieve(self, query: str, options: Optional[RetrieveOptions] = None) -> List[IMemoryEvent]:
        """Retrieve events based on content similarity search

        Args:
            query: Search query text for matching message content
            options: Optional session options

        Returns:
            Array of matching events sorted by relevance
        """
        sid = (options.session_id if options and options.session_id else None) or self.DEFAULT_SESSION_ID
        events = self._get_session_events(sid)

        query_lower = query.lower()
        matched_events = []

        for event in events:
            content = event.message.content.lower()
            if query_lower in content:
                matched_events.append(event)

        # Sort by relevance using similarity score
        scored_events = [
            {"event": self._deep_copy(event), "score": self._calculate_similarity_score(event.message.content, query)}
            for event in matched_events
        ]
        scored_events.sort(key=lambda x: x["score"], reverse=True)

        return [item["event"] for item in scored_events]

    async def clear(self, options: Optional[ClearOptions] = None) -> None:
        """Clear all events from memory storage

        Args:
            options: Optional session options. If sessionId provided, clears only that session. If not provided, clears all sessions
        """
        session_id = options.session_id if options and options.session_id else None
        if session_id is None:
            # Clear all sessions
            self._events_map = {}
        else:
            # Clear specific session
            if session_id in self._events_map:
                self._events_map[session_id] = []

    async def get_count(self, options: Optional[Dict[str, str]] = None) -> int:
        """Get the current number of events stored in memory

        Args:
            options: Optional dictionary with session_id key for multi-session support

        Returns:
            Number of stored events
        """
        session_id = options.get("session_id") if options else None
        sid = session_id or self.DEFAULT_SESSION_ID
        return len(self._get_session_events(sid))

    async def is_empty(self, options: Optional[Dict[str, str]] = None) -> bool:
        """Check if memory storage is empty

        Args:
            options: Optional dictionary with session_id key for multi-session support

        Returns:
            True if no events are stored
        """
        session_id = options.get("session_id") if options else None
        sid = session_id or self.DEFAULT_SESSION_ID
        return len(self._get_session_events(sid)) == 0

    def get_session_ids(self) -> List[str]:
        """Get all session IDs currently stored in memory

        Returns:
            List of session identifiers
        """
        return list(self._events_map.keys())

    def has_session(self, session_id: str) -> bool:
        """Check if a specific session exists

        Args:
            session_id: The session identifier to check

        Returns:
            True if the session exists
        """
        return session_id in self._events_map

    def _calculate_similarity_score(self, content: str, query: str) -> float:
        """Calculate similarity score between content and query using multiple factors

        Args:
            content: Content to score
            query: Search query

        Returns:
            Similarity score from 0-100
        """
        content_lower = content.lower()
        query_lower = query.lower()

        # Exact match gets highest score
        if content_lower == query_lower:
            return 100.0

        # Contains query gets high score based on position and length ratio
        if query_lower in content_lower:
            position = content_lower.index(query_lower)
            length_ratio = len(query_lower) / len(content_lower)
            return 80.0 - (position / len(content_lower)) * 20.0 + length_ratio * 20.0

        # Word overlap scoring
        content_words = set(content_lower.split())
        query_words = set(query_lower.split())
        common_words = query_words.intersection(content_words)

        if common_words:
            return (len(common_words) / len(query_words)) * 50.0

        return 0.0

    def _deep_copy(self, event: IMemoryEvent) -> IMemoryEvent:
        """Create a deep copy of event to prevent external modifications

        Args:
            event: Event to copy

        Returns:
            Deep copy of the event
        """
        # Use dataclass features for deep copy
        return deepcopy(event)
