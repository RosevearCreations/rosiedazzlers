#!/usr/bin/env python3
"""Build 187 local-page water-rule visibility guard, adapted for Build 188 editable authority."""
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "tillsonburg-auto-detailing/index.html",
    "woodstock-ingersoll-auto-detailing/index.html",
    "norwich-otterville-auto-detailing/index.html",
    "zorra-thamesford-embro-auto-detailing/index.html",
    "simcoe-delhi-auto-detailing/index.html",
    "port-dover-auto-detailing/index.html",
    "waterford-vittoria-auto-detailing/index.html",
    "port-rowan-turkey-point-auto-detailing/index.html",
]

def fail(msg: str) -> int:
    print(f"Build 187 check failed: {msg}")
    return 1

def main() -> int:
    required = [
        "data/water_restriction_rules.json",
        "assets/landing-page.js",
        "landing_pages_public.js",
        "functions/api/landing_pages_public.js",
        "functions/api/water_restrictions_public.js",
        "sql/2026-06-03_build187_local_page_water_rules_no_ddl_note.sql",
    ]
    for rel in required:
        if not (ROOT / rel).exists(): return fail(f"missing {rel}")
    rules = json.loads((ROOT / "data/water_restriction_rules.json").read_text(encoding="utf-8"))
    local = rules.get("local_page_rules") or {}
    for rel in PAGES:
        slug = Path(rel).parts[0]
        if slug not in local: return fail(f"stable authority missing local page rule for {slug}")
        text = (ROOT / rel).read_text(encoding="utf-8")
        if "data-local-water-rule" not in text: return fail(f"{rel} missing dynamic water-rule mount")
        if text.lower().count("<h1") != 1: return fail(f"{rel} should have exactly one H1")
    landing = (ROOT / "assets/landing-page.js").read_text(encoding="utf-8")
    if "loadWaterRuleForSlug" not in landing or "/api/water_restrictions_public" not in landing:
        return fail("landing page client does not load editable water rules")
    for rel in ["landing_pages_public.js", "functions/api/landing_pages_public.js"]:
        text = (ROOT / rel).read_text(encoding="utf-8")
        if "VERIFIED_LOCAL_WATER_RULES" in text or "applyVerifiedLocalWaterRules" in text:
            return fail(f"{rel} still contains the old hard-coded water-rule implementation")
    print("Build 187 local-page water rules check passed under Build 188 authority.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
