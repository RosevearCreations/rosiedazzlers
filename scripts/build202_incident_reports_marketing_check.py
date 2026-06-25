#!/usr/bin/env python3
"""Build 202 guard for incident reports, customer-safe publication, and marketing tracker."""
from __future__ import annotations

import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        raise AssertionError(f"Missing required file: {rel}")
    return path.read_text(encoding="utf-8")


def require(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise AssertionError(f"Missing {label}: {needle}")


def check_inline_js(rel: str) -> None:
    text = read(rel)
    for idx, match in enumerate(re.finditer(r"<script([^>]*)>(.*?)</script>", text, re.S), start=1):
        attrs = match.group(1)
        code = match.group(2).strip()
        if not code or "src=" in attrs:
            continue
        suffix = ".mjs" if "type=\"module\"" in attrs or "type='module'" in attrs else ".js"
        with tempfile.NamedTemporaryFile("w", suffix=suffix, delete=False) as tmp:
            tmp.write(code)
            tmp_path = Path(tmp.name)
        try:
            result = subprocess.run(["node", "--check", str(tmp_path)], cwd=ROOT, text=True, capture_output=True)
            if result.returncode != 0:
                raise AssertionError(f"Inline JS syntax failed in {rel} script {idx}: {result.stderr}")
        finally:
            tmp_path.unlink(missing_ok=True)


def main() -> int:
    incident_page = read("admin-incident-reports.html")
    incident_route = read("admin-incident-reports/index.html")
    marketing_page = read("admin-marketing.html")
    marketing_route = read("admin-marketing/index.html")
    admin = read("admin.html")
    admin_route = read("admin/index.html")
    progress = read("progress/index.html")
    progress_view = read("functions/api/progress/view.js")
    save_api = read("functions/api/admin/incident_report_save.js")
    list_api = read("functions/api/admin/incident_reports_list.js")
    upload_api = read("functions/api/admin/incident_report_upload.js")
    public_api = read("functions/api/progress/incident_reports.js")
    auth = read("assets/admin-auth.js")
    sql = read("sql/2026-06-12_build202_incident_reports_and_marketing.sql")
    schema = read("SUPABASE_SCHEMA.sql")
    roadmap = read("DEVELOPMENT_ROADMAP.md")
    gaps = read("KNOWN_GAPS_AND_RISKS.md")
    dbdoc = read("DATABASE_STRUCTURE_CURRENT.md")
    detailer_doc = read("DETAILER_MARKETING_NOTES_APPLIED.md")
    release_check = read("scripts/release_check.py")
    sync_script = read("scripts/sync_route_copies.py")

    if incident_page != incident_route:
        raise AssertionError("admin-incident-reports route copy is not synchronized")
    if marketing_page != marketing_route:
        raise AssertionError("admin-marketing route copy is not synchronized")
    if admin != admin_route:
        raise AssertionError("admin route copy is not synchronized")

    require(incident_page, 'data-build202="incident-report-workflow"', "incident page marker")
    require(incident_page, "Photo evidence is required", "evidence requirement copy")
    require(incident_page, "Publish approved summary", "customer visibility control")
    require(incident_page, "private_admin_discussion", "private admin field wiring")
    require(incident_page, "public_evidence_items", "public evidence field wiring")
    require(incident_page, "/api/admin/incident_report_upload", "evidence upload endpoint wiring")
    require(incident_page, "/api/admin/incident_report_save", "incident save endpoint wiring")

    require(save_api, "At least one photo evidence", "server evidence requirement")
    require(save_api, "Only admin/booking managers can publish", "server manager publish gate")
    require(save_api, "Approved customer summary is required", "server customer summary requirement")
    require(save_api, "Select at least one approved customer-visible evidence photo", "server public evidence requirement")
    require(save_api, "private_admin_discussion", "server private discussion field")
    require(upload_api, "incident-reports/", "R2 incident prefix")
    require(upload_api, "Incident evidence must be an image", "image upload validation")
    require(list_api, "incident_reports", "list endpoint table access")

    require(public_api, "public_visible=eq.true", "public endpoint only returns visible reports")
    require(progress_view, "incident_reports", "progress view incident reports payload")
    require(progress, "Approved incident reports", "customer progress incident section")
    require(progress, "renderIncidentReports", "customer progress renderer")
    require(progress, "Private staff/admin discussion is never shown", "customer privacy copy")

    require(marketing_page, 'data-build202="detailer-marketing-tracker"', "marketing page marker")
    require(marketing_page, "Cost per lead", "CPL calculator")
    require(marketing_page, "Customer acquisition cost", "CAC calculator")
    require(marketing_page, "Quote pipeline", "quote pipeline calculator")
    require(marketing_page, "SEO + Meta + CRM", "marketing strategy labels")

    require(admin, "admin-incident-reports.html", "dashboard incident link")
    require(admin, "admin-marketing.html", "dashboard marketing link")
    require(auth, 'case "admin-incident-reports"', "auth page access")
    require(auth, 'case "admin-marketing"', "marketing page access")

    require(sql, "CREATE TABLE IF NOT EXISTS public.incident_reports", "incident report migration")
    require(sql, "public_visible boolean NOT NULL DEFAULT false", "public visibility field")
    require(sql, "approved_customer_summary", "approved customer summary field")
    require(schema, "Build 202 incident reports", "schema Build 202 note")
    require(schema, "CREATE TABLE IF NOT EXISTS public.incident_reports", "schema incident table")

    require(roadmap, "Build 202 — 20 completed items", "roadmap completed list")
    require(roadmap, "Next 20 steps after Build 202", "roadmap next steps")
    require(gaps, "Build 202 known gaps and risks", "known gaps update")
    require(dbdoc, "Build 202 database update", "database doc update")
    require(detailer_doc, "SEO + Meta + CRM", "detailer source strategy doc")
    require(release_check, "scripts/build202_incident_reports_marketing_check.py", "release check registration")
    require(sync_script, "admin-incident-reports.html", "route sync incident page")
    require(sync_script, "admin-marketing.html", "route sync marketing page")

    for rel in [
        "functions/api/admin/incident_report_save.js",
        "functions/api/admin/incident_reports_list.js",
        "functions/api/admin/incident_report_upload.js",
        "functions/api/progress/incident_reports.js",
    ]:
        result = subprocess.run(["node", "--check", rel], cwd=ROOT, text=True, capture_output=True)
        if result.returncode != 0:
            raise AssertionError(f"Node syntax failed for {rel}: {result.stderr}")

    check_inline_js("admin-incident-reports.html")
    check_inline_js("admin-marketing.html")
    check_inline_js("progress/index.html")
    check_inline_js("admin.html")

    print("Build 202 incident reports and marketing guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
