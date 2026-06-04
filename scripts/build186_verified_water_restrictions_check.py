#!/usr/bin/env python3
"""Build 186 historical water-restriction accuracy guard, adapted for Build 188 authority."""
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def fail(msg: str) -> int:
    print(f"Build 186 check failed: {msg}")
    return 1

def main() -> int:
    required = [
        "data/service_area_rules.json",
        "data/water_restriction_rules.json",
        "functions/api/water_restrictions_public.js",
        "functions/api/admin/water_restrictions_audit.js",
        "sql/2026-06-02_build186_verified_water_restrictions_no_ddl_note.sql",
    ]
    for rel in required:
        if not (ROOT / rel).exists(): return fail(f"missing {rel}")
    rules = json.loads((ROOT / "data/water_restriction_rules.json").read_text(encoding="utf-8"))
    keys = {row.get("key") for row in rules.get("rules") or []}
    if not {"oxford-county-seasonal", "norfolk-county-seasonal"}.issubset(keys):
        return fail("stable water-rule authority is missing Oxford or Norfolk rule")
    service = json.loads((ROOT / "data/service_area_rules.json").read_text(encoding="utf-8"))
    rows = service.get("service_areas") or []
    if not rows or any("water_rule" in row for row in rows):
        return fail("service-area rows must reference water_rule_key without duplicated water_rule text")
    if any(not row.get("water_rule_key") for row in rows if row.get("county") in {"Oxford County", "Norfolk County"}):
        return fail("Oxford/Norfolk service-area row missing water_rule_key")
    print("Build 186 verified water restrictions check passed under Build 188 authority.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
