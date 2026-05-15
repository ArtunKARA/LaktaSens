from __future__ import annotations

import json
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
RAW_CULLING = PROCESSED_DIR / "raw_candidates" / "raw_culling.csv"
EVENT_CULLING = PROCESSED_DIR / "event_candidates" / "event_suruden_cikarma.csv"
MODEL_READY = PROCESSED_DIR / "training" / "inek_aylik_snapshot_culling_observable_payload_enriched_model_ready.csv"
MARCENAT_ZIP = PROJECT_ROOT / "data" / "external" / "marcenat_inrae" / "MarcenatINRAE.zip"

OUTPUT_LABELS = PROCESSED_DIR / "culling_reason_labels.csv"
OUTPUT_AUDIT_SNAPSHOT = PROCESSED_DIR / "training" / "inek_aylik_snapshot_payload_enriched_reason_audit.csv"
REPORT_PATH = PROJECT_ROOT / "reports" / "culling_reason_enrichment_report.md"


REASON_GROUP_MAP = {
    "repro": "reproductive",
    "health": "health",
    "econo": "economic",
}


def parse_payload(text: Any) -> dict[str, Any]:
    if text is None or pd.isna(text):
        return {}
    try:
        value = json.loads(str(text))
        return value if isinstance(value, dict) else {}
    except Exception:
        return {}


def clean_text(value: Any) -> str:
    if value is None or pd.isna(value):
        return ""
    text = str(value).strip()
    return "" if text.lower() in {"nan", "na", "none"} else text


def marcenat_reason_labels() -> pd.DataFrame:
    if not MARCENAT_ZIP.exists():
        return pd.DataFrame()
    with zipfile.ZipFile(MARCENAT_ZIP) as zip_file:
        if "JDD_DIB.csv" not in zip_file.namelist():
            return pd.DataFrame()
        jdd = pd.read_csv(zip_file.open("JDD_DIB.csv"), sep=None, engine="python")
    records: list[dict[str, Any]] = []
    for _, row in jdd.iterrows():
        cow_id = clean_text(row.get("Cow ID"))
        if not cow_id:
            continue
        if cow_id.endswith(".0"):
            cow_id = cow_id[:-2]
        external_id = f"FR{cow_id}"
        raw_group = clean_text(row.get("culling_reason"))
        group = REASON_GROUP_MAP.get(raw_group.lower(), "unknown")
        records.append(
            {
                "source_code": "marcenat_inrae",
                "external_animal_id": external_id,
                "canonical_animal_id": f"marcenat_inrae:{external_id}",
                "culling_reason_group": group,
                "raw_culling_reason": raw_group,
                "primary_culling_reason": clean_text(row.get("primary_culling_reason")),
                "secondary_culling_reason": clean_text(row.get("secondary_culling_reason")),
                "destination_after_culling": clean_text(row.get("destination_after_culling")),
                "reason_confidence": 0.95,
                "reason_source": "JDD_DIB.csv",
                "notes": "Animal-level culling reason metadata. Use for audit/stratification, not as pre-culling feature.",
            }
        )
    return pd.DataFrame(records)


def primiparous_reason_labels(raw_culling: pd.DataFrame) -> pd.DataFrame:
    if raw_culling.empty:
        return pd.DataFrame()
    prim = raw_culling[raw_culling["source_code"].eq("primiparous_social_env")].copy()
    if prim.empty:
        return pd.DataFrame()
    prim["cikarilma_tarihi"] = pd.to_datetime(prim["cikarilma_tarihi"], errors="coerce")
    prim = prim.sort_values("cikarilma_tarihi").drop_duplicates(["canonical_animal_id"], keep="first")
    records: list[dict[str, Any]] = []
    for _, row in prim.iterrows():
        payload = parse_payload(row.get("raw_payload"))
        status = clean_text(row.get("cikarilma_sebebi")) or clean_text(payload.get("Status"))
        records.append(
            {
                "source_code": "primiparous_social_env",
                "external_animal_id": clean_text(row.get("external_animal_id")),
                "canonical_animal_id": clean_text(row.get("canonical_animal_id")),
                "culling_reason_group": "unknown",
                "raw_culling_reason": status,
                "primary_culling_reason": "",
                "secondary_culling_reason": "",
                "destination_after_culling": "",
                "reason_confidence": 0.30,
                "reason_source": "events.Status",
                "notes": "Status appears to be lifecycle/status at exit, not a true culling cause.",
            }
        )
    return pd.DataFrame(records)


def attach_culling_dates(labels: pd.DataFrame, raw_culling: pd.DataFrame) -> pd.DataFrame:
    if labels.empty or raw_culling.empty:
        return labels
    dates = raw_culling.copy()
    dates["cikarilma_tarihi"] = pd.to_datetime(dates["cikarilma_tarihi"], errors="coerce")
    dates = (
        dates[dates["cikarilma_tarihi"].notna()]
        .sort_values("cikarilma_tarihi")
        .drop_duplicates(["canonical_animal_id"], keep="first")
        [["canonical_animal_id", "cikarilma_tarihi"]]
    )
    out = labels.merge(dates, on="canonical_animal_id", how="left")
    out["cikarilma_tarihi"] = pd.to_datetime(out["cikarilma_tarihi"], errors="coerce").dt.date.astype("string")
    return out


