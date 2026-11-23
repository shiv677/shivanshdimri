"""Test suite for Autonomous Software Engineering Agent."""

import os
import tempfile
import pytest

try:
    from .models import (
        CodeSymbol,
        ExecutionRecord,
        PatchAction,
        PatchPlan,
        RepoASTIndex,
        SymbolType,
        TestResult,
    )
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
except (ImportError, ValueError):
    from models import (
        CodeSymbol,
        ExecutionRecord,
        PatchAction,
        PatchPlan,
        RepoASTIndex,
        SymbolType,
        TestResult,
    )
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


def test_models_validation():
    """Verify Pydantic v2 schemas and validation."""
    sym = CodeSymbol(
        name="calculate_metric",
        symbol_type=SymbolType.FUNCTION,
        file_path="src/metrics.py",
        start_line=10,
        end_line=25,
        docstring="Calculates metric.",
        args=["x", "y"],
    )
    assert sym.name == "calculate_metric"
    assert sym.symbol_type == SymbolType.FUNCTION
    assert sym.args == ["x", "y"]

    plan = PatchPlan(
        issue_id="ISSUE-101",
        issue_description="ZeroDivisionError in calculate_metric",
        target_files=["src/metrics.py"],
        planned_actions=[
            PatchAction(
                file_path="src/metrics.py",
                target_symbol="calculate_metric",
                replacement_code="def calculate_metric(x, y): return x / y if y != 0 else 0.0",
                rationale="Guard against division by zero",
            )
        ],
    )
    assert len(plan.planned_actions) == 1
    assert plan.planned_actions[0].target_symbol == "calculate_metric"
    assert plan.confidence_score == 1.0


def test_ast_repository_parser():
    """Verify AST indexer parses functions, classes, and class methods accurately."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        sample_file = os.path.join(tmp_dir, "sample.py")
        with open(sample_file, "w", encoding="utf-8") as f:
            f.write('''"""Module docstring."""

def standalone_func(val: int) -> int:
    """Standalone helper."""
    return val * 2

class PipelineProcessor:
    """Processor class."""

    def process(self, item):
        """Process item."""
        return item
''')

        index = parse_repository_ast(tmp_dir)
        assert index.files_indexed == 1
        assert index.total_symbols >= 3

        symbol_names = {s.name for s in index.symbols}
        assert "standalone_func" in symbol_names
        assert "PipelineProcessor" in symbol_names
        assert "PipelineProcessor.process" in symbol_names

        # Verify source extraction
        src_func = extract_symbol_source(sample_file, "standalone_func")
        assert src_func is not None
        assert "def standalone_func" in src_func

        src_method = extract_symbol_source(sample_file, "PipelineProcessor.process")
        assert src_method is not None
        assert "def process" in src_method


def test_issue_patch_planner():
    """Verify issue-to-patch planner with natural text and stack trace diagnostics."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        sample_file = os.path.join(tmp_dir, "service.py")
        with open(sample_file, "w", encoding="utf-8") as f:
            f.write('''def execute_job(job_id, timeout):
    return job_id
''')
        index = parse_repository_ast(tmp_dir)

        # Plan from natural language description
        issue_desc = "Unhandled exception encountered in execute_job when timeout is None"
        plan = plan_issue_patch(issue_desc, index)
        assert len(plan.planned_actions) == 1
        assert plan.planned_actions[0].target_symbol == "execute_job"
        assert plan.target_files == [sample_file]

        # Plan from traceback line
        traceback_desc = f'Traceback: File "{sample_file}", line 2, in execute_job\nZeroDivisionError'
        plan_tb = plan_issue_patch(traceback_desc, index)
        assert len(plan_tb.planned_actions) == 1
        assert plan_tb.planned_actions[0].target_symbol == "execute_job"


def test_ast_code_patcher_function_and_method():
    """Verify AST node replacement for top-level functions and class methods."""
    original_code = '''def greet(name):
    return f"Hello, {name}"

class Greeter:
    def format_title(self, title):
        return title.lower()
'''

    new_greet = '''def greet(name):
    return f"Greetings, {name.strip()}!"
'''
    patched = patch_ast_symbol(original_code, "greet", new_greet)
    assert "Greetings," in patched
    assert "format_title" in patched

    new_method = '''def format_title(self, title):
    return title.strip().title()
'''
    patched_method = patch_ast_symbol(patched, "Greeter.format_title", new_method)
    assert "title.strip().title()" in patched_method


