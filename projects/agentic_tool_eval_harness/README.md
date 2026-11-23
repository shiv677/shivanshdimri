# Agentic Tool Calling & Trajectory Evaluation Harness

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Pydantic v2](https://img.shields.io/badge/Pydantic-v2.13-green.svg)](https://docs.pydantic.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](test_eval_harness.py)

A precision evaluation framework for evaluating multi-step autonomous agent trajectories for tool calling precision, argument hallucination, latency/cost budgets, and goal attainment rubrics.

---

## Architecture Overview

```
                      ┌────────────────────────────────┐
                      │    Agent Trajectory JSONL      │
                      │ [Steps, Thoughts, Tool Actions]│
                      └───────────────┬────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │     Pydantic v2 Validators     │
                      │ Strict Trajectory Schema Lock  │
                      └───────────────┬────────────────┘
                                      │
             ┌────────────────────────┼────────────────────────┐
             ▼                        ▼                        ▼
  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
  │ Fuzzy Tool Matcher   │ │ Argument Grounding   │ │ Latency & Cost       │
  │ Typo / Signature Reg │ │ Prior Context Verifier│ │ Telemetry Ledger     │
  └──────────┬───────────┘ └──────────┬───────────┘ └──────────┬───────────┘
             │                        │                        │
             └────────────────────────┼────────────────────────┘
                                      ▼
                      ┌────────────────────────────────┐
                      │      Composite Rubric Score    │
                      │   [Precision, Recall, Goal]    │
                      └────────────────────────────────┘
```

---

## Features

- **Pydantic v2 Schemas**: Type-safe validation of `ToolSignature`, `ToolCallRecord`, `TrajectoryStep`, `AgentTrajectory`, and `EvalMetricSummary`.
- **Fuzzy Tool Matching**: Identifies valid tools and detects typos or renamed functions using sequence similarity metrics.
- **Hallucinated Argument Checker**: Detects ungrounded entities, fabricated hostnames, or phantom identifiers passed into actions without prior appearance in the task goal or previous observations.
- **Latency & Cost Accounting**: Tracks cumulative token expenditures and execution latencies across multi-step plans.
- **Composite Rubric Scoring**: Computes normalized 0-1 scores balancing tool precision, tool recall, grounding rate, and goal attainment.

---

## CLI Usage

```bash
python projects/agentic_tool_eval_harness/main.py --data projects/agentic_tool_eval_harness/sample_agent_trajectories.jsonl
```

## Running Tests

```bash
pytest projects/agentic_tool_eval_harness
```
