# Multi-Agent Consensus Evaluation Engine

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Pydantic v2](https://img.shields.io/badge/Pydantic-v2.10-green.svg)](https://docs.pydantic.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](test_consensus.py)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

A high-throughput multi-agent evaluation framework that orchestrates specialized AI agents in an asynchronous debate loop to evaluate model responses against factual grounding, logical chain-of-thought progression, and strict schema grammar.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │      Candidate Model Response        │
                      └──────────────────┬───────────────────┘
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   ▼                     ▼                     ▼
       ┌───────────────────────┐ ┌───────────────┐ ┌───────────────────────┐
       │    GroundingAgent     │ │ReasoningCritic│ │    SchemaSentinel     │
       │  Context Overlap (0.4)│ │  Logic (0.4)  │ │ Strict Pydantic (0.2) │
       └───────────┬───────────┘ └───────┬───────┘ └───────────┬───────────┘
                   │                     │                     │
                   └─────────────────────┼─────────────────────┘
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    Disagreement Spread Evaluator     │
                      │  Spread > 0.35 -> Round 2 Debate     │
                      └──────────────────┬───────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
             ┌───────────────────────┐       ┌───────────────────────┐
             │ Composite Rubric Pass │       │ Human Arbiter Flagged │
             │ Final Score >= 0.70   │       │ Borderline / Polarized│
             └───────────────────────┘       └───────────────────────┘
```

---

## 3 Specialized Agents

1. **`GroundingAgent` (Weight: 40%)**:
   - Analyzes factual alignment against reference source contexts.
   - Detects hallucinated statistics, unwarranted numerical claims, and hedging disclaimers.

2. **`ReasoningCritic` (Weight: 40%)**:
   - Inspects multi-step causal connectives (`because`, `therefore`, `consequently`).
   - Flags circular reasoning and direct logical contradictions.

3. **`SchemaSentinel` (Weight: 20%)**:
   - Dynamically compiles Pydantic v2 runtime models from JSON schemas.
   - Enforces 100% strict typing, required keys, and formatting constraints.

---

## Quickstart

### 1. Requirements

```bash
pip install pydantic pytest
```

### 2. Run Single Sample Evaluation

```bash
python main.py
```

### 3. Evaluate Custom JSON Payload

```bash
python main.py --file sample_input.json --verbose
```

---

## Running Test Suite

```bash
pytest test_consensus.py -v
```

10 comprehensive unit tests validate consensus arbitration, multi-round debates, contradiction detection, and Pydantic v2 schema compilation.

---

## Author

**Shivansh Dimri**  
Associate AI Engineer — Python Engineering · AI Evaluation · Data Systems · Automation  
Website: [https://shivanshdimri.in](https://shivanshdimri.in)  
GitHub: [@shiv677](https://github.com/shiv677)  
Email: [dimrishiv933@gmail.com](mailto:dimrishiv933@gmail.com)
