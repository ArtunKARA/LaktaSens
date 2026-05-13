from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
EVENT_DIR = PROCESSED_DIR / "event_candidates"
TRAINING_DIR = PROCESSED_DIR / "training"

MAP_PATH = PROCESSED_DIR / "map_external_inek_candidates.csv"
EVENT_NORMALIZED_PATH = PROCESSED_DIR / "event_normalized_candidates.csv"
EVENT_DOGURMA_PATH = EVENT_DIR / "event_dogurma.csv"
EVENT_DOLLENME_PATH = EVENT_DIR / "event_dollenme.csv"
EVENT_SUT_PATH = EVENT_DIR / "event_sut_olcum.csv"
EVENT_HEALTH_PATH = EVENT_DIR / "event_health.csv"
EVENT_CULL_PATH = EVENT_DIR / "event_suruden_cikarma.csv"

SNAPSHOT_PATH = TRAINING_DIR / "inek_aylik_snapshot.csv"
MODEL_READY_PATH = TRAINING_DIR / "inek_aylik_snapshot_model_ready.csv"
SPLIT_PATH = TRAINING_DIR / "train_test_split.csv"
FEATURE_REPORT_PATH = PROJECT_ROOT / "reports" / "training_feature_list.md"
REVIEW_REPORT_PATH = PROJECT_ROOT / "reports" / "training_dataset_review.md"

HORIZONS = (30, 60, 90)
TRAIN_FRACTION = 0.8

SNAPSHOT_FIELDS = [
    "snapshot_id",
    "source_code",
    "external_animal_id",
    "canonical_animal_id",
    "referans_tarih",
    "observation_start",
    "observation_end",
    "first_cull_date",
    "laktasyon_no",
    "parite",
    "dim",
    "yas_gun",
    "gebe_mi",
    "servis_sayisi",
    "son_servis_gun",
    "gebelik_kaybi_flag",
    "son30_saglik_olay_sayisi",
    "mastitis_flag",
    "lameness_flag",
    "son30_ortalama_sut",
    "sut_trend_7g",
    "cull_30g",
    "cull_60g",
    "cull_90g",
    "cull_within_30d",
    "cull_within_60d",
    "cull_within_90d",
    "label_30d_observed",
    "label_60d_observed",
    "label_90d_observed",
]

SPLIT_FIELDS = [
    "snapshot_id",
    "source_code",
    "canonical_animal_id",
    "referans_tarih",
    "split",
]


@dataclass
class CalvingEvent:
    event_date: date
    parite: int | None = None
    laktasyon_no: int | None = None


@dataclass
class MilkEvent:
    event_date: date
    milk_kg: float


@dataclass
class HealthEvent:
    event_date: date
    olay_tipi: str = ""
    alt_tip: str = ""
    aciklama: str = ""


@dataclass
class AnimalEvents:
    source_code: str = ""
    external_animal_id: str = ""
    canonical_animal_id: str = ""
    all_dates: list[date] = field(default_factory=list)
    calvings: list[CalvingEvent] = field(default_factory=list)
    services: list[date] = field(default_factory=list)
    milk: list[MilkEvent] = field(default_factory=list)
    health: list[HealthEvent] = field(default_factory=list)
    culls: list[date] = field(default_factory=list)
    pregnancy_positive: list[date] = field(default_factory=list)
    pregnancy_loss: list[date] = field(default_factory=list)
    birth_dates_for_age: list[date] = field(default_factory=list)


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as file:
        return list(csv.DictReader(file))


def parse_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text).date()
    except ValueError:
        return None


def parse_int(value: Any) -> int | None:
    if value is None or str(value).strip() == "":
        return None
    try:
        return int(float(str(value).strip()))
    except ValueError:
        return None


def parse_float(value: Any) -> float | None:
    if value is None or str(value).strip() == "":
        return None
    try:
        return float(str(value).strip())
    except ValueError:
        return None


def bool_text(value: bool | None) -> str:
    if value is None:
        return ""
    return "1" if value else "0"


