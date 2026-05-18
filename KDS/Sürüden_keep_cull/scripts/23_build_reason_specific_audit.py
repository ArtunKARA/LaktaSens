from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, f1_score, precision_score, recall_score, roc_auc_score


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = PROJECT_ROOT / "data" / "processed" / "models" / "payload_enriched"
TRAINING_CSV = PROJECT_ROOT / "data" / "processed" / "training" / "inek_aylik_snapshot_culling_observable_payload_enriched_model_ready.csv"
REASON_LABELS = PROJECT_ROOT / "data" / "processed" / "culling_reason_labels.csv"
SURVIVAL_LABELS = PROJECT_ROOT / "data" / "processed" / "primiparous_survival_labels.csv"

CURRENT_METRICS = MODEL_DIR / "baseline_model_metrics.csv"
PREVIOUS_METRICS = MODEL_DIR / "pre_survival_catboost" / "baseline_model_metrics.csv"
CURRENT_STRICT = MODEL_DIR / "strict_validation_metrics.csv"
PREVIOUS_STRICT = MODEL_DIR / "pre_survival_catboost" / "strict_validation_metrics.csv"
CURRENT_SCORES = MODEL_DIR / "baseline_risk_scores.csv"

OUTPUT_REASON_METRICS = MODEL_DIR / "reason_specific_audit_metrics.csv"
OUTPUT_POSITIVE_CAPTURE = MODEL_DIR / "reason_specific_positive_capture.csv"
OUTPUT_SURVIVAL_AUDIT = MODEL_DIR / "primiparous_survival_audit.csv"
REPORT_PATH = PROJECT_ROOT / "reports" / "reason_specific_audit_payload_enriched_report.md"


def safe_metric(fn: Any, y_true: np.ndarray, values: np.ndarray) -> float:
    try:
        return float(fn(y_true, values))
    except ValueError:
        return float("nan")


