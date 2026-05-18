from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = PROJECT_ROOT / "data" / "processed" / "models" / "payload_enriched"
PRE_DIR = MODEL_DIR / "pre_health_auxiliary"
TRAINING_DIR = PROJECT_ROOT / "data" / "processed" / "training"
TABULAR_DIR = PROJECT_ROOT / "data" / "processed" / "tabular_health_sources"

REPORT_PATH = PROJECT_ROOT / "reports" / "phase_4_5_health_auxiliary_improvement_summary.md"


def read_csv(path: Path) -> pd.DataFrame:
    return pd.read_csv(path, low_memory=False) if path.exists() else pd.DataFrame()


def best_primary(path: Path) -> dict[str, Any] | None:
    df = read_csv(path)
    if df.empty:
        return None
    if "horizon_label" in df:
        df = df[df["horizon_label"].eq("cull_within_90d")].copy()
    elif "target" in df:
        df = df[df["target"].eq("cull_within_90d")].copy()
    if df.empty or "pr_auc" not in df:
        return None
    return df.sort_values("pr_auc", ascending=False).iloc[0].to_dict()


def best_strict(path: Path) -> pd.DataFrame:
    df = read_csv(path)
    if df.empty:
        return pd.DataFrame()
    rows = []
    for policy, group in df.groupby("validation_policy"):
        rows.append(group.sort_values("pr_auc", ascending=False).iloc[0].to_dict())
    return pd.DataFrame(rows)


def best_survival(path: Path) -> dict[str, Any] | None:
    df = read_csv(path)
    if df.empty or "hazard_pr_auc" not in df:
        return None
    return df.sort_values("hazard_pr_auc", ascending=False).iloc[0].to_dict()


def reason_metrics(path: Path) -> pd.DataFrame:
    df = read_csv(path)
    if df.empty:
        return pd.DataFrame()
    return df.sort_values("reason_group").copy()


def fmt(value: Any, digits: int = 4) -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return "-"
    if np.isnan(number):
        return "-"
    return f"{number:.{digits}f}"


def delta(current: Any, previous: Any, digits: int = 4) -> str:
    try:
        diff = float(current) - float(previous)
    except (TypeError, ValueError):
        return "-"
    if np.isnan(diff):
        return "-"
    return f"{diff:+.{digits}f}"


