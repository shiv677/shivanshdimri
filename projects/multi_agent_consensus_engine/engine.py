import asyncio
import concurrent.futures
from typing import Any, Dict, List, Optional

try:
    from .models import (
        AgentScore,
        ConsensusResult,
        ConsensusRubric,
        EvaluationReport,
        EvaluationSample,
    )
    from .agents import GroundingAgent, ReasoningCritic, SchemaSentinel
except ImportError:
    from models import (
        AgentScore,
        ConsensusResult,
        ConsensusRubric,
        EvaluationReport,
        EvaluationSample,
    )
    from agents import GroundingAgent, ReasoningCritic, SchemaSentinel


class ConsensusEngine:
    """Orchestrates multi-agent debate and consensus evaluation across Grounding, Reasoning, and Schema agents."""

    def __init__(
        self,
        grounding_weight: float = 0.40,
        reasoning_weight: float = 0.40,
        schema_weight: float = 0.20,
        consensus_threshold: float = 0.70,
        disagreement_tolerance: float = 0.35,
    ):
        self.grounding_agent = GroundingAgent()
        self.reasoning_critic = ReasoningCritic()
        self.schema_sentinel = SchemaSentinel()

        self.weights = {
            "GroundingAgent": grounding_weight,
            "ReasoningCritic": reasoning_weight,
            "SchemaSentinel": schema_weight,
        }
        self.consensus_threshold = consensus_threshold
        self.disagreement_tolerance = disagreement_tolerance

    def _compute_weighted_score(self, verdicts: Dict[str, AgentScore]) -> tuple[float, float]:
        v_ground = verdicts.get("GroundingAgent")
        v_reason = verdicts.get("ReasoningCritic")
        v_schema = verdicts.get("SchemaSentinel")

        g_score = v_ground.score if v_ground else 0.0
        r_score = v_reason.score if v_reason else 0.0
        s_score = v_schema.score if v_schema else 0.0

        w_g = self.weights.get("GroundingAgent", 0.40)
        w_r = self.weights.get("ReasoningCritic", 0.40)
        w_s = self.weights.get("SchemaSentinel", 0.20)

        weighted_score = round((w_g * g_score) + (w_r * r_score) + (w_s * s_score), 4)

        confidences = [v.confidence for v in verdicts.values()]
        avg_confidence = round(sum(confidences) / len(confidences), 4) if confidences else 1.0

        return weighted_score, avg_confidence

    async def evaluate_sample(
        self,
        task_id: Any = "eval_task",
        prompt: str = "",
        candidate_response: str = "",
        context: str = "",
        required_format: str = "text",
        required_keys: Optional[Any] = None,
        expected_schema: Optional[Dict[str, Any]] = None,
        sample: Optional[EvaluationSample] = None,
    ) -> ConsensusResult:
        if sample is not None or isinstance(task_id, EvaluationSample):
            s = sample if sample is not None else task_id
            task_id_str = s.id
            prompt_str = s.prompt
            response_str = s.response
            context_str = s.reference_data
            format_str = s.required_format
            keys_val = s.required_keys
            schema_val = s.expected_schema
        else:
            task_id_str = str(task_id)
            prompt_str = prompt
            response_str = candidate_response
            context_str = context
            format_str = required_format
            keys_val = required_keys
            schema_val = expected_schema

        notes: List[str] = []

        # Round 1: Asynchronous parallel evaluations
        v_ground, v_reason, v_schema = await asyncio.gather(
            self.grounding_agent.evaluate_async(response_str, context=context_str),
            self.reasoning_critic.evaluate_async(response_str),
            self.schema_sentinel.evaluate_async(
                response_str,
                required_format=format_str,
                required_keys=keys_val,
                expected_schema=schema_val,
            ),
        )

        verdicts: Dict[str, AgentScore] = {
            v_ground.agent_name: v_ground,
            v_reason.agent_name: v_reason,
            v_schema.agent_name: v_schema,
        }

        scores = [v.score for v in verdicts.values()]
        score_spread = max(scores) - min(scores)
        has_polar_disagreement = any(v.passed for v in verdicts.values()) and not all(v.passed for v in verdicts.values())

        round_count = 1
        # Check if debate round is needed
        if score_spread > self.disagreement_tolerance or has_polar_disagreement:
            round_count = 2
            notes.append(f"Debate round 2 triggered due to score spread ({score_spread:.2f}) or polarized verdicts.")

            # Cross-agent feedback sharing in asynchronous debate
            v_ground_r2, v_reason_r2 = await asyncio.gather(
                self.grounding_agent.evaluate_async(
                    response_str,
                    context=context_str,
                    peer_feedback=v_reason.flags + v_schema.flags,
                ),
                self.reasoning_critic.evaluate_async(
                    response_str,
                    peer_feedback=v_ground.flags + v_schema.flags,
                ),
            )
            v_schema_r2 = v_schema

            verdicts = {
                v_ground_r2.agent_name: v_ground_r2,
                v_reason_r2.agent_name: v_reason_r2,
                v_schema_r2.agent_name: v_schema_r2,
            }
        else:
            notes.append("Unanimous alignment achieved in round 1.")

        weighted_score, avg_confidence = self._compute_weighted_score(verdicts)

        # Critical failure check: invalid schema or severe hallucination
        critical_flags: List[str] = []
        for name, v in verdicts.items():
            if "INVALID_JSON_SYNTAX" in v.flags:
                critical_flags.append(f"{name}: INVALID_JSON_SYNTAX")
            if "LOW_CONTEXT_GROUNDING" in v.flags and v.score < 0.3:
                critical_flags.append(f"{name}: SEVERE_HALLUCINATION")

        if critical_flags:
            final_verdict = "REJECT"
            consensus_status = "FLAG_REJECT"
            consensus_reached = True
            escalate_to_human = False
            passed = False
            notes.append(f"Immediate rejection due to critical flags: {', '.join(critical_flags)}")
        elif weighted_score >= self.consensus_threshold:
            final_verdict = "ACCEPT"
            consensus_status = "VERIFIED_ACCEPT"
            consensus_reached = True
            escalate_to_human = False
            passed = True
            notes.append(f"Candidate passed consensus threshold ({weighted_score:.2f} >= {self.consensus_threshold}).")
        else:
            # Below threshold: flag for human escalation
            escalate_to_human = True
            passed = False
            if weighted_score < 0.45:
                final_verdict = "REJECT"
                consensus_status = "FLAG_REJECT"
                consensus_reached = True
                notes.append(f"Candidate rejected below threshold ({weighted_score:.2f} < 0.45); flagged for audit.")
            else:
                final_verdict = "NEEDS_REVIEW"
                consensus_status = "HUMAN_AUDIT"
                consensus_reached = False
                notes.append(f"Borderline score ({weighted_score:.2f}) requires human arbiter review.")

        summary = f"Composite score {weighted_score:.2f}. Status: {consensus_status}. Human escalation: {escalate_to_human}."

        return ConsensusResult(
            sample_id=task_id_str,
            task_id=task_id_str,
            prompt=prompt_str,
            candidate_response=response_str,
            context=context_str,
            round_count=round_count,
            final_score=weighted_score,
            composite_confidence=avg_confidence,
            passed=passed,
            escalate_to_human=escalate_to_human,
            consensus_status=consensus_status,
            final_verdict=final_verdict,
            consensus_reached=consensus_reached,
            weights={
                "grounding": self.weights["GroundingAgent"],
                "reasoning": self.weights["ReasoningCritic"],
                "schema": self.weights["SchemaSentinel"],
            },
            agent_scores=verdicts,
            summary=summary,
            synthesis_notes=notes,
        )

    def evaluate(
        self,
        task_id: Any = "eval_task",
        prompt: str = "",
        candidate_response: str = "",
        context: str = "",
        required_format: str = "text",
        required_keys: Optional[Any] = None,
        expected_schema: Optional[Dict[str, Any]] = None,
    ) -> ConsensusResult:
        """Synchronous wrapper for evaluate_sample."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        coro = self.evaluate_sample(
            task_id=task_id,
            prompt=prompt,
            candidate_response=candidate_response,
            context=context,
            required_format=required_format,
            required_keys=required_keys,
            expected_schema=expected_schema,
        )

        if loop and loop.is_running():
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                return executor.submit(asyncio.run, coro).result()
        else:
            return asyncio.run(coro)

    async def evaluate_batch(self, samples: List[EvaluationSample]) -> EvaluationReport:
        """Asynchronously evaluates a batch of candidate samples."""
        tasks = [self.evaluate_sample(sample=s) for s in samples]
        results: List[ConsensusResult] = await asyncio.gather(*tasks)

        passed_count = sum(1 for r in results if r.passed)
        escalated_count = sum(1 for r in results if r.escalate_to_human)
        rejected_count = sum(1 for r in results if not r.passed and not r.escalate_to_human)
        avg_score = round(sum(r.final_score for r in results) / len(results), 4) if results else 0.0

        return EvaluationReport(
            total_samples=len(results),
            passed_samples=passed_count,
            escalated_samples=escalated_count,
            rejected_samples=rejected_count,
            average_score=avg_score,
            results=results,
        )
