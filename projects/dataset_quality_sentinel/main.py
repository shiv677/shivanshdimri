import argparse
from pathlib import Path
from typing import Any, Optional

try:
    from .sentinel import DatasetQualitySentinel
except ImportError:
    from sentinel import DatasetQualitySentinel


def run_sentinel_audit(
    input_csv: Path,
    output_csv: Optional[Path] = None,
    clean_ledger_csv: Optional[Path] = None,
    quarantine_ledger_csv: Optional[Path] = None,
    simhash_threshold: int = 3,
) -> dict[str, Any]:
    """Runs the Dataset Quality Sentinel pipeline over an input CSV."""
    sentinel = DatasetQualitySentinel(simhash_threshold=simhash_threshold)
    stats = sentinel.scan_csv(input_csv)

    print("=" * 80)
    print("Dataset Quality Sentinel - Audit Report")
    print("=" * 80)
    print(f"Target Dataset:         {input_csv.name}")
    print(f"Total Scanned Rows:     {stats['total_records']}")
    print(f"Clean Records:          {stats['clean']}")
    print(f"Corrupt Records:        {stats['corrupt']}")
    print(f"Exact Duplicates:       {stats['exact_duplicate']}")
    print(f"Near Duplicates (<= {simhash_threshold}):  {stats['near_duplicate']}")
    print("-" * 80)
    print(f"{'ID':<10} | {'Status':<16} | {'Duplicate Of':<14} | {'Flags'}")
    print("-" * 80)
    for rec in sentinel.records:
        dup_str = rec["duplicate_of"] if rec["duplicate_of"] else "-"
        print(f"{rec['id']:<10} | {rec['status']:<16} | {dup_str:<14} | {rec['flags']}")
    print("=" * 80)

    if output_csv:
        sentinel.export_audit_report(output_csv)
        print(f"[REPORT SAVED] Full audit ledger:      {output_csv}")

    if clean_ledger_csv:
        sentinel.export_clean_ledger(clean_ledger_csv)
        print(f"[CLEAN SAVED]  Verified clean records: {clean_ledger_csv}")

    if quarantine_ledger_csv:
        sentinel.export_quarantine_ledger(quarantine_ledger_csv)
        print(f"[QUARANTINE]   Quarantine ledger:      {quarantine_ledger_csv}")

    return stats


def main():
    base_dir = Path(__file__).parent
    default_csv = base_dir / "sample_corrupt_data.csv"
    default_out = base_dir / "audit_report.csv"
    default_clean = base_dir / "clean_ledger.csv"
    default_quarantine = base_dir / "quarantine_ledger.csv"

    parser = argparse.ArgumentParser(
        description="Audit dataset CSV for Unicode anomalies, corruption, and duplicates."
    )
    parser.add_argument("--input", type=Path, default=default_csv, help="Input CSV to audit.")
    parser.add_argument("--output", type=Path, default=default_out, help="Output audit report CSV path.")
    parser.add_argument(
        "--clean-ledger",
        type=Path,
        default=default_clean,
        help="Output clean records ledger CSV path.",
    )
    parser.add_argument(
        "--quarantine-ledger",
        type=Path,
        default=default_quarantine,
        help="Output quarantined records ledger CSV path.",
    )
    parser.add_argument(
        "--simhash-threshold",
        type=int,
        default=3,
        help="Max Hamming distance for near duplicates (default: 3).",
    )
    args = parser.parse_args()

    run_sentinel_audit(
        input_csv=args.input,
        output_csv=args.output,
        clean_ledger_csv=args.clean_ledger,
        quarantine_ledger_csv=args.quarantine_ledger,
        simhash_threshold=args.simhash_threshold,
    )


if __name__ == "__main__":
    main()
