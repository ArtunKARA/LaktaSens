#!/usr/bin/env python3
"""
Regression-based consistency audit for Smart Feed external data.

Outputs:
- reports/regression_consistency_audit.tex
- reports/regression_consistency_summary.csv
- reports/regression_consistency_findings.json
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import asdict, dataclass
from itertools import combinations
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score


@dataclass
class CheckRow:
    check_group: str
    item: str
    metric: str
    value: float | int | str
    threshold: str
    status: str
    note: str


def rel(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def latex_escape(value: object) -> str:
    text = "" if value is None else str(value)
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    return "".join(replacements.get(ch, ch) for ch in text)


def fmt(value: float | int | str | None, digits: int = 4) -> str:
    if value is None:
        return ""
    if isinstance(value, (int, np.integer)):
        return str(value)
    if isinstance(value, (float, np.floating)):
        if math.isnan(float(value)):
            return ""
        return f"{float(value):.{digits}f}"
    return str(value)


def read_csv_normalized(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [str(c).strip().lower() for c in df.columns]
    return df


def thi_from_celsius(temp_c: pd.Series, humidity_percent: pd.Series) -> pd.Series:
    return (1.8 * temp_c + 32.0) - (
        0.55 - 0.0055 * humidity_percent
    ) * (1.8 * temp_c - 26.0)


def thi_from_fahrenheit(temp_f: pd.Series, humidity_percent: pd.Series) -> pd.Series:
    return temp_f - (0.55 - 0.0055 * humidity_percent) * (temp_f - 58.0)


def audit_thi(root: Path, findings: list[CheckRow]) -> pd.DataFrame:
    thi_dir = root / "KDS/Smart_Feed/Data/external/mmcows_multimodal/main_data/thi"
    rows: list[dict[str, object]] = []

    for path in sorted(thi_dir.glob("*.csv")):
        df = read_csv_normalized(path)
        temp_col = next(c for c in df.columns if c.startswith("temperature_"))
        header_unit = "F" if temp_col.endswith("_f") else "C"

        work = pd.DataFrame(
            {
                "timestamp": pd.to_numeric(df["timestamp"], errors="coerce"),
                "temp": pd.to_numeric(df[temp_col], errors="coerce"),
                "humidity": pd.to_numeric(df["humidity_per"], errors="coerce"),
                "thi": pd.to_numeric(df["thi"], errors="coerce"),
            }
        ).dropna()

        pred_c = thi_from_celsius(work["temp"], work["humidity"])
        pred_f = thi_from_fahrenheit(work["temp"], work["humidity"])
        c_mae = float(mean_absolute_error(work["thi"], pred_c))
        f_mae = float(mean_absolute_error(work["thi"], pred_f))
        c_r2 = float(r2_score(work["thi"], pred_c))
        f_r2 = float(r2_score(work["thi"], pred_f))
        inferred_unit = "C" if c_mae < f_mae else "F"

        features = np.column_stack(
            [work["temp"], work["humidity"], work["temp"] * work["humidity"]]
        )
        linear = LinearRegression().fit(features, work["thi"])
        linear_r2 = float(linear.score(features, work["thi"]))

        dt = pd.to_datetime(work["timestamp"], unit="s", utc=True)
        sorted_ts = np.sort(work["timestamp"].to_numpy())
        diffs = np.diff(sorted_ts)
        gap_count = int(np.sum(diffs != 60.0))

        status = "OK"
        notes: list[str] = []
        if c_mae > 0.35 or c_r2 < 0.995:
            status = "WARNING"
            notes.append("THI formula residual is high")
        if header_unit != inferred_unit:
            status = "WARNING"
            notes.append(f"header unit {header_unit}, regression infers {inferred_unit}")
        if gap_count > 0:
            status = "WARNING"
            notes.append(f"{gap_count} timestamp gap(s)")

        rows.append(
            {
                "file": path.name,
                "rows": int(len(work)),
                "header_unit": header_unit,
                "inferred_unit": inferred_unit,
                "r2_formula_c": c_r2,
                "mae_formula_c": c_mae,
                "r2_formula_f": f_r2,
                "mae_formula_f": f_mae,
                "r2_linear_temp_humidity": linear_r2,
                "gap_count": gap_count,
                "date_min": dt.min().strftime("%Y-%m-%d %H:%M"),
                "date_max": dt.max().strftime("%Y-%m-%d %H:%M"),
                "status": status,
                "note": "; ".join(notes) if notes else "THI, temperature, humidity relation is consistent",
            }
        )

        findings.append(
            CheckRow(
                "THI",
                path.name,
                "MAE reported THI vs Celsius formula",
                c_mae,
                "<= 0.35",
                "OK" if c_mae <= 0.35 else "WARNING",
                "Checks whether THI matches temperature/humidity physics.",
            )
        )
        findings.append(
            CheckRow(
                "THI",
                path.name,
                "Header unit vs regression-inferred unit",
                f"{header_unit}->{inferred_unit}",
                "same unit",
                "OK" if header_unit == inferred_unit else "WARNING",
                "A mismatch means the header is misleading even if values are usable.",
            )
        )

    return pd.DataFrame(rows)


def audit_milk(root: Path, findings: list[CheckRow]) -> tuple[pd.DataFrame, pd.DataFrame]:
    milk_dir = root / "KDS/Smart_Feed/Data/external/mmcows_multimodal/main_data/milk"
    rows: list[dict[str, object]] = []
    series: list[pd.DataFrame] = []

    for path in sorted(milk_dir.glob("C*.csv")):
        df = read_csv_normalized(path)
        work = pd.DataFrame(
            {
                "cow": path.stem,
                "timestamp": pd.to_numeric(df["timestamp"], errors="coerce"),
                "milk_weight_kg": pd.to_numeric(df["milk_weight_kg"], errors="coerce"),
                "dim": pd.to_numeric(df["dim"], errors="coerce"),
            }
        ).dropna()
        work["record_datetime"] = pd.to_datetime(work["timestamp"], unit="s", utc=True)
        work["record_date"] = work["record_datetime"].dt.date.astype(str)
        work = work.sort_values("timestamp")
        work["day_index"] = (
            work["record_datetime"] - work["record_datetime"].min()
        ).dt.total_seconds() / 86400.0

        x = work[["day_index"]].to_numpy()
        y_dim = work["dim"].to_numpy()
        dim_model = LinearRegression().fit(x, y_dim)
        pred_dim = dim_model.predict(x)
        dim_slope = float(dim_model.coef_[0])
        dim_r2 = float(dim_model.score(x, y_dim))
        dim_max_abs_resid = float(np.max(np.abs(y_dim - pred_dim)))
        duplicate_dates = int(work["record_date"].duplicated().sum())

        y_milk = work["milk_weight_kg"].to_numpy()
        milk_model = LinearRegression().fit(work[["dim"]].to_numpy(), y_milk)
        milk_r2 = float(milk_model.score(work[["dim"]].to_numpy(), y_milk))

        status = "OK"
        notes: list[str] = []
        if abs(dim_slope - 1.0) > 0.01 or dim_r2 < 0.999 or dim_max_abs_resid > 0.05:
            status = "WARNING"
            notes.append("DIM is not a clean +1/day relation")
        if duplicate_dates:
            status = "WARNING"
            notes.append(f"{duplicate_dates} duplicate date(s)")

        rows.append(
            {
                "cow": path.stem,
                "rows": int(len(work)),
                "date_min": work["record_date"].min(),
                "date_max": work["record_date"].max(),
                "dim_min": float(work["dim"].min()),
                "dim_max": float(work["dim"].max()),
                "dim_slope_per_day": dim_slope,
                "dim_r2": dim_r2,
                "dim_max_abs_resid": dim_max_abs_resid,
                "milk_linear_r2_vs_dim": milk_r2,
                "milk_min_kg": float(work["milk_weight_kg"].min()),
                "milk_max_kg": float(work["milk_weight_kg"].max()),
                "status": status,
                "note": "; ".join(notes) if notes else "DIM timing is consistent",
            }
        )

        findings.append(
            CheckRow(
                "Milk/DIM",
                path.stem,
                "DIM regression slope per day",
                dim_slope,
                "1.00 +/- 0.01",
                "OK" if abs(dim_slope - 1.0) <= 0.01 else "WARNING",
                "DIM should increase by one for each daily milk record.",
            )
        )
        series.append(work[["cow", "record_date", "milk_weight_kg", "dim"]])

    all_series = pd.concat(series, ignore_index=True)
    pivot_milk = all_series.pivot_table(
        index="record_date", columns="cow", values="milk_weight_kg", aggfunc="mean"
    )
    pivot_dim = all_series.pivot_table(index="record_date", columns="cow", values="dim", aggfunc="mean")

    pair_rows: list[dict[str, object]] = []
    for cow_a, cow_b in combinations(pivot_milk.columns, 2):
        pair = pivot_milk[[cow_a, cow_b]].dropna()
        if len(pair) < 5:
            continue
        corr = float(pair[cow_a].corr(pair[cow_b]))
        diff = (pair[cow_a] - pair[cow_b]).abs()
        same_dim = bool((pivot_dim[[cow_a, cow_b]].dropna().diff(axis=1).iloc[:, 1].abs() < 1e-9).all())
        status = "OK"
        note = "No near-duplicate milk series signal"
        if corr >= 0.999 and float(diff.mean()) <= 0.5 and same_dim:
            status = "WARNING"
            note = "Very high correlation with same DIM; check for duplicate or mirrored cow record"
        pair_rows.append(
            {
                "cow_pair": f"{cow_a}-{cow_b}",
                "rows": int(len(pair)),
                "corr": corr,
                "mean_abs_diff_kg": float(diff.mean()),
                "max_abs_diff_kg": float(diff.max()),
                "same_dim_series": same_dim,
                "status": status,
                "note": note,
            }
        )

    return pd.DataFrame(rows), pd.DataFrame(pair_rows)


def audit_cbt(root: Path, findings: list[CheckRow]) -> pd.DataFrame:
    cbt_dir = root / "KDS/Smart_Feed/Data/external/mmcows_multimodal/main_data/cbt"
    rows: list[dict[str, object]] = []

    for path in sorted(cbt_dir.glob("C*.csv")):
        df = read_csv_normalized(path)
        work = pd.DataFrame(
            {
                "timestamp": pd.to_numeric(df["timestamp"], errors="coerce"),
                "temperature_c": pd.to_numeric(df["temperature_c"], errors="coerce"),
            }
        ).dropna()
        work["record_datetime"] = pd.to_datetime(work["timestamp"], unit="s", utc=True)
        work = work.sort_values("timestamp")
        elapsed_days = (work["timestamp"] - work["timestamp"].min()) / 86400.0
        hour = (
            work["record_datetime"].dt.hour
            + work["record_datetime"].dt.minute / 60.0
            + work["record_datetime"].dt.second / 3600.0
        )
        features = np.column_stack(
            [
                elapsed_days,
                np.sin(2 * np.pi * hour / 24.0),
                np.cos(2 * np.pi * hour / 24.0),
            ]
        )
        y = work["temperature_c"].to_numpy()
        model = LinearRegression().fit(features, y)
        pred = model.predict(features)
        resid = y - pred
        resid_std = float(np.std(resid))
        residual_outliers = int(np.sum((np.abs(resid) > max(3.5 * resid_std, 1.5))))
        physiological_outliers = int(np.sum((work["temperature_c"] < 35.0) | (work["temperature_c"] > 42.0)))

        sorted_ts = np.sort(work["timestamp"].to_numpy())
        gap_count = int(np.sum(np.diff(sorted_ts) != 60.0))

        status = "OK"
        notes: list[str] = []
        if physiological_outliers:
            status = "WARNING"
            notes.append(f"{physiological_outliers} physiological outlier(s)")
        if residual_outliers:
            status = "WARNING"
            notes.append(f"{residual_outliers} large regression residual outlier(s)")
        if gap_count:
            status = "WARNING"
            notes.append(f"{gap_count} timestamp gap(s)")

        rows.append(
            {
                "cow": path.stem,
                "rows": int(len(work)),
                "date_min": work["record_datetime"].min().strftime("%Y-%m-%d %H:%M"),
                "date_max": work["record_datetime"].max().strftime("%Y-%m-%d %H:%M"),
                "temp_min_c": float(work["temperature_c"].min()),
                "temp_max_c": float(work["temperature_c"].max()),
                "r2_time_diurnal": float(model.score(features, y)),
                "resid_std_c": resid_std,
                "physiological_outliers": physiological_outliers,
                "regression_outliers": residual_outliers,
                "gap_count": gap_count,
                "status": status,
                "note": "; ".join(notes) if notes else "Temperature range and residuals are consistent",
            }
        )
        findings.append(
            CheckRow(
                "CBT",
                path.stem,
                "Physiological temperature outliers",
                physiological_outliers,
                "0",
                "OK" if physiological_outliers == 0 else "WARNING",
                "Core body temperature should stay inside 35-42 C for this audit.",
            )
        )

    return pd.DataFrame(rows)


def audit_project_b_numeric(root: Path, findings: list[CheckRow]) -> pd.DataFrame:
    targets = [
        (
            "voeder_detail",
            root / "KDS/Smart_Feed/Data/external/voederbomen_nutritionalvalues/voederbomen_nutritionalvalues_detail_rows.csv",
            ["mn_mg_kg_dm"],
        ),
        (
            "voeder_average",
            root / "KDS/Smart_Feed/Data/external/voederbomen_nutritionalvalues/voederbomen_nutritionalvalues_average_rows.csv",
            ["mn_mg_kg_dm"],
        ),
    ]
    rows: list[dict[str, object]] = []
    for name, path, cols in targets:
        df = read_csv_normalized(path)
        for col in cols:
            values = df[col].dropna().astype(str)
            nonempty = values[values.str.strip() != ""]
            comma_values = nonempty[nonempty.str.contains(",", regex=False)]
            status = "OK" if len(comma_values) == 0 else "WARNING"
            rows.append(
                {
                    "source": name,
                    "column": col,
                    "rows": int(len(df)),
                    "non_empty": int(len(nonempty)),
                    "comma_numeric_values": int(len(comma_values)),
                    "example_values": ", ".join(comma_values.head(5).tolist()),
                    "status": status,
                    "note": "PostgreSQL numeric cast risk if this column is later converted"
                    if status == "WARNING"
                    else "No comma numeric value detected",
                }
            )
            findings.append(
                CheckRow(
                    "Project B numeric hygiene",
                    f"{name}.{col}",
                    "Comma numeric values",
                    int(len(comma_values)),
                    "0",
                    status,
                    "Values such as 1,014.0 need cleaning before numeric cast.",
                )
            )
    return pd.DataFrame(rows)


def status_counts(*frames: pd.DataFrame) -> dict[str, int]:
    counts = {"OK": 0, "WARNING": 0}
    for frame in frames:
        if frame.empty or "status" not in frame:
            continue
        for status, count in frame["status"].value_counts().items():
            counts[str(status)] = counts.get(str(status), 0) + int(count)
    return counts


def latex_table(df: pd.DataFrame, columns: list[str], headers: list[str], max_rows: int | None = None) -> str:
    if max_rows is not None:
        df = df.head(max_rows)
    colspec = "p{0.18\\linewidth}" + "r" * (len(columns) - 2) + "p{0.18\\linewidth}"
    lines = [r"\begin{longtable}{" + colspec + "}"]
    lines.append(r"\toprule")
    lines.append(" & ".join(latex_escape(h) for h in headers) + r" \\")
    lines.append(r"\midrule")
    lines.append(r"\endhead")
    for _, row in df.iterrows():
        vals = []
        for col in columns:
            value = row.get(col, "")
            if isinstance(value, (float, np.floating)):
                vals.append(latex_escape(fmt(float(value), 4)))
            else:
                vals.append(latex_escape(value))
        lines.append(" & ".join(vals) + r" \\")
    lines.append(r"\bottomrule")
    lines.append(r"\end{longtable}")
    return "\n".join(lines)


def write_latex_report(
    out_path: Path,
    root: Path,
    thi_df: pd.DataFrame,
    milk_df: pd.DataFrame,
    pair_df: pd.DataFrame,
    cbt_df: pd.DataFrame,
    numeric_df: pd.DataFrame,
) -> None:
    counts = status_counts(thi_df, milk_df, pair_df, cbt_df, numeric_df)
    warnings = counts.get("WARNING", 0)
    verdict = (
        "Kismen tutarli: ana regresyon iliskileri calisiyor, ancak duzeltilmesi gereken uyarilar var."
        if warnings
        else "Tutarli: regresyon kontrollerinde kritik uyari bulunmadi."
    )

    warning_lines: list[str] = []
    for label, frame, item_col in [
        ("THI", thi_df, "file"),
        ("Milk/DIM", milk_df, "cow"),
        ("Milk duplicate", pair_df, "cow_pair"),
        ("CBT", cbt_df, "cow"),
        ("Project B numeric", numeric_df, "source"),
    ]:
        if frame.empty or "status" not in frame:
            continue
        bad = frame[frame["status"] != "OK"]
        for _, row in bad.iterrows():
            warning_lines.append(
                rf"\item \textbf{{{latex_escape(label)}}} -- {latex_escape(row.get(item_col, ''))}: {latex_escape(row.get('note', ''))}"
            )

    tex = rf"""\documentclass[11pt]{{article}}
