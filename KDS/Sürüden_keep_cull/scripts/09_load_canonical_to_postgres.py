from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from urllib.parse import quote_plus


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = PROJECT_ROOT / ".env"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
RAW_DIR = PROCESSED_DIR / "raw_candidates"
EVENT_DIR = PROCESSED_DIR / "event_candidates"
MAP_PATH = PROCESSED_DIR / "map_external_inek_candidates.csv"
EVENT_NORMALIZED_PATH = PROCESSED_DIR / "event_normalized_candidates.csv"


def read_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def db_url(env: dict[str, str]) -> str:
    user = quote_plus(env.get("DB_USER", "postgres"))
    password = quote_plus(env.get("DB_PASSWORD", ""))
    host = env.get("DB_HOST", "localhost")
    port = env.get("DB_PORT", "5432")
    database = env.get("DB_NAME", "laktasens_poc")
    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as file:
        return list(csv.DictReader(file))


def none_if_blank(value: str | None) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value if value else None


def int_or_none(value: str | None) -> int | None:
    value = none_if_blank(value)
    if value is None:
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def float_or_none(value: str | None) -> float | None:
    value = none_if_blank(value)
    if value is None:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def bool_or_none(value: str | None) -> bool | None:
    value = none_if_blank(value)
    if value is None:
        return None
    return value.lower() in {"1", "true", "t", "yes", "y", "e", "evet"}


def json_or_empty(value: str | None) -> str:
    value = none_if_blank(value)
    if value is None:
        return "{}"
    try:
        json.loads(value)
        return value
    except json.JSONDecodeError:
        return json.dumps({"value": value}, ensure_ascii=False)


def source_codes_from_candidates() -> set[str]:
    paths = list(RAW_DIR.glob("*.csv")) + list(EVENT_DIR.glob("*.csv")) + [MAP_PATH, EVENT_NORMALIZED_PATH]
    sources: set[str] = set()
    for path in paths:
        for row in read_csv_rows(path):
            if row.get("source_code"):
                sources.add(row["source_code"])
    return sources


def ensure_sources(connection, text, source_codes: set[str]) -> dict[str, int]:
    for source_code in sorted(source_codes):
        connection.execute(
            text(
                """
                insert into suru_karar.meta_veri_kaynagi (kaynak_kod, kaynak_adi, kaynak_tip, aciklama, aktif)
                values (:source_code, :source_code, 'dry_run_candidate', 'Inserted by canonical dry-run loader if missing.', true)
                on conflict (kaynak_kod) do update
                set kaynak_adi = excluded.kaynak_adi,
                    aktif = true
                """
            ),
            {"source_code": source_code},
        )
    rows = connection.execute(
        text(
            """
            select kaynak_kod, kaynak_id
            from suru_karar.meta_veri_kaynagi
            where kaynak_kod = any(:source_codes)
            """
        ),
        {"source_codes": list(source_codes)},
    ).mappings()
    return {str(row["kaynak_kod"]): int(row["kaynak_id"]) for row in rows}


def replace_source_rows(connection, text, kaynak_ids: dict[str, int]) -> None:
    ids = list(kaynak_ids.values())
    if not ids:
        return
    for table in [
        "event_normalized",
        "event_health",
        "event_suruden_cikarma",
        "event_sut_olcum",
        "event_kuru",
        "event_dollenme",
        "event_dogurma",
        "raw_health",
        "raw_culling",
        "raw_milk",
        "raw_repro_loss",
        "map_external_inek",
    ]:
        connection.execute(text(f"delete from suru_karar.{table} where kaynak_id = any(:ids)"), {"ids": ids})


def upsert_master_and_map(connection, text, kaynak_ids: dict[str, int]) -> dict[str, int]:
    inek_by_canonical: dict[str, int] = {}
    for row in read_csv_rows(MAP_PATH):
        source_code = row.get("source_code", "")
        kaynak_id = kaynak_ids.get(source_code)
        canonical_id = row.get("canonical_animal_id", "")
        external_id = row.get("external_animal_id", "")
        if not kaynak_id or not canonical_id or not external_id:
            continue
        result = connection.execute(
            text(
                """
                insert into suru_karar.master_inek (external_animal_id)
                values (:canonical_id)
                on conflict (external_animal_id) do update
                set external_animal_id = excluded.external_animal_id
                returning inek_id
                """
            ),
            {"canonical_id": canonical_id},
        ).scalar_one()
        inek_id = int(result)
        inek_by_canonical[canonical_id] = inek_id
        connection.execute(
            text(
                """
                insert into suru_karar.map_external_inek (kaynak_id, external_animal_id, inek_id, notlar)
                values (:kaynak_id, :external_id, :inek_id, :notlar)
                on conflict (kaynak_id, external_animal_id) do update
                set inek_id = excluded.inek_id,
                    notlar = excluded.notlar
                """
            ),
            {
                "kaynak_id": kaynak_id,
                "external_id": external_id,
                "inek_id": inek_id,
                "notlar": row.get("notlar") or "Generated by canonical dry-run loader.",
            },
        )
    return inek_by_canonical


