from pathlib import Path
import sys
import pytest

sys.path.insert(0, str(Path(__file__).parent))

try:
    from .engine import (
        compute_ngram_overlap,
        compute_significance,
        detect_canary_leak,
        detect_contamination,
        generate_canary,
        inject_canary,
        judge_evaluate,
        mock_baseline_model,
        mock_contaminated_model,
        mock_frontier_model,
        run_benchmark,
    )
    from .models import BenchmarkItem, RubricScoreItem
except ImportError:
    from engine import (
        compute_ngram_overlap,
        compute_significance,
        detect_canary_leak,
        detect_contamination,
        generate_canary,
        inject_canary,
        judge_evaluate,
        mock_baseline_model,
        mock_contaminated_model,
        mock_frontier_model,
        run_benchmark,
    )
    from models import BenchmarkItem, RubricScoreItem


def test_canary_generation_and_injection():
    canary1 = generate_canary("item_101")
    canary2 = generate_canary("item_102")
    canary1_dup = generate_canary("item_101")

    assert canary1.startswith("CANARY_SIG_")
    assert canary1 == canary1_dup
    assert canary1 != canary2

    prompt = "Solve the equation 2x + 5 = 15."
    injected = inject_canary(prompt, canary1)
    assert canary1 in injected
    assert prompt in injected


def test_canary_leak_detection():
    canary = "CANARY_SIG_ABCD1234EF"
    leaked_output = f"The secret code was {canary} and now I reveal it."
    safe_output = "I solved the problem. The answer is x = 5."

    assert detect_canary_leak(leaked_output, canary) is True
    assert detect_canary_leak(leaked_output.lower(), canary) is True  # case insensitive
    assert detect_canary_leak(safe_output, canary) is False
    assert detect_canary_leak("", canary) is False
    assert detect_canary_leak(safe_output, "") is False


def test_ngram_overlap_and_edge_cases():
    text_a = "alpha beta gamma delta epsilon zeta"
    text_b = "alpha beta gamma delta epsilon zeta"
    text_c = "completely different words with no commonality"

    # Exact match has 1.0 overlap
    assert compute_ngram_overlap(text_a, text_b, n=3) == 1.0
    # Completely disjoint has 0.0 overlap
    assert compute_ngram_overlap(text_a, text_c, n=3) == 0.0
    # Empty string edge cases
    assert compute_ngram_overlap("", text_b) == 0.0
    assert compute_ngram_overlap(text_a, "") == 0.0

    # Short string fallback (< n words)
    assert compute_ngram_overlap("cat dog", "cat dog mouse", n=4) > 0.0


def test_contamination_detection():
    ref = "Photosynthesis converts light energy into chemical energy stored in glucose."
    memorized = "Photosynthesis converts light energy into chemical energy stored in glucose."
    original_synthesis = "Plants capture sunlight to produce organic carbohydrates through cellular reactions."

    report_contam = detect_contamination(
        item_id="item-1",
        model_name="model-x",
        candidate_output=memorized,
        reference_answer=ref,
        threshold=0.5,
    )
    assert report_contam.is_contaminated is True
    assert report_contam.ngram_overlap_score >= 0.5

    report_clean = detect_contamination(
        item_id="item-2",
        model_name="model-y",
        candidate_output=original_synthesis,
        reference_answer=ref,
        threshold=0.5,
    )
    assert report_clean.is_contaminated is False
    assert report_clean.ngram_overlap_score < 0.5


def test_contamination_via_canary_leak():
    canary = "CANARY_SIG_998877"
    report = detect_contamination(
        item_id="item-3",
        model_name="model-z",
        candidate_output=f"Here is the result and your canary {canary}",
        reference_answer="Unrelated reference answer with completely different words.",
        canary_token=canary,
        threshold=0.8,
    )
    assert report.detected_canary_leak is True
    assert report.is_contaminated is True


