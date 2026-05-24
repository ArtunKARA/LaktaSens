from __future__ import annotations

from models.base import ModelRunSpec
from models.stable_baselines import dqn, ppo
from training_environment import CommandResult, RLTrainingEnvironment


def run(env: RLTrainingEnvironment, default_python: str, sb3_python: str | None, check: bool) -> list[CommandResult]:
    # This combo model is still direct-code based: it calls the concrete PPO
    # and DQN model modules, not the historical `scripts/` pipeline.
    results: list[CommandResult] = []
    results.extend(ppo.run(env, default_python, sb3_python, check))
    results.extend(dqn.run(env, default_python, sb3_python, check))
    return results


def definition() -> ModelRunSpec:
    return ModelRunSpec(
        key="sb3_ppo_dqn",
        display_name="Stable-Baselines3 PPO + DQN",
        family="gymnasium_sb3",
        description="Directly trains both PPO and DQN on CowReplacementGymEnv.",
        runner=run,
        python_role="sb3",
        config_overrides={
            "stable_baselines3.algorithms.PPO.enabled": True,
            "stable_baselines3.algorithms.DQN.enabled": True,
        },
        notes="Real PPO/DQN training loops on empirical simulator.",
    )