def insert_raw_repro_loss(connection, text, row: dict[str, str], kaynak_id: int) -> None:
    params = {key: none_if_blank(row.get(key)) for key in [
        "external_animal_id",
        "fparto",
        "fechasf",
        "fechaperd",
    ]}
    for key in ["nparto", "nlact", "nrosf", "npre", "perdida", "tperd", "codigo_tperd", "estsf", "dgp", "delp", "sana_ribeiro"]:
        params[key] = int_or_none(row.get(key))
    for key in ["cl100", "cl150", "clsf", "cltacto"]:
        params[key] = float_or_none(row.get(key))
    params["kaynak_id"] = kaynak_id
    params["raw_payload"] = json_or_empty(row.get("raw_payload"))
    connection.execute(
        text(
            """
            insert into suru_karar.raw_repro_loss
            (kaynak_id, external_animal_id, fparto, nparto, nlact, nrosf, fechasf, fechaperd,
             npre, perdida, tperd, codigo_tperd, estsf, dgp, delp, sana_ribeiro,
             cl100, cl150, clsf, cltacto, raw_payload)
            values
            (:kaynak_id, :external_animal_id, :fparto, :nparto, :nlact, :nrosf, :fechasf, :fechaperd,
             :npre, :perdida, :tperd, :codigo_tperd, :estsf, :dgp, :delp, :sana_ribeiro,
             :cl100, :cl150, :clsf, :cltacto, cast(:raw_payload as jsonb))
            """
        ),
        params,
    )


def insert_raw_milk(connection, text, row: dict[str, str], kaynak_id: int) -> None:
    connection.execute(
        text(
            """
            insert into suru_karar.raw_milk
            (kaynak_id, external_animal_id, external_machine_id, sagim_tarihi, sut_miktar_kg,
             sagim_no, conductivity, yag_orani, protein_orani, scc, raw_payload)
            values
            (:kaynak_id, :external_animal_id, :external_machine_id, :sagim_tarihi, :sut_miktar_kg,
             :sagim_no, :conductivity, :yag_orani, :protein_orani, :scc, cast(:raw_payload as jsonb))
            """
        ),
        {
            "kaynak_id": kaynak_id,
            "external_animal_id": none_if_blank(row.get("external_animal_id")),
            "external_machine_id": none_if_blank(row.get("external_machine_id")),
            "sagim_tarihi": none_if_blank(row.get("sagim_tarihi")),
            "sut_miktar_kg": float_or_none(row.get("sut_miktar_kg")),
            "sagim_no": int_or_none(row.get("sagim_no")),
            "conductivity": float_or_none(row.get("conductivity")),
            "yag_orani": float_or_none(row.get("yag_orani")),
            "protein_orani": float_or_none(row.get("protein_orani")),
            "scc": float_or_none(row.get("scc")),
            "raw_payload": json_or_empty(row.get("raw_payload")),
        },
    )


def insert_raw_culling(connection, text, row: dict[str, str], kaynak_id: int) -> None:
    connection.execute(
        text(
            """
            insert into suru_karar.raw_culling
            (kaynak_id, external_animal_id, cikarilma_tarihi, cikarilma_sebebi,
             planned_cull, satis_degeri, raw_payload)
            values
            (:kaynak_id, :external_animal_id, :cikarilma_tarihi, :cikarilma_sebebi,
             :planned_cull, :satis_degeri, cast(:raw_payload as jsonb))
            """
        ),
        {
            "kaynak_id": kaynak_id,
            "external_animal_id": none_if_blank(row.get("external_animal_id")),
            "cikarilma_tarihi": none_if_blank(row.get("cikarilma_tarihi")),
            "cikarilma_sebebi": none_if_blank(row.get("cikarilma_sebebi")),
            "planned_cull": bool_or_none(row.get("planned_cull")),
            "satis_degeri": float_or_none(row.get("satis_degeri")),
            "raw_payload": json_or_empty(row.get("raw_payload")),
        },
    )


