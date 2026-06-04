#!/usr/bin/env python3
"""Build 169 auth/analytics fallback checks."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "functions/api/admin/auth_me.js": ["session_storage_unavailable", "configuration_incomplete", "status: 200"],
    "functions/api/client/auth_me.js": ["session_storage_unavailable", "configuration_incomplete", "status: 200"],
    "functions/api/admin/auth_login.js": ["loginError", "bcryptjs is not bundled", "ok: false"],
    "functions/api/client/auth_login.js": ["loginError", "bcryptjs is not bundled", "ok: false"],
    "functions/api/analytics/ingest.js": ["analytics_storage_unavailable", "analytics_storage_not_configured", "ok: true"],
    "assets/admin-auth.js": ["result.data && result.data.ok === false"],
    "assets/client-auth.js": ["result.data && result.data.ok === false"],
    "SUPABASE_SCHEMA.sql": ["Build 169 auth/API fallback sync", "create table if not exists public.staff_auth_sessions"],
    "sql/2026-05-23_build169_auth_analytics_fallback_no_ddl_note.sql": ["Build 169 auth and analytics fallback note"],
    "favicon.ico": []
}


def main() -> int:
    missing: list[str] = []
    for rel, needles in REQUIRED.items():
        path = ROOT / rel
        if not path.exists():
            missing.append(f"missing file: {rel}")
            continue
        text = path.read_text(errors="ignore") if needles else ""
        for needle in needles:
            if needle not in text:
                missing.append(f"{rel}: missing {needle!r}")
    if missing:
        print("Build 169 auth/analytics check failed:")
        for item in missing:
            print("-", item)
        return 1
    print("Build 169 auth/analytics fallback check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
