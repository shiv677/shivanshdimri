"""Autonomous Multi-Agent Research & Reasoning System."""

try:
    from .models import (
        TaskNode,
        DAGPlan,
        ToolCall,
        ToolResult,
        MemoryItem,
        Conflict,
        VerificationResult,
        ResearchReport,
    )
    from .engine import (
        ToolSandbox,
        PersistentMemory,
        ConflictReferee,
        ResearchEngine,
        topological_sort_dag,
    )
except ImportError:
    from models import (
        TaskNode,
        DAGPlan,
        ToolCall,
        ToolResult,
        MemoryItem,
        Conflict,
        VerificationResult,
        ResearchReport,
    )
    from engine import (
        ToolSandbox,
        PersistentMemory,
        ConflictReferee,
        ResearchEngine,
        topological_sort_dag,
    )

__all__ = [
    "TaskNode",
    "DAGPlan",
    "ToolCall",
    "ToolResult",
    "MemoryItem",
    "Conflict",
    "VerificationResult",
    "ResearchReport",
    "ToolSandbox",
    "PersistentMemory",
    "ConflictReferee",
    "ResearchEngine",
    "topological_sort_dag",
]