def insert_raw_health(connection, text, row: dict[str, str], kaynak_id: int) -> None:
    connection.execute(
        text(
            """
            insert into suru_karar.raw_health
            (kaynak_id, external_animal_id, olay_tarihi, olay_tipi, alt_tip,
             siddet, tedavi_verildi, aciklama, raw_payload)
            values
            (:kaynak_id, :external_animal_id, :olay_tarihi, :olay_tipi, :alt_tip,
             :siddet, :tedavi_verildi, :aciklama, cast(:raw_payload as jsonb))
            """
        ),
        {
            "kaynak_id": kaynak_id,
            "external_animal_id": none_if_blank(row.get("external_animal_id")),
            "olay_tarihi": none_if_blank(row.get("olay_tarihi")),
            "olay_tipi": none_if_blank(row.get("olay_tipi")),
            "alt_tip": none_if_blank(row.get("alt_tip")),
            "siddet": int_or_none(row.get("siddet")),
            "tedavi_verildi": bool_or_none(row.get("tedavi_verildi")),
            "aciklama": none_if_blank(row.get("aciklama")),
            "raw_payload": json_or_empty(row.get("raw_payload")),
        },
    )


def insert_raw_candidates(connection, text, kaynak_ids: dict[str, int]) -> None:
    handlers = {
        "raw_repro_loss": insert_raw_repro_loss,
        "raw_milk": insert_raw_milk,
        "raw_culling": insert_raw_culling,
        "raw_health": insert_raw_health,
    }
    for table_name, handler in handlers.items():
        for row in read_csv_rows(RAW_DIR / f"{table_name}.csv"):
            kaynak_id = kaynak_ids.get(row.get("source_code", ""))
            if kaynak_id:
                handler(connection, text, row, kaynak_id)


def event_base(row: dict[str, str], kaynak_ids: dict[str, int], inek_by_canonical: dict[str, int]) -> dict | None:
    kaynak_id = kaynak_ids.get(row.get("source_code", ""))
    inek_id = inek_by_canonical.get(row.get("canonical_animal_id", ""))
    if not kaynak_id or not inek_id:
        return None
    return {
        "kaynak_id": kaynak_id,
        "inek_id": inek_id,
        "source_table": none_if_blank(row.get("source_table")),
        "source_row_id": int_or_none(row.get("source_row_number")),
    }


def insert_event_candidates(connection, text, kaynak_ids: dict[str, int], inek_by_canonical: dict[str, int]) -> None:
    statements = {
        "event_dogurma": (
            """
            insert into suru_karar.event_dogurma
            (inek_id, kaynak_id, dogurma_tarihi, parite, laktasyon_no, source_table, source_row_id)
            values (:inek_id, :kaynak_id, :dogurma_tarihi, :parite, :laktasyon_no, :source_table, :source_row_id)
            """,
            lambda row: {
                "dogurma_tarihi": none_if_blank(row.get("dogurma_tarihi")),
                "parite": int_or_none(row.get("parite")),
                "laktasyon_no": int_or_none(row.get("laktasyon_no")),
            },
        ),
        "event_dollenme": (
            """
            insert into suru_karar.event_dollenme
            (inek_id, kaynak_id, dollenme_tarihi, dollenme_sayisi, tuttu_mu, servis_durumu, source_table, source_row_id)
            values (:inek_id, :kaynak_id, :dollenme_tarihi, :dollenme_sayisi, :tuttu_mu, :servis_durumu, :source_table, :source_row_id)
            """,
            lambda row: {
                "dollenme_tarihi": none_if_blank(row.get("dollenme_tarihi")),
                "dollenme_sayisi": int_or_none(row.get("dollenme_sayisi")),
                "tuttu_mu": none_if_blank(row.get("tuttu_mu")),
                "servis_durumu": none_if_blank(row.get("servis_durumu")),
            },
        ),
        "event_kuru": (
            """
            insert into suru_karar.event_kuru
            (inek_id, kaynak_id, kuru_baslangic_tarihi, source_table, source_row_id)
            values (:inek_id, :kaynak_id, :kuru_baslangic_tarihi, :source_table, :source_row_id)
            """,
            lambda row: {"kuru_baslangic_tarihi": none_if_blank(row.get("kuru_baslangic_tarihi"))},
        ),
        "event_sut_olcum": (
            """
            insert into suru_karar.event_sut_olcum
            (inek_id, kaynak_id, sagim_tarihi, sut_miktar_kg, sagim_no, conductivity,
             yag_orani, protein_orani, scc, source_table, source_row_id)
            values
            (:inek_id, :kaynak_id, :sagim_tarihi, :sut_miktar_kg, :sagim_no, :conductivity,
             :yag_orani, :protein_orani, :scc, :source_table, :source_row_id)
            """,
            lambda row: {
                "sagim_tarihi": none_if_blank(row.get("sagim_tarihi")),
                "sut_miktar_kg": float_or_none(row.get("sut_miktar_kg")),
                "sagim_no": int_or_none(row.get("sagim_no")),
                "conductivity": float_or_none(row.get("conductivity")),
                "yag_orani": float_or_none(row.get("yag_orani")),
                "protein_orani": float_or_none(row.get("protein_orani")),
                "scc": float_or_none(row.get("scc")),
            },
        ),
        "event_suruden_cikarma": (
            """
            insert into suru_karar.event_suruden_cikarma
            (inek_id, kaynak_id, cikarilma_tarihi, cikarilma_sebebi, planned_cull,
             satis_degeri, source_table, source_row_id)
            values
            (:inek_id, :kaynak_id, :cikarilma_tarihi, :cikarilma_sebebi, :planned_cull,
             :satis_degeri, :source_table, :source_row_id)
            """,
            lambda row: {
                "cikarilma_tarihi": none_if_blank(row.get("cikarilma_tarihi")),
                "cikarilma_sebebi": none_if_blank(row.get("cikarilma_sebebi")),
                "planned_cull": bool_or_none(row.get("planned_cull")),
                "satis_degeri": float_or_none(row.get("satis_degeri")),
            },
        ),
        "event_health": (
            """
            insert into suru_karar.event_health
            (inek_id, kaynak_id, olay_tarihi, olay_tipi, alt_tip, siddet,
             tedavi_verildi, aciklama, source_table, source_row_id)
            values
            (:inek_id, :kaynak_id, :olay_tarihi, :olay_tipi, :alt_tip, :siddet,
             :tedavi_verildi, :aciklama, :source_table, :source_row_id)
            """,
            lambda row: {
                "olay_tarihi": none_if_blank(row.get("olay_tarihi")),
                "olay_tipi": none_if_blank(row.get("olay_tipi")),
                "alt_tip": none_if_blank(row.get("alt_tip")),
                "siddet": int_or_none(row.get("siddet")),
                "tedavi_verildi": bool_or_none(row.get("tedavi_verildi")),
                "aciklama": none_if_blank(row.get("aciklama")),
            },
        ),
    }
    for table_name, (statement, extra_builder) in statements.items():
        for row in read_csv_rows(EVENT_DIR / f"{table_name}.csv"):
            base = event_base(row, kaynak_ids, inek_by_canonical)
            if base is None:
                continue
            connection.execute(text(statement), {**base, **extra_builder(row)})


