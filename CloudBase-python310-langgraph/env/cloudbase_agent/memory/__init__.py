"""Short-term memory module

Provides base interfaces and implementations for short-term memory management.
"""

from .in_memory_memory import InMemoryMemory
from .memory_base import (
    AddOptions,
    BaseMemory,
    BranchInfo,
    ClearOptions,
    CompactionMetadata,
    ContextThresholds,
    DeleteOptions,
    IMemoryEvent,
    ListOptions,
    Message,
    MessageRole,
    RetrieveOptions,
    StructuredSummary,
)
from .tdai_memory import TDAIMemory

# SQLAlchemy-based memory (optional - requires SQLAlchemy)
try:
    from .sqlalchemy import MySQLMemory, SQLAlchemyMemory
    
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False

# MongoDB-based memory (optional - requires Motor)
try:
    from .mongodb import MongoDBMemory
    
    HAS_MONGODB = True
except ImportError:
    HAS_MONGODB = False

# Build __all__ dynamically based on available dependencies
__all__ = [
    "AddOptions",
    "BaseMemory",
    "BranchInfo",
    "ClearOptions",
    "CompactionMetadata",
    "ContextThresholds",
    "DeleteOptions",
    "IMemoryEvent",
    "InMemoryMemory",
    "ListOptions",
    "Message",
    "MessageRole",
    "RetrieveOptions",
    "StructuredSummary",
    "TDAIMemory",
]

if HAS_SQLALCHEMY:
    __all__.extend(["MySQLMemory", "SQLAlchemyMemory"])

if HAS_MONGODB:
    __all__.append("MongoDBMemory")
