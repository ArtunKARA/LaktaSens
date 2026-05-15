from __future__ import annotations

from bisect import bisect_left, bisect_right
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TRAINING_DIR = PROJECT_ROOT / "data" / "processed" / "training"
EVENT_DIR = PROJECT_ROOT / "data" / "processed" / "event_candidates"

INPUT_MODEL_READY = TRAINING_DIR / "inek_aylik_snapshot_culling_observable_model_ready.csv"
OUTPUT_MODEL_READY = TRAINING_DIR / "inek_aylik_snapshot_culling_observable_engineered_model_ready.csv"
OUTPUT_SPLIT = TRAINING_DIR / "train_test_split_culling_observable_engineered.csv"
FEATURE_REPORT = PROJECT_ROOT / "reports" / "engineered_feature_review.md"

EVENT_DOGURMA = EVENT_DIR / "event_dogurma.csv"
EVENT_DOLLENME = EVENT_DIR / "event_dollenme.csv"
EVENT_HEALTH = EVENT_DIR / "event_health.csv"
EVENT_SUT = EVENT_DIR / "event_sut_olcum.csv"


@dataclass
class DateSeries:
    dates: list[pd.Timestamp]

    def count_between(self, start: pd.Timestamp, end: pd.Timestamp) -> int:
        return bisect_right(self.dates, end) - bisect_left(self.dates, start)

    def count_until(self, end: pd.Timestamp) -> int:
        return bisect_right(self.dates, end)

    def last_on_or_before(self, end: pd.Timestamp) -> pd.Timestamp | None:
        idx = bisect_right(self.dates, end) - 1
        return self.dates[idx] if idx >= 0 else None


def read_event(path: Path, date_col: str, required_cols: Iterable[str] = ()) -> pd.DataFrame:
    cols = ["canonical_animal_id", date_col, *required_cols]
    if not path.exists():
        return pd.DataFrame(columns=cols)
    df = pd.read_csv(path, usecols=lambda col: col in cols, low_memory=False)
    if date_col in df:
        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
        df = df[df[date_col].notna()].copy()
    return df


def build_date_index(df: pd.DataFrame, date_col: str) -> dict[str, DateSeries]:
    index: dict[str, DateSeries] = {}
    if df.empty:
        return index
    for canonical_id, group in df.groupby("canonical_animal_id"):
        dates = sorted(pd.to_datetime(group[date_col], errors="coerce").dropna().tolist())
        index[str(canonical_id)] = DateSeries(dates)
    return index


def lactation_phase(dim: float | int | None) -> str:
    if pd.isna(dim):
        return "unknown"
    dim_value = float(dim)
    if dim_value < 0:
        return "unknown"
    if dim_value <= 100:
        return "early"
    if dim_value <= 200:
        return "mid"
    return "late"


def parity_group(parite: float | int | None) -> str:
    if pd.isna(parite):
        return "unknown"
    value = int(float(parite))
    if value <= 0:
        return "unknown"
    if value == 1:
        return "p1"
    if value == 2:
        return "p2"
    return "p3plus"


def missing_flag(series: pd.Series) -> pd.Series:
    return series.isna().astype(int)


def safe_days(ref: pd.Timestamp, event_date: pd.Timestamp | None) -> float:
    if event_date is None or pd.isna(event_date):
        return np.nan
    return float((ref - event_date).days)


def rolling_numeric(
    events: pd.DataFrame,
    canonical_id: str,
    ref_date: pd.Timestamp,
    date_col: str,
    value_col: str,
    window_days: int,
) -> tuple[int, float]:
    if events.empty:
        return 0, np.nan
    group = events_by_animal(events).get(canonical_id)
    if group is None or group.empty:
        return 0, np.nan
    start = ref_date - timedelta(days=window_days)
    subset = group[(group[date_col] > start) & (group[date_col] <= ref_date)]
    if subset.empty:
        return 0, np.nan
    values = pd.to_numeric(subset[value_col], errors="coerce").dropna()
    return int(len(subset)), float(values.mean()) if len(values) else np.nan


