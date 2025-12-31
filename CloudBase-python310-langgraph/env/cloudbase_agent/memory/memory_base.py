"""Base interfaces and abstract class for short-term memory management

This module provides the core interface for short-term memory systems,
used for storing, retrieving, and managing conversation events with advanced
context engineering capabilities.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Literal, Optional, Union


class MessageRole(str, Enum):
    """Message role enumeration

    Defines the possible roles for messages in a conversation.
    """
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


@dataclass
class Message:
    """Message interface representing a conversation message

    Attributes:
        id: Unique identifier for the message
        role: Role of the message sender
        content: Content of the message
        timestamp: Optional timestamp when the message was created
        tool_calls: Optional tool calls associated with the message
        tool_call_id: Optional tool call identifier
    """
    id: str
    role: Literal["user", "assistant", "system", "tool"]
    content: str
    timestamp: Optional[datetime] = None
    tool_calls: Optional[List[Any]] = None
    tool_call_id: Optional[str] = None


@dataclass
class IMemoryEvent:
    """Memory event interface combining message and state information

    Attributes:
        message: Message content
        state: Additional state information
    """

    message: Message
    state: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ListOptions:
    """Options for listing and querying memory events

    Attributes:
        max_tokens: Maximum number of tokens to include in results
        limit: Maximum number of events to return
        offset: Number of events to skip (for pagination)
        order: Sort order by timestamp
        session_id: Session identifier for multi-session support
    """

    max_tokens: Optional[int] = None
    limit: Optional[int] = None
    offset: Optional[int] = None
    order: Literal["asc", "desc"] = "asc"
    session_id: Optional[str] = None


@dataclass
class AddOptions:
    """Options for adding memory events

    Attributes:
        session_id: Session identifier for multi-session support
    """

    session_id: Optional[str] = None


@dataclass
class DeleteOptions:
    """Options for deleting memory events

    Attributes:
        session_id: Session identifier for multi-session support
    """

    session_id: Optional[str] = None


@dataclass
class RetrieveOptions:
    """Options for retrieving memory events

    Attributes:
        session_id: Session identifier for multi-session support
    """

    session_id: Optional[str] = None


@dataclass
class ClearOptions:
    """Options for clearing memory events

    Attributes:
        session_id: Session identifier for multi-session support. If not provided, clears all sessions
    """

    session_id: Optional[str] = None


@dataclass
class BranchInfo:
    """Branch information for session management
    
    Attributes:
        name: Branch name
        created_at: When the branch was created
        from_event_id: Event ID this branch was created from (optional)
        is_active: Whether this is the currently active branch
    """
    
    name: str
    created_at: datetime
    from_event_id: Optional[str] = None
    is_active: bool = False


@dataclass
class CompactionMetadata:
    """Compaction metadata stored in event.state.__compaction__
    
    Attributes:
        original_content: Original full message content before compaction
        original_tokens: Original token count
        compacted_tokens: Compacted token count
    """
    
    original_content: str
    original_tokens: int
    compacted_tokens: int


@dataclass
class StructuredSummary:
    """Structured summary schema (not free-form text)
    
    Attributes:
        content: Summary content
        count: Number of events summarized
        time_range: Time range of summarized events
        timestamp: When the summary was created
    """
    
    content: str
    count: int
    time_range: Dict[str, Optional[datetime]]
    timestamp: datetime


@dataclass
class ContextThresholds:
    """Context thresholds configuration
    
    Attributes:
        pre_rot_threshold: Pre-rot threshold - where performance starts degrading
        compaction_trigger: Trigger compaction at this percentage of pre-rot threshold (e.g., 0.8 = 80%)
        summarization_trigger: Trigger summarization at this percentage of pre-rot threshold (e.g., 0.95 = 95%)
        recent_to_keep: Number of recent events to keep
    """
    
    pre_rot_threshold: int = 150000
    compaction_trigger: float = 0.8
    summarization_trigger: float = 0.95
    recent_to_keep: int = 5


class BaseMemory(ABC):
    """Abstract base class for short-term memory implementations

    Provides the core interface for storing, retrieving, and managing
    conversation events in short-term memory systems with built-in
    context engineering capabilities.
    """

    def __init__(
        self,
        thresholds: Optional[ContextThresholds] = None,
        summarizer: Optional[Callable[[List[IMemoryEvent]], StructuredSummary]] = None,
    ):
        """Initialize base memory instance
        
        Args:
            thresholds: Context engineering thresholds
            summarizer: Custom summarizer function
        """
        self.thresholds = thresholds
        self._summarizer = summarizer
        
        # Metrics
        self.compaction_count = 0
        self.summarization_count = 0
        self.last_compaction_gain = 0

    @abstractmethod
    async def list(self, options: Optional[ListOptions] = None) -> List[IMemoryEvent]:
        """Returns a list of events stored in the memory

        Args:
            options: Optional filtering and pagination options

        Returns:
            Array of memory events
        """
        pass

    @abstractmethod
    async def add(self, event: IMemoryEvent, options: Optional[AddOptions] = None) -> None:
        """Add a single memory event to storage

        Args:
            event: Memory event to store
            options: Optional session options
        """
        pass

    async def add_list(self, events: List[IMemoryEvent], options: Optional[AddOptions] = None) -> None:
        """Efficiently add multiple memory events

        Implementations should override this method to handle batch additions efficiently,
        avoiding unnecessary round trips to the underlying storage.

        Args:
            events: Array of memory events to store
            options: Optional session options
        """
        for event in events:
            await self.add(event, options)

    @abstractmethod
    async def delete(self, id_or_index: Union[str, int], options: Optional[DeleteOptions] = None) -> None:
        """Delete a memory event from storage

        Args:
            id_or_index: Message ID (string) or array index (number)
            options: Optional session options
        """
        pass

    @abstractmethod
    async def retrieve(self, query: str, options: Optional[RetrieveOptions] = None) -> List[IMemoryEvent]:
        """Retrieve memory events based on search criteria

        Args:
            query: Search query text to match against message content
            options: Optional session options

        Returns:
            Array of matching memory events
        """
        pass

    async def clear(self, options: Optional[ClearOptions] = None) -> None:
        """Delete all events from storage

        Args:
            options: Optional session options. If sessionId is provided, only clears that session. If not provided, clears all sessions

        Raises:
            NotImplementedError: If not implemented by subclass
        """
        raise NotImplementedError("Clear method not implemented.")
    
    async def update(
        self,
        event_id: str,
        event: IMemoryEvent,
        options: Optional[AddOptions] = None,
    ) -> None:
        """Update a memory event
        
        Args:
            event_id: Event ID to update
            event: Updated event data
            options: Optional session options
            
        Raises:
            NotImplementedError: If not implemented by subclass
        """
        raise NotImplementedError("Update method not implemented.")
    
    # ==================== Session Branching (Optional) ====================
    
    async def branch(self, branch_name: str, from_event_id: Optional[str] = None) -> str:
        """Create a new branch from current session state
        
        Args:
            branch_name: Name for the new branch
            from_event_id: Optional event ID to branch from
            
        Returns:
            Branch ID
            
        Raises:
            NotImplementedError: If not implemented by subclass
        """
        raise NotImplementedError("Branch method not implemented.")
    
    async def checkout(
        self,
        target: str,
        type: Optional[Literal["branch", "event"]] = None,
        session_id: Optional[str] = None,
    ) -> None:
        """Switch to a different branch or checkout to a specific event
        
        Args:
            target: Branch name or event ID to checkout
            type: Type of checkout: 'branch' or 'event' (default: auto-detect)
            session_id: Session ID when checking out to an event
            
        Raises:
            NotImplementedError: If not implemented by subclass
            
        Example:
            # Checkout to a branch
            await memory.checkout('experiment-1')
            
            # Checkout to a specific event (deletes all events after it)
            await memory.checkout('event-123', type='event', session_id='session-1')
        """
        raise NotImplementedError("Checkout method not implemented.")
    
    async def list_branches(self) -> List[BranchInfo]:
        """List all available branches
        
        Returns:
            Array of branch information
            
        Raises:
            NotImplementedError: If not implemented by subclass
        """
        raise NotImplementedError("ListBranches method not implemented.")
    
    async def delete_branch(self, branch_name: str) -> None:
        """Delete a branch
        
        Args:
            branch_name: Name of the branch to delete
            
        Raises:
            NotImplementedError: If not implemented by subclass or trying to delete active branch
        """
        raise NotImplementedError("DeleteBranch method not implemented.")
    
    async def cleanup_branches(self, keep_branches: Optional[List[str]] = None) -> None:
        """Clean up all inactive branches, keeping only the main branch
        
        This is useful for maintaining a single trunk after experimentation.
        
        Args:
            keep_branches: Optional list of branch names to keep (in addition to active branch)
            
        Raises:
            NotImplementedError: If not implemented by subclass
        """
        raise NotImplementedError("CleanupBranches method not implemented.")
    
    # ==================== Context Engineering (Optional) ====================
    
    def is_compacted(self, event: IMemoryEvent) -> bool:
        """Check if an event is compacted
        
        Args:
            event: Event to check
            
        Returns:
            True if event has compaction metadata
        """
        return "__compaction__" in event.state
    
    def decompress_event(self, event: IMemoryEvent) -> IMemoryEvent:
        """Decompress a compacted event
        
        Args:
            event: Event to decompress
            
        Returns:
            Decompressed event with original content and state
        """
        if not self.is_compacted(event):
            return event
        
        compaction_data = event.state.pop("__compaction__", None)
        if not compaction_data:
            return event
        
        # Restore original content
        event.message.content = compaction_data.get("original_content", event.message.content)
        
        return event
    
    def decompress_events(self, events: List[IMemoryEvent]) -> List[IMemoryEvent]:
        """Decompress multiple events
        
        Args:
            events: Events to decompress
            
        Returns:
            Array of decompressed events
        """
        return [self.decompress_event(event) for event in events]
    
    # ==================== Context Engineering Core Methods ====================
    
    async def manage_context(
        self,
        session_id: str,
        events: List[IMemoryEvent],
    ) -> Dict[str, Any]:
        """Manage context automatically when adding events
        
        Subclasses should call this method after adding events if context management is enabled.
        
        Args:
            session_id: Session identifier
            events: Current events in the session
            
        Returns:
            Dictionary containing processed events and metadata
        """
        if not self.thresholds:
            return {"events": events}
        
        current_tokens = await self.get_current_token_count(events)
        
        compaction_threshold = (
            self.thresholds.pre_rot_threshold * self.thresholds.compaction_trigger
        )
        summarization_threshold = (
            self.thresholds.pre_rot_threshold * self.thresholds.summarization_trigger
        )
        
        if (
            self.thresholds.recent_to_keep
            and len(events) > self.thresholds.recent_to_keep
        ):
            if current_tokens >= summarization_threshold:
                result = await self.perform_summarization(session_id, events)
                return {"events": result["events"]}
            
            # Step 1: Check if compaction is needed
            if current_tokens >= compaction_threshold:
                compaction_result = await self.perform_compaction(session_id, events)
                
                if compaction_result["gain"] > self.thresholds.pre_rot_threshold * 0.05:
                    return {"events": compaction_result["events"]}
                
                summarization_result = await self.perform_summarization(session_id, events)
                return {"events": summarization_result["events"]}
        
        return {"events": events}
    
    async def perform_compaction(
        self,
        session_id: Optional[str],
        events: List[IMemoryEvent],
    ) -> Dict[str, Any]:
        """Perform compaction (reversible externalization to event.state)
        
        Subclasses should override this method to implement compaction logic.
        
        Args:
            session_id: Optional session identifier
            events: Events to compact
            
        Returns:
            Dictionary with compacted events and token gain
        """
        tokens_before = await self.get_current_token_count(events)
        
        # Calculate how many events to compact
        total_events = len(events)
        recent_to_keep = self.thresholds.recent_to_keep if self.thresholds else 5
        delta = total_events - recent_to_keep
        
        if delta <= 0:
            return {"events": events, "gain": 0}
        
        # Compact oldest events
        processed_events = []
        for i, event in enumerate(events):
            if i < delta:
                if not self.is_compacted(event):
                    processed_events.append(
                        await self.compact_event(session_id, event)
                    )
                else:
                    processed_events.append(event)
            else:
                processed_events.append(event)
        
        tokens_after = await self.get_current_token_count(processed_events)
        gain = tokens_before - tokens_after
        
        self.compaction_count += 1
        self.last_compaction_gain = gain
        
        return {"events": processed_events, "gain": gain}
    
    async def compact_event(
        self,
        session_id: Optional[str],
        event: IMemoryEvent,
    ) -> IMemoryEvent:
        """Compact a single event - store full content in state
        
        Args:
            session_id: Optional session identifier
            event: Event to compact
            
        Returns:
            Compacted event
        """
        # Calculate original tokens (simplified - actual implementation should use tokenizer)
        original_tokens = len(event.message.content.split())
        
        # Store original content and state in event.state.__compaction__
        compaction_metadata = {
            "original_content": event.message.content,
            "original_tokens": original_tokens,
            "compacted_tokens": 0,
        }
        
        # Replace content with compact reference
        compact_content = f"[Compacted: {event.message.role.value} message, {original_tokens} tokens]"
        event.message.content = compact_content
        
        # Store metadata in state
        event.state["__compaction__"] = compaction_metadata
        
        # Calculate compacted tokens
        compaction_metadata["compacted_tokens"] = len(compact_content.split())
        
        await self.update(event.message.id, event, AddOptions(session_id=session_id))
        return event
    
    async def perform_summarization(
        self,
        session_id: Optional[str],
        events: List[IMemoryEvent],
    ) -> Dict[str, Any]:
        """Perform summarization (irreversible refinement)
        
        Args:
            session_id: Optional session identifier
            events: Events to summarize
            
        Returns:
            Dictionary with remaining events and optional summary
        """
        recent_to_keep = self.thresholds.recent_to_keep if self.thresholds else 5
        
        if len(events) <= recent_to_keep:
            return {"events": events}
        
        # Events to summarize (excluding recent ones)
        events_to_summarize = events[:-recent_to_keep]
        
        # Decompress events before summarization for better quality
        decompressed_events = self.decompress_events(events_to_summarize)
        
        # Create structured summary
        summary = await self.summarizer(decompressed_events)
        
        # Store summary (subclasses should implement this)
        await self.store_summary(session_id, summary)
        
        # Remove summarized events, keep recent ones
        await self.clear_summarized_events(session_id, recent_to_keep)
        
        self.summarization_count += 1
        
        return {"events": events[-recent_to_keep:], "summary": summary}
    
    async def store_summary(
        self,
        session_id: Optional[str],
        summary: StructuredSummary,
    ) -> None:
        """Store summary (to be implemented by subclasses)
        
        Args:
            session_id: Optional session identifier
            summary: The structured summary to store
        """
        # Default implementation does nothing - subclasses should override
        pass
    
    async def clear_summarized_events(
        self,
        session_id: Optional[str],
        recent_to_keep: int,
    ) -> None:
        """Clear summarized events (to be implemented by subclasses)
        
        Args:
            session_id: Optional session identifier
            recent_to_keep: Number of recent events to keep
        """
        # Default implementation does nothing - subclasses should override
        pass
    
    async def get_current_token_count(self, events: List[IMemoryEvent]) -> int:
        """Get current token count for a session
        
        Args:
            events: Events to count tokens for
            
        Returns:
            Total token count
        """
        # Simplified implementation - actual implementation should use tokenizer
        total = 0
        for event in events:
            if self.is_compacted(event):
                compaction_data = event.state.get("__compaction__", {})
                total += compaction_data.get("compacted_tokens", 0)
            else:
                total += len(event.message.content.split())
        return total
    
    async def summarizer(self, events: List[IMemoryEvent]) -> StructuredSummary:
        """Create default structured summary
        
        Args:
            events: Events to summarize
            
        Returns:
            Structured summary
        """
        if self._summarizer:
            return self._summarizer(events)
        
        return StructuredSummary(
            content="",
            count=len(events),
            time_range={
                "start": events[0].message.timestamp if events else None,
                "end": events[-1].message.timestamp if events else None,
            },
            timestamp=datetime.utcnow(),
        )