\usepackage[a4paper,margin=2.2cm]{{geometry}}
\usepackage[T1]{{fontenc}}
\usepackage[utf8]{{inputenc}}
\usepackage{{booktabs}}
\usepackage{{longtable}}
\usepackage{{hyperref}}
\usepackage{{array}}
\usepackage{{xcolor}}
\title{{Smart Feed Regresyon Tabanli Veri Tutarlilik Raporu}}
\author{{LaktaSens / Codex audit script}}
\date{{\today}}

\begin{{document}}
\maketitle

\section*{{Ozet Karar}}
{latex_escape(verdict)}

\begin{{itemize}}
\item Kontrol edilen kok dizin: \texttt{{{latex_escape(rel(root, root))}}}
\item THI regresyonu: bildirilen THI, sicaklik ve nemden hesaplanan THI formulu ile karsilastirildi.
\item Sut/DIM regresyonu: DIM degerinin gun basina +1 ilerleyip ilerlemedigi test edildi.
\item CBT regresyonu: vucut sicakligi zaman ve gun-ici sinyallerle modellenerek buyuk residual ve fizyolojik outlier arandi.
\item Proje B numeric hygiene: ileride numeric cast riski yaratabilecek virgullu sayilar tarandi.
\end{{itemize}}

\section*{{Uyarilar}}
"""
    if warning_lines:
        tex += "\\begin{itemize}\n" + "\n".join(warning_lines) + "\n\\end{itemize}\n"
    else:
        tex += "Kritik uyari bulunmadi.\n"

    tex += r"""
