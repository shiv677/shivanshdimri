"""Enterprise Neuro-Symbolic Knowledge Graph & Reasoning Engine."""

import re
import time
from collections import defaultdict, deque
from typing import Any

try:
    from .models import (
        Entity,
        Triple,
        Atom,
        HornRule,
        InferredFact,
        TraversalPath,
        TraversalResult,
        HybridRAGResult,
    )
except ImportError:
    from models import (
        Entity,
        Triple,
        Atom,
        HornRule,
        InferredFact,
        TraversalPath,
        TraversalResult,
        HybridRAGResult,
    )


EXTRACTION_PATTERNS: list[tuple[re.Pattern, str, float]] = [
    (re.compile(r"([A-Z][\w\s\.-]+?)\s+(?:acquired|purchased|bought)\s+([A-Z][\w\s\.-]+)", re.I), "acquired", 0.95),
    (re.compile(r"([A-Z][\w\s\.-]+?)\s+(?:is a subsidiary of|subsidiary of|owned by)\s+([A-Z][\w\s\.-]+)", re.I), "subsidiary_of", 0.96),
    (re.compile(r"([A-Z][\w\s\.-]+?)\s+(?:reports to|is managed by)\s+([A-Z][\w\s\.-]+)", re.I), "reports_to", 0.94),
    (re.compile(r"([A-Z][\w\s\.-]+?)\s+(?:manages|leads|oversees)\s+([A-Z][\w\s\.-]+)", re.I), "manages", 0.93),
    (re.compile(r"([A-Z][\w\s\.-]+?)\s+(?:uses|leverages|deploys)\s+([A-Z][\w\s\.-]+)", re.I), "uses", 0.90),
    (re.compile(r"([A-Z][\w\s\.-]+?)\s+(?:complies with|certified for|certified under|adheres to)\s+([A-Z][\w\s\.-]+)", re.I), "complies_with", 0.95),
    (re.compile(r"([A-Z][\w\s\.-]+?)\s+(?:regulates|audits)\s+([A-Z][\w\s\.-]+)", re.I), "regulates", 0.92),
    (re.compile(r"([A-Z][\w\s\.-]+?)\s+(?:partnered with|partners with|in partnership with)\s+([A-Z][\w\s\.-]+)", re.I), "partner_of", 0.91),
    (re.compile(r"([A-Z][\w\s\.-]+?)\s+(?:developed|created|built)\s+([A-Z][\w\s\.-]+)", re.I), "developed", 0.93),
]


def _clean_entity_name(text: str) -> str:
    cleaned = text.strip().strip(",.;:()\"'")
    # Remove leading common articles
    for article in ("the ", "a ", "an "):
        if cleaned.lower().startswith(article):
            cleaned = cleaned[len(article):].strip()
    return cleaned


def extract_triples_from_text(text: str) -> list[Triple]:
    """Extract relational triples from unstructured enterprise text using relation patterns."""
    extracted: list[Triple] = []
    seen: set[tuple[str, str, str]] = set()

    # Split into sentence-like clauses
    clauses = re.split(r"[.\n;]+", text)
    for clause in clauses:
        clause = clause.strip()
        if not clause:
            continue
        for pattern, predicate, conf in EXTRACTION_PATTERNS:
            match = pattern.search(clause)
            if match:
                raw_sub, raw_obj = match.group(1), match.group(2)
                sub = _clean_entity_name(raw_sub)
                obj = _clean_entity_name(raw_obj)
                if sub and obj and sub.lower() != obj.lower():
                    key = (sub, predicate, obj)
                    if key not in seen:
                        seen.add(key)
                        extracted.append(Triple(
                            subject=sub,
                            predicate=predicate,
                            object=obj,
                            confidence=conf,
                            source="extracted"
                        ))
    return extracted


