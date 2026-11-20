import json
import re
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, ValidationError, create_model

try:
    from .models import AgentScore, AgentVerdict, EvaluationSample
except ImportError:
    from models import AgentScore, AgentVerdict, EvaluationSample


class GroundingAgent:
    """Evaluates factual grounding against source context and identifies hallucinations."""

    name: str = "GroundingAgent"

    def __init__(self, threshold: float = 0.60):
        self.threshold = threshold

    def evaluate(
        self,
        candidate_response: Any,
        context: str = "",
        peer_feedback: Optional[List[str]] = None,
    ) -> AgentScore:
        flags: List[str] = []

        if isinstance(candidate_response, EvaluationSample):
            text = candidate_response.response.strip()
            context = candidate_response.reference_data.strip() or context
        else:
            text = str(candidate_response).strip()
            context = context.strip()

        text_lower = text.lower()
        context_lower = context.lower()

        # Check for empty response
        if not text:
            return AgentScore(
                agent_name=self.name,
                score=0.0,
                passed=False,
                confidence=1.0,
                critique="Candidate response is empty.",
                flags=["EMPTY_RESPONSE"],
            )

        # Hallucination indicators / Hedging markers
        hallucination_indicators = [
            "as an ai language model",
            "i don't have access to real-time",
            "fabricated",
            "hypothetical data",
        ]
        for indicator in hallucination_indicators:
            if indicator in text_lower:
                flags.append("HEDGING_OR_DISCLAIMER")

        # Grounding check against reference context
        grounding_score = 1.0
        if context:
            candidate_words = set(re.findall(r"\b[a-z0-9]{3,}\b", text_lower))
            context_words = set(re.findall(r"\b[a-z0-9]{3,}\b", context_lower))

            # Numerical / entity hallucination check
            num_pattern = re.compile(r"\b\$?\d+(?:\.\d+)?%?\b")
            resp_nums = set(num_pattern.findall(text))
            ctx_nums = set(num_pattern.findall(context))
            hallucinated_nums = resp_nums - ctx_nums

            if candidate_words:
                overlap = candidate_words.intersection(context_words)
                overlap_ratio = len(overlap) / len(candidate_words)
                if overlap_ratio < 0.25 and not (resp_nums and (resp_nums & ctx_nums)):
                    flags.append("LOW_CONTEXT_GROUNDING")
                    grounding_score = max(0.1, overlap_ratio)
                elif overlap_ratio < 0.50:
                    flags.append("PARTIAL_CONTEXT_GROUNDING")
                    grounding_score = 0.65
                else:
                    flags.append("HIGH_CONTEXT_GROUNDING")
                    grounding_score = min(1.0, 0.70 + (overlap_ratio * 0.30))

            if resp_nums and ctx_nums:
                matched_nums = resp_nums & ctx_nums
                if matched_nums and not hallucinated_nums:
                    grounding_score = max(grounding_score, 0.75 + (0.25 * (len(matched_nums) / len(resp_nums))))

            if hallucinated_nums:
                flags.append("HALLUCINATED_STATISTICS")
                grounding_score = max(0.0, grounding_score - (0.20 * len(hallucinated_nums)))
        else:
            grounding_score = 0.85 if not flags else 0.50

        # Incorporate peer feedback in debate
        if peer_feedback:
            for fb in peer_feedback:
                if "SYNTAX_ERROR" in fb or "INVALID_JSON_SYNTAX" in fb or "POTENTIAL_CONTRADICTION" in fb:
                    grounding_score = max(0.0, grounding_score - 0.15)
                    flags.append("PENALIZED_BY_PEER_FEEDBACK")

        score = round(max(0.0, min(1.0, grounding_score)), 2)
        passed = score >= self.threshold
        confidence = 0.90 if context else 0.75

        return AgentScore(
            agent_name=self.name,
            score=score,
            passed=passed,
            confidence=confidence,
            critique=f"Grounding score {score:.2f} based on context overlap and factual consistency.",
            flags=flags,
            details={"score": score, "flags": flags},
        )

    async def evaluate_async(
        self,
        candidate_response: Any,
        context: str = "",
        peer_feedback: Optional[List[str]] = None,
    ) -> AgentScore:
        return self.evaluate(candidate_response, context=context, peer_feedback=peer_feedback)