\section*{THI Regresyon Sonuclari}
"""
    tex += latex_table(
        thi_df,
        [
            "file",
            "rows",
            "header_unit",
            "inferred_unit",
            "r2_formula_c",
            "mae_formula_c",
            "r2_formula_f",
            "mae_formula_f",
            "gap_count",
            "status",
            "note",
        ],
        [
            "Dosya",
            "N",
            "Baslik",
            "Infer",
            "R2 C",
            "MAE C",
            "R2 F",
            "MAE F",
            "Gap",
            "Durum",
            "Not",
        ],
    )

    tex += r"""

\section*{Sut ve DIM Regresyon Sonuclari}
"""
    tex += latex_table(
        milk_df,
        [
            "cow",
            "rows",
            "date_min",
            "date_max",
            "dim_slope_per_day",
            "dim_r2",
            "dim_max_abs_resid",
            "milk_linear_r2_vs_dim",
            "status",
            "note",
        ],
        [
            "Inek",
            "N",
            "Baslangic",
            "Bitis",
            "DIM egim",
            "DIM R2",
            "DIM max resid",
            "Sut R2",
            "Durum",
            "Not",
        ],
    )

    suspicious_pairs = pair_df[pair_df["status"] != "OK"] if not pair_df.empty else pair_df
    tex += r"""