def _similarity_score(query: str, target: str) -> float:
    """Calculate character and word token similarity between query and candidate text."""
    q_norm = query.lower().strip()
    t_norm = target.lower().strip()
    if not q_norm or not t_norm:
        return 0.0

    if t_norm in q_norm or q_norm in t_norm:
        ratio = min(len(t_norm), len(q_norm)) / max(len(t_norm), len(q_norm))
        return 0.8 + 0.2 * ratio

    q_words = set(re.findall(r"\w+", q_norm))
    t_words = set(re.findall(r"\w+", t_norm))
    if not q_words or not t_words:
        return 0.0

    word_jaccard = len(q_words & t_words) / len(q_words | t_words)

    # Character 3-grams
    q_trigrams = {q_norm[i:i + 3] for i in range(len(q_norm) - 2)}
    t_trigrams = {t_norm[i:i + 3] for i in range(len(t_norm) - 2)}
    char_jaccard = (
        len(q_trigrams & t_trigrams) / len(q_trigrams | t_trigrams)
        if (q_trigrams and t_trigrams) else 0.0
    )

    return 0.6 * word_jaccard + 0.4 * char_jaccard


class NeuroSymbolicKG:
    """Enterprise Knowledge Graph engine with Horn clause reasoning and Hybrid RAG retrieval."""

    def __init__(self) -> None:
        self.entities: dict[str, Entity] = {}
        self.triples: list[Triple] = []
        self._triple_keys: set[tuple[str, str, str]] = set()
        self.adj: dict[str, list[Triple]] = defaultdict(list)
        self.inv_adj: dict[str, list[Triple]] = defaultdict(list)
        self.rules: list[HornRule] = []
        self.inferred_facts: list[InferredFact] = []

    def add_entity(self, entity: Entity) -> None:
        """Add or update an entity node."""
        self.entities[entity.id] = entity

    def get_or_create_entity(self, entity_id: str, default_type: str = "EnterpriseEntity") -> Entity:
        """Fetch existing entity or initialize a stub node."""
        if entity_id in self.entities:
            return self.entities[entity_id]
        ent = Entity(id=entity_id, name=entity_id, entity_type=default_type)
        self.entities[entity_id] = ent
        return ent

    def add_triple(self, triple: Triple) -> bool:
        """Add a triple to the graph index. Returns True if inserted, False if already present."""
        key = (triple.subject, triple.predicate, triple.object)
        if key in self._triple_keys:
            return False

        self._triple_keys.add(key)
        self.triples.append(triple)
        self.adj[triple.subject].append(triple)
        self.inv_adj[triple.object].append(triple)

        # Ensure node stubs exist
        self.get_or_create_entity(triple.subject)
        self.get_or_create_entity(triple.object)
        return True

    def add_rule(self, rule: HornRule) -> None:
        """Register a Horn clause inference rule."""
        self.rules.append(rule)

    def k_hop_bfs(
        self,
        start_entity: str,
        k: int = 2,
        filter_predicates: list[str] | None = None,
    ) -> TraversalResult:
        """Traverse graph outward from start_entity up to k hops using breadth-first search."""
        if start_entity not in self.entities and start_entity not in self.adj:
            return TraversalResult(
                start_entity=start_entity,
                k_hops=k,
                visited_nodes=[],
                visited_edges=[],
                paths=[]
            )

        visited_nodes: set[str] = {start_entity}
        visited_edges: list[Triple] = []
        seen_edges: set[tuple[str, str, str]] = set()
        paths: list[TraversalPath] = []

        # Queue contains (current_node, hops_traversed, path_nodes, path_edges)
        queue: deque[tuple[str, int, list[str], list[Triple]]] = deque([
            (start_entity, 0, [start_entity], [])
        ])

        while queue:
            curr_node, hops, path_nodes, path_edges = queue.popleft()
            if hops >= k:
                continue

            for edge in self.adj.get(curr_node, []):
                if filter_predicates and edge.predicate not in filter_predicates:
                    continue

                edge_key = (edge.subject, edge.predicate, edge.object)
                if edge_key not in seen_edges:
                    seen_edges.add(edge_key)
                    visited_edges.append(edge)

                next_node = edge.object
                visited_nodes.add(next_node)
                next_path_nodes = path_nodes + [next_node]
                next_path_edges = path_edges + [edge]

                paths.append(TraversalPath(
                    nodes=next_path_nodes,
                    edges=next_path_edges,
                    total_hops=hops + 1
                ))

                # Avoid cycle loops along current traversal path
                if next_node not in path_nodes:
                    queue.append((next_node, hops + 1, next_path_nodes, next_path_edges))

        return TraversalResult(
            start_entity=start_entity,
            k_hops=k,
            visited_nodes=list(visited_nodes),
            visited_edges=visited_edges,
            paths=paths
        )

    def forward_chain_inference(self, max_iterations: int = 5) -> list[InferredFact]:
        """Apply Horn clause rules iteratively until fixpoint is reached or max_iterations hit."""
        all_new_facts: list[InferredFact] = []

        for iteration in range(1, max_iterations + 1):
            iteration_facts: list[InferredFact] = []

            # Group triples by predicate for fast atom lookup
            triples_by_pred: dict[str, list[Triple]] = defaultdict(list)
            for t in self.triples:
                triples_by_pred[t.predicate].append(t)

            for rule in self.rules:
                matches = self._evaluate_horn_rule(rule, triples_by_pred)
                for inferred_triple, premises in matches:
                    key = (inferred_triple.subject, inferred_triple.predicate, inferred_triple.object)
                    if key not in self._triple_keys:
                        fact = InferredFact(
                            triple=inferred_triple,
                            rule_name=rule.name,
                            premises=premises,
                            iteration=iteration
                        )
                        iteration_facts.append(fact)

            if not iteration_facts:
                break

            for fact in iteration_facts:
                if self.add_triple(fact.triple):
                    self.inferred_facts.append(fact)
                    all_new_facts.append(fact)

        return all_new_facts

    def _evaluate_horn_rule(
        self,
        rule: HornRule,
        triples_by_pred: dict[str, list[Triple]]
    ) -> list[tuple[Triple, list[Triple]]]:
        """Unify variables across body atoms to derive new entailed head triples."""
        results: list[tuple[Triple, list[Triple]]] = []

        def match_atoms(
            atom_idx: int,
            bindings: dict[str, str],
            matched_triples: list[Triple]
        ) -> None:
            if atom_idx == len(rule.body):
                # All body clauses satisfied: bind head variables
                sub_val = bindings.get(rule.head.subject_var)
                obj_val = bindings.get(rule.head.object_var)
                if sub_val and obj_val and sub_val != obj_val:
                    conf = min((t.confidence for t in matched_triples), default=1.0) * 0.95
                    new_triple = Triple(
                        subject=sub_val,
                        predicate=rule.head.predicate,
                        object=obj_val,
                        confidence=round(conf, 3),
                        source="inferred",
                        metadata={"rule": rule.name}
                    )
                    results.append((new_triple, list(matched_triples)))
                return

            atom = rule.body[atom_idx]
            candidates = triples_by_pred.get(atom.predicate, [])
            for cand in candidates:
                # Subject variable check
                s_var = atom.subject_var
                if s_var in bindings and bindings[s_var] != cand.subject:
                    continue

                # Object variable check
                o_var = atom.object_var
                if o_var in bindings and bindings[o_var] != cand.object:
                    continue

                # Compatible match: extend bindings
                new_bindings = dict(bindings)
                new_bindings[s_var] = cand.subject
                new_bindings[o_var] = cand.object
                matched_triples.append(cand)
                match_atoms(atom_idx + 1, new_bindings, matched_triples)
                matched_triples.pop()

        match_atoms(0, {}, [])
        return results

    def semantic_match(self, query: str, top_k: int = 3) -> list[tuple[Entity, float]]:
        """Find knowledge graph entities matching query text via semantic keyword and token similarity."""
        scored: list[tuple[Entity, float]] = []
        for entity in self.entities.values():
            texts_to_check = [entity.name, entity.id, entity.entity_type, entity.description]
            for val in entity.properties.values():
                texts_to_check.append(str(val))

            max_score = max((_similarity_score(query, t) for t in texts_to_check), default=0.0)
            if max_score > 0.15:
                scored.append((entity, max_score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    def hybrid_retrieve(
        self,
        query: str,
        top_k_entities: int = 3,
        k_hops: int = 2
    ) -> HybridRAGResult:
        """Execute hybrid neural semantic search and symbolic graph traversal with rule entailment."""
        start_time = time.perf_counter()

        matches = self.semantic_match(query, top_k=top_k_entities)
        seed_entities = [m[0] for m in matches]

        visited_nodes: set[str] = set()
        subgraph_edges: list[Triple] = []
        seen_edges: set[tuple[str, str, str]] = set()
        all_paths: list[TraversalPath] = []

        for entity in seed_entities:
            traversal = self.k_hop_bfs(entity.id, k=k_hops)
            visited_nodes.update(traversal.visited_nodes)
            for edge in traversal.visited_edges:
                key = (edge.subject, edge.predicate, edge.object)
                if key not in seen_edges:
                    seen_edges.add(key)
                    subgraph_edges.append(edge)
            all_paths.extend(traversal.paths)

        # Distinguish explicit vs inferred triples in retrieved subgraph
        explicit_triples = [e for e in subgraph_edges if e.source != "inferred"]
        inferred_in_subgraph = [
            fact for fact in self.inferred_facts
            if fact.triple.subject in visited_nodes or fact.triple.object in visited_nodes
        ]

        # Format context into LLM prompt markdown
        fused_context = self._format_prompt_context(
            query=query,
            seed_entities=seed_entities,
            explicit_triples=explicit_triples,
            inferred_facts=inferred_in_subgraph,
            paths=all_paths
        )

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return HybridRAGResult(
            query=query,
            seed_entities=seed_entities,
            explicit_triples=explicit_triples,
            inferred_facts=inferred_in_subgraph,
            subgraph_paths=all_paths,
            fused_context=fused_context,
            retrieval_latency_ms=round(latency_ms, 3)
        )

    def _format_prompt_context(
        self,
        query: str,
        seed_entities: list[Entity],
        explicit_triples: list[Triple],
        inferred_facts: list[InferredFact],
        paths: list[TraversalPath]
    ) -> str:
        """Synthesize retrieved symbolic subgraphs and neural entities into clean LLM context."""
        lines = [f"# Knowledge Graph Grounding for Query: \"{query}\"", ""]

        lines.append("## Identified Entities")
        if seed_entities:
            for ent in seed_entities:
                desc = f" - {ent.description}" if ent.description else ""
                lines.append(f"- **{ent.name}** (`{ent.id}`) [{ent.entity_type}]{desc}")
        else:
            lines.append("- *No direct entity matches found.*")
        lines.append("")

        lines.append("## Explicit Knowledge Graph Subgraph")
        if explicit_triples:
            for t in explicit_triples:
                lines.append(f"- `{t.subject}` --[{t.predicate}]--> `{t.object}` (confidence: {t.confidence})")
        else:
            lines.append("- *No explicit triples in subgraph.*")
        lines.append("")

        lines.append("## Neuro-Symbolic Inferred Entailments (First-Order Logic)")
        if inferred_facts:
            for fact in inferred_facts:
                t = fact.triple
                premises_str = ", ".join(f"({p.subject} {p.predicate} {p.object})" for p in fact.premises)
                lines.append(
                    f"- `{t.subject}` --[{t.predicate}]--> `{t.object}` "
                    f"[Derived via Rule '{fact.rule_name}' from: {premises_str}]"
                )
        else:
            lines.append("- *No rule entailments derived.*")
        lines.append("")

        lines.append("## Traversal Chains")
        if paths:
            # Show up to 5 distinct longest paths
            sorted_paths = sorted(paths, key=lambda p: p.total_hops, reverse=True)[:5]
            for p in sorted_paths:
                path_str = " -> ".join(p.nodes)
                lines.append(f"- {path_str} ({p.total_hops} hops)")
        else:
            lines.append("- *No paths.*")

        return "\n".join(lines)
