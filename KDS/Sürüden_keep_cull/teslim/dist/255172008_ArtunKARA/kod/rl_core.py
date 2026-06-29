"""Çok-seed eğitim, ham log ve değerlendirme çekirdeği (teslim paketi).

Bu modül, mevcut empirik ``CowReplacementEnv`` MDP'sinin üstüne teslim isterlerinin
gerektirdiği unsurları ekler:

* ``seeds.txt`` içindeki >=5 seed üzerinde eğitim,
* eğitim sırasında **episode getirisi** (anlık ödül DEĞİL) loglama,
* eğitim boyunca periyodik **deterministic/greedy eval** loglama,
* DQN için **loss** logu,
* tüm ham logları ``teslim/sonuclar/loglar/`` altına CSV olarak yazma.

Veri bütünlüğü korunur: ortam dinamiği (empirik ``p(s'|s,a)``) ve ödül parametreleri
değişmez; seed çeşitliliği yalnızca ortamın gerçek stokastikliğinden ve keşif
rastgeleliğinden gelir.

Yasak kontrolü: ``import gym`` YOK (gymnasium kullanılır); ``np.random.seed`` /
``np.random.choice`` YOK (her yerde ``np.random.default_rng``).
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

# Windows konsolu varsayılan cp1252 olduğunda Türkçe karakterli print'ler patlar;
# nasıl çağrılırsa çağrılsın (subprocess/notebook dahil) UTF-8'e geç.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
    except Exception:
        pass

# --- Layout-agnostik kök tespiti: hem repo-içi hem standalone teslim paketi --
# Standalone pakette veri/config kod/ altına bundle'lanır; repo-içinde repo kökünde durur.
_KOD_DIR = Path(__file__).resolve().parent  # .../kod
_standalone = (_KOD_DIR / "data" / "processed" / "rl" / "empirical_transition_model.csv").exists()
if _standalone:
    DATA_ROOT = _KOD_DIR              # veri + config kod/ altında
    PKG_ROOT = _KOD_DIR.parent        # çıktılar paket kökünde (sonuclar/, sunum/)
else:
    DATA_ROOT = _KOD_DIR.parents[1]   # repo kökü
    PKG_ROOT = DATA_ROOT / "teslim"   # çıktılar teslim/ altında
CONFIG_PATH = DATA_ROOT / "config" / "rl_env_rules.yaml"
PROJECT_ROOT = DATA_ROOT  # geriye dönük ad

# Runtime modülleri: önce vendor'lı kod/env, yoksa repo scripts/.
for _src in (_KOD_DIR / "env", DATA_ROOT / "scripts"):
    if _src.exists() and str(_src) not in sys.path:
        sys.path.insert(0, str(_src))

import rl_mdp_utils as _rl_mdp_utils  # noqa: E402
_rl_mdp_utils.PROJECT_ROOT = DATA_ROOT  # path_from_root/load_tabular_mdp bu köke göre çözer

from rl_experiment_utils import (  # noqa: E402  (sys.path ayarından sonra import)
    ACTION_CULL,
    ACTION_KEEP,
    TabularMdp,
    load_tabular_mdp,
    sample_initial_state,
    sample_keep_next_state,
)
from rl_mdp_utils import read_rules  # noqa: E402

LOG_DIR = PKG_ROOT / "sonuclar" / "loglar"
SEEDS_PATH = _KOD_DIR / "seeds.txt"


# --- Eğitim profilleri ------------------------------------------------------
# smoke: altyapı/sanity (dakikalar). full: asıl teslim koşusu.
PROFILES: dict[str, dict[str, Any]] = {
    "smoke": {
        "qlearning": {
            "episodes": 600,
            "max_steps": 60,
            "alpha": 0.18,
            "epsilon_start": 0.35,
            "epsilon_end": 0.03,
            "epsilon_decay": 0.999,
            "eval_every": 50,
            "eval_episodes": 40,
        },
        "dqn": {
            "total_timesteps": 4000,
            "eval_freq": 1000,
            "eval_episodes": 20,
            # smoke'da öğrenmenin GERÇEKTEN olması için learning_starts < total_timesteps:
            "learning_starts": 500,
            "buffer_size": 20_000,
            "target_update_interval": 500,
            "exploration_fraction": 0.3,
            "batch_size": 32,
            "train_freq": 4,
            "learning_rate": 5e-4,
        },
    },
    "full": {
        "qlearning": {
            "episodes": 4000,
            "max_steps": 60,
            "alpha": 0.18,
            "epsilon_start": 0.35,
            "epsilon_end": 0.03,
            "epsilon_decay": 0.999,
            "eval_every": 100,
            "eval_episodes": 200,
        },
        "dqn": {
            "total_timesteps": 100_000,
            "eval_freq": 10_000,
            "eval_episodes": 100,
            "learning_starts": 5000,
            "buffer_size": 100_000,
            "target_update_interval": 1000,
            "exploration_fraction": 0.35,
            "batch_size": 32,
            "train_freq": 4,
            "learning_rate": 5e-4,
        },
    },
}


# --- Yardımcılar ------------------------------------------------------------
def load_seeds(path: Path = SEEDS_PATH) -> list[int]:
    """``seeds.txt`` dosyasındaki tam sayıları sırayla döndürür (>=5 beklenir)."""
    seeds: list[int] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            seeds.append(int(line))
    if len(seeds) < 5:
        raise ValueError(f"En az 5 seed gerekli, {len(seeds)} bulundu: {path}")
    return seeds


def get_rules() -> dict[str, Any]:
    return read_rules(CONFIG_PATH)


def load_mdp(rules: dict[str, Any] | None = None) -> TabularMdp:
    rules = rules or get_rules()
    return load_tabular_mdp(rules)


def ensure_log_dir() -> Path:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    return LOG_DIR


# --- Episode rollout (tablo politikası, stokastik ortam) --------------------
def rollout_return(mdp: TabularMdp, actions: np.ndarray, rng: np.random.Generator, max_steps: int) -> tuple[float, int, str]:
    """Verili greedy politikayı stokastik ortamda bir episode oynatır.

    Geri dönen ``total`` = episode getirisi (adım ödüllerinin toplamı), anlık ödül DEĞİL.
    """
    state = sample_initial_state(mdp, rng)
    total = 0.0
    steps = 0
    terminal = "max_steps"
    for _ in range(max_steps):
        action = int(actions[state])
        reward = float(mdp.rewards[state, action])
        total += reward
        steps += 1
        if action == ACTION_CULL:
            terminal = "agent_cull"
            break
        next_idx = sample_keep_next_state(mdp, state, rng)
        if next_idx is None:
            terminal = "empirical_terminal"
            break
        state = int(next_idx)
    return total, steps, terminal


def greedy_eval(mdp: TabularMdp, actions: np.ndarray, rng: np.random.Generator, n_episodes: int, max_steps: int) -> np.ndarray:
    """Deterministic/greedy politikanın ``n_episodes`` koşusundaki episode getirileri."""
    return np.array([rollout_return(mdp, actions, rng, max_steps)[0] for _ in range(n_episodes)], dtype="float64")


# --- Genel politika rollout + baseline politikaları -------------------------
from typing import Callable  # noqa: E402

PolicyFn = Callable[[int, np.random.Generator], int]


def rollout_return_policy(mdp: TabularMdp, policy_fn: PolicyFn, rng: np.random.Generator, max_steps: int) -> tuple[float, int, str]:
    """Genel politika (state -> aksiyon) için bir episode getirisi.

    ``policy_fn(state_idx, rng)`` 0=keep / 1=cull döndürür. Random baseline gibi
    durum-bağımsız stokastik politikalar da bu imzayla ifade edilir.
    """
    state = sample_initial_state(mdp, rng)
    total = 0.0
    steps = 0
    terminal = "max_steps"
    for _ in range(max_steps):
        action = int(policy_fn(state, rng))
        reward = float(mdp.rewards[state, action])
        total += reward
        steps += 1
        if action == ACTION_CULL:
            terminal = "agent_cull"
            break
        next_idx = sample_keep_next_state(mdp, state, rng)
        if next_idx is None:
            terminal = "empirical_terminal"
            break
        state = int(next_idx)
    return total, steps, terminal


def eval_policy_returns(mdp: TabularMdp, policy_fn: PolicyFn, rng: np.random.Generator, n_episodes: int, max_steps: int) -> dict[str, float]:
    """Bir politikayı ``n_episodes`` boyunca değerlendirir; özet metrikleri döndürür."""
    returns = np.empty(n_episodes, dtype="float64")
    steps_arr = np.empty(n_episodes, dtype="float64")
    cull_terminal = 0
    for i in range(n_episodes):
        ret, steps, terminal = rollout_return_policy(mdp, policy_fn, rng, max_steps)
        returns[i] = ret
        steps_arr[i] = steps
        cull_terminal += int(terminal == "agent_cull")
    return {
        "eval_return_mean": float(returns.mean()),
        "eval_return_std": float(returns.std(ddof=0)),
        "eval_return_median": float(np.median(returns)),
        "mean_steps": float(steps_arr.mean()),
        "cull_episode_rate": float(cull_terminal / n_episodes),
        "eval_episodes": int(n_episodes),
    }


def baseline_policy_fns(mdp: TabularMdp, rules: dict[str, Any]) -> dict[str, PolicyFn]:
    """Teslim Grafik-5 için baseline politikalar (eğitimsiz kıyas)."""
    # risk_threshold için state başına risk: reward tablosundan mean_cull_risk_90d
    risk_col = "mean_cull_risk_90d"
    if risk_col in mdp.state_info.columns:
        risk_by_idx = pd.to_numeric(mdp.state_info[risk_col], errors="coerce").fillna(0.0).to_numpy()
    else:
        risk_by_idx = np.zeros(len(mdp.states), dtype="float64")
    risk_threshold = float(rules["simulation"]["policies"]["risk_threshold"].get("threshold", 0.35))
    cull_prob = float(rules["simulation"]["policies"]["random_policy"].get("cull_probability", 0.05))

    def keep_all(state_idx: int, rng: np.random.Generator) -> int:
        return ACTION_KEEP

    def cull_all(state_idx: int, rng: np.random.Generator) -> int:
        return ACTION_CULL

    def random_policy(state_idx: int, rng: np.random.Generator) -> int:
        return ACTION_CULL if rng.random() < cull_prob else ACTION_KEEP

    def risk_threshold_policy(state_idx: int, rng: np.random.Generator) -> int:
        return ACTION_CULL if risk_by_idx[state_idx] >= risk_threshold else ACTION_KEEP

    return {
        "keep_all": keep_all,
        "cull_all": cull_all,
        "random_policy": random_policy,
        "risk_threshold": risk_threshold_policy,
    }


def fixed_action_policy(actions: np.ndarray) -> PolicyFn:
    """Eğitilmiş greedy politikayı (state -> sabit aksiyon) PolicyFn'e çevirir."""
    def policy_fn(state_idx: int, rng: np.random.Generator) -> int:
        return int(actions[state_idx])

    return policy_fn


