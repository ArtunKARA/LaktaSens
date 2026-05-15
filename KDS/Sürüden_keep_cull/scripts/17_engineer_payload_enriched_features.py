from __future__ import annotations

import json
from bisect import bisect_right
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
TRAINING_DIR = PROCESSED_DIR / "training"
EVENT_DIR = PROCESSED_DIR / "event_candidates"
RAW_DIR = PROCESSED_DIR / "raw_candidates"

INPUT_MODEL_READY = TRAINING_DIR / "inek_aylik_snapshot_culling_observable_engineered_model_ready.csv"
OUTPUT_MODEL_READY = TRAINING_DIR / "inek_aylik_snapshot_culling_observable_payload_enriched_model_ready.csv"
OUTPUT_SPLIT = TRAINING_DIR / "train_test_split_culling_observable_payload_enriched.csv"
REPORT_PATH = PROJECT_ROOT / "reports" / "payload_enriched_feature_review.md"

RAW_MILK = RAW_DIR / "raw_milk.csv"
RAW_CULLING = RAW_DIR / "raw_culling.csv"
EVENT_DOGURMA = EVENT_DIR / "event_dogurma.csv"
EVENT_KURU = EVENT_DIR / "event_kuru.csv"


LEAKAGE_BLACKLIST = [
    "Date Reforme",
    "Lifespan",
    "Productive lifespan",
    "Durée Lactation",
    "Cumulative DIM",
    "Avg DIM per lactation",
    "Date tarrissement",
    "Cumulative MY total lactation (kg)",
    "Date Lactation__3",
    "End of lactation",
    "Start of dry period",
    "Jour Lactation",
]


def parse_payload(text: Any) -> dict[str, Any]:
    if text is None or pd.isna(text):
        return {}
    try:
        value = json.loads(str(text))
        return value if isinstance(value, dict) else {}
    except Exception:
        return {}


def numeric_value(payload: dict[str, Any], key: str) -> float:
    value = payload.get(key)
    if value is None or value == "":
        return np.nan
    try:
        return float(value)
    except (TypeError, ValueError):
        return np.nan


