from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError


def get_database_url(database_url: str | None = None) -> str:
    url = database_url or os.getenv("SMART_FEED_DATABASE_URL")
    if not url:
        raise RuntimeError(
            "SMART_FEED_DATABASE_URL is not set. In the notebook, enter the "
            "PostgreSQL password and build the URL for the current session."
        )
    return url


def make_engine(database_url: str | None = None) -> Any:
    return create_engine(get_database_url(database_url))


def _wsl_windows_host_ip() -> str | None:
    resolv_conf = Path("/etc/resolv.conf")
    if not resolv_conf.exists():
        return None
    for line in resolv_conf.read_text(errors="ignore").splitlines():
        parts = line.strip().split()
        if len(parts) == 2 and parts[0] == "nameserver":
            return parts[1]
    return None


def _candidate_database_urls(database_url: str | None = None) -> list[str]:
    url = get_database_url(database_url)
    urls = [url]
    host_ip = _wsl_windows_host_ip()
    if host_ip:
        if "@localhost:" in url:
            urls.append(url.replace("@localhost:", f"@{host_ip}:"))
        elif "@127.0.0.1:" in url:
            urls.append(url.replace("@127.0.0.1:", f"@{host_ip}:"))
    return list(dict.fromkeys(urls))


def read_sql_query(query: str, database_url: str | None = None) -> pd.DataFrame:
    last_error: Exception | None = None
    for candidate_url in _candidate_database_urls(database_url):
        try:
            with create_engine(candidate_url).connect() as connection:
                return pd.read_sql_query(query, connection)
        except OperationalError as exc:
            last_error = exc
    if last_error:
        raise last_error
    raise RuntimeError("No database URL candidates were available.")


def load_project_a_dataset(database_url: str | None = None, schema: str = "ml_smart_feed") -> pd.DataFrame:
    query = f"""
    with snapshot_base as (
        select
            s.snapshot_id,
            s.cow_id,
            s.record_date,
            s.parity,
            s.body_weight_kg,
            s.bcs,
            s.dim,
            s.pregnancy_status,
            s.lactation_stage,
            s.daily_milk_yield_kg,
            s.milk_fat_percent,
            s.milk_protein_percent,
            s.fat_protein_ratio,
            s.scc,
            s.milk_electrical_conductivity,
            s.ration_type,
            s.dry_matter_percent,
            s.estimated_dmi_kg,
            s.forage_concentrate_ratio,
            s.feed_change_last7d,
            s.rumination_minutes,
            s.activity_level,
            s.lying_time_minutes,
            s.body_temperature,
            s.water_intake_liter,
            (to_jsonb(s)->>'movement_distance_m')::double precision as movement_distance_m,
            (to_jsonb(s)->>'accel_magnitude_mean')::double precision as accel_magnitude_mean,
            (to_jsonb(s)->>'accel_magnitude_std')::double precision as accel_magnitude_std,
            (to_jsonb(s)->>'pressure_mean_pa')::double precision as pressure_mean_pa,
            (to_jsonb(s)->>'pressure_std_pa')::double precision as pressure_std_pa,
            (to_jsonb(s)->>'elevation_mean_m')::double precision as elevation_mean_m,
            (to_jsonb(s)->>'elevation_std_m')::double precision as elevation_std_m,
            s.thi,
            coalesce(to_jsonb(s)->>'data_origin', 'unknown') as data_origin,
            coalesce((to_jsonb(s)->>'is_synthetic')::boolean, false) as is_synthetic,
            lead(s.daily_milk_yield_kg) over (
                partition by s.cow_id order by s.record_date
            ) as next_day_milk_yield_kg
        from {schema}.feat_cow_day_snapshot s
    ),
    prediction_base as (
        select distinct on (cow_id, record_date)
            cow_id,
            record_date,
            early_warning_flag,
            energy_deficit_risk_score,
            ketosis_risk_score,
            mastitis_risk_score,
            asidosis_risk_score
        from {schema}.feat_prediction_a
        order by cow_id, record_date, created_at desc, prediction_id desc
    )
    select
        sb.*,
        coalesce(h.ketosis_label_7d, false)::int as ketosis_7d,
        coalesce(h.ketosis_label_14d, false)::int as ketosis_14d,
        coalesce(h.mastitis_label_7d, false)::int as mastitis_7d,
        coalesce(h.mastitis_label_14d, false)::int as mastitis_14d,
        coalesce(h.asidosis_label_7d, false)::int as asidosis_7d,
        h.energy_deficit_risk,
        coalesce(to_jsonb(h)->>'label_origin', 'unknown') as label_origin,
        coalesce((to_jsonb(h)->>'is_synthetic')::boolean, false) as label_is_synthetic,
        (h.energy_deficit_risk = 'high')::int as energy_deficit_high,
        f.feeding_need_class,
        f.need_score,
        coalesce(p.early_warning_flag, false)::int as early_warning_flag,
        p.energy_deficit_risk_score,
        p.ketosis_risk_score,
        p.mastitis_risk_score,
        p.asidosis_risk_score
    from snapshot_base sb
    left join {schema}.feat_health_risk_label h
        on h.cow_id = sb.cow_id and h.record_date = sb.record_date
    left join {schema}.feat_feeding_need_label f
        on f.cow_id = sb.cow_id and f.record_date = sb.record_date
    left join prediction_base p
        on p.cow_id = sb.cow_id and p.record_date = sb.record_date
    order by sb.cow_id, sb.record_date
    """
    frame = read_sql_query(query, database_url)
    frame["record_date"] = pd.to_datetime(frame["record_date"])
    for column in ["feed_change_last7d"]:
        if column in frame:
            frame[column] = frame[column].astype(float)
    return frame


def dataset_summary(frame: pd.DataFrame, target_name: str) -> dict[str, Any]:
    summary: dict[str, Any] = {
        "rows": int(len(frame)),
        "cows": int(frame["cow_id"].nunique()) if "cow_id" in frame else 0,
        "min_date": str(frame["record_date"].min().date()) if len(frame) else None,
        "max_date": str(frame["record_date"].max().date()) if len(frame) else None,
        "target": target_name,
        "target_nulls": int(frame[target_name].isna().sum()) if target_name in frame else None,
    }
    if target_name in frame:
        summary["target_distribution"] = frame[target_name].value_counts(dropna=False).to_dict()
    if "data_origin" in frame:
        summary["data_origin_distribution"] = frame["data_origin"].value_counts(dropna=False).to_dict()
    if "is_synthetic" in frame and len(frame):
        summary["synthetic_rows"] = int(frame["is_synthetic"].fillna(False).astype(bool).sum())
        summary["synthetic_percent"] = round(summary["synthetic_rows"] / len(frame) * 100, 2)
    return summary
