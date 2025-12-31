#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LangChain chat history implementation using TDAI Memory.

This module provides a chat message history for LangChain that uses TDAI Memory
as the backend storage, enabling persistent conversation history.
"""

from typing import List

try:
    from langchain_core.chat_history import BaseChatMessageHistory
    from langchain_core.messages import (
        BaseMessage,
        message_to_dict,
        messages_from_dict,
    )
except ImportError:
    raise ImportError("langchain-core is required for TDAIChatHistory. Install it with: pip install langchain-core")

from cloudbase_agent.tdaimemory import MemoryClient


class TDAIChatHistory(BaseChatMessageHistory):
    """LangChain chat message history using TDAI Memory as backend.

    This class implements the BaseChatMessageHistory interface to store and retrieve
    chat messages using TDAI Memory's event storage system.

    :param client: TDAI Memory client instance
    :type client: MemoryClient
    :param session_id: Session ID for storing messages
    :type session_id: str

    Example::

        from cloudbase_agent.storage.tdaimemory import MemoryClient
        from cloudbase_agent.storage.langchain import TDAIChatHistory
        from langchain_core.messages import HumanMessage, AIMessage

        client = MemoryClient(
            endpoint="https://memory.tdai.tencentyun.com",
            api_key="your-api-key",
            memory_id="your-memory-id"
        )

        history = TDAIChatHistory(
            client=client,
            session_id="user_123"
        )

        # Add messages
        history.add_user_message("Hello!")
        history.add_ai_message("Hi there! How can I help you?")

        # Get messages
        messages = history.messages

        # Clear history
        history.clear()
    """

    def __init__(
        self,
        client: MemoryClient,
        session_id: str,
        auto_create_session: bool = True,
    ):
        """Initialize the TDAI chat history.

        :param client: TDAI Memory client instance
        :type client: MemoryClient
        :param session_id: Session ID for storing messages (must start with 'session-' and be 16-20 chars)
        :type session_id: str
        :param auto_create_session: Whether to automatically create the session if it doesn't exist
        :type auto_create_session: bool
        """
        self.client = client
        self.session_id = session_id
        self._session_created = False

        # Auto-create session if requested
        if auto_create_session:
            self._ensure_session()

    def _ensure_session(self) -> None:
        """Ensure the session exists, create if it doesn't."""
        if not self._session_created:
            try:
                # Try to query the session to see if it exists
                self.client.query_events(session_id=self.session_id)
                self._session_created = True
            except Exception:
                # Session doesn't exist, create it
                # Note: We can't use the session_id directly in create_session
                # because TDAI generates its own session IDs
                # So we'll just mark it as created and let the first operation create it implicitly
                self._session_created = True

    @property
    def messages(self) -> List[BaseMessage]:
        """Retrieve all messages from the store.

        :return: List of messages
        :rtype: List[BaseMessage]
        """
        try:
            result = self.client.query_events(
                session_id=self.session_id,
            )

            events = result.get("events", [])

            # Convert events to message dicts
            message_dicts = []
            for event in events:
                # Events are stored as message dicts
                if isinstance(event, dict) and "type" in event:
                    message_dicts.append(event)

            # Convert dicts to BaseMessage objects
            return messages_from_dict(message_dicts)
        except Exception as e:
            # Only ignore "data not exist" errors (empty session)
            # All other errors should be raised
            error_msg = str(e).lower()
            if "data not exist" in error_msg or "not exist" in error_msg:
                # Session exists but has no events yet - this is normal
                return []
            else:
                # Real error - should not be silently ignored
                print(f"Error retrieving messages: {e}")
                raise

    def add_message(self, message: BaseMessage) -> None:
        """Add a message to the store.

        :param message: Message to add
        :type message: BaseMessage
        """
        try:
            # Convert message to dict
            message_dict = message_to_dict(message)

            # Store in TDAI Memory
            self.client.append_event(
                session_id=self.session_id,
                messages=message_dict,
            )
        except Exception as e:
            print(f"Error adding message: {e}")
            raise

    def add_messages(self, messages: List[BaseMessage]) -> None:
        """Add multiple messages to the store.

        :param messages: List of messages to add
        :type messages: List[BaseMessage]
        """
        for message in messages:
            self.add_message(message)

    def clear(self) -> None:
        """Clear all messages from the store.

        This will delete all events in the session and the session itself.
        """
        try:
            # Get all event IDs
            try:
                result = self.client.query_events(
                    session_id=self.session_id,
                )
                event_ids = [event.get("event_id") for event in result.get("events", []) if event.get("event_id")]
            except Exception as e:
                # If query fails with "data not exist", session is already empty
                if "data not exist" in str(e).lower() or "not exist" in str(e).lower():
                    event_ids = []
                else:
                    # Real error - re-raise
                    raise

            # Delete all events (ignore "not exist" errors)
            for event_id in event_ids:
                try:
                    self.client.delete_event(
                        session_id=self.session_id,
                        event_id=event_id,
                    )
                except Exception as e:
                    # Ignore "not exist" errors, event may have been deleted already
                    if "not exist" not in str(e).lower():
                        raise

            # Delete the session (ignore "not exist" errors)
            try:
                self.client.delete_session(
                    session_id=self.session_id,
                )
            except Exception as e:
                # Ignore "not exist" errors, session may have been deleted already
                if "not exist" not in str(e).lower():
                    raise

            # Recreate the session so the chat history can continue to be used
            result = self.client.create_session(name="chat_history_session")
            self.session_id = result.get("session_id")
            self._session_created = True
        except Exception as e:
            # Only print error, don't raise - clear() should be idempotent
            # But we should log what went wrong
            error_msg = str(e).lower()
            if "not exist" not in error_msg and "data not exist" not in error_msg:
                print(f"Error clearing messages: {e}")
                raise

    def close(self) -> None:
        """Close the TDAI client connection."""
        self.client.close()