def text_value(payload: dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if value is None or value == "":
        return "unknown"
    return str(value).strip() or "unknown"


def date_value(payload: dict[str, Any], key: str) -> pd.Timestamp | None:
    value = payload.get(key)
    if value is None or value == "":
        return None
    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return None
    return parsed


@dataclass
class DatedPayload:
    event_date: pd.Timestamp
    payload: dict[str, Any]


def grouped_dated_payloads(df: pd.DataFrame, date_col: str, payload_col: str) -> dict[str, list[DatedPayload]]:
    grouped: dict[str, list[DatedPayload]] = {}
    if df.empty:
        return grouped
    local = df[["canonical_animal_id", date_col, payload_col]].copy()
    local[date_col] = pd.to_datetime(local[date_col], errors="coerce")
    local = local[local[date_col].notna()]
    for canonical_id, group in local.groupby("canonical_animal_id"):
        items = [
            DatedPayload(row[date_col], parse_payload(row[payload_col]))
            for _, row in group.sort_values(date_col).iterrows()
        ]
        grouped[str(canonical_id)] = items
    return grouped


def latest_payload(items: list[DatedPayload], ref_date: pd.Timestamp) -> DatedPayload | None:
    dates = [item.event_date for item in items]
    idx = bisect_right(dates, ref_date) - 1
    return items[idx] if idx >= 0 else None


def load_primiparous_daily() -> dict[str, pd.DataFrame]:
    if not RAW_MILK.exists():
        return {}
    df = pd.read_csv(RAW_MILK, low_memory=False)
    df = df[df["source_code"].eq("primiparous_social_env")].copy()
    rows: list[dict[str, Any]] = []
    for _, row in df.iterrows():
        payload = parse_payload(row.get("raw_payload"))
        rows.append(
            {
                "canonical_animal_id": row.get("canonical_animal_id"),
                "date": pd.to_datetime(payload.get("Date") or row.get("sagim_tarihi"), errors="coerce"),
                "weight_kg": numeric_value(payload, "Weight(kg)"),
                "activity_steps_hour": numeric_value(payload, "Activity(steps/hour)"),
                "conductivity": numeric_value(payload, "Conductivity"),
                "milking_time_sec": numeric_value(payload, "Milking_Time(Sec)"),
                "group": numeric_value(payload, "Group"),
                "daily_dim": numeric_value(payload, "Days_in_Milk"),
                "daily_lactation_number": numeric_value(payload, "Lactation_Number"),
            }
        )
    out = pd.DataFrame(rows)
    out = out[out["date"].notna()].copy()
    return {str(canonical_id): group.sort_values("date").copy() for canonical_id, group in out.groupby("canonical_animal_id")}


def mean_in_window(group: pd.DataFrame, ref_date: pd.Timestamp, column: str, window_days: int) -> float:
    subset = group[(group["date"] > ref_date - timedelta(days=window_days)) & (group["date"] <= ref_date)]
    if subset.empty:
        return np.nan
    values = pd.to_numeric(subset[column], errors="coerce").dropna()
    return float(values.mean()) if len(values) else np.nan


def count_in_window(group: pd.DataFrame, ref_date: pd.Timestamp, window_days: int) -> int:
    subset = group[(group["date"] > ref_date - timedelta(days=window_days)) & (group["date"] <= ref_date)]
    return int(len(subset))


def trend_30(group: pd.DataFrame, ref_date: pd.Timestamp, column: str) -> float:
    last = mean_in_window(group, ref_date, column, 30)
    prev_subset = group[(group["date"] > ref_date - timedelta(days=60)) & (group["date"] <= ref_date - timedelta(days=30))]
    if prev_subset.empty or pd.isna(last):
        return np.nan
    values = pd.to_numeric(prev_subset[column], errors="coerce").dropna()
    if not len(values):
        return np.nan
    return float(last - values.mean())


def group_change_features(group: pd.DataFrame, ref_date: pd.Timestamp) -> tuple[float, int, float]:
    history = group[group["date"] <= ref_date].copy()
    if history.empty:
        return np.nan, 0, np.nan
    history["group"] = pd.to_numeric(history["group"], errors="coerce")
    current_group = history["group"].dropna().iloc[-1] if history["group"].notna().any() else np.nan
    recent = history[history["date"] > ref_date - timedelta(days=180)].copy()
    recent_groups = recent["group"].dropna().tolist()
    changes = sum(1 for before, after in zip(recent_groups, recent_groups[1:]) if before != after)
    change_dates = recent.loc[recent["group"].ne(recent["group"].shift()), "date"].tolist()
    days_since_change = float((ref_date - change_dates[-1]).days) if change_dates else np.nan
    return float(current_group) if not pd.isna(current_group) else np.nan, int(changes), days_since_change


def primiparous_payload_features(group: pd.DataFrame | None, ref_date: pd.Timestamp) -> dict[str, float | int]:
    result: dict[str, float | int] = {
        "sensor_weight_avg_30": np.nan,
        "sensor_weight_avg_90": np.nan,
        "sensor_weight_trend_30": np.nan,
        "sensor_activity_avg_30": np.nan,
        "sensor_activity_avg_90": np.nan,
        "sensor_activity_trend_30": np.nan,
        "sensor_conductivity_avg_30": np.nan,
        "sensor_conductivity_avg_90": np.nan,
        "sensor_conductivity_trend_30": np.nan,
        "sensor_milking_time_avg_30": np.nan,
        "sensor_milking_time_avg_90": np.nan,
        "sensor_daily_dim_last": np.nan,
        "sensor_lactation_number_last": np.nan,
        "sensor_group_current": np.nan,
        "sensor_group_change_count_180": 0,
        "sensor_days_since_group_change": np.nan,
        "sensor_payload_obs_90": 0,
        "has_sensor_payload_90": 0,
    }
    if group is None or group.empty:
        return result
    result["sensor_payload_obs_90"] = count_in_window(group, ref_date, 90)
    result["has_sensor_payload_90"] = int(result["sensor_payload_obs_90"] > 0)
    for source_col, prefix in [
        ("weight_kg", "sensor_weight"),
        ("activity_steps_hour", "sensor_activity"),
        ("conductivity", "sensor_conductivity"),
        ("milking_time_sec", "sensor_milking_time"),
    ]:
        result[f"{prefix}_avg_30"] = mean_in_window(group, ref_date, source_col, 30)
        result[f"{prefix}_avg_90"] = mean_in_window(group, ref_date, source_col, 90)
        if prefix != "sensor_milking_time":
            result[f"{prefix}_trend_30"] = trend_30(group, ref_date, source_col)

    history = group[group["date"] <= ref_date]
    if not history.empty:
        last = history.iloc[-1]
        result["sensor_daily_dim_last"] = float(last["daily_dim"]) if not pd.isna(last["daily_dim"]) else np.nan
        result["sensor_lactation_number_last"] = (
            float(last["daily_lactation_number"]) if not pd.isna(last["daily_lactation_number"]) else np.nan
        )
    current_group, changes, days_since_change = group_change_features(group, ref_date)
    result["sensor_group_current"] = current_group
    result["sensor_group_change_count_180"] = changes
    result["sensor_days_since_group_change"] = days_since_change
    return result


def load_marcenat_static() -> dict[str, dict[str, Any]]:
    if not RAW_CULLING.exists():
        return {}
    df = pd.read_csv(RAW_CULLING, low_memory=False)
    df = df[df["source_code"].eq("marcenat_inrae")].copy()
    static: dict[str, dict[str, Any]] = {}
    for _, row in df.iterrows():
        payload = parse_payload(row.get("raw_payload"))
        canonical_id = str(row.get("canonical_animal_id"))
        birth = date_value(payload, "Date Naissance")
        first_lactation = date_value(payload, "Date of first lactation") or date_value(payload, "Date 1 er Mise Bas")
        static[canonical_id] = {
            "birth_date": birth,
            "first_lactation_date": first_lactation,
            "breed": text_value(payload, "Breed"),
            "age_first_calving_months": numeric_value(payload, "Age au 1er vêlage (mois)"),
        }
    return static


def marcenat_static_features(static: dict[str, Any] | None, ref_date: pd.Timestamp) -> dict[str, Any]:
    result = {
        "marcenat_age_days_payload": np.nan,
        "marcenat_age_first_calving_months": np.nan,
        "marcenat_months_since_first_lactation": np.nan,
        "marcenat_breed": "unknown",
        "has_marcenat_static_payload": 0,
    }
    if not static:
        return result
    result["has_marcenat_static_payload"] = 1
    result["marcenat_breed"] = static.get("breed") or "unknown"
    birth = static.get("birth_date")
    if birth is not None and birth <= ref_date:
        result["marcenat_age_days_payload"] = float((ref_date - birth).days)
    first_lactation = static.get("first_lactation_date")
    if first_lactation is not None and first_lactation <= ref_date:
        result["marcenat_months_since_first_lactation"] = float((ref_date - first_lactation).days / 30.4375)
        result["marcenat_age_first_calving_months"] = static.get("age_first_calving_months", np.nan)
    return result


def marcenat_latest_calving_features(item: DatedPayload | None, ref_date: pd.Timestamp) -> dict[str, float | int]:
    result: dict[str, float | int] = {
        "marcenat_calving_difficulty_latest": np.nan,
        "marcenat_calf_weight_latest": np.nan,
        "marcenat_num_lactation_payload_latest": np.nan,
        "marcenat_gestation_duration_latest": np.nan,
        "marcenat_bw_at_calving": np.nan,
        "marcenat_bcs_at_calving": np.nan,
        "marcenat_my_4w": np.nan,
        "marcenat_cum_my_4w": np.nan,
        "marcenat_my_3mo": np.nan,
        "marcenat_cum_my_12w": np.nan,
        "marcenat_bw_3mo": np.nan,
        "marcenat_bcs_3mo": np.nan,
        "marcenat_my_6mo": np.nan,
        "marcenat_cum_my_24w": np.nan,
        "marcenat_my_305d": np.nan,
        "marcenat_cum_my_305d": np.nan,
        "marcenat_my_peak": np.nan,
        "marcenat_time_peak_week": np.nan,
        "has_marcenat_lactation_payload": 0,
    }
    if item is None:
        return result
    payload = item.payload
    result["has_marcenat_lactation_payload"] = 1
    result["marcenat_calving_difficulty_latest"] = numeric_value(payload, "Difficulté vêlage")
    result["marcenat_calf_weight_latest"] = numeric_value(payload, "Pds veaux")
    result["marcenat_num_lactation_payload_latest"] = numeric_value(payload, "Num Lactation")
    result["marcenat_gestation_duration_latest"] = numeric_value(payload, "Gestation duration (d)")
    result["marcenat_bw_at_calving"] = numeric_value(payload, "BW at calving (3 weeks) 2")
    result["marcenat_bcs_at_calving"] = numeric_value(payload, "BCS at calving (3 weeks) 2")

    age_days = (ref_date - item.event_date).days
    if age_days >= 28:
        result["marcenat_my_4w"] = numeric_value(payload, "MY at 4 weeks (kg/day)")
        result["marcenat_cum_my_4w"] = numeric_value(payload, "Cumulative MY up to 4 weeks (kg)")
    if age_days >= 84:
        result["marcenat_my_3mo"] = numeric_value(payload, "MY at 3 months (kg/day)")
        result["marcenat_cum_my_12w"] = numeric_value(payload, "Cumulative MY up to 12 weeks (kg)")
        result["marcenat_bw_3mo"] = numeric_value(payload, "BW at 3 months (12 weeks) 2")
        result["marcenat_bcs_3mo"] = numeric_value(payload, "BCS at 3 months (12 weeks) 2")
    if age_days >= 168:
        result["marcenat_my_6mo"] = numeric_value(payload, "MY at 6 months (kg/day)")
        result["marcenat_cum_my_24w"] = numeric_value(payload, "Cumulative MY up to 24 weeks (kg)")
    if age_days >= 305:
        result["marcenat_my_305d"] = numeric_value(payload, "MY at 305 days (kg/day)")
        result["marcenat_cum_my_305d"] = numeric_value(payload, "Cumulative MY until 305 days (kg)")
    peak_week = numeric_value(payload, "Time of peak MY (week)")
    if not pd.isna(peak_week) and age_days >= int(peak_week * 7):
        result["marcenat_my_peak"] = numeric_value(payload, "MY at peak (kg/day)")
        result["marcenat_time_peak_week"] = peak_week
    return result


def dryoff_features(dryoff_items: list[DatedPayload], ref_date: pd.Timestamp) -> dict[str, float | int]:
    dates = [item.event_date for item in dryoff_items]
    idx = bisect_right(dates, ref_date) - 1
    if idx < 0:
        return {"dryoff_count_to_date": 0, "days_since_last_dryoff": np.nan, "has_dryoff_before_ref": 0}
    last = dates[idx]
    return {
        "dryoff_count_to_date": int(idx + 1),
        "days_since_last_dryoff": float((ref_date - last).days),
        "has_dryoff_before_ref": 1,
    }


def main() -> int:
    snapshots = pd.read_csv(INPUT_MODEL_READY, low_memory=False)
    snapshots["referans_tarih"] = pd.to_datetime(snapshots["referans_tarih"], errors="coerce")

    primiparous_daily = load_primiparous_daily()
    marcenat_static = load_marcenat_static()
    dogurma = pd.read_csv(EVENT_DOGURMA, low_memory=False)
    marcenat_dogurma = dogurma[dogurma["source_code"].eq("marcenat_inrae")].copy()
    marcenat_calving = grouped_dated_payloads(marcenat_dogurma, "dogurma_tarihi", "payload")

    dryoff_df = pd.read_csv(EVENT_KURU, low_memory=False) if EVENT_KURU.exists() else pd.DataFrame()
    dryoff = grouped_dated_payloads(dryoff_df, "kuru_baslangic_tarihi", "payload") if not dryoff_df.empty else {}

    rows: list[dict[str, Any]] = []
    for row in snapshots[["canonical_animal_id", "referans_tarih"]].itertuples(index=False):
        canonical_id = str(row.canonical_animal_id)
        ref_date = row.referans_tarih
        features: dict[str, Any] = {}
        features.update(primiparous_payload_features(primiparous_daily.get(canonical_id), ref_date))
        features.update(marcenat_static_features(marcenat_static.get(canonical_id), ref_date))
        features.update(marcenat_latest_calving_features(latest_payload(marcenat_calving.get(canonical_id, []), ref_date), ref_date))
        features.update(dryoff_features(dryoff.get(canonical_id, []), ref_date))
        rows.append(features)

    payload_features = pd.DataFrame(rows)
    enriched = pd.concat([snapshots.reset_index(drop=True), payload_features], axis=1)
    OUTPUT_MODEL_READY.parent.mkdir(parents=True, exist_ok=True)
    enriched.to_csv(OUTPUT_MODEL_READY, index=False)
    enriched[["snapshot_id", "source_code", "canonical_animal_id", "referans_tarih", "split"]].to_csv(OUTPUT_SPLIT, index=False)

    numeric_features = [col for col in payload_features.columns if col != "marcenat_breed"]
    categorical_features = ["marcenat_breed"]
    lines = [
        "# Payload-Enriched Feature Review",
        "",
        f"- Input rows: `{len(snapshots)}`",
        f"- Output rows: `{len(enriched)}`",
        "",
        "## Leakage Guard",
        "",
        "The following payload fields were intentionally not used because they are known at or after culling, or summarize a completed future lactation:",
        "",
        *[f"- `{field}`" for field in LEAKAGE_BLACKLIST],
        "",
        "Marcenat production payload values are only exposed after their biological observation window has passed, e.g. 4-week milk after 28 days, 3-month values after 84 days, and 305-day values after 305 days.",
        "",
        "## New Numeric Features",
        "",
        *[f"- `{feature}`" for feature in numeric_features],
        "",
        "## New Categorical Features",
        "",
        *[f"- `{feature}`" for feature in categorical_features],
    ]
    REPORT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")

    print(f"wrote {OUTPUT_MODEL_READY.relative_to(PROJECT_ROOT)} ({len(enriched)} rows)")
    print(f"wrote {OUTPUT_SPLIT.relative_to(PROJECT_ROOT)}")
    print(f"wrote {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
