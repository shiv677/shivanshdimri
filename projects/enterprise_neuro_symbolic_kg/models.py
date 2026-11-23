"""Domain models and schemas for Enterprise Neuro-Symbolic Knowledge Graph."""

from typing import Any
from pydantic import BaseModel, Field


class Entity(BaseModel):
    """An entity node in the knowledge graph."""
    id: str
    name: str
    entity_type: str = "Unknown"
    description: str = ""
    properties: dict[str, Any] = Field(default_factory=dict)


class Triple(BaseModel):
    """A directed semantic relation triple: (subject, predicate, object)."""
    subject: str
    predicate: str
    object: str
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    source: str = "explicit"  # "explicit", "extracted", "inferred"
    metadata: dict[str, Any] = Field(default_factory=dict)


class Atom(BaseModel):
    """An atomic first-order logic formula: predicate(subject_var, object_var)."""
    predicate: str
    subject_var: str
    object_var: str


class HornRule(BaseModel):
    """A definite Horn clause: body_1 ^ body_2 ^ ... -> head."""
    name: str
    head: Atom
    body: list[Atom]
    description: str = ""


class InferredFact(BaseModel):
    """A logically derived fact with proof provenance."""
    triple: Triple
    rule_name: str
    premises: list[Triple] = Field(default_factory=list)
    iteration: int = 1


class TraversalPath(BaseModel):
    """A traversal path through the knowledge graph."""
    nodes: list[str]
    edges: list[Triple]
    total_hops: int = 0


class TraversalResult(BaseModel):
    """Result of a k-hop breadth-first search traversal."""
    start_entity: str
    k_hops: int
    visited_nodes: list[str]
    visited_edges: list[Triple]
    paths: list[TraversalPath] = Field(default_factory=list)


class HybridRAGResult(BaseModel):
    """Result of hybrid neural semantic matching and symbolic graph retrieval."""
    query: str
    seed_entities: list[Entity]
    explicit_triples: list[Triple]
    inferred_facts: list[InferredFact]
    subgraph_paths: list[TraversalPath] = Field(default_factory=list)
    fused_context: str
    retrieval_latency_ms: float = 0.0
