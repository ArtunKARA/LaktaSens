from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import yaml


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = PROJECT_ROOT / "config" / "rl_env_rules.yaml"


def read_rules(path: Path = RULES_PATH) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def path_from_root(path_text: str) -> Path:
    return PROJECT_ROOT / path_text


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if np.isnan(number):
        return default
    return number


def load_reward_parameters(path: Path) -> dict[str, float]:
    df = pd.read_csv(path, low_memory=False)
    values: dict[str, float] = {}
    for _, row in df.iterrows():
        values[str(row["parameter"])] = safe_float(row["value"])
    return values


def apply_reward_scenario(base: dict[str, float], scenario: dict[str, Any] | None = None) -> dict[str, float]:
    scenario = scenario or {}
    values = dict(base)
    values["sut_fiyati"] = values.get("sut_fiyati", 0.0) * float(scenario.get("milk_price_multiplier", 1.0))
    values["gunluk_bakim_maliyeti"] = values.get("gunluk_bakim_maliyeti", 0.0) * float(
        scenario.get("maintenance_cost_multiplier", 1.0)
    )
    values["replacement_maliyeti"] = values.get("replacement_maliyeti", 0.0) * float(
        scenario.get("replacement_cost_multiplier", 1.0)
    )
    values["cull_satis_degeri"] = values.get("cull_satis_degeri", 0.0) * float(
        scenario.get("cull_sale_value_multiplier", 1.0)
    )
    values["tedavi_maliyeti"] = values.get("tedavi_maliyeti", 0.0) * float(
        scenario.get("treatment_cost_multiplier", 1.0)
    )
    values["basarisiz_tohumlama_maliyeti"] = values.get("basarisiz_tohumlama_maliyeti", 0.0) * float(
        scenario.get("insemination_cost_multiplier", 1.0)
    )
    return values


def reward_components(row: pd.Series, action_name: str, rules: dict[str, Any], parameters: dict[str, float]) -> dict[str, float]:
    days = float(rules["reward"]["days_in_month"])
    coefficients = rules["reward"].get("coefficients", {})
    milk_price = parameters.get("sut_fiyati", 0.0)
    maintenance_daily = parameters.get("gunluk_bakim_maliyeti", 0.0)
    treatment_cost = parameters.get("tedavi_maliyeti", 0.0)
    insemination_cost = parameters.get("basarisiz_tohumlama_maliyeti", 0.0)
    replacement_cost = parameters.get("replacement_maliyeti", 0.0)
    cull_sale_value = parameters.get("cull_satis_degeri", 0.0)
    disposal_cost = safe_float(rules["reward"].get("disposal_or_transaction_cost"), 0.0)

    if action_name == "cull":
        reward = cull_sale_value - replacement_cost - disposal_cost
        return {
            "milk_revenue_month": 0.0,
            "maintenance_cost_month": 0.0,
            "health_risk_cost_month": 0.0,
            "reproduction_risk_cost_month": 0.0,
            "expected_culling_risk_cost_month": 0.0,
            "cull_sale_value": cull_sale_value,
            "replacement_cost": replacement_cost,
            "disposal_or_transaction_cost": disposal_cost,
            "reward": reward,
        }

    daily_milk_kg = max(safe_float(row.get("daily_milk_kg")), 0.0)
    milk_revenue = daily_milk_kg * days * milk_price
    maintenance = maintenance_daily * days

    health_events_month = safe_float(row.get("health_count_90")) * float(
        coefficients.get("health_event_monthly_fraction", 1 / 3)
    )
    health_cost = health_events_month * treatment_cost
    health_cost += safe_float(row.get("mastitis_flag")) * treatment_cost * float(
        coefficients.get("mastitis_flag_cost_fraction", 0.25)
    )
    health_cost += safe_float(row.get("lameness_flag")) * treatment_cost * float(
        coefficients.get("lameness_flag_cost_fraction", 0.25)
    )
    health_cost += safe_float(row.get("cell_risk_flag")) * treatment_cost * float(
        coefficients.get("cell_risk_flag_cost_fraction", 0.15)
    )

    extra_service_threshold = float(coefficients.get("extra_service_threshold", 2))
    extra_services = max(safe_float(row.get("servis_sayisi")) - extra_service_threshold, 0.0)
    reproduction_cost = extra_services * insemination_cost
    if safe_float(row.get("gebe_mi"), default=0.0) < 0.5 and safe_float(row.get("dim")) > float(
        coefficients.get("open_cow_dim_threshold", 150)
    ):
        reproduction_cost += insemination_cost * float(coefficients.get("open_cow_penalty_service_equivalent", 1.0))

    expected_culling_cost = (
        safe_float(row.get("cull_risk_30d"))
        * replacement_cost
        * float(coefficients.get("expected_culling_risk_cost_fraction", 0.25))
    )
    reward = milk_revenue - maintenance - health_cost - reproduction_cost - expected_culling_cost
    return {
        "milk_revenue_month": milk_revenue,
        "maintenance_cost_month": maintenance,
        "health_risk_cost_month": health_cost,
        "reproduction_risk_cost_month": reproduction_cost,
        "expected_culling_risk_cost_month": expected_culling_cost,
        "cull_sale_value": 0.0,
        "replacement_cost": 0.0,
        "disposal_or_transaction_cost": 0.0,
        "reward": reward,
    }


