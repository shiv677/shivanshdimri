# Dataset Quality & Integrity Sentinel

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Pydantic v2](https://img.shields.io/badge/Pydantic-v2.10-green.svg)](https://docs.pydantic.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](test_sentinel.py)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An enterprise-grade dataset integrity and corruption detection pipeline. Features canonical Unicode NFKC normalization, SHA-256 exact collision hashing, 64-bit SimHash near-duplicate clustering, and transactional audit ledgers with automated quarantine partitions.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │    Raw Unvalidated CSV Dataset       │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    Unicode NFKC Canonical Cleaner    │
                      │ Ligatures · Full-Width · Diacritics  │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    Corruption & Anomaly Sentinel     │
                      │ Null-bytes · Mojibake · Token lengths│
                      └──────────────────┬───────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
       ┌───────────────────────┐                   ┌───────────────────────┐
       │   SHA-256 Exact Hash  │                   │    64-Bit SimHash     │
       │  Zero-Drift Digest    │                   │ Hamming Distance <= 3 │
       └───────────┬───────────┘                   └───────────┬───────────┘
                   │                                           │
                   └─────────────────────┬─────────────────────┘
                                         ▼
                      ┌──────────────────────────────────────┐
                      │      Partitioned Export Engine       │
                      │ clean_ledger.csv · quarantine.csv    │
                      └──────────────────────────────────────┘
```

---

## Key Capabilities

- **Unicode NFKC Normalization**: Resolves OCR ligatures (`ﬀ`, `ﬁ`), full-width ASCII (`ＡＩ`), and whitespace anomalies into clean canonical text.
- **Dual-Layer Deduplication**:
  - Layer 1: Byte-level SHA-256 digests for exact duplicate identification.
  - Layer 2: 64-bit SimHash with bitwise Hamming distance $\le 3$ for semantic near-duplicates.
- **Structural Anomaly Catch**: Quarantines null-byte injections (`\x00`), mojibake (`â€™`), replacement characters (`\ufffd`), and runaway unspaced tokens ($>80$ characters).
- **Dual Ledger Partitioning**: Automatically writes clean records to `clean_ledger.csv` and isolated failures to `quarantine_ledger.csv`.

---

## Quickstart

### 1. Requirements

```bash
pip install pydantic pytest
```

### 2. Run Audit on Sample Dataset

```bash
python main.py sample_corrupt_data.csv
```

Outputs:
- `audit_report.csv`: Complete row-by-row audit with match provenance and hash fingerprints.
- `clean_ledger.csv`: Verified, canonicalized records ready for model ingestion.
- `quarantine_ledger.csv`: Isolated corruptions and duplicates for human review.

---

## Running Test Suite

```bash
pytest test_sentinel.py -v
```

6 unit tests cover Unicode normalization, SimHash bitwise distance, corruption flaggers, and ledger exports.

---

## Author

**Shivansh Dimri**  
Associate AI Engineer — Python Engineering · AI Evaluation · Data Systems · Automation  
Website: [https://shivanshdimri.in](https://shivanshdimri.in)  
GitHub: [@shiv677](https://github.com/shiv677)  
Email: [dimrishiv933@gmail.com](mailto:dimrishiv933@gmail.com)
