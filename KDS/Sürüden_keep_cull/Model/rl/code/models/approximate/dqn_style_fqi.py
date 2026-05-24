from __future__ import annotations

import warnings

import numpy as np
import pandas as pd

from models.base import ModelRunSpec
from models.common import (
    ACTION_CULL,
    ACTION_KEEP,
    direct_result,
    evaluate_policy_row,
    load_tabular_mdp,
    not_run_row,
    optimal_actions_from_policy,
    policy_probabilities_from_actions,
    update_rl_algorithm_outputs,
)
from training_environment import CommandResult, RLTrainingEnvironment


def state_action_feature_frame(state_info: pd.DataFrame, actions: np.ndarray) -> pd.DataFrame:
    categorical = [
        "laktasyon_evresi",
        "parite_grup",
        "dim_band",
        "milk_level_band",
        "milk_trend_band",
        "health_risk_band",
        "risk_band",
    ]
    numeric = [
        "mean_daily_milk_kg",
        "mean_cull_risk_90d",
        "mean_cull_risk_30d",
        "mean_health_risk_score",
        "mean_dim",
        "state_support",
    ]
    frame = pd.DataFrame(index=np.arange(len(actions)))
    for column in categorical:
        frame[column] = state_info[column].fillna("unknown").astype(str).to_numpy()
    for column in numeric:
        frame[column] = pd.to_numeric(state_info.get(column, 0.0), errors="coerce").fillna(0.0).to_numpy()
    frame["action"] = actions.astype(int)
    return pd.get_dummies(frame, columns=categorical + ["action"], dtype=float)


def train_dqn_style_fqi_mlp(mdp, rules: dict) -> tuple[np.ndarray | None, str]:
    try:
        from sklearn.exceptions import ConvergenceWarning
        from sklearn.neural_network import MLPRegressor
        from sklearn.pipeline import make_pipeline
        from sklearn.preprocessing import StandardScaler
    except ImportError:
        return None, "sklearn is not available; DQN-style fitted Q iteration skipped."

    cfg = rules["rl_experiments"]["algorithms"]["dqn_style_fqi_mlp"]
    fitted_iterations = int(cfg.get("fitted_iterations", 10))
    hidden_layer_sizes = tuple(int(value) for value in cfg.get("hidden_layer_sizes", [32]))
    max_iter = int(cfg.get("max_iter", 250))
    state_count = len(mdp.states)
    actions = np.tile(np.array([ACTION_KEEP, ACTION_CULL], dtype="int64"), state_count)
    state_repeated = mdp.state_info.loc[np.repeat(np.arange(state_count), 2)].reset_index(drop=True)
    x = state_action_feature_frame(state_repeated, actions)
    q_previous = np.zeros((state_count, 2), dtype="float64")

    for iteration in range(fitted_iterations):
        targets = np.zeros(state_count * 2, dtype="float64")
        for state_idx in range(state_count):
            expected_next = 0.0
            for next_idx, probability in mdp.keep_outcomes[state_idx]:
                if next_idx is not None:
                    expected_next += probability * float(np.max(q_previous[next_idx]))
            targets[state_idx * 2 + ACTION_KEEP] = mdp.rewards[state_idx, ACTION_KEEP] + mdp.gamma * expected_next
            targets[state_idx * 2 + ACTION_CULL] = mdp.rewards[state_idx, ACTION_CULL]
        model = make_pipeline(
            StandardScaler(with_mean=False),
            MLPRegressor(
                hidden_layer_sizes=hidden_layer_sizes,
                activation="relu",
                solver="adam",
                random_state=int(rules["rl_experiments"].get("random_seed", 42)) + iteration,
                max_iter=max_iter,
                early_stopping=False,
            ),
        )
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", ConvergenceWarning)
            model.fit(x, targets)
        q_previous = model.predict(x).reshape(state_count, 2)

    actions_out = np.argmax(q_previous, axis=1).astype("int64")
    return actions_out, f"Direct DQN-style fitted Q iteration with sklearn MLP; iterations={fitted_iterations}."


def run(env: RLTrainingEnvironment, default_python: str, sb3_python: str | None, check: bool) -> list[CommandResult]:
    rules = env.load_config()
    mdp = load_tabular_mdp(env, rules)
    optimal_actions = optimal_actions_from_policy(env, rules, mdp.states)
    actions, notes = train_dqn_style_fqi_mlp(mdp, rules)
    if actions is None:
        row = not_run_row("dqn_style_fqi_mlp", "simulator_rl_approximate", notes)
        update_rl_algorithm_outputs(env, rules, [row], [])
        return direct_result("dqn_style_fqi_mlp", stdout=notes)
    row, policy = evaluate_policy_row(
        "dqn_style_fqi_mlp",
        rules["rl_experiments"]["algorithms"]["dqn_style_fqi_mlp"].get("experiment_type", "simulator_rl_approximate"),
        mdp,
        policy_probabilities_from_actions(actions),
        optimal_actions,
        rules,
        notes,
    )
    update_rl_algorithm_outputs(env, rules, [row], [policy])
    return direct_result(
        "dqn_style_fqi_mlp",
        stdout=f"trained dqn_style_fqi_mlp states={len(mdp.states)} cull_states={int((actions == ACTION_CULL).sum())}",
    )


def definition() -> ModelRunSpec:
    return ModelRunSpec(
        key="dqn_style_fqi_mlp",
        display_name="DQN-Style Fitted Q MLP",
        family="simulator_rl_approximate",
        description="Direct fitted Q iteration with an sklearn MLP Q approximator.",
        runner=run,
        config_overrides={"rl_experiments.algorithms.dqn_style_fqi_mlp.enabled": True},
        notes="Approximate fitted Q benchmark, not replay-buffer DQN.",
    )