_EVENT_GROUP_CACHE: dict[int, dict[str, pd.DataFrame]] = {}


def events_by_animal(events: pd.DataFrame) -> dict[str, pd.DataFrame]:
    key = id(events)
    cached = _EVENT_GROUP_CACHE.get(key)
    if cached is not None:
        return cached
    grouped = {str(canonical_id): group.copy() for canonical_id, group in events.groupby("canonical_animal_id")}
    _EVENT_GROUP_CACHE[key] = grouped
    return grouped


def milk_window_features(milk_events: pd.DataFrame, canonical_id: str, ref_date: pd.Timestamp) -> dict[str, float | int]:
    group = events_by_animal(milk_events).get(canonical_id)
    result: dict[str, float | int] = {
        "milk_obs_count_30": 0,
        "milk_obs_count_60": 0,
        "milk_obs_count_90": 0,
        "milk_avg_60": np.nan,
        "milk_avg_90": np.nan,
        "milk_trend_30_vs_prev30": np.nan,
        "milk_last_obs_gun": np.nan,
        "has_milk_observation_90": 0,
    }
    if group is None or group.empty:
        return result

    for window in (30, 60, 90):
        subset = group[(group["sagim_tarihi"] > ref_date - timedelta(days=window)) & (group["sagim_tarihi"] <= ref_date)]
        result[f"milk_obs_count_{window}"] = int(len(subset))
        if window in (60, 90) and not subset.empty:
            values = pd.to_numeric(subset["sut_miktar_kg"], errors="coerce").dropna()
            result[f"milk_avg_{window}"] = float(values.mean()) if len(values) else np.nan

    last_date = DateSeries(sorted(group["sagim_tarihi"].dropna().tolist())).last_on_or_before(ref_date)
    result["milk_last_obs_gun"] = safe_days(ref_date, last_date)
    result["has_milk_observation_90"] = int(result["milk_obs_count_90"] > 0)

    last30 = group[(group["sagim_tarihi"] > ref_date - timedelta(days=30)) & (group["sagim_tarihi"] <= ref_date)]
    prev30 = group[(group["sagim_tarihi"] > ref_date - timedelta(days=60)) & (group["sagim_tarihi"] <= ref_date - timedelta(days=30))]
    if not last30.empty and not prev30.empty:
        last_values = pd.to_numeric(last30["sut_miktar_kg"], errors="coerce").dropna()
        prev_values = pd.to_numeric(prev30["sut_miktar_kg"], errors="coerce").dropna()
        if len(last_values) and len(prev_values):
            result["milk_trend_30_vs_prev30"] = float(last_values.mean() - prev_values.mean())
    return result