def test_ast_patcher_edge_cases():
    """Verify edge cases: missing symbol, empty replacement, and syntax error."""
    source = "def foo(): pass"

    with pytest.raises(ValueError, match="cannot be empty"):
        patch_ast_symbol(source, "foo", "")

    with pytest.raises(ValueError, match="not found in source AST"):
        patch_ast_symbol(source, "non_existent_func", "def bar(): pass")

    with pytest.raises(SyntaxError):
        patch_ast_symbol(source, "foo", "def broken_code(:")


def test_ci_failure_diagnostician():
    """Verify parsing and diagnosis of CI error logs and exceptions."""
    raw_stdout = """
==================================== FAILURES ====================================
________________________________ test_zero_div _________________________________
calc.py:14: in compute
    return a / b
E   ZeroDivisionError: division by zero
"""
    cat, diag_file, diag_line, err_msg = diagnose_test_failure(raw_stdout, "", 1)
    assert cat == "ZeroDivisionError"
    assert err_msg == "division by zero"
    assert diag_line == 14
    assert "calc.py" in (diag_file or "")

    raw_stderr = """
Traceback (most recent call last):
  File "engine.py", line 42, in process
TypeError: unsupported operand type(s)
"""
    cat2, diag_file2, diag_line2, err_msg2 = diagnose_test_failure("", raw_stderr, 1)
    assert cat2 == "TypeError"
    assert diag_line2 == 42
    assert "engine.py" in (diag_file2 or "")


def test_patch_rollback_on_test_failure():
    """Verify automated rollback when applied patch fails test suite."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        code_file = os.path.join(tmp_dir, "math_mod.py")
        test_file = os.path.join(tmp_dir, "test_math_mod.py")

        original_source = "def divide(a, b):\n    return a / b\n"
        with open(code_file, "w", encoding="utf-8") as f:
            f.write(original_source)

        with open(test_file, "w", encoding="utf-8") as f:
            f.write("""import pytest
from math_mod import divide

def test_divide():
    assert divide(10, 2) == 5
""")

        # Introduce a broken patch that fails existing test
        bad_patch = "def divide(a, b):\n    raise RuntimeError('broken')\n"
        record = verify_and_resolve_patch(
            file_path=code_file,
            target_symbol="divide",
            new_code=bad_patch,
            test_target=test_file,
            cwd=tmp_dir,
        )

        assert record.verified is False
        assert record.rolled_back is True
        assert record.test_result.passed is False

        # File must be restored to pristine original content
        with open(code_file, "r", encoding="utf-8") as f:
            restored_content = f.read()
        assert restored_content.strip() == original_source.strip()


def test_patch_success_and_verification():
    """Verify successful patch application, test passage, and retention."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        code_file = os.path.join(tmp_dir, "ops.py")
        test_file = os.path.join(tmp_dir, "test_ops.py")

        # Code fails zero division test
        with open(code_file, "w", encoding="utf-8") as f:
            f.write("def safe_div(a, b):\n    return a / b\n")

        with open(test_file, "w", encoding="utf-8") as f:
            f.write("""import pytest
from ops import safe_div

def test_safe_div():
    assert safe_div(10, 2) == 5.0
    assert safe_div(5, 0) == 0.0
""")

        # Valid fix
        fix_code = "def safe_div(a, b):\n    if b == 0:\n        return 0.0\n    return a / b\n"
        record = verify_and_resolve_patch(
            file_path=code_file,
            target_symbol="safe_div",
            new_code=fix_code,
            test_target=test_file,
            cwd=tmp_dir,
        )

        assert record.verified is True
        assert record.rolled_back is False
        assert record.test_result.passed is True

        with open(code_file, "r", encoding="utf-8") as f:
            verified_content = f.read()
        assert "if b == 0:" in verified_content
