#!/usr/bin/env python3
"""Build 196 guard: reported live admin errors stay fixed."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def require(condition, message):
    if not condition:
        print(f"Build 196 check failed: {message}")
        raise SystemExit(1)


def main():
    local = read("functions/api/admin/local_seo_proof_report.js")
    require("export async function onRequestGet(context)" in local, "local SEO proof report must support GET for Admin Dashboard")
    require("export async function onRequestPost(context)" in local, "local SEO proof report must keep POST for Admin Analytics")
    require('"GET,POST,OPTIONS"' in local, "local SEO proof report CORS must allow GET and POST")
    require("recommendations: proof_recommendations" in local, "proof report must expose recommendations alias")
    require("next_proof_recommendations: proof_recommendations" in local, "proof report must expose next_proof_recommendations alias")
    require("gaps: proof_recommendations" in local, "proof report must expose gaps alias")

    for rel in ["admin-app.html", "admin-app/index.html"]:
        app = read(rel)
        require("function esc(value){ return escapeHtml(value); }" in app, f"{rel} must define local esc helper")
        require("partial pricing data" in app and "backfill missing arrays" in app, f"{rel} must explain partial pricing fallback hydration")
        require("if ((!Array.isArray(shaped.addons) || !shaped.addons.length)" in app, f"{rel} must backfill missing add-ons")
        require("Live pricing catalog API was unavailable" in app, f"{rel} must fall back when pricing API is unavailable")
        require("Landing page builder could not find add-ons" in app, f"{rel} must warn when add-ons are still unavailable")

    require(read("admin-app.html") == read("admin-app/index.html"), "admin-app route copy must match root file")
    require("Build 196 update" in read("DEVELOPMENT_ROADMAP.md"), "roadmap must document Build 196")
    require("Build 196 known gaps" in read("KNOWN_GAPS_AND_RISKS.md"), "known gaps must document Build 196")
    require("Build 196 schema status" in read("DATABASE_STRUCTURE_CURRENT.md"), "database structure doc must include Build 196 schema status")
    require("Build 196 admin live-error repair pass" in read("SUPABASE_SCHEMA.sql"), "schema snapshot must include Build 196 no-DDL note")
    require((ROOT / "sql/2026-06-06_build196_admin_live_error_repairs_no_ddl_note.sql").exists(), "Build 196 no-DDL SQL note must exist")
    print("Build 196 admin live-error repair check passed.")


if __name__ == "__main__":
    main()