def write_report() -> None:
    pre_primary = best_primary(PRE_DIR / "baseline_model_metrics.csv")
    cur_primary = best_primary(MODEL_DIR / "baseline_model_metrics.csv")
    pre_strict = best_strict(PRE_DIR / "strict_validation_metrics.csv")
    cur_strict = best_strict(MODEL_DIR / "strict_validation_metrics.csv")
    pre_survival = best_survival(PRE_DIR / "survival_discrete_hazard_metrics.csv")
    cur_survival = best_survival(MODEL_DIR / "survival_discrete_hazard_metrics.csv")
    pre_reason = reason_metrics(PRE_DIR / "reason_specific_audit_metrics.csv")
    cur_reason = reason_metrics(MODEL_DIR / "reason_specific_audit_metrics.csv")
    coverage = read_csv(TRAINING_DIR / "health_auxiliary_feature_coverage.csv")
    index_df = read_csv(TABULAR_DIR / "health_auxiliary_file_index.csv")

    lines = [
        "# Phase 4.5 Health Auxiliary Tabularization and Model Impact",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Scope: SCC RAR, organic SCM DOCX and Chiozza lameness XLSX tabularization; leakage-safe health feature enrichment; metric comparison against `pre_health_auxiliary` archive.",
        "",
        "## Decision Summary",
        "",
        "- Tabularization succeeded and should stay in the pipeline.",
        "- SCC and Chiozza remain auxiliary because current files do not provide culling-observable labels aligned to the training set.",
        "- Organic SCM is aggregate supplemental data, not animal-level training data.",
        "- Health features improved several no-source/strict validation views, but the source-including primary baseline fell. For MDP readiness, use these features as candidate/ablation inputs, not as a guaranteed replacement for the previous best risk model.",
        "",
        "## Tabularized Health Files",
        "",
        "| Source | Status | Rows | File |",
        "|---|---|---:|---|",
    ]
    if index_df.empty:
        lines.append("| - | - | - | - |")
    else:
        for row in index_df.to_dict("records"):
            lines.append(
                f"| `{row.get('source_code', '')}` | `{row.get('status', '')}` | {int(row.get('rows', 0) or 0)} | `{row.get('file_name', '')}` |"
            )

    lines.extend(["", "## Primary Time Split 90d", "", "| Metric | Previous | Current | Delta |", "|---|---:|---:|---:|"])
    if pre_primary and cur_primary:
        lines.extend(
            [
                f"| Best model | `{pre_primary.get('model_name')}` | `{cur_primary.get('model_name')}` | - |",
                f"| PR-AUC | {fmt(pre_primary.get('pr_auc'), 6)} | {fmt(cur_primary.get('pr_auc'), 6)} | {delta(cur_primary.get('pr_auc'), pre_primary.get('pr_auc'), 6)} |",
                f"| ROC-AUC | {fmt(pre_primary.get('roc_auc'), 6)} | {fmt(cur_primary.get('roc_auc'), 6)} | {delta(cur_primary.get('roc_auc'), pre_primary.get('roc_auc'), 6)} |",
                f"| Recall | {fmt(pre_primary.get('recall'), 6)} | {fmt(cur_primary.get('recall'), 6)} | {delta(cur_primary.get('recall'), pre_primary.get('recall'), 6)} |",
                f"| Precision | {fmt(pre_primary.get('precision'), 6)} | {fmt(cur_primary.get('precision'), 6)} | {delta(cur_primary.get('precision'), pre_primary.get('precision'), 6)} |",
            ]
        )
    else:
        lines.append("| PR-AUC | - | - | - |")

    lines.extend(["", "## Strict Validation Best By Policy", "", "| Policy | Previous model | Previous PR-AUC | Current model | Current PR-AUC | Delta |", "|---|---|---:|---|---:|---:|"])
    if not cur_strict.empty:
        pre_by_policy = {row["validation_policy"]: row for row in pre_strict.to_dict("records")} if not pre_strict.empty else {}
        for row in cur_strict.sort_values("validation_policy").to_dict("records"):
            prev = pre_by_policy.get(row["validation_policy"])
            lines.append(
                f"| `{row['validation_policy']}` | `{prev.get('model_name') if prev else '-'}` | {fmt(prev.get('pr_auc') if prev else np.nan)} | "
                f"`{row.get('model_name')}` | {fmt(row.get('pr_auc'))} | {delta(row.get('pr_auc'), prev.get('pr_auc') if prev else np.nan)} |"
            )
    else:
        lines.append("| - | - | - | - | - | - |")

    lines.extend(["", "## Survival-Style Hazard", "", "| Metric | Previous | Current | Delta |", "|---|---:|---:|---:|"])
    if pre_survival and cur_survival:
        lines.extend(
            [
                f"| Best model | `{pre_survival.get('model_name')}` | `{cur_survival.get('model_name')}` | - |",
                f"| Hazard PR-AUC | {fmt(pre_survival.get('hazard_pr_auc'), 6)} | {fmt(cur_survival.get('hazard_pr_auc'), 6)} | {delta(cur_survival.get('hazard_pr_auc'), pre_survival.get('hazard_pr_auc'), 6)} |",
                f"| C-index | {fmt(pre_survival.get('concordance_index'), 6)} | {fmt(cur_survival.get('concordance_index'), 6)} | {delta(cur_survival.get('concordance_index'), pre_survival.get('concordance_index'), 6)} |",
            ]
        )
    else:
        lines.append("| Hazard PR-AUC | - | - | - |")

    lines.extend(["", "## Reason-Specific 90d Audit", "", "| Reason | Previous PR-AUC | Current PR-AUC | Delta | Previous recall | Current recall | Delta |", "|---|---:|---:|---:|---:|---:|---:|"])
    if not cur_reason.empty:
        pre_by_reason = {row["reason_group"]: row for row in pre_reason.to_dict("records")} if not pre_reason.empty else {}
        for row in cur_reason.to_dict("records"):
            prev = pre_by_reason.get(row["reason_group"])
            lines.append(
                f"| `{row['reason_group']}` | {fmt(prev.get('pr_auc_one_vs_rest') if prev else np.nan)} | {fmt(row.get('pr_auc_one_vs_rest'))} | "
                f"{delta(row.get('pr_auc_one_vs_rest'), prev.get('pr_auc_one_vs_rest') if prev else np.nan)} | "
                f"{fmt(prev.get('recall_at_model_threshold') if prev else np.nan)} | {fmt(row.get('recall_at_model_threshold'))} | "
                f"{delta(row.get('recall_at_model_threshold'), prev.get('recall_at_model_threshold') if prev else np.nan)} |"
            )
    else:
        lines.append("| - | - | - | - | - | - | - |")

    lines.extend(["", "## Added Feature Coverage", "", "| Feature | Non-null rows | Coverage | Non-zero rows |", "|---|---:|---:|---:|"])
    if coverage.empty:
        lines.append("| - | - | - | - |")
    else:
        for row in coverage.to_dict("records"):
            lines.append(
                f"| `{row['feature']}` | {int(row['non_null_rows'])} | {float(row['coverage_rate']):.4f} | {int(row['non_zero_rows'])} |"
            )

    lines.extend(
        [
            "",
            "## Recommendation",
            "",
            "- Keep `scripts/24_tabularize_health_auxiliary_sources.py` as the health-source normalization entry point.",
            "- Keep `scripts/25_engineer_health_auxiliary_features.py` as an ablation feature layer.",
            "- Do not claim SCC/organic/Chiozza improve culling prediction until animal-level culling labels or reliable ID overlap are available.",
            "- For MDP smoke-test, prefer the best strict/no-source model view over a source-including score when source transfer is the concern.",
        ]
    )

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    write_report()
    print(f"wrote {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