\section*{Sut Serisi Benzerlik Kontrolu}
"""
    if suspicious_pairs.empty:
        tex += "Yakin kopya sinyali veren inek ciftleri bulunmadi.\n"
    else:
        tex += latex_table(
            suspicious_pairs,
            [
                "cow_pair",
                "rows",
                "corr",
                "mean_abs_diff_kg",
                "max_abs_diff_kg",
                "same_dim_series",
                "status",
                "note",
            ],
            [
                "Cift",
                "N",
                "Korelasyon",
                "Ort abs fark",
                "Max abs fark",
                "Ayni DIM",
                "Durum",
                "Not",
            ],
        )

    tex += r"""

\section*{CBT Regresyon ve Outlier Kontrolu}
"""
    tex += latex_table(
        cbt_df,
        [
            "cow",
            "rows",
            "temp_min_c",
            "temp_max_c",
            "r2_time_diurnal",
            "resid_std_c",
            "physiological_outliers",
            "regression_outliers",
            "gap_count",
            "status",
            "note",
        ],
        [
            "Inek",
            "N",
            "Min C",
            "Max C",
            "R2",
            "Resid std",
            "Fiz out",
            "Reg out",
            "Gap",
            "Durum",
            "Not",
        ],
    )

    tex += r"""

\section*{Proje B Numeric Hygiene}
"""
    tex += latex_table(
        numeric_df,
        [
            "source",
            "column",
            "rows",
            "non_empty",
            "comma_numeric_values",
            "example_values",
            "status",
            "note",
        ],
        [
            "Kaynak",
            "Kolon",
            "N",
            "Dolu",
            "Virgullu",
            "Ornek",
            "Durum",
            "Not",
        ],
    )

    tex += r"""

