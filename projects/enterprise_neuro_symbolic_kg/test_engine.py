"""Unit and integration test suite for Enterprise Neuro-Symbolic Knowledge Graph."""

import pytest

try:
    from .models import Entity, Triple, Atom, HornRule
    from .engine import NeuroSymbolicKG, extract_triples_from_text
except ImportError:
    from models import Entity, Triple, Atom, HornRule
    from engine import NeuroSymbolicKG, extract_triples_from_text


def test_extract_triples_from_unstructured_text():
    corpus = (
        "Acme Corp acquired CyberDyne Systems. "
        "CyberDyne Systems is a subsidiary of Acme Corp; "
        "Alice Chen manages Project Apollo. "
        "Project Apollo uses AWS GovCloud. "
        "AWS GovCloud complies with SOC2 Type II."
    )
    triples = extract_triples_from_text(corpus)

    assert len(triples) >= 4
    predicates = {t.predicate for t in triples}
    assert "acquired" in predicates
    assert "subsidiary_of" in predicates
    assert "manages" in predicates
    assert "uses" in predicates
    assert "complies_with" in predicates

    # Check entity normalization
    acme_acq = next(t for t in triples if t.predicate == "acquired")
    assert acme_acq.subject == "Acme Corp"
    assert acme_acq.object == "CyberDyne Systems"
    assert acme_acq.confidence >= 0.90
    assert acme_acq.source == "extracted"


def test_add_entity_and_triple_indexing():
    kg = NeuroSymbolicKG()
    ent1 = Entity(id="AcmeCorp", name="Acme Corp", entity_type="Enterprise")
    ent2 = Entity(id="BetaLabs", name="Beta Labs", entity_type="Subsidiary")

    kg.add_entity(ent1)
    kg.add_entity(ent2)

    triple = Triple(subject="AcmeCorp", predicate="owns", object="BetaLabs")
    inserted = kg.add_triple(triple)
    assert inserted is True

    # Duplicate insertion should return False
    duplicate = kg.add_triple(triple)
    assert duplicate is False

    # Check adjacency structures
    assert len(kg.adj["AcmeCorp"]) == 1
    assert kg.adj["AcmeCorp"][0].object == "BetaLabs"
    assert len(kg.inv_adj["BetaLabs"]) == 1
    assert kg.inv_adj["BetaLabs"][0].subject == "AcmeCorp"


def test_k_hop_bfs_traversal_and_cycles():
    kg = NeuroSymbolicKG()
    # A -> B -> C -> D and cycle D -> A
    kg.add_triple(Triple(subject="NodeA", predicate="links_to", object="NodeB"))
    kg.add_triple(Triple(subject="NodeB", predicate="links_to", object="NodeC"))
    kg.add_triple(Triple(subject="NodeC", predicate="links_to", object="NodeD"))
    kg.add_triple(Triple(subject="NodeD", predicate="links_to", object="NodeA"))  # Cycle

    # 1 hop
    res_1 = kg.k_hop_bfs("NodeA", k=1)
    assert "NodeA" in res_1.visited_nodes
    assert "NodeB" in res_1.visited_nodes
    assert "NodeC" not in res_1.visited_nodes
    assert len(res_1.visited_edges) == 1

    # 2 hops
    res_2 = kg.k_hop_bfs("NodeA", k=2)
    assert set(res_2.visited_nodes) == {"NodeA", "NodeB", "NodeC"}
    assert len(res_2.visited_edges) == 2

    # 3 hops (touches D)
    res_3 = kg.k_hop_bfs("NodeA", k=3)
    assert set(res_3.visited_nodes) == {"NodeA", "NodeB", "NodeC", "NodeD"}
    assert any(p.total_hops == 3 for p in res_3.paths)

    # Predicate filter
    kg.add_triple(Triple(subject="NodeA", predicate="audits", object="NodeZ"))
    res_filtered = kg.k_hop_bfs("NodeA", k=1, filter_predicates=["links_to"])
    assert "NodeZ" not in res_filtered.visited_nodes


def test_horn_rule_transitive_inference():
    kg = NeuroSymbolicKG()
    # A is subsidiary of B, B is subsidiary of C -> A is subsidiary of C
    kg.add_triple(Triple(subject="SubEntity", predicate="subsidiary_of", object="MidCorp"))
    kg.add_triple(Triple(subject="MidCorp", predicate="subsidiary_of", object="GlobalHolding"))

    rule = HornRule(
        name="TransitiveSubsidiary",
        head=Atom(predicate="subsidiary_of", subject_var="X", object_var="Z"),
        body=[
            Atom(predicate="subsidiary_of", subject_var="X", object_var="Y"),
            Atom(predicate="subsidiary_of", subject_var="Y", object_var="Z"),
        ],
        description="If X is subsidiary of Y and Y of Z, then X is subsidiary of Z"
    )
    kg.add_rule(rule)

    inferred = kg.forward_chain_inference(max_iterations=3)
    assert len(inferred) == 1
    assert inferred[0].triple.subject == "SubEntity"
    assert inferred[0].triple.predicate == "subsidiary_of"
    assert inferred[0].triple.object == "GlobalHolding"
    assert inferred[0].rule_name == "TransitiveSubsidiary"
    assert len(inferred[0].premises) == 2


