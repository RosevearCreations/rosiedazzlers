#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8", errors="ignore")

def require_file(rel):
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"Missing {rel}")
    return path

def require(needle, rel):
    if needle not in read(rel):
        raise SystemExit(f"{rel} missing {needle!r}")

def main():
    files = [
        "detailer-jobs.html", "detailer-jobs/index.html",
        "admin-progress.html", "admin-progress/index.html",
        "progress.html", "progress/index.html",
        "functions/api/_lib/job-live-feed.js",
        "functions/api/admin/progress_post.js",
        "functions/api/admin/progress_media_post.js",
        "functions/api/admin/progress_list.js",
        "functions/api/admin/progress_moderate.js",
        "functions/api/admin/live_interaction_report.js",
        "functions/api/progress/view.js",
        "functions/api/progress/comment_post.js",
        "functions/api/detailer/job_note_post.js",
        "sql/2026-06-17_build209_live_detail_interaction.sql",
        "data/build209_live_interaction_sanity.json",
        "docs/archive/README.md"
    ]
    for rel in files: require_file(rel)

    require("Customer now", "detailer-jobs.html")
    require("Admin review first", "detailer-jobs.html")
    require("Staff only", "detailer-jobs.html")
    require("progress_upload_url", "detailer-jobs.html")
    require("video", "progress.html")
    require("publicWorkflowEvents", "functions/api/progress/view.js")
    require("detailer_response_reason: null", "functions/api/progress/view.js")
    require("storage_bucket", "functions/api/admin/progress_media_post.js")
    require("review_status", "SUPABASE_SCHEMA.sql")
    require("Build 209 live detail interaction", "SUPABASE_SCHEMA.sql")
    require("liveInteractionDiagnostics", "admin.html")
    require("live_interaction_report", "admin.html")
    require("admin-progress.html", "scripts/sync_route_copies.py")
    require("detailer-jobs.html", "scripts/sync_route_copies.py")
    require("Build 209", "AI_PROJECT_HANDOFF.md")
    require("Next 20 value-added steps", "MASTER_VALUE_ROADMAP.md")
    require("Build 209 update", "DEVELOPMENT_ROADMAP.md")
    require("Build 209 known gaps and risks", "KNOWN_GAPS_AND_RISKS.md")
    require("Build 209 live-detail interaction database update", "DATABASE_STRUCTURE_CURRENT.md")
    require("Build 209 documentation index note", "DOC_INDEX.md")
    require("Build 209 note", "README.md")
    require("live_customer_update", "data/visual_placeholder_registry.json")
    require("private_staff_note", "assets/visual-placeholders.js")
    require("live-feed-grid", "assets/site.css")

    report = json.loads(read("data/markdown_sanity_build207.json"))
    if int(report.get("build", 0)) != 209:
        raise SystemExit("Markdown sanity report is not Build 209")
    archived = list((ROOT / "docs" / "archive").glob("*.md"))
    if len(archived) < 20:
        raise SystemExit("Expected at least 20 archived Markdown files")

    for root_doc in ["AI_PROJECT_HANDOFF.md", "MASTER_VALUE_ROADMAP.md"]:
        if not (ROOT / root_doc).exists():
            raise SystemExit(f"Missing canonical doc {root_doc}")

    print("Build 209 live interaction/documentation checks passed.")

if __name__ == "__main__":
    main()
