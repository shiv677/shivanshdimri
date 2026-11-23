import ast
import json
import operator
import time
from typing import Any, Callable, Dict, List, Optional

try:
    from .models import (
        Conflict,
        DAGPlan,
        MemoryItem,
        ResearchReport,
        TaskNode,
        ToolCall,
        ToolResult,
        VerificationResult,
    )
except ImportError:
    from models import (
        Conflict,
        DAGPlan,
        MemoryItem,
        ResearchReport,
        TaskNode,
        ToolCall,
        ToolResult,
        VerificationResult,
    )

SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def safe_eval_math(expr: str) -> float:
    """Safely evaluate arithmetic expressions without using arbitrary eval."""
    tree = ast.parse(expr.strip(), mode="eval")

    def _eval(node: ast.AST) -> float:
        if isinstance(node, ast.Expression):
            return _eval(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return float(node.value)
        if isinstance(node, ast.BinOp):
            op_type = type(node.op)
            if op_type not in SAFE_OPERATORS:
                raise ValueError(f"Unsupported math operator: {op_type.__name__}")
            left = _eval(node.left)
            right = _eval(node.right)
            return SAFE_OPERATORS[op_type](left, right)
        if isinstance(node, ast.UnaryOp):
            op_type = type(node.op)
            if op_type not in SAFE_OPERATORS:
                raise ValueError(f"Unsupported unary operator: {op_type.__name__}")
            return SAFE_OPERATORS[op_type](_eval(node.operand))
        raise ValueError(f"Unsupported expression element: {type(node).__name__}")

    return _eval(tree)


def topological_sort_dag(dag: DAGPlan) -> List[List[str]]:
    """Sort tasks into parallel execution stages using Kahn's algorithm."""
    in_degree: Dict[str, int] = {task_id: 0 for task_id in dag.tasks}
    dependents: Dict[str, List[str]] = {task_id: [] for task_id in dag.tasks}

    for task_id, task in dag.tasks.items():
        for dep in task.dependencies:
            if dep not in dag.tasks:
                raise ValueError(f"Dependency '{dep}' for task '{task_id}' not found in DAG.")
            in_degree[task_id] += 1
            dependents[dep].append(task_id)

    stages: List[List[str]] = []
    ready = [task_id for task_id, deg in in_degree.items() if deg == 0]

    processed_count = 0
    while ready:
        stages.append(sorted(ready))
        processed_count += len(ready)
        next_ready = []
        for task_id in ready:
            for dep in dependents[task_id]:
                in_degree[dep] -= 1
                if in_degree[dep] == 0:
                    next_ready.append(dep)
        ready = next_ready

    if processed_count < len(dag.tasks):
        raise ValueError("Cycle detected in DAG: graph is not acyclic.")

    return stages


class ToolSandbox:
    """Safe execution sandbox for research agents."""

    def __init__(self, corpus: Optional[Dict[str, str]] = None):
        self.corpus = corpus or {
            "attention": "Self-attention computes dynamic weightings over token sequences with O(N^2) complexity.",
            "flashattention": "FlashAttention uses SRAM tiling to optimize memory IO, cutting runtime by 2x-4x.",
            "quantization": "INT8 weight-only quantization reduces memory footprint by 50% with minimal loss in perplexity.",
            "moe": "Mixture-of-Experts activates top-k expert networks per token, scaling capacity without proportional compute cost.",
        }
        self._tools: Dict[str, Callable[..., str]] = {
            "search": self._tool_search,
            "calculate": self._tool_calculate,
            "summarize": self._tool_summarize,
        }

    def register_tool(self, name: str, func: Callable[..., str]) -> None:
        self._tools[name] = func

    def _tool_search(self, query: str) -> str:
        tokens = query.lower().split()
        matches = []
        for key, text in self.corpus.items():
            if any(tok in key.lower() or tok in text.lower() for tok in tokens):
                matches.append(f"[{key}] {text}")
        if matches:
            return " | ".join(matches)
        return "No relevant documents found."

    def _tool_calculate(self, expression: str) -> str:
        result = safe_eval_math(expression)
        return f"{result:.4f}".rstrip("0").rstrip(".")

    def _tool_summarize(self, text: str) -> str:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if not lines:
            return text.strip()
        return " ".join(lines[:2])

    def execute(self, tool_name: str, **kwargs: Any) -> ToolResult:
        start_time = time.perf_counter()
        if tool_name not in self._tools:
            return ToolResult(
                tool_name=tool_name,
                success=False,
                output="",
                error=f"Tool '{tool_name}' not registered in sandbox.",
                execution_time_ms=(time.perf_counter() - start_time) * 1000.0,
            )

        try:
            output = self._tools[tool_name](**kwargs)
            return ToolResult(
                tool_name=tool_name,
                success=True,
                output=str(output),
                execution_time_ms=(time.perf_counter() - start_time) * 1000.0,
            )
        except Exception as e:
            return ToolResult(
                tool_name=tool_name,
                success=False,
                output="",
                error=f"{type(e).__name__}: {str(e)}",
                execution_time_ms=(time.perf_counter() - start_time) * 1000.0,
            )


class PersistentMemory:
    """Persistent working memory buffer across agent tasks."""

    def __init__(self) -> None:
        self._items: Dict[str, MemoryItem] = {}

    def store(self, item: MemoryItem) -> None:
        self._items[item.key] = item

    def get(self, key: str) -> Optional[MemoryItem]:
        return self._items.get(key)

    def search(self, query: str, limit: int = 5) -> List[MemoryItem]:
        query_lower = query.lower()
        scored: List[tuple[float, MemoryItem]] = []
        for item in self._items.values():
            score = 0.0
            if query_lower in item.key.lower():
                score += 2.0
            if query_lower in item.content.lower():
                score += 1.0
            if score > 0:
                scored.append((score * item.confidence, item))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored[:limit]]

    def all_items(self) -> List[MemoryItem]:
        return list(self._items.values())

    def to_dict(self) -> Dict[str, Any]:
        return {k: v.model_dump() for k, v in self._items.items()}

    def from_dict(self, data: Dict[str, Any]) -> None:
        self._items = {k: MemoryItem.model_validate(v) for k, v in data.items()}

    def save_to_file(self, filepath: str) -> None:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)

    def load_from_file(self, filepath: str) -> None:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.from_dict(data)