\section*{Yontem Notlari}
\begin{itemize}
\item THI icin iki fiziksel alternatif test edildi: sicaklik degeri Celsius kabul edildi ve Fahrenheit kabul edildi. Daha dusuk MAE hangi birimi isaret ediyorsa ``inferred unit'' olarak raporlandi.
\item Sut/DIM kontrolunde regresyon denklemi DIM = a + b * gun olarak kuruldu. Beklenen egim b = 1.0'dir.
\item CBT kontrolunde sicaklik, gecen gun + gun-ici sinus/cosinus ozellikleri ile modellenmistir. Bu model biyolojik tahmin modeli degil, veri tutarliligi icin residual taramasidir.
\item Dusuk sut trend R2 degeri tek basina hata degildir; sut verimi gunluk dogal dalgalanma gosterebilir.
\end{itemize}

\end{document}
"""
    out_path.write_text(tex, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("KDS/Smart_Feed/reports"),
        help="Output directory relative to --root unless absolute.",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    out_dir = args.out_dir if args.out_dir.is_absolute() else root / args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    findings: list[CheckRow] = []
    thi_df = audit_thi(root, findings)
    milk_df, pair_df = audit_milk(root, findings)
    cbt_df = audit_cbt(root, findings)
    numeric_df = audit_project_b_numeric(root, findings)

    summary_frames = []
    for name, frame in [
        ("thi", thi_df),
        ("milk_dim", milk_df),
        ("milk_pair", pair_df),
        ("cbt", cbt_df),
        ("project_b_numeric", numeric_df),
    ]:
        if frame.empty:
            continue
        tmp = frame.copy()
        tmp.insert(0, "audit_table", name)
        summary_frames.append(tmp)
    pd.concat(summary_frames, ignore_index=True, sort=False).to_csv(
        out_dir / "regression_consistency_summary.csv", index=False
    )
    (out_dir / "regression_consistency_findings.json").write_text(
        json.dumps([asdict(row) for row in findings], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    write_latex_report(
        out_dir / "regression_consistency_audit.tex",
        root,
        thi_df,
        milk_df,
        pair_df,
        cbt_df,
        numeric_df,
    )

    counts = status_counts(thi_df, milk_df, pair_df, cbt_df, numeric_df)
    print(json.dumps(counts, indent=2))
    print(f"Wrote {out_dir / 'regression_consistency_audit.tex'}")
    print(f"Wrote {out_dir / 'regression_consistency_summary.csv'}")
    print(f"Wrote {out_dir / 'regression_consistency_findings.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
