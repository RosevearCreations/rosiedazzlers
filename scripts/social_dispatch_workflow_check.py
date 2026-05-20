#!/usr/bin/env python3
"""Verify Build 156 social queue files and markers exist."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "functions/api/_lib/social-dispatch.js",
    "functions/api/admin/social_post_create.js",
    "functions/api/admin/social_posts_list.js",
    "functions/api/admin/social_post_dispatch.js",
    "functions/api/admin/social_readiness.js",
    "functions/api/social_post_create.js",
    "functions/api/social_posts_list.js",
    "functions/api/social_post_dispatch.js",
    "functions/api/social_readiness.js",
    "admin-social/index.html",
    "admin-social.html",
    "sql/2026-05-19_build156_social_progress_dispatch_queue.sql",
]

MARKERS = {
    "admin-progress/index.html": ["socialDraftEnabled", "socialPostsList", "/api/admin/social_post_create"],
    "admin-social/index.html": ["Social Queue", "/api/admin/social_posts_list", "/api/admin/social_post_dispatch"],
    "SUPABASE_SCHEMA.sql": ["social_post_queue", "social_dispatch_attempts", "social_channels"],
    "assets/admin-menu.js": ["admin-social", "Social Queue"],
    "assets/admin-auth.js": ["admin-social"],
}


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    sys.exit(1)


def main() -> int:
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).exists():
            fail(f"Missing required Build 156 file: {rel}")

    for rel, markers in MARKERS.items():
        path = ROOT / rel
        if not path.exists():
            fail(f"Missing marker file: {rel}")
        text = path.read_text(encoding="utf-8", errors="ignore")
        missing = [marker for marker in markers if marker not in text]
        if missing:
            fail(f"{rel} is missing markers: {', '.join(missing)}")

    print("Build 156 social dispatch workflow check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
