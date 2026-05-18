from __future__ import annotations

import json
from bisect import bisect_right
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
TRAINING_DIR = PROCESSED_DIR / "training"
EVENT_DIR = PROCESSED_DIR / "event_candidates"
TABULAR_HEALTH_DIR = PROCESSED_DIR / "tabular_health_sources"

MODEL_READY = TRAINING_DIR / "inek_aylik_snapshot_culling_observable_payload_enriched_model_ready.csv"
SPLIT_CSV = TRAINING_DIR / "train_test_split_culling_observable_payload_enriched.csv"
EVENT_KURU = EVENT_DIR / "event_kuru.csv"
HEALTH_INDEX = TABULAR_HEALTH_DIR / "health_auxiliary_file_index.csv"

COVERAGE_CSV = TRAINING_DIR / "health_auxiliary_feature_coverage.csv"
REPORT_PATH = PROJECT_ROOT / "reports" / "health_auxiliary_feature_enrichment_report.md"

HEALTH_FEATURES = [
    "has_marcenat_prev_health_summary",
    "marcenat_prev_lact_mastitis_count",
    "marcenat_prev_lact_lameness_count",
    "marcenat_prev_lact_other_health_count",
    "marcenat_prev_lact_health_total_count",
    "marcenat_prev_lact_cell_total",
    "marcenat_prev_lact_cell_total_source_p75_flag",
    "marcenat_prev_lact_tb_tp",
    "marcenat_prev_lact_tb_tp_less_pct",
    "marcenat_prev_lact_tb_tp_more_pct",
    "marcenat_prev_lact_completed_dim",
    "marcenat_prev_lact_days_since_dryoff",
    "marcenat_prev_lact_mastitis_any",
    "marcenat_prev_lact_lameness_any",
    "sensor_conductivity_available_30",
    "sensor_conductivity_available_90",
    "sensor_conductivity_high_30_train_p75_flag",
    "sensor_conductivity_high_90_train_p75_flag",
    "sensor_conductivity_rise_flag",
]


@dataclass
class DatedPayload:
    event_date: pd.Timestamp
    payload: dict[str, Any]


def parse_payload(value: Any) -> dict[str, Any]:
    if value is None or pd.isna(value):
        return {}
    try:
        payload = json.loads(str(value))
    except Exception:
        return {}
    return payload if isinstance(payload, dict) else {}


def numeric_value(payload: dict[str, Any], key: str) -> float:
    value = payload.get(key)
    if value is None or value == "":
        return np.nan
    try:
        return float(value)
    except (TypeError, ValueError):
        return np.nan


def latest_item(items: list[DatedPayload], ref_date: pd.Timestamp) -> DatedPayload | None:
    dates = [item.event_date for item in items]
    idx = bisect_right(dates, ref_date) - 1
    return items[idx] if idx >= 0 else None


def load_marcenat_dryoff_payloads() -> dict[str, list[DatedPayload]]:
    if not EVENT_KURU.exists():
        return {}
    df = pd.read_csv(EVENT_KURU, low_memory=False)
    if df.empty:
        return {}
    df = df[df["source_code"].eq("marcenat_inrae")].copy()
    df["kuru_baslangic_tarihi"] = pd.to_datetime(df["kuru_baslangic_tarihi"], errors="coerce")
    df = df[df["kuru_baslangic_tarihi"].notna()]
    grouped: dict[str, list[DatedPayload]] = {}
    for canonical_id, group in df.groupby("canonical_animal_id"):
        items = [
            DatedPayload(row["kuru_baslangic_tarihi"], parse_payload(row["payload"]))
            for _, row in group.sort_values("kuru_baslangic_tarihi").iterrows()
        ]
        grouped[str(canonical_id)] = items
    return grouped


def source_p75_cell_threshold(items_by_animal: dict[str, list[DatedPayload]]) -> float:
    values: list[float] = []
    for items in items_by_animal.values():
        for item in items:
            value = numeric_value(item.payload, "CELL total")
            if not pd.isna(value):
                values.append(value)
    if not values:
        return np.nan
    return float(pd.Series(values).quantile(0.75))