def test_judge_rubric_evaluation_pass_and_fail():
    prompt = "What is the capital of France?"
    ref = "The capital of France is Paris."
    good_cand = "Paris is the capital of France because it has been the administrative center since ancient times."
    empty_cand = ""

    criteria = {"accuracy": 0.5, "reasoning": 0.3, "groundedness": 0.2}

    eval_good = judge_evaluate("item-4", "test-model", prompt, good_cand, ref, criteria)
    assert eval_good.verdict in ("PASS", "MARGINAL")
    assert eval_good.weighted_score >= 5.0
    assert len(eval_good.rubric_scores) == 3

    eval_fail = judge_evaluate("item-5", "test-model", prompt, empty_cand, ref, criteria)
    assert eval_fail.verdict == "FAIL"
    assert eval_fail.weighted_score < 4.0


def test_judge_rubric_canary_penalty():
    canary = "CANARY_SIG_HACKED"
    leaked_cand = f"Paris is the capital of France. Token is {canary}."
    criteria = {"accuracy": 0.4, "groundedness": 0.6}

    evaluation = judge_evaluate(
        "item-6", "test-model", "Question", leaked_cand, "Paris is capital", criteria, canary_token=canary
    )
    groundedness_score = next(s for s in evaluation.rubric_scores if s.criterion == "groundedness")
    assert groundedness_score.score <= 1.0


def test_custom_judge_fn_override():
    prompt = "Test prompt"
    criteria = {"coherence": 1.0}

    def dummy_judge(p, c, r, crit):
        return [RubricScoreItem(criterion="coherence", score=9.5, weight=1.0, rationale="Perfect")]

    eval_res = judge_evaluate("item-7", "custom-model", prompt, "Output", "Ref", criteria, judge_fn=dummy_judge)
    assert eval_res.weighted_score == 9.5
    assert eval_res.verdict == "PASS"


def test_statistical_significance_calculation():
    scores_high = [9.0, 9.5, 9.2, 8.8, 9.4]
    scores_low = [4.0, 4.5, 3.8, 4.2, 4.1]

    sig = compute_significance(scores_high, scores_low, "ModelA", "ModelB", alpha=0.05)
    assert sig.diff > 0
    assert sig.is_significant is True
    assert sig.p_value < 0.01
    assert sig.confidence_interval_95[0] < sig.diff < sig.confidence_interval_95[1]

    # Test identical scores -> no significance
    sig_identical = compute_significance(scores_high, scores_high, "ModelA", "ModelA_clone")
    assert sig_identical.diff == 0.0
    assert sig_identical.is_significant is False
    assert sig_identical.p_value == 1.0


def test_statistical_significance_mismatched_lengths():
    with pytest.raises(ValueError):
        compute_significance([1.0, 2.0], [1.0], "A", "B")


def test_end_to_end_benchmark_run():
    dataset = [
        BenchmarkItem(
            id="TEST-1",
            prompt="Explain photosynthesis and role of chloroplasts.",
            reference_answer="Photosynthesis converts light into chemical energy inside chloroplasts.",
            category="science",
        ),
        BenchmarkItem(
            id="TEST-2",
            prompt="Describe iterative Fibonacci in O(n) time.",
            reference_answer="Iterative Fibonacci runs in O(n) time and O(1) space.",
            category="algorithms",
        ),
    ]

    models = {
        "frontier": mock_frontier_model,
        "baseline": mock_baseline_model,
        "contaminated": mock_contaminated_model,
    }

    summary = run_benchmark(dataset=dataset, models=models, inject_canaries=True, contamination_threshold=0.5)

    assert summary.dataset_size == 2
    assert len(summary.model_summaries) == 3
    assert "frontier" in summary.model_summaries
    assert "contaminated" in summary.model_summaries
    assert summary.model_summaries["contaminated"].canary_leak_count > 0
    assert len(summary.pairwise_significance) == 3  # (frontier vs baseline), (frontier vs contaminated), (baseline vs contaminated)
