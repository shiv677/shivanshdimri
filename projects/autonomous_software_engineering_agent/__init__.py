"""Autonomous Software Engineering Agent package."""

try:
    from .engine import (
        apply_patch_to_file,
        diagnose_test_failure,
        extract_symbol_source,
        parse_repository_ast,
        patch_ast_symbol,
        plan_issue_patch,
        rollback_file,
        run_automated_tests,
        verify_and_resolve_patch,
    )
    from .models import (
        CodeSymbol,
        ExecutionRecord,
        PatchAction,
        PatchPlan,
        RepoASTIndex,
        SymbolType,
        TestResult,
    )
except (ImportError, ValueError):
    from engine import (
        apply_patch_to_file,
        diagnose_test_failure,
        extract_symbol_source,
        parse_repository_ast,
        patch_ast_symbol,
        plan_issue_patch,
        rollback_file,
        run_automated_tests,
        verify_and_resolve_patch,
    )
    from models import (
        CodeSymbol,
        ExecutionRecord,
        PatchAction,
        PatchPlan,
        RepoASTIndex,
        SymbolType,
        TestResult,
    )

__all__ = [
    "CodeSymbol",
    "SymbolType",
    "RepoASTIndex",
    "PatchAction",
    "PatchPlan",
    "TestResult",
    "ExecutionRecord",
    "parse_repository_ast",
    "extract_symbol_source",
    "plan_issue_patch",
    "patch_ast_symbol",
    "apply_patch_to_file",
    "rollback_file",
    "diagnose_test_failure",
    "run_automated_tests",
    "verify_and_resolve_patch",
]
