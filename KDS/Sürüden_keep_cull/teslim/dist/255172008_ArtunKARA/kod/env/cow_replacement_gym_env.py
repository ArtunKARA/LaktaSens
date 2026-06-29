from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from rl_experiment_utils import ACTION_CULL, ACTION_KEEP, TabularMdp, sample_initial_state, sample_keep_next_state


try:
    import gymnasium as gym
    from gymnasium import spaces
except ImportError:  # pragma: no cover - handled by caller.
    gym = None
    spaces = None


class CowReplacementGymEnv(gym.Env if gym is not None else object):
    """Gymnasium wrapper around the empirical keep/cull MDP.

    Observation is a dense numeric vector built from representative state
    metadata. Action space is discrete: 0=keep, 1=cull.
    """

    metadata = {"render_modes": []}

    def __init__(
        self,
        mdp: TabularMdp,
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
            if column in self.mdp.state_info:
                values = self.mdp.state_info[column]
            else:
                values = pd.Series(0.0, index=self.mdp.state_info.index)
            frame[column] = pd.to_numeric(values, errors="coerce").fillna(0.0)
        for column in categorical_columns:
            if column in self.mdp.state_info:
                frame[column] = self.mdp.state_info[column]
            else:
                frame[column] = pd.Series("unknown", index=self.mdp.state_info.index)
            frame[column] = frame[column].fillna("unknown").astype(str).replace({"": "unknown", "nan": "unknown"})
        frame = pd.get_dummies(frame, columns=categorical_columns, dtype=float)
        means = frame[numeric_columns].mean()
        stds = frame[numeric_columns].std(ddof=0).replace(0, 1.0)
        frame[numeric_columns] = (frame[numeric_columns] - means) / stds
        return frame.to_numpy(dtype=np.float32), frame.columns.tolist()

    def _observation(self) -> np.ndarray:
        return self.observation_matrix[self.current_state_idx].astype(np.float32, copy=True)

    def reset(self, *, seed: int | None = None, options: dict[str, Any] | None = None) -> tuple[np.ndarray, dict[str, Any]]:
        super().reset(seed=seed)
        if seed is not None:
            self.rng = np.random.default_rng(seed)
        options = options or {}
        state_idx = options.get("state_idx")
        if state_idx is None:
            self.current_state_idx = sample_initial_state(self.mdp, self.rng)
        else:
            self.current_state_idx = int(state_idx)
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

        next_state_idx = sample_keep_next_state(self.mdp, state_idx, self.rng)
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
