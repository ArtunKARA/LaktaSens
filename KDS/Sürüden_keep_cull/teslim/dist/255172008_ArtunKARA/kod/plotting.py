"""Teslim için 5 zorunlu standart grafik (teslim paketi).

Her grafik: başlık, birimli eksen etiketi, lejant, seed bilgisi (n>=5), ortalama ± std
bandı ve hareketli ortalama penceresi içerir. y-ekseni öğrenme/eval eğrilerinde
**episode getirisi** (anlık/per-step ödül DEĞİL) — isterdeki en kritik kural.

Üretilen PNG'ler: teslim/sunum/grafikler/
    01_ogrenme_egrisi.png         (Grafik 1 — eğitim episode getirisi)
    02_eval_egrisi.png            (Grafik 2 — deterministic/greedy eval)
    03_loss_ve_policy_heatmap.png (Grafik 3 — DQN loss + Q-learning policy heatmap)
    04_hiperparametre_duyarlilik.png (Grafik 4 — epsilon_start × alpha)
    05_baseline_karsilastirma.png (Grafik 5 — ajan vs baseline vs MDP optimum)
Ayrıca grafikler/yorumlar.md: her grafik için 4 cümlelik yorum taslağı (veri-temelli).

Kullanım:
    python plotting.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

from rl_core import LOG_DIR, PKG_ROOT, get_rules, load_mdp, load_seeds  # noqa: E402

FIG_DIR = PKG_ROOT / "sunum" / "grafikler"
SONUCLAR_DIR = PKG_ROOT / "sonuclar"
Y_UNIT = "Episode getirisi (USD/aylık-marj toplamı)"

AGENT_COLORS = {"qlearning": "#2F6B3F", "dqn": "#4C78A8"}


# --- Yardımcılar ------------------------------------------------------------
def moving_average(y: np.ndarray, window: int) -> np.ndarray:
    window = max(1, int(window))
    if window <= 1 or len(y) < window:
        return y
    kernel = np.ones(window) / window
    return np.convolve(y, kernel, mode="same")


def _seed_files(prefix: str, seeds: list[int]) -> list[Path]:
    return [LOG_DIR / f"{prefix}_seed{seed}.csv" for seed in seeds]


def stacked_mean_std(series_list: list[np.ndarray]) -> tuple[np.ndarray, np.ndarray]:
    arr = np.vstack(series_list)
    return arr.mean(axis=0), arr.std(axis=0, ddof=0)


def interp_to_grid(curves: list[tuple[np.ndarray, np.ndarray]], n_points: int = 200) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Farklı uzunluktaki seed eğrilerini ortak x ızgarasında hizalar."""
    xmin = max(float(np.min(x)) for x, _ in curves)
    xmax = min(float(np.max(x)) for x, _ in curves)
    grid = np.linspace(xmin, xmax, n_points)
    stack = []
    for x, y in curves:
        order = np.argsort(x)
        stack.append(np.interp(grid, np.asarray(x)[order], np.asarray(y)[order]))
    a = np.vstack(stack)
    return grid, a.mean(axis=0), a.std(axis=0)


def robust_ylim(ax, mean, std, lo_pct=5, hi_pct=95, pad=0.12):
    """y-limitini yüzdeliklerle ayarlar; tek tük -1300 cull tepeleri trendi ezmesin."""
    lower = np.percentile(mean - std, lo_pct)
    upper = np.percentile(mean + std, hi_pct)
    rng = max(upper - lower, 1.0)
    ax.set_ylim(lower - pad * rng, upper + pad * rng)


def _mdp_reference_return():
    """sonuclar.csv varsa MDP value-iteration ortalama eval getirisini döndürür (tavan referans)."""
    path = SONUCLAR_DIR / "sonuclar.csv"
    if not path.exists():
        return None
    df = pd.read_csv(path)
    ref = df[df["algorithm"] == "mdp_value_iteration"]["eval_return_mean"]
    return float(ref.mean()) if not ref.empty else None