def test_horn_rule_enterprise_compliance_composition():
    kg = NeuroSymbolicKG()
    kg.add_triple(Triple(subject="FinApp", predicate="uses", object="SecureStorage"))
    kg.add_triple(Triple(subject="SecureStorage", predicate="complies_with", object="HIPAA"))

    # Rule: uses(X, Y) ^ complies_with(Y, Z) -> compliant_via(X, Z)
    rule = HornRule(
        name="ComplianceInheritance",
        head=Atom(predicate="compliant_via", subject_var="X", object_var="Z"),
        body=[
            Atom(predicate="uses", subject_var="X", object_var="Y"),
            Atom(predicate="complies_with", subject_var="Y", object_var="Z"),
        ]
    )
    kg.add_rule(rule)

    facts = kg.forward_chain_inference()
    assert len(facts) == 1
    assert facts[0].triple.subject == "FinApp"
    assert facts[0].triple.predicate == "compliant_via"
    assert facts[0].triple.object == "HIPAA"
    assert facts[0].triple.source == "inferred"


def test_horn_rule_cycle_fixpoint_termination():
    kg = NeuroSymbolicKG()
    # Symmetric rule: partner_of(X, Y) -> partner_of(Y, X)
    kg.add_triple(Triple(subject="OrgA", predicate="partner_of", object="OrgB"))

    sym_rule = HornRule(
        name="SymmetricPartner",
        head=Atom(predicate="partner_of", subject_var="Y", object_var="X"),
        body=[Atom(predicate="partner_of", subject_var="X", object_var="Y")]
    )
    kg.add_rule(sym_rule)

    # First run derives OrgB partner_of OrgA. Second run stops because it is a fixpoint!
    facts = kg.forward_chain_inference(max_iterations=10)
    assert len(facts) == 1
    assert facts[0].triple.subject == "OrgB"
    assert facts[0].triple.object == "OrgA"

    # Subsequent run derives 0 new facts
    subsequent = kg.forward_chain_inference(max_iterations=5)
    assert len(subsequent) == 0


def test_semantic_entity_matching():
    kg = NeuroSymbolicKG()
    kg.add_entity(Entity(
        id="AWS_GovCloud",
        name="AWS GovCloud US",
        entity_type="CloudPlatform",
        description="FedRAMP high compliant cloud environment"
    ))
    kg.add_entity(Entity(
        id="Azure_Commercial",
        name="Microsoft Azure Commercial",
        entity_type="CloudPlatform",
        description="General enterprise multi-tenant cloud"
    ))

    matches = kg.semantic_match("Looking for fedramp compliant cloud", top_k=2)
    assert len(matches) > 0
    top_entity, score = matches[0]
    assert top_entity.id == "AWS_GovCloud"
    assert score > 0.3


def test_hybrid_rag_pipeline():
    kg = NeuroSymbolicKG()
    kg.add_entity(Entity(
        id="DataStreamPlatform",
        name="DataStream Core",
        entity_type="SoftwareProduct",
        description="Real-time event processing cluster"
    ))
    kg.add_triple(Triple(subject="DataStreamPlatform", predicate="uses", object="KafkaCluster"))
    kg.add_triple(Triple(subject="KafkaCluster", predicate="complies_with", object="SOC2"))

    rule = HornRule(
        name="StackCompliance",
        head=Atom(predicate="inherits_compliance", subject_var="A", object_var="B"),
        body=[
            Atom(predicate="uses", subject_var="A", object_var="M"),
            Atom(predicate="complies_with", subject_var="M", object_var="B"),
        ]
    )
    kg.add_rule(rule)
    kg.forward_chain_inference()

    result = kg.hybrid_retrieve("DataStream Core compliance", top_k_entities=1, k_hops=2)

    assert result.query == "DataStream Core compliance"
    assert len(result.seed_entities) == 1
    assert result.seed_entities[0].id == "DataStreamPlatform"
    assert len(result.explicit_triples) >= 1
    assert len(result.inferred_facts) >= 1
    assert "Identified Entities" in result.fused_context
    assert "Neuro-Symbolic Inferred Entailments" in result.fused_context
    assert "inherits_compliance" in result.fused_context
    assert result.retrieval_latency_ms >= 0.0


def test_edge_cases_empty_and_unknown_entities():
    kg = NeuroSymbolicKG()
    # Traversal on empty graph
    empty_trav = kg.k_hop_bfs("UnknownEntity", k=2)
    assert empty_trav.visited_nodes == []
    assert empty_trav.visited_edges == []

    # Semantic match on empty graph
    matches = kg.semantic_match("Random query", top_k=5)
    assert matches == []

    # Hybrid RAG on empty graph
    rag_res = kg.hybrid_retrieve("Nothing here", top_k_entities=2, k_hops=2)
    assert rag_res.seed_entities == []
    assert rag_res.explicit_triples == []
    assert "*No direct entity matches found.*" in rag_res.fused_context
