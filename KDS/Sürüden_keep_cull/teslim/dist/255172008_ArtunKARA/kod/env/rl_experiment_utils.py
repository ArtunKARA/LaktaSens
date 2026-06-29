from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd

from rl_mdp_utils import path_from_root, transition_rows_for_state


ACTION_KEEP = 0
ACTION_CULL = 1
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


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if np.isnan(number):
        return default
    return number


def load_tabular_mdp(rules: dict[str, Any], transition_model: pd.DataFrame | None = None) -> TabularMdp:
    reward_path = path_from_root(rules["output"]["mdp_reward_table_csv"])
    state_path = path_from_root(rules["output"]["mdp_state_table_csv"])
    transition_path = path_from_root(rules["output"]["empirical_transition_model_csv"])
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
            rewards[state_to_idx[state], action] = _safe_float(row.get("reward"))

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

    initial_weights = initial_state_weights(state_table, state_to_idx)
    gamma = float(rules["mdp"]["discount_factor"])
    return TabularMdp(
        states=states,
        state_to_idx=state_to_idx,
        state_info=keep_rows,
        rewards=rewards,
        keep_outcomes=keep_outcomes,
        initial_weights=initial_weights,
        gamma=gamma,
    )


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


def policy_probabilities_from_actions(actions: np.ndarray) -> np.ndarray:
    probs = np.zeros((len(actions), 2), dtype="float64")
    probs[np.arange(len(actions)), actions.astype(int)] = 1.0
    return probs


def evaluate_policy(mdp: TabularMdp, policy_probs: np.ndarray, tolerance: float, max_iterations: int) -> tuple[np.ndarray, np.ndarray, dict[str, Any]]:
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
    metadata = {
        "iterations": iteration,
        "final_delta": final_delta,
        "converged": bool(final_delta < tolerance),
    }
    return values, q_values, metadata


def sample_initial_state(mdp: TabularMdp, rng: np.random.Generator) -> int:
    return int(rng.choice(len(mdp.states), p=mdp.initial_weights))


def sample_keep_next_state(mdp: TabularMdp, state_idx: int, rng: np.random.Generator) -> int | None:
    outcomes = mdp.keep_outcomes[state_idx]
    probabilities = np.array([probability for _, probability in outcomes], dtype="float64")
    probabilities = probabilities / probabilities.sum()
    selected = outcomes[int(rng.choice(len(outcomes), p=probabilities))]
    return selected[0]


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
    cull_rate = float(policy_probs[:, ACTION_CULL].mean())
    row = {
        "algorithm": algorithm,
        "experiment_type": experiment_type,
        "run_status": "completed",
        "states": int(len(mdp.states)),
        "mean_state_value": float(values.mean()),
        "mean_initial_state_value": float(np.dot(mdp.initial_weights, values)),
        "median_state_value": float(np.median(values)),
        "cull_state_rate": cull_rate,
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
