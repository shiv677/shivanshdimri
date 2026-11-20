import csv
import hashlib
from pathlib import Path
import re
from typing import Any, Optional
import unicodedata

try:
    from .models import DuplicateMatch, RecordAudit, SentinelReport
except ImportError:
    from models import DuplicateMatch, RecordAudit, SentinelReport


def normalize_text(text: str) -> str:
    """Applies canonical Unicode NFKC normalization and trims redundant whitespace."""
    if not text:
        return ""
    # Unicode NFKC resolves fullwidth characters, ligatures, and combining marks
    normalized = unicodedata.normalize("NFKC", text)
    # Collapse multiple whitespaces into a single space
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


normalize_unicode = normalize_text


def compute_sha256(text: str) -> str:
    """Computes SHA-256 hash of normalized text for exact duplicate detection."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def compute_simhash(text: str, hash_bits: int = 64) -> int:
    """Computes a 64-bit SimHash integer representation for near-duplicate text detection."""
    tokens = re.findall(r"\b\w+\b", text.lower())
    if not tokens:
        return 0

    v = [0] * hash_bits
    for token in tokens:
        # Map MD5 digest to 64-bit integer
        h = int.from_bytes(hashlib.md5(token.encode("utf-8")).digest()[:8], "big")
        for i in range(hash_bits):
            if (h >> i) & 1:
                v[i] += 1
            else:
                v[i] -= 1

    fingerprint = 0
    for i in range(hash_bits):
        if v[i] > 0:
            fingerprint |= 1 << i

    return fingerprint


def hamming_distance(h1: int, h2: int) -> int:
    """Calculates bitwise Hamming distance between two integer hashes."""
    return (h1 ^ h2).bit_count()


def detect_corruption(
    raw_text: str,
    record_id: Optional[str] = None,
    min_tokens: int = 2,
    max_tokens: int = 10000,
    max_token_len: int = 80,
) -> list[str]:
    """Detects encoding corruption, null bytes, empty fields, and token length anomalies."""
    flags: list[str] = []

    if record_id is not None and not str(record_id).strip():
        flags.append("EMPTY_FIELD:id")

    if not raw_text or not str(raw_text).strip():
        flags.append("EMPTY_TEXT")
        return flags

    text_str = str(raw_text)

    # 1. Null-byte injection check (literal or escaped)
    if "\x00" in text_str or "\\x00" in text_str or "\\0" in text_str:
        flags.append("CONTAINS_NULL_BYTES")

    # 2. Unicode replacement character check
    if "\ufffd" in text_str:
        flags.append("REPLACEMENT_CHARACTER_DETECTED")

    # 3. Mojibake common patterns (mis-decoded UTF-8 sequences as Windows-1252/Latin-1)
    mojibake_patterns = [r"â€[™œ˜]", r"Ã[©¢¤¥]", r"Â[°±²]"]
    for pattern in mojibake_patterns:
        if re.search(pattern, text_str):
            flags.append("MOJIBAKE_ENCODING_ARTIFACT")
            break

    # 4. Token length anomalies
    tokens = re.findall(r"\S+", text_str)
    token_count = len(tokens)
    if token_count < min_tokens:
        flags.append(f"TOKEN_LENGTH_ANOMALY:too_few_tokens_{token_count}")
    elif token_count > max_tokens:
        flags.append(f"TOKEN_LENGTH_ANOMALY:excessive_tokens_{token_count}")

    for tok in tokens:
        if len(tok) > max_token_len:
            flags.append(f"TOKEN_LENGTH_ANOMALY:token_exceeds_{max_token_len}_chars")
            break

    # 5. Unnormalized Unicode check (ligatures, full-width characters)
    if text_str != unicodedata.normalize("NFKC", text_str):
        flags.append("UNNORMALIZED_UNICODE")

    return flags


check_structural_corruption = detect_corruption


class DatasetQualitySentinel:
    """Audits datasets for corruption, Unicode anomalies, exact duplicates, and near duplicates."""

    def __init__(
        self,
        simhash_threshold: int = 3,
        min_tokens: int = 2,
        max_tokens: int = 10000,
        max_token_len: int = 80,
    ):
        self.simhash_threshold = simhash_threshold
        self.min_tokens = min_tokens
        self.max_tokens = max_tokens
        self.max_token_len = max_token_len
        self.records: list[dict[str, Any]] = []
        self.report: SentinelReport = SentinelReport()
        self.stats: dict[str, int] = {
            "total_records": 0,
            "clean": 0,
            "corrupt": 0,
            "exact_duplicate": 0,
            "near_duplicate": 0,
        }

    def scan_csv(
        self, file_path: str | Path, id_col: str = "id", text_col: str = "text"
    ) -> dict[str, Any]:
        """Scans a CSV file and executes full dataset integrity pipeline."""
        path = Path(file_path)
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        return self.audit_rows(rows, id_col=id_col, text_col=text_col)

    def audit_rows(
        self, rows: list[dict[str, Any]], id_col: str = "id", text_col: str = "text"
    ) -> dict[str, Any]:
        """Audits a list of dictionaries, updating stats and report."""
        self.records.clear()
        self.stats = {k: 0 for k in self.stats}
        self.report = SentinelReport(total_records=len(rows))

        seen_sha256: dict[str, str] = {}  # sha256 -> record_id
        seen_simhashes: list[tuple[int, str]] = []  # (simhash, record_id)

        for row in rows:
            rec_id = str(row.get(id_col, "")).strip() or f"row_{len(self.records)+1}"
            raw_text = str(row.get(text_col, ""))

            self.stats["total_records"] += 1
            corruption_flags = detect_corruption(
                raw_text=raw_text,
                record_id=row.get(id_col),
                min_tokens=self.min_tokens,
                max_tokens=self.max_tokens,
                max_token_len=self.max_token_len,
            )
            norm_text = normalize_text(raw_text)

            status = "CLEAN"
            dup_of: Optional[str] = None
            match_type: Optional[str] = None
            sha256_hash: Optional[str] = None
            simhash_val: Optional[int] = None

            # 1. Structural corruption check
            is_corrupt = any(
                flag in (
                    "CONTAINS_NULL_BYTES",
                    "MOJIBAKE_ENCODING_ARTIFACT",
                    "REPLACEMENT_CHARACTER_DETECTED",
                    "EMPTY_TEXT",
                )
                or flag.startswith("TOKEN_LENGTH_ANOMALY")
                or flag.startswith("EMPTY_")
                for flag in corruption_flags
            )

            if is_corrupt:
                status = "CORRUPT"
                self.stats["corrupt"] += 1
                self.report.quarantined_records += 1
                audit = RecordAudit(
                    record_id=rec_id,
                    status=status,
                    issues=corruption_flags,
                    normalized_text=norm_text if norm_text else None,
                    raw_data=row,
                )
                self.report.audits.append(audit)

            # 2. Exact duplicate check (via SHA-256 on normalized text)
            elif norm_text:
                sha256_hash = compute_sha256(norm_text)
                simhash_val = compute_simhash(norm_text)

                if sha256_hash in seen_sha256:
                    status = "EXACT_DUPLICATE"
                    dup_of = seen_sha256[sha256_hash]
                    match_type = "EXACT"
                    corruption_flags.append(f"EXACT_MATCH_OF_{dup_of}")
                    self.stats["exact_duplicate"] += 1
                    self.report.duplicate_records += 1
                    self.report.exact_duplicate_records += 1

                    match = DuplicateMatch(
                        record_id=rec_id,
                        matched_id=dup_of,
                        match_type=match_type,
                        hamming_distance=0,
                        similarity=1.0,
                    )
                    self.report.duplicates.append(match)
                    audit = RecordAudit(
                        record_id=rec_id,
                        status=status,
                        issues=corruption_flags,
                        normalized_text=norm_text,
                        sha256=sha256_hash,
                        simhash=simhash_val,
                        simhash_hex=f"{simhash_val:016x}",
                        duplicate_of=dup_of,
                        match_type=match_type,
                        raw_data=row,
                    )
                    self.report.audits.append(audit)

                else:
                    # 3. Near-duplicate check (via SimHash Hamming distance <= threshold)
                    near_match_id = None
                    near_dist = 64
                    for prev_hash, prev_id in seen_simhashes:
                        dist = hamming_distance(simhash_val, prev_hash)
                        if dist <= self.simhash_threshold:
                            near_match_id = prev_id
                            near_dist = dist
                            break

                    if near_match_id:
                        status = "NEAR_DUPLICATE"
                        dup_of = near_match_id
                        match_type = "NEAR"
                        corruption_flags.append(f"NEAR_MATCH_OF_{dup_of}_DIST_{near_dist}")
                        self.stats["near_duplicate"] += 1
                        self.report.duplicate_records += 1
                        self.report.near_duplicate_records += 1

                        match = DuplicateMatch(
                            record_id=rec_id,
                            matched_id=dup_of,
                            match_type=match_type,
                            hamming_distance=near_dist,
                            similarity=round(1.0 - (near_dist / 64.0), 4),
                        )
                        self.report.duplicates.append(match)
                        audit = RecordAudit(
                            record_id=rec_id,
                            status=status,
                            issues=corruption_flags,
                            normalized_text=norm_text,
                            sha256=sha256_hash,
                            simhash=simhash_val,
                            simhash_hex=f"{simhash_val:016x}",
                            duplicate_of=dup_of,
                            match_type=match_type,
                            raw_data=row,
                        )
                        self.report.audits.append(audit)

                    else:
                        # 4. Clean verified record
                        seen_sha256[sha256_hash] = rec_id
                        seen_simhashes.append((simhash_val, rec_id))
                        self.stats["clean"] += 1
                        self.report.clean_records += 1

                        audit = RecordAudit(
                            record_id=rec_id,
                            status=status,
                            issues=corruption_flags,
                            normalized_text=norm_text,
                            sha256=sha256_hash,
                            simhash=simhash_val,
                            simhash_hex=f"{simhash_val:016x}",
                            raw_data=row,
                        )
                        self.report.audits.append(audit)

            else:
                status = "CORRUPT"
                self.stats["corrupt"] += 1
                self.report.quarantined_records += 1
                audit = RecordAudit(
                    record_id=rec_id,
                    status=status,
                    issues=corruption_flags or ["EMPTY_NORMALIZED_TEXT"],
                    raw_data=row,
                )
                self.report.audits.append(audit)

            self.records.append({
                "id": rec_id,
                "status": status,
                "flags": ";".join(corruption_flags) if corruption_flags else "NONE",
                "duplicate_of": dup_of or "",
                "match_type": match_type or "",
                "normalized_text": norm_text,
                "sha256": sha256_hash or "",
                "simhash": f"{simhash_val:016x}" if simhash_val is not None else "",
                "raw_text": raw_text,
            })

        return self.stats

    def export_audit_report(self, output_csv_path: str | Path) -> None:
        """Exports the complete audit ledger to a CSV file."""
        fieldnames = ["id", "status", "flags", "duplicate_of", "match_type", "normalized_text", "sha256", "simhash"]
        path = Path(output_csv_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in self.records:
                writer.writerow({k: r.get(k, "") for k in fieldnames})

    def export_clean_ledger(self, output_csv_path: str | Path) -> None:
        """Exports verified clean records to a clean CSV ledger."""
        fieldnames = ["id", "normalized_text", "sha256", "simhash"]
        path = Path(output_csv_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in self.records:
                if r["status"] == "CLEAN":
                    writer.writerow({k: r.get(k, "") for k in fieldnames})

    def export_quarantine_ledger(self, output_csv_path: str | Path) -> None:
        """Exports quarantined (corrupt and duplicate) records to a quarantine ledger CSV."""
        fieldnames = ["id", "status", "flags", "duplicate_of", "match_type", "raw_text"]
        path = Path(output_csv_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in self.records:
                if r["status"] != "CLEAN":
                    # Sanitize null bytes in raw text for safe CSV export
                    sanitized_raw = str(r.get("raw_text", "")).replace("\x00", "<NULL_BYTE>")
                    writer.writerow({
                        "id": r["id"],
                        "status": r["status"],
                        "flags": r["flags"],
                        "duplicate_of": r["duplicate_of"],
                        "match_type": r["match_type"],
                        "raw_text": sanitized_raw,
                    })


DatasetSentinel = DatasetQualitySentinel
