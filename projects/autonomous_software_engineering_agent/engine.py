"""Engine implementation for Autonomous Software Engineering Agent."""

import ast
import os
import re
import subprocess
import sys
import time
from typing import Dict, List, Optional, Tuple

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
except ImportError:
    from models import (
        CodeSymbol,
        ExecutionRecord,
        PatchAction,
        PatchPlan,
        RepoASTIndex,
        SymbolType,
        TestResult,
    )


def parse_repository_ast(repo_path: str) -> RepoASTIndex:
    """Walk repository and index all Python code symbols using the AST."""
    symbols: List[CodeSymbol] = []
    symbol_map: Dict[str, List[CodeSymbol]] = {}
    files_indexed = 0

    skip_dirs = {".git", "__pycache__", ".pytest_cache", ".venv", "venv", "node_modules", ".gemini"}

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith(".")]
        for file in files:
            if not file.endswith(".py"):
                continue
            file_path = os.path.normpath(os.path.join(root, file))
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    source = f.read()
                tree = ast.parse(source, filename=file_path)
                files_indexed += 1
            except Exception:
                continue

            for node in tree.body:
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    sym = CodeSymbol(
                        name=node.name,
                        symbol_type=SymbolType.FUNCTION,
                        file_path=file_path,
                        start_line=node.lineno,
                        end_line=getattr(node, "end_lineno", node.lineno),
                        docstring=ast.get_docstring(node),
                        args=[arg.arg for arg in node.args.args],
                    )
                    symbols.append(sym)
                    symbol_map.setdefault(sym.name, []).append(sym)

                elif isinstance(node, ast.ClassDef):
                    class_sym = CodeSymbol(
                        name=node.name,
                        symbol_type=SymbolType.CLASS,
                        file_path=file_path,
                        start_line=node.lineno,
                        end_line=getattr(node, "end_lineno", node.lineno),
                        docstring=ast.get_docstring(node),
                        args=[],
                    )
                    symbols.append(class_sym)
                    symbol_map.setdefault(class_sym.name, []).append(class_sym)

                    for item in node.body:
                        if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                            method_name = f"{node.name}.{item.name}"
                            method_sym = CodeSymbol(
                                name=method_name,
                                symbol_type=SymbolType.METHOD,
                                file_path=file_path,
                                start_line=item.lineno,
                                end_line=getattr(item, "end_lineno", item.lineno),
                                docstring=ast.get_docstring(item),
                                args=[arg.arg for arg in item.args.args],
                            )
                            symbols.append(method_sym)
                            symbol_map.setdefault(method_name, []).append(method_sym)
                            symbol_map.setdefault(item.name, []).append(method_sym)

    return RepoASTIndex(
        repo_path=repo_path,
        files_indexed=files_indexed,
        total_symbols=len(symbols),
        symbols=symbols,
        symbol_map=symbol_map,
    )


def extract_symbol_source(file_path: str, symbol_name: str) -> Optional[str]:
    """Extract and unparse source code of a specified function or class symbol."""
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=file_path)

    if "." in symbol_name:
        class_name, method_name = symbol_name.split(".", 1)
        for node in tree.body:
            if isinstance(node, ast.ClassDef) and node.name == class_name:
                for item in node.body:
                    if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)) and item.name == method_name:
                        return ast.unparse(item)
    else:
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and node.name == symbol_name:
                return ast.unparse(node)
    return None


def plan_issue_patch(
    issue_description: str,
    index: RepoASTIndex,
    proposed_fix: Optional[str] = None,
    target_symbol_override: Optional[str] = None,
) -> PatchPlan:
    """Analyze issue description or stack trace to target candidate symbols and build a patch plan."""
    target_symbol = target_symbol_override
    target_file = ""

    # Check for traceback file/symbol pattern
    traceback_match = re.search(r'File "([^"]+)", line \d+, in (\w+)', issue_description)
    if traceback_match:
        matched_file, matched_symbol = traceback_match.groups()
        if matched_symbol in index.symbol_map:
            target_symbol = matched_symbol
            target_file = matched_file

    if not target_symbol:
        # Match symbol names directly in text
        for name, syms in index.symbol_map.items():
            pattern = r"\b" + re.escape(name) + r"\b"
            if re.search(pattern, issue_description):
                target_symbol = name
                target_file = syms[0].file_path
                break

    if not target_symbol and index.symbols:
        target_symbol = index.symbols[0].name
        target_file = index.symbols[0].file_path

    if not target_file and target_symbol and target_symbol in index.symbol_map:
        target_file = index.symbol_map[target_symbol][0].file_path

    replacement_code = proposed_fix or ""
    rationale = f"Remediate defect in {target_symbol} identified from issue description."

    actions = []
    if target_symbol and target_file:
        actions.append(
            PatchAction(
                file_path=target_file,
                target_symbol=target_symbol,
                replacement_code=replacement_code,
                rationale=rationale,
            )
        )

    return PatchPlan(
        issue_id=f"ISSUE-{int(time.time() * 1000) % 100000}",
        issue_description=issue_description,
        target_files=[target_file] if target_file else [],
        planned_actions=actions,
        confidence_score=1.0 if target_symbol and target_file else 0.5,
    )