def main() -> int:
    snapshots = pd.read_csv(INPUT_MODEL_READY, low_memory=False)
    snapshots["referans_tarih"] = pd.to_datetime(snapshots["referans_tarih"], errors="coerce")
    snapshots["observation_start"] = pd.to_datetime(snapshots["observation_start"], errors="coerce")

    calving = read_event(EVENT_DOGURMA, "dogurma_tarihi")
    service = read_event(EVENT_DOLLENME, "dollenme_tarihi")
    health = read_event(EVENT_HEALTH, "olay_tarihi", required_cols=["olay_tipi", "alt_tip"])
    milk = read_event(EVENT_SUT, "sagim_tarihi", required_cols=["sut_miktar_kg"])

    calving_idx = build_date_index(calving, "dogurma_tarihi")
    service_idx = build_date_index(service, "dollenme_tarihi")
    health_idx = build_date_index(health, "olay_tarihi")

    engineered = snapshots.copy()

    base_numeric = [
        "laktasyon_no",
        "parite",
        "dim",
        "yas_gun",
        "gebe_mi",
        "son_servis_gun",
        "son30_ortalama_sut",
        "sut_trend_7g",
    ]
    for column in base_numeric:
        engineered[f"{column}_missing_flag"] = missing_flag(engineered[column])

    engineered["dim_month"] = pd.to_numeric(engineered["dim"], errors="coerce") / 30.4375
    engineered["laktasyon_evresi"] = engineered["dim"].apply(lactation_phase)
    engineered["parite_grup"] = engineered["parite"].apply(parity_group)
    engineered["months_observed"] = (
        (engineered["referans_tarih"] - engineered["observation_start"]).dt.days / 30.4375
    ).clip(lower=0)

    rows: list[dict[str, float | int]] = []
    for row in engineered[["canonical_animal_id", "referans_tarih"]].itertuples(index=False):
        canonical_id = str(row.canonical_animal_id)
        ref_date = row.referans_tarih

        calvings = calving_idx.get(canonical_id, DateSeries([]))
        services = service_idx.get(canonical_id, DateSeries([]))
        health_events = health_idx.get(canonical_id, DateSeries([]))
        last_calving = calvings.last_on_or_before(ref_date)
        last_service = services.last_on_or_before(ref_date)
        last_health = health_events.last_on_or_before(ref_date)

        feature_row: dict[str, float | int] = {
            "calving_count_to_date": calvings.count_until(ref_date),
            "service_count_90": services.count_between(ref_date - timedelta(days=90), ref_date),
            "service_count_180": services.count_between(ref_date - timedelta(days=180), ref_date),
            "health_count_60": health_events.count_between(ref_date - timedelta(days=60), ref_date),
            "health_count_90": health_events.count_between(ref_date - timedelta(days=90), ref_date),
            "days_since_last_calving_event": safe_days(ref_date, last_calving),
            "days_since_last_service_event": safe_days(ref_date, last_service),
            "days_since_last_health_event": safe_days(ref_date, last_health),
            "has_service_observation_180": int(services.count_between(ref_date - timedelta(days=180), ref_date) > 0),
            "has_health_observation_365": int(health_events.count_between(ref_date - timedelta(days=365), ref_date) > 0),
        }
        feature_row.update(milk_window_features(milk, canonical_id, ref_date))
        rows.append(feature_row)

    rolling_features = pd.DataFrame(rows)
    engineered = pd.concat([engineered.reset_index(drop=True), rolling_features], axis=1)

    OUTPUT_MODEL_READY.parent.mkdir(parents=True, exist_ok=True)
    engineered.to_csv(OUTPUT_MODEL_READY, index=False)
    engineered[["snapshot_id", "source_code", "canonical_animal_id", "referans_tarih", "split"]].to_csv(OUTPUT_SPLIT, index=False)

    numeric_new = list(rolling_features.columns) + [
        "dim_month",
        "months_observed",
        *[f"{column}_missing_flag" for column in base_numeric],
    ]
    categorical_new = ["laktasyon_evresi", "parite_grup"]
    lines = [
        "# Engineered Feature Review",
        "",
        f"- Input rows: `{len(snapshots)}`",
        f"- Output rows: `{len(engineered)}`",
        "- Culling reason / future exit status is intentionally not used as a feature because it would leak label information.",
        "",
        "## New Numeric Features",
        "",
        *[f"- `{feature}`" for feature in numeric_new],
        "",
        "## New Categorical Features",
        "",
        *[f"- `{feature}`" for feature in categorical_new],
        "",
        "## Missingness",
        "",
        "Missingness flags are part of the feature set because Marcenat and Primiparous expose different observation channels.",
    ]
    FEATURE_REPORT.parent.mkdir(parents=True, exist_ok=True)
    FEATURE_REPORT.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")

    print(f"wrote {OUTPUT_MODEL_READY.relative_to(PROJECT_ROOT)} ({len(engineered)} rows)")
    print(f"wrote {OUTPUT_SPLIT.relative_to(PROJECT_ROOT)}")
    print(f"wrote {FEATURE_REPORT.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