# --- Tabular Q-learning (çok-seed + log) ------------------------------------
@dataclass
class QLearningResult:
    seed: int
    train_log: pd.DataFrame   # seed, episode, train_return, epsilon, steps
    eval_log: pd.DataFrame    # seed, episode, eval_return_mean, eval_return_std, eval_episodes
    actions: np.ndarray       # her state için greedy aksiyon (0=keep,1=cull)
    q_values: np.ndarray      # (n_states, 2)


def train_q_learning_seed(mdp: TabularMdp, rules: dict[str, Any], seed: int, cfg: dict[str, Any]) -> QLearningResult:
    episodes = int(cfg["episodes"])
    max_steps = int(cfg["max_steps"])
    alpha = float(cfg["alpha"])
    epsilon = float(cfg["epsilon_start"])
    epsilon_end = float(cfg["epsilon_end"])
    epsilon_decay = float(cfg["epsilon_decay"])
    eval_every = int(cfg["eval_every"])
    eval_episodes = int(cfg["eval_episodes"])

    rng = np.random.default_rng(seed)
    eval_rng = np.random.default_rng(seed + 10_000)  # eval rastgeleliği eğitimden bağımsız

    q_values = np.zeros((len(mdp.states), 2), dtype="float64")
    train_rows: list[dict[str, Any]] = []
    eval_rows: list[dict[str, Any]] = []

    for episode in range(1, episodes + 1):
        state = sample_initial_state(mdp, rng)
        ep_return = 0.0
        steps = 0
        for _ in range(max_steps):
            if rng.random() < epsilon:
                action = int(rng.integers(0, 2))               # davranış: epsilon-greedy keşif
            else:
                action = int(np.argmax(q_values[state]))       # davranış: greedy sömürü
            reward = float(mdp.rewards[state, action])
            ep_return += reward
            steps += 1
            if action == ACTION_CULL:
                q_values[state, action] += alpha * (reward - q_values[state, action])
                break
            next_idx = sample_keep_next_state(mdp, state, rng)
            # off-policy hedef: davranış epsilon-greedy iken hedef greedy max_a Q
            target = reward if next_idx is None else reward + mdp.gamma * float(np.max(q_values[next_idx]))
            q_values[state, action] += alpha * (target - q_values[state, action])
            if next_idx is None:
                break
            state = int(next_idx)

        train_rows.append(
            {"seed": seed, "episode": episode, "train_return": ep_return, "epsilon": epsilon, "steps": steps}
        )
        epsilon = max(epsilon_end, epsilon * epsilon_decay)

        if episode % eval_every == 0 or episode == episodes:
            greedy_actions = np.argmax(q_values, axis=1).astype("int64")
            ev = greedy_eval(mdp, greedy_actions, eval_rng, eval_episodes, max_steps)
            eval_rows.append(
                {
                    "seed": seed,
                    "episode": episode,
                    "eval_return_mean": float(ev.mean()),
                    "eval_return_std": float(ev.std(ddof=0)),
                    "eval_episodes": eval_episodes,
                }
            )

    actions = np.argmax(q_values, axis=1).astype("int64")
    return QLearningResult(
        seed=seed,
        train_log=pd.DataFrame(train_rows),
        eval_log=pd.DataFrame(eval_rows),
        actions=actions,
        q_values=q_values,
    )


