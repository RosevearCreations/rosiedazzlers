#!/usr/bin/env python3
"""Build 197 guard: self-healing admin diagnostics, pricing repair, route parity, and landing SEO warnings."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
missing = []

def read(rel):
    path = ROOT / rel
    if not path.exists():
        missing.append(f"{rel}: missing file")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")

def need(rel, needles):
    text = read(rel)
    for needle in needles:
        if needle not in text:
            missing.append(f"{rel}: missing {needle!r}")
    return text

need("functions/api/admin/pricing_catalog_diagnostics.js", ["Build 197", "compareCatalog", "missing_groups", "repair_available", "GET,POST,OPTIONS"])
need("functions/api/admin/pricing_catalog_repair.js", ["Build 197", "buildRepairedCatalog", "repaired_from_fallback_at", "Only missing fallback pricing groups/rows"])
need("functions/api/admin/route_copy_parity_report.js", ["Build 197", "TARGETS", "content_drift", "Root and route copy match", "GET,POST,OPTIONS"])
for rel in ["admin.html", "admin/index.html"]:
    need(rel, ["data-build197=\"dashboard-self-healing-diagnostics\"", "pricingCatalogDiagnostics", "routeCopyDiagnostics", "loadPricingCatalogDiagnostics", "repairPricingCatalog", "loadRouteCopyDiagnostics", "guardedLoad", "Promise.allSettled"])
for rel in ["admin-app.html", "admin-app/index.html"]:
    need(rel, ["data-build197=\"landing-seo-readiness\"", "landingReadinessRows", "landingReadinessHtml", "validateLandingPageBeforeSave", "SEO/readiness preview", "Open public preview"])
if read("admin.html") != read("admin/index.html"):
    missing.append("admin route copy must match root file")
if read("admin-app.html") != read("admin-app/index.html"):
    missing.append("admin-app route copy must match root file")
for rel in ["DEVELOPMENT_ROADMAP.md", "KNOWN_GAPS_AND_RISKS.md", "DATABASE_STRUCTURE_CURRENT.md", "SUPABASE_SCHEMA.sql", "README.md", "DOC_INDEX.md"]:
    need(rel, ["Build 197"])
need("sql/2026-06-06_build197_self_healing_admin_no_ddl_note.sql", ["Build 197", "No database schema changes"])

if missing:
    print("Build 197 self-healing admin check failed:")
    for item in missing:
        print(" -", item)
    sys.exit(1)
print("Build 197 self-healing admin check passed.")
