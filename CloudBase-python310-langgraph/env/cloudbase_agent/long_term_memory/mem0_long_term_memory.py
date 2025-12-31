"""Mem0 cloud service long-term memory implementation

Long-term memory implementation using Mem0 Platform API (v2).
Provides intelligent memory management with managed LLM and embedding services.
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional, Union

from ..memory.memory_base import Message
from .long_term_memory_base import BaseLongTermMemory, MemoryEntity, MemoryQuery


class Mem0LongTermMemory(BaseLongTermMemory):
    """Mem0 Platform API (v2) long-term memory implementation

    Uses Mem0 cloud service with managed LLM and embedding models.
    Features include:
    - Automatic memory extraction from conversations
    - Semantic search with advanced filtering
    - Memory associations and graph relationships
    - Automatic deduplication and consolidation
    - Memory history tracking
    - Feedback mechanism

    Example:
        ```python
        from cloudbase_agent.storage.long_term_memory import Mem0LongTermMemory, MemoryEntity

        # Initialize with API key
        memory = Mem0LongTermMemory(
            api_key="m0-xxx",
            user_id="user123"
        )

        # Or use environment variables
        # export MEM0_API_KEY=m0-xxx
        # export MEM0_USER_ID=user123
        memory = Mem0LongTermMemory()

        # Record memory
        await memory.record(MemoryEntity(
            id="mem_1",
            strategy="preferences",
            content="User prefers dark mode",
            metadata={"category": "ui_preference"}
        ))

        # Semantic search with filters
        results = await memory.semantic_search(
            "What are user's UI preferences?",
            filters={"category": "ui_preference"}
        )
        ```
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        app_id: Optional[str] = None,
    ):
        """Initialize Mem0 cloud service instance

        Args:
            api_key: Mem0 API key (defaults to MEM0_API_KEY env var)
                    Get from: https://app.mem0.ai/
            user_id: Default user ID for memory isolation (defaults to MEM0_USER_ID)
            agent_id: Default agent ID for memory isolation (defaults to MEM0_AGENT_ID)
            app_id: Default app ID for memory isolation (defaults to MEM0_APP_ID)
        """
        super().__init__(None)

        api_key = api_key or os.getenv("MEM0_API_KEY")
        user_id = user_id or os.getenv("MEM0_USER_ID")
        agent_id = agent_id or os.getenv("MEM0_AGENT_ID")
        app_id = app_id or os.getenv("MEM0_APP_ID")

        if not api_key:
            raise ValueError("api_key is required. Set MEM0_API_KEY environment variable or pass as parameter.")

        try:
            from mem0 import MemoryClient
        except ImportError:
            raise ImportError("mem0ai is required. Install with: pip install mem0ai")

        self.client = MemoryClient(api_key=api_key)

        self.default_options = {
            "user_id": user_id,
            "agent_id": agent_id,
            "app_id": app_id,
        }

    async def record(self, memory: MemoryEntity) -> None:
        """Record a new memory entity

        Args:
            memory: The memory entity to store
        """
        try:
            # Convert memory content to messages format as required by mem0 v2 API
            # mem0 requires a list of message objects with 'role' and 'content' fields
            role = memory.metadata.get("role", "user")  # Default to 'user' if not specified
            messages = [{"role": role, "content": memory.content}]

            options = {"metadata": {"strategy": memory.strategy, "id": memory.id, **memory.metadata}, "version": "v2"}

            if self.default_options.get("user_id"):
                options["user_id"] = self.default_options["user_id"]
            if self.default_options.get("agent_id"):
                options["agent_id"] = self.default_options["agent_id"]

            # Add memory using proper messages format
            result = self.client.add(messages, **options)

            # Handle different response formats from Mem0 API
            memory_id = None
            event_id = None
            status = None
            message = None

            if result:
                if isinstance(result, dict):
                    # Check for 'results' field (async API v2 format)
                    if "results" in result:
                        results_list = result.get("results", [])
                        if results_list and len(results_list) > 0:
                            first_result = results_list[0]
                            memory_id = first_result.get("id")
                            event_id = first_result.get("event_id")
                            status = first_result.get("status")
                            message = first_result.get("message")
                    # Check for direct 'id' field
                    elif "id" in result:
                        memory_id = result.get("id")
                    # Check for 'memory' field with nested structure
                    elif "memory" in result:
                        memory_data = result.get("memory")
                        if isinstance(memory_data, dict):
                            memory_id = memory_data.get("id")
                elif isinstance(result, list) and len(result) > 0:
                    # Handle list response (direct memory objects)
                    first_item = result[0]
                    if isinstance(first_item, dict):
                        memory_id = first_item.get("id")
                    else:
                        memory_id = str(first_item)

            # Print appropriate message based on status
            if status == "PENDING":
                if message:
                    print(f"{message} Event ID: {event_id}")
                else:
                    print(f"Memory queued for processing. Event ID: {event_id}")
            else:
                print(f"Memory recorded. ID: {memory_id}")

        except Exception as error:
            print(f"Error recording memory: {error}")
            raise

    async def record_batch(self, memories: List[MemoryEntity]) -> None:
        """Record multiple memory entities in batch

        Args:
            memories: Array of memory entities to store
        """
        try:
            for memory in memories:
                await self.record(memory)
            print(f"Batch recorded {len(memories)} memories")

        except Exception as error:
            print(f"Error recording batch: {error}")
            raise

    async def retrieve(self, query: MemoryQuery) -> List[MemoryEntity]:
        """Retrieve memories based on query conditions

        Uses mem0's search API when query.query is provided,
        otherwise uses get_all API for filtered retrieval.

        Args:
            query: Query conditions for filtering and searching

        Returns:
            Array of matching memory entities
        """
        try:
            options = {"limit": query.limit or 10, "version": "v2"}

            if query.offset and query.limit:
                options["page"] = (query.offset // query.limit) + 1
                options["page_size"] = query.limit

            # Allowed top-level filter fields in Mem0 V2 API
            allowed_fields = {
                "user_id",
                "agent_id",
                "app_id",
                "run_id",
                "created_at",
                "updated_at",
                "timestamp",
                "categories",
                "metadata",
                "keywords",
                "feedback",
                "feedback_reason",
                "memory_ids",
                "AND",
                "OR",
                "NOT",
            }

            filters = {}
            metadata_filters = []

            # ALWAYS add default user_id or agent_id to ensure we only get this user's memories
            if self.default_options.get("user_id"):
                filters["user_id"] = self.default_options["user_id"]
            elif self.default_options.get("agent_id"):
                filters["agent_id"] = self.default_options["agent_id"]

            # Process extra_filters
            if query.extra_filters:
                for key, value in query.extra_filters.items():
                    if key in allowed_fields:
                        # Override or add to filters
                        filters[key] = value
                    else:
                        # Custom fields go into metadata filter as separate conditions
                        metadata_filters.append({key: value})

            # Add strategy if provided (goes into metadata)
            if query.strategy:
                metadata_filters.append({"strategy": query.strategy})

            # Add metadata filters if any
            if metadata_filters:
                if len(metadata_filters) == 1:
                    # Single metadata filter - use it directly
                    filters["metadata"] = metadata_filters[0]
                else:
                    # Multiple metadata filters - combine with AND
                    filters["metadata"] = {"AND": metadata_filters}

            if filters:
                options["filters"] = filters

            if query.query:
                memories = self.client.search(query.query, **options)
            else:
                memories = self.client.get_all(**options)

            # Handle dict response (v2 API might return {'results': [...]})
            if isinstance(memories, dict):
                if "results" in memories:
                    memories = memories["results"]
                elif "memories" in memories:
                    memories = memories["memories"]

            # Ensure memories is a list
            if not isinstance(memories, list):
                memories = [memories] if memories else []

            return self._convert_to_memory_entities(memories)

        except Exception as error:
            print(f"Error retrieving memories: {error}")
            raise

    async def delete(self, memory_id: Union[str, MemoryQuery]) -> None:
        """Delete memory by ID or query conditions

        Directly maps to mem0's delete API when a memory ID string is provided.
        Supports batch deletion when a MemoryQuery is provided.

        Args:
            memory_id: Memory ID string or MemoryQuery for batch deletion

        Example:
            ```python
            # Delete single memory by ID
            await memory.delete("mem_123")

            # Batch delete by query conditions
            await memory.delete(MemoryQuery(strategy="preferences"))
            ```
        """
        try:
            if isinstance(memory_id, str):
                # Use named parameter as per mem0 official API
                self.client.delete(memory_id=memory_id)
                print(f"Memory {memory_id} deleted")
            else:
                # Batch delete: retrieve memories first, then delete each
                memories = await self.retrieve(memory_id)
                for memory in memories:
                    self.client.delete(memory_id=memory.id)
                print(f"Deleted {len(memories)} memories")

        except Exception as error:
            print(f"Error deleting memory: {error}")
            raise

    async def update(
        self, memory_id: str, text: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Update an existing memory entity

        Directly maps to mem0's update API.

        Args:
            memory_id: ID of the memory to update
            text: Updated text content of the memory
            metadata: Updated metadata for the memory

        Example:
            ```python
            await memory.update(
                memory_id="mem_123",
                text="User prefers light mode now",
                metadata={"category": "ui_preference", "updated": True}
            )
            ```
        """
        try:
            # Prepare kwargs for client.update() call
            update_kwargs = {}

            if text is not None:
                update_kwargs["text"] = text

            if metadata is not None:
                update_kwargs["metadata"] = metadata

            # Call the client.update with proper parameters
            self.client.update(memory_id=memory_id, **update_kwargs)
            print(f"Memory {memory_id} updated")

        except Exception as error:
            print(f"Error updating memory: {error}")
            raise

    async def clear(
        self,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        app_id: Optional[str] = None,
        run_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Clear all memories with optional filters

        Directly maps to mem0's delete_all API.
        Uses default user_id/agent_id from initialization if not provided.

        Args:
            user_id: Filter by user ID
            agent_id: Filter by agent ID
            app_id: Filter by app ID
            run_id: Filter by run ID
            metadata: Filter by metadata (JSON object)

        Example:
            ```python
            # Clear all memories for default user
            await memory.clear()

            # Clear memories for specific user
            await memory.clear(user_id="user123")

            # Clear memories with metadata filter
            await memory.clear(metadata={"category": "temporary"})
            ```
        """
        try:
            options = {}

            # Use provided parameters or fall back to defaults
            if user_id:
                options["user_id"] = user_id
            elif self.default_options.get("user_id"):
                options["user_id"] = self.default_options["user_id"]

            if agent_id:
                options["agent_id"] = agent_id
            elif self.default_options.get("agent_id"):
                options["agent_id"] = self.default_options["agent_id"]

            if app_id:
                options["app_id"] = app_id
            elif self.default_options.get("app_id"):
                options["app_id"] = self.default_options["app_id"]

            if run_id:
                options["run_id"] = run_id

            if metadata:
                options["metadata"] = metadata

            self.client.delete_all(**options)

            # Build descriptive message
            filters_desc = []
            if options.get("user_id"):
                filters_desc.append(f"user_id={options['user_id']}")
            if options.get("agent_id"):
                filters_desc.append(f"agent_id={options['agent_id']}")
            if options.get("app_id"):
                filters_desc.append(f"app_id={options['app_id']}")
            if options.get("run_id"):
                filters_desc.append(f"run_id={options['run_id']}")
            if options.get("metadata"):
                filters_desc.append(f"metadata={options['metadata']}")

            if filters_desc:
                print(f"Cleared memories with filters: {', '.join(filters_desc)}")
            else:
                print("Cleared all memories")

        except Exception as error:
            print(f"Error clearing memories: {error}")
            raise

    async def extract_and_record(self, messages: List[Message], context: Dict[str, Any]) -> List[MemoryEntity]:
        """Extract and record memories from conversation messages

        Args:
            messages: Array of conversation messages
            context: Additional context information

        Returns:
            Array of extracted memory entities
        """
        try:
            mem0_messages = []
            for msg in messages:
                content = msg.content if isinstance(msg.content, str) else str(msg.content)
                mem0_messages.append(
                    {"role": msg.role.value if hasattr(msg.role, "value") else msg.role, "content": content}
                )

            options = {"metadata": context.get("metadata", {})}

            user_id = context.get("user_id") or self.default_options.get("user_id")
            agent_id = context.get("agent_id") or self.default_options.get("agent_id")
            run_id = context.get("run_id")

            if user_id:
                options["user_id"] = user_id
            if agent_id:
                options["agent_id"] = agent_id
            if run_id:
                options["run_id"] = run_id

            extracted_memories = self.client.add(mem0_messages, **options)

            # Handle dict response (v2 API might return {'results': [...]})
            if isinstance(extracted_memories, dict):
                if "results" in extracted_memories:
                    extracted_memories = extracted_memories["results"]
                elif "memories" in extracted_memories:
                    extracted_memories = extracted_memories["memories"]

            # Ensure it's a list
            if not isinstance(extracted_memories, list):
                extracted_memories = [extracted_memories] if extracted_memories else []

            memory_entities = [self._convert_mem0_to_memory_entity(memory) for memory in extracted_memories]

            return memory_entities

        except Exception as error:
            print(f"Error extracting memories: {error}")
            raise

    async def semantic_search(
        self, query: str, options: Optional[MemoryQuery] = None, filters: Optional[Dict[str, Any]] = None
    ) -> List[MemoryEntity]:
        """Perform semantic search on stored memories

        Uses mem0's search API with semantic similarity.

        Args:
            query: Search query text
            options: Optional search parameters
            filters: Advanced filters (supports OR, AND, in, etc.)

        Returns:
            Array of semantically similar memories

        Example:
            results = await memory.semantic_search(
                "What do you know about me?",
                filters={"OR": [{"user_id": "alex"}, {"agent_id": {"in": ["bot1", "bot2"]}}]}
            )
        """
        try:
            search_options = {"limit": options.limit if options else 10, "version": "v2"}

            if filters:
                # Process filters to handle custom fields
                allowed_fields = {
                    "user_id",
                    "agent_id",
                    "app_id",
                    "run_id",
                    "created_at",
                    "updated_at",
                    "timestamp",
                    "text",
                    "categories",
                    "metadata",
                    "keywords",
                    "keywords_search",
                    "feedback",
                    "feedback_reason",
                    "memory_ids",
                    "AND",
                    "OR",
                    "NOT",
                }

                processed_filters = {}
                metadata_filters = []

                for key, value in filters.items():
                    if key in allowed_fields:
                        processed_filters[key] = value
                    else:
                        # Custom fields go into metadata filter
                        metadata_filters.append({key: value})

                # Add metadata filters if any
                if metadata_filters:
                    if len(metadata_filters) == 1:
                        processed_filters["metadata"] = metadata_filters[0]
                    else:
                        processed_filters["metadata"] = {"AND": metadata_filters}

                search_options["filters"] = processed_filters
            elif options and (options.extra_filters or options.strategy):
                # Use the same filter processing logic as retrieve
                allowed_fields = {
                    "user_id",
                    "agent_id",
                    "app_id",
                    "run_id",
                    "created_at",
                    "updated_at",
                    "timestamp",
                    "text",
                    "categories",
                    "metadata",
                    "keywords",
                    "keywords_search",
                    "feedback",
                    "feedback_reason",
                    "memory_ids",
                    "AND",
                    "OR",
                    "NOT",
                }

                processed_filters = {}
                metadata_filters = []

                # Process extra_filters
                if options.extra_filters:
                    for key, value in options.extra_filters.items():
                        if key in allowed_fields:
                            processed_filters[key] = value
                        else:
                            # Custom fields go into metadata filter
                            metadata_filters.append({key: value})

                # Add strategy if provided
                if options.strategy:
                    metadata_filters.append({"strategy": options.strategy})

                # Add metadata filters if any
                if metadata_filters:
                    if len(metadata_filters) == 1:
                        processed_filters["metadata"] = metadata_filters[0]
                    else:
                        processed_filters["metadata"] = {"AND": metadata_filters}

                if processed_filters:
                    search_options["filters"] = processed_filters
            else:
                default_filters = {}
                if self.default_options.get("user_id"):
                    default_filters["user_id"] = self.default_options["user_id"]
                if self.default_options.get("agent_id"):
                    default_filters["agent_id"] = self.default_options["agent_id"]
                if default_filters:
                    search_options["filters"] = default_filters

            memories = self.client.search(query, **search_options)

            # Handle dict response (v2 API might return {'results': [...]})
            if isinstance(memories, dict):
                if "results" in memories:
                    memories = memories["results"]
                elif "memories" in memories:
                    memories = memories["memories"]

            # Ensure memories is a list
            if not isinstance(memories, list):
                memories = [memories] if memories else []

            return self._convert_to_memory_entities(memories)

        except Exception as error:
            print(f"Error in semantic search: {error}")
            raise

    async def get_related_memories(self, memory_id: str, depth: int = 1) -> List[MemoryEntity]:
        """Get memories related to a specific memory entity

        Uses mem0's search API to find semantically related memories.

        Args:
            memory_id: ID of the memory
            depth: Number of related memories to retrieve (default 1)

        Returns:
            Array of related memory entities

        Example:
            ```python
            # Get related memories
            related = await memory.get_related_memories("mem_123", depth=5)
            ```
        """
        try:
            original_memory = self.client.get(memory_id)

            if not original_memory or not original_memory.get("memory"):
                return []

            search_options = {
                "limit": depth or 5,
                "version": "v2",  # Use v2 API
                "rerank": True,
                "threshold": 0.6,
            }

            # Add default user_id or agent_id filters
            filters = {}
            if self.default_options.get("user_id"):
                filters["user_id"] = self.default_options["user_id"]
            if self.default_options.get("agent_id"):
                filters["agent_id"] = self.default_options["agent_id"]

            if filters:
                search_options["filters"] = filters

            related_memories = self.client.search(original_memory["memory"], **search_options)

            # Handle dict response (v2 API might return {'results': [...]})
            if isinstance(related_memories, dict):
                if "results" in related_memories:
                    related_memories = related_memories["results"]
                elif "memories" in related_memories:
                    related_memories = related_memories["memories"]

            # Ensure it's a list
            if not isinstance(related_memories, list):
                related_memories = [related_memories] if related_memories else []

            # Filter out the original memory itself
            filtered_memories = [memory for memory in related_memories if memory.get("id") != memory_id]

            return self._convert_to_memory_entities(filtered_memories)

        except Exception as error:
            print(f"Error getting related memories: {error}")
            raise

    async def consolidate(self) -> None:
        """Consolidate and optimize stored memories"""
        try:
            options = {"limit": 1000}

            if self.default_options.get("user_id"):
                options["user_id"] = self.default_options["user_id"]
            if self.default_options.get("agent_id"):
                options["agent_id"] = self.default_options["agent_id"]

            all_memories = self.client.get_all(**options)

            print(f"Consolidation check completed for {len(all_memories)} memories")

        except Exception as error:
            print(f"Error in consolidation: {error}")
            raise

    async def get_memory_history(self, memory_id: str) -> List[Dict[str, Any]]:
        """Get memory history change records

        Retrieves the complete history of how a memory has changed over time,
        including ADD, UPDATE, and DELETE events.

        Directly maps to mem0's history API.

        Args:
            memory_id: Memory ID to retrieve history for

        Returns:
            Array of history records with details about each change:
            - id: History entry ID
            - memory_id: Associated memory ID
            - input: Conversation input that led to the change
            - old_memory: Previous state (if applicable)
            - new_memory: New/updated state
            - user_id: User associated with the change
            - event: Type of event (ADD, UPDATE, DELETE)
            - metadata: Additional metadata
            - created_at: Timestamp of creation
            - updated_at: Timestamp of last update

        Example:
            ```python
            # Get memory history
            history = await memory.get_memory_history("mem_123")

            for entry in history:
                print(f"Event: {entry['event']}")
                print(f"Old: {entry.get('old_memory')}")
                print(f"New: {entry['new_memory']}")
            ```
        """
        try:
            return self.client.history(memory_id)
        except Exception as error:
            print(f"Error getting memory history: {error}")
            raise

    async def get_users(self) -> List[Dict[str, Any]]:
        """Get all users/entities list

        Retrieves a list of all entities (users, agents, apps, runs) with their
        associated memory counts and metadata.

        Directly maps to mem0's users API.

        Returns:
            Array of entity objects, each containing:
            - id: Unique identifier for the entity
            - name: Name of the entity
            - created_at: When the entity was created
            - updated_at: When the entity was last updated
            - total_memories: Number of memories associated
            - owner: Owner of the entity
            - organization: Organization the entity belongs to
            - type: Entity type (user, agent, app, run)
            - metadata: Additional metadata

        Example:
            ```python
            # Get all users/entities
            users = await memory.get_users()

            for user in users:
                print(f"User: {user['name']}")
                print(f"Type: {user['type']}")
                print(f"Memories: {user['total_memories']}")
            ```
        """
        try:
            return self.client.users()
        except Exception as error:
            print(f"Error getting users: {error}")
            raise

    async def provide_feedback(
        self,
        memory_id: str,
        feedback: Literal["POSITIVE", "NEGATIVE", "VERY_NEGATIVE"],
        feedback_reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Provide feedback on a memory

        Submit feedback to help improve memory quality and relevance.

        Directly maps to mem0's feedback API.

        Args:
            memory_id: ID of the memory to provide feedback for
            feedback: Type of feedback (POSITIVE, NEGATIVE, VERY_NEGATIVE)
            feedback_reason: Optional reason for the feedback

        Returns:
            Feedback object containing:
            - id: Feedback ID
            - feedback: Type of feedback provided
            - feedback_reason: Reason for the feedback (if provided)

        Example:
            ```python
            # Provide positive feedback
            result = await memory.provide_feedback(
                memory_id="mem_123",
                feedback="POSITIVE"
            )

            # Provide negative feedback with reason
            result = await memory.provide_feedback(
                memory_id="mem_456",
                feedback="NEGATIVE",
                feedback_reason="Incorrect information"
            )
            ```
        """
        try:
            # Use named parameters as per mem0 official API
            result = self.client.feedback(memory_id=memory_id, feedback=feedback, feedback_reason=feedback_reason)
            print(f"Feedback provided for {memory_id}: {feedback}")
            return result
        except Exception as error:
            print(f"Error providing feedback: {error}")
            raise

    def _convert_to_memory_entities(self, mem0_memories: List[Any]) -> List[MemoryEntity]:
        """Convert Mem0 memory objects to MemoryEntity array"""
        if not mem0_memories or not isinstance(mem0_memories, list):
            return []

        return [self._convert_mem0_to_memory_entity(memory) for memory in mem0_memories]

    def _convert_mem0_to_memory_entity(self, memory: Any) -> MemoryEntity:
        """Convert single Mem0 memory object to MemoryEntity"""
        memory_dict = memory if isinstance(memory, dict) else {}

        content = memory_dict.get("memory") or memory_dict.get("data", {}).get("memory") or ""

        metadata = memory_dict.get("metadata", {})
        strategy = metadata.get("strategy", "general")

        full_metadata = {
            **metadata,
            "mem0_id": memory_dict.get("id"),
            "categories": memory_dict.get("categories"),
            "score": memory_dict.get("score"),
            "hash": memory_dict.get("hash"),
            "memory_type": memory_dict.get("memory_type"),
            "owner": memory_dict.get("owner"),
            "agent_id": memory_dict.get("agent_id"),
            "app_id": memory_dict.get("app_id"),
            "run_id": memory_dict.get("run_id"),
        }

        full_metadata = {k: v for k, v in full_metadata.items() if v is not None}

        created_at = memory_dict.get("created_at")
        updated_at = memory_dict.get("updated_at")

        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except:
                created_at = datetime.now()
        elif not isinstance(created_at, datetime):
            created_at = datetime.now()

        if isinstance(updated_at, str):
            try:
                updated_at = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
            except:
                updated_at = None
        elif not isinstance(updated_at, datetime):
            updated_at = None

        return MemoryEntity(
            id=memory_dict.get("id", ""),
            content=content,
            strategy=strategy,
            metadata=full_metadata,
            created_at=created_at,
            updated_at=updated_at,
        )