def marcenat_prev_health_features(
    item: DatedPayload | None,
    ref_date: pd.Timestamp,
    cell_p75: float,
) -> dict[str, float | int]:
    result: dict[str, float | int] = {
        "has_marcenat_prev_health_summary": 0,
        "marcenat_prev_lact_mastitis_count": np.nan,
        "marcenat_prev_lact_lameness_count": np.nan,
        "marcenat_prev_lact_other_health_count": np.nan,
        "marcenat_prev_lact_health_total_count": np.nan,
        "marcenat_prev_lact_cell_total": np.nan,
        "marcenat_prev_lact_cell_total_source_p75_flag": np.nan,
        "marcenat_prev_lact_tb_tp": np.nan,
        "marcenat_prev_lact_tb_tp_less_pct": np.nan,
        "marcenat_prev_lact_tb_tp_more_pct": np.nan,
        "marcenat_prev_lact_completed_dim": np.nan,
        "marcenat_prev_lact_days_since_dryoff": np.nan,
        "marcenat_prev_lact_mastitis_any": np.nan,
        "marcenat_prev_lact_lameness_any": np.nan,
    }
    if item is None:
        return result
    payload = item.payload
    mastitis = numeric_value(payload, "Nb Mam")
    lameness = numeric_value(payload, "Nb boiterie")
    other_health = numeric_value(payload, "Nb AEVTS")
    health_values = [value for value in [mastitis, lameness, other_health] if not pd.isna(value)]
    cell_total = numeric_value(payload, "CELL total")

    result["has_marcenat_prev_health_summary"] = 1
    result["marcenat_prev_lact_mastitis_count"] = mastitis
    result["marcenat_prev_lact_lameness_count"] = lameness
    result["marcenat_prev_lact_other_health_count"] = other_health
    result["marcenat_prev_lact_health_total_count"] = float(sum(health_values)) if health_values else np.nan
    result["marcenat_prev_lact_cell_total"] = cell_total
    result["marcenat_prev_lact_tb_tp"] = numeric_value(payload, "TB/TP")
    result["marcenat_prev_lact_tb_tp_less_pct"] = numeric_value(payload, "Percentage of total time TB/TP<1.0")
    result["marcenat_prev_lact_tb_tp_more_pct"] = numeric_value(payload, "Percentage of total time TB/TP>1.4")
    result["marcenat_prev_lact_completed_dim"] = numeric_value(payload, "Durée Lactation")
    result["marcenat_prev_lact_days_since_dryoff"] = float((ref_date - item.event_date).days)
    result["marcenat_prev_lact_mastitis_any"] = int(not pd.isna(mastitis) and mastitis > 0)
    result["marcenat_prev_lact_lameness_any"] = int(not pd.isna(lameness) and lameness > 0)
    if not pd.isna(cell_total) and not pd.isna(cell_p75):
        result["marcenat_prev_lact_cell_total_source_p75_flag"] = int(cell_total >= cell_p75)
    return result


def train_quantile(df: pd.DataFrame, column: str, quantile: float = 0.75) -> float:
    if column not in df:
        return np.nan
    train = df[df["split"].eq("train")]
    values = pd.to_numeric(train[column], errors="coerce").dropna()
    if values.empty:
        return np.nan
    return float(values.quantile(quantile))


