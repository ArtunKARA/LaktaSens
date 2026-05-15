from __future__ import annotations

import csv
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
import yaml


PROJECT_ROOT = Path(__file__).resolve().parents[1]
EXTERNAL_DIR = PROJECT_ROOT / "data" / "external"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
AUDIT_DIR = PROCESSED_DIR / "audit"
RAW_DIR = PROCESSED_DIR / "raw_candidates"
EVENT_DIR = PROCESSED_DIR / "event_candidates"

DATA_SOURCES = PROJECT_ROOT / "config" / "data_sources.yaml"
PAYLOAD_RULES = PROJECT_ROOT / "config" / "baseline_model_payload_enriched_rules.yaml"
MODEL_READY = PROCESSED_DIR / "training" / "inek_aylik_snapshot_culling_observable_payload_enriched_model_ready.csv"

SOURCE_COVERAGE_CSV = AUDIT_DIR / "source_coverage_summary.csv"
FEATURE_COVERAGE_CSV = AUDIT_DIR / "feature_coverage_by_source.csv"
REPORT_PATH = PROJECT_ROOT / "reports" / "data_coverage_audit.md"

SUPPORTED_TABULAR_SUFFIXES = {".csv", ".tsv", ".tab", ".xlsx", ".xls"}
UNSUPPORTED_SCHEMA_SUFFIXES = {".rar", ".docx", ".pdf"}


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def safe_read_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    return pd.read_csv(path, low_memory=False)


def list_source_files(source_code: str) -> list[dict[str, str]]:
    source_dir = EXTERNAL_DIR / source_code
    records: list[dict[str, str]] = []
    if not source_dir.exists():
        return records
    for path in sorted(item for item in source_dir.rglob("*") if item.is_file()):
        suffix = path.suffix.lower()
        if suffix == ".zip":
            try:
                with zipfile.ZipFile(path) as zip_file:
                    for member in zip_file.namelist():
                        member_suffix = Path(member).suffix.lower()
                        status = "inspectable_tabular" if member_suffix in SUPPORTED_TABULAR_SUFFIXES else "unsupported_schema"
                        if member_suffix not in SUPPORTED_TABULAR_SUFFIXES and member_suffix not in UNSUPPORTED_SCHEMA_SUFFIXES:
                            status = "non_tabular_or_manifest"
                        records.append(
                            {
                                "path": str(path.relative_to(PROJECT_ROOT)),
                                "member": member,
                                "format": member_suffix.lstrip(".") or "unknown",
                                "schema_status": status,
                            }
                        )
            except zipfile.BadZipFile:
                records.append(
                    {
                        "path": str(path.relative_to(PROJECT_ROOT)),
                        "member": "",
                        "format": "zip",
                        "schema_status": "zip_read_error",
                    }
                )
        else:
            status = "inspectable_tabular" if suffix in SUPPORTED_TABULAR_SUFFIXES else "unsupported_schema"
            records.append(
                {
                    "path": str(path.relative_to(PROJECT_ROOT)),
                    "member": "",
                    "format": suffix.lstrip(".") or "unknown",
                    "schema_status": status,
                }
            )
    return records


def candidate_counts_by_source(table_dir: Path) -> dict[str, dict[str, int]]:
    counts: dict[str, dict[str, int]] = {}
    for path in sorted(table_dir.glob("*.csv")):
        df = safe_read_csv(path)
        table = path.stem
        if df.empty or "source_code" not in df.columns:
            continue
        for source_code, count in df["source_code"].value_counts(dropna=False).items():
            counts.setdefault(str(source_code), {})[table] = int(count)
    return counts


