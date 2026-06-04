#!/usr/bin/env python3
"""Build 188 editable water-rule authority and hard-coding audit guard."""
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def fail(msg: str) -> int:
    print(f"Build 188 check failed: {msg}")
    return 1

def main() -> int:
    required = [
        "data/water_restriction_rules.json",
        "data/editable_content_registry_build188.json",
        "EDITABLE_CONTENT_SANITY_CHECK.md",
        "functions/api/_lib/water-restrictions.js",
        "functions/api/admin/water_restriction_rules.js",
        "functions/api/admin/editable_content_audit.js",
        "functions/api/water_restrictions_public.js",
        "functions/api/service_area_rules_public.js",
        "admin-water-rules.html",
        "admin-water-rules/index.html",
        "sql/2026-06-04_build188_editable_water_rules_hardcoding_audit.sql",
    ]
    for rel in required:
        if not (ROOT / rel).exists(): return fail(f"missing {rel}")
    rules = json.loads((ROOT / "data/water_restriction_rules.json").read_text(encoding="utf-8"))
    if rules.get("version") != "188": return fail("stable water-rule fallback is not version 188")
    if len(rules.get("rules") or []) < 2: return fail("stable water-rule fallback must include Oxford and Norfolk")
    service = json.loads((ROOT / "data/service_area_rules.json").read_text(encoding="utf-8"))
    rows = service.get("service_areas") or []
    if any("water_rule" in row for row in rows): return fail("service-area rows still duplicate mutable water_rule text")
    if any(not row.get("water_rule_key") for row in rows if row.get("county") in {"Oxford County", "Norfolk County"}):
        return fail("service-area row missing water_rule_key")
    forbidden = ["VERIFIED_LOCAL_WATER_RULES", "applyVerifiedLocalWaterRules", "const RULES ="]
    for rel in ["functions/api/landing_pages_public.js", "landing_pages_public.js", "functions/api/water_restrictions_public.js"]:
        text = (ROOT / rel).read_text(encoding="utf-8")
        for token in forbidden:
            if token in text: return fail(f"{rel} contains old hard-coded token {token}")
    for rel in ["_lib/pricing-catalog.js", "functions/api/_lib/pricing-catalog.js", "functions/api/admin/_lib/pricing-catalog.js"]:
        text = (ROOT / rel).read_text(encoding="utf-8")
        if "const FALLBACK_CATALOG = {" in text: return fail(f"{rel} still embeds giant mutable catalog JSON")
        if "rosie_services_pricing_and_packages.json" not in text: return fail(f"{rel} does not import stable catalog fallback")
    redirects = (ROOT / "_redirects").read_text(encoding="utf-8")
    if "/landing/* /landing/index.html 200" in redirects: return fail("_redirects still contains Cloudflare infinite-loop rule")
    registry = json.loads((ROOT / "data/editable_content_registry_build188.json").read_text(encoding="utf-8"))
    if registry.get("domains_recommended_editable", 0) < 30: return fail("editable content audit is incomplete")
    release = (ROOT / "scripts/release_check.py").read_text(encoding="utf-8")
    if "scripts/build188_editable_water_rules_hardcoding_audit_check.py" not in release:
        return fail("release_check.py does not include Build 188 guard")
    print("Build 188 editable water rules and hard-coding audit check passed.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
