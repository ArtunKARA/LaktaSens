from __future__ import annotations

from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TRAINING_DIR = PROJECT_ROOT / "data" / "processed" / "training"
EVENT_CULL_PATH = PROJECT_ROOT / "data" / "processed" / "event_candidates" / "event_suruden_cikarma.csv"
SNAPSHOT_PATH = TRAINING_DIR / "inek_aylik_snapshot.csv"

OUTPUT_SNAPSHOT = TRAINING_DIR / "inek_aylik_snapshot_culling_observable.csv"
OUTPUT_MODEL_READY = TRAINING_DIR / "inek_aylik_snapshot_culling_observable_model_ready.csv"
OUTPUT_SPLIT = TRAINING_DIR / "train_test_split_culling_observable.csv"
AUDIT_REPORT = PROJECT_ROOT / "reports" / "culling_label_quality_audit.md"
REVIEW_REPORT = PROJECT_ROOT / "reports" / "training_dataset_culling_observable_review.md"

HORIZONS = (30, 60, 90)
TRAIN_FRACTION = 0.8


def read_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(path)
    return pd.read_csv(path, low_memory=False)


def split_model_ready(df: pd.DataFrame) -> pd.DataFrame:
    ordered = df.sort_values(["referans_tarih", "canonical_animal_id", "snapshot_id"]).copy()
    cutoff = int(len(ordered) * TRAIN_FRACTION)
    ordered["split"] = "test"
    ordered.iloc[:cutoff, ordered.columns.get_loc("split")] = "train"
    return ordered.sort_index()


