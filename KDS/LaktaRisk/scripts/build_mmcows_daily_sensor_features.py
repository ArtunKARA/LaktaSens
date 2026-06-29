#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


DEFAULT_INPUT = Path("KDS/Smart_Feed/Data/external/mmcows_multimodal/main_data")
DEFAULT_OUTPUT = Path(
    "KDS/Smart_Feed/Data/generated/postgres_import/mmcows_multimodal/"
    "daily_sensor_features.csv"
)
WEARABLE_COWS = {f"T{number:02d}": f"C{number:02d}" for number in range(1, 11)}
ANKLE_COWS = {f"C{number:02d}" for number in range(1, 11)}
CHUNK_SIZE = 500_000


def _date_series(timestamp: pd.Series) -> pd.Series:
    return pd.to_datetime(timestamp, unit="s", utc=True).dt.tz_convert("America/Chicago").dt.date.astype(str)


def _stats() -> dict[str, float]:
    return {"count": 0.0, "sum": 0.0, "sum_sq": 0.0}


def _update_stats(target: dict[str, float], values: pd.Series) -> None:
    numeric = pd.to_numeric(values, errors="coerce").dropna().to_numpy(dtype=float)
    if not len(numeric):
        return
    target["count"] += float(len(numeric))
    target["sum"] += float(numeric.sum())
    target["sum_sq"] += float(np.square(numeric).sum())


def _mean_std(stats: dict[str, float]) -> tuple[float | None, float | None]:
    count = stats["count"]
    if not count:
        return None, None
    mean = stats["sum"] / count
    variance = max(0.0, stats["sum_sq"] / count - mean * mean)
    return mean, math.sqrt(variance)


def _tag_from_path(path: Path) -> str | None:
    for part in path.parts:
        if part in WEARABLE_COWS:
            return part
    return None


def _iter_chunks(path: Path, columns: list[str]) -> Any:
    return pd.read_csv(path, usecols=columns, chunksize=CHUNK_SIZE)


def summarize_ankle(
    root: Path,
    rows: dict[tuple[str, str], dict[str, Any]],
) -> None:
    for path in sorted((root / "ankle").glob("C*/*.csv")):
        cow = path.parent.name
        if cow not in ANKLE_COWS:
            continue
        for chunk in _iter_chunks(path, ["timestamp", "lying"]):
            chunk["record_date"] = _date_series(chunk["timestamp"])
            for record_date, group in chunk.groupby("record_date"):
                key = (cow, record_date)
                lying = pd.to_numeric(group["lying"], errors="coerce").dropna()
                rows[key]["ankle_samples"] += int(len(lying))
                rows[key]["lying_time_minutes"] += float(lying.sum())


def summarize_uwb(
    root: Path,
    rows: dict[tuple[str, str], dict[str, Any]],
) -> None:
    previous: dict[str, tuple[float, float, float, str]] = {}
    for path in sorted((root / "uwb").glob("T*/*.csv")):
        tag = _tag_from_path(path)
        if tag not in WEARABLE_COWS:
            continue
        cow = WEARABLE_COWS[tag]
        for chunk in _iter_chunks(path, ["timestamp", "coord_x_cm", "coord_y_cm"]):
            chunk = chunk.apply(pd.to_numeric, errors="coerce").dropna()
            if chunk.empty:
                continue
            chunk["record_date"] = _date_series(chunk["timestamp"])
            for record_date, group in chunk.groupby("record_date", sort=False):
                key = (cow, record_date)
                rows[key]["uwb_samples"] += int(len(group))
                timestamps = group["timestamp"].to_numpy(dtype=float)
                x_values = group["coord_x_cm"].to_numpy(dtype=float)
                y_values = group["coord_y_cm"].to_numpy(dtype=float)
                if cow in previous and previous[cow][3] == record_date:
                    timestamps = np.insert(timestamps, 0, previous[cow][0])
                    x_values = np.insert(x_values, 0, previous[cow][1])
                    y_values = np.insert(y_values, 0, previous[cow][2])
                time_diff = np.diff(timestamps)
                distance_m = np.hypot(np.diff(x_values), np.diff(y_values)) / 100.0
                valid = (time_diff > 0) & (time_diff <= 60) & (distance_m <= 15)
                rows[key]["movement_distance_m"] += float(distance_m[valid].sum())
                previous[cow] = (
                    float(timestamps[-1]),
                    float(x_values[-1]),
                    float(y_values[-1]),
                    record_date,
                )