def insert_normalized(connection, text, kaynak_ids: dict[str, int], inek_by_canonical: dict[str, int]) -> None:
    for row in read_csv_rows(EVENT_NORMALIZED_PATH):
        base = event_base(row, kaynak_ids, inek_by_canonical)
        if base is None:
            continue
        connection.execute(
            text(
                """
                insert into suru_karar.event_normalized
                (inek_id, kaynak_id, event_date, event_type, source_table, source_row_id,
                 numeric_value, text_value, payload)
                values
                (:inek_id, :kaynak_id, :event_date, :event_type, :source_table, :source_row_id,
                 :numeric_value, :text_value, cast(:payload as jsonb))
                """
            ),
            {
                **base,
                "event_date": none_if_blank(row.get("event_date")),
                "event_type": none_if_blank(row.get("event_type")),
                "numeric_value": float_or_none(row.get("numeric_value")),
                "text_value": none_if_blank(row.get("text_value")),
                "payload": json_or_empty(row.get("payload")),
            },
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Load canonical dry-run candidates into PostgreSQL.")
    parser.add_argument("--replace-source", action="store_true", default=True, help="Replace rows for sources found in candidate CSVs.")
    args = parser.parse_args()

    env = read_env(ENV_PATH)
    if not env:
        print(".env not found; skipped PostgreSQL load. Dry-run CSV outputs remain under data/processed/.")
        return 0

    try:
        from sqlalchemy import create_engine, text
    except ImportError as exc:
        print(f"SQLAlchemy/psycopg2 not available; skipped PostgreSQL load: {exc}")
        return 0

    source_codes = source_codes_from_candidates()
    if not source_codes:
        print("No candidate CSV rows found; run scripts/08_build_raw_and_event_candidates.py first.")
        return 0

    engine = create_engine(db_url(env), future=True)
    with engine.begin() as connection:
        kaynak_ids = ensure_sources(connection, text, source_codes)
        if args.replace_source:
            replace_source_rows(connection, text, kaynak_ids)
        inek_by_canonical = upsert_master_and_map(connection, text, kaynak_ids)
        insert_raw_candidates(connection, text, kaynak_ids)
        insert_event_candidates(connection, text, kaynak_ids, inek_by_canonical)
        insert_normalized(connection, text, kaynak_ids, inek_by_canonical)

    print(f"loaded canonical candidates for {len(source_codes)} source(s) into suru_karar")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
