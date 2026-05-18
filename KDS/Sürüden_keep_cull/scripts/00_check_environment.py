from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path
from urllib.parse import quote_plus

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(*_args: object, **_kwargs: object) -> bool:
        return False


PROJECT_ROOT = Path(__file__).resolve().parents[1]

REQUIRED_PACKAGES = {
    "pandas": "pandas",
    "openpyxl": "openpyxl",
    "pyyaml": "yaml",
    "requests": "requests",
    "python-dotenv": "dotenv",
    "sqlalchemy": "sqlalchemy",
    "psycopg2-binary": "psycopg2",
    "scikit-learn": "sklearn",
    "joblib": "joblib",
    "xgboost": "xgboost",
    "lightgbm": "lightgbm",
    "catboost": "catboost",
}

REQUIRED_DIRS = [
    "docs",
    "sql",
    "data",
    "data/raw",
    "data/external",
    "data/manual_downloads",
    "data/processed",
    "scripts",
    "notebooks",
    "reports",
    "config",
]


def status_line(ok: bool, label: str, detail: str = "") -> str:
    mark = "OK" if ok else "FAIL"
    suffix = f" - {detail}" if detail else ""
    return f"[{mark}] {label}{suffix}"


def db_url_from_env() -> str:
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "")
    user = os.getenv("DB_USER", "")
    password = os.getenv("DB_PASSWORD", "")
    return (
        f"postgresql+psycopg2://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{quote_plus(db_name)}?connect_timeout=5"
    )


def check_postgresql() -> tuple[bool, str]:
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        return True, ".env yok; PostgreSQL kontrolu atlandi"

    if importlib.util.find_spec("dotenv") is None:
        return False, "python-dotenv kurulu degil; .env okunamadi"

    if importlib.util.find_spec("sqlalchemy") is None:
        return False, "sqlalchemy kurulu degil"

    from sqlalchemy import create_engine, text

    required = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"]
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        return False, f".env eksik alanlar: {', '.join(missing)}"

    try:
        engine = create_engine(db_url_from_env(), future=True)
        with engine.connect() as conn:
            conn.execute(text("select 1"))
        return True, "PostgreSQL baglantisi basarili"
    except Exception as exc:  # noqa: BLE001
        return False, f"PostgreSQL baglantisi basarisiz: {exc}"


def main() -> int:
    load_dotenv(PROJECT_ROOT / ".env")

    failures = 0

    py_ok = sys.version_info >= (3, 11)
    if not py_ok:
        failures += 1
    print(status_line(py_ok, "Python 3.11+", sys.version.split()[0]))

    for package_name, import_name in REQUIRED_PACKAGES.items():
        ok = importlib.util.find_spec(import_name) is not None
        if not ok:
            failures += 1
        print(status_line(ok, f"package: {package_name}"))

    for rel_path in REQUIRED_DIRS:
        path = PROJECT_ROOT / rel_path
        ok = path.exists() and path.is_dir()
        if not ok:
            failures += 1
        print(status_line(ok, f"directory: {rel_path}"))

    env_exists = (PROJECT_ROOT / ".env").exists()
    print(status_line(env_exists, ".env", "opsiyonel; yoksa .env.example'dan kopyala"))

    db_ok, db_detail = check_postgresql()
    if not db_ok:
        failures += 1
    print(status_line(db_ok, "PostgreSQL optional check", db_detail))

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
