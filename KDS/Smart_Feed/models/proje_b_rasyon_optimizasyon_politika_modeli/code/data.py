from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import numpy as np
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


def _as_dict(value: Any) -> dict[str, Any]:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return {}
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            loaded = json.loads(value)
            return loaded if isinstance(loaded, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}


def _expand_json(frame: pd.DataFrame, column: str, prefix: str) -> pd.DataFrame:
    if column not in frame:
        return frame
    expanded = pd.json_normalize([_as_dict(value) for value in frame[column]]).add_prefix(prefix)
    expanded.index = frame.index
    return pd.concat([frame.drop(columns=[column]), expanded], axis=1)


def load_project_b_dataset(database_url: str | None = None, schema: str = "ml_smart_feed") -> pd.DataFrame:
    query = f"""
    select
        st.state_id,
        st.cow_id,
        st.record_date,
        st.state_json,
        a.action_id,
        a.action_type,
        a.action_json,
        t.reward::double precision as reward,
        t.done::int as done,
        rc.ration_candidate_id,
        rc.candidate_rank,
        rc.selected_flag::int as selected_flag,
        rc.feasible_flag::int as feasible_flag,
        rs.total_dmi_kg,
        rs.total_feed_cost::double precision as total_feed_cost,
        rs.expected_milk_yield_kg,
        rs.expected_milk_revenue::double precision as expected_milk_revenue,
        rs.expected_margin::double precision as expected_margin,
        rs.health_risk_penalty::double precision as health_risk_penalty,
        rs.ration_change_penalty::double precision as ration_change_penalty,
        rs.total_score::double precision as total_score,
        rs.nutrient_summary_json,
        rs.score_detail_json
    from {schema}.sim_transition t
    join {schema}.sim_state st
        on st.state_id = t.state_id
    join {schema}.sim_action a
        on a.action_id = t.action_id
    left join {schema}.opt_ration_candidate rc
        on rc.ration_candidate_id = a.ration_candidate_id
    left join {schema}.opt_ration_score rs
        on rs.ration_candidate_id = rc.ration_candidate_id
    order by st.cow_id, st.record_date
    """
    frame = read_sql_query(query, database_url)
    frame["record_date"] = pd.to_datetime(frame["record_date"])
    frame = _expand_json(frame, "state_json", "state_")
    frame = _expand_json(frame, "action_json", "action_")
    frame = _expand_json(frame, "nutrient_summary_json", "nutrient_")
    frame = _expand_json(frame, "score_detail_json", "score_")
    if "total_score" in frame:
        median_score = frame["total_score"].median()
        frame["good_ration"] = (frame["total_score"] >= median_score).astype(int)
    if "reward" in frame and frame["reward"].nunique(dropna=True) >= 3:
        try:
            band_codes = pd.qcut(frame["reward"], q=3, labels=False, duplicates="drop")
            frame["reward_band"] = band_codes.map({0: "low", 1: "medium", 2: "high"}).fillna("unknown").astype(str)
        except ValueError:
            frame["reward_band"] = "unknown"
    else:
        frame["reward_band"] = "unknown"
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
    return summary