def best_primary_metric(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    df = pd.read_csv(path)
    if "horizon_label" in df.columns:
        primary = df[df["horizon_label"].eq("cull_within_90d")].copy()
    elif "target" in df.columns:
        primary = df[df["target"].eq("cull_within_90d")].copy()
    else:
        primary = df.copy()
    if primary.empty or "pr_auc" not in primary.columns:
        return None
    row = primary.sort_values("pr_auc", ascending=False).iloc[0].to_dict()
    return row


def best_strict_by_policy(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_csv(path)
    if df.empty:
        return pd.DataFrame()
    rows = []
    for policy, group in df.groupby("validation_policy"):
        rows.append(group.sort_values("pr_auc", ascending=False).iloc[0].to_dict())
    return pd.DataFrame(rows)


def load_scores_with_reasons() -> pd.DataFrame:
    scores = pd.read_csv(CURRENT_SCORES, low_memory=False)
    reasons = pd.read_csv(REASON_LABELS, low_memory=False) if REASON_LABELS.exists() else pd.DataFrame()
    if reasons.empty:
        scores["culling_reason_group"] = "unknown"
        scores["primary_culling_reason"] = "unknown"
        return scores
    keep = [
        "canonical_animal_id",
        "culling_reason_group",
        "raw_culling_reason",
        "primary_culling_reason",
        "secondary_culling_reason",
        "destination_after_culling",
        "reason_confidence",
    ]
    merged = scores.merge(reasons[keep], on="canonical_animal_id", how="left")
    merged["culling_reason_group"] = merged["culling_reason_group"].fillna("unknown")
    merged["primary_culling_reason"] = merged["primary_culling_reason"].fillna("unknown")
    merged["label"] = pd.to_numeric(merged["label"], errors="coerce")
    merged["risk_score"] = pd.to_numeric(merged["risk_score"], errors="coerce")
    merged["predicted_label"] = pd.to_numeric(merged["predicted_label"], errors="coerce").fillna(0).astype(int)
    return merged


def reason_one_vs_rest_metrics(scores: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    groups = sorted(group for group in scores.loc[scores["label"].eq(1), "culling_reason_group"].dropna().unique())
    for group_name in groups:
        y_group = (scores["label"].eq(1) & scores["culling_reason_group"].eq(group_name)).astype(int)
        valid = y_group.isin([0, 1]) & scores["risk_score"].notna()
        if y_group.loc[valid].sum() == 0:
            continue
        pred_group = (scores["predicted_label"].eq(1) & scores["culling_reason_group"].eq(group_name)).astype(int)
        rows.append(
            {
                "reason_group": group_name,
                "rows": int(valid.sum()),
                "positive_rows": int(y_group.loc[valid].sum()),
                "roc_auc_one_vs_rest": safe_metric(roc_auc_score, y_group.loc[valid].to_numpy(), scores.loc[valid, "risk_score"].to_numpy()),
                "pr_auc_one_vs_rest": safe_metric(average_precision_score, y_group.loc[valid].to_numpy(), scores.loc[valid, "risk_score"].to_numpy()),
                "f1_at_model_threshold": safe_metric(lambda yt, yp: f1_score(yt, yp, zero_division=0), y_group.loc[valid].to_numpy(), pred_group.loc[valid].to_numpy()),
                "recall_at_model_threshold": safe_metric(lambda yt, yp: recall_score(yt, yp, zero_division=0), y_group.loc[valid].to_numpy(), pred_group.loc[valid].to_numpy()),
                "precision_at_model_threshold": safe_metric(lambda yt, yp: precision_score(yt, yp, zero_division=0), y_group.loc[valid].to_numpy(), pred_group.loc[valid].to_numpy()),
                "avg_risk_positive_rows": float(scores.loc[valid & y_group.eq(1), "risk_score"].mean()),
            }
        )
    return pd.DataFrame(rows)


def positive_capture(scores: pd.DataFrame) -> pd.DataFrame:
    positives = scores[scores["label"].eq(1)].copy()
    if positives.empty:
        return pd.DataFrame()
    rows = []
    for group_name, group in positives.groupby("culling_reason_group"):
        rows.append(
            {
                "reason_group": group_name,
                "positive_rows": int(len(group)),
                "captured_at_model_threshold": int(group["predicted_label"].sum()),
                "recall_at_model_threshold": float(group["predicted_label"].mean()),
                "avg_risk_score": float(group["risk_score"].mean()),
                "median_risk_score": float(group["risk_score"].median()),
                "p90_risk_score": float(group["risk_score"].quantile(0.90)),
            }
        )
    return pd.DataFrame(rows).sort_values("positive_rows", ascending=False)


def primiparous_survival_audit(scores: pd.DataFrame) -> pd.DataFrame:
    if not SURVIVAL_LABELS.exists():
        return pd.DataFrame()
    labels = pd.read_csv(SURVIVAL_LABELS, low_memory=False)
    merged = scores.merge(
        labels[["canonical_animal_id", "first_lactation_survival", "exit_age"]],
        on="canonical_animal_id",
        how="inner",
    )
    if merged.empty:
        return pd.DataFrame()
    rows = []
    for survival, group in merged.groupby("first_lactation_survival"):
        rows.append(
            {
                "first_lactation_survival": survival,
                "test_rows": int(len(group)),
                "animals": int(group["canonical_animal_id"].nunique()),
                "positive_90d_rows": int(group["label"].sum()),
                "positive_90d_rate": float(group["label"].mean()),
                "avg_risk_score": float(group["risk_score"].mean()),
                "median_risk_score": float(group["risk_score"].median()),
                "avg_exit_age": float(pd.to_numeric(group["exit_age"], errors="coerce").mean()),
            }
        )
    return pd.DataFrame(rows)


def write_report(
    current_best: dict[str, Any] | None,
    previous_best: dict[str, Any] | None,
    strict_current: pd.DataFrame,
    strict_previous: pd.DataFrame,
    reason_metrics: pd.DataFrame,
    capture: pd.DataFrame,
    survival_audit: pd.DataFrame,
) -> None:
    lines = [
        "# Reason-Specific Audit and Improvement Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Scope: Primiparous survival static features + CatBoost + culling-reason segment audit.",
        "- Leakage guard: reason labels, survival outcome and exit age are audit-only; they are not model features.",
        "",
        "## Overall 90-Day Improvement",
        "",
    ]
    if current_best and previous_best:
        delta_pr = float(current_best["pr_auc"]) - float(previous_best["pr_auc"])
        delta_roc = float(current_best["roc_auc"]) - float(previous_best["roc_auc"])
        lines.extend(
            [
                f"- Previous best model: `{previous_best['model_name']}` PR-AUC `{float(previous_best['pr_auc']):.6f}`, ROC-AUC `{float(previous_best['roc_auc']):.6f}`",
                f"- Current best model: `{current_best['model_name']}` PR-AUC `{float(current_best['pr_auc']):.6f}`, ROC-AUC `{float(current_best['roc_auc']):.6f}`",
                f"- Delta PR-AUC: `{delta_pr:+.6f}`",
                f"- Delta ROC-AUC: `{delta_roc:+.6f}`",
            ]
        )
    else:
        lines.append("- Previous/current baseline metrics were not both available.")

    if not strict_current.empty:
        lines.extend(
            [
                "",
                "## Strict Validation Best By Policy",
                "",
                "| Policy | Previous best PR-AUC | Current best model | Current best PR-AUC | Delta |",
                "|---|---:|---|---:|---:|",
            ]
        )
        previous_by_policy = {
            row["validation_policy"]: row for row in strict_previous.to_dict("records")
        } if not strict_previous.empty else {}
        for row in strict_current.sort_values("validation_policy").to_dict("records"):
            prev = previous_by_policy.get(row["validation_policy"])
            prev_pr = float(prev["pr_auc"]) if prev is not None else np.nan
            delta = float(row["pr_auc"]) - prev_pr if prev is not None else np.nan
            prev_text = f"{prev_pr:.4f}" if prev is not None else "-"
            delta_text = f"{delta:+.4f}" if prev is not None else "-"
            lines.append(
                f"| `{row['validation_policy']}` | {prev_text} | `{row['model_name']}` | {float(row['pr_auc']):.4f} | {delta_text} |"
            )

    lines.extend(
        [
            "",
            "## Reason-Specific One-vs-Rest Metrics",
            "",
            "| Reason group | Positive rows | ROC-AUC | PR-AUC | F1 | Recall | Precision | Avg risk on positives |",
            "|---|---:|---:|---:|---:|---:|---:|---:|",
        ]
    )
    if not reason_metrics.empty:
        for row in reason_metrics.sort_values("pr_auc_one_vs_rest", ascending=False).to_dict("records"):
            lines.append(
                f"| `{row['reason_group']}` | {int(row['positive_rows'])} | {row['roc_auc_one_vs_rest']:.4f} | "
                f"{row['pr_auc_one_vs_rest']:.4f} | {row['f1_at_model_threshold']:.4f} | "
                f"{row['recall_at_model_threshold']:.4f} | {row['precision_at_model_threshold']:.4f} | "
                f"{row['avg_risk_positive_rows']:.4f} |"
            )
    lines.extend(
        [
            "",
            "## Positive Capture By Reason",
            "",
            "| Reason group | Positive rows | Captured | Recall | Avg risk | Median risk | P90 risk |",
            "|---|---:|---:|---:|---:|---:|---:|",
        ]
    )
    if not capture.empty:
        for row in capture.to_dict("records"):
            lines.append(
                f"| `{row['reason_group']}` | {int(row['positive_rows'])} | {int(row['captured_at_model_threshold'])} | "
                f"{row['recall_at_model_threshold']:.4f} | {row['avg_risk_score']:.4f} | "
                f"{row['median_risk_score']:.4f} | {row['p90_risk_score']:.4f} |"
            )
    if not survival_audit.empty:
        lines.extend(
            [
                "",
                "## Primiparous Survival Sheet Audit",
                "",
                "| 1st lactation survival | Test rows | Animals | 90d positives | 90d positive rate | Avg risk | Median risk | Avg exit age |",
                "|---|---:|---:|---:|---:|---:|---:|---:|",
            ]
        )
        for row in survival_audit.to_dict("records"):
            lines.append(
                f"| `{row['first_lactation_survival']}` | {int(row['test_rows'])} | {int(row['animals'])} | "
                f"{int(row['positive_90d_rows'])} | {row['positive_90d_rate']:.4f} | "
                f"{row['avg_risk_score']:.4f} | {row['median_risk_score']:.4f} | {row['avg_exit_age']:.1f} |"
            )

    lines.extend(
        [
            "",
            "## Decision",
            "",
            "- CatBoost becomes the best time-split model, but the gain is small.",
            "- Reason-specific audit is mainly diagnostic: reproductive and unknown/status exits dominate the positive set.",
            "- Survival sheet static fields are safe to keep; survival outcome and exit age must remain audit-only.",
        ]
    )
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    scores = load_scores_with_reasons()
    reason_metrics = reason_one_vs_rest_metrics(scores)
    capture = positive_capture(scores)
    survival_audit = primiparous_survival_audit(scores)
    current_best = best_primary_metric(CURRENT_METRICS)
    previous_best = best_primary_metric(PREVIOUS_METRICS)
    strict_current = best_strict_by_policy(CURRENT_STRICT)
    strict_previous = best_strict_by_policy(PREVIOUS_STRICT)

    OUTPUT_REASON_METRICS.parent.mkdir(parents=True, exist_ok=True)
    reason_metrics.to_csv(OUTPUT_REASON_METRICS, index=False)
    capture.to_csv(OUTPUT_POSITIVE_CAPTURE, index=False)
    survival_audit.to_csv(OUTPUT_SURVIVAL_AUDIT, index=False)
    write_report(current_best, previous_best, strict_current, strict_previous, reason_metrics, capture, survival_audit)
    print(f"wrote {OUTPUT_REASON_METRICS.relative_to(PROJECT_ROOT)}")
    print(f"wrote {OUTPUT_POSITIVE_CAPTURE.relative_to(PROJECT_ROOT)}")
    print(f"wrote {OUTPUT_SURVIVAL_AUDIT.relative_to(PROJECT_ROOT)}")
    print(f"wrote {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
