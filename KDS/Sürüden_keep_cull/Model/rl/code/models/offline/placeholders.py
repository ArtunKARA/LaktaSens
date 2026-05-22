from __future__ import annotations

from functools import partial

from models.base import ModelRunSpec
from models.common import direct_result, not_run_row, update_rl_algorithm_outputs
from training_environment import CommandResult, RLTrainingEnvironment


def run_offline_placeholder(
    algorithm: str,
    env: RLTrainingEnvironment,
    default_python: str,
    sb3_python: str | None,
    check: bool,
) -> list[CommandResult]:
    rules = env.load_config()
    cfg = rules["rl_experiments"]["algorithms"].get(algorithm, {})
    reason = cfg.get("disabled_reason", "Not eligible until real logged keep/cull actions exist.")
    row = not_run_row(algorithm, cfg.get("experiment_type", "offline_rl"), reason)
    update_rl_algorithm_outputs(env, rules, [row], [])
    return direct_result(algorithm, stdout=f"{algorithm} not run: {reason}")


def definitions() -> list[ModelRunSpec]:
    common = {
        "family": "offline_rl",
        "trainable_now": False,
        "production_valid": False,
        "notes": "Not eligible until real logged keep/cull actions and behavior-policy support exist.",
    }
    return [
        ModelRunSpec(
            key="cql",
            display_name="CQL",
            description="Offline RL placeholder; writes explicit not-eligible result.",
            runner=partial(run_offline_placeholder, "cql"),
            **common,
        ),
        ModelRunSpec(
            key="iql",
            display_name="IQL",
            description="Offline RL placeholder; writes explicit not-eligible result.",
            runner=partial(run_offline_placeholder, "iql"),
            **common,
        ),
        ModelRunSpec(
            key="bcq",
            display_name="BCQ",
            description="Offline RL placeholder; writes explicit not-eligible result.",
            runner=partial(run_offline_placeholder, "bcq"),
            **common,
        ),
    ]
