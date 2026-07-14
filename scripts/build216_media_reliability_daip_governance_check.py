#!/usr/bin/env python3
"""Build 216 guard: public media recovery reliability and DAIP governance-only planning."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def require(rel: str) -> Path:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"Missing required file: {rel}")
    return path


def contains(rel: str, *needles: str) -> None:
    path = require(rel)
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{rel} missing expected text: {needle}")


def main() -> int:
    required = [
        "assets/media-source-resolver.js",
        "functions/api/admin/media_asset_health_scan.js",
        "functions/api/admin/media_asset_alerts_list.js",
        "functions/api/admin/media_asset_alert_action.js",
        "admin-media-health.html",
        "sql/2026-07-01_build216_media_reliability_daip_governance.sql",
        "data/build216_media_reliability_daip_governance.json",
        "docs/digital-asset-intelligence-platform/11_DAIP_Decision_Register.md",
        "docs/digital-asset-intelligence-platform/12_DAIP_Phase_1_Security_Acceptance.md",
    ]
    for rel in required:
        require(rel)

    contains(
        "assets/media-source-resolver.js",
        "DEFAULT_CANDIDATE_TIMEOUT_MS",
        "rosie:media-resolved",
        "rosie:media-exhausted",
        ".jpg",
        ".jpeg",
        ".webp",
        ".png",
    )
    contains(
        "functions/api/admin/media_asset_health_scan.js",
        "SCAN_CONCURRENCY",
        "FETCH_TIMEOUT_MS",
        "rosie_record_media_asset_observations",
        "not_found",
        "not_public",
        "timeout",
        "unexpected_content_type",
    )
    contains(
        "admin-media-health.html",
        "Persistent public-media alerts",
        "media_asset_alerts_list",
        "media_asset_alert_action",
        "two consecutive failed scans",
    )
    contains(
        "sql/2026-07-01_build216_media_reliability_daip_governance.sql",
        "media_asset_health_observations",
        "media_asset_alerts",
        "enable row level security",
        "revoke all on table",
        "rosie_record_media_asset_observations",
        "consecutive_failures + 1 >= 2",
        "grant execute",
    )
    for rel in [
        "AI_PROJECT_HANDOFF.md",
        "MASTER_VALUE_ROADMAP.md",
        "KNOWN_GAPS_AND_RISKS.md",
        "DATABASE_STRUCTURE_CURRENT.md",
        "SUPABASE_SCHEMA.sql",
        "IMAGES.md",
        "DOC_INDEX.md",
        "docs/PRODUCTION_TEST_GUIDE.md",
    ]:
        contains(rel, "Build 216")
    contains(
        "docs/digital-asset-intelligence-platform/11_DAIP_Decision_Register.md",
        "DAIP-0",
        "Open",
        "no DAIP production implementation",
    )
    contains(
        "docs/digital-asset-intelligence-platform/12_DAIP_Phase_1_Security_Acceptance.md",
        "Planning template only",
        "Row-Level Security",
        "No public export",
    )

    try:
        record = json.loads((ROOT / "data/build216_media_reliability_daip_governance.json").read_text(encoding="utf-8"))
        if record.get("build") != 216:
            errors.append("Build 216 data record has the wrong build number.")
        if record.get("daip", {}).get("status") != "planning_only":
            errors.append("Build 216 must preserve DAIP planning-only status.")
        if record.get("daip", {}).get("production_code_added") is not False:
            errors.append("Build 216 data record must say no DAIP production code was added.")
        if record.get("implemented", {}).get("persistent_alerts_after_two_failed_scans") is not True:
            errors.append("Build 216 data record must document the two-scan alert threshold.")
    except Exception as exc:
        errors.append(f"Could not parse Build 216 data record: {exc}")

    if errors:
        print("Build 216 media reliability/DAIP governance check failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Build 216 media reliability/DAIP governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