class ConflictReferee:
    """Arbitrates conflicting factual assertions between agents."""

    def arbitrate(self, items: List[MemoryItem]) -> List[Conflict]:
        conflicts: List[Conflict] = []
        by_topic: Dict[str, List[MemoryItem]] = {}

        for item in items:
            topic = item.metadata.get("topic") or item.key
            by_topic.setdefault(topic, []).append(item)

        for topic, group in by_topic.items():
            if len(group) < 2:
                continue

            # Compare pairs for divergent claims
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    item_a, item_b = group[i], group[j]
                    if item_a.source_agent == item_b.source_agent:
                        continue

                    divergence = False
                    # Check numerical value divergence
                    val_a = item_a.metadata.get("metric_val")
                    val_b = item_b.metadata.get("metric_val")
                    if val_a is not None and val_b is not None and val_a != val_b:
                        divergence = True

                    # Check opposing stance markers
                    content_a, content_b = item_a.content.lower(), item_b.content.lower()
                    if ("increase" in content_a and "decrease" in content_b) or (
                        "superior" in content_a and "inferior" in content_b
                    ):
                        divergence = True

                    if divergence:
                        # Arbitrate based on source confidence
                        if item_a.confidence >= item_b.confidence:
                            winner, loser = item_a, item_b
                        else:
                            winner, loser = item_b, item_a

                        conflicts.append(
                            Conflict(
                                topic=topic,
                                claim_a=item_a.content,
                                claim_b=item_b.content,
                                source_a=item_a.source_agent,
                                source_b=item_b.source_agent,
                                resolution=(
                                    f"Adopted '{winner.source_agent}' claim due to higher confidence "
                                    f"({winner.confidence:.2f} vs {loser.confidence:.2f}): {winner.content}"
                                ),
                                confidence=max(item_a.confidence, item_b.confidence),
                            )
                        )

        return conflicts


