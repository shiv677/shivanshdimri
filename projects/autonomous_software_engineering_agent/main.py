"""Command-line driver and benchmark runner for Autonomous Software Engineering Agent."""

import argparse
import os
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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
    from .models import RepoASTIndex
except ImportError:
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
    from models import RepoASTIndex


def run_benchmark(iterations: int = 100):
    print("=" * 80)
    print("Autonomous Software Engineering Agent - AST & Patcher Benchmark")
    print("=" * 80)

    sample_code = '''def compute_ratio(numerator, denominator):
    """Compute ratio with division."""
    return numerator / denominator

def calculate_discount(price, rate):
    return price * (1.0 - rate)
'''

    fixed_code = '''def compute_ratio(numerator, denominator):
    """Compute ratio with safe zero guard."""
    if denominator == 0:
        return 0.0
    return numerator / denominator'''

    # 1. Benchmark AST parse & symbol unparse
    t0 = time.perf_counter()
    for _ in range(iterations):
        patched = patch_ast_symbol(sample_code, "compute_ratio", fixed_code)
    t1 = time.perf_counter()
    patch_time_total = (t1 - t0) * 1000.0
    patch_time_per_op = patch_time_total / iterations

    print(f"AST Patch Transformations: {iterations} iterations")
    print(f"Total Elapsed Time:        {patch_time_total:.2f} ms")
    print(f"Average Latency / Op:      {patch_time_per_op:.3f} ms")
    print(f"Throughput:                {iterations / (t1 - t0):.1f} ops/sec")

    # 2. Benchmark Rollback Verification in sandbox
    with tempfile.TemporaryDirectory() as tmp_dir:
        test_py = os.path.join(tmp_dir, "calc.py")
        suite_py = os.path.join(tmp_dir, "test_calc.py")

        with open(test_py, "w", encoding="utf-8") as f:
            f.write(sample_code)

        with open(suite_py, "w", encoding="utf-8") as f:
            f.write('''import pytest
from calc import compute_ratio

def test_compute_ratio():
    assert compute_ratio(10, 0) == 0.0
''')

        # Test before patch (fails because denominator == 0 causes ZeroDivisionError)
        pre_test = run_automated_tests(suite_py, cwd=tmp_dir)
        print("-" * 80)
        print(f"Pre-patch test passed:     {pre_test.passed}")
        print(f"Diagnosed failure category:{pre_test.failure_category}")

        # Execute autonomous repair cycle
        exec_record = verify_and_resolve_patch(
            file_path=test_py,
            target_symbol="compute_ratio",
            new_code=fixed_code,
            test_target=suite_py,
            cwd=tmp_dir,
        )

        print(f"Post-patch verification:   {exec_record.verified}")
        print(f"Post-patch rolled back:    {exec_record.rolled_back}")
        print(f"Cycle execution time:      {exec_record.duration_ms:.2f} ms")
        print("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="Autonomous Software Engineering Agent Driver")
    parser.add_argument("--repo", type=str, default=".", help="Target repository directory to index")
    parser.add_argument("--benchmark", action="store_true", help="Run AST patching benchmark suite")
    parser.add_argument("--iterations", type=int, default=100, help="Benchmark iteration count")
    args = parser.parse_args()

    if args.benchmark:
        run_benchmark(iterations=args.iterations)
        return

    print("=" * 80)
    print("Autonomous Software Engineering Agent - Repository AST Indexer")
    print("=" * 80)
    target_repo = os.path.abspath(args.repo)
    print(f"Scanning target repository: {target_repo}")

    index = parse_repository_ast(target_repo)
    print(f"Files Indexed:   {index.files_indexed}")
    print(f"Total Symbols:   {index.total_symbols}")
    print("\nTop Indexed Symbols:")
    for sym in index.symbols[:15]:
        print(f"  [{sym.symbol_type.value:<8}] {sym.name:<30} -> {os.path.basename(sym.file_path)}:L{sym.start_line}")
    print("=" * 80)


if __name__ == "__main__":
    main()