def representative_value(group: pd.DataFrame, column: str) -> Any:
    if column not in group:
        return ""
    values = group[column].dropna()
    if values.empty:
        return ""
    mode = values.mode(dropna=True)
    return mode.iloc[0] if not mode.empty else values.iloc[0]


def build_reward_table(
    state: pd.DataFrame,
    rules: dict[str, Any],
    parameters: dict[str, float],
    scenario_name: str = "baseline",
) -> pd.DataFrame:
    state_column = rules["mdp"]["state_column"]
    rows: list[dict[str, Any]] = []
    component_columns = [
        "milk_revenue_month",
        "maintenance_cost_month",
        "health_risk_cost_month",
        "reproduction_risk_cost_month",
        "expected_culling_risk_cost_month",
        "cull_sale_value",
        "replacement_cost",
        "disposal_or_transaction_cost",
        "reward",
    ]
    state_metadata_columns = [
        "state_bucket_no_risk",
        "state_bucket_stage_parity",
        "laktasyon_evresi",
        "parite_grup",
        "dim_band",
        "milk_level_band",
        "milk_trend_band",
        "health_risk_band",
        "risk_band",
    ]
    numeric_summary_columns = ["daily_milk_kg", "cull_risk_90d", "cull_risk_30d", "health_risk_score", "dim"]

    for state_bucket, group in state.groupby(state_column, dropna=False):
        for action_name in ["keep", "cull"]:
            components = pd.DataFrame(
                [reward_components(row, action_name, rules, parameters) for _, row in group.iterrows()]
            )
            row: dict[str, Any] = {
                "scenario": scenario_name,
                "state_bucket_exact": state_bucket,
                "action_name": action_name,
                "action": 0 if action_name == "keep" else 1,
                "state_support": int(len(group)),
            }
            for column in state_metadata_columns:
                row[column] = representative_value(group, column)
            for column in numeric_summary_columns:
                row[f"mean_{column}"] = float(pd.to_numeric(group[column], errors="coerce").mean()) if column in group else 0.0
            for column in component_columns:
                row[column] = float(components[column].mean())
            rows.append(row)
    return pd.DataFrame(rows).sort_values(["scenario", "state_bucket_exact", "action"])


def load_state_and_reward_inputs(rules: dict[str, Any], scenario: dict[str, Any] | None = None) -> tuple[pd.DataFrame, dict[str, float]]:
    state_path = path_from_root(rules["output"]["mdp_state_table_csv"])
    reward_path = path_from_root(rules["input"]["reward_baseline_csv"])
    if not state_path.exists():
        raise FileNotFoundError(state_path)
    if not reward_path.exists():
        raise FileNotFoundError(reward_path)
    state = pd.read_csv(state_path, low_memory=False)
    base_parameters = load_reward_parameters(reward_path)
    return state, apply_reward_scenario(base_parameters, scenario)


def transition_rows_for_state(
    state_row: pd.Series,
    transition_model: pd.DataFrame,
    rules: dict[str, Any],
) -> tuple[pd.DataFrame, str, int]:
    min_support = int(rules["mdp"].get("min_transition_support_for_exact", 1))
    for bucket_column in rules["transition"]["fallback_order"]:
        current_bucket = "global" if bucket_column == "global" else str(state_row.get(bucket_column, ""))
        rows = transition_model[
            transition_model["action_name"].eq("keep")
            & transition_model["bucket_column"].eq(bucket_column)
            & transition_model["current_bucket"].astype(str).eq(current_bucket)
        ].copy()
        if rows.empty:
            continue
        support = int(pd.to_numeric(rows["total_count"], errors="coerce").max())
        if bucket_column != "state_bucket_exact" or support >= min_support:
            return rows, bucket_column, support
    rows = transition_model[
        transition_model["action_name"].eq("keep")
        & transition_model["bucket_column"].eq("global")
        & transition_model["current_bucket"].astype(str).eq("global")
    ].copy()
    support = int(pd.to_numeric(rows["total_count"], errors="coerce").max()) if not rows.empty else 0
    return rows, "global", support