def summarize_immu(
    root: Path,
    rows: dict[tuple[str, str], dict[str, Any]],
) -> None:
    columns = ["timestamp", "accel_x_mps2", "accel_y_mps2", "accel_z_mps2"]
    for path in sorted((root / "immu").glob("T*/*.csv")):
        tag = _tag_from_path(path)
        if tag not in WEARABLE_COWS:
            continue
        cow = WEARABLE_COWS[tag]
        for chunk in _iter_chunks(path, columns):
            chunk = chunk.apply(pd.to_numeric, errors="coerce").dropna()
            if chunk.empty:
                continue
            chunk["record_date"] = _date_series(chunk["timestamp"])
            chunk["accel_magnitude"] = np.sqrt(
                np.square(chunk["accel_x_mps2"])
                + np.square(chunk["accel_y_mps2"])
                + np.square(chunk["accel_z_mps2"])
            )
            for record_date, group in chunk.groupby("record_date"):
                key = (cow, record_date)
                rows[key]["immu_samples"] += int(len(group))
                _update_stats(rows[key]["accel_magnitude"], group["accel_magnitude"])


def summarize_pressure(
    root: Path,
    rows: dict[tuple[str, str], dict[str, Any]],
) -> None:
    columns = ["timestamp", "pressure_Pa", "elevation_m"]
    for path in sorted((root / "pressure").glob("T*/*.csv")):
        tag = _tag_from_path(path)
        if tag not in WEARABLE_COWS:
            continue
        cow = WEARABLE_COWS[tag]
        for chunk in _iter_chunks(path, columns):
            chunk = chunk.apply(pd.to_numeric, errors="coerce").dropna()
            if chunk.empty:
                continue
            chunk["record_date"] = _date_series(chunk["timestamp"])
            for record_date, group in chunk.groupby("record_date"):
                key = (cow, record_date)
                rows[key]["pressure_samples"] += int(len(group))
                _update_stats(rows[key]["pressure"], group["pressure_Pa"])
                _update_stats(rows[key]["elevation"], group["elevation_m"])


def _new_row() -> dict[str, Any]:
    return {
        "lying_time_minutes": 0.0,
        "movement_distance_m": 0.0,
        "accel_magnitude": _stats(),
        "pressure": _stats(),
        "elevation": _stats(),
        "ankle_samples": 0,
        "uwb_samples": 0,
        "immu_samples": 0,
        "pressure_samples": 0,
    }


def build_daily_features(input_dir: Path) -> pd.DataFrame:
    rows: dict[tuple[str, str], dict[str, Any]] = defaultdict(_new_row)
    summarize_ankle(input_dir, rows)
    summarize_uwb(input_dir, rows)
    summarize_immu(input_dir, rows)
    summarize_pressure(input_dir, rows)

    output_rows: list[dict[str, Any]] = []
    for (cow, record_date), values in sorted(rows.items()):
        accel_mean, accel_std = _mean_std(values["accel_magnitude"])
        pressure_mean, pressure_std = _mean_std(values["pressure"])
        elevation_mean, elevation_std = _mean_std(values["elevation"])
        output_rows.append(
            {
                "external_cow_id": cow,
                "record_date": record_date,
                "lying_time_minutes": round(values["lying_time_minutes"], 6),
                "movement_distance_m": round(values["movement_distance_m"], 6),
                "accel_magnitude_mean": accel_mean,
                "accel_magnitude_std": accel_std,
                "pressure_mean_pa": pressure_mean,
                "pressure_std_pa": pressure_std,
                "elevation_mean_m": elevation_mean,
                "elevation_std_m": elevation_std,
                "ankle_samples": values["ankle_samples"],
                "uwb_samples": values["uwb_samples"],
                "immu_samples": values["immu_samples"],
                "pressure_samples": values["pressure_samples"],
            }
        )
    return pd.DataFrame(output_rows)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Aggregate MmCows wearable data into cow-day features.")
    parser.add_argument("--input-dir", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    frame = build_daily_features(args.input_dir)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(args.output, index=False, float_format="%.8f")
    sample_columns = ["ankle_samples", "uwb_samples", "immu_samples", "pressure_samples"]
    sample_count = int(frame[sample_columns].sum().sum())
    print(
        f"Aggregated {sample_count:,} raw samples into {len(frame)} cow-day rows "
        f"for {frame['external_cow_id'].nunique()} cows; wrote {args.output}"
    )


if __name__ == "__main__":
    main()
