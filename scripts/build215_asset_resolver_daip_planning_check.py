#!/usr/bin/env python3
"""Build 215 guard: public asset format compatibility and DAIP planning-only integration."""
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
    require("assets/media-source-resolver.js")
    require("docs/digital-asset-intelligence-platform/10_Rosie_Dazzlers_Integration_Plan.md")
    require("sql/2026-06-30_build215_media_asset_format_alignment.sql")
    require("data/build215_media_asset_daip_planning.json")

    contains(
        "assets/media-source-resolver.js",
        ".jpg",
        ".jpeg",
        ".webp",
        ".png",
        "bindImageWithCandidates",
    )
    contains(
        "assets/landing-page.js",
        "local_hero_image_url",
        "bindImageWithCandidates",
    )
    contains(
        "functions/api/landing_pages_public.js",
        "local_hero_image_url",
        "local_hero_r2_key",
    )
    contains(
        "functions/api/admin/media_asset_health_scan.js",
        "resolved_url",
        "used_format_fallback",
        "JPG/JPEG/WebP/PNG",
    )
    contains(
        "admin-media-health.html",
        "Resolved URL",
        "compatible file format",
    )
    contains(
        "AI_PROJECT_HANDOFF.md",
        "Build 215",
        "DAIP",
        "adds no DAIP production code",
    )
    contains(
        "MASTER_VALUE_ROADMAP.md",
        "Build 215",
        "DAIP",
    )
    contains(
        "KNOWN_GAPS_AND_RISKS.md",
        "Build 215",
        "DAIP is planning only",
    )
    contains(
        "docs/digital-asset-intelligence-platform/10_Rosie_Dazzlers_Integration_Plan.md",
        "no production DAIP code",
        "DAIP-0",
        "automatic publishing",
    )

    try:
        record = json.loads((ROOT / "data/build215_media_asset_daip_planning.json").read_text(encoding="utf-8"))
        if record.get("build") != 215:
            errors.append("Build 215 data record has the wrong build number.")
        if record.get("daip", {}).get("status") != "planning_only":
            errors.append("Build 215 data record must keep DAIP planning-only.")
        if record.get("daip", {}).get("production_code_added") is not False:
            errors.append("Build 215 data record must state no DAIP production code was added.")
    except Exception as exc:
        errors.append(f"Could not parse Build 215 data record: {exc}")

    for rel in [
        "data/media_requirements.json",
        "data/image_requirements_build184.json",
        "data/image_requirements_build185.json",
    ]:
        try:
            payload = json.loads((ROOT / rel).read_text(encoding="utf-8"))
            rows = payload.get("required_assets", [])
            regional = [row for row in rows if row.get("category") == "regional" or row.get("role") == "regional"]
            if not regional:
                errors.append(f"{rel} has no regional Local Hero requirements.")
            elif not all(str(row.get("r2_key", "")).lower().endswith(".jpg") for row in regional):
                errors.append(f"{rel} regional Local Hero rows must use canonical JPG keys.")
        except Exception as exc:
            errors.append(f"Could not parse {rel}: {exc}")

    if errors:
        print("Build 215 asset/DAIP planning check failed:")
        for row in errors:
            print(f"- {row}")
        return 1
    print("Build 215 asset resolver/DAIP planning checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
