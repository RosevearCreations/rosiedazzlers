#!/usr/bin/env python3
"""Build 205 release guard for sanity-check/value-added roadmap additions."""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "APP_SANITY_CHECK_BUILD205.md",
    "data/value_added_feature_backlog.json",
    "functions/api/admin/value_added_sanity_report.js",
    "admin-sanity.html",
    "admin-sanity/index.html",
    "sql/2026-06-13_build205_sanity_check_value_roadmap_no_ddl_note.sql",
]
TOKENS = {
    "admin.html": ["valueAddedSanityDiagnostics", "Build 205 sanity / value roadmap", "/admin-sanity.html"],
    "admin-sanity.html": ["Sanity Check & Value Roadmap", "/api/admin/value_added_sanity_report"],
    "functions/api/admin/value_added_sanity_report.js": ["priority_additions", "competitor_patterns_reviewed", "requireStaffAccess"],
    "DEVELOPMENT_ROADMAP.md": ["Build 205 update", "Next 20 steps after Build 205"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 205 known gaps", "Gallery Approvals"],
    "README.md": ["Build 205 note"],
    "DOC_INDEX.md": ["Build 205 documentation index note"],
    "DATABASE_STRUCTURE_CURRENT.md": ["Build 205 schema note"],
    "SUPABASE_SCHEMA.sql": ["Build 205 note"],
}

def fail(message: str) -> int:
    print(f"Build 205 check failed: {message}")
    return 1

def main() -> int:
    for rel in REQUIRED:
        if not (ROOT / rel).exists():
            return fail(f"missing {rel}")
    try:
        data = json.loads((ROOT / "data/value_added_feature_backlog.json").read_text())
    except Exception as exc:
        return fail(f"value_added_feature_backlog.json is invalid JSON: {exc}")
    if data.get("build") != 205:
        return fail("value_added_feature_backlog.json build is not 205")
    if len(data.get("highest_value_next", [])) < 10:
        return fail("value backlog should include at least 10 high-value priorities")
    for rel, needles in TOKENS.items():
        text = (ROOT / rel).read_text(errors="ignore")
        for needle in needles:
            if needle not in text:
                return fail(f"{rel} missing token: {needle}")
    root = (ROOT / "admin-sanity.html").read_text(errors="ignore")
    route = (ROOT / "admin-sanity/index.html").read_text(errors="ignore")
    if root != route:
        return fail("admin-sanity route copy is out of sync")
    print("Build 205 sanity/value roadmap check passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
