from typing import Any
from pydantic import BaseModel, Field


class Entity(BaseModel):
    id: str
    name: str
    entity_type: str
    description: str = ""
    properties: dict[str, Any] = Field(default_factory=dict)


class RelationTriple(BaseModel):
    subject: str
    predicate: str
    object: str
    weight: float = Field(default=1.0, ge=0.0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class SubgraphPath(BaseModel):
    nodes: list[str]
    edges: list[RelationTriple]
    total_weight: float = 0.0


class RetrievalContext(BaseModel):
    query: str
    seed_entities: list[str]
    traversed_nodes: list[Entity]
    traversed_triples: list[RelationTriple]
    paths: list[SubgraphPath] = Field(default_factory=list)
    formatted_markdown: str
