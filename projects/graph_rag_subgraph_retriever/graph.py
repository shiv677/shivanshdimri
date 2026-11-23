import difflib
import re
from collections import deque
from typing import Any

try:
    from .models import Entity, RelationTriple, SubgraphPath, RetrievalContext
except ImportError:
    from models import Entity, RelationTriple, SubgraphPath, RetrievalContext


def _tokenize(text: str) -> list[str]:
    """Tokenize string into lowercase alphanumeric tokens."""
    return re.findall(r"[a-zA-Z0-9_-]+", text.lower())


class KnowledgeGraphStore:
    """In-memory triple store with inverted index and k-hop subgraph traversal."""

    def __init__(self):
        self.entities: dict[str, Entity] = {}
        self.forward_edges: dict[str, list[RelationTriple]] = {}
        self.reverse_edges: dict[str, list[RelationTriple]] = {}
        self.inverted_index: dict[str, set[str]] = {}

    def add_entity(self, entity: Entity) -> None:
        """Stores an entity and updates the inverted index."""
        self.entities[entity.id] = entity
        if entity.id not in self.forward_edges:
            self.forward_edges[entity.id] = []
        if entity.id not in self.reverse_edges:
            self.reverse_edges[entity.id] = []

        tokens = set(_tokenize(entity.name) + _tokenize(entity.id) + _tokenize(entity.entity_type) + _tokenize(entity.description))
        for token in tokens:
            if token not in self.inverted_index:
                self.inverted_index[token] = set()
            self.inverted_index[token].add(entity.id)

    def add_triple(self, triple: RelationTriple) -> None:
        """Registers a directional relation triple in the graph."""
        if triple.subject not in self.forward_edges:
            self.forward_edges[triple.subject] = []
        if triple.object not in self.reverse_edges:
            self.reverse_edges[triple.object] = []

        self.forward_edges[triple.subject].append(triple)
        self.reverse_edges[triple.object].append(triple)

    def load_from_dict(self, data: dict[str, Any]) -> None:
        """Loads entities and relations from a dictionary structure."""
        for ent_data in data.get("entities", []):
            self.add_entity(Entity(**ent_data))
        for rel_data in data.get("triples", []):
            self.add_triple(RelationTriple(**rel_data))

    def search_entities(self, query: str, threshold: float = 0.5, limit: int = 5) -> list[Entity]:
        """Performs token-based inverted index and fuzzy entity resolution."""
        query_tokens = set(_tokenize(query))
        candidate_ids: set[str] = set()

        for token in query_tokens:
            if token in self.inverted_index:
                candidate_ids.update(self.inverted_index[token])

        scored: list[tuple[float, Entity]] = []
        pool_ids = candidate_ids if candidate_ids else set(self.entities.keys())

        for ent_id in pool_ids:
            ent = self.entities[ent_id]
            ent_name_tokens = set(_tokenize(ent.name))
            ent_id_tokens = set(_tokenize(ent.id))
            all_ent_tokens = ent_name_tokens | ent_id_tokens

            # Exact token containment of entity name in query
            if ent_name_tokens and ent_name_tokens.issubset(query_tokens):
                name_containment = 1.0
            elif ent_name_tokens:
                name_containment = len(query_tokens & ent_name_tokens) / len(ent_name_tokens)
            else:
                name_containment = 0.0

            # Fuzzy match across words in query
            best_fuzzy = 0.0
            for q_tok in query_tokens:
                for e_tok in all_ent_tokens:
                    ratio = difflib.SequenceMatcher(None, q_tok, e_tok).ratio()
                    if ratio > best_fuzzy:
                        best_fuzzy = ratio

            score = max(name_containment, best_fuzzy)
            if score >= threshold:
                scored.append((score, ent))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [ent for _, ent in scored[:limit]]

    def traverse_subgraph(
        self,
        seed_ids: list[str],
        k_hops: int = 2,
        max_nodes: int = 20,
    ) -> tuple[list[Entity], list[RelationTriple], list[SubgraphPath]]:
        """Bidirectional k-hop BFS expansion with edge weighting and cycle suppression."""
        visited_nodes: set[str] = set(seed_ids)
        collected_triples: list[RelationTriple] = []
        seen_triple_keys: set[tuple[str, str, str]] = set()
        paths: list[SubgraphPath] = []

        # Queue contains: (current_node_id, current_hop, path_nodes, path_edges, path_weight)
        queue: deque[tuple[str, int, list[str], list[RelationTriple], float]] = deque()
        for seed_id in seed_ids:
            if seed_id in self.entities:
                queue.append((seed_id, 0, [seed_id], [], 0.0))

        while queue and len(visited_nodes) < max_nodes:
            curr_id, hop, path_nodes, path_edges, path_weight = queue.popleft()

            if hop >= k_hops:
                continue

            # Collect bidirectional candidate edges
            fwd = self.forward_edges.get(curr_id, [])
            rev = self.reverse_edges.get(curr_id, [])

            # Sort by weight descending
            candidates: list[tuple[str, RelationTriple]] = []
            for t in sorted(fwd, key=lambda x: x.weight, reverse=True):
                candidates.append((t.object, t))
            for t in sorted(rev, key=lambda x: x.weight, reverse=True):
                candidates.append((t.subject, t))

            for neighbor_id, triple in candidates:
                triple_key = (triple.subject, triple.predicate, triple.object)
                if triple_key not in seen_triple_keys:
                    seen_triple_keys.add(triple_key)
                    collected_triples.append(triple)

                new_path_nodes = path_nodes + [neighbor_id]
                new_path_edges = path_edges + [triple]
                new_path_weight = path_weight + triple.weight

                paths.append(
                    SubgraphPath(
                        nodes=new_path_nodes,
                        edges=new_path_edges,
                        total_weight=round(new_path_weight, 3),
                    )
                )

                if neighbor_id not in visited_nodes and len(visited_nodes) < max_nodes:
                    visited_nodes.add(neighbor_id)
                    queue.append((neighbor_id, hop + 1, new_path_nodes, new_path_edges, new_path_weight))

        traversed_entities = [self.entities[nid] for nid in visited_nodes if nid in self.entities]
        return traversed_entities, collected_triples, paths

    def format_markdown_context(
        self,
        query: str,
        seed_entities: list[Entity],
        nodes: list[Entity],
        triples: list[RelationTriple],
    ) -> str:
        """Formats the retrieved subgraph into structured markdown for LLM context synthesis."""
        md_lines = [
            f"### Graph RAG Subgraph Context (Query: \"{query}\")",
            "",
            "#### Seed Entities:",
        ]
        if seed_entities:
            for s in seed_entities:
                md_lines.append(f"- **{s.name}** (`{s.entity_type}`): {s.description}")
        else:
            md_lines.append("- *(No direct seed entity match)*")

        md_lines.append("")
        md_lines.append(f"#### Traversed Entities ({len(nodes)}):")
        for n in nodes:
            md_lines.append(f"- **{n.name}** (`{n.entity_type}`): {n.description}")

        md_lines.append("")
        md_lines.append(f"#### Knowledge Triples ({len(triples)}):")
        if triples:
            for t in triples:
                subj_name = self.entities[t.subject].name if t.subject in self.entities else t.subject
                obj_name = self.entities[t.object].name if t.object in self.entities else t.object
                md_lines.append(f"- ({subj_name}) -[:{t.predicate} (weight={t.weight:.2f})]-> ({obj_name})")
        else:
            md_lines.append("- *(No relational triples discovered within hop limit)*")

        return "\n".join(md_lines)

    def retrieve(self, query: str, k_hops: int = 2, max_nodes: int = 20) -> RetrievalContext:
        """End-to-end Graph RAG subgraph retrieval pipeline."""
        seeds = self.search_entities(query)
        seed_ids = [s.id for s in seeds]

        nodes, triples, paths = self.traverse_subgraph(seed_ids, k_hops=k_hops, max_nodes=max_nodes)
        formatted_md = self.format_markdown_context(query, seeds, nodes, triples)

        return RetrievalContext(
            query=query,
            seed_entities=seed_ids,
            traversed_nodes=nodes,
            traversed_triples=triples,
            paths=paths,
            formatted_markdown=formatted_md,
        )
