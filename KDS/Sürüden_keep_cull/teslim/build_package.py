"""Teslim arşivini (255172008_ArtunKARA.zip) kuran ve kabul-şartlarını doğrulayan script.

Arşiv yapısı (Rehber §A'ya birebir):
    255172008_ArtunKARA/
    ├── rapor/255172008_rapor.pdf (+ .tex)
    ├── sunum/255172008_sunum.pdf (+ .tex) + grafikler/*.png + yorumlar.md
    ├── kod/  env/ + entry script'ler + config.yaml/config/ + data/ + seeds/req/run_all/README
    └── sonuclar/ loglar/*.csv + sonuclar.csv

Hariç tutulanlar: __pycache__, *.pyc, ara model ağırlıkları (sonuclar/models, *.zip),
SB3 ham log dizinleri (sb3log_*), monitor.csv, LaTeX ara dosyaları.

Kullanım:
    python build_package.py            # staging + zip + doğrulama
    python build_package.py --check    # yalnızca kabul-şartı doğrulaması
"""

from __future__ import annotations

import argparse
import shutil
import sys
import zipfile
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

OGR = "255172008_ArtunKARA"
TESLIM = Path(__file__).resolve().parent           # .../teslim
REPO = TESLIM.parent                               # proje kökü
DIST = TESLIM / "dist"
STAGE = DIST / OGR

# Standalone kod paketinin ihtiyaç duyduğu minimal veri (config output yollarına göre).
DATA_FILES = [
    "data/processed/rl/empirical_transition_model.csv",
    "data/processed/rl/mdp_state_table.csv",
    "data/processed/rl/mdp_reward_table.csv",
    "data/processed/rl/optimal_policy_table.csv",
    "data/processed/reward_baseline_us_2025.csv",
]