class ReasoningCritic:
    """Evaluates logical coherence, chain-of-thought progression, and internal consistency."""

    name: str = "ReasoningCritic"

    def __init__(self, threshold: float = 0.65):
        self.threshold = threshold

    def evaluate(
        self,
        candidate_response: Any,
        peer_feedback: Optional[List[str]] = None,
    ) -> AgentScore:
        flags: List[str] = []

        if isinstance(candidate_response, EvaluationSample):
            text = candidate_response.chain_of_thought.strip() or candidate_response.response.strip()
        else:
            text = str(candidate_response).strip()

        if len(text) < 15:
            return AgentScore(
                agent_name=self.name,
                score=0.2,
                passed=False,
                confidence=0.95,
                critique="Response too brief to exhibit valid reasoning.",
                flags=["INSUFFICIENT_ELABORATION"],
            )

        # Detect direct logical contradictions
        contradiction_patterns = [
            r"is\s+true.*is\s+false",
            r"always.*never",
            r"increase.*which\s+decreases\s+overall",
        ]
        for pattern in contradiction_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                flags.append("POTENTIAL_CONTRADICTION")

        score = 0.90
        if "POTENTIAL_CONTRADICTION" in flags:
            score -= 0.40

        # Check for reasoning structure (connectives like therefore, because, thus, steps)
        connectives = ["because", "therefore", "thus", "consequently", "specifically", "for example", "step"]
        has_connectives = any(c in text.lower() for c in connectives)
        if not has_connectives:
            score -= 0.15
            flags.append("LACKS_EXPLICIT_STEP_CONNECTIVES")

        if peer_feedback:
            for fb in peer_feedback:
                if "LOW_CONTEXT_GROUNDING" in fb or "HALLUCINATED_STATISTICS" in fb:
                    score = max(0.0, score - 0.20)
                    flags.append("REASONING_DOUBT_FROM_GROUNDING")

        score = round(max(0.0, min(1.0, score)), 2)
        passed = score >= self.threshold

        return AgentScore(
            agent_name=self.name,
            score=score,
            passed=passed,
            confidence=0.85,
            critique=f"Logical coherence rated {score:.2f} with structural connective analysis.",
            flags=flags,
            details={"score": score, "flags": flags},
        )

    async def evaluate_async(
        self,
        candidate_response: Any,
        peer_feedback: Optional[List[str]] = None,
    ) -> AgentScore:
        return self.evaluate(candidate_response, peer_feedback=peer_feedback)