# --- SB3 DQN (çok-seed + log + loss) ----------------------------------------
def _greedy_eval_callback_class():
    """SB3 BaseCallback alt sınıfını gecikmeli import ile döndürür."""
    from stable_baselines3.common.callbacks import BaseCallback

    class GreedyEvalCallback(BaseCallback):
        def __init__(self, eval_env: Any, seed: int, eval_freq: int, eval_episodes: int) -> None:
            super().__init__()
            self.eval_env = eval_env
            self.seed = seed
            self.eval_freq = int(eval_freq)
            self.eval_episodes = int(eval_episodes)
            self.records: list[dict[str, Any]] = []
            self._last_eval = 0

        def _run_eval(self) -> None:
            returns: list[float] = []
            for _ in range(self.eval_episodes):
                obs, _ = self.eval_env.reset()
                total = 0.0
                while True:
                    action, _ = self.model.predict(obs, deterministic=True)
                    obs, reward, terminated, truncated, _ = self.eval_env.step(int(action))
                    total += float(reward)
                    if terminated or truncated:
                        break
                returns.append(total)
            arr = np.asarray(returns, dtype="float64")
            self.records.append(
                {
                    "seed": self.seed,
                    "timestep": int(self.num_timesteps),
                    "eval_return_mean": float(arr.mean()),
                    "eval_return_std": float(arr.std(ddof=0)),
                    "eval_episodes": self.eval_episodes,
                }
            )

        def _on_step(self) -> bool:
            if self.num_timesteps - self._last_eval >= self.eval_freq:
                self._last_eval = self.num_timesteps
                self._run_eval()
            return True

        def _on_training_end(self) -> None:
            if self.num_timesteps != self._last_eval:  # son adımda zaten eval yapıldıysa tekrarlama
                self._last_eval = self.num_timesteps
                self._run_eval()

    return GreedyEvalCallback


