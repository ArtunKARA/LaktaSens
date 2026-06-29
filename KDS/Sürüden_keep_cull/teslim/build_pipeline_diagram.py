"""Sistem/pipeline blok diyagramı (rapor Şekil 1).

Veri -> empirik MDP -> öğrenen ajanlar -> değerlendirme akışını gösterir.
Çıktı: teslim/sunum/grafikler/00_pipeline.png
"""

from __future__ import annotations

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

OUT = Path(__file__).resolve().parent / "sunum" / "grafikler" / "00_pipeline.png"

FOREST = "#2C5F2D"
MOSS = "#97BC62"
FILL = "#EAF1E4"
DARK = "#212121"

# (x_merkez, başlık, alt satırlar)
STAGES = [
    (0.10, "Kamu Veri\nKaynakları", "USDA fiyat/maliyet\nsağlık veri setleri"),
    (0.30, "Önişleme", "aylık hayvan snapshot\n+ denetimli 90g\ncull-risk skoru"),
    (0.50, "Empirik MDP", "162 durum (ayrık)\n$p(s'|s,\\mathrm{keep})$ (empirik)\nödül $R(s,a)$ (USD)"),
    (0.70, "Öğrenen Ajanlar", "Q-Learning · DQN\nref: Value Iteration\nbaseline: 4 heuristik"),
    (0.90, "Değerlendirme", "≥5 seed · greedy\n5 standart grafik\nsonuclar.csv"),
]

fig, ax = plt.subplots(figsize=(14, 3.6))
ax.set_xlim(-0.02, 1.02)
ax.set_ylim(0, 1)
ax.axis("off")

box_w, box_h, y0 = 0.16, 0.62, 0.19
centers = []
for cx, title, body in STAGES:
    x = cx - box_w / 2
    box = FancyBboxPatch(
        (x, y0), box_w, box_h,
        boxstyle="round,pad=0.012,rounding_size=0.02",
        linewidth=1.6, edgecolor=FOREST, facecolor=FILL, mutation_aspect=0.5,
    )
    ax.add_patch(box)
    ax.text(cx, y0 + box_h - 0.10, title, ha="center", va="top",
            fontsize=12.5, fontweight="bold", color=FOREST)
    ax.text(cx, y0 + box_h - 0.255, body, ha="center", va="top",
            fontsize=9.3, color=DARK, linespacing=1.4)
    centers.append((cx - box_w / 2, cx + box_w / 2))

# Aşamalar arası oklar
for i in range(len(STAGES) - 1):
    x_start = centers[i][1] + 0.004
    x_end = centers[i + 1][0] - 0.004
    arrow = FancyArrowPatch(
        (x_start, y0 + box_h / 2), (x_end, y0 + box_h / 2),
        arrowstyle="-|>", mutation_scale=18, linewidth=2.0, color=MOSS,
    )
    ax.add_patch(arrow)

ax.text(0.5, 0.94, "Keep/Cull RL — Uçtan Uca İş Akışı",
        ha="center", va="top", fontsize=13.5, fontweight="bold", color=DARK)
ax.text(0.5, 0.045,
        "Tüm rastgelelik np.random.default_rng(seed) · tek geçiş çekirdeği hem VI'yı hem RL simülatörünü besler · run_all.sh ile tek komut",
        ha="center", va="bottom", fontsize=8.6, color="#555555", style="italic")

OUT.parent.mkdir(parents=True, exist_ok=True)
fig.tight_layout()
fig.savefig(OUT, dpi=175, bbox_inches="tight", facecolor="white")
print(f"Yazıldı: {OUT.relative_to(Path(__file__).resolve().parent.parent)}")
