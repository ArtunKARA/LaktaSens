from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.parse import quote_plus

import yaml
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = PROJECT_ROOT / "config" / "data_sources.yaml"


def db_url_from_env() -> str:
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "")
    user = os.getenv("DB_USER", "")
    password = os.getenv("DB_PASSWORD", "")
    if not all([host, port, db_name, user, password]):
        raise RuntimeError("DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD alanlari .env icinde dolu olmalidir.")
    return (
        f"postgresql+psycopg2://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{quote_plus(db_name)}"
    )


def load_sources() -> list[dict]:
    with CONFIG_PATH.open("r", encoding="utf-8") as file:
        payload = yaml.safe_load(file) or {}
    sources = payload.get("sources", [])
    if not isinstance(sources, list):
        raise RuntimeError("config/data_sources.yaml icindeki 'sources' list olmalidir.")
    return sources


def source_type(source: dict) -> str:
    if source.get("manual_download_required"):
        return "manual"
    expected = str(source.get("expected_format") or "external")
    return expected.split(";")[0].strip().lower()[:80] or "external"


def description_payload(source: dict) -> str:
    data = {
        "role": source.get("role"),
        "url": source.get("url"),
        "license": source.get("license"),
        "priority": source.get("priority"),
        "target_raw_tables": source.get("target_raw_tables", []),
        "target_event_tables": source.get("target_event_tables", []),
        "has_animal_id": source.get("has_animal_id"),
        "has_date": source.get("has_date"),
        "has_culling": source.get("has_culling"),
        "has_milk": source.get("has_milk"),
        "has_reproduction": source.get("has_reproduction"),
        "has_health": source.get("has_health"),
        "has_economic_parameter": source.get("has_economic_parameter"),
        "manual_download_required": source.get("manual_download_required"),
        "notes": source.get("notes"),
    }
    return json.dumps(data, ensure_ascii=False, sort_keys=True)


def main() -> int:
    load_dotenv(PROJECT_ROOT / ".env")
    sources = load_sources()
    engine = create_engine(db_url_from_env(), future=True)

    statement = text(
        """
        insert into suru_karar.meta_veri_kaynagi (
            kaynak_kod,
            kaynak_adi,
            kaynak_tip,
            aciklama,
            aktif
        )
        values (
            :kaynak_kod,
            :kaynak_adi,
            :kaynak_tip,
            :aciklama,
            true
        )
        on conflict (kaynak_kod) do update
        set
            kaynak_adi = excluded.kaynak_adi,
            kaynak_tip = excluded.kaynak_tip,
            aciklama = excluded.aciklama,
            aktif = true
        """
    )

    with engine.begin() as conn:
        for source in sources:
            params = {
                "kaynak_kod": source["source_code"],
                "kaynak_adi": source["source_name"],
                "kaynak_tip": source_type(source),
                "aciklama": description_payload(source),
            }
            conn.execute(statement, params)
            print(f"registered {source['source_code']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