@dataclass
class DqnResult:
    seed: int
    train_log: pd.DataFrame   # seed, episode, timestep, train_return  (Monitor ham episode getirileri)
    eval_log: pd.DataFrame    # seed, timestep, eval_return_mean, eval_return_std, eval_episodes
    loss_log: pd.DataFrame    # seed, timestep, loss
    actions: np.ndarray       # her state için greedy aksiyon (0/1)
    model_path: Path | None


def _read_monitor_returns(monitor_csv: Path, seed: int) -> pd.DataFrame:
    """Monitor ``.monitor.csv`` dosyasından ham per-episode getirileri okur."""
    if not monitor_csv.exists():
        return pd.DataFrame(columns=["seed", "episode", "timestep", "train_return"])
    df = pd.read_csv(monitor_csv, skiprows=1)  # ilk satır JSON başlık (#)
    df = df.rename(columns={"r": "train_return", "l": "length"})
    df["episode"] = np.arange(1, len(df) + 1)
    df["timestep"] = df["length"].cumsum().astype("int64")
    df["seed"] = seed
    return df[["seed", "episode", "timestep", "train_return"]]


def _read_loss_curve(progress_csv: Path, seed: int) -> pd.DataFrame:
    """SB3 CSV logger ``progress.csv`` dosyasından train/loss eğrisini okur."""
    if not progress_csv.exists():
        return pd.DataFrame(columns=["seed", "timestep", "loss"])
    df = pd.read_csv(progress_csv)
    loss_col = "train/loss"
    step_col = "time/total_timesteps"
    if loss_col not in df.columns or step_col not in df.columns:
        return pd.DataFrame(columns=["seed", "timestep", "loss"])
    out = df[[step_col, loss_col]].dropna().rename(columns={step_col: "timestep", loss_col: "loss"})
    out["seed"] = seed
    out["timestep"] = out["timestep"].astype("int64")
    return out[["seed", "timestep", "loss"]].reset_index(drop=True)


