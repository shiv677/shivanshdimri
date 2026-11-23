import argparse
import json
import sys
from pathlib import Path

try:
    from .graph import KnowledgeGraphStore
except ImportError:
    from graph import KnowledgeGraphStore


def run_query(data_path: Path, query: str, k_hops: int = 2, max_nodes: int = 15):
    if not data_path.exists():
        print(f"Error: Knowledge graph file not found at {data_path}", file=sys.stderr)
        sys.exit(1)

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    store = KnowledgeGraphStore()
    store.load_from_dict(data)

    context = store.retrieve(query, k_hops=k_hops, max_nodes=max_nodes)

    print("=" * 80)
    print("Graph RAG Subgraph Context Retrieval Report")
    print("=" * 80)
    print(f"Query:            {query}")
    print(f"Graph Entities:   {len(store.entities)}")
    print(f"Seed Entities:    {', '.join(context.seed_entities) if context.seed_entities else 'None'}")
    print(f"Traversed Nodes:  {len(context.traversed_nodes)}")
    print(f"Traversed Triples:{len(context.traversed_triples)}")
    print(f"Discovered Paths: {len(context.paths)}")
    print("-" * 80)
    print(context.formatted_markdown)
    print("=" * 80)
    return context


def main():
    default_data = Path(__file__).parent / "sample_knowledge_graph.json"
    parser = argparse.ArgumentParser(description="Query Knowledge Graph and Extract RAG Subgraph Context.")
    parser.add_argument("--query", type=str, default="How does Kubernetes persist state and consensus?", help="Search query")
    parser.add_argument("--k-hops", type=int, default=2, help="K-hop traversal radius (default: 2)")
    parser.add_argument("--max-nodes", type=int, default=15, help="Maximum nodes to expand (default: 15)")
    parser.add_argument("--data", type=Path, default=default_data, help="Path to knowledge graph JSON")
    args = parser.parse_args()

    run_query(args.data, args.query, k_hops=args.k_hops, max_nodes=args.max_nodes)


if __name__ == "__main__":
    main()
