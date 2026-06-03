#!/usr/bin/env python3
"""Build 187 verified local-page water-rule visibility guard."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

OXFORD_PHRASES = [
    "May 1 to September 30",
    "vehicle washing and power washing",
    "Residential windows are 6:00–9:00 a.m. or 6:00–9:00 p.m.",
    "commercial/industrial windows are 8:00–10:00 a.m. or 3:00–5:00 p.m.",
]
NORFOLK_PHRASES = [
    "May 15 to September 15",
    "9:00–11:00 a.m. and 7:00–10:00 p.m.",
    "odd-numbered houses use odd calendar days",
    "even-numbered houses use even calendar days",
]
OXFORD_PAGES = [
    "tillsonburg-auto-detailing/index.html",
    "woodstock-ingersoll-auto-detailing/index.html",
    "norwich-otterville-auto-detailing/index.html",
    "zorra-thamesford-embro-auto-detailing/index.html",
]
NORFOLK_PAGES = [
    "simcoe-delhi-auto-detailing/index.html",
    "port-dover-auto-detailing/index.html",
    "waterford-vittoria-auto-detailing/index.html",
    "port-rowan-turkey-point-auto-detailing/index.html",
]
REQUIRED_FILES = [
    "data/water_restriction_rules_build187.json",
    "data/service_area_rules.json",
    "data/local_seo_targets.json",
    "assets/landing-page.js",
    "landing_pages_public.js",
    "functions/api/landing_pages_public.js",
    "functions/api/water_restrictions_public.js",
    "sql/2026-06-03_build187_local_page_water_rules_no_ddl_note.sql",
]


def fail(msg: str) -> int:
    print(f"Build 187 check failed: {msg}")
    return 1


def assert_text(rel: str, phrases: list[str]) -> int:
    path = ROOT / rel
    if not path.exists():
        return fail(f"missing {rel}")
    text = path.read_text(encoding="utf-8")
    if "Verified local water-use reminder" not in text:
        return fail(f"{rel} is missing visible static water-use reminder")
    for phrase in phrases:
        if phrase not in text:
            return fail(f"{rel} missing phrase: {phrase}")
    if text.lower().count("<h1") != 1:
        return fail(f"{rel} should have exactly one H1")
    return 0


def main() -> int:
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).exists():
            return fail(f"missing {rel}")

    for rel in OXFORD_PAGES:
        code = assert_text(rel, OXFORD_PHRASES)
        if code:
            return code
    for rel in NORFOLK_PAGES:
        code = assert_text(rel, NORFOLK_PHRASES)
        if code:
            return code

    rules = json.loads((ROOT / "data/water_restriction_rules_build187.json").read_text(encoding="utf-8"))
    payload = json.dumps(rules, ensure_ascii=False)
    for phrase in OXFORD_PHRASES + NORFOLK_PHRASES:
        if phrase not in payload:
            return fail(f"canonical Build 187 rules payload missing phrase: {phrase}")

    service_rules = json.loads((ROOT / "data/service_area_rules.json").read_text(encoding="utf-8"))
    municipalities = {str(row.get("municipality") or "").lower() for row in service_rules.get("service_areas") or []}
    if "zorra" not in municipalities:
        return fail("Zorra Township service-area fallback is missing")

    landing_js = (ROOT / "assets/landing-page.js").read_text(encoding="utf-8")
    if "waterNoteForPage" not in landing_js or "local-water-note" not in landing_js:
        return fail("assets/landing-page.js does not render the dedicated Build 187 water card")

    for rel in ["landing_pages_public.js", "functions/api/landing_pages_public.js"]:
        text = (ROOT / rel).read_text(encoding="utf-8")
        if "VERIFIED_LOCAL_WATER_RULES" not in text or "applyVerifiedLocalWaterRules" not in text:
            return fail(f"{rel} does not enforce verified local water rules")

    release = (ROOT / "scripts/release_check.py").read_text(encoding="utf-8")
    if "scripts/build187_local_page_water_rules_check.py" not in release:
        return fail("release_check.py does not include Build 187 guard")

    print("Build 187 local-page water rules check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