def train_dqn_seed(mdp: TabularMdp, rules: dict[str, Any], seed: int, cfg: dict[str, Any]) -> DqnResult:
    from stable_baselines3 import DQN
    from stable_baselines3.common.logger import configure
    from stable_baselines3.common.monitor import Monitor

    from cow_replacement_gym_env import CowReplacementGymEnv

    ensure_log_dir()
    sb3_cfg = rules["stable_baselines3"]["algorithms"]["DQN"]
    net_arch = [int(v) for v in sb3_cfg.get("net_arch", [64, 64])]
    total_timesteps = int(cfg["total_timesteps"])
    eval_freq = int(cfg["eval_freq"])
    eval_episodes = int(cfg["eval_episodes"])

    # Hiperparametre önceliği: profil (cfg) > config (sb3_cfg) > sabit varsayılan.
    def hp(key: str, default: Any) -> Any:
        return cfg.get(key, sb3_cfg.get(key, default))

    monitor_path = LOG_DIR / f"dqn_monitor_seed{seed}"  # Monitor sonuna .monitor.csv ekler
    sb3_log_dir = LOG_DIR / f"dqn_sb3log_seed{seed}"

    train_env = Monitor(CowReplacementGymEnv(mdp, rules, seed=seed), filename=str(monitor_path))
    eval_env = CowReplacementGymEnv(mdp, rules, seed=seed + 5000)

    model = DQN(
        "MlpPolicy",
        train_env,
        seed=seed,
        gamma=float(rules["mdp"]["discount_factor"]),
        learning_rate=float(hp("learning_rate", 5e-4)),
        buffer_size=int(hp("buffer_size", 100_000)),
        learning_starts=int(hp("learning_starts", 5000)),
        batch_size=int(hp("batch_size", 32)),
        train_freq=int(hp("train_freq", 4)),
        target_update_interval=int(hp("target_update_interval", 1000)),
        exploration_fraction=float(hp("exploration_fraction", 0.35)),
        exploration_final_eps=float(hp("exploration_final_eps", 0.05)),
        policy_kwargs={"net_arch": net_arch},
        verbose=0,
    )
    model.set_logger(configure(str(sb3_log_dir), ["csv"]))

    callback = _greedy_eval_callback_class()(eval_env, seed, eval_freq, eval_episodes)
    model.learn(total_timesteps=total_timesteps, callback=callback, progress_bar=False)

    model_dir = PKG_ROOT / "sonuclar" / "models"
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / f"dqn_seed{seed}.zip"
    model.save(model_path)

    # Her state için greedy (deterministic) aksiyon -> baseline/eval grafikleri için
    actions = np.zeros(len(mdp.states), dtype="int64")
    for state_idx in range(len(mdp.states)):
        obs = eval_env.observation_for_state_idx(state_idx)
        action, _ = model.predict(obs, deterministic=True)
        actions[state_idx] = int(action)

    train_log = _read_monitor_returns(Path(str(monitor_path) + ".monitor.csv"), seed)
    loss_log = _read_loss_curve(sb3_log_dir / "progress.csv", seed)
    eval_log = pd.DataFrame(callback.records)

    return DqnResult(
        seed=seed,
        train_log=train_log,
        eval_log=eval_log,
        loss_log=loss_log,
        actions=actions,
        model_path=model_path,
    )
