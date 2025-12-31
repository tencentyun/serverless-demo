import logging
from typing import Any, Dict, List, Optional

from .errors import ParamError
from .stub import HttpStub, Stub

logger = logging.getLogger(__name__)


class MemoryClient:
    """High-level Agent Memory client with essential operations."""

    def __init__(
        self,
        endpoint: str,
        api_key: str,
        memory_id: str,
        default_actor_id: Optional[str] = None,
        timeout: int = 10,
        stub: Optional[Stub] = None,
    ):
        """Initialize the Memory client."""
        self.default_memory_id = memory_id
        self.default_actor_id = default_actor_id
        self.stub = stub or HttpStub(endpoint, api_key, memory_id, timeout)

    def close(self):
        """Close the client connection."""
        self.stub.close()

    def _get_memory_id(self, memory_id: Optional[str] = None) -> str:
        if memory_id:
            return memory_id
        return self.default_memory_id

    def _get_actor_id(self, actor_id: Optional[str] = None) -> str:
        if actor_id:
            return actor_id
        if self.default_actor_id:
            return self.default_actor_id
        raise ParamError("actor_id is required")

    def create_session(
        self,
        name: Optional[str] = None,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new session.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            name (str): The name of the session.

        Returns:
            Dict[str, Any]: The response data from the server.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
        }
        if name is not None:
            request_body["name"] = name
        return self.stub.post("/memory/v1/session/create", request_body)

    def query_sessions(
        self,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        order_by: Optional[Dict[str, int]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Query sessions based on conditions.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            order_by (Dict[str, int]): Sorting criteria, e.g., {"created_at": -1} for descending order.
            limit (int): Maximum number of items to return.
            offset (int): Number of items to skip.

        Returns:
            Dict[str, Any]: Response data containing queried sessions and total count.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
        }
        if order_by is not None:
            request_body["order_by"] = order_by
        if limit is not None:
            request_body["limit"] = limit
        if offset is not None:
            request_body["offset"] = offset
        return self.stub.post("/memory/v1/session/query", request_body)

    def update_session(
        self,
        session_id: str,
        name: str,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update an existing session.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session to update.
            name (str): The new name for the session.

        Returns:
            Dict[str, Any]: The response data from the server.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
            "name": name,
        }
        return self.stub.post("/memory/v1/session/update", request_body)

    def delete_session(
        self,
        session_id: str,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Delete an existing session.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session to delete.

        Returns:
            Dict[str, Any]: The response data from the server.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
        }
        return self.stub.post("/memory/v1/session/delete", request_body)

    def search_sessions(
        self,
        content: str,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        order_by: Optional[Dict[str, int]] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Search sessions based on conditions and keywords.

        Args:
            content (str): Search keyword to match against session names/tags.
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            order_by (Dict[str, int]): Sorting criteria, e.g., {"created_at": -1} for descending order.
            limit (int): Maximum number of items to return.

        Returns:
            Dict[str, Any]: Response data containing matched sessions and total count.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "content": content,
        }
        if order_by is not None:
            request_body["order_by"] = order_by
        if limit is not None:
            request_body["limit"] = limit
        return self.stub.post("/memory/v1/session/search", request_body)

    def append_event(
        self,
        session_id: str,
        messages: dict,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Append events to a session.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.
            messages (List[Dict[str, str]]): List of message objects with role and content.

        Returns:
            Dict[str, Any]: Response data containing event_id and creation timestamp.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
            "messages": messages,
        }
        return self.stub.post("/memory/v1/event/append", request_body)

    def query_events(
        self,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        session_id: Optional[str] = None,
        where: Optional[Dict[str, Any]] = None,
        order_by: Optional[Dict[str, int]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Query events based on conditions.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.
            where (Dict[str, Any]): Filter conditions.
            order_by (Dict[str, int]): Sorting criteria, e.g., {"created_at": -1} for descending order.
            limit (int): Maximum number of items to return.
            offset (int): Number of items to skip.

        Returns:
            Dict[str, Any]: Response data containing queried events and total count.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
        }
        if session_id is not None:
            request_body["session_id"] = session_id
        if where is not None:
            request_body["where"] = where
        if order_by is not None:
            request_body["order_by"] = order_by
        if limit is not None:
            request_body["limit"] = limit
        if offset is not None:
            request_body["offset"] = offset
        return self.stub.post("/memory/v1/event/query", request_body)

    def delete_event(
        self,
        session_id: str,
        event_id: str,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Delete an event from a session.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.
            event_id (str): The ID of the event to delete.

        Returns:
            Dict[str, Any]: Response data containing deleted_event_id and deletion timestamp.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
            "event_id": event_id,
        }
        return self.stub.post("/memory/v1/event/delete", request_body)

    def set_state(
        self,
        session_id: str,
        state: Dict[str, Any],
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Set state for a session.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.
            state (Dict[str, Any]): The state data to set.

        Returns:
            Dict[str, Any]: The response data from the server.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
            "state": state,
        }
        return self.stub.post("/memory/v1/state/set", request_body)

    def get_states(
        self,
        session_id: str,
        keys: Optional[List[str]],
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get state for a session.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.
            keys (Optional[List[str]]): Optional list of state keys to retrieve. If None, returns full state.

        Returns:
            Dict[str, Any]: The response data from the server containing the session state.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
            "keys": keys,
        }
        return self.stub.post("/memory/v1/state/get", request_body)

    def get_all_states(
        self,
        session_id: str,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get all states for an actor in a memory.

        Args:
            session_id (str): The ID of the session.
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.

        Returns:
            Dict[str, Any]: The response data from the server containing all session states.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
        }
        return self.stub.post("/memory/v1/state/get_all", request_body)

    def delete_states(
        self,
        session_id: str,
        keys: Optional[List[str]],
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Delete specified state keys for a session.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.
            keys (List[str]): List of state keys to delete.

        Returns:
            Dict[str, Any]: The response data from the server.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
            "keys": keys,
        }
        return self.stub.post("/memory/v1/state/delete", request_body)

    def flush_states(
        self,
        session_id: str,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Flush all states for a session.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.

        Returns:
            Dict[str, Any]: The response data from the server.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
        }
        return self.stub.post("/memory/v1/state/flush", request_body)

    def append_record(
        self,
        session_id: str,
        content: str,
        strategy: str,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Append records to a session.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.
            content (str): The content of the record.
            strategy (str): The strategy name for the record.

        Returns:
            Dict[str, Any]: The response data from the server.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
            "content": content,
            "strategy": strategy,
        }
        return self.stub.post("/memory/v1/record/append", request_body)

    def query_records(
        self,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        session_id: Optional[str] = None,
        strategies: Optional[List[str]] = None,
        where: Optional[Dict[str, Any]] = None,
        order_by: Optional[Dict[str, int]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Query records based on conditions.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.
            strategies (Optional[List[str]]): The strategy names for the record.
            where (Dict[str, Any]): Filter conditions.
            order_by (Optional[Dict[str, int]]): Sorting criteria, e.g., {"created_at": -1} for descending order.
            limit (int): Maximum number of items to return (default: 10).
            offset (int): Number of items to skip (default: 0).

        Returns:
            Dict[str, Any]: Response data containing queried records and total count.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
        }
        if session_id is not None:
            request_body["session_id"] = session_id
        if strategies is not None:
            request_body["strategies"] = strategies
        if where is not None:
            request_body["where"] = where
        if order_by is not None:
            request_body["order_by"] = order_by
        if limit is not None:
            request_body["limit"] = limit
        if offset is not None:
            request_body["offset"] = offset
        return self.stub.post("/memory/v1/record/query", request_body)

    def update_record(
        self,
        session_id: str,
        record_id: str,
        content: str,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update an existing record.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.
            record_id (str): The ID of the record to update.
            content (str): The new content for the record.

        Returns:
            Dict[str, Any]: The response data from the server.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
            "record_id": record_id,
            "content": content,
        }
        return self.stub.post("/memory/v1/record/update", request_body)

    def delete_record(
        self, session_id: str, record_id: str, memory_id: Optional[str] = None, actor_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Delete an existing record.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.
            record_id (str): The ID of the record to delete.

        Returns:
            Dict[str, Any]: The response data from the server.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "session_id": session_id,
            "record_id": record_id,
        }
        return self.stub.post("/memory/v1/record/delete", request_body)

    def search_records(
        self,
        content: str,
        memory_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        session_id: Optional[str] = None,
        strategies: Optional[List[str]] = None,
        where: Optional[Dict[str, Any]] = None,
        order_by: Optional[Dict[str, int]] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Search records based on conditions and keywords.

        Args:
            memory_id (str): The ID of the memory.
            actor_id (str): The ID of the actor.
            session_id (str): The ID of the session.
            strategies (Optional[List[str]]): The strategy names for the record.
            where (Dict[str, Any]): Filter conditions.
            content (str): Search keyword to match against record content.
            order_by (Optional[Dict[str, int]]): Sorting criteria, e.g., {"created_at": -1} for descending order.
            limit (int): Maximum number of items to return (default: 10).

        Returns:
            Dict[str, Any]: Response data containing matched records and total count.
        """
        request_body = {
            "memory_id": self._get_memory_id(memory_id),
            "actor_id": self._get_actor_id(actor_id),
            "content": content,
        }
        if session_id is not None:
            request_body["session_id"] = session_id
        if strategies is not None:
            request_body["strategies"] = strategies
        if where is not None:
            request_body["where"] = where
        if order_by is not None:
            request_body["order_by"] = order_by
        if limit is not None:
            request_body["limit"] = limit
        return self.stub.post("/memory/v1/record/search", request_body)
