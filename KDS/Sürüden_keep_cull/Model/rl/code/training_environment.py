from __future__ import annotations

import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import yaml

try:
    import gymnasium as gym
    from gymnasium import spaces
except ImportError:  # pragma: no cover - optional dependency.
    gym = None
    spaces = None


PROJECT_ROOT = Path(__file__).resolve().parents[3]
CONFIG_PATH = PROJECT_ROOT / "config" / "rl_env_rules.yaml"
PARAMETERS_PATH = Path(__file__).resolve().parent / "experiment_parameters.yaml"
ACTION_KEEP = 0
ACTION_CULL = 1


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


class RLTrainingEnvironment:
    """Central environment object for all RL experiment runners.

    This object owns project paths, config mutation, script execution and output
    loading. Model definition files should depend on this class instead of
    duplicating filesystem and command logic.
    """

    def __init__(
        self,
        project_root: Path = PROJECT_ROOT,
        config_path: Path = CONFIG_PATH,
        parameters_path: Path = PARAMETERS_PATH,
    ) -> None:
        self.project_root = project_root
        self.config_path = config_path
        self.parameters_path = parameters_path
        self.scripts_dir = project_root / "scripts"
        self.outputs_dir = project_root / "data" / "processed" / "rl"

    def script_path(self, name: str) -> Path:
        return self.scripts_dir / name

    def model_path(self, *parts: str) -> Path:
        return self.project_root / "Model" / "rl" / Path(*parts)

    def load_config(self) -> dict[str, Any]:
        return load_yaml(self.config_path)

    def save_config(self, config: dict[str, Any]) -> None:
        save_yaml(self.config_path, config)

    def load_parameters(self) -> dict[str, Any]:
        return load_yaml(self.parameters_path)

    def save_parameters(self, parameters: dict[str, Any]) -> None:
        save_yaml(self.parameters_path, parameters)

    def apply_overrides(self, overrides: dict[str, Any] | None = None, persist_to_parameters: bool = False) -> dict[str, Any]:
        config = self.load_config()
        for dotted_key, value in (overrides or {}).items():
            set_nested(config, dotted_key, value)
        self.save_config(config)
        if persist_to_parameters and overrides:
            parameters = self.load_parameters()
            parameters.setdefault("overrides", {}).update(overrides)
            self.save_parameters(parameters)
        return config

    def apply_parameter_file(self) -> dict[str, Any]:
        parameters = self.load_parameters()
        return self.apply_overrides(parameters.get("overrides", {}))

    def python_from_parameters(self, key: str = "default", fallback: str = sys.executable) -> str:
        parameters = self.load_parameters()
        return parameters.get("python", {}).get(key, fallback)

    def run_script(self, name: str, python_executable: str = sys.executable, check: bool = True) -> CommandResult:
        command = [python_executable, str(self.script_path(name))]
        env = os.environ.copy()
        env["PYTHONPATH"] = str(self.scripts_dir) + os.pathsep + env.get("PYTHONPATH", "")
        completed = subprocess.run(
            command,
            cwd=self.project_root,
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
        self.print_command_result(result)
        if check and result.returncode != 0:
            raise RuntimeError(f"{name} failed with exit code {result.returncode}")
        return result

    @staticmethod
    def print_command_result(result: CommandResult) -> None:
        print(f"\n$ {' '.join(result.command)}")
        if result.stdout.strip():
            print(result.stdout.rstrip())
        if result.stderr.strip():
            print(result.stderr.rstrip())
        print(f"[{result.name}] exit={result.returncode}")

    def output_paths(self) -> dict[str, Path]:
        return {
            "mdp_reward": self.outputs_dir / "mdp_reward_table.csv",
            "mdp_policy": self.outputs_dir / "optimal_policy_table.csv",
            "scenario_results": self.outputs_dir / "mdp_scenario_results.csv",
            "algorithm_readiness": self.outputs_dir / "rl_algorithm_readiness.csv",
            "algorithm_comparison": self.outputs_dir / "rl_algorithm_comparison_results.csv",
            "rl_algorithm_policy": self.outputs_dir / "rl_algorithm_policy_table.csv",
            "sb3_results": self.outputs_dir / "sb3_training_results.csv",
            "sb3_policy": self.outputs_dir / "sb3_policy_table.csv",
            "sb3_eval_episodes": self.outputs_dir / "sb3_eval_episodes.csv",
            "sb3_training_curve": self.outputs_dir / "sb3_training_curve.csv",
        }

    def load_output_tables(self) -> dict[str, pd.DataFrame]:
        tables: dict[str, pd.DataFrame] = {}
        for name, path in self.output_paths().items():
            if path.exists():
                tables[name] = pd.read_csv(path)
        return tables

    def summarize_outputs(self) -> pd.DataFrame:
        rows: list[dict[str, Any]] = []
        for name, table in self.load_output_tables().items():
            rows.append({"table": name, "rows": len(table), "columns": len(table.columns)})
        return pd.DataFrame(rows)

    def run_mdp_pipeline(self, python_executable: str = sys.executable) -> list[CommandResult]:
        return [
            self.run_script("31_build_mdp_reward_table.py", python_executable),
            self.run_script("32_solve_mdp_value_iteration.py", python_executable),
            self.run_script("33_analyze_mdp_policy_scenarios.py", python_executable),
        ]

    def run_comparative_rl_pipeline(self, python_executable: str = sys.executable) -> list[CommandResult]:
        return [
            self.run_script("34_audit_rl_algorithm_readiness.py", python_executable),
            self.run_script("35_compare_rl_algorithms.py", python_executable),
        ]

    def run_sb3_pipeline(self, python_executable: str) -> list[CommandResult]:
        return [self.run_script("36_train_sb3_ppo_dqn.py", python_executable)]


class CowReplacementGymEnv(gym.Env if gym is not None else object):
    """Gymnasium-compatible training environment for keep/cull experiments.

    The environment is intentionally colocated with the experiment code so RL
    model files can train without jumping back to the historical `scripts/`
    layer. It consumes a tabular empirical MDP object with these attributes:
    `states`, `state_info`, `rewards`, `keep_outcomes`, `initial_weights`.
    """

    metadata = {"render_modes": []}

    def __init__(
        self,
        mdp: Any,
        rules: dict[str, Any],
        seed: int = 42,
        max_episode_steps: int | None = None,
    ) -> None:
        if gym is None or spaces is None:
            raise ImportError("gymnasium is required for CowReplacementGymEnv.")
        super().__init__()
        self.mdp = mdp
        self.rules = rules
        self.rng = np.random.default_rng(seed)
        self.max_episode_steps = int(max_episode_steps or rules["stable_baselines3"].get("max_episode_steps", 60))
        self.current_state_idx = 0
        self.steps = 0
        self.observation_matrix, self.observation_columns = self._build_observation_matrix()
        self.action_space = spaces.Discrete(2)
        self.observation_space = spaces.Box(
            low=-np.inf,
            high=np.inf,
            shape=(self.observation_matrix.shape[1],),
            dtype=np.float32,
        )

    def _build_observation_matrix(self) -> tuple[np.ndarray, list[str]]:
        obs_rules = self.rules["stable_baselines3"]["observation"]
        numeric_columns = obs_rules["numeric_columns"]
        categorical_columns = obs_rules["categorical_columns"]
        frame = pd.DataFrame(index=self.mdp.state_info.index)
        for column in numeric_columns:
            values = self.mdp.state_info[column] if column in self.mdp.state_info else 0.0
            frame[column] = pd.to_numeric(values, errors="coerce").fillna(0.0)
        for column in categorical_columns:
            values = self.mdp.state_info[column] if column in self.mdp.state_info else "unknown"
            frame[column] = (
                pd.Series(values, index=self.mdp.state_info.index)
                .fillna("unknown")
                .astype(str)
                .replace({"": "unknown", "nan": "unknown"})
            )
        frame = pd.get_dummies(frame, columns=categorical_columns, dtype=float)
        means = frame[numeric_columns].mean()
        stds = frame[numeric_columns].std(ddof=0).replace(0, 1.0)
        frame[numeric_columns] = (frame[numeric_columns] - means) / stds
        return frame.to_numpy(dtype=np.float32), frame.columns.tolist()

    def _sample_initial_state(self) -> int:
        return int(self.rng.choice(len(self.mdp.states), p=self.mdp.initial_weights))

    def _sample_keep_next_state(self, state_idx: int) -> int | None:
        outcomes = self.mdp.keep_outcomes[state_idx]
        probabilities = np.array([probability for _, probability in outcomes], dtype="float64")
        probabilities = probabilities / probabilities.sum()
        selected = outcomes[int(self.rng.choice(len(outcomes), p=probabilities))]
        return selected[0]

    def _observation(self) -> np.ndarray:
        return self.observation_matrix[self.current_state_idx].astype(np.float32, copy=True)

    def reset(self, *, seed: int | None = None, options: dict[str, Any] | None = None) -> tuple[np.ndarray, dict[str, Any]]:
        super().reset(seed=seed)
        if seed is not None:
            self.rng = np.random.default_rng(seed)
        options = options or {}
        state_idx = options.get("state_idx")
        self.current_state_idx = self._sample_initial_state() if state_idx is None else int(state_idx)
        self.steps = 0
        return self._observation(), self._info(terminal_reason="")

    def step(self, action: int) -> tuple[np.ndarray, float, bool, bool, dict[str, Any]]:
        action = int(action)
        if action not in {ACTION_KEEP, ACTION_CULL}:
            raise ValueError("Action must be 0=keep or 1=cull.")
        state_idx = self.current_state_idx
        reward = float(self.mdp.rewards[state_idx, action])
        self.steps += 1

        if action == ACTION_CULL:
            return self._observation(), reward, True, False, self._info("agent_cull", action)

        next_state_idx = self._sample_keep_next_state(state_idx)
        truncated = self.steps >= self.max_episode_steps
        if next_state_idx is None:
            return self._observation(), reward, True, truncated, self._info("empirical_terminal", action)
        self.current_state_idx = int(next_state_idx)
        if truncated:
            return self._observation(), reward, False, True, self._info("max_episode_steps", action)
        return self._observation(), reward, False, False, self._info("", action)

    def _info(self, terminal_reason: str, action: int | None = None) -> dict[str, Any]:
        state = self.mdp.state_info.iloc[self.current_state_idx]
        return {
            "state_idx": int(self.current_state_idx),
            "state_bucket_exact": self.mdp.states[self.current_state_idx],
            "action": action,
            "terminal_reason": terminal_reason,
            "risk_band": state.get("risk_band", ""),
            "milk_level_band": state.get("milk_level_band", ""),
            "health_risk_band": state.get("health_risk_band", ""),
        }

    def observation_for_state_idx(self, state_idx: int) -> np.ndarray:
        return self.observation_matrix[int(state_idx)].astype(np.float32, copy=True)


DEFAULT_ENV = RLTrainingEnvironment()
