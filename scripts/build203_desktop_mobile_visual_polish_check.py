#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

def require(path, text=None):
    p = ROOT / path
    if not p.exists():
        raise SystemExit(f"Missing required file: {path}")
    data = p.read_text(encoding="utf-8", errors="ignore")
    if text and text not in data:
        raise SystemExit(f"Missing expected text in {path}: {text}")
    return data

registry = json.loads(require("data/responsive_visual_registry.json"))
if registry.get("version") != "203.0.0":
    raise SystemExit("responsive_visual_registry.json must be version 203.0.0")
if len(registry.get("device_targets", [])) < 3:
    raise SystemExit("responsive_visual_registry.json must define mobile/tablet/desktop targets")
if len(registry.get("visual_slots", [])) < 5:
    raise SystemExit("responsive_visual_registry.json must define key visual slots")

css = require("assets/site.css", "Build 203: desktop/mobile visual polish")
for token in ["visual-showcase", "mobile-only", "desktop-only", "prefers-reduced-motion"]:
    if token not in css:
        raise SystemExit(f"assets/site.css missing responsive token: {token}")

chrome = require("assets/chrome.js", "function setViewportTier()")
for token in ["enhanceProfessionalImages", "data-viewport-tier-label", "dataset.viewportTier"]:
    if token not in chrome:
        raise SystemExit(f"assets/chrome.js missing Build 203 token: {token}")

index = require("index.html", "data-build203=\"responsive-visual-showcase\"")
if index.lower().count("<h1") != 1:
    raise SystemExit("index.html must still have exactly one H1")

admin = require("admin.html", "responsiveVisualDiagnostics")
for token in ["loadResponsiveVisualDiagnostics", "/api/admin/responsive_visual_report"]:
    if token not in admin:
        raise SystemExit(f"admin.html missing dashboard diagnostic token: {token}")

require("functions/api/admin/responsive_visual_report.js", "Build 203")
require("sql/2026-06-12_build203_desktop_mobile_visual_polish_no_ddl_note.sql", "No database migration")
require("DEVELOPMENT_ROADMAP.md", "Build 203 — 20 completed items")
require("KNOWN_GAPS_AND_RISKS.md", "Build 203 known gaps and risks")
require("DATABASE_STRUCTURE_CURRENT.md", "Build 203 database update")
require("SUPABASE_SCHEMA.sql", "Build 203 desktop/mobile visual polish note")

# Route copy must match after sync.
root_admin = require("admin.html")
route_admin = require("admin/index.html")
if root_admin != route_admin:
    raise SystemExit("admin/index.html route copy must match admin.html")

print("Build 203 desktop/mobile visual polish check passed.")
