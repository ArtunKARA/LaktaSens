from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd

from training_environment import ACTION_CULL, ACTION_KEEP, CommandResult, RLTrainingEnvironment


ACTION_NAMES = {ACTION_KEEP: "keep", ACTION_CULL: "cull"}


@dataclass
class TabularMdp:
    states: list[str]
    state_to_idx: dict[str, int]
    state_info: pd.DataFrame
    rewards: np.ndarray
    keep_outcomes: list[list[tuple[int | None, float]]]
    initial_weights: np.ndarray
    gamma: float


def project_path(env: RLTrainingEnvironment, path_text: str) -> Any:
    return env.project_root / path_text


def direct_result(name: str, stdout: str = "") -> list[CommandResult]:
    return [
        CommandResult(
            name=name,
            returncode=0,
            command=["direct-model", name],
            stdout=stdout,
            stderr="",
        )
    ]


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if np.isnan(number):
        return default
    return number


def load_reward_parameters(path: Any) -> dict[str, float]:
    df = pd.read_csv(path, low_memory=False)
    return {str(row["parameter"]): safe_float(row["value"]) for _, row in df.iterrows()}


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
            out: dict[str, Any] = {
                "scenario": scenario_name,
                "state_bucket_exact": state_bucket,
                "action_name": action_name,
                "action": 0 if action_name == "keep" else 1,
                "state_support": int(len(group)),
            }
            for column in state_metadata_columns:
                out[column] = representative_value(group, column)
            for column in numeric_summary_columns:
                out[f"mean_{column}"] = (
                    float(pd.to_numeric(group[column], errors="coerce").mean()) if column in group else 0.0
                )
            for column in component_columns:
                out[column] = float(components[column].mean())
            rows.append(out)
    return pd.DataFrame(rows).sort_values(["scenario", "state_bucket_exact", "action"])


def load_state_and_reward_inputs(
    env: RLTrainingEnvironment,
    rules: dict[str, Any],
    scenario: dict[str, Any] | None = None,
) -> tuple[pd.DataFrame, dict[str, float]]:
    state_path = project_path(env, rules["output"]["mdp_state_table_csv"])
    reward_path = project_path(env, rules["input"]["reward_baseline_csv"])
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
        rows, fallback, support = transition_rows_for_state(state_meta.loc[state], transition_model, rules)
        fallback_used[state] = fallback
        transition_support[state] = support
        outcomes: list[tuple[str, float]] = []
        if not rows.empty:
            probs = pd.to_numeric(rows["probability"], errors="coerce").fillna(0.0)
            total = float(probs.sum())
            probs = probs / total if total > 0 else pd.Series(1.0 / len(rows), index=rows.index)
            for (_, row), probability in zip(rows.iterrows(), probs):
                if row["outcome_type"] == "next_state":
                    next_state = str(row.get("outcome_state_bucket_exact", ""))
                    outcomes.append((next_state, float(probability)))
                else:
                    outcomes.append(("__terminal__", float(probability)))
        if not outcomes:
            outcomes.append(("__terminal__", 1.0))
        transition_lookup[state] = outcomes

    values = {state: 0.0 for state in states}
    final_delta = 0.0
    iteration = 0
    for iteration in range(1, max_iterations + 1):
        new_values: dict[str, float] = {}
        for state in states:
            future_value = sum(
                probability * values.get(next_state, 0.0)
                for next_state, probability in transition_lookup[state]
                if next_state != "__terminal__"
            )
            q_keep = rewards.get((state, "keep"), 0.0) + gamma * future_value
            q_cull = rewards.get((state, "cull"), 0.0)
            new_values[state] = q_cull if q_cull > q_keep else q_keep
        final_delta = max(abs(new_values[state] - values[state]) for state in states) if states else 0.0
        values = new_values
        if final_delta < tolerance:
            break

    rows: list[dict[str, Any]] = []
    for state in states:
        future_value = sum(
            probability * values.get(next_state, 0.0)
            for next_state, probability in transition_lookup[state]
            if next_state != "__terminal__"
        )
        q_keep = rewards.get((state, "keep"), 0.0) + gamma * future_value
        q_cull = rewards.get((state, "cull"), 0.0)
        if q_cull > q_keep:
            optimal_action = "cull"
        elif q_keep > q_cull:
            optimal_action = "keep"
        else:
            optimal_action = tie_break_action
        meta = state_meta.loc[state].to_dict()
        rows.append(
            {
                **meta,
                "state_bucket_exact": state,
                "state_value": values[state],
                "q_keep": q_keep,
                "q_cull": q_cull,
                "optimal_action": optimal_action,
                "action_margin_cull_minus_keep": q_cull - q_keep,
                "transition_fallback_used": fallback_used[state],
                "transition_support": transition_support[state],
            }
        )
    metadata = {
        "discount_factor": gamma,
        "iterations": iteration,
        "final_delta": final_delta,
        "converged": bool(final_delta < tolerance),
    }
    return pd.DataFrame(rows).sort_values("state_bucket_exact"), metadata


