from __future__ import annotations

import numpy as np

from models.base import ModelRunSpec
from models.common import (
    ACTION_CULL,
    ACTION_KEEP,
    direct_result,
    evaluate_policy_row,
    load_tabular_mdp,
    optimal_actions_from_policy,
    policy_probabilities_from_actions,
    sample_initial_state,
    sample_keep_next_state,
    update_rl_algorithm_outputs,
)
from training_environment import CommandResult, RLTrainingEnvironment


def train_tabular_q_learning(mdp, rules: dict) -> tuple[np.ndarray, str]:
    cfg = rules["rl_experiments"]["algorithms"]["tabular_q_learning"]
    rng = np.random.default_rng(int(rules["rl_experiments"].get("random_seed", 42)))
    q_values = np.zeros((len(mdp.states), 2), dtype="float64")
    episodes = int(cfg.get("episodes", 4000))
    max_steps = int(cfg.get("max_steps", 60))
    alpha = float(cfg.get("alpha", 0.18))
    epsilon = float(cfg.get("epsilon_start", 0.35))
    epsilon_end = float(cfg.get("epsilon_end", 0.03))
    epsilon_decay = float(cfg.get("epsilon_decay", 0.999))

    for _ in range(episodes):
        state_idx = sample_initial_state(mdp, rng)
        for _step in range(max_steps):
            action = int(rng.integers(0, 2)) if rng.random() < epsilon else int(np.argmax(q_values[state_idx]))
            reward = mdp.rewards[state_idx, action]
            if action == ACTION_CULL:
                q_values[state_idx, action] += alpha * (reward - q_values[state_idx, action])
                break
            next_idx = sample_keep_next_state(mdp, state_idx, rng)
            target = reward if next_idx is None else reward + mdp.gamma * float(np.max(q_values[next_idx]))
            q_values[state_idx, action] += alpha * (target - q_values[state_idx, action])
            if next_idx is None:
                break
            state_idx = next_idx
        epsilon = max(epsilon_end, epsilon * epsilon_decay)
    actions = np.argmax(q_values, axis=1).astype("int64")
    return actions, f"Direct tabular Q-learning; episodes={episodes}, final_epsilon={epsilon:.4f}."


def run(env: RLTrainingEnvironment, default_python: str, sb3_python: str | None, check: bool) -> list[CommandResult]:
    rules = env.load_config()
    mdp = load_tabular_mdp(env, rules)
    optimal_actions = optimal_actions_from_policy(env, rules, mdp.states)
    actions, notes = train_tabular_q_learning(mdp, rules)
    row, policy = evaluate_policy_row(
        "tabular_q_learning",
        rules["rl_experiments"]["algorithms"]["tabular_q_learning"].get("experiment_type", "simulator_rl"),
        mdp,
        policy_probabilities_from_actions(actions),
        optimal_actions,
        rules,
        notes,
    )
    update_rl_algorithm_outputs(env, rules, [row], [policy])
    return direct_result(
        "tabular_q_learning",
        stdout=f"trained tabular_q_learning states={len(mdp.states)} cull_states={int((actions == ACTION_CULL).sum())}",
    )


def definition() -> ModelRunSpec:
    return ModelRunSpec(
        key="tabular_q_learning",
        display_name="Tabular Q-Learning",
        family="simulator_rl",
        description="Direct tabular Q-learning implementation over the empirical simulator.",
        runner=run,
        config_overrides={"rl_experiments.algorithms.tabular_q_learning.enabled": True},
        notes="Benchmark over empirical simulator, not production policy.",
    )