def value_text(value: Any, decimals: int | None = None) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return bool_text(value)
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, float) and decimals is not None:
        return f"{value:.{decimals}f}"
    return str(value)


def month_end(day: date) -> date:
    if day.month == 12:
        return date(day.year, 12, 31)
    next_month = date(day.year, day.month + 1, 1)
    return next_month - timedelta(days=1)


def add_month(day: date) -> date:
    if day.month == 12:
        return date(day.year + 1, 1, 1)
    return date(day.year, day.month + 1, 1)


def month_ends_between(first_event: date, effective_end: date) -> list[date]:
    current_month = date(first_event.year, first_event.month, 1)
    output: list[date] = []
    while current_month <= effective_end:
        ref = month_end(current_month)
        if ref <= effective_end:
            output.append(ref)
        current_month = add_month(current_month)
    return output


def ensure_animal(animals: dict[str, AnimalEvents], canonical_id: str, source_code: str = "", external_id: str = "") -> AnimalEvents:
    animal = animals[canonical_id]
    animal.canonical_animal_id = canonical_id
    if source_code:
        animal.source_code = source_code
    if external_id:
        animal.external_animal_id = external_id
    if not animal.source_code and ":" in canonical_id:
        animal.source_code, animal.external_animal_id = canonical_id.split(":", 1)
    return animal


def add_observed_date(animal: AnimalEvents, event_date: date | None) -> None:
    if event_date is not None:
        animal.all_dates.append(event_date)


def load_animals() -> dict[str, AnimalEvents]:
    animals: dict[str, AnimalEvents] = defaultdict(AnimalEvents)

    for row in read_csv_rows(MAP_PATH):
        canonical_id = row.get("canonical_animal_id", "")
        if canonical_id:
            ensure_animal(animals, canonical_id, row.get("source_code", ""), row.get("external_animal_id", ""))

    for row in read_csv_rows(EVENT_NORMALIZED_PATH):
        canonical_id = row.get("canonical_animal_id", "")
        event_date = parse_date(row.get("event_date"))
        if not canonical_id or event_date is None:
            continue
        animal = ensure_animal(animals, canonical_id, row.get("source_code", ""), row.get("external_animal_id", ""))
        add_observed_date(animal, event_date)
        event_type = row.get("event_type", "")
        if event_type == "pregnancy_diagnosis_positive":
            animal.pregnancy_positive.append(event_date)
        elif event_type == "pregnancy_loss":
            animal.pregnancy_loss.append(event_date)
        # Dry-run does not treat normalized birth as reliable cow birth; in the
        # current sources it is calf/event context, not master animal DOB.

    for row in read_csv_rows(EVENT_DOGURMA_PATH):
        canonical_id = row.get("canonical_animal_id", "")
        event_date = parse_date(row.get("dogurma_tarihi"))
        if not canonical_id or event_date is None:
            continue
        animal = ensure_animal(animals, canonical_id, row.get("source_code", ""), row.get("external_animal_id", ""))
        add_observed_date(animal, event_date)
        animal.calvings.append(
            CalvingEvent(
                event_date=event_date,
                parite=parse_int(row.get("parite")),
                laktasyon_no=parse_int(row.get("laktasyon_no")),
            )
        )

    for row in read_csv_rows(EVENT_DOLLENME_PATH):
        canonical_id = row.get("canonical_animal_id", "")
        event_date = parse_date(row.get("dollenme_tarihi"))
        if not canonical_id or event_date is None:
            continue
        animal = ensure_animal(animals, canonical_id, row.get("source_code", ""), row.get("external_animal_id", ""))
        add_observed_date(animal, event_date)
        animal.services.append(event_date)

    for row in read_csv_rows(EVENT_SUT_PATH):
        canonical_id = row.get("canonical_animal_id", "")
        event_date = parse_date(row.get("sagim_tarihi"))
        milk_kg = parse_float(row.get("sut_miktar_kg"))
        if not canonical_id or event_date is None or milk_kg is None:
            continue
        animal = ensure_animal(animals, canonical_id, row.get("source_code", ""), row.get("external_animal_id", ""))
        add_observed_date(animal, event_date)
        animal.milk.append(MilkEvent(event_date=event_date, milk_kg=milk_kg))

    for row in read_csv_rows(EVENT_HEALTH_PATH):
        canonical_id = row.get("canonical_animal_id", "")
        event_date = parse_date(row.get("olay_tarihi"))
        if not canonical_id or event_date is None:
            continue
        animal = ensure_animal(animals, canonical_id, row.get("source_code", ""), row.get("external_animal_id", ""))
        add_observed_date(animal, event_date)
        animal.health.append(
            HealthEvent(
                event_date=event_date,
                olay_tipi=row.get("olay_tipi", ""),
                alt_tip=row.get("alt_tip", ""),
                aciklama=row.get("aciklama", ""),
            )
        )

    for row in read_csv_rows(EVENT_CULL_PATH):
        canonical_id = row.get("canonical_animal_id", "")
        event_date = parse_date(row.get("cikarilma_tarihi"))
        if not canonical_id or event_date is None:
            continue
        animal = ensure_animal(animals, canonical_id, row.get("source_code", ""), row.get("external_animal_id", ""))
        add_observed_date(animal, event_date)
        animal.culls.append(event_date)

    for animal in animals.values():
        animal.all_dates.sort()
        animal.calvings.sort(key=lambda item: item.event_date)
        animal.services.sort()
        animal.milk.sort(key=lambda item: item.event_date)
        animal.health.sort(key=lambda item: item.event_date)
        animal.culls.sort()
        animal.pregnancy_positive.sort()
        animal.pregnancy_loss.sort()

    return dict(animals)


