from __future__ import annotations

import argparse
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd
import yaml


PROJECT_ROOT = Path(__file__).resolve().parents[3]
CONFIG_PATH = PROJECT_ROOT / "config" / "rl_env_rules.yaml"
PARAMETERS_PATH = Path(__file__).resolve().parent / "experiment_parameters.yaml"


@dataclass
class CommandResult:
    name: str
    returncode: int
    command: list[str]
    stdout: str
    stderr: str


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file) or {}


def save_yaml(path: Path, data: dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8") as file:
        yaml.safe_dump(data, file, sort_keys=False, allow_unicode=True)


def set_nested(config: dict[str, Any], dotted_key: str, value: Any) -> None:
    cursor = config
    parts = dotted_key.split(".")
    for part in parts[:-1]:
        if part not in cursor or not isinstance(cursor[part], dict):
            cursor[part] = {}
        cursor = cursor[part]
    cursor[parts[-1]] = value


def apply_overrides(config_path: Path = CONFIG_PATH, overrides: dict[str, Any] | None = None) -> dict[str, Any]:
    config = load_yaml(config_path)
    for dotted_key, value in (overrides or {}).items():
        set_nested(config, dotted_key, value)
    save_yaml(config_path, config)
    return config


def script(name: str) -> Path:
    return PROJECT_ROOT / "scripts" / name


def run_script(name: str, python_executable: str = sys.executable, check: bool = True) -> CommandResult:
    command = [python_executable, str(script(name))]
    env = os.environ.copy()
    env["PYTHONPATH"] = str(PROJECT_ROOT / "scripts") + os.pathsep + env.get("PYTHONPATH", "")
    completed = subprocess.run(
        command,
        cwd=PROJECT_ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )
    result = CommandResult(
        name=name,
        returncode=completed.returncode,
        command=command,
        stdout=completed.stdout,
        stderr=completed.stderr,
    )
    print_command_result(result)
    if check and result.returncode != 0:
        raise RuntimeError(f"{name} failed with exit code {result.returncode}")
    return result


def print_command_result(result: CommandResult) -> None:
    print(f"\n$ {' '.join(result.command)}")
    if result.stdout.strip():
        print(result.stdout.rstrip())
    if result.stderr.strip():
        print(result.stderr.rstrip())
    print(f"[{result.name}] exit={result.returncode}")


def run_mdp_pipeline(python_executable: str = sys.executable) -> list[CommandResult]:
    return [
        run_script("31_build_mdp_reward_table.py", python_executable),
        run_script("32_solve_mdp_value_iteration.py", python_executable),
        run_script("33_analyze_mdp_policy_scenarios.py", python_executable),
    ]


def run_comparative_rl_pipeline(python_executable: str = sys.executable) -> list[CommandResult]:
    return [
        run_script("34_audit_rl_algorithm_readiness.py", python_executable),
        run_script("35_compare_rl_algorithms.py", python_executable),
    ]


def run_sb3_pipeline(python_executable: str) -> list[CommandResult]:
    return [run_script("36_train_sb3_ppo_dqn.py", python_executable)]


def run_from_parameters(parameters_path: Path = PARAMETERS_PATH) -> list[CommandResult]:
    params = load_yaml(parameters_path)
    apply_overrides(CONFIG_PATH, params.get("overrides", {}))
    default_python = params.get("python", {}).get("default", sys.executable)
    sb3_python = params.get("python", {}).get("sb3", default_python)
    run_cfg = params.get("run", {})
    results: list[CommandResult] = []
    if run_cfg.get("rebuild_mdp", True):
        results.extend(run_mdp_pipeline(default_python))
    if run_cfg.get("run_comparative_rl", True):
        results.extend(run_comparative_rl_pipeline(default_python))
    if run_cfg.get("run_sb3_training", True):
        results.extend(run_sb3_pipeline(sb3_python))
    return results


def load_output_tables() -> dict[str, pd.DataFrame]:
    output_paths = {
        "mdp_policy": PROJECT_ROOT / "data" / "processed" / "rl" / "optimal_policy_table.csv",
        "scenario_results": PROJECT_ROOT / "data" / "processed" / "rl" / "mdp_scenario_results.csv",
        "algorithm_comparison": PROJECT_ROOT / "data" / "processed" / "rl" / "rl_algorithm_comparison_results.csv",
        "sb3_results": PROJECT_ROOT / "data" / "processed" / "rl" / "sb3_training_results.csv",
        "sb3_policy": PROJECT_ROOT / "data" / "processed" / "rl" / "sb3_policy_table.csv",
    }
    tables: dict[str, pd.DataFrame] = {}
    for name, path in output_paths.items():
        if path.exists():
            tables[name] = pd.read_csv(path)
    return tables


def summarize_outputs() -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for name, table in load_output_tables().items():
        rows.append({"table": name, "rows": len(table), "columns": len(table.columns)})
    return pd.DataFrame(rows)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run keep/cull RL experiment pipelines.")
    parser.add_argument("--parameters", default=str(PARAMETERS_PATH), help="YAML parameter file.")
    parser.add_argument("--mode", choices=["all", "mdp", "compare", "sb3"], default="all")
    parser.add_argument("--python", default=sys.executable, help="Python executable for non-SB3 scripts.")
    parser.add_argument("--sb3-python", default="/tmp/laktasens-rl-venv/bin/python", help="Python executable with SB3 deps.")
    parser.add_argument("--ppo-steps", type=int, default=None)
    parser.add_argument("--dqn-steps", type=int, default=None)
    parser.add_argument("--eval-episodes", type=int, default=None)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    overrides: dict[str, Any] = {}
    if args.ppo_steps is not None:
        overrides["stable_baselines3.algorithms.PPO.total_timesteps"] = args.ppo_steps
    if args.dqn_steps is not None:
        overrides["stable_baselines3.algorithms.DQN.total_timesteps"] = args.dqn_steps
    if args.eval_episodes is not None:
        overrides["stable_baselines3.eval_episodes"] = args.eval_episodes
    if overrides:
        apply_overrides(CONFIG_PATH, overrides)

    if args.mode == "all":
        if overrides:
            parameters = load_yaml(Path(args.parameters))
            parameters.setdefault("overrides", {}).update(overrides)
            save_yaml(Path(args.parameters), parameters)
        run_from_parameters(Path(args.parameters))
    elif args.mode == "mdp":
        run_mdp_pipeline(args.python)
    elif args.mode == "compare":
        run_comparative_rl_pipeline(args.python)
    elif args.mode == "sb3":
        run_sb3_pipeline(args.sb3_python)

    summary = summarize_outputs()
    if not summary.empty:
        print("\nOutput summary:")
        print(summary.to_string(index=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

