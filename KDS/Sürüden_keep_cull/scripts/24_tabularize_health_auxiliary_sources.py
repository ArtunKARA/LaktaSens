from __future__ import annotations

import csv
import io
import shutil
import subprocess
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
EXTERNAL_DIR = PROJECT_ROOT / "data" / "external"
OUTPUT_DIR = PROJECT_ROOT / "data" / "processed" / "tabular_health_sources"
REPORT_PATH = PROJECT_ROOT / "reports" / "health_auxiliary_tabularization_report.md"
INDEX_CSV = OUTPUT_DIR / "health_auxiliary_file_index.csv"

SCC_ZIP = EXTERNAL_DIR / "scc_grazing_cows" / "SCC grazing cows.zip"
SCC_RAR_MEMBER = "d8kgk57b9h-3/data_SCC.rar"
ORGANIC_ZIP = EXTERNAL_DIR / "organic_scm" / "organic SCM.zip"
ORGANIC_DOCX_MEMBER = "Supplemental material.docx"
CHIOZZA_ZIP = EXTERNAL_DIR / "chiozza_lameness" / "Chiozza.zip"
CHIOZZA_MEMBER = "ChiozzaLogroñoJ_SupplementaryData.xlsx"


def count_csv_rows(path: Path) -> int:
    with path.open("r", encoding="utf-8", errors="replace", newline="") as file:
        return max(sum(1 for _ in file) - 1, 0)


def csv_columns(path: Path) -> list[str]:
    with path.open("r", encoding="utf-8", errors="replace", newline="") as file:
        reader = csv.reader(file)
        return next(reader, [])


def extract_scc_rar(force: bool = False) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    source_dir = OUTPUT_DIR / "scc_grazing_cows"
    source_dir.mkdir(parents=True, exist_ok=True)
    if not SCC_ZIP.exists():
        records.append({"source_code": "scc_grazing_cows", "status": "missing_zip", "notes": str(SCC_ZIP)})
        return records
    unrar = shutil.which("unrar")
    if unrar is None:
        records.append(
            {
                "source_code": "scc_grazing_cows",
                "status": "manual_tool_required",
                "notes": "unrar command is not available; install unrar-free/unar/7zip.",
            }
        )
        return records

    rar_path = source_dir / "data_SCC.rar"
    with zipfile.ZipFile(SCC_ZIP) as zip_file:
        rar_path.write_bytes(zip_file.read(SCC_RAR_MEMBER))
    expected = ["milk_yield.csv", "conception.csv", "insemination_rate.csv"]
    if force:
        for name in expected:
            target = source_dir / name
            if target.exists():
                target.unlink()
    missing = [name for name in expected if not (source_dir / name).exists()]
    if missing:
        subprocess.run([unrar, "x", "-o+", str(rar_path), str(source_dir)], check=True, capture_output=True, text=True)

    for name in expected:
        path = source_dir / name
        if not path.exists():
            records.append({"source_code": "scc_grazing_cows", "file_name": name, "status": "extract_failed"})
            continue
        records.append(
            {
                "source_code": "scc_grazing_cows",
                "file_name": str(path.relative_to(PROJECT_ROOT)),
                "status": "tabularized",
                "format": "csv",
                "rows": count_csv_rows(path),
                "columns": "|".join(csv_columns(path)),
                "notes": "Extracted from RAR inside SCC grazing cows ZIP.",
            }
        )
    return records


def parse_docx_tables(docx_bytes: bytes) -> list[list[list[str]]]:
    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as docx:
        xml = docx.read("word/document.xml")
    root = ET.fromstring(xml)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    tables: list[list[list[str]]] = []
    for tbl in root.findall(".//w:tbl", ns):
        rows: list[list[str]] = []
        for tr in tbl.findall("./w:tr", ns):
            cells: list[str] = []
            for tc in tr.findall("./w:tc", ns):
                texts = [node.text or "" for node in tc.findall(".//w:t", ns)]
                cells.append("".join(texts).strip())
            if cells:
                rows.append(cells)
        if rows:
            tables.append(rows)
    return tables


def tabularize_organic_docx() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    source_dir = OUTPUT_DIR / "organic_scm"
    source_dir.mkdir(parents=True, exist_ok=True)
    if not ORGANIC_ZIP.exists():
        return [{"source_code": "organic_scm", "status": "missing_zip", "notes": str(ORGANIC_ZIP)}]
    with zipfile.ZipFile(ORGANIC_ZIP) as zip_file:
        tables = parse_docx_tables(zip_file.read(ORGANIC_DOCX_MEMBER))
    if not tables:
        return [{"source_code": "organic_scm", "status": "no_tables_detected"}]

    for idx, table in enumerate(tables, start=1):
        max_cols = max(len(row) for row in table)
        normalized = [row + [""] * (max_cols - len(row)) for row in table]
        header = normalized[0]
        if not any(header):
            header = [f"column_{col_idx}" for col_idx in range(max_cols)]
        else:
            header = [text or f"column_{col_idx}" for col_idx, text in enumerate(header)]
        df = pd.DataFrame(normalized[1:], columns=header)
        path = source_dir / f"organic_scm_table_{idx}.csv"
        df.to_csv(path, index=False)
        records.append(
            {
                "source_code": "organic_scm",
                "file_name": str(path.relative_to(PROJECT_ROOT)),
                "status": "tabularized",
                "format": "csv",
                "rows": len(df),
                "columns": "|".join(df.columns.astype(str)),
                "notes": "Extracted from DOCX table. Aggregate farm-level supplemental table, not animal-level model input.",
            }
        )
    return records