def latest_calving(animal: AnimalEvents, ref_date: date) -> CalvingEvent | None:
    candidates = [event for event in animal.calvings if event.event_date <= ref_date]
    return candidates[-1] if candidates else None


def latest_date(dates: list[date], ref_date: date) -> date | None:
    candidates = [item for item in dates if item <= ref_date]
    return candidates[-1] if candidates else None


def dates_in_window(dates: list[date], start_date: date, end_date: date) -> list[date]:
    return [item for item in dates if start_date <= item <= end_date]


def milk_in_window(milk_events: list[MilkEvent], start_date: date, end_date: date) -> list[MilkEvent]:
    return [item for item in milk_events if start_date <= item.event_date <= end_date]


def health_in_window(health_events: list[HealthEvent], start_date: date, end_date: date) -> list[HealthEvent]:
    return [item for item in health_events if start_date <= item.event_date <= end_date]


def avg(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def pregnancy_status(animal: AnimalEvents, ref_date: date) -> bool | None:
    latest_positive = latest_date(animal.pregnancy_positive, ref_date)
    if latest_positive is None:
        return None
    blockers = [
        event_date
        for event_date in animal.pregnancy_loss
        if latest_positive < event_date <= ref_date
    ]
    blockers.extend(
        event.event_date
        for event in animal.calvings
        if latest_positive < event.event_date <= ref_date
    )
    return False if blockers else True


def label_for_horizon(ref_date: date, observation_end: date, first_cull_date: date | None, horizon: int) -> tuple[bool | None, bool]:
    horizon_end = ref_date + timedelta(days=horizon)
    if first_cull_date is not None and ref_date < first_cull_date <= horizon_end:
        return True, True
    if observation_end >= horizon_end:
        return False, True
    return None, False


def feature_row(snapshot_id: int, animal: AnimalEvents, ref_date: date, observation_start: date, observation_end: date) -> dict[str, Any]:
    first_cull = animal.culls[0] if animal.culls else None
    last_calving = latest_calving(animal, ref_date)
    last_calving_date = last_calving.event_date if last_calving else None
    last_service = latest_date(animal.services, ref_date)

    if last_calving_date is not None:
        service_count = len([item for item in animal.services if last_calving_date < item <= ref_date])
    else:
        service_count = None

    milk_30 = milk_in_window(animal.milk, ref_date - timedelta(days=30), ref_date)
    recent_7 = milk_in_window(animal.milk, ref_date - timedelta(days=7), ref_date)
    previous_7 = milk_in_window(animal.milk, ref_date - timedelta(days=14), ref_date - timedelta(days=8))
    recent_7_avg = avg([item.milk_kg for item in recent_7])
    previous_7_avg = avg([item.milk_kg for item in previous_7])
    milk_trend = None if recent_7_avg is None or previous_7_avg is None else recent_7_avg - previous_7_avg

    health_30 = health_in_window(animal.health, ref_date - timedelta(days=30), ref_date)
    health_texts = [
        f"{item.olay_tipi} {item.alt_tip} {item.aciklama}".lower()
        for item in health_30
    ]

    labels: dict[int, tuple[bool | None, bool]] = {
        horizon: label_for_horizon(ref_date, observation_end, first_cull, horizon)
        for horizon in HORIZONS
    }

    row = {
        "snapshot_id": f"snapshot:{snapshot_id}",
        "source_code": animal.source_code,
        "external_animal_id": animal.external_animal_id,
        "canonical_animal_id": animal.canonical_animal_id,
        "referans_tarih": ref_date,
        "observation_start": observation_start,
        "observation_end": observation_end,
        "first_cull_date": first_cull,
        "laktasyon_no": last_calving.laktasyon_no if last_calving else None,
        "parite": last_calving.parite if last_calving else None,
        "dim": (ref_date - last_calving_date).days if last_calving_date else None,
        "yas_gun": None,
        "gebe_mi": pregnancy_status(animal, ref_date),
        "servis_sayisi": service_count,
        "son_servis_gun": (ref_date - last_service).days if last_service else None,
        "gebelik_kaybi_flag": bool(dates_in_window(animal.pregnancy_loss, ref_date - timedelta(days=365), ref_date)),
        "son30_saglik_olay_sayisi": len(health_30),
        "mastitis_flag": any("mastitis" in text for text in health_texts),
        "lameness_flag": any("lameness" in text or "renguera" in text for text in health_texts),
        "son30_ortalama_sut": avg([item.milk_kg for item in milk_30]),
        "sut_trend_7g": milk_trend,
    }

    for horizon in HORIZONS:
        label, observed = labels[horizon]
        row[f"cull_{horizon}g"] = label
        row[f"cull_within_{horizon}d"] = label
        row[f"label_{horizon}d_observed"] = observed
    return row


def build_snapshots(animals: dict[str, AnimalEvents]) -> list[dict[str, Any]]:
    snapshots: list[dict[str, Any]] = []
    snapshot_id = 0
    for canonical_id in sorted(animals):
        animal = animals[canonical_id]
        if not animal.all_dates:
            continue
        observation_start = min(animal.all_dates)
        observation_end = max(animal.all_dates)
        first_cull = animal.culls[0] if animal.culls else None
        effective_end = min(observation_end, first_cull) if first_cull else observation_end
        for ref_date in month_ends_between(observation_start, effective_end):
            if first_cull is not None and ref_date > first_cull:
                continue
            snapshot_id += 1
            snapshots.append(feature_row(snapshot_id, animal, ref_date, observation_start, observation_end))
    return snapshots


def serialize_row(row: dict[str, Any], fields: list[str]) -> dict[str, str]:
    output: dict[str, str] = {}
    for field_name in fields:
        value = row.get(field_name)
        if field_name in {"son30_ortalama_sut", "sut_trend_7g"}:
            output[field_name] = value_text(value, decimals=6)
        elif field_name.startswith("cull_") or field_name.startswith("label_") or field_name in {
            "gebe_mi",
            "gebelik_kaybi_flag",
            "mastitis_flag",
            "lameness_flag",
        }:
            output[field_name] = bool_text(value) if isinstance(value, bool) or value is None else str(value)
        else:
            output[field_name] = value_text(value)
    return output


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow(serialize_row(row, fields))


def model_ready_rows(snapshots: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ready = [
        row
        for row in snapshots
        if all(row.get(f"cull_within_{horizon}d") is not None for horizon in HORIZONS)
    ]
    return sorted(ready, key=lambda item: (item["referans_tarih"], item["canonical_animal_id"]))


def build_split_rows(ready_rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], date | None]:
    if not ready_rows:
        return [], None
    cutoff_index = int(len(ready_rows) * TRAIN_FRACTION)
    cutoff_index = min(max(cutoff_index, 1), len(ready_rows) - 1) if len(ready_rows) > 1 else len(ready_rows)
    cutoff_date = ready_rows[cutoff_index]["referans_tarih"] if cutoff_index < len(ready_rows) else ready_rows[-1]["referans_tarih"]
    split_rows: list[dict[str, Any]] = []
    for row in ready_rows:
        split = "train" if row["referans_tarih"] < cutoff_date else "test"
        split_rows.append(
            {
                "snapshot_id": row["snapshot_id"],
                "source_code": row["source_code"],
                "canonical_animal_id": row["canonical_animal_id"],
                "referans_tarih": row["referans_tarih"],
                "split": split,
            }
        )
    return split_rows, cutoff_date


def label_counter(rows: list[dict[str, Any]], column: str) -> Counter:
    counter: Counter = Counter()
    for row in rows:
        value = row.get(column)
        if value is None:
            counter["null"] += 1
        elif value is True:
            counter["1"] += 1
        elif value is False:
            counter["0"] += 1
        else:
            counter[str(value)] += 1
    return counter


def date_range(rows: list[dict[str, Any]], column: str) -> tuple[str, str]:
    dates = [row[column] for row in rows if row.get(column)]
    if not dates:
        return "", ""
    return min(dates).isoformat(), max(dates).isoformat()


def write_feature_report() -> None:
    lines = [
        "# Training Feature List",
        "",
        "| Feature | Type | Window | Source rule | Leakage guard |",
        "|---|---|---|---|---|",
        "| `laktasyon_no` | integer | point-in-time | latest calving laktasyon no | only calving <= referans_tarih |",
        "| `parite` | integer | point-in-time | latest calving parity | only calving <= referans_tarih |",
        "| `dim` | integer | point-in-time | days since latest calving | only calving <= referans_tarih |",
        "| `yas_gun` | integer/null | point-in-time | reliable cow birth date only | null when no reliable cow DOB exists |",
        "| `gebe_mi` | boolean/null | point-in-time | latest positive pregnancy diagnosis minus later calving/loss | only events <= referans_tarih |",
        "| `servis_sayisi` | integer/null | since latest calving | insemination count after latest calving | only services <= referans_tarih |",
        "| `son_servis_gun` | integer/null | point-in-time | days since latest service | only services <= referans_tarih |",
        "| `gebelik_kaybi_flag` | boolean | trailing 365d | pregnancy_loss exists | window ends at referans_tarih |",
        "| `son30_saglik_olay_sayisi` | integer | trailing 30d | event_health count | window ends at referans_tarih |",
        "| `mastitis_flag` | boolean | trailing 30d | mastitis health text | window ends at referans_tarih |",
        "| `lameness_flag` | boolean | trailing 30d | lameness health text | window ends at referans_tarih |",
        "| `son30_ortalama_sut` | float/null | trailing 30d | average milk kg | window ends at referans_tarih |",
        "| `sut_trend_7g` | float/null | last 7d vs previous 7d | avg(last 7d) - avg(previous 7d) | both windows end before/at referans_tarih |",
        "",
        "Labels: `cull_within_30d`, `cull_within_60d`, `cull_within_90d` are positive only when culling occurs after `referans_tarih` and inside the horizon.",
    ]
    FEATURE_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    FEATURE_REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_review_report(
    snapshots: list[dict[str, Any]],
    ready_rows: list[dict[str, Any]],
    split_rows: list[dict[str, Any]],
    split_date: date | None,
    animals: dict[str, AnimalEvents],
) -> None:
    source_counts = Counter(row["source_code"] for row in snapshots)
    ready_source_counts = Counter(row["source_code"] for row in ready_rows)
    split_counts = Counter(row["split"] for row in split_rows)
    snapshot_min, snapshot_max = date_range(snapshots, "referans_tarih")
    ready_min, ready_max = date_range(ready_rows, "referans_tarih")

    lines = [
        "# Training Dataset Review",
        "",
        "## Summary",
        "",
        f"- Animals with observed events: `{sum(1 for animal in animals.values() if animal.all_dates)}`",
        f"- Snapshot rows: `{len(snapshots)}`",
        f"- Model-ready rows: `{len(ready_rows)}`",
        f"- Snapshot date range: `{snapshot_min}` - `{snapshot_max}`",
        f"- Model-ready date range: `{ready_min}` - `{ready_max}`",
        f"- Split cutoff date: `{split_date.isoformat() if split_date else ''}`",
        "",
        "## Label Distribution",
        "",
        "| Label | 0 | 1 | null |",
        "|---|---:|---:|---:|",
    ]
    for horizon in HORIZONS:
        counts = label_counter(snapshots, f"cull_within_{horizon}d")
        lines.append(f"| cull_within_{horizon}d | {counts['0']} | {counts['1']} | {counts['null']} |")

    lines.extend(
        [
            "",
            "## Source Distribution",
            "",
            "| Source | Snapshot rows | Model-ready rows |",
            "|---|---:|---:|",
        ]
    )
    for source_code in sorted(set(source_counts) | set(ready_source_counts)):
        lines.append(f"| {source_code} | {source_counts[source_code]} | {ready_source_counts[source_code]} |")

    lines.extend(
        [
            "",
            "## Train/Test Split",
            "",
            "| Split | Rows |",
            "|---|---:|",
            f"| train | {split_counts['train']} |",
            f"| test | {split_counts['test']} |",
            "",
            "## Notes",
            "",
            "- `model_ready` excludes rows where any 30/60/90 day label is unknown.",
            "- Negative labels are assigned only when the animal is observed through the horizon end.",
            "- `yas_gun` is null in dry-run because current candidate events do not provide a reliable cow birth date.",
        ]
    )
    REVIEW_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REVIEW_REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_split_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=SPLIT_FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow(serialize_row(row, SPLIT_FIELDS))


def main() -> int:
    animals = load_animals()
    snapshots = build_snapshots(animals)
    ready_rows = model_ready_rows(snapshots)
    split_rows, split_date = build_split_rows(ready_rows)

    split_by_id = {row["snapshot_id"]: row["split"] for row in split_rows}
    ready_rows_with_split = [{**row, "split": split_by_id.get(row["snapshot_id"], "")} for row in ready_rows]
    model_ready_fields = SNAPSHOT_FIELDS + ["split"]

    write_csv(SNAPSHOT_PATH, snapshots, SNAPSHOT_FIELDS)
    write_csv(MODEL_READY_PATH, ready_rows_with_split, model_ready_fields)
    write_split_csv(SPLIT_PATH, split_rows)
    write_feature_report()
    write_review_report(snapshots, ready_rows, split_rows, split_date, animals)

    print(f"wrote {SNAPSHOT_PATH.relative_to(PROJECT_ROOT)} ({len(snapshots)} rows)")
    print(f"wrote {MODEL_READY_PATH.relative_to(PROJECT_ROOT)} ({len(ready_rows)} rows)")
    print(f"wrote {SPLIT_PATH.relative_to(PROJECT_ROOT)} ({len(split_rows)} rows)")
    print(f"wrote {FEATURE_REPORT_PATH.relative_to(PROJECT_ROOT)}")
    print(f"wrote {REVIEW_REPORT_PATH.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
