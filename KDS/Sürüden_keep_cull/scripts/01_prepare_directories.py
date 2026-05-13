from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

DIRECTORIES = [
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


def main() -> int:
    for rel_path in DIRECTORIES:
        path = PROJECT_ROOT / rel_path
        path.mkdir(parents=True, exist_ok=True)
        print(f"OK {rel_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