def patch_ast_symbol(source_code: str, target_symbol: str, new_code: str) -> str:
    """Replace an AST function or method node with new replacement code."""
    tree = ast.parse(source_code)
    new_tree = ast.parse(new_code.strip())
    if not new_tree.body:
        raise ValueError("Replacement code cannot be empty")
    new_node = new_tree.body[0]

    replaced = False

    if "." in target_symbol:
        class_name, method_name = target_symbol.split(".", 1)
        for node in tree.body:
            if isinstance(node, ast.ClassDef) and node.name == class_name:
                for i, item in enumerate(node.body):
                    if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)) and item.name == method_name:
                        node.body[i] = new_node
                        replaced = True
                        break
    else:
        for i, node in enumerate(tree.body):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and node.name == target_symbol:
                tree.body[i] = new_node
                replaced = True
                break

    if not replaced:
        raise ValueError(f"Target symbol '{target_symbol}' not found in source AST")

    ast.fix_missing_locations(tree)
    patched_source = ast.unparse(tree)
    # Validate resulting code syntax
    ast.parse(patched_source)
    return patched_source


def apply_patch_to_file(file_path: str, target_symbol: str, new_code: str) -> Tuple[bool, str]:
    """Apply AST patch to file, returning success status and pristine backup source."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        original_code = f.read()

    try:
        patched_code = patch_ast_symbol(original_code, target_symbol, new_code)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(patched_code)
        return True, original_code
    except Exception as exc:
        # Guarantee file intact on parse/patch error
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(original_code)
        raise exc


def rollback_file(file_path: str, original_code: str) -> bool:
    """Restore file content to pristine snapshot."""
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(original_code)
    return True


def diagnose_test_failure(stdout: str, stderr: str, exit_code: int) -> Tuple[Optional[str], Optional[str], Optional[int], Optional[str]]:
    """Diagnose CI / test runner output to isolate failure category, location, and reason."""
    combined = stdout + "\n" + stderr
    failure_category = None
    diagnosed_file = None
    diagnosed_line = None
    error_message = None

    exception_pattern = re.search(
        r"(ZeroDivisionError|AssertionError|TypeError|ValueError|KeyError|IndexError|AttributeError|SyntaxError|NameError|ImportError|FileNotFoundError): (.*)",
        combined,
    )
    if exception_pattern:
        failure_category = exception_pattern.group(1)
        error_message = exception_pattern.group(2).strip()

    loc_pattern = re.search(r'File "([^"]+)", line (\d+)', combined)
    if loc_pattern:
        diagnosed_file = loc_pattern.group(1)
        diagnosed_line = int(loc_pattern.group(2))
    else:
        pytest_loc = re.search(r"([a-zA-Z0-9_\-\\/]+\.py):(\d+):", combined)
        if pytest_loc:
            diagnosed_file = pytest_loc.group(1)
            diagnosed_line = int(pytest_loc.group(2))

    if not failure_category and "FAILED" in combined:
        failure_category = "AssertionError"
        fail_line = re.search(r"FAILED .*\s+-\s+(.*)", combined)
        if fail_line:
            error_message = fail_line.group(1).strip()

    return failure_category, diagnosed_file, diagnosed_line, error_message


def run_automated_tests(test_target: str, cwd: Optional[str] = None, timeout: int = 20) -> TestResult:
    """Execute pytest suite on target and capture execution telemetry."""
    cmd = [sys.executable, "-m", "pytest", test_target, "-q", "--tb=short"]
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=cwd,
            timeout=timeout,
        )
        passed = proc.returncode == 0
        cat, diag_file, diag_line, err_msg = None, None, None, None
        if not passed:
            cat, diag_file, diag_line, err_msg = diagnose_test_failure(proc.stdout, proc.stderr, proc.returncode)

        return TestResult(
            passed=passed,
            exit_code=proc.returncode,
            stdout=proc.stdout,
            stderr=proc.stderr,
            failure_category=cat,
            diagnosed_file=diag_file,
            diagnosed_line=diag_line,
            error_message=err_msg,
        )
    except subprocess.TimeoutExpired as te:
        return TestResult(
            passed=False,
            exit_code=124,
            stdout=te.stdout or "",
            stderr=te.stderr or "Execution timed out",
            failure_category="TimeoutError",
            error_message="Test runner execution timed out",
        )


def verify_and_resolve_patch(
    file_path: str,
    target_symbol: str,
    new_code: str,
    test_target: str,
    cwd: Optional[str] = None,
) -> ExecutionRecord:
    """Autonomous repair loop: applies AST patch, runs CI test suite, and automatically rolls back if tests fail."""
    start_time = time.perf_counter()
    with open(file_path, "r", encoding="utf-8") as f:
        original_code = f.read()

    _, original_backup = apply_patch_to_file(file_path, target_symbol, new_code)
    test_result = run_automated_tests(test_target, cwd=cwd)

    if test_result.passed:
        verified = True
        rolled_back = False
    else:
        rollback_file(file_path, original_backup)
        verified = False
        rolled_back = True

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return ExecutionRecord(
        plan_id=f"EXEC-{int(time.time() * 1000) % 100000}",
        patches_applied=[f"{file_path}::{target_symbol}"],
        test_result=test_result,
        verified=verified,
        rolled_back=rolled_back,
        duration_ms=round(elapsed_ms, 2),
    )
