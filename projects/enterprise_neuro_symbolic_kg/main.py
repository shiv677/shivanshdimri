"""CLI driver and benchmark for Enterprise Neuro-Symbolic Knowledge Graph."""

import argparse
import sys
import time
from pathlib import Path

current_dir = str(Path(__file__).resolve().parent)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from .models import Entity, Triple, Atom, HornRule
    from .engine import NeuroSymbolicKG, extract_triples_from_text
except ImportError:
    from models import Entity, Triple, Atom, HornRule
    from engine import NeuroSymbolicKG, extract_triples_from_text


SAMPLE_ENTERPRISE_TEXTS = [
    "MegaCorp Global acquired Horizon Cloud Inc in 2024.",
    "Horizon Cloud Inc is a subsidiary of MegaCorp Global.",
    "CloudNexus is a subsidiary of Horizon Cloud Inc.",
    "FinanceHub is a subsidiary of CloudNexus.",
    "DataEngine Core uses Horizon Cloud Inc.",
    "Horizon Cloud Inc complies with SOC2 Type II.",
    "Horizon Cloud Inc complies with ISO27001.",
    "Elena Rostova manages Horizon Cloud Inc.",
    "Marcus Vance reports to Elena Rostova.",
    "FinTech Compliance Board regulates MegaCorp Global.",
]

ENTERPRISE_RULES = [
    HornRule(
        name="TransitiveSubsidiaryOwnership",
        head=Atom(predicate="subsidiary_of", subject_var="X", object_var="Z"),
        body=[
            Atom(predicate="subsidiary_of", subject_var="X", object_var="Y"),
            Atom(predicate="subsidiary_of", subject_var="Y", object_var="Z"),
        ],
        description="If X is subsidiary of Y and Y is subsidiary of Z, X is subsidiary of Z."
    ),
    HornRule(
        name="InfrastructureComplianceInheritance",
        head=Atom(predicate="inherits_compliance", subject_var="App", object_var="Standard"),
        body=[
            Atom(predicate="uses", subject_var="App", object_var="Infra"),
            Atom(predicate="complies_with", subject_var="Infra", object_var="Standard"),
        ],
        description="If an application uses infrastructure certified under Standard, it inherits compliance."
    ),
    HornRule(
        name="ManagementOversightCascade",
        head=Atom(predicate="oversees", subject_var="Manager", object_var="Subordinate"),
        body=[
            Atom(predicate="manages", subject_var="Manager", object_var="Org"),
            Atom(predicate="reports_to", subject_var="Subordinate", object_var="Manager"),
        ],
        description="Managers oversee subordinates reporting to them within their managed organizations."
    )
]


def build_enterprise_knowledge_base() -> NeuroSymbolicKG:
    kg = NeuroSymbolicKG()

    # Pre-populate known entities with rich metadata
    entities = [
        Entity(id="MegaCorp Global", name="MegaCorp Global", entity_type="HoldingCompany", description="Global multinational enterprise conglomerate"),
        Entity(id="Horizon Cloud Inc", name="Horizon Cloud Inc", entity_type="CloudProvider", description="Enterprise tier-4 hybrid cloud infrastructure"),
        Entity(id="CloudNexus", name="CloudNexus", entity_type="SaaSPlatform", description="Multi-region Kubernetes deployment orchestrator"),
        Entity(id="FinanceHub", name="FinanceHub", entity_type="FintechApp", description="High-frequency payment clearing pipeline"),
        Entity(id="DataEngine Core", name="DataEngine Core", entity_type="AnalyticsEngine", description="Petabyte-scale distributed vector analytics engine"),
        Entity(id="SOC2 Type II", name="SOC2 Type II", entity_type="SecurityStandard", description="AICPA Trust Services Criteria for security and availability"),
        Entity(id="ISO27001", name="ISO27001", entity_type="SecurityStandard", description="International information security management standard"),
        Entity(id="Elena Rostova", name="Elena Rostova", entity_type="Executive", description="Chief Information Security Officer and Head of Platform"),
        Entity(id="Marcus Vance", name="Marcus Vance", entity_type="PrincipalEngineer", description="Lead Systems Architect for Cloud Security"),
    ]
    for ent in entities:
        kg.add_entity(ent)

    # Ingest text corpus via NLP pattern extraction
    for text in SAMPLE_ENTERPRISE_TEXTS:
        triples = extract_triples_from_text(text)
        for t in triples:
            kg.add_triple(t)

    # Register Horn inference rules
    for rule in ENTERPRISE_RULES:
        kg.add_rule(rule)

    return kg


