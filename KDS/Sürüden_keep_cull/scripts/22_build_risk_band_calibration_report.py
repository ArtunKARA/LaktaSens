from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = PROJECT_ROOT / "data" / "processed" / "models" / "payload_enriched"
REASON_LABELS = PROJECT_ROOT / "data" / "processed" / "culling_reason_labels.csv"

OUTPUT_BANDS = MODEL_DIR / "risk_band_calibration.csv"
OUTPUT_REASONS = MODEL_DIR / "risk_band_reason_distribution.csv"
REPORT_PATH = PROJECT_ROOT / "reports" / "risk_band_calibration_payload_enriched_report.md"

BINS = [0.0, 0.05, 0.10, 0.20, 0.35, 0.50, 1.0000001]
LABELS = ["0-5%", "5-10%", "10-20%", "20-35%", "35-50%", "50-100%"]


def load_reason_labels() -> pd.DataFrame:
    if not REASON_LABELS.exists():
        return pd.DataFrame(columns=["canonical_animal_id", "culling_reason_group", "primary_culling_reason"])
    labels = pd.read_csv(REASON_LABELS, low_memory=False)
    keep = ["canonical_animal_id", "culling_reason_group", "primary_culling_reason"]
    return labels[keep].drop_duplicates("canonical_animal_id")


def normalize_score_frame(path: Path, score_set: str, score_col: str, label_col: str, target_col: str | None) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_csv(path, low_memory=False)
    if score_col not in df.columns or label_col not in df.columns:
        return pd.DataFrame()
    out = df[["snapshot_id", "source_code", "canonical_animal_id", "referans_tarih", "model_name", score_col, label_col]].copy()
    out = out.rename(columns={score_col: "risk_score", label_col: "label"})
    out["score_set"] = score_set
    if target_col and target_col in df.columns:
        out["target"] = df[target_col].astype(str)
    else:
        out["target"] = "cull_within_90d"
    if "validation_policy" in df.columns:
        out["validation_policy"] = df["validation_policy"].astype(str)
    else:
        out["validation_policy"] = "phase_3_split"
    return out


def load_scores() -> pd.DataFrame:
    frames = [
        normalize_score_frame(MODEL_DIR / "baseline_risk_scores.csv", "payload_configured", "risk_score", "label", "horizon_label"),
        normalize_score_frame(MODEL_DIR / "calibrated_risk_scores.csv", "payload_calibrated_no_source", "risk_score", "label", "target"),
    ]
    strict = normalize_score_frame(MODEL_DIR / "strict_validation_risk_scores.csv", "strict_validation_no_source", "risk_score", "label", "target")
    if not strict.empty:
        strict = strict[strict["validation_policy"].eq("phase_3_split")].copy()
        frames.append(strict)
    survival = normalize_score_frame(
        MODEL_DIR / "survival_discrete_hazard_scores.csv",
        "survival_30d_hazard_proxy",
        "hazard_score_30d",
        "proxy_90d_label",
        "proxy_target",
    )
    if not survival.empty:
        survival["target"] = "cull_within_90d_proxy_from_30d_hazard"
        frames.append(survival)
    frames = [frame for frame in frames if not frame.empty]
    if not frames:
        return pd.DataFrame()
    out = pd.concat(frames, ignore_index=True)
    out["risk_score"] = pd.to_numeric(out["risk_score"], errors="coerce")
    out["label"] = pd.to_numeric(out["label"], errors="coerce")
    out = out[out["risk_score"].between(0, 1, inclusive="both") & out["label"].isin([0, 1])].copy()
    out["risk_band"] = pd.cut(out["risk_score"], bins=BINS, labels=LABELS, include_lowest=True, right=False)
    return out


def band_summary(scores: pd.DataFrame) -> pd.DataFrame:
    if scores.empty:
        return pd.DataFrame()
    grouped = scores.groupby(["score_set", "target", "validation_policy", "model_name", "risk_band"], observed=False)
    rows: list[dict[str, Any]] = []
    for keys, group in grouped:
        score_set, target, validation_policy, model_name, risk_band = keys
        if group.empty:
            continue
        positives = int(group["label"].sum())
        rows.append(
            {
                "score_set": score_set,
                "target": target,
                "validation_policy": validation_policy,
                "model_name": model_name,
                "risk_band": str(risk_band),
                "rows": int(len(group)),
                "positives": positives,
                "observed_rate": positives / len(group),
                "avg_predicted_risk": float(group["risk_score"].mean()),
                "calibration_gap": float(group["risk_score"].mean() - group["label"].mean()),
            }
        )
    return pd.DataFrame(rows)


