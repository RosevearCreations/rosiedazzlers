#!/usr/bin/env python3
"""Verify Build 159 social queue, publishing bridge, review gates, templates, scheduling, and duplicate helpers."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "functions/api/_lib/social-dispatch.js",
    "functions/api/_lib/social-platform-dispatch.js",
    "functions/api/_lib/social-compliance.js",
    "functions/api/admin/social_post_create.js",
    "functions/api/admin/social_posts_list.js",
    "functions/api/admin/social_post_dispatch.js",
    "functions/api/admin/social_readiness.js",
    "functions/api/admin/social_templates_list.js",
    "functions/api/social_post_create.js",
    "functions/api/social_posts_list.js",
    "functions/api/social_post_dispatch.js",
    "functions/api/social_readiness.js",
    "functions/api/social_templates_list.js",
    "admin-social/index.html",
    "admin-social.html",
    "sql/2026-05-19_build156_social_progress_dispatch_queue.sql",
    "sql/2026-05-20_build158_social_review_gates_and_templates.sql",
    "sql/2026-05-20_build159_social_templates_schedule_duplicate_metrics.sql",
]

MARKERS = {
    "admin-progress/index.html": ["socialDraftEnabled", "socialAutoPublishEnabled", "socialPostsList", "socialConsentConfirmed", "/api/admin/social_post_create", "/api/admin/social_post_dispatch"],
    "admin-social/index.html": ["Social Queue", "Publish/API", "data-copy-text", "Approve & ready", "manualConsent", "captionTemplateSelect", "hashtagPresetSelect", "manualScheduledFor", "duplicate-warning", "/api/admin/social_templates_list"],
    "functions/api/admin/social_templates_list.js": ["social_caption_templates", "social_hashtag_presets", "FALLBACK_CAPTION_TEMPLATES", "FALLBACK_HASHTAG_PRESETS"],
    "functions/api/admin/social_posts_list.js": ["schedule", "scheduled_for", "not.is.null", "is.null"],
    "SUPABASE_SCHEMA.sql": ["social_post_queue", "social_dispatch_attempts", "social_channels", "social_caption_templates", "social_hashtag_presets", "social_post_metrics_snapshots", "Build 159 sync note"],
    "assets/admin-menu.js": ["admin-social", "Social Queue"],
    "assets/admin-auth.js": ["admin-social"],
}


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    sys.exit(1)


def main() -> int:
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).exists():
            fail(f"Missing required Build 159 file: {rel}")

    for rel, markers in MARKERS.items():
        path = ROOT / rel
        if not path.exists():
            fail(f"Missing marker file: {rel}")
        text = path.read_text(encoding="utf-8", errors="ignore")
        missing = [marker for marker in markers if marker not in text]
        if missing:
            fail(f"{rel} is missing markers: {', '.join(missing)}")

    print("Build 159 social dispatch workflow check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
