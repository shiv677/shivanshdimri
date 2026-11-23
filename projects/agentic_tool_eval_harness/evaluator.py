import difflib
from typing import Any

try:
    from .models import (
        ToolSignature,
        ToolCallRecord,
        AgentTrajectory,
        EvalMetricSummary,
    )
except ImportError:
    from models import (
        ToolSignature,
        ToolCallRecord,
        AgentTrajectory,
        EvalMetricSummary,
    )


def match_tool_signature(
    called_name: str,
    registry: dict[str, ToolSignature],
    similarity_threshold: float = 0.75,
) -> tuple[ToolSignature | None, float]:
    """Matches a called tool name against a registry of tool signatures, supporting fuzzy matching."""
    if called_name in registry:
        return registry[called_name], 1.0

    best_match = None
    best_ratio = 0.0
    for reg_name, sig in registry.items():
        ratio = difflib.SequenceMatcher(None, called_name.lower(), reg_name.lower()).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_match = sig

    if best_ratio >= similarity_threshold and best_match is not None:
        return best_match, round(best_ratio, 3)

    return None, round(best_ratio, 3)


import re

def _extract_identifier_tokens(text: str) -> list[str]:
    """Extracts identifier-like tokens (e.g. IDs, keys, entity names) from a text value."""
    # Matches tokens containing numbers, hyphens, underscores, or specific entity structures
    tokens = re.findall(r'[a-zA-Z0-9_\-\.\#]{3,}', text)
    identifiers = []
    stopwords = {"true", "false", "null", "none", "json", "select", "from", "where", "with", "into", "update", "order", "group", "limit"}
    for tok in tokens:
        cleaned = tok.strip(".,;:()[]{}\"'")
        if len(cleaned) >= 3 and cleaned.lower() not in stopwords:
            # Prefer tokens with digits, dashes, underscores, or hashes, or standalone entity-like words
            if any(c in cleaned for c in "_-#0123456789") or cleaned.isupper():
                identifiers.append(cleaned)
            elif len(cleaned) >= 6:
                identifiers.append(cleaned)
    return identifiers


def find_hallucinated_arguments(
    action: ToolCallRecord,
    prior_context: str,
) -> list[dict[str, Any]]:
    """Checks if tool arguments contain ungrounded entity values not present in prior context."""
    hallucinations = []
    context_lower = prior_context.lower()

    for arg_name, arg_val in action.arguments.items():
        if isinstance(arg_val, str):
            val_str = arg_val.strip()
            # If it's a short/atomic identifier argument (e.g. cluster_id, pod_name)
            if any(term in arg_name.lower() for term in ("id", "name", "cluster", "namespace", "table", "key", "host", "pod")):
                if val_str.lower() not in context_lower:
                    hallucinations.append({
                        "tool": action.tool_name,
                        "argument": arg_name,
                        "value": val_str,
                        "reason": "Entity argument not found in prior task context or observations",
                    })
                    continue

            # Check individual identifiers inside freeform strings
            tokens = _extract_identifier_tokens(val_str)
            for tok in tokens:
                if tok.lower() not in context_lower:
                    hallucinations.append({
                        "tool": action.tool_name,
                        "argument": arg_name,
                        "value": tok,
                        "reason": f"Identifier '{tok}' not found in prior task context or observations",
                    })
        elif isinstance(arg_val, (int, float, bool)):
            continue
        elif isinstance(arg_val, dict):
            for k, v in arg_val.items():
                if isinstance(v, str) and v.lower() not in context_lower:
                    hallucinations.append({
                        "tool": action.tool_name,
                        "argument": f"{arg_name}.{k}",
                        "value": str(v),
                        "reason": "Nested argument value not found in prior context",
                    })

    return hallucinations


