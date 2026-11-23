import sys
from pathlib import Path
import pytest
from pydantic import ValidationError

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

try:
    from projects.graph_rag_subgraph_retriever.models import (
        Entity,
        RelationTriple,
        SubgraphPath,
        RetrievalContext,
    )
    from projects.graph_rag_subgraph_retriever.graph import KnowledgeGraphStore
    from projects.graph_rag_subgraph_retriever.main import run_query
except ImportError:
    from models import (
        Entity,
        RelationTriple,
        SubgraphPath,
        RetrievalContext,
    )
    from graph import KnowledgeGraphStore
    from main import run_query


def test_models_validation():
    # Valid entity
    ent = Entity(id="ent_1", name="PostgreSQL", entity_type="Database", description="Relational DB")
    assert ent.id == "ent_1"
    assert ent.properties == {}

    # Valid triple
    triple = RelationTriple(subject="ent_1", predicate="supports", object="ent_2", weight=0.9)
    assert triple.weight == 0.9

    # Negative weight should fail
    with pytest.raises(ValidationError):
        RelationTriple(subject="ent_1", predicate="supports", object="ent_2", weight=-0.5)


def test_inverted_index_and_entity_addition():
    store = KnowledgeGraphStore()
    ent = Entity(
        id="ent_redis",
        name="Redis Cache",
        entity_type="Datastore",
        description="High speed in-memory key value store",
    )
    store.add_entity(ent)

    assert "ent_redis" in store.entities
    assert "redis" in store.inverted_index
    assert "cache" in store.inverted_index
    assert "datastore" in store.inverted_index
    assert "ent_redis" in store.inverted_index["redis"]


def test_fuzzy_entity_resolution():
    store = KnowledgeGraphStore()
    store.add_entity(Entity(id="ent_raft", name="Raft Consensus", entity_type="Protocol"))
    store.add_entity(Entity(id="ent_paxos", name="Paxos Protocol", entity_type="Protocol"))
    store.add_entity(Entity(id="ent_kafka", name="Apache Kafka", entity_type="EventLog"))

    # Exact token query
    results = store.search_entities("raft")
    assert len(results) > 0
    assert results[0].id == "ent_raft"

    # Fuzzy match with typo
    results_fuzzy = store.search_entities("apche kafk", threshold=0.5)
    assert len(results_fuzzy) > 0
    assert results_fuzzy[0].id == "ent_kafka"


def test_bidirectional_subgraph_traversal():
    store = KnowledgeGraphStore()
    # A -> B -> C
    store.add_entity(Entity(id="A", name="Node A", entity_type="T"))
    store.add_entity(Entity(id="B", name="Node B", entity_type="T"))
    store.add_entity(Entity(id="C", name="Node C", entity_type="T"))

    store.add_triple(RelationTriple(subject="A", predicate="connects_to", object="B", weight=1.0))
    store.add_triple(RelationTriple(subject="B", predicate="connects_to", object="C", weight=0.8))

    # 1-hop traversal from B should reach both A (reverse) and C (forward)
    nodes, triples, paths = store.traverse_subgraph(["B"], k_hops=1, max_nodes=10)
    node_ids = {n.id for n in nodes}
    assert "A" in node_ids
    assert "B" in node_ids
    assert "C" in node_ids
    assert len(triples) == 2


def test_cycle_handling_and_hop_limits():
    store = KnowledgeGraphStore()
    # Triangle cycle: A -> B -> C -> A
    store.add_entity(Entity(id="A", name="Node A", entity_type="T"))
    store.add_entity(Entity(id="B", name="Node B", entity_type="T"))
    store.add_entity(Entity(id="C", name="Node C", entity_type="T"))

    store.add_triple(RelationTriple(subject="A", predicate="to", object="B"))
    store.add_triple(RelationTriple(subject="B", predicate="to", object="C"))
    store.add_triple(RelationTriple(subject="C", predicate="to", object="A"))

    # Traversal should terminate without infinite loop
    nodes, triples, paths = store.traverse_subgraph(["A"], k_hops=3, max_nodes=5)
    assert len(nodes) == 3
    assert len(triples) == 3


def test_edge_weighting_and_path_generation():
    store = KnowledgeGraphStore()
    store.add_entity(Entity(id="X", name="Source", entity_type="T"))
    store.add_entity(Entity(id="Y1", name="Heavy Target", entity_type="T"))
    store.add_entity(Entity(id="Y2", name="Light Target", entity_type="T"))

    store.add_triple(RelationTriple(subject="X", predicate="heavy", object="Y1", weight=2.5))
    store.add_triple(RelationTriple(subject="X", predicate="light", object="Y2", weight=0.5))

    nodes, triples, paths = store.traverse_subgraph(["X"], k_hops=1, max_nodes=10)
    assert len(paths) >= 2
    # Verify path weights
    path_weights = [p.total_weight for p in paths]
    assert 2.5 in path_weights
    assert 0.5 in path_weights


def test_markdown_context_synthesis():
    store = KnowledgeGraphStore()
    e1 = Entity(id="k8s", name="Kubernetes", entity_type="Platform", description="Container engine")
    e2 = Entity(id="etcd", name="etcd", entity_type="Datastore", description="Distributed KV")
    store.add_entity(e1)
    store.add_entity(e2)
    t = RelationTriple(subject="k8s", predicate="uses", object="etcd", weight=0.9)
    store.add_triple(t)

    md = store.format_markdown_context("k8s persistence", [e1], [e1, e2], [t])
    assert "### Graph RAG Subgraph Context" in md
    assert "Kubernetes" in md
    assert "etcd" in md
    assert "uses" in md


def test_end_to_end_sample_knowledge_graph_fixture():
    sample_path = Path(__file__).parent / "sample_knowledge_graph.json"
    context = run_query(sample_path, "Kubernetes Raft consensus", k_hops=2, max_nodes=10)

    assert context.query == "Kubernetes Raft consensus"
    assert len(context.seed_entities) > 0
    assert len(context.traversed_nodes) >= 2
    assert len(context.traversed_triples) > 0
    assert "Graph RAG Subgraph Context" in context.formatted_markdown