def _copy(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def build() -> None:
    if STAGE.exists():
        shutil.rmtree(STAGE)
    STAGE.mkdir(parents=True)

    # 1) rapor/
    _copy(TESLIM / "rapor" / f"{OGR.split('_')[0]}_rapor.pdf", STAGE / "rapor" / "255172008_rapor.pdf")
    _copy(TESLIM / "rapor" / "255172008_rapor.tex", STAGE / "rapor" / "255172008_rapor.tex")

    # 2) sunum/ (pptx birincil; pdf + tex bonus)
    _copy(TESLIM / "sunum" / "255172008_sunum.pptx", STAGE / "sunum" / "255172008_sunum.pptx")
    _copy(TESLIM / "sunum" / "255172008_sunum.pdf", STAGE / "sunum" / "255172008_sunum.pdf")
    _copy(TESLIM / "sunum" / "255172008_sunum.tex", STAGE / "sunum" / "255172008_sunum.tex")
    for png in sorted((TESLIM / "sunum" / "grafikler").glob("*.png")):
        _copy(png, STAGE / "sunum" / "grafikler" / png.name)
    _copy(TESLIM / "sunum" / "grafikler" / "yorumlar.md", STAGE / "sunum" / "grafikler" / "yorumlar.md")

    # 3) kod/ — entry script'ler + env/ + config + data + meta
    kod_src = TESLIM / "kod"
    for name in ["rl_core.py", "train.py", "sweep.py", "evaluate.py", "plotting.py",
                 "config.yaml", "seeds.txt", "requirements.txt", "run_all.sh", "README.md"]:
        _copy(kod_src / name, STAGE / "kod" / name)
    for env_mod in ["rl_mdp_utils.py", "rl_experiment_utils.py", "cow_replacement_gym_env.py"]:
        _copy(kod_src / "env" / env_mod, STAGE / "kod" / "env" / env_mod)
    # Vendor'lı env modüllerinin read_rules'u kod/config/rl_env_rules.yaml okur:
    _copy(REPO / "config" / "rl_env_rules.yaml", STAGE / "kod" / "config" / "rl_env_rules.yaml")
    # Minimal veri (standalone çalışma için):
    for rel in DATA_FILES:
        _copy(REPO / rel, STAGE / "kod" / rel)

    # 4) sonuclar/ — temiz ham loglar + özet (ara ağırlık / SB3 ham dizin / monitor hariç)
    log_src = TESLIM / "sonuclar" / "loglar"
    for csv in sorted(log_src.glob("*.csv")):
        if csv.name.endswith(".monitor.csv"):
            continue  # SB3 Monitor ham dosyası; normalize edilmiş dqn_train_seed*.csv zaten var
        _copy(csv, STAGE / "sonuclar" / "loglar" / csv.name)
    for extra in ["_train_summary.csv", "_train_manifest.json"]:
        p = log_src / extra
        if p.exists():
            _copy(p, STAGE / "sonuclar" / "loglar" / extra)
    for name in ["sonuclar.csv", "sonuclar_agg.csv"]:
        _copy(TESLIM / "sonuclar" / name, STAGE / "sonuclar" / name)

    # __pycache__ temizliği
    for pyc in STAGE.rglob("__pycache__"):
        shutil.rmtree(pyc, ignore_errors=True)

    # 5) zip
    zip_path = DIST / f"{OGR}.zip"
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(STAGE.rglob("*")):
            if f.is_file():
                zf.write(f, f.relative_to(DIST))
    size_mb = zip_path.stat().st_size / 1024 / 1024
    print(f"Arşiv: {zip_path.relative_to(REPO)}  ({size_mb:.2f} MB)")


def check() -> bool:
    """Rehber §E kabul-şartlarını staging üzerinde doğrular."""
    ok = True

    def req(cond: bool, msg: str) -> None:
        nonlocal ok
        print(("  [✓] " if cond else "  [✗] ") + msg)
        ok = ok and cond

    print("Kabul-şartı doğrulaması (staging):")
    loglar = list((STAGE / "sonuclar" / "loglar").glob("*_seed*.csv"))
    req(len(loglar) >= 10, f"sonuclar/loglar/ ham CSV log var ({len(loglar)} dosya)")
    required_pngs = [
        "01_ogrenme_egrisi.png", "02_eval_egrisi.png", "03_loss_ve_policy_heatmap.png",
        "04_hiperparametre_duyarlilik.png", "05_baseline_karsilastirma.png",
    ]
    all_pngs = list((STAGE / "sunum" / "grafikler").glob("*.png"))
    have5 = all((STAGE / "sunum" / "grafikler" / n).exists() for n in required_pngs)
    req(have5, f"5 zorunlu grafik PNG var (+{len(all_pngs) - 5} ek diyagram)")
    req((STAGE / "sunum" / "grafikler" / "yorumlar.md").exists(), "grafik yorumları (yorumlar.md)")
    req((STAGE / "rapor" / "255172008_rapor.pdf").exists(), "rapor PDF")
    req((STAGE / "sunum" / "255172008_sunum.pptx").exists(), "sunum PPTX (birincil)")
    req((STAGE / "sunum" / "255172008_sunum.pdf").exists(), "sunum PDF (bonus)")
    seeds = (STAGE / "kod" / "seeds.txt").read_text().split()
    req(len(seeds) >= 5, f"seeds.txt ≥5 seed ({len(seeds)})")
    reqtxt = (STAGE / "kod" / "requirements.txt").read_text()
    req("==" in reqtxt, "requirements.txt == ile pinli")
    req((STAGE / "kod" / "config.yaml").exists(), "config.yaml")
    req((STAGE / "kod" / "run_all.sh").exists(), "run_all.sh")
    req((STAGE / "sonuclar" / "sonuclar.csv").exists(), "sonuclar.csv (seed×metrik)")
    # Yasak kalıp taraması
    banned = []
    for py in (STAGE / "kod").rglob("*.py"):
        txt = py.read_text(encoding="utf-8", errors="replace")
        if "import gym\n" in txt or "import gym " in txt:
            banned.append(f"{py.name}: import gym")
        if "np.random.seed(" in txt or "np.random.choice(" in txt:
            banned.append(f"{py.name}: np.random.seed/choice")
    req(not banned, "yasak kalıp yok (import gym / np.random.seed|choice)" + (f" — {banned}" if banned else ""))
    # Bundle veri
    req(all((STAGE / "kod" / rel).exists() for rel in DATA_FILES), "kod/data/ minimal veri bundle'lı")
    req((STAGE / "kod" / "config" / "rl_env_rules.yaml").exists(), "kod/config/rl_env_rules.yaml (runtime config)")
    print("SONUÇ:", "TÜM ŞARTLAR SAĞLANDI ✓" if ok else "EKSİK VAR ✗")
    return ok


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="yalnızca doğrulama (staging mevcut olmalı)")
    args = parser.parse_args()
    if not args.check:
        build()
    elif not STAGE.exists():
        print("staging yok; önce --check'siz çalıştırın.")
        return 1
    return 0 if check() else 1


if __name__ == "__main__":
    raise SystemExit(main())
