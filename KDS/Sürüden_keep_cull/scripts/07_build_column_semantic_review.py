from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Any

import yaml


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = PROJECT_ROOT / "config" / "canonical_event_rules.yaml"
MAPPING_PATH = PROJECT_ROOT / "reports" / "column_mapping_template.csv"
SEMANTIC_REPORT_PATH = PROJECT_ROOT / "reports" / "column_semantic_review.md"
RAW_LOAD_PLAN_PATH = PROJECT_ROOT / "reports" / "raw_load_plan.md"


def normalize_key(value: str) -> str:
    return re.sub(r"\s+", " ", str(value).strip()).lower()


def escape_md(value: Any) -> str:
    text = "" if value is None else str(value)
    return text.replace("|", "\\|").replace("\n", "<br>")


def load_yaml(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file) or {}


def load_mapping_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as file:
        return list(csv.DictReader(file))


def build_rule_index(rules: dict) -> dict[tuple[str, str, str], dict]:
    index: dict[tuple[str, str, str], dict] = {}
    for source_code, source_config in (rules.get("sources") or {}).items():
        for sheet_name, sheet_config in (source_config.get("sheets") or {}).items():
            for column_name, column_rule in (sheet_config.get("columns") or {}).items():
                index[(source_code, normalize_key(sheet_name), normalize_key(column_name))] = column_rule or {}
    return index


def lookup_rule(
    rule_index: dict[tuple[str, str, str], dict],
    source_code: str,
    sheet_name: str,
    column_name: str,
) -> dict | None:
    exact = rule_index.get((source_code, normalize_key(sheet_name), normalize_key(column_name)))
    if exact is not None:
        return exact
    candidates = [
        rule
        for (rule_source, _rule_sheet, rule_column), rule in rule_index.items()
        if rule_source == source_code and rule_column == normalize_key(column_name)
    ]
    return candidates[0] if len(candidates) == 1 else None


def source_manual_reason(rules: dict, source_code: str) -> str:
    for item in rules.get("manual_inspection_sources") or []:
        if item.get("source_code") == source_code:
            return str(item.get("reason") or "TODO / manual inspection required.")
    return ""


def semantic_decision(row: dict[str, str], rule: dict | None, manual_reason: str) -> tuple[str, str, str, str]:
    if manual_reason:
        return "manual_inspection_required", "", "0.00", manual_reason
    if rule is not None:
        target = f"{rule.get('target_table', '')}.{rule.get('target_column', '')}".strip(".")
        confidence = f"{float(rule.get('confidence', 0.0)):.2f}"
        notes = str(rule.get("notes") or "")
        semantic = str(rule.get("semantic") or "source-specific rule")
        return semantic, target, confidence, notes
    target = f"{row.get('suggested_target_table', '')}.{row.get('suggested_target_column', '')}".strip(".")
    return (
        "heuristic_or_todo",
        target,
        row.get("confidence", "0.00"),
        row.get("notes", "TODO / manual inspection required."),
    )


def write_semantic_report(rules: dict, mapping_rows: list[dict[str, str]]) -> None:
    rule_index = build_rule_index(rules)
    lines: list[str] = [
        "# Column Semantic Review",
        "",
        "Bu rapor `file_inspection_report.md`, `column_mapping_template.csv` ve "
        "`canonical_event_rules.yaml` kararlarını birleştirir. Kaynak-bazlı kural "
        "olmayan satırlar heuristic/TODO olarak kalır.",
        "",
        "| Source | File | Sheet | Column | Detected type | Semantic decision | Target | Confidence | Notes |",
        "|---|---|---|---|---|---|---|---|---|",
    ]

    for row in mapping_rows:
        source_code = row.get("source_code", "")
        sheet_name = row.get("sheet_name", "")
        column_name = row.get("source_column", "")
        manual_reason = source_manual_reason(rules, source_code)
        rule = lookup_rule(rule_index, source_code, sheet_name, column_name)
        semantic, target, confidence, notes = semantic_decision(row, rule, manual_reason)
        lines.append(
            "| "
            + " | ".join(
                [
                    escape_md(source_code),
                    escape_md(row.get("file_name", "")),
                    escape_md(sheet_name),
                    escape_md(column_name),
                    escape_md(row.get("detected_type", "")),
                    escape_md(semantic),
                    escape_md(target),
                    escape_md(confidence),
                    escape_md(notes),
                ]
                )
            + " |"
        )

    lines.extend(
        [
            "",
            "## Manual Inspection Required",
            "",
            "| Source | Reason |",
            "|---|---|",
        ]
    )
    for item in rules.get("manual_inspection_sources") or []:
        lines.append(f"| {escape_md(item.get('source_code', ''))} | {escape_md(item.get('reason', ''))} |")

    SEMANTIC_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    SEMANTIC_REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_raw_load_plan(rules: dict) -> None:
    lines: list[str] = [
        "# Raw Load Plan",
        "",
        "Bu plan Faz 2.1 dry-run kararlarını gösterir. DB yükleyici aynı aday "
        "CSV'leri kullanır; `.env` yoksa yalnızca dosya üretimi geçerlidir.",
        "",
        "## Source/Sheet Plan",
        "",
        "| Source | Sheet | Row action | Raw tables | Event outputs | Required columns | Skip/reject rule |",
        "|---|---|---|---|---|---|---|",
    ]

    for source_code, source_config in (rules.get("sources") or {}).items():
        for sheet_name, sheet_config in (source_config.get("sheets") or {}).items():
            lines.append(
                "| "
                + " | ".join(
                    [
                        escape_md(source_code),
                        escape_md(sheet_name),
                        escape_md(sheet_config.get("row_action", "")),
                        escape_md(", ".join(sheet_config.get("raw_tables") or [])),
                        escape_md(", ".join(sheet_config.get("event_outputs") or [])),
                        escape_md(", ".join(sheet_config.get("required_columns") or [])),
                        escape_md(sheet_config.get("skip_reason", "")),
                    ]
                )
                + " |"
            )

    lines.extend(
        [
            "",
            "## Manual Inspection Sources",
            "",
            "| Source | Reason |",
            "|---|---|",
        ]
    )
    for item in rules.get("manual_inspection_sources") or []:
        lines.append(f"| {escape_md(item.get('source_code', ''))} | {escape_md(item.get('reason', ''))} |")

    lines.extend(
        [
            "",
            "## Reject Rules",
            "",
            "- Required animal ID missing: row is rejected.",
            "- Required event date missing: target event/raw row is rejected.",
            "- Required numeric value missing for milk measurement: row is rejected.",
            "- Unsupported archive/document/PDF schemas remain TODO/manual inspection required.",
            "- Economic sources do not create animal-level raw/event rows in this phase.",
        ]
    )

    RAW_LOAD_PLAN_PATH.parent.mkdir(parents=True, exist_ok=True)
    RAW_LOAD_PLAN_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    rules = load_yaml(RULES_PATH)
    mapping_rows = load_mapping_rows(MAPPING_PATH)
    write_semantic_report(rules, mapping_rows)
    write_raw_load_plan(rules)
    print(f"wrote {SEMANTIC_REPORT_PATH.relative_to(PROJECT_ROOT)} ({len(mapping_rows)} mapping rows)")
    print(f"wrote {RAW_LOAD_PLAN_PATH.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
