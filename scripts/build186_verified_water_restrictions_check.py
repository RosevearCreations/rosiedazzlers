#!/usr/bin/env python3
"""Build 186 verified water-restriction accuracy guard."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OXFORD_PHRASE = "May 1–September 30 under Oxford County By-law No. 4193-2002"
NORFOLK_PHRASE = "May 15–September 15 under the Water Restriction By-law"
REQUIRED = [
    "data/service_area_rules.json",
    "data/water_restriction_rules_build186.json",
    "functions/api/water_restrictions_public.js",
    "functions/api/admin/water_restrictions_audit.js",
    "sql/2026-06-02_build186_verified_water_restrictions_no_ddl_note.sql",
]
FORBIDDEN = [
    "Oxford County default:",
    "Norfolk County default:",
    "generally from 9–11",
    "generally using 9–11",
    "morning/evening time windows and odd/even address days",
    "residential hours of 6–9 a.m.",
]
TEXT_FILES = [
    "book.html",
    "book/index.html",
    "admin-app.html",
    "admin-app/index.html",
    "landing_pages_public.js",
    "functions/api/landing_pages_public.js",
]


def fail(msg: str) -> int:
    print(f"Build 186 check failed: {msg}")
    return 1


def main() -> int:
    for rel in REQUIRED:
        if not (ROOT / rel).exists():
            return fail(f"missing {rel}")

    data = json.loads((ROOT / "data/service_area_rules.json").read_text(encoding="utf-8"))
    if data.get("verified_sources_at") != "2026-06-02":
        return fail("service_area_rules verified_sources_at was not updated")
    rows = data.get("service_areas") or []
    if not rows:
        return fail("service_area_rules has no service_areas")

    oxford = [row for row in rows if row.get("county") == "Oxford County"]
    norfolk = [row for row in rows if row.get("county") == "Norfolk County"]
    if not oxford or not norfolk:
        return fail("expected both Oxford County and Norfolk County rows")

    bad_oxford = [row.get("label") for row in oxford if OXFORD_PHRASE not in str(row.get("water_rule") or "")]
    bad_norfolk = [row.get("label") for row in norfolk if NORFOLK_PHRASE not in str(row.get("water_rule") or "")]
    if bad_oxford:
        return fail(f"Oxford water rule missing verified phrase for {bad_oxford[:5]}")
    if bad_norfolk:
        return fail(f"Norfolk water rule missing verified phrase for {bad_norfolk[:5]}")

    rules = json.loads((ROOT / "data/water_restriction_rules_build186.json").read_text(encoding="utf-8"))
    payload = json.dumps(rules, ensure_ascii=False)
    for phrase in (OXFORD_PHRASE, NORFOLK_PHRASE):
        if phrase not in payload:
            return fail(f"canonical rules file missing phrase: {phrase}")

    for rel in TEXT_FILES:
        text = (ROOT / rel).read_text(encoding="utf-8")
        for forbidden in FORBIDDEN:
            if forbidden in text:
                return fail(f"stale water-rule wording remains in {rel}: {forbidden}")
        if rel in {"book.html", "book/index.html", "admin-app.html", "admin-app/index.html"}:
            if OXFORD_PHRASE not in text or NORFOLK_PHRASE not in text:
                return fail(f"verified water rule phrase missing in {rel}")

    release = (ROOT / "scripts/release_check.py").read_text(encoding="utf-8")
    if "scripts/build186_verified_water_restrictions_check.py" not in release:
        return fail("release_check.py does not include Build 186 guard")

    print("Build 186 verified water restrictions check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