class SchemaSentinel:
    """Enforces strict JSON schema conformance with Pydantic v2."""

    name: str = "SchemaSentinel"

    def __init__(self, threshold: float = 0.70):
        self.threshold = threshold
        self.type_map = {
            "string": str, "str": str,
            "integer": int, "int": int,
            "number": float, "float": float,
            "boolean": bool, "bool": bool,
            "array": list, "list": list,
            "object": dict, "dict": dict,
        }

    def _build_pydantic_model(self, model_name: str, schema_def: Any) -> type[BaseModel]:
        fields: Dict[str, Any] = {}

        if isinstance(schema_def, list):
            for field_name in schema_def:
                fields[str(field_name)] = (Any, ...)
        elif isinstance(schema_def, dict):
            if "properties" in schema_def:
                properties = schema_def.get("properties", {})
                required = set(schema_def.get("required", []))
                for field_name, field_spec in properties.items():
                    type_str = field_spec.get("type", "string") if isinstance(field_spec, dict) else str(field_spec)
                    py_type = self.type_map.get(type_str.lower(), Any)
                    if field_name in required:
                        fields[field_name] = (py_type, ...)
                    else:
                        fields[field_name] = (Optional[py_type], None)
            else:
                for field_name, field_type in schema_def.items():
                    if isinstance(field_type, type):
                        fields[field_name] = (field_type, ...)
                    else:
                        fields[field_name] = (self.type_map.get(str(field_type).lower(), Any), ...)
        return create_model(model_name, **fields)

    def evaluate(
        self,
        candidate_response: Any,
        required_format: str = "text",
        required_keys: Optional[Any] = None,
        expected_schema: Optional[Dict[str, Any]] = None,
    ) -> AgentScore:
        flags: List[str] = []

        if isinstance(candidate_response, EvaluationSample):
            text = candidate_response.response.strip()
            required_format = candidate_response.required_format or required_format
            required_keys = candidate_response.required_keys or required_keys
            expected_schema = candidate_response.expected_schema or expected_schema
            structured_data = candidate_response.structured_output
        else:
            text = str(candidate_response).strip()
            structured_data = None

        if required_format.lower() == "json" or expected_schema is not None or required_keys is not None:
            # Parse JSON
            parsed = None
            if structured_data is not None:
                parsed = structured_data
            else:
                try:
                    clean_text = text
                    if "```json" in clean_text:
                        clean_text = clean_text.split("```json")[1].split("```")[0].strip()
                    elif "```" in clean_text:
                        clean_text = clean_text.split("```")[1].split("```")[0].strip()
                    parsed = json.loads(clean_text)
                except Exception:
                    flags.append("INVALID_JSON_SYNTAX")
                    return AgentScore(
                        agent_name=self.name,
                        score=0.0,
                        passed=False,
                        confidence=0.98,
                        critique="Invalid JSON syntax: payload failed parsing.",
                        flags=flags,
                    )

            if not isinstance(parsed, dict):
                flags.append("JSON_NOT_AN_OBJECT")
                score = 0.3
            else:
                # Strictly validate with Pydantic v2
                schema_target = expected_schema or required_keys
                if schema_target:
                    try:
                        validator_model = self._build_pydantic_model("RuntimeSchemaValidator", schema_target)
                        validator_model.model_validate(parsed)
                        score = 1.0
                        flags.append("STRICT_SCHEMA_PASSED")
                    except ValidationError as val_err:
                        err_count = len(val_err.errors())
                        score = max(0.0, 1.0 - (0.25 * err_count))
                        for err in val_err.errors():
                            loc = ".".join(str(l) for l in err["loc"])
                            flags.append(f"MISSING_KEYS_{loc}")
                else:
                    score = 1.0
                    flags.append("VALID_JSON_OBJECT")

        elif required_format.lower() == "bullet_points":
            bullets = [line for line in text.splitlines() if line.strip().startswith(("-", "*", "1.", "2."))]
            if len(bullets) >= 2:
                score = 1.0
            else:
                score = 0.4
                flags.append("MISSING_BULLET_LIST_FORMAT")
        else:
            score = 1.0 if len(text) > 0 else 0.0

        score = round(max(0.0, min(1.0, score)), 2)
        has_schema_error = any(f.startswith("MISSING_KEYS") or f in ("INVALID_JSON_SYNTAX", "JSON_NOT_AN_OBJECT", "MISSING_BULLET_LIST_FORMAT") for f in flags)
        passed = (score >= self.threshold) and not has_schema_error

        return AgentScore(
            agent_name=self.name,
            score=score,
            passed=passed,
            confidence=0.98,
            critique=f"Schema compliance verified against format='{required_format}' (score: {score:.2f}).",
            flags=flags,
            details={"score": score, "flags": flags},
        )

    async def evaluate_async(
        self,
        candidate_response: Any,
        required_format: str = "text",
        required_keys: Optional[Any] = None,
        expected_schema: Optional[Dict[str, Any]] = None,
    ) -> AgentScore:
        return self.evaluate(
            candidate_response,
            required_format=required_format,
            required_keys=required_keys,
            expected_schema=expected_schema,
        )
