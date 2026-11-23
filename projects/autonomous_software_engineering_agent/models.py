"""Domain models for Autonomous Software Engineering Agent."""

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class SymbolType(str, Enum):
    FUNCTION = "function"
    CLASS = "class"
    METHOD = "method"


class CodeSymbol(BaseModel):
    name: str
    symbol_type: SymbolType
    file_path: str
    start_line: int
    end_line: int
    docstring: Optional[str] = None
    args: List[str] = Field(default_factory=list)


class RepoASTIndex(BaseModel):
    repo_path: str
    files_indexed: int
    total_symbols: int
    symbols: List[CodeSymbol] = Field(default_factory=list)
    symbol_map: Dict[str, List[CodeSymbol]] = Field(default_factory=dict)


class PatchAction(BaseModel):
    file_path: str
    target_symbol: str
    replacement_code: str
    rationale: str
    original_code: Optional[str] = None


class PatchPlan(BaseModel):
    issue_id: str
    issue_description: str
    target_files: List[str] = Field(default_factory=list)
    planned_actions: List[PatchAction] = Field(default_factory=list)
    confidence_score: float = 1.0


class TestResult(BaseModel):
    __test__ = False
    passed: bool
    exit_code: int
    stdout: str = ""
    stderr: str = ""
    failure_category: Optional[str] = None
    diagnosed_file: Optional[str] = None
    diagnosed_line: Optional[int] = None
    error_message: Optional[str] = None


class ExecutionRecord(BaseModel):
    plan_id: str
    patches_applied: List[str] = Field(default_factory=list)
    test_result: TestResult
    verified: bool
    rolled_back: bool
    duration_ms: float = 0.0