def conductivity_features(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame(index=df.index)
    avg30 = pd.to_numeric(df.get("sensor_conductivity_avg_30"), errors="coerce")
    avg90 = pd.to_numeric(df.get("sensor_conductivity_avg_90"), errors="coerce")
    trend30 = pd.to_numeric(df.get("sensor_conductivity_trend_30"), errors="coerce")
    p75_30 = train_quantile(df, "sensor_conductivity_avg_30")
    p75_90 = train_quantile(df, "sensor_conductivity_avg_90")

    out["sensor_conductivity_available_30"] = avg30.notna().astype(int)
    out["sensor_conductivity_available_90"] = avg90.notna().astype(int)
    out["sensor_conductivity_high_30_train_p75_flag"] = np.where(avg30.notna() & (not pd.isna(p75_30)), (avg30 >= p75_30).astype(int), np.nan)
    out["sensor_conductivity_high_90_train_p75_flag"] = np.where(avg90.notna() & (not pd.isna(p75_90)), (avg90 >= p75_90).astype(int), np.nan)
    out["sensor_conductivity_rise_flag"] = np.where(trend30.notna(), (trend30 > 0).astype(int), np.nan)
    out.attrs["sensor_conductivity_avg_30_train_p75"] = p75_30
    out.attrs["sensor_conductivity_avg_90_train_p75"] = p75_90
    return out


def feature_coverage(df: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for feature in HEALTH_FEATURES:
        series = df[feature] if feature in df else pd.Series(dtype="float64")
        rows.append(
            {
                "feature": feature,
                "non_null_rows": int(series.notna().sum()),
                "coverage_rate": float(series.notna().mean()) if len(series) else 0.0,
                "non_zero_rows": int(pd.to_numeric(series, errors="coerce").fillna(0).ne(0).sum()),
            }
        )
    return pd.DataFrame(rows)


def health_auxiliary_index_summary() -> pd.DataFrame:
    if not HEALTH_INDEX.exists():
        return pd.DataFrame()
    return pd.read_csv(HEALTH_INDEX, low_memory=False)


def write_report(
    rows: int,
    source_counts: pd.DataFrame,
    coverage: pd.DataFrame,
    index_df: pd.DataFrame,
    cell_p75: float,
    conductivity_attrs: dict[str, Any],
) -> None:
    lines = [
        "# Health Auxiliary Feature Enrichment Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- Model-ready rows: `{rows}`",
        "- Scope: tabularized SCC/organic/Chiozza review plus leakage-safe health features for culling-observable training rows.",
        "",
        "## Modeling Decision",
        "",
        "- SCC grazing cows and Chiozza lameness are now tabular files, but current IDs do not overlap the culling-observable training set and no observed culling labels are available from those sources.",
        "- Organic SCM DOCX exposes aggregate farm-level supplemental data, not animal-level model rows.",
        "- Therefore they are kept as auxiliary schema/evidence sources and are not treated as negative culling examples.",
        "- Features added to the culling model come from sources already inside the culling-observable set: Marcenat prior completed lactation health summaries and Primiparous conductivity proxies.",
        "",
        "## Thresholds",
        "",
        f"- Marcenat `CELL total` source p75: `{cell_p75 if not pd.isna(cell_p75) else 'nan'}`",
        f"- Primiparous train `sensor_conductivity_avg_30` p75: `{conductivity_attrs.get('sensor_conductivity_avg_30_train_p75', 'nan')}`",
        f"- Primiparous train `sensor_conductivity_avg_90` p75: `{conductivity_attrs.get('sensor_conductivity_avg_90_train_p75', 'nan')}`",
        "",
        "## Training Source Rows",
        "",
        "| Source | Rows | Positive 90d rows |",
        "|---|---:|---:|",
    ]
    for row in source_counts.to_dict("records"):
        lines.append(f"| `{row['source_code']}` | {int(row['rows'])} | {int(row['positive_90d_rows'])} |")

    lines.extend(["", "## Added Feature Coverage", "", "| Feature | Non-null rows | Coverage | Non-zero rows |", "|---|---:|---:|---:|"])
    for row in coverage.to_dict("records"):
        lines.append(
            f"| `{row['feature']}` | {int(row['non_null_rows'])} | {float(row['coverage_rate']):.4f} | {int(row['non_zero_rows'])} |"
        )

    if not index_df.empty:
        lines.extend(["", "## Tabularized Auxiliary Files", "", "| Source | Status | Rows | File |", "|---|---|---:|---|"])
        for row in index_df.to_dict("records"):
            lines.append(
                f"| `{row.get('source_code', '')}` | `{row.get('status', '')}` | {int(row.get('rows', 0) or 0)} | `{row.get('file_name', '')}` |"
            )

    lines.extend(
        [
            "",
            "## Leakage Guard",
            "",
            "- Marcenat health counts are exposed only after the dryoff/completed-lactation date is <= snapshot reference date.",
            "- Conductivity high flags use p75 thresholds computed from train split rows only.",
            "- Culling reason, survival outcome, exit age and post-culling fields remain audit-only.",
        ]
    )
    REPORT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    if not MODEL_READY.exists():
        raise FileNotFoundError(MODEL_READY)
    df = pd.read_csv(MODEL_READY, low_memory=False)
    df["referans_tarih"] = pd.to_datetime(df["referans_tarih"], errors="coerce")
    df = df.drop(columns=[col for col in HEALTH_FEATURES if col in df.columns])

    dryoff_payloads = load_marcenat_dryoff_payloads()
    cell_p75 = source_p75_cell_threshold(dryoff_payloads)
    marcenat_rows: list[dict[str, float | int]] = []
    for row in df[["canonical_animal_id", "referans_tarih"]].itertuples(index=False):
        item = latest_item(dryoff_payloads.get(str(row.canonical_animal_id), []), row.referans_tarih)
        marcenat_rows.append(marcenat_prev_health_features(item, row.referans_tarih, cell_p75))
    marcenat_features = pd.DataFrame(marcenat_rows)
    conductivity = conductivity_features(df)

    enriched = pd.concat([df.reset_index(drop=True), marcenat_features, conductivity.reset_index(drop=True)], axis=1)
    MODEL_READY.parent.mkdir(parents=True, exist_ok=True)
    enriched.to_csv(MODEL_READY, index=False)
    if {"snapshot_id", "source_code", "canonical_animal_id", "referans_tarih", "split"}.issubset(enriched.columns):
        enriched[["snapshot_id", "source_code", "canonical_animal_id", "referans_tarih", "split"]].to_csv(SPLIT_CSV, index=False)

    coverage = feature_coverage(enriched)
    coverage.to_csv(COVERAGE_CSV, index=False)
    source_counts = (
        enriched.assign(cull_within_90d=pd.to_numeric(enriched["cull_within_90d"], errors="coerce").fillna(0))
        .groupby("source_code", as_index=False)
        .agg(rows=("source_code", "size"), positive_90d_rows=("cull_within_90d", "sum"))
    )
    write_report(
        rows=len(enriched),
        source_counts=source_counts,
        coverage=coverage,
        index_df=health_auxiliary_index_summary(),
        cell_p75=cell_p75,
        conductivity_attrs=dict(conductivity.attrs),
    )

    print(f"wrote {MODEL_READY.relative_to(PROJECT_ROOT)} ({len(enriched)} rows)")
    print(f"wrote {COVERAGE_CSV.relative_to(PROJECT_ROOT)}")
    print(f"wrote {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