def reason_distribution(scores: pd.DataFrame, reasons: pd.DataFrame) -> pd.DataFrame:
    if scores.empty or reasons.empty:
        return pd.DataFrame()
    merged = scores.merge(reasons, on="canonical_animal_id", how="left")
    positives = merged[merged["label"].eq(1)].copy()
    if positives.empty:
        return pd.DataFrame()
    positives["culling_reason_group"] = positives["culling_reason_group"].fillna("unknown")
    grouped = positives.groupby(["score_set", "model_name", "risk_band", "culling_reason_group"], observed=False)
    rows = []
    for keys, group in grouped:
        score_set, model_name, risk_band, reason = keys
        if group.empty:
            continue
        rows.append(
            {
                "score_set": score_set,
                "model_name": model_name,
                "risk_band": str(risk_band),
                "culling_reason_group": reason,
                "positive_rows": int(len(group)),
            }
        )
    return pd.DataFrame(rows)


def write_report(summary: pd.DataFrame, reasons: pd.DataFrame) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Risk Band Calibration Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Purpose: check whether risk scores behave like usable risk bands before MDP/reward simulation.",
        "",
        "## Band Summary",
        "",
        "| Score set | Model | Target | Band | Rows | Positives | Observed rate | Avg predicted | Gap |",
        "|---|---|---|---|---:|---:|---:|---:|---:|",
    ]
    if not summary.empty:
        preferred_order = {
            "payload_calibrated_no_source": 0,
            "payload_configured": 1,
            "strict_validation_no_source": 2,
            "survival_30d_hazard_proxy": 3,
        }
        local = summary.copy()
        local["_order"] = local["score_set"].map(preferred_order).fillna(99)
        for row in local.sort_values(["_order", "model_name", "risk_band"]).to_dict("records"):
            lines.append(
                f"| `{row['score_set']}` | `{row['model_name']}` | `{row['target']}` | `{row['risk_band']}` | "
                f"{int(row['rows'])} | {int(row['positives'])} | {row['observed_rate']:.4f} | "
                f"{row['avg_predicted_risk']:.4f} | {row['calibration_gap']:.4f} |"
            )
    if not reasons.empty:
        lines.extend(
            [
                "",
                "## Positive Reason Mix By Band",
                "",
                "| Score set | Model | Band | Reason group | Positive rows |",
                "|---|---|---|---|---:|",
            ]
        )
        for row in reasons.sort_values(["score_set", "model_name", "risk_band", "positive_rows"], ascending=[True, True, True, False]).head(80).to_dict("records"):
            lines.append(
                f"| `{row['score_set']}` | `{row['model_name']}` | `{row['risk_band']}` | "
                f"`{row['culling_reason_group']}` | {int(row['positive_rows'])} |"
            )
    lines.extend(
        [
            "",
            "## Decision",
            "",
            "- Calibrated scores are preferred for decision thresholds because Brier/ECE are lower.",
            "- Uncalibrated XGBoost may rank animals better, but its raw probability scale is not reliable enough for direct economic reward use.",
            "- Risk bands can feed MDP smoke tests only as scenario inputs, not final policy thresholds.",
        ]
    )
    REPORT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    scores = load_scores()
    reasons = load_reason_labels()
    summary = band_summary(scores)
    reason_rows = reason_distribution(scores, reasons)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    summary.to_csv(OUTPUT_BANDS, index=False)
    reason_rows.to_csv(OUTPUT_REASONS, index=False)
    write_report(summary, reason_rows)
    print(f"wrote {OUTPUT_BANDS.relative_to(PROJECT_ROOT)}")
    print(f"wrote {OUTPUT_REASONS.relative_to(PROJECT_ROOT)}")
    print(f"wrote {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