def solve_value_iteration(
    reward_table: pd.DataFrame,
    transition_model: pd.DataFrame,
    rules: dict[str, Any],
    discount_factor: float | None = None,
) -> tuple[pd.DataFrame, dict[str, Any]]:
    gamma = float(discount_factor if discount_factor is not None else rules["mdp"]["discount_factor"])
    tolerance = float(rules["mdp"].get("convergence_tolerance", 1e-4))
    max_iterations = int(rules["mdp"].get("max_iterations", 1000))
    tie_break_action = str(rules["mdp"].get("tie_break_action", "keep"))
    state_meta = (
        reward_table[reward_table["action_name"].eq("keep")]
        .drop_duplicates("state_bucket_exact")
        .set_index("state_bucket_exact", drop=False)
    )
    states = sorted(state_meta.index.astype(str).tolist())
    rewards = {
        (str(row["state_bucket_exact"]), str(row["action_name"])): float(row["reward"])
        for _, row in reward_table.iterrows()
    }
    transition_lookup: dict[str, list[tuple[str, float]]] = {}
    fallback_used: dict[str, str] = {}
    transition_support: dict[str, int] = {}
    for state in states:
        meta = state_meta.loc[state]
        rows, fallback, support = transition_rows_for_state(meta, transition_model, rules)
        fallback_used[state] = fallback
        transition_support[state] = support
        next_items: list[tuple[str, float]] = []
        if not rows.empty:
            probabilities = pd.to_numeric(rows["probability"], errors="coerce").fillna(0.0)
            probability_sum = float(probabilities.sum())
            if probability_sum > 0:
                probabilities = probabilities / probability_sum
            for (_, row), probability in zip(rows.iterrows(), probabilities):
                if row["outcome_type"] != "next_state":
                    continue
                next_state = str(row.get("outcome_state_bucket_exact", ""))
                next_items.append((next_state, float(probability)))
        transition_lookup[state] = next_items

    values = {state: 0.0 for state in states}
    q_keep: dict[str, float] = {}
    q_cull: dict[str, float] = {}

    for iteration in range(1, max_iterations + 1):
        delta = 0.0
        new_values: dict[str, float] = {}
        for state in states:
            expected_future = 0.0
            for next_state, probability in transition_lookup[state]:
                expected_future += probability * values.get(next_state, 0.0)
            keep_value = rewards.get((state, "keep"), 0.0) + gamma * expected_future
            cull_value = rewards.get((state, "cull"), 0.0)
            best_value = max(keep_value, cull_value)
            new_values[state] = best_value
            delta = max(delta, abs(best_value - values[state]))
            q_keep[state] = keep_value
            q_cull[state] = cull_value
        values = new_values
        if delta < tolerance:
            break

    rows_out: list[dict[str, Any]] = []
    for state in states:
        keep_value = q_keep[state]
        cull_value = q_cull[state]
        if abs(keep_value - cull_value) <= 1e-12:
            optimal_action = tie_break_action
        else:
            optimal_action = "keep" if keep_value > cull_value else "cull"
        meta = state_meta.loc[state]
        rows_out.append(
            {
                "state_bucket_exact": state,
                "optimal_action": optimal_action,
                "state_value": values[state],
                "q_keep": keep_value,
                "q_cull": cull_value,
                "action_margin_cull_minus_keep": cull_value - keep_value,
                "transition_fallback_used": fallback_used[state],
                "transition_support": transition_support[state],
                "state_support": int(meta.get("state_support", 0)),
                "laktasyon_evresi": meta.get("laktasyon_evresi", ""),
                "parite_grup": meta.get("parite_grup", ""),
                "dim_band": meta.get("dim_band", ""),
                "milk_level_band": meta.get("milk_level_band", ""),
                "milk_trend_band": meta.get("milk_trend_band", ""),
                "health_risk_band": meta.get("health_risk_band", ""),
                "risk_band": meta.get("risk_band", ""),
                "mean_daily_milk_kg": meta.get("mean_daily_milk_kg", np.nan),
                "mean_cull_risk_90d": meta.get("mean_cull_risk_90d", np.nan),
                "mean_cull_risk_30d": meta.get("mean_cull_risk_30d", np.nan),
                "reward_keep": rewards.get((state, "keep"), 0.0),
                "reward_cull": rewards.get((state, "cull"), 0.0),
            }
        )
    metadata = {
        "iterations": iteration,
        "final_delta": delta,
        "discount_factor": gamma,
        "converged": bool(delta < tolerance),
        "state_count": len(states),
    }
    return pd.DataFrame(rows_out).sort_values("state_bucket_exact"), metadata