def culling_reason_capacity() -> dict[str, Any]:
    raw_culling = safe_read_csv(RAW_DIR / "raw_culling.csv")
    marcenat_zip = EXTERNAL_DIR / "marcenat_inrae" / "MarcenatINRAE.zip"
    result: dict[str, Any] = {
        "jdd_rows": 0,
        "jdd_unique_cows": 0,
        "jdd_matched_raw_cows": 0,
        "raw_unique_culling_cows": 0,
        "primiparous_status_values": "",
    }
    if not raw_culling.empty:
        result["raw_unique_culling_cows"] = int(raw_culling["canonical_animal_id"].nunique())
        prim = raw_culling[raw_culling["source_code"].eq("primiparous_social_env")]
        if not prim.empty:
            result["primiparous_status_values"] = ", ".join(
                f"{key}:{value}" for key, value in prim["cikarilma_sebebi"].value_counts(dropna=False).to_dict().items()
            )
    if marcenat_zip.exists():
        with zipfile.ZipFile(marcenat_zip) as zip_file:
            if "JDD_DIB.csv" in zip_file.namelist():
                jdd = pd.read_csv(zip_file.open("JDD_DIB.csv"), sep=None, engine="python")
                result["jdd_rows"] = int(len(jdd))
                result["jdd_unique_cows"] = int(jdd["Cow ID"].nunique())
                if not raw_culling.empty:
                    raw_ids = set(raw_culling.loc[raw_culling["source_code"].eq("marcenat_inrae"), "external_animal_id"].astype(str))
                    result["jdd_matched_raw_cows"] = int(sum(("FR" + str(int(cow_id))) in raw_ids for cow_id in jdd["Cow ID"].dropna()))
    return result


def build_source_coverage() -> pd.DataFrame:
    config = load_yaml(DATA_SOURCES)
    sources = config.get("sources", config if isinstance(config, list) else [])
    raw_counts = candidate_counts_by_source(RAW_DIR)
    event_counts = candidate_counts_by_source(EVENT_DIR)
    normalized = safe_read_csv(PROCESSED_DIR / "event_normalized_candidates.csv")
    normalized_counts = normalized["source_code"].value_counts().to_dict() if not normalized.empty else {}

    records: list[dict[str, Any]] = []
    for source in sources:
        source_code = source["source_code"]
        files = list_source_files(source_code)
        statuses = sorted({item["schema_status"] for item in files}) or ["missing_local_file"]
        raw_summary = "; ".join(f"{table}:{count}" for table, count in sorted(raw_counts.get(source_code, {}).items()))
        event_summary = "; ".join(f"{table}:{count}" for table, count in sorted(event_counts.get(source_code, {}).items()))
        records.append(
            {
                "source_code": source_code,
                "source_name": source.get("source_name", ""),
                "role": source.get("role", ""),
                "priority": source.get("priority", ""),
                "manual_download_required": bool(source.get("manual_download_required", False)),
                "local_file_count": len(files),
                "schema_statuses": "; ".join(statuses),
                "inspectable_tabular_count": sum(1 for item in files if item["schema_status"] == "inspectable_tabular"),
                "unsupported_schema_count": sum(1 for item in files if item["schema_status"] == "unsupported_schema"),
                "raw_candidate_rows": sum(raw_counts.get(source_code, {}).values()),
                "event_candidate_rows": sum(event_counts.get(source_code, {}).values()),
                "event_normalized_rows": int(normalized_counts.get(source_code, 0)),
                "raw_tables": raw_summary,
                "event_tables": event_summary,
                "notes": source.get("notes", ""),
            }
        )
    return pd.DataFrame(records)


def build_feature_coverage() -> pd.DataFrame:
    if not MODEL_READY.exists() or not PAYLOAD_RULES.exists():
        return pd.DataFrame()
    rules = load_yaml(PAYLOAD_RULES)
    features = list(rules["features"]["numeric"]) + list(rules["features"]["variants"]["no_source_code"]["categorical"])
    df = pd.read_csv(MODEL_READY, low_memory=False)
    records: list[dict[str, Any]] = []
    for source_code, group in df.groupby("source_code"):
        for feature in features:
            if feature not in group.columns:
                records.append(
                    {
                        "source_code": source_code,
                        "feature": feature,
                        "rows": len(group),
                        "non_null_rows": 0,
                        "coverage_pct": 0.0,
                        "unique_values": 0,
                        "status": "missing_column",
                    }
                )
                continue
            non_null = int(group[feature].notna().sum())
            records.append(
                {
                    "source_code": source_code,
                    "feature": feature,
                    "rows": len(group),
                    "non_null_rows": non_null,
                    "coverage_pct": round((non_null / len(group)) * 100, 2) if len(group) else 0.0,
                    "unique_values": int(group[feature].nunique(dropna=True)),
                    "status": "ok" if non_null else "all_null",
                }
            )
    return pd.DataFrame(records)