def tabularize_chiozza() -> list[dict[str, Any]]:
    source_dir = OUTPUT_DIR / "chiozza_lameness"
    source_dir.mkdir(parents=True, exist_ok=True)
    if not CHIOZZA_ZIP.exists():
        return [{"source_code": "chiozza_lameness", "status": "missing_zip", "notes": str(CHIOZZA_ZIP)}]
    with zipfile.ZipFile(CHIOZZA_ZIP) as zip_file:
        with zip_file.open(CHIOZZA_MEMBER) as workbook:
            df = pd.read_excel(workbook, sheet_name="Hoja1")

    raw_path = source_dir / "chiozza_lameness_raw_hoja1.csv"
    df.to_csv(raw_path, index=False)
    normalized = pd.DataFrame(
        {
            "source_code": "chiozza_lameness",
            "external_animal_id": df["ID_ECLO_TAMBO_VACA"],
            "calving_date": pd.to_datetime(df["FECHA"], errors="coerce").dt.date.astype("string"),
            "lameness_date": pd.to_datetime(df["fecha_renguera"], errors="coerce").dt.date.astype("string"),
            "lameness_event": df["evento"].astype(str),
            "lameness_flag": pd.to_numeric(df["renguera"], errors="coerce").fillna(0).astype(int),
            "parity": pd.to_numeric(df["lactancia"], errors="coerce"),
            "milk_150d": pd.to_numeric(df["leche_150d"], errors="coerce"),
            "milk_305d": pd.to_numeric(df["leche_305d"], errors="coerce"),
            "milk_total": pd.to_numeric(df["leche_total"], errors="coerce"),
            "services": pd.to_numeric(df["servicios"], errors="coerce"),
            "pregnant_flag": pd.to_numeric(df["preniada"], errors="coerce"),
            "dryoff_date": pd.to_datetime(df["secado"], errors="coerce").dt.date.astype("string"),
        }
    )
    norm_path = source_dir / "chiozza_lameness_normalized.csv"
    normalized.to_csv(norm_path, index=False)
    return [
        {
            "source_code": "chiozza_lameness",
            "file_name": str(raw_path.relative_to(PROJECT_ROOT)),
            "status": "tabularized",
            "format": "csv",
            "rows": len(df),
            "columns": "|".join(df.columns.astype(str)),
            "notes": "Raw Hoja1 converted from XLSX.",
        },
        {
            "source_code": "chiozza_lameness",
            "file_name": str(norm_path.relative_to(PROJECT_ROOT)),
            "status": "tabularized",
            "format": "csv",
            "rows": len(normalized),
            "columns": "|".join(normalized.columns.astype(str)),
            "notes": "Normalized lameness/milk/reproduction summary. No culling labels available.",
        },
    ]


def write_report(records: list[dict[str, Any]]) -> None:
    lines = [
        "# Health Auxiliary Tabularization Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Scope: SCC grazing cows RAR, organic SCM DOCX, Chiozza lameness XLSX.",
        "",
        "## Outputs",
        "",
        "| Source | Status | Rows | File | Notes |",
        "|---|---|---:|---|---|",
    ]
    for row in records:
        lines.append(
            f"| `{row.get('source_code', '')}` | `{row.get('status', '')}` | {int(row.get('rows', 0) or 0)} | "
            f"`{row.get('file_name', '')}` | {str(row.get('notes', '')).replace('|', '/')} |"
        )
    lines.extend(
        [
            "",
            "## Modeling Decision",
            "",
            "- SCC and Chiozza are useful health/SCC/lameness auxiliary sources, but they do not provide observed culling labels in the current pipeline.",
            "- Organic SCM supplemental DOCX exposes aggregate farm-level descriptive statistics; it is not animal-level training data.",
            "- These files are tabularized for schema review, feature design and future raw/event integration. They are not converted into negative culling labels.",
        ]
    )
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, Any]] = []
    records.extend(extract_scc_rar())
    records.extend(tabularize_organic_docx())
    records.extend(tabularize_chiozza())
    pd.DataFrame(records).to_csv(INDEX_CSV, index=False)
    write_report(records)
    print(f"wrote {INDEX_CSV.relative_to(PROJECT_ROOT)}")
    print(f"wrote {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