def build_reason_audit_snapshot(labels: pd.DataFrame) -> pd.DataFrame:
    if not MODEL_READY.exists() or labels.empty:
        return pd.DataFrame()
    df = pd.read_csv(MODEL_READY, low_memory=False)
    reason_cols = [
        "canonical_animal_id",
        "culling_reason_group",
        "raw_culling_reason",
        "primary_culling_reason",
        "secondary_culling_reason",
        "destination_after_culling",
        "reason_confidence",
    ]
    return df.merge(labels[reason_cols], on="canonical_animal_id", how="left")


def write_report(labels: pd.DataFrame, audit_snapshot: pd.DataFrame) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Culling Reason Enrichment Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Purpose: classify observed culling causes for audit and stratified model evaluation.",
        "- Leakage rule: culling reason is not added to predictive model feature lists because it is known at/after culling.",
        "",
        "## Label Coverage",
        "",
        f"- Reason label rows: `{len(labels)}`",
        f"- Unique animals with reason labels: `{labels['canonical_animal_id'].nunique() if not labels.empty else 0}`",
        "",
        "| Source | Labels | Unique animals | Mean confidence |",
        "|---|---:|---:|---:|",
    ]
    if not labels.empty:
        grouped = labels.groupby("source_code").agg(
            labels=("canonical_animal_id", "size"),
            unique_animals=("canonical_animal_id", "nunique"),
            mean_confidence=("reason_confidence", "mean"),
        )
        for source_code, row in grouped.iterrows():
            lines.append(
                f"| `{source_code}` | {int(row['labels'])} | {int(row['unique_animals'])} | {float(row['mean_confidence']):.2f} |"
            )
    lines.extend(["", "## Reason Distribution", "", "| Group | Count |", "|---|---:|"])
    if not labels.empty:
        for reason, count in labels["culling_reason_group"].value_counts(dropna=False).to_dict().items():
            lines.append(f"| `{reason}` | {int(count)} |")
    lines.extend(["", "## Primary Reason Top Values", "", "| Primary reason | Count |", "|---|---:|"])
    if not labels.empty:
        for reason, count in labels["primary_culling_reason"].fillna("").replace("", "unknown").value_counts().head(20).to_dict().items():
            lines.append(f"| `{reason}` | {int(count)} |")
    if not audit_snapshot.empty:
        positives = audit_snapshot[pd.to_numeric(audit_snapshot["cull_within_90d"], errors="coerce").eq(1)]
        lines.extend(
            [
                "",
                "## 90-Day Positive Snapshot Reason Mix",
                "",
                f"- Positive 90-day snapshot rows: `{len(positives)}`",
                "",
                "| Reason group | Positive snapshot rows |",
                "|---|---:|",
            ]
        )
        for reason, count in positives["culling_reason_group"].fillna("unknown").value_counts().to_dict().items():
            lines.append(f"| `{reason}` | {int(count)} |")
    lines.extend(
        [
            "",
            "## Decision",
            "",
            "- Marcenat reason labels are high-confidence audit labels.",
            "- Primiparous exit status is kept as low-confidence because it does not encode true cause.",
            "- Use this file for error analysis, stratified metrics and future reward design. Do not train culling risk models with reason columns.",
        ]
    )
    REPORT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    raw_culling = pd.read_csv(RAW_CULLING, low_memory=False) if RAW_CULLING.exists() else pd.DataFrame()
    frames = [marcenat_reason_labels(), primiparous_reason_labels(raw_culling)]
    labels = pd.concat([frame for frame in frames if not frame.empty], ignore_index=True) if any(not frame.empty for frame in frames) else pd.DataFrame()
    if not labels.empty:
        labels = attach_culling_dates(labels, raw_culling)
        labels = labels.sort_values(["source_code", "canonical_animal_id"]).reset_index(drop=True)
    OUTPUT_LABELS.parent.mkdir(parents=True, exist_ok=True)
    labels.to_csv(OUTPUT_LABELS, index=False)

    audit_snapshot = build_reason_audit_snapshot(labels)
    if not audit_snapshot.empty:
        audit_snapshot.to_csv(OUTPUT_AUDIT_SNAPSHOT, index=False)

    write_report(labels, audit_snapshot)
    print(f"wrote {OUTPUT_LABELS.relative_to(PROJECT_ROOT)}")
    if not audit_snapshot.empty:
        print(f"wrote {OUTPUT_AUDIT_SNAPSHOT.relative_to(PROJECT_ROOT)}")
    print(f"wrote {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