def write_report(source_df: pd.DataFrame, feature_df: pd.DataFrame, reason_capacity: dict[str, Any]) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Data Coverage Audit",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Purpose: decide what can still improve the culling risk model before MDP/reward simulation.",
        "",
        "## Source Coverage",
        "",
        "| Source | Local files | Schema status | Raw rows | Event rows | Normalized rows | Notes |",
        "|---|---:|---|---:|---:|---:|---|",
    ]
    for row in source_df.sort_values(["priority", "source_code"]).to_dict("records"):
        lines.append(
            f"| `{row['source_code']}` | {row['local_file_count']} | {row['schema_statuses']} | "
            f"{row['raw_candidate_rows']} | {row['event_candidate_rows']} | {row['event_normalized_rows']} | "
            f"{str(row['notes']).replace('|', '/')} |"
        )

    lines.extend(
        [
            "",
            "## Culling Reason Capacity",
            "",
            f"- Raw unique culling cows: `{reason_capacity['raw_unique_culling_cows']}`",
            f"- Marcenat `JDD_DIB.csv` rows: `{reason_capacity['jdd_rows']}`",
            f"- Marcenat culling-reason cows matched to raw culling IDs: `{reason_capacity['jdd_matched_raw_cows']}`",
            f"- Primiparous exit status values: `{reason_capacity['primiparous_status_values'] or 'none'}`",
            "",
            "## Feature Coverage Highlights",
            "",
        ]
    )
    if feature_df.empty:
        lines.append("- Feature coverage could not be computed because the payload-enriched model-ready CSV is missing.")
    else:
        sparse = feature_df[feature_df["coverage_pct"].lt(20)].sort_values(["source_code", "coverage_pct", "feature"])
        lines.append(f"- Total source-feature pairs checked: `{len(feature_df)}`")
        lines.append(f"- Pairs under 20% coverage: `{len(sparse)}`")
        lines.append("")
        lines.append("| Source | Feature | Coverage | Status |")
        lines.append("|---|---|---:|---|")
        for row in sparse.head(40).to_dict("records"):
            lines.append(f"| `{row['source_code']}` | `{row['feature']}` | {row['coverage_pct']:.2f}% | `{row['status']}` |")

    lines.extend(
        [
            "",
            "## Decision",
            "",
            "- SCC RAR, organic DOCX and calving/AFC PDF remain manual tabular-conversion work.",
            "- Marcenat has usable culling reason labels in `JDD_DIB.csv`; these should be used for audit/stratification, not as predictive features before culling.",
            "- Primiparous `Status` indicates lifecycle/status at exit, not a true culling cause; keep it low-confidence.",
        ]
    )
    REPORT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    source_df = build_source_coverage()
    feature_df = build_feature_coverage()
    reason_capacity = culling_reason_capacity()
    source_df.to_csv(SOURCE_COVERAGE_CSV, index=False, quoting=csv.QUOTE_MINIMAL)
    feature_df.to_csv(FEATURE_COVERAGE_CSV, index=False, quoting=csv.QUOTE_MINIMAL)
    write_report(source_df, feature_df, reason_capacity)
    print(f"wrote {SOURCE_COVERAGE_CSV.relative_to(PROJECT_ROOT)}")
    print(f"wrote {FEATURE_COVERAGE_CSV.relative_to(PROJECT_ROOT)}")
    print(f"wrote {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
