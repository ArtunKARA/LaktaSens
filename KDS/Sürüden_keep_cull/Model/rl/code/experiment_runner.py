from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

import pandas as pd

from model_registry import model_table, run_model
from training_environment import (
    CONFIG_PATH,
    PARAMETERS_PATH,
    PROJECT_ROOT,
    CommandResult,
    RLTrainingEnvironment,
)


def apply_overrides(config_path: Path = CONFIG_PATH, overrides: dict[str, Any] | None = None) -> dict[str, Any]:
    return RLTrainingEnvironment(config_path=config_path).apply_overrides(overrides)


def run_mdp_pipeline(python_executable: str = sys.executable) -> list[CommandResult]:
    return run_model("mdp_value_iteration", env=RLTrainingEnvironment(), default_python=python_executable)


def run_comparative_rl_pipeline(python_executable: str = sys.executable) -> list[CommandResult]:
    env = RLTrainingEnvironment()
    results: list[CommandResult] = []
    for model_key in ["mdp_value_iteration", "tabular_q_learning", "tabular_ppo_smoke", "dqn_style_fqi_mlp", "cql", "iql", "bcq"]:
        results.extend(run_model(model_key, env=env, default_python=python_executable))
    return results


def run_sb3_pipeline(python_executable: str) -> list[CommandResult]:
    return run_model("sb3_ppo_dqn", env=RLTrainingEnvironment(), default_python=python_executable, sb3_python=python_executable)


def resolved_parameter_overrides(params: dict[str, Any], extra_overrides: dict[str, Any] | None = None) -> dict[str, Any]:
    overrides = dict(params.get("overrides", {}) or {})
    profile_name = params.get("profile")
    if profile_name:
        profile_cfg = (params.get("profiles", {}) or {}).get(profile_name, {})
        overrides.update(profile_cfg.get("overrides", {}) or {})
    overrides.update(extra_overrides or {})
    return overrides


def run_from_parameters(
    parameters_path: Path = PARAMETERS_PATH,
    extra_overrides: dict[str, Any] | None = None,
) -> list[CommandResult]:
    env = RLTrainingEnvironment(parameters_path=parameters_path)
    params = env.load_parameters()
    env.apply_overrides(resolved_parameter_overrides(params, extra_overrides))
    default_python = params.get("python", {}).get("default", sys.executable)
    sb3_python = params.get("python", {}).get("sb3", default_python)
    run_cfg = params.get("run", {})
    results: list[CommandResult] = []
    if run_cfg.get("rebuild_mdp", True):
        results.extend(run_model("mdp_value_iteration", env=env, default_python=default_python))
    if run_cfg.get("run_comparative_rl", True):
        for model_key in ["tabular_q_learning", "tabular_ppo_smoke", "dqn_style_fqi_mlp", "cql", "iql", "bcq"]:
            results.extend(run_model(model_key, env=env, default_python=default_python))
    if run_cfg.get("run_sb3_training", True):
        results.extend(run_model("sb3_ppo_dqn", env=env, default_python=sb3_python, sb3_python=sb3_python))
    return results


def load_output_tables() -> dict[str, pd.DataFrame]:
    return RLTrainingEnvironment().load_output_tables()


def summarize_outputs() -> pd.DataFrame:
    return RLTrainingEnvironment().summarize_outputs()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run keep/cull RL experiment pipelines.")
    parser.add_argument("--parameters", default=str(PARAMETERS_PATH), help="YAML parameter file.")
    parser.add_argument("--mode", choices=["all", "mdp", "compare", "sb3", "model", "list-models"], default="all")
    parser.add_argument("--model", default="", help="Model key for --mode model.")
    parser.add_argument("--python", default=sys.executable, help="Python executable for non-SB3 scripts.")
    parser.add_argument("--sb3-python", default="/tmp/laktasens-rl-venv/bin/python", help="Python executable with SB3 deps.")
    parser.add_argument("--ppo-steps", type=int, default=None)
    parser.add_argument("--dqn-steps", type=int, default=None)
    parser.add_argument("--eval-episodes", type=int, default=None)
    return parser.parse_args()


def collect_cli_overrides(args: argparse.Namespace) -> dict[str, Any]:
    overrides: dict[str, Any] = {}
    if args.ppo_steps is not None:
        overrides["stable_baselines3.algorithms.PPO.total_timesteps"] = args.ppo_steps
    if args.dqn_steps is not None:
        overrides["stable_baselines3.algorithms.DQN.total_timesteps"] = args.dqn_steps
    if args.eval_episodes is not None:
        overrides["stable_baselines3.eval_episodes"] = args.eval_episodes
    return overrides


def main() -> int:
    args = parse_args()
    env = RLTrainingEnvironment(parameters_path=Path(args.parameters))
    overrides = collect_cli_overrides(args)
    if overrides:
        env.apply_overrides(overrides)

    if args.mode == "list-models":
        print(model_table().to_string(index=False))
        return 0

    if args.mode == "all":
        run_from_parameters(Path(args.parameters), extra_overrides=overrides)
    elif args.mode == "mdp":
        run_model("mdp_value_iteration", env=env, default_python=args.python)
    elif args.mode == "compare":
        for model_key in ["mdp_value_iteration", "tabular_q_learning", "tabular_ppo_smoke", "dqn_style_fqi_mlp", "cql", "iql", "bcq"]:
            run_model(model_key, env=env, default_python=args.python)
    elif args.mode == "sb3":
        run_model("sb3_ppo_dqn", env=env, default_python=args.sb3_python, sb3_python=args.sb3_python)
    elif args.mode == "model":
        if not args.model:
            raise ValueError("--mode model requires --model <model_key>")
        run_model(args.model, env=env, default_python=args.python, sb3_python=args.sb3_python)

    summary = env.summarize_outputs()
    if not summary.empty:
        print("\nOutput summary:")
        print(summary.to_string(index=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
