import pytest
from pydantic import ValidationError

try:
    from .models import (
        AgentScore,
        ConsensusResult,
        EvaluationReport,
        EvaluationSample,
    )
    from .agents import GroundingAgent, ReasoningCritic, SchemaSentinel
    from .engine import ConsensusEngine
except ImportError:
    from models import (
        AgentScore,
        ConsensusResult,
        EvaluationReport,
        EvaluationSample,
    )
    from agents import GroundingAgent, ReasoningCritic, SchemaSentinel
    from engine import ConsensusEngine


def test_grounding_agent():
    agent = GroundingAgent()
    context = "The quick brown fox jumps over the lazy dog in the sunny meadow."

    # Grounded response
    res_good = agent.evaluate("The brown fox jumps over the lazy dog.", context=context)
    assert res_good.passed
    assert res_good.score >= 0.70
    assert "LOW_CONTEXT_GROUNDING" not in res_good.flags

    # Hallucinated response
    res_bad = agent.evaluate("Superconducting magnets oscillate at subatomic frequencies.", context=context)
    assert not res_bad.passed
    assert "LOW_CONTEXT_GROUNDING" in res_bad.flags

    # Empty response
    res_empty = agent.evaluate("", context=context)
    assert not res_empty.passed
    assert res_empty.score == 0.0


def test_reasoning_critic():
    agent = ReasoningCritic()

    # Good reasoning
    good_text = "The latency increased because disk I/O saturated; therefore, batch size must be reduced."
    res_good = agent.evaluate(good_text)
    assert res_good.passed
    assert res_good.score >= 0.70

    # Contradictory text
    bad_text = "This proposition is true throughout the system, yet is false under identical settings."
    res_bad = agent.evaluate(bad_text)
    assert "POTENTIAL_CONTRADICTION" in res_bad.flags


def test_schema_sentinel():
    agent = SchemaSentinel()

    # Valid JSON
    valid_json = '{"user": "alice", "score": 95}'
    res_valid = agent.evaluate(valid_json, required_format="json", required_keys=["user", "score"])
    assert res_valid.passed
    assert res_valid.score == 1.0

    # Missing key
    res_missing = agent.evaluate(valid_json, required_format="json", required_keys=["user", "timestamp"])
    assert any("MISSING_KEYS" in f for f in res_missing.flags)

    # Invalid JSON syntax
    broken_json = '{user: alice, broken}'
    res_broken = agent.evaluate(broken_json, required_format="json")
    assert not res_broken.passed
    assert "INVALID_JSON_SYNTAX" in res_broken.flags
    assert res_broken.score == 0.0


def test_schema_sentinel_pydantic_v2_strict_typing():
    agent = SchemaSentinel()
    schema = {
        "properties": {
            "item_id": {"type": "string"},
            "quantity": {"type": "integer"},
            "unit_price": {"type": "number"},
        },
        "required": ["item_id", "quantity"],
    }

    # Strict type match
    valid_payload = '{"item_id": "SKU-99", "quantity": 4, "unit_price": 19.99}'
    res_valid = agent.evaluate(valid_payload, required_format="json", expected_schema=schema)
    assert res_valid.passed
    assert res_valid.score == 1.0
    assert "STRICT_SCHEMA_PASSED" in res_valid.flags

    # Type violation (string instead of integer)
    invalid_type_payload = '{"item_id": "SKU-99", "quantity": "not_an_int"}'
    res_invalid = agent.evaluate(invalid_type_payload, required_format="json", expected_schema=schema)
    assert not res_invalid.passed
    assert res_invalid.score < 1.0
    assert any("MISSING_KEYS_quantity" in f for f in res_invalid.flags)


def test_consensus_engine_approval():
    engine = ConsensusEngine()
    context = "The dataset has 10,000 images annotated with bounding boxes."
    response = "The dataset contains 10,000 images with bounding box annotations; therefore, it supports object detection."

    rubric = engine.evaluate(
        task_id="t1",
        prompt="Describe the dataset.",
        candidate_response=response,
        context=context,
    )
    assert rubric.final_verdict == "ACCEPT"
    assert rubric.consensus_reached
    assert rubric.weighted_score >= 0.70
    assert rubric.passed is True
    assert rubric.escalate_to_human is False


def test_consensus_engine_rejection_on_critical_schema_error():
    engine = ConsensusEngine()
    rubric = engine.evaluate(
        task_id="t2",
        prompt="Output valid JSON metrics.",
        candidate_response="Not json at all",
        required_format="json",
        required_keys=["metric"],
    )
    assert rubric.final_verdict == "REJECT"
    assert any("INVALID_JSON_SYNTAX" in note for note in rubric.synthesis_notes)


def test_consensus_engine_debate_trigger_and_rubric_serialization():
    engine = ConsensusEngine()
    context = "Apples are strictly red or green."
    response = "Apples are always purple because solar radiation shifts their pigment; thus purple is the standard."

    rubric = engine.evaluate(
        task_id="t3",
        prompt="Explain apple colors.",
        candidate_response=response,
        context=context,
    )
    # Ensure rubric serializes to JSON without error
    json_data = rubric.model_dump_json()
    assert "task_id" in json_data
    assert "individual_verdicts" in json_data
    assert "agent_scores" in json_data
    assert rubric.round_count in (1, 2)


def test_low_confidence_disagreement_and_human_escalation():
    engine = ConsensusEngine(consensus_threshold=0.70)
    # Grounding is moderate, reasoning has severe contradiction
    context = "Database replication latency is currently 45ms across nodes."
    contradictory_response = (
        "Replication latency is 45ms across nodes. "
        "This proposition is true throughout the system, yet is false under identical settings."
    )

    result = engine.evaluate(
        task_id="t4_disagreement",
        prompt="Assess replication health.",
        candidate_response=contradictory_response,
        context=context,
    )

    assert result.final_score < 0.70
    assert result.escalate_to_human is True
    assert result.passed is False
    assert result.consensus_status in ("HUMAN_AUDIT", "FLAG_REJECT")


@pytest.mark.asyncio
async def test_async_consensus_loop_and_weights():
    engine = ConsensusEngine(
        grounding_weight=0.40,
        reasoning_weight=0.40,
        schema_weight=0.20,
    )
    sample = EvaluationSample(
        id="async_001",
        prompt="What is PostgreSQL WAL?",
        response="PostgreSQL WAL logs transactions before writing to disk; therefore, it guarantees crash durability.",
        reference_data="PostgreSQL Write-Ahead Logging logs transactions before disk writes to guarantee durability.",
        required_format="text",
    )

    result: ConsensusResult = await engine.evaluate_sample(sample)
    assert isinstance(result, ConsensusResult)
    assert result.weights == {"grounding": 0.40, "reasoning": 0.40, "schema": 0.20}
    assert result.passed is True
    assert result.final_score >= 0.70


@pytest.mark.asyncio
async def test_batch_evaluation_and_report_generation():
    engine = ConsensusEngine()
    samples = [
        EvaluationSample(
            id="batch_01",
            prompt="Compute sum",
            response="The sum is 10 because 5 + 5 = 10.",
            reference_data="The sum of 5 and 5 equals 10.",
            required_format="text",
        ),
        EvaluationSample(
            id="batch_02",
            prompt="Generate JSON payload",
            response="Broken string no json",
            reference_data="",
            required_format="json",
            required_keys=["data"],
        ),
    ]

    report: EvaluationReport = await engine.evaluate_batch(samples)
    assert isinstance(report, EvaluationReport)
    assert report.total_samples == 2
    assert report.passed_samples == 1
    assert len(report.results) == 2
    assert report.average_score > 0.0