def evaluate_trajectory(
    trajectory: AgentTrajectory,
    registry: dict[str, ToolSignature] | None = None,
) -> EvalMetricSummary:
    """Evaluates an agent trajectory DAG for tool calling precision, grounding, and rubric attainment."""
    tool_registry = registry or {}
    total_steps = len(trajectory.steps)

    called_tools: list[str] = []
    valid_tool_count = 0
    hallucinated_args: list[dict[str, Any]] = []
    total_arg_values_checked = 0
    total_latency_ms = 0.0
    total_cost_usd = 0.0

    # Build running context: initial goal is the starting point
    accumulated_context = trajectory.task_goal + "\n"

    for step in trajectory.steps:
        # Context also absorbs step thought
        if step.thought:
            accumulated_context += f"Thought: {step.thought}\n"

        if step.action:
            action = step.action
            called_tools.append(action.tool_name)
            total_latency_ms += action.execution_time_ms
            total_cost_usd += action.cost_usd

            # Check tool validity
            if tool_registry:
                matched_sig, sim = match_tool_signature(action.tool_name, tool_registry)
                if matched_sig is not None:
                    valid_tool_count += 1
            else:
                # If no registry provided, check against ground truth tools
                if action.tool_name in trajectory.ground_truth_tools:
                    valid_tool_count += 1

            # Check argument grounding
            total_arg_values_checked += max(1, len(action.arguments))

            unfound = find_hallucinated_arguments(action, accumulated_context)
            hallucinated_args.extend(unfound)

            # Context absorbs action output / observation
            if action.output:
                accumulated_context += f"Output: {action.output}\n"
        if step.observation:
            accumulated_context += f"Observation: {step.observation}\n"

    tool_call_count = len(called_tools)
    if tool_call_count > 0:
        precision = valid_tool_count / tool_call_count
    else:
        precision = 1.0 if not trajectory.ground_truth_tools else 0.0

    gt_tools_set = set(trajectory.ground_truth_tools)
    if gt_tools_set:
        recall = len(set(called_tools) & gt_tools_set) / len(gt_tools_set)
    else:
        recall = 1.0

    # Grounding rate
    if total_arg_values_checked > 0:
        grounding_rate = max(0.0, 1.0 - (len(hallucinated_args) / total_arg_values_checked))
    else:
        grounding_rate = 1.0

    # Goal attainment
    goal_attained = False
    if trajectory.success is not None:
        goal_attained = trajectory.success
    elif trajectory.expected_final_answer and trajectory.final_answer:
        expected_tokens = set(trajectory.expected_final_answer.lower().split())
        actual_tokens = set(trajectory.final_answer.lower().split())
        overlap = len(expected_tokens & actual_tokens) / max(1, len(expected_tokens))
        goal_attained = overlap >= 0.7
    elif trajectory.final_answer is not None and len(trajectory.final_answer.strip()) > 0:
        goal_attained = True

    # Composite rubric score: 25% precision, 25% recall, 25% grounding, 25% goal attainment
    rubric_score = (
        0.25 * precision +
        0.25 * recall +
        0.25 * grounding_rate +
        0.25 * (1.0 if goal_attained else 0.0)
    )

    return EvalMetricSummary(
        trajectory_id=trajectory.trajectory_id,
        total_steps=total_steps,
        tool_call_count=tool_call_count,
        valid_tool_count=valid_tool_count,
        tool_call_precision=round(precision, 4),
        tool_call_recall=round(recall, 4),
        hallucinated_argument_count=len(hallucinated_args),
        hallucinated_arguments=hallucinated_args,
        goal_attained=goal_attained,
        total_latency_ms=round(total_latency_ms, 2),
        total_cost_usd=round(total_cost_usd, 6),
        rubric_score=round(rubric_score, 4),
    )


def evaluate_batch(
    trajectories: list[AgentTrajectory],
    registry: dict[str, ToolSignature] | None = None,
) -> list[EvalMetricSummary]:
    """Evaluates a batch of agent trajectories."""
    return [evaluate_trajectory(traj, registry) for traj in trajectories]