class ResearchEngine:
    """Autonomous multi-agent research and reasoning engine."""

    def __init__(self, sandbox: Optional[ToolSandbox] = None) -> None:
        self.sandbox = sandbox or ToolSandbox()
        self.memory = PersistentMemory()
        self.referee = ConflictReferee()

    def build_default_dag(self, query: str) -> DAGPlan:
        """Create a standard DAG research plan for a given query."""
        tasks = {
            "search_literature": TaskNode(
                task_id="search_literature",
                description=f"Query search sandbox for technical literature on '{query}'",
                dependencies=[],
                assigned_agent="literature_miner",
                tool_calls=[ToolCall(tool_name="search", arguments={"query": query})],
            ),
            "compute_metrics": TaskNode(
                task_id="compute_metrics",
                description="Calculate speedup and parameter scaling metrics",
                dependencies=["search_literature"],
                assigned_agent="quantitative_analyst",
                tool_calls=[ToolCall(tool_name="calculate", arguments={"expression": "100.0 / 25.0"})],
            ),
            "synthesize_findings": TaskNode(
                task_id="synthesize_findings",
                description="Synthesize literature and quantitative findings into key takeaways",
                dependencies=["compute_metrics"],
                assigned_agent="lead_synthesizer",
                tool_calls=[],
            ),
        }
        return DAGPlan(query=query, tasks=tasks)

    def verify_report(self, summary: str, findings: List[str], memory: PersistentMemory) -> VerificationResult:
        """Self-verification loop checking report groundedness against memory."""
        all_memory_text = " ".join(item.content.lower() for item in memory.all_items())
        missing: List[str] = []
        hallucinations: List[str] = []

        # Check evidence grounding for each finding
        grounded_count = 0
        for f in findings:
            tokens = [t.lower() for t in f.split() if len(t) > 3]
            if any(tok in all_memory_text for tok in tokens):
                grounded_count += 1
            else:
                missing.append(f)

        total_findings = len(findings) if findings else 1
        grounding_ratio = grounded_count / total_findings

        # Detect ungrounded speculation flags
        for speculative_flag in ["unverified claim", "hypothetical breakthrough", "fake citation"]:
            if speculative_flag in summary.lower():
                hallucinations.append(speculative_flag)

        score = max(0.0, min(1.0, grounding_ratio - 0.3 * len(hallucinations)))
        is_valid = score >= 0.75 and len(hallucinations) == 0

        critique = "Findings are grounded in verified evidence." if is_valid else (
            f"Grounding ratio: {grounding_ratio:.2f}; Missing evidence for {len(missing)} findings; "
            f"Hallucinations: {hallucinations}"
        )

        return VerificationResult(
            is_valid=is_valid,
            score=round(score, 3),
            critique=critique,
            missing_aspects=missing,
            hallucinations=hallucinations,
        )

    def execute_plan(self, dag: DAGPlan, max_refinement_loops: int = 2) -> ResearchReport:
        """Execute the DAG plan, arbitrate conflicts, and self-verify output."""
        stages = topological_sort_dag(dag)

        # Execute DAG stage by stage
        for stage in stages:
            for task_id in stage:
                task = dag.tasks[task_id]
                task.status = "running"
                task_outputs: List[str] = []

                for tool_call in task.tool_calls:
                    res = self.sandbox.execute(tool_call.tool_name, **tool_call.arguments)
                    if res.success:
                        task_outputs.append(res.output)
                    else:
                        task_outputs.append(f"[Tool Error: {res.error}]")

                output_text = " ".join(task_outputs) if task_outputs else f"Completed task: {task.description}"
                task.output = output_text
                task.status = "completed"

                # Store in persistent memory
                self.memory.store(
                    MemoryItem(
                        key=task.task_id,
                        content=output_text,
                        source_agent=task.assigned_agent,
                        confidence=task.confidence,
                        metadata=task.metadata,
                    )
                )

        # Detect and resolve conflicts across memory
        resolved_conflicts = self.referee.arbitrate(self.memory.all_items())

        # Synthesize initial findings
        findings: List[str] = [
            f"[{task.assigned_agent}] {task.output}"
            for task in dag.tasks.values()
            if task.output
        ]
        summary = (
            f"Research on '{dag.query}': Completed {len(dag.tasks)} tasks across {len(stages)} stages. "
            f"Key metrics and insights gathered with {len(resolved_conflicts)} conflict(s) arbitrated."
        )

        # Self-verification and refinement loop
        verification = self.verify_report(summary, findings, self.memory)
        refinement_attempts = 0

        while not verification.is_valid and refinement_attempts < max_refinement_loops:
            refinement_attempts += 1
            # Refine by filtering out ungrounded findings
            findings = [f for f in findings if f not in verification.missing_aspects]
            summary = (
                f"Refined research on '{dag.query}' (Pass {refinement_attempts}): "
                f"Grounded on verified evidence. Addressed critique: {verification.critique}"
            )
            verification = self.verify_report(summary, findings, self.memory)

        overall_conf = 0.95 if verification.is_valid else 0.65
        if resolved_conflicts:
            overall_conf = min(overall_conf, max(c.confidence for c in resolved_conflicts))

        return ResearchReport(
            query=dag.query,
            executive_summary=summary,
            findings=findings,
            resolved_conflicts=resolved_conflicts,
            verification=verification,
            execution_stages=stages,
            overall_confidence=round(overall_conf, 3),
        )
