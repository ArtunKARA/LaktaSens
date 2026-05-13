from __future__ import annotations

import csv
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

import requests
import yaml


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = PROJECT_ROOT / "config" / "data_sources.yaml"
EXTERNAL_DIR = PROJECT_ROOT / "data" / "external"
MANUAL_README = PROJECT_ROOT / "data" / "manual_downloads" / "README.md"
DOWNLOAD_LOG = PROJECT_ROOT / "reports" / "download_log.csv"

LOG_FIELDS = [
    "timestamp_utc",
    "source_code",
    "url",
    "status",
    "http_status",
    "saved_path",
    "manual_download_required",
    "message",
]

DOWNLOADABLE_CONTENT_TYPES = (
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "text/csv",
    "text/tab-separated-values",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
    "application/json",
)

EXTENSION_BY_CONTENT_TYPE = {
    "application/pdf": ".pdf",
    "application/zip": ".zip",
    "application/x-zip-compressed": ".zip",
    "text/csv": ".csv",
    "text/tab-separated-values": ".tsv",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/json": ".json",
}


def load_sources() -> list[dict]:
    with CONFIG_PATH.open("r", encoding="utf-8") as file:
        payload = yaml.safe_load(file) or {}
    return payload.get("sources", [])


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def safe_filename(name: str) -> str:
    name = unquote(name).strip().strip('"')
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)
    return name.strip("._") or "downloaded_file"


def filename_from_response(source_code: str, url: str, response: requests.Response) -> str:
    disposition = response.headers.get("content-disposition", "")
    match = re.search(r'filename\*?=(?:UTF-8\'\')?"?([^";]+)"?', disposition, flags=re.I)
    if match:
        return safe_filename(match.group(1))

    parsed_name = Path(urlparse(url).path).name
    if parsed_name and "." in parsed_name:
        return safe_filename(parsed_name)

    content_type = response.headers.get("content-type", "").split(";")[0].lower()
    suffix = EXTENSION_BY_CONTENT_TYPE.get(content_type, ".bin")
    return f"{safe_filename(source_code)}{suffix}"


def looks_like_html(first_bytes: bytes, content_type: str) -> bool:
    lowered_type = content_type.lower()
    if "text/html" in lowered_type:
        return True
    head = first_bytes[:512].lower()
    return b"<html" in head or b"<!doctype html" in head


def append_log(rows: list[dict]) -> None:
    DOWNLOAD_LOG.parent.mkdir(parents=True, exist_ok=True)
    write_header = not DOWNLOAD_LOG.exists()
    with DOWNLOAD_LOG.open("a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=LOG_FIELDS)
        if write_header:
            writer.writeheader()
        writer.writerows(rows)


def write_manual_readme(manual_sources: list[dict]) -> None:
    MANUAL_README.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Manual Downloads",
        "",
        "The following sources were not downloaded automatically.",
        "Download them manually and place files under `data/external/<source_code>/`.",
        "",
    ]

    if not manual_sources:
        lines.append("No manual downloads are currently required by the last run.")
    else:
        for source in manual_sources:
            lines.extend(
                [
                    f"## {source.get('source_code')}",
                    "",
                    f"- Name: {source.get('source_name')}",
                    f"- URL: {source.get('url')}",
                    f"- Expected format: {source.get('expected_format')}",
                    f"- Notes: {source.get('notes')}",
                    "",
                ]
            )

    MANUAL_README.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def download_source(source: dict) -> dict:
    source_code = source["source_code"]
    url = source.get("url")
    target_dir = EXTERNAL_DIR / source_code
    target_dir.mkdir(parents=True, exist_ok=True)

    try:
        response = requests.get(
            url,
            timeout=30,
            stream=True,
            headers={"User-Agent": "LaktaSens-data-prototype/0.1"},
        )
        http_status = response.status_code
        response.raise_for_status()

        iterator = response.iter_content(chunk_size=1024 * 128)
        first_chunk = next(iterator, b"")
        content_type = response.headers.get("content-type", "")

        if looks_like_html(first_chunk, content_type):
            return {
                "timestamp_utc": now_utc(),
                "source_code": source_code,
                "url": url,
                "status": "manual_required",
                "http_status": http_status,
                "saved_path": "",
                "manual_download_required": True,
                "message": "URL returned HTML or landing page, not a direct data file.",
            }

        if not first_chunk and not any(kind in content_type.lower() for kind in DOWNLOADABLE_CONTENT_TYPES):
            return {
                "timestamp_utc": now_utc(),
                "source_code": source_code,
                "url": url,
                "status": "manual_required",
                "http_status": http_status,
                "saved_path": "",
                "manual_download_required": True,
                "message": f"Unsupported content type: {content_type}",
            }

        file_name = filename_from_response(source_code, url, response)
        target_path = target_dir / file_name
        tmp_path = target_path.with_suffix(target_path.suffix + ".tmp")
        with tmp_path.open("wb") as file:
            if first_chunk:
                file.write(first_chunk)
            for chunk in iterator:
                if chunk:
                    file.write(chunk)
        tmp_path.replace(target_path)

        return {
            "timestamp_utc": now_utc(),
            "source_code": source_code,
            "url": url,
            "status": "downloaded",
            "http_status": http_status,
            "saved_path": str(target_path.relative_to(PROJECT_ROOT)),
            "manual_download_required": False,
            "message": "Downloaded successfully.",
        }

    except Exception as exc:  # noqa: BLE001
        return {
            "timestamp_utc": now_utc(),
            "source_code": source_code,
            "url": url,
            "status": "manual_required",
            "http_status": "",
            "saved_path": "",
            "manual_download_required": True,
            "message": f"Download failed: {exc}",
        }


def has_local_files(source_code: str) -> bool:
    target_dir = EXTERNAL_DIR / source_code
    if not target_dir.exists():
        return False
    return any(path.is_file() and path.name != ".gitkeep" for path in target_dir.rglob("*"))


def main() -> int:
    EXTERNAL_DIR.mkdir(parents=True, exist_ok=True)
    sources = load_sources()
    log_rows: list[dict] = []
    manual_sources: list[dict] = []

    for source in sources:
        source_code = source["source_code"]
        if source.get("manual_download_required"):
            if has_local_files(source_code):
                row = {
                    "timestamp_utc": now_utc(),
                    "source_code": source_code,
                    "url": source.get("url"),
                    "status": "available_local_manual",
                    "http_status": "",
                    "saved_path": str((EXTERNAL_DIR / source_code).relative_to(PROJECT_ROOT)),
                    "manual_download_required": False,
                    "message": "Manual source already has local files under data/external.",
                }
                log_rows.append(row)
                print(f"available {source_code}")
                continue
            manual_sources.append(source)
            row = {
                "timestamp_utc": now_utc(),
                "source_code": source_code,
                "url": source.get("url"),
                "status": "manual_required_config",
                "http_status": "",
                "saved_path": "",
                "manual_download_required": True,
                "message": "Config marks this source as requiring manual download.",
            }
            log_rows.append(row)
            print(f"manual {source_code}")
            continue

        row = download_source(source)
        log_rows.append(row)
        if str(row["manual_download_required"]).lower() == "true":
            manual_sources.append(source)
            print(f"manual {source_code}: {row['message']}")
        else:
            print(f"downloaded {source_code}: {row['saved_path']}")

    append_log(log_rows)
    write_manual_readme(manual_sources)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
