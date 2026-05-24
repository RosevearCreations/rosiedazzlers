#!/usr/bin/env python3
"""Build 170 customer dashboard signed-out fallback checks."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "functions/api/client/dashboard.js": [
        "not_authenticated",
        "session_storage_unavailable",
        "status = 200",
        "authenticated: false",
        "appendSetCookie"
    ],
    "client/dashboard.js": [
        "not_authenticated",
        "session_storage_unavailable",
        "status = 200",
        "authenticated: false",
        "appendSetCookie"
    ],
    "sql/2026-05-24_build170_customer_dashboard_signed_out_fallback_no_ddl_note.sql": [
        "Build 170 customer dashboard signed-out fallback note"
    ],
    "SUPABASE_SCHEMA.sql": [
        "Build 170 customer dashboard signed-out fallback sync"
    ],
    "KNOWN_GAPS_AND_RISKS.md": [
        "Build 170 resolved issue"
    ],
    "DEVELOPMENT_ROADMAP.md": [
        "Build 170"
    ],
}


def main() -> int:
    missing: list[str] = []
    for rel, needles in REQUIRED.items():
        path = ROOT / rel
        if not path.exists():
            missing.append(f"missing file: {rel}")
            continue
        text = path.read_text(errors="ignore")
        for needle in needles:
            if needle not in text:
                missing.append(f"{rel}: missing {needle!r}")
    if missing:
        print("Build 170 customer dashboard fallback check failed:")
        for item in missing:
            print("-", item)
        return 1
    print("Build 170 customer dashboard fallback check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
