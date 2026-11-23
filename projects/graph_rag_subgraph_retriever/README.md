# Local Graph RAG Subgraph Retriever

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Pydantic v2](https://img.shields.io/badge/Pydantic-v2.13-green.svg)](https://docs.pydantic.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](test_graph_rag.py)

A high-performance local Graph RAG engine featuring entity-relation extraction, inverted indexing, bidirectional k-hop BFS expansion with edge weighting, and structured markdown synthesis for LLM prompt context injection.

---

## Architecture Overview

```
                      ┌────────────────────────────────┐
                      │          User Query            │
                      │  "How does K8s persist state?" │
                      └───────────────┬────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │     Inverted Index & Fuzzy     │
                      │    Entity Resolution (Seeds)   │
                      └───────────────┬────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │   Bidirectional k-Hop BFS      │
                      │    Forward & Reverse Edges     │
                      │    Weight-Prioritized Queue    │
                      └───────────────┬────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │    Context Window Synthesizer  │
                      │    Markdown Knowledge Triple   │
                      │    Prompt-Ready Formatter      │
                      └────────────────────────────────┘
```

---

## Features

- **Pydantic v2 Knowledge Models**: Strict data models for `Entity`, `RelationTriple`, `SubgraphPath`, and `RetrievalContext`.
- **Inverted Index & Fuzzy Matching**: Fast token indexing coupled with `SequenceMatcher` for typo-tolerant entity resolution.
- **Bidirectional k-Hop Traversal**: Traverses both outgoing dependencies (`forward_edges`) and reverse dependencies (`reverse_edges`) up to configurable radii with cycle suppression.
- **Edge Weighting & Path Tracking**: Prioritizes higher-weighted relational edges during graph exploration.
- **Markdown Context Formatter**: Automatically generates clean markdown knowledge cards ready for direct LLM system prompt injection.

---

## CLI Usage

```bash
python projects/graph_rag_subgraph_retriever/main.py --query "How does Kubernetes persist state and consensus?" --k-hops 2
```

## Running Tests

```bash
pytest projects/graph_rag_subgraph_retriever
```