def run_benchmark(iterations: int = 100) -> None:
    print("=" * 80)
    print("Enterprise Neuro-Symbolic Knowledge Graph: Performance Benchmark")
    print("=" * 80)

    kg = build_enterprise_knowledge_base()

    # 1. Triple Extraction Benchmark
    t0 = time.perf_counter()
    extracted_total = 0
    for _ in range(iterations):
        for text in SAMPLE_ENTERPRISE_TEXTS:
            extracted_total += len(extract_triples_from_text(text))
    extract_time = (time.perf_counter() - t0) * 1000.0 / iterations
    print(f"[*] Text Triple Extraction: {extract_time:.3f} ms / batch ({extracted_total // iterations} triples extracted)")

    # 2. Forward Chaining Horn Clause Inference
    t0 = time.perf_counter()
    inferred_facts = kg.forward_chain_inference(max_iterations=5)
    inference_time = (time.perf_counter() - t0) * 1000.0
    print(f"[*] Forward Chaining Inference: {inference_time:.3f} ms (derived {len(inferred_facts)} entailed facts)")
    for fact in inferred_facts:
        t = fact.triple
        print(f"    - Entailed: ({t.subject} --[{t.predicate}]--> {t.object}) via Rule '{fact.rule_name}'")

    # 3. K-Hop BFS Graph Traversal
    for k in (1, 2, 3):
        t0 = time.perf_counter()
        for _ in range(iterations):
            trav = kg.k_hop_bfs("MegaCorp Global", k=k)
        trav_time = (time.perf_counter() - t0) * 1000.0 / iterations
        print(f"[*] {k}-Hop BFS Traversal (MegaCorp Global): {trav_time:.3f} ms ({len(trav.visited_nodes)} nodes, {len(trav.visited_edges)} edges)")

    # 4. Hybrid RAG Retrieval Benchmark
    query = "Which regulatory standards apply to DataEngine Core infrastructure?"
    t0 = time.perf_counter()
    rag_result = kg.hybrid_retrieve(query, top_k_entities=2, k_hops=2)
    rag_time = (time.perf_counter() - t0) * 1000.0
    print(f"[*] Hybrid RAG Retrieval: {rag_time:.3f} ms ({len(rag_result.explicit_triples)} explicit, {len(rag_result.inferred_facts)} inferred)")
    print("-" * 80)
    print("Generated LLM Context Preview:")
    print("-" * 80)
    print(rag_result.fused_context)
    print("=" * 80)


def main() -> None:
    parser = argparse.ArgumentParser(description="Enterprise Neuro-Symbolic Knowledge Graph Engine")
    parser.add_argument("--query", type=str, default="Which regulatory standards apply to DataEngine Core?", help="Hybrid RAG query")
    parser.add_argument("--k-hops", type=int, default=2, help="K-hop BFS expansion depth (default: 2)")
    parser.add_argument("--benchmark", action="store_true", help="Execute microbenchmark run")
    parser.add_argument("--iterations", type=int, default=50, help="Benchmark iterations")
    args = parser.parse_args()

    if args.benchmark:
        run_benchmark(iterations=args.iterations)
        return

    kg = build_enterprise_knowledge_base()
    inferred = kg.forward_chain_inference()
    result = kg.hybrid_retrieve(args.query, k_hops=args.k_hops)

    print("=" * 80)
    print(f"Enterprise Neuro-Symbolic KG - Query: \"{args.query}\"")
    print(f"Total Graph Entities: {len(kg.entities)} | Explicit Triples: {len(kg.triples) - len(inferred)} | Inferred: {len(inferred)}")
    print(f"Retrieval Latency: {result.retrieval_latency_ms:.2f} ms")
    print("=" * 80)
    print(result.fused_context)
    print("=" * 80)


if __name__ == "__main__":
    main()
