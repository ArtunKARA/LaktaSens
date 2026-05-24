from __future__ import annotations

import sys

import pandas as pd

from models.base import ModelRunSpec
from models.approximate import dqn_style_fqi
from models.model_based import mdp_value_iteration
from models.offline.placeholders import definitions as offline_definitions
from models.stable_baselines import dqn as sb3_dqn
from models.stable_baselines import ppo as sb3_ppo
from models.stable_baselines import ppo_dqn as sb3_ppo_dqn
from models.tabular import ppo_smoke as tabular_ppo_smoke
from models.tabular import q_learning as tabular_q_learning
from training_environment import CommandResult, RLTrainingEnvironment


def available_models() -> dict[str, ModelRunSpec]:
    definitions = [
        mdp_value_iteration.definition(),
        tabular_q_learning.definition(),
        tabular_ppo_smoke.definition(),
        dqn_style_fqi.definition(),
        sb3_ppo.definition(),
        sb3_dqn.definition(),
        sb3_ppo_dqn.definition(),
        *offline_definitions(),
    ]
    return {definition.key: definition for definition in definitions}


def model_table() -> pd.DataFrame:
    rows = []
    for definition in available_models().values():
        rows.append(
            {
                "key": definition.key,
                "display_name": definition.display_name,
                "family": definition.family,
                "trainable_now": definition.trainable_now,
                "production_valid": definition.production_valid,
                "python_role": definition.python_role,
                "implementation": "direct_model_code",
                "notes": definition.notes,
            }
        )
    return pd.DataFrame(rows)


def get_model(key: str) -> ModelRunSpec:
    models = available_models()
    if key not in models:
        available = ", ".join(sorted(models))
        raise KeyError(f"Unknown model '{key}'. Available models: {available}")
    return models[key]


def run_model(
    key: str,
    env: RLTrainingEnvironment | None = None,
    default_python: str = sys.executable,
    sb3_python: str | None = None,
    check: bool = True,
) -> list[CommandResult]:
    env = env or RLTrainingEnvironment()
    definition = get_model(key)
    return definition.run(env=env, default_python=default_python, sb3_python=sb3_python, check=check)
