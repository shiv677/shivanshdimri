import csv
from pathlib import Path
import pytest

try:
    from .sentinel import (
        normalize_text,
        normalize_unicode,
        compute_sha256,
        compute_simhash,
        hamming_distance,
        detect_corruption,
        DatasetQualitySentinel,
    )
    from .models import DuplicateMatch, RecordAudit, SentinelReport
    from .main import run_sentinel_audit
except ImportError:
    from sentinel import (
        normalize_text,
        normalize_unicode,
        compute_sha256,
        compute_simhash,
        hamming_distance,
        detect_corruption,
        DatasetQualitySentinel,
    )
    from models import DuplicateMatch, RecordAudit, SentinelReport
    from main import run_sentinel_audit


def test_unicode_nfkc_normalization():
    # Fullwidth Latin characters to standard ASCII
    fullwidth = "Ｈｅｌｌｏ　Ｗｏｒｌｄ"
    assert normalize_text(fullwidth) == "Hello World"
    assert normalize_unicode(fullwidth) == "Hello World"

    # Ligature resolution
    ligature = "ﬂight oﬃce"
    assert normalize_text(ligature) == "flight office"

    # Whitespace collapsing
    spaces = "  multiple   spaces \t\n here   "
    assert normalize_text(spaces) == "multiple spaces here"

    # Combining diacritics canonical equivalence
    decomposed = "cafe\u0301"
    precomposed = "café"
    assert normalize_text(decomposed) == normalize_text(precomposed)


def test_sha256_exact_hashing():
    t1 = "Deterministic test string"
    t2 = "Deterministic test string"
    t3 = "Different test string"

    assert compute_sha256(t1) == compute_sha256(t2)
    assert compute_sha256(t1) != compute_sha256(t3)


def test_simhash_near_duplicates():
    base = (
        "High performance distributed stream processing architecture enables reliable AI telemetry "
        "ingestion, validation, and analytics across scalable edge cloud nodes and real-time inference clusters."
    )
    # Minor near-duplicate variant (distance <= 3)
    minor_variant = (
        "High performance distributed stream processing architecture enables reliable AI telemetry "
        "ingestion, validation, and fast analytics across scalable edge cloud nodes and real-time inference clusters."
    )
    completely_different = (
        "Quantum physics explores atomic mechanics and wave particle duality across microscopic subatomic domains."
    )

    h_base = compute_simhash(base)
    h_variant = compute_simhash(minor_variant)
    h_diff = compute_simhash(completely_different)

    # Identical text -> 0 distance
    assert hamming_distance(h_base, h_base) == 0

    # Minor variant -> small distance (<= 3)
    dist_near = hamming_distance(h_base, h_variant)
    assert dist_near <= 3

    # Completely different -> large distance (> 10)
    dist_diff = hamming_distance(h_base, h_diff)
    assert dist_diff > 10


def test_detect_structural_corruption():
    # Null byte injection
    assert "CONTAINS_NULL_BYTES" in detect_corruption("text\x00corrupt")
    assert "CONTAINS_NULL_BYTES" in detect_corruption("text\\x00escaped")

    # Empty text
    assert "EMPTY_TEXT" in detect_corruption("   ")

    # Empty identifier
    assert "EMPTY_FIELD:id" in detect_corruption("Valid text", record_id="   ")

    # Token length anomaly (token > 80 chars)
    long_token = "a" * 85
    assert any("TOKEN_LENGTH_ANOMALY" in f for f in detect_corruption(f"Valid words but {long_token}"))

    # Mojibake encoding artifacts
    assert "MOJIBAKE_ENCODING_ARTIFACT" in detect_corruption("Customerâ€™s account")

    # Unicode replacement character
    assert "REPLACEMENT_CHARACTER_DETECTED" in detect_corruption("Corrupt \ufffd character")

    # Clean text has no corrupt flags
    clean_flags = [f for f in detect_corruption("Clean plain English sentence.") if f != "UNNORMALIZED_UNICODE"]
    assert len(clean_flags) == 0


def test_pydantic_models():
    audit_clean = RecordAudit(
        record_id="rec_1",
        status="CLEAN",
        normalized_text="Clean text sample",
        sha256="abc123hash",
        simhash=123456789,
    )
    audit_corrupt = RecordAudit(
        record_id="rec_2",
        status="CORRUPT",
        issues=["CONTAINS_NULL_BYTES"],
    )
    dup_match = DuplicateMatch(
        record_id="rec_3",
        matched_id="rec_1",
        match_type="NEAR",
        hamming_distance=2,
        similarity=0.9688,
    )
    report = SentinelReport(
        total_records=3,
        clean_records=1,
        quarantined_records=1,
        duplicate_records=1,
        duplicates=[dup_match],
        audits=[audit_clean, audit_corrupt],
    )

    assert report.total_records == 3
    assert len(report.clean_audits) == 1
    assert len(report.quarantined_audits) == 1
    assert report.duplicates[0].match_type == "NEAR"


def test_scan_csv_and_export_ledgers(tmp_path: Path):
    sample_csv = Path(__file__).parent / "sample_corrupt_data.csv"
    output_report = tmp_path / "test_audit_report.csv"
    output_clean = tmp_path / "test_clean_ledger.csv"
    output_quarantine = tmp_path / "test_quarantine_ledger.csv"

    stats = run_sentinel_audit(
        input_csv=sample_csv,
        output_csv=output_report,
        clean_ledger_csv=output_clean,
        quarantine_ledger_csv=output_quarantine,
        simhash_threshold=3,
    )

    assert stats["total_records"] == 9
    assert stats["clean"] == 3
    assert stats["exact_duplicate"] == 1
    assert stats["near_duplicate"] == 1
    assert stats["corrupt"] == 4

    # Verify full report export
    assert output_report.exists()
    with open(output_report, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        assert len(reader) == 9
        assert "status" in reader[0]
        assert "duplicate_of" in reader[0]
        assert "sha256" in reader[0]
        assert "simhash" in reader[0]

    # Verify clean ledger export (only CLEAN records)
    assert output_clean.exists()
    with open(output_clean, "r", encoding="utf-8") as f:
        clean_rows = list(csv.DictReader(f))
        assert len(clean_rows) == 3
        for row in clean_rows:
            assert row["id"] in {"doc_001", "doc_004", "doc_009"}
            assert row["sha256"] != ""
            assert row["simhash"] != ""

    # Verify quarantine ledger export (all non-CLEAN records: corrupt + duplicates)
    assert output_quarantine.exists()
    with open(output_quarantine, "r", encoding="utf-8") as f:
        quarantine_rows = list(csv.DictReader(f))
        assert len(quarantine_rows) == 6
        quarantined_ids = {r["id"] for r in quarantine_rows}
        assert "doc_002" in quarantined_ids  # exact duplicate
        assert "doc_003" in quarantined_ids  # near duplicate
        assert "doc_005" in quarantined_ids  # null byte
        assert "doc_006" in quarantined_ids  # empty
        assert "doc_007" in quarantined_ids  # token length anomaly
        assert "doc_008" in quarantined_ids  # mojibake