def initial_state_weights(state_table: pd.DataFrame, state_to_idx: dict[str, int]) -> np.ndarray:
    state_table = state_table.copy()
    state_table["referans_tarih"] = pd.to_datetime(state_table["referans_tarih"], errors="coerce")
    first = (
        state_table.sort_values(["canonical_animal_id", "referans_tarih"])
        .groupby("canonical_animal_id", as_index=False)
        .head(1)
    )
    weights = np.zeros(len(state_to_idx), dtype="float64")
    for bucket, count in first["state_bucket_exact"].astype(str).value_counts().items():
        idx = state_to_idx.get(bucket)
        if idx is not None:
            weights[idx] += float(count)
    if weights.sum() == 0:
        weights[:] = 1.0 / len(weights)
    else:
        weights = weights / weights.sum()
    return weights


def load_tabular_mdp(env: RLTrainingEnvironment, rules: dict[str, Any], transition_model: pd.DataFrame | None = None) -> TabularMdp:
    reward_path = project_path(env, rules["output"]["mdp_reward_table_csv"])
    state_path = project_path(env, rules["output"]["mdp_state_table_csv"])
    transition_path = project_path(env, rules["output"]["empirical_transition_model_csv"])
    if not reward_path.exists():
        raise FileNotFoundError(reward_path)
    if not state_path.exists():
        raise FileNotFoundError(state_path)
    if transition_model is None:
        if not transition_path.exists():
            raise FileNotFoundError(transition_path)
        transition_model = pd.read_csv(transition_path, low_memory=False)

    reward_table = pd.read_csv(reward_path, low_memory=False)
    state_table = pd.read_csv(state_path, low_memory=False)
    keep_rows = (
        reward_table[reward_table["action_name"].eq("keep")]
        .drop_duplicates("state_bucket_exact")
        .sort_values("state_bucket_exact")
        .reset_index(drop=True)
    )
    states = keep_rows["state_bucket_exact"].astype(str).tolist()
    state_to_idx = {state: idx for idx, state in enumerate(states)}
    rewards = np.zeros((len(states), 2), dtype="float64")
    for _, row in reward_table.iterrows():
        state = str(row["state_bucket_exact"])
        action = ACTION_KEEP if row["action_name"] == "keep" else ACTION_CULL
        if state in state_to_idx:
            rewards[state_to_idx[state], action] = safe_float(row.get("reward"))

    keep_outcomes: list[list[tuple[int | None, float]]] = []
    for _, meta in keep_rows.iterrows():
        rows, _, _ = transition_rows_for_state(meta, transition_model, rules)
        outcomes: list[tuple[int | None, float]] = []
        if rows.empty:
            outcomes.append((None, 1.0))
        else:
            probabilities = pd.to_numeric(rows["probability"], errors="coerce").fillna(0.0)
            total = float(probabilities.sum())
            probabilities = probabilities / total if total > 0 else pd.Series(1.0 / len(rows), index=rows.index)
            for (_, transition), probability in zip(rows.iterrows(), probabilities):
                if transition["outcome_type"] == "next_state":
                    next_state = str(transition.get("outcome_state_bucket_exact", ""))
                    outcomes.append((state_to_idx.get(next_state), float(probability)))
                else:
                    outcomes.append((None, float(probability)))
        keep_outcomes.append(outcomes)
    return TabularMdp(
        states=states,
        state_to_idx=state_to_idx,
        state_info=keep_rows,
        rewards=rewards,
        keep_outcomes=keep_outcomes,
        initial_weights=initial_state_weights(state_table, state_to_idx),
        gamma=float(rules["mdp"]["discount_factor"]),
    )


def sample_initial_state(mdp: TabularMdp, rng: np.random.Generator) -> int:
    return int(rng.choice(len(mdp.states), p=mdp.initial_weights))


def sample_keep_next_state(mdp: TabularMdp, state_idx: int, rng: np.random.Generator) -> int | None:
    outcomes = mdp.keep_outcomes[state_idx]
    probabilities = np.array([probability for _, probability in outcomes], dtype="float64")
    probabilities = probabilities / probabilities.sum()
    selected = outcomes[int(rng.choice(len(outcomes), p=probabilities))]
    return selected[0]