def write_audit_report(
    snapshot: pd.DataFrame,
    cull_events: pd.DataFrame,
    observable_sources: set[str],
    corrected_snapshot: pd.DataFrame,
    model_ready: pd.DataFrame,
) -> None:
    AUDIT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Culling Label Quality Audit",
        "",
        "## Question",
        "",
        "Could weak source-holdout learning be caused by not training enough?",
        "",
        "Short answer: not primarily. The stronger issue is label observability. Some sources have no observed culling events, so treating their post-horizon rows as confirmed negatives creates a source shortcut.",
        "",
        "## Culling Event Observability",
        "",
        "| Source | Snapshot rows | Culling event rows | Observable for culling labels | 90d positives before correction |",
        "|---|---:|---:|---|---:|",
    ]
    event_counts = cull_events.groupby("source_code").size().to_dict() if not cull_events.empty else {}
    for source_code, group in snapshot.groupby("source_code"):
        lines.append(
            f"| `{source_code}` | {len(group)} | {int(event_counts.get(source_code, 0))} | "
            f"{'yes' if source_code in observable_sources else 'no'} | {int(pd.to_numeric(group['cull_within_90d'], errors='coerce').fillna(0).sum())} |"
        )

    corrected_unknown = corrected_snapshot["culling_label_status"].eq("unknown_source_without_culling_events").sum()
    lines.extend(
        [
            "",
            "## Correction",
            "",
            f"- Sources with at least one `event_suruden_cikarma` row are treated as culling-observable: `{', '.join(sorted(observable_sources))}`.",
            f"- Rows from sources without culling events are kept in the full corrected snapshot but their culling labels are set to unknown: `{corrected_unknown}` rows.",
            f"- Corrected model-ready rows: `{len(model_ready)}`.",
            "",
            "This is conservative. It avoids converting missing culling capture into false negative labels.",
        ]
    )
    AUDIT_REPORT.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_review_report(model_ready: pd.DataFrame) -> None:
    lines = [
        "# Culling-Observable Training Dataset Review",
        "",
        f"- Model-ready rows: `{len(model_ready)}`",
        f"- Date range: `{model_ready['referans_tarih'].min()}` - `{model_ready['referans_tarih'].max()}`",
        "",
        "## Label Distribution",
        "",
        "| Label | 0 | 1 |",
        "|---|---:|---:|",
    ]
    for horizon in HORIZONS:
        col = f"cull_within_{horizon}d"
        counts = pd.to_numeric(model_ready[col], errors="coerce").value_counts(dropna=False).to_dict()
        lines.append(f"| `{col}` | {int(counts.get(0, 0))} | {int(counts.get(1, 0))} |")

    lines.extend(["", "## Source Distribution", "", "| Source | Rows | 90d positives |", "|---|---:|---:|"])
    for source_code, group in model_ready.groupby("source_code"):
        positives = int(pd.to_numeric(group["cull_within_90d"], errors="coerce").fillna(0).sum())
        lines.append(f"| `{source_code}` | {len(group)} | {positives} |")

    lines.extend(["", "## Split Distribution", "", "| Split | Rows | 90d positives |", "|---|---:|---:|"])
    for split, group in model_ready.groupby("split"):
        positives = int(pd.to_numeric(group["cull_within_90d"], errors="coerce").fillna(0).sum())
        lines.append(f"| `{split}` | {len(group)} | {positives} |")

    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- This dataset excludes source-level unlabeled negatives from supervised culling-risk training.",
            "- It does not solve cross-source generalization by itself; it removes the most obvious false-negative label shortcut.",
        ]
    )
    REVIEW_REPORT.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    snapshot = read_csv(SNAPSHOT_PATH)
    cull_events = pd.read_csv(EVENT_CULL_PATH, low_memory=False) if EVENT_CULL_PATH.exists() else pd.DataFrame()
    observable_sources = set(cull_events["source_code"].dropna().astype(str).unique()) if not cull_events.empty else set()
    if not observable_sources:
        raise RuntimeError("No culling-observable sources found.")

    corrected = snapshot.copy()
    corrected["culling_observable_source"] = corrected["source_code"].astype(str).isin(observable_sources).astype(int)
    corrected["culling_label_status"] = "observable"
    unobservable_mask = corrected["culling_observable_source"].eq(0)
    corrected.loc[unobservable_mask, "culling_label_status"] = "unknown_source_without_culling_events"
    for horizon in HORIZONS:
        for col in (f"cull_{horizon}g", f"cull_within_{horizon}d", f"label_{horizon}d_observed"):
            if col in corrected.columns:
                corrected.loc[unobservable_mask, col] = pd.NA

    label_cols = [f"cull_within_{horizon}d" for horizon in HORIZONS]
    observed_cols = [f"label_{horizon}d_observed" for horizon in HORIZONS]
    model_ready_mask = corrected["culling_observable_source"].eq(1)
    for col in label_cols + observed_cols:
        model_ready_mask &= pd.to_numeric(corrected[col], errors="coerce").isin([0, 1])
    for col in observed_cols:
        model_ready_mask &= pd.to_numeric(corrected[col], errors="coerce").eq(1)
    model_ready = corrected.loc[model_ready_mask].copy()
    model_ready = split_model_ready(model_ready)

    OUTPUT_SNAPSHOT.parent.mkdir(parents=True, exist_ok=True)
    corrected.to_csv(OUTPUT_SNAPSHOT, index=False)
    model_ready.to_csv(OUTPUT_MODEL_READY, index=False)
    model_ready[["snapshot_id", "source_code", "canonical_animal_id", "referans_tarih", "split"]].to_csv(OUTPUT_SPLIT, index=False)

    write_audit_report(snapshot, cull_events, observable_sources, corrected, model_ready)
    write_review_report(model_ready)

    print(f"wrote {OUTPUT_SNAPSHOT.relative_to(PROJECT_ROOT)} ({len(corrected)} rows)")
    print(f"wrote {OUTPUT_MODEL_READY.relative_to(PROJECT_ROOT)} ({len(model_ready)} rows)")
    print(f"wrote {OUTPUT_SPLIT.relative_to(PROJECT_ROOT)}")
    print(f"wrote {AUDIT_REPORT.relative_to(PROJECT_ROOT)}")
    print(f"wrote {REVIEW_REPORT.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