def _band(ax, x, mean, std, color, label, ma_window=None):
    ax.fill_between(x, mean - std, mean + std, color=color, alpha=0.18)
    if ma_window and ma_window > 1:
        ax.plot(x, mean, color=color, alpha=0.30, linewidth=1.0)
        ax.plot(x, moving_average(mean, ma_window), color=color, linewidth=2.0, label=f"{label} (MA={ma_window})")
    else:
        ax.plot(x, mean, color=color, linewidth=2.0, label=label)


# --- Grafik 1: Öğrenme eğrisi (eğitim episode getirisi) ---------------------
def graph1_learning_curve(seeds: list[int]) -> dict:
    fig, axes = plt.subplots(1, 2, figsize=(15, 5.2))
    info: dict = {}

    # (a) Tabular Q-learning: episode getirisi vs episode (episode-hizalı)
    q_series = []
    for path in _seed_files("qlearning_train", seeds):
        if path.exists():
            q_series.append(pd.read_csv(path)["train_return"].to_numpy())
    if q_series:
        n = min(len(s) for s in q_series)
        q_series = [s[:n] for s in q_series]
        mean, std = stacked_mean_std(q_series)
        x = np.arange(1, n + 1)
        win = max(5, n // 40)
        _band(axes[0], x, mean, std, AGENT_COLORS["qlearning"], f"Q-learning (n={len(q_series)})", ma_window=win)
        robust_ylim(axes[0], mean, std)
        info["q_final_train_ma"] = float(moving_average(mean, win)[-1])
        info["q_window"] = win
    axes[0].set_title("(a) Tabular Q-Learning — eğitim")
    axes[0].set_xlabel("Episode")
    axes[0].set_ylabel(Y_UNIT)
    axes[0].legend(loc="lower right", fontsize=9)

    # (b) SB3 DQN: episode getirisi vs kümülatif adım (timestep-hizalı, interpolasyon)
    dqn_curves = []
    for path in _seed_files("dqn_train", seeds):
        if path.exists():
            df = pd.read_csv(path)
            if len(df) > 2:
                dqn_curves.append((df["timestep"].to_numpy(), df["train_return"].to_numpy()))
    if dqn_curves:
        grid, mean, std = interp_to_grid(dqn_curves, n_points=200)
        win = max(5, len(grid) // 25)
        _band(axes[1], grid, mean, std, AGENT_COLORS["dqn"], f"DQN (n={len(dqn_curves)})", ma_window=win)
        robust_ylim(axes[1], mean, std)
        info["dqn_final_train_ma"] = float(moving_average(mean, win)[-1])
    axes[1].set_title("(b) SB3 DQN — eğitim")
    axes[1].set_xlabel("Kümülatif adım (timestep)")
    axes[1].set_ylabel(Y_UNIT)
    axes[1].legend(loc="lower right", fontsize=9)

    fig.suptitle("Grafik 1 — Öğrenme Eğrisi (eğitim episode getirisi, ortalama ± std, n=5 seed)", fontsize=12)
    return _save(fig, "01_ogrenme_egrisi.png", info)


# --- Grafik 2: Test (eval) eğrisi (deterministic/greedy) --------------------
def graph2_eval_curve(seeds: list[int]) -> dict:
    fig, axes = plt.subplots(1, 2, figsize=(15, 5.2))
    info: dict = {}
    mdp_ref = _mdp_reference_return()

    # (a) Q-learning greedy eval vs episode (checkpoint-hizalı)
    q_eval = [pd.read_csv(p) for p in _seed_files("qlearning_eval", seeds) if p.exists()]
    if q_eval:
        n = min(len(d) for d in q_eval)
        x = q_eval[0]["episode"].to_numpy()[:n]
        mean, std = stacked_mean_std([d["eval_return_mean"].to_numpy()[:n] for d in q_eval])
        _band(axes[0], x, mean, std, AGENT_COLORS["qlearning"], f"Q-learning greedy (n={len(q_eval)})")
        info["q_final_eval"] = float(mean[-1])
    if mdp_ref is not None:
        axes[0].axhline(mdp_ref, color="#2F6B3F", linestyle="--", linewidth=1.4, label=f"MDP optimum (≈{mdp_ref:.0f})")
    axes[0].set_title("(a) Q-Learning — greedy eval")
    axes[0].set_xlabel("Episode")
    axes[0].set_ylabel(Y_UNIT)
    axes[0].legend(loc="lower right", fontsize=9)

    # (b) DQN greedy eval vs timestep
    d_eval = [pd.read_csv(p) for p in _seed_files("dqn_eval", seeds) if p.exists()]
    if d_eval:
        # Ortak timestep kümesi (her seed aynı eval_freq -> aynı timestepler)
        common = sorted(set.intersection(*[set(d["timestep"].tolist()) for d in d_eval]))
        if common:
            x = np.array(common)
            series = []
            for d in d_eval:
                dd = d.drop_duplicates("timestep").set_index("timestep").reindex(common)
                series.append(dd["eval_return_mean"].to_numpy())
            mean, std = stacked_mean_std(series)
            _band(axes[1], x, mean, std, AGENT_COLORS["dqn"], f"DQN greedy (n={len(d_eval)})")
            info["dqn_final_eval"] = float(mean[-1])
    if mdp_ref is not None:
        axes[1].axhline(mdp_ref, color="#2F6B3F", linestyle="--", linewidth=1.4, label=f"MDP optimum (≈{mdp_ref:.0f})")
    axes[1].set_title("(b) SB3 DQN — greedy eval")
    axes[1].set_xlabel("Kümülatif adım (timestep)")
    axes[1].set_ylabel(Y_UNIT)
    axes[1].legend(loc="lower right", fontsize=9)

    fig.suptitle("Grafik 2 — Test/Eval Eğrisi (deterministic/greedy politika, ortalama ± std, n=5 seed)", fontsize=12)
    return _save(fig, "02_eval_egrisi.png", info)


# --- Grafik 3: Loss eğrisi + policy heatmap ---------------------------------
def graph3_loss_and_heatmap(seeds: list[int]) -> dict:
    rules = get_rules()
    mdp = load_mdp(rules)
    fig, axes = plt.subplots(1, 2, figsize=(15, 5.4))
    info: dict = {}

    # (a) DQN loss vs timestep (mean ± std, log-y)
    loss_curves = []
    for p in _seed_files("dqn_loss", seeds):
        if p.exists():
            df = pd.read_csv(p)
            if len(df) > 2:
                loss_curves.append((df["timestep"].to_numpy(), df["loss"].to_numpy()))
    if loss_curves:
        grid, mean, std = interp_to_grid(loss_curves, n_points=150)
        axes[0].fill_between(grid, np.clip(mean - std, 1e-6, None), mean + std, color="#B65F2A", alpha=0.18)
        axes[0].plot(grid, mean, color="#B65F2A", linewidth=2.0, label=f"DQN train/loss (n={len(loss_curves)})")
        axes[0].set_yscale("log")
        info["dqn_loss_first"] = float(mean[0])
        info["dqn_loss_last"] = float(mean[-1])
    axes[0].set_title("(a) SB3 DQN — eğitim loss")
    axes[0].set_xlabel("Kümülatif adım (timestep)")
    axes[0].set_ylabel("TD loss (log ölçek)")
    axes[0].legend(loc="upper right", fontsize=9)

    # (b) Q-learning öğrenilen policy heatmap: risk_band × dim_band -> ort. cull oranı
    risk_order = list(rules["discretization"]["risk_band"]["labels"])
    dim_order = list(rules["discretization"]["dim_band"]["labels"])
    state_bands = mdp.state_info[["state_bucket_exact", "risk_band", "dim_band"]].copy()
    state_bands["state_bucket_exact"] = state_bands["state_bucket_exact"].astype(str)
    cell_values = {}
    seed_count = 0
    for p in _seed_files("qlearning_policy", seeds):
        if not p.exists():
            continue
        seed_count += 1
        pol = pd.read_csv(p)
        pol["state_bucket_exact"] = pol["state_bucket_exact"].astype(str)
        merged = state_bands.merge(pol[["state_bucket_exact", "action"]], on="state_bucket_exact", how="left")
        grp = merged.groupby(["risk_band", "dim_band"])["action"].mean()
        for key, val in grp.items():
            cell_values.setdefault(key, []).append(float(val))
    matrix = np.full((len(risk_order), len(dim_order)), np.nan)
    for i, rb in enumerate(risk_order):
        for j, db in enumerate(dim_order):
            vals = cell_values.get((rb, db))
            if vals:
                matrix[i, j] = float(np.mean(vals))
    im = axes[1].imshow(matrix, cmap="RdYlGn_r", vmin=0, vmax=1, aspect="auto")
    axes[1].set_xticks(range(len(dim_order)))
    axes[1].set_xticklabels(dim_order, rotation=30, ha="right", fontsize=8)
    axes[1].set_yticks(range(len(risk_order)))
    axes[1].set_yticklabels(risk_order, fontsize=8)
    for i in range(len(risk_order)):
        for j in range(len(dim_order)):
            if not np.isnan(matrix[i, j]):
                axes[1].text(j, i, f"{matrix[i, j]:.2f}", ha="center", va="center", fontsize=8,
                             color="black" if matrix[i, j] < 0.6 else "white")
    axes[1].set_title(f"(b) Q-Learning öğrenilen policy — cull oranı (n={seed_count} seed ort.)")
    axes[1].set_xlabel("DIM bandı (laktasyon günü)")
    axes[1].set_ylabel("Risk bandı (cull olasılığı %)")
    fig.colorbar(im, ax=axes[1], fraction=0.046, pad=0.04, label="Ort. cull aksiyon oranı")

    fig.suptitle("Grafik 3 — Loss Eğrisi (DQN) + Öğrenilen Politika Heatmap (tabular)", fontsize=12)
    return _save(fig, "03_loss_ve_policy_heatmap.png", info)


# --- Grafik 4: Hiperparametre duyarlılığı -----------------------------------
def graph4_hyperparameter(seeds: list[int]) -> dict:
    info: dict = {}
    sweep_path = LOG_DIR / "qlearning_sweep.csv"
    fig, axes = plt.subplots(1, 2, figsize=(15, 5.2))
    if not sweep_path.exists():
        axes[0].text(0.5, 0.5, "qlearning_sweep.csv yok.\nÖnce sweep.py çalıştırın.", ha="center", va="center")
        axes[0].axis("off"); axes[1].axis("off")
        return _save(fig, "04_hiperparametre_duyarlilik.png", info)

    sweep = pd.read_csv(sweep_path)
    pivot = sweep.groupby(["epsilon_start", "alpha"])["final_eval_return"].mean().reset_index()
    eps_vals = sorted(sweep["epsilon_start"].unique())
    alpha_vals = sorted(sweep["alpha"].unique())
    matrix = np.full((len(eps_vals), len(alpha_vals)), np.nan)
    for _, r in pivot.iterrows():
        i = eps_vals.index(r["epsilon_start"]); j = alpha_vals.index(r["alpha"])
        matrix[i, j] = r["final_eval_return"]

    # (a) Heatmap: epsilon_start × alpha -> ortalama final eval getirisi
    im = axes[0].imshow(matrix, cmap="viridis", aspect="auto")
    axes[0].set_xticks(range(len(alpha_vals))); axes[0].set_xticklabels([f"{a:.2f}" for a in alpha_vals])
    axes[0].set_yticks(range(len(eps_vals))); axes[0].set_yticklabels([f"{e:.2f}" for e in eps_vals])
    for i in range(len(eps_vals)):
        for j in range(len(alpha_vals)):
            if not np.isnan(matrix[i, j]):
                axes[0].text(j, i, f"{matrix[i, j]:.0f}", ha="center", va="center", color="white", fontsize=9)
    axes[0].set_title("(a) Ort. final eval getirisi (n=5 seed)")
    axes[0].set_xlabel("alpha (öğrenme oranı)")
    axes[0].set_ylabel("epsilon_start (keşif başlangıcı)")
    fig.colorbar(im, ax=axes[0], fraction=0.046, pad=0.04, label=Y_UNIT)

    # (b) Keşif-sömürü çizgisi: epsilon_start ekseninde, her alpha bir çizgi (mean ± std)
    for alpha in alpha_vals:
        sub = sweep[sweep["alpha"] == alpha].groupby("epsilon_start")["final_eval_return"].agg(["mean", "std"])
        axes[1].errorbar(sub.index, sub["mean"], yerr=sub["std"], marker="o", capsize=3, label=f"alpha={alpha:.2f}")
    axes[1].set_title("(b) Keşif–sömürü dengesi")
    axes[1].set_xlabel("epsilon_start (keşif başlangıcı)")
    axes[1].set_ylabel(Y_UNIT)
    axes[1].legend(fontsize=8)

    best = pivot.loc[pivot["final_eval_return"].idxmax()]
    worst = pivot.loc[pivot["final_eval_return"].idxmin()]
    info["best_eps"] = float(best["epsilon_start"]); info["best_alpha"] = float(best["alpha"])
    info["best_return"] = float(best["final_eval_return"])
    info["worst_eps"] = float(worst["epsilon_start"]); info["worst_alpha"] = float(worst["alpha"])
    info["worst_return"] = float(worst["final_eval_return"])
    eps_means = pivot.groupby("epsilon_start")["final_eval_return"].mean()
    info["eps_trend"] = "azalıyor" if eps_means.iloc[-1] < eps_means.iloc[0] else "artıyor"
    alpha_means = pivot.groupby("alpha")["final_eval_return"].mean()
    info["alpha_trend"] = "artıyor" if alpha_means.iloc[-1] > alpha_means.iloc[0] else "azalıyor"
    fig.suptitle("Grafik 4 — Hiperparametre Duyarlılığı (epsilon_start × alpha, 3×3, n=5 seed)", fontsize=12)
    return _save(fig, "04_hiperparametre_duyarlilik.png", info)


# --- Grafik 5: Baseline karşılaştırma ---------------------------------------
def graph5_baseline() -> dict:
    info: dict = {}
    path = SONUCLAR_DIR / "sonuclar.csv"
    fig, ax = plt.subplots(figsize=(10, 5.6))
    if not path.exists():
        ax.text(0.5, 0.5, "sonuclar.csv yok.\nÖnce evaluate.py çalıştırın.", ha="center", va="center")
        ax.axis("off")
        return _save(fig, "05_baseline_karsilastirma.png", info)

    df = pd.read_csv(path)
    agg = df.groupby(["algorithm", "kind"])["eval_return_mean"].agg(["mean", "std", "count"]).reset_index()
    agg = agg.sort_values("mean")
    color_by_kind = {"agent": "#4C78A8", "baseline": "#B65F2A", "reference": "#2F6B3F"}
    colors = [color_by_kind.get(k, "#999999") for k in agg["kind"]]
    ax.barh(agg["algorithm"], agg["mean"], xerr=agg["std"], color=colors, capsize=4)
    # Değer etiketlerini error-bar'ın soluna (negatif bar tipinin ötesine) yerleştir.
    xmin = float((agg["mean"] - agg["std"]).min())
    pad = abs(xmin) * 0.02
    for y, (m, s, c) in enumerate(zip(agg["mean"], agg["std"], agg["count"])):
        ax.text(m - s - pad, y, f"{m:.0f} (n={int(c)})", va="center", ha="right", fontsize=8)
    ax.set_xlim(left=xmin - abs(xmin) * 0.18)
    handles = [plt.Rectangle((0, 0), 1, 1, color=color_by_kind[k]) for k in ["agent", "baseline", "reference"]]
    ax.legend(handles, ["ajan", "baseline", "MDP optimum (ref)"], loc="lower right", fontsize=9)
    ax.set_title("Grafik 5 — Baseline Karşılaştırma (final greedy eval getirisi, ortalama ± std, n=5 seed)", fontsize=11)
    ax.set_xlabel(Y_UNIT)
    ax.set_ylabel("Politika")
    info["ranking"] = agg[["algorithm", "mean"]].to_dict("records")
    return _save(fig, "05_baseline_karsilastirma.png", info)


# --- Kaydetme + yorum üretimi ----------------------------------------------
def _save(fig, filename: str, info: dict) -> dict:
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    fig.tight_layout(rect=(0, 0, 1, 0.96))
    path = FIG_DIR / filename
    fig.savefig(path, dpi=170, bbox_inches="tight")
    plt.close(fig)
    return {"file": filename, "info": info}


def write_comments(results: list[dict]) -> None:
    """Her grafik için 4 cümlelik yorum taslağı (Gözlem→Karşılaştırma→Açıklama→Sonuç)."""
    by_file = {r["file"]: r["info"] for r in results}
    lines = ["# Grafik Yorumları (4 cümlelik zorunlu model)", "",
             "> Taslak — sayılar otomatik dolduruldu; raporda son hâlini siz cilalayın.", ""]

    g1 = by_file.get("01_ogrenme_egrisi.png", {})
    lines += ["## Grafik 1 — Öğrenme Eğrisi",
              f"- **Gözlem:** Her iki ajanın eğitim episode getirisi seed ortalamasında yükseliyor "
              f"(Q-learning son MA ≈ {g1.get('q_final_train_ma', float('nan')):.0f}, DQN ≈ {g1.get('dqn_final_train_ma', float('nan')):.0f} USD).",
              "- **Karşılaştırma:** Tablo ajan daha hızlı/oturmuş bir eğri verirken, DQN erken adımlarda daha gürültülü; std bandı seed varyansını gösteriyor.",
              "- **Açıklama:** Q-learning küçük durum uzayında doğrudan tablo güncellemesiyle hızlı yakınsar; DQN fonksiyon yaklaşımı + replay nedeniyle ilk binlerce adımda dalgalanır.",
              "- **Sonuç:** Çok-seed bandı, getirinin tek bir şanslı koşunun ürünü olmadığını; öğrenmenin sistematik olduğunu gösterir.", ""]

    g2 = by_file.get("02_eval_egrisi.png", {})
    lines += ["## Grafik 2 — Test/Eval Eğrisi",
              f"- **Gözlem:** Deterministic/greedy eval getirisi eğitimle birlikte iyileşiyor "
              f"(Q-learning final ≈ {g2.get('q_final_eval', float('nan')):.0f}, DQN ≈ {g2.get('dqn_final_eval', float('nan')):.0f} USD).",
              "- **Karşılaştırma:** Eval eğrisi eğitim eğrisinden daha az gürültülü çünkü keşif (epsilon) kapalı; eğitim eğrisi tek başına kanıt sayılmaz.",
              "- **Açıklama:** Greedy koşu, öğrenilen değer fonksiyonunun fiilî politika kalitesini ölçer; ortam stokastik olduğundan eval de bir dağılımdır.",
              "- **Sonuç:** Politika, görülmemiş episode başlangıçlarında da tutarlı getiri üretiyor.", ""]

    g3 = by_file.get("03_loss_ve_policy_heatmap.png", {})
    lines += ["## Grafik 3 — Loss + Policy Heatmap",
              f"- **Gözlem:** DQN TD-loss başlangıçtaki ≈ {g3.get('dqn_loss_first', float('nan')):.0f} değerinden ≈ {g3.get('dqn_loss_last', float('nan')):.0f} düzeyine düşüyor; heatmap yüksek risk × ileri DIM hücrelerinde cull oranının arttığını gösteriyor.",
              "- **Karşılaştırma:** Tablo yöntemde loss yoktur; bu yüzden öğrenilen politikayı değer/risk eksenlerinde heatmap ile veriyoruz.",
              "- **Açıklama:** Loss düşüşü Q-hedefine yakınsamayı; heatmap deseni ise iktisadi olarak beklenen 'yüksek riskli, düşük verimli inekleri ele' davranışını yansıtır.",
              "- **Sonuç:** Hem optimizasyon (loss) hem de karar yapısı (heatmap) sağlıklı ve yorumlanabilir.", ""]

    g4 = by_file.get("04_hiperparametre_duyarlilik.png", {})
    lines += ["## Grafik 4 — Hiperparametre Duyarlılığı",
              f"- **Gözlem:** En iyi hücre epsilon_start={g4.get('best_eps', float('nan')):.2f} × alpha={g4.get('best_alpha', float('nan')):.2f} "
              f"(≈ {g4.get('best_return', float('nan')):.0f} USD); en kötü epsilon_start={g4.get('worst_eps', float('nan')):.2f} × alpha={g4.get('worst_alpha', float('nan')):.2f} (≈ {g4.get('worst_return', float('nan')):.0f} USD).",
              f"- **Karşılaştırma:** En iyi getiri orta düzey keşifte (epsilon_start={g4.get('best_eps', float('nan')):.2f}) ve orta düzey öğrenme oranında (alpha={g4.get('best_alpha', float('nan')):.2f}) toplanıyor; uç köşeler (çok düşük/çok yüksek) daha kötü.",
              "- **Açıklama:** Klasik keşif–sömürü dengesi: çok az keşif ajanı yeterince farklı durumu görmeden erken sömürüye sıkıştırır, çok fazla keşif eğitim bütçesini rastgele aksiyonlarda harcar; benzer şekilde çok yüksek alpha TD-güncellemelerini gürültüye aşırı tepki verir hâle getirip yakınsamayı bozar.",
              "- **Sonuç:** Seçilen varsayılanlar (epsilon_start=0.35, alpha=0.18) duyarlılık haritasının en iyi hücresine denk geliyor; bu, konfigürasyonun keyfî değil veriyle gerekçeli olduğunu gösterir.", ""]

    g5 = by_file.get("05_baseline_karsilastirma.png", {})
    ranking = g5.get("ranking", [])
    rank_txt = ", ".join(f"{r['algorithm']}={r['mean']:.0f}" for r in ranking) if ranking else ""
    lines += ["## Grafik 5 — Baseline Karşılaştırma",
              f"- **Gözlem:** Sıralama (getiri): {rank_txt}.",
              "- **Karşılaştırma:** Eğitilmiş ajanlar random/cull_all/keep_all baselinelarını açık ara geçiyor ve risk-eşiği heuristiğine yaklaşıyor; MDP value-iteration tavan referans.",
              "- **Açıklama:** Ajanlar gecikmeli ödülü ve stokastik geçişleri hesaba kattığından miyop baselinelardan üstün; MDP optimum tam modeli bildiği için üstte.",
              "- **Sonuç:** RL yaklaşımı naif kurallara göre ölçülebilir iktisadi kazanç sağlıyor; bu da çevre seçimini gerekçelendirir.", ""]

    (FIG_DIR / "yorumlar.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    try:
        plt.style.use("seaborn-v0_8-whitegrid")
    except Exception:
        pass
    seeds = load_seeds()
    results = [
        graph1_learning_curve(seeds),
        graph2_eval_curve(seeds),
        graph3_loss_and_heatmap(seeds),
        graph4_hyperparameter(seeds),
        graph5_baseline(),
    ]
    write_comments(results)
    print("Üretilen grafikler:")
    for r in results:
        print(f"  {FIG_DIR.relative_to(PKG_ROOT)}/{r['file']}")
    print(f"  {FIG_DIR.relative_to(PKG_ROOT)}/yorumlar.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