def policy_probabilities_from_actions(actions: np.ndarray) -> np.ndarray:
    probs = np.zeros((len(actions), 2), dtype="float64")
    probs[np.arange(len(actions)), actions.astype(int)] = 1.0
    return probs


def evaluate_policy(
    mdp: TabularMdp,
    policy_probs: np.ndarray,
    tolerance: float,
    max_iterations: int,
) -> tuple[np.ndarray, np.ndarray, dict[str, Any]]:
    values = np.zeros(len(mdp.states), dtype="float64")
    q_values = np.zeros((len(mdp.states), 2), dtype="float64")
    final_delta = 0.0
    iteration = 0
    for iteration in range(1, max_iterations + 1):
        new_values = np.zeros_like(values)
        for state_idx in range(len(mdp.states)):
            expected_future = 0.0
            for next_idx, probability in mdp.keep_outcomes[state_idx]:
                if next_idx is not None:
                    expected_future += probability * values[next_idx]
            q_values[state_idx, ACTION_KEEP] = mdp.rewards[state_idx, ACTION_KEEP] + mdp.gamma * expected_future
            q_values[state_idx, ACTION_CULL] = mdp.rewards[state_idx, ACTION_CULL]
            new_values[state_idx] = float(np.dot(policy_probs[state_idx], q_values[state_idx]))
        final_delta = float(np.max(np.abs(new_values - values))) if len(values) else 0.0
        values = new_values
        if final_delta < tolerance:
            break
    return values, q_values, {"iterations": iteration, "final_delta": final_delta, "converged": bool(final_delta < tolerance)}


def optimal_actions_from_policy(env: RLTrainingEnvironment, rules: dict[str, Any], states: list[str]) -> np.ndarray:
    policy_path = project_path(env, rules["output"]["optimal_policy_table_csv"])
    if not policy_path.exists():
        return np.zeros(len(states), dtype="int64")
    policy = pd.read_csv(policy_path, low_memory=False)
    action_by_state = dict(zip(policy["state_bucket_exact"].astype(str), policy["optimal_action"].astype(str)))
    return np.array([ACTION_CULL if action_by_state.get(state) == "cull" else ACTION_KEEP for state in states], dtype="int64")


def evaluate_policy_row(
    algorithm: str,
    experiment_type: str,
    mdp: TabularMdp,
    policy_probs: np.ndarray,
    optimal_actions: np.ndarray,
    rules: dict[str, Any],
    notes: str,
) -> tuple[dict[str, Any], pd.DataFrame]:
    evaluation_rules = rules["rl_experiments"]["evaluation"]
    values, q_values, metadata = evaluate_policy(
        mdp,
        policy_probs,
        tolerance=float(evaluation_rules.get("policy_value_tolerance", 1e-4)),
        max_iterations=int(evaluation_rules.get("policy_value_max_iterations", 1000)),
    )
    scenario_actions = policy_probs.argmax(axis=1)
    changed = scenario_actions != optimal_actions
    row = {
        "algorithm": algorithm,
        "experiment_type": experiment_type,
        "run_status": "completed",
        "states": int(len(mdp.states)),
        "mean_state_value": float(values.mean()),
        "mean_initial_state_value": float(np.dot(mdp.initial_weights, values)),
        "median_state_value": float(np.median(values)),
        "cull_state_rate": float(policy_probs[:, ACTION_CULL].mean()),
        "changed_states_vs_mdp_value_iteration": int(changed.sum()),
        "changed_state_rate_vs_mdp_value_iteration": float(changed.mean()),
        "policy_eval_iterations": int(metadata["iterations"]),
        "policy_eval_converged": bool(metadata["converged"]),
        "notes": notes,
    }
    policy = pd.DataFrame(
        {
            "algorithm": algorithm,
            "state_bucket_exact": mdp.states,
            "prob_keep": policy_probs[:, ACTION_KEEP],
            "prob_cull": policy_probs[:, ACTION_CULL],
            "selected_action": [ACTION_NAMES[int(action)] for action in scenario_actions],
            "state_value": values,
            "q_keep_eval": q_values[:, ACTION_KEEP],
            "q_cull_eval": q_values[:, ACTION_CULL],
            "optimal_action_mdp": [ACTION_NAMES[int(action)] for action in optimal_actions],
            "changed_vs_mdp": changed.astype(int),
        }
    )
    return row, policy


