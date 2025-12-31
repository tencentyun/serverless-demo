"""TDAI Memory-based short-term memory implementation

Short-term memory implementation using TDAI Memory SDK as backend storage.
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from .memory_base import BaseMemory, IMemoryEvent, ListOptions, Message, MessageRole


class TDAIMemory(BaseMemory):
    """TDAI Memory SDK-based short-term memory implementation

    Uses TDAI Memory service as backend storage, providing persistent short-term memory management.

    Example:
        ```python
        from cloudbase_agent.storage.memory import TDAIMemory, IMemoryEvent, Message, MessageRole

        # Method 1: Initialize with explicit parameters
        memory = TDAIMemory(
            endpoint="https://memory.tdai.tencentyun.com",
            api_key="your-api-key",
            memory_id="your-memory-id",
            actor_id="user123"
        )

        # Method 2: Initialize with environment variables
        # export TDAI_ENDPOINT=https://memory.tdai.tencentyun.com
        # export TDAI_API_KEY=your-api-key
        # export TDAI_MEMORY_ID=your-memory-id
        memory = TDAIMemory(actor_id="user123")

        # Create session
        session_id = await memory.create_session(name="conversation-1")

        # Add event
        await memory.add(IMemoryEvent(
            message=Message(
                id='1',
                role=MessageRole.USER,
                content='Hello',
                timestamp=datetime.now()
            ),
            state={'session_id': session_id}
        ))

        # List events
        events = await memory.list(ListOptions(limit=10))
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
    ):
        """Initialize TDAI Memory instance

        Args:
            endpoint: TDAI Memory service endpoint (defaults to TDAI_ENDPOINT env var)
            api_key: API key (defaults to TDAI_API_KEY env var)
            memory_id: Memory ID (defaults to TDAI_MEMORY_ID env var)
            actor_id: Actor ID
            session_id: Session ID (optional, will be auto-created if not provided)
            timeout: Request timeout in seconds
        """
        super().__init__()

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
                "tdaimemory is required for TDAIMemory. Please ensure tdaimemory module is available in storage folder."
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
            result = self.client.create_session(memory_id=self.memory_id, actor_id=self.actor_id)
            self._session_id = result.get("session_id")
        return self._session_id

    async def list(self, options: Optional[ListOptions] = None) -> List[IMemoryEvent]:
        """Returns a list of events stored in the memory

        Args:
            options: Optional filtering and pagination options

        Returns:
            Array of memory events
        """
        session_id = await self._ensure_session()

        # Build query parameters
        query_params: Dict[str, Any] = {
            "memory_id": self.memory_id,
            "actor_id": self.actor_id,
            "session_id": session_id,
        }

        if options:
            if options.limit:
                query_params["limit"] = options.limit
            if options.offset:
                query_params["offset"] = options.offset
            if options.order:
                # TDAI Memory uses order_by dictionary
                query_params["order_by"] = {"created_at": -1 if options.order == "desc" else 1}

        # Query events
        result = self.client.query_events(**query_params)
        events_data = result.get("events", [])

        # Convert to IMemoryEvent format
        events = []
        for event_data in events_data:
            # Extract metadata
            metadata = event_data.get("metadata", {})

            # Get message ID from metadata or generate one
            message_id = metadata.get("messageId", event_data.get("event_id", ""))

            # Get timestamp from metadata or created_at
            timestamp_str = metadata.get("timestamp")
            if timestamp_str:
                timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            elif event_data.get("created_at"):
                # created_at might be a Unix timestamp
                created_at = event_data.get("created_at")
                if isinstance(created_at, (int, float)):
                    timestamp = datetime.fromtimestamp(created_at)
                else:
                    timestamp = datetime.fromisoformat(str(created_at))
            else:
                timestamp = None

            # Create message
            message = Message(
                id=message_id,
                role=MessageRole(event_data.get("role", "user")),
                content=event_data.get("content", ""),
                timestamp=timestamp,
            )

            # Extract state from metadata (excluding message-specific fields)
            state = {
                k: v for k, v in metadata.items() if k not in ["messageId", "timestamp", "toolCalls", "toolCallId"]
            }
            state["session_id"] = session_id
            state["event_id"] = event_data.get("event_id")

            events.append(IMemoryEvent(message=message, state=state))

        return events

    async def add(self, event: IMemoryEvent) -> None:
        """Add a single memory event to storage

        Args:
            event: The memory event to store
        """
        session_id = event.state.get("session_id") or await self._ensure_session()

        # Convert message format with metadata
        metadata = {
            **event.state,
            "messageId": event.message.id,
        }

        # Add timestamp if available
        if event.message.timestamp:
            metadata["timestamp"] = event.message.timestamp.isoformat()

        # Add tool calls if available
        if hasattr(event.message, "tool_calls") and event.message.tool_calls:
            metadata["toolCalls"] = event.message.tool_calls

        if hasattr(event.message, "tool_call_id") and event.message.tool_call_id:
            metadata["toolCallId"] = event.message.tool_call_id

        messages = {"role": event.message.role.value, "content": event.message.content, "metadata": metadata}

        # Add event
        self.client.append_event(
            memory_id=self.memory_id, actor_id=self.actor_id, session_id=session_id, messages=messages
        )

    async def add_list(self, events: List[IMemoryEvent]) -> None:
        """Add multiple memory events efficiently

        Args:
            events: Array of memory events to store
        """
        # TDAI Memory currently doesn't support batch addition, use loop
        for event in events:
            await self.add(event)

    async def delete(self, event_id: str) -> None:
        """Delete memory event from storage

        Args:
            event_id: Event ID to delete
        """
        session_id = await self._ensure_session()

        self.client.delete_event(
            memory_id=self.memory_id, actor_id=self.actor_id, session_id=session_id, event_id=event_id
        )

    async def retrieve(self, query: str) -> List[IMemoryEvent]:
        """Retrieve memory events based on search criteria

        Args:
            query: Search query text

        Returns:
            Array of matching memory events
        """
        # TDAI Memory doesn't directly support event search, use list then filter
        all_events = await self.list()

        # Simple content matching
        query_lower = query.lower()
        matched_events = [event for event in all_events if query_lower in event.message.content.lower()]

        return matched_events

    async def clear(self) -> None:
        """Remove all events from storage

        Note: This will delete the entire session
        """
        if self._session_id:
            self.client.delete_session(memory_id=self.memory_id, actor_id=self.actor_id, session_id=self._session_id)
            self._session_id = None

    async def create_session(self, name: Optional[str] = None) -> str:
        """Create a new session

        Args:
            name: Session name

        Returns:
            Session ID
        """
        result = self.client.create_session(memory_id=self.memory_id, actor_id=self.actor_id, name=name)
        session_id = result.get("session_id")
        self._session_id = session_id
        return session_id

    def close(self):
        """Close client connection"""
        self.client.close()