def not_run_row(algorithm: str, experiment_type: str, reason: str) -> dict[str, Any]:
    return {
        "algorithm": algorithm,
        "experiment_type": experiment_type,
        "run_status": "not_run",
        "states": 0,
        "mean_state_value": np.nan,
        "mean_initial_state_value": np.nan,
        "median_state_value": np.nan,
        "cull_state_rate": np.nan,
        "changed_states_vs_mdp_value_iteration": np.nan,
        "changed_state_rate_vs_mdp_value_iteration": np.nan,
        "policy_eval_iterations": np.nan,
        "policy_eval_converged": False,
        "notes": reason,
    }


def write_rl_comparison_report(results: pd.DataFrame, policy_table: pd.DataFrame, env: RLTrainingEnvironment, rules: dict[str, Any]) -> None:
    report_path = project_path(env, rules["output"]["rl_algorithm_comparison_report_md"])
    completed = results[results["run_status"].eq("completed")].sort_values("mean_initial_state_value", ascending=False)
    lines = [
        "# RL Algorithm Comparison Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- Results: `{rules['output']['rl_algorithm_comparison_csv']}`",
        f"- Policy table: `{rules['output']['rl_algorithm_policy_table_csv']}`",
        "",
        "## Completed Benchmark Results",
        "",
        "| Algorithm | Type | Mean initial V | Mean state V | Cull state rate | Changed vs MDP | Eval converged | Notes |",
        "|---|---|---:|---:|---:|---:|---:|---|",
    ]
    for row in completed.to_dict("records"):
        lines.append(
            f"| `{row['algorithm']}` | `{row['experiment_type']}` | {float(row['mean_initial_state_value']):.2f} | "
            f"{float(row['mean_state_value']):.2f} | {float(row['cull_state_rate']):.4f} | "
            f"{int(row['changed_states_vs_mdp_value_iteration'])} | {bool(row['policy_eval_converged'])} | {row['notes']} |"
        )
    not_run = results[~results["run_status"].eq("completed")]
    lines.extend(["", "## Not Run / Not Eligible", "", "| Algorithm | Type | Status | Reason |", "|---|---|---|---|"])
    if not_run.empty:
        lines.append("| - | - | - | - |")
    else:
        for row in not_run.to_dict("records"):
            lines.append(f"| `{row['algorithm']}` | `{row['experiment_type']}` | `{row['run_status']}` | {row['notes']} |")
    if not policy_table.empty:
        summary = policy_table.groupby("algorithm")["selected_action"].value_counts().unstack(fill_value=0).reset_index()
        lines.extend(["", "## Learned/Derived Policy Counts", "", "| Algorithm | Keep states | Cull states |", "|---|---:|---:|"])
        for row in summary.to_dict("records"):
            lines.append(f"| `{row['algorithm']}` | {int(row.get('keep', 0))} | {int(row.get('cull', 0))} |")
    lines.extend(
        [
            "",
            "## Interpretation",
            "",
            "- `model_based_mdp_value_iteration` remains the reference solution for this phase.",
            "- Simulator RL rows are benchmark smoke tests over the empirical MDP, not production policies.",
            "- Offline RL algorithms are intentionally not run because real logged actions are missing.",
        ]
    )
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def update_rl_algorithm_outputs(
    env: RLTrainingEnvironment,
    rules: dict[str, Any],
    rows: list[dict[str, Any]],
    policy_frames: list[pd.DataFrame] | None = None,
) -> None:
    policy_frames = policy_frames or []
    results_path = project_path(env, rules["output"]["rl_algorithm_comparison_csv"])
    policy_path = project_path(env, rules["output"]["rl_algorithm_policy_table_csv"])
    algorithms = [str(row["algorithm"]) for row in rows]
    if results_path.exists():
        results = pd.read_csv(results_path, low_memory=False)
        results = results[~results["algorithm"].astype(str).isin(algorithms)]
    else:
        results = pd.DataFrame()
    results = pd.concat([results, pd.DataFrame(rows)], ignore_index=True)
    results = results.sort_values(["run_status", "mean_initial_state_value"], ascending=[True, False], na_position="last")

    if policy_path.exists():
        policy_table = pd.read_csv(policy_path, low_memory=False)
        policy_table = policy_table[~policy_table.get("algorithm", pd.Series(dtype=str)).astype(str).isin(algorithms)]
    else:
        policy_table = pd.DataFrame()
    if policy_frames:
        policy_table = pd.concat([policy_table, *policy_frames], ignore_index=True)

    results_path.parent.mkdir(parents=True, exist_ok=True)
    results.to_csv(results_path, index=False)
    policy_table.to_csv(policy_path, index=False)
    write_rl_comparison_report(results, policy_table, env, rules)
