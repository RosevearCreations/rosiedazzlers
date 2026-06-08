#!/usr/bin/env python3
"""Build 199 guard for friendly Admin Site Settings domain editors."""
from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        raise AssertionError(f"Missing required file: {rel}")
    return path.read_text(encoding="utf-8")


def require(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise AssertionError(f"Missing {label}: {needle}")


def forbid(text: str, needle: str, label: str) -> None:
    if needle in text:
        raise AssertionError(f"Forbidden {label}: {needle}")


def main() -> int:
    site = read("admin-site-settings.html")
    site_route = read("admin-site-settings/index.html")
    recovery = read("admin-recovery.html")
    recovery_route = read("admin-recovery/index.html")
    schema = read("SUPABASE_SCHEMA.sql")
    roadmap = read("DEVELOPMENT_ROADMAP.md")
    gaps = read("KNOWN_GAPS_AND_RISKS.md")
    dbdoc = read("DATABASE_STRUCTURE_CURRENT.md")

    if site != site_route:
        raise AssertionError("admin-site-settings.html and admin-site-settings/index.html are not synchronized")
    if recovery != recovery_route:
        raise AssertionError("admin-recovery.html and admin-recovery/index.html are not synchronized")

    require(site, 'data-build199="friendly-site-setting-domain-editors"', "Build 199 site settings marker")
    require(site, "Advanced JSON fallback / emergency repair", "collapsed advanced JSON panel")
    require(site, "friendlyDomainEditor", "friendly domain editor dispatcher")
    require(site, "renderNavigationFooterEditor", "navigation/footer friendly editor")
    require(site, "renderAnalyticsRegistryEditor", "analytics registry friendly editor")
    require(site, "renderMediaRequirementsEditor", "media requirements friendly editor")
    require(site, "renderLandingContentEditor", "landing content friendly editor")
    require(site, "renderHolidayClosureEditor", "holiday closure friendly editor")
    require(site, "applyFriendlyDomainRows", "friendly row apply bridge")
    require(site, "Footer groups", "footer group editor label")
    require(site, "Landing-page SEO and hero cards", "landing page card editor label")
    forbid(site, 'jsonField("Navigation links"', "routine navigation JSON helper")
    forbid(site, 'jsonField("Known events JSON"', "routine analytics JSON helper")
    forbid(site, 'jsonField("Required assets JSON"', "routine media JSON helper")
    forbid(site, 'jsonField("Pages / landing content JSON"', "routine landing JSON helper")
    forbid(site, 'jsonField("Holiday closures JSON"', "routine holiday JSON helper")

    require(recovery, 'data-build199="friendly-recovery-rules-editor"', "Build 199 recovery marker")
    require(recovery, "Delivery rules", "friendly recovery rules panel")
    require(recovery, "ruleSendWindow", "send-window field")
    require(recovery, "setRulesEditor", "rules hydration helper")
    require(recovery, "Advanced rules JSON", "advanced recovery JSON fallback")

    require(schema, "Build 199 friendly Site Settings editor pass", "schema no-DDL note")
    require(read("sql/2026-06-07_build199_friendly_site_settings_editors_no_ddl_note.sql"), "No database schema changes are required", "Build 199 SQL no-DDL note")
    require(roadmap, "Build 199 — 20 completed items", "roadmap completed list")
    require(roadmap, "Next 20 steps after Build 199", "roadmap next steps")
    require(gaps, "Build 199 known gaps and risks", "known gaps update")
    require(dbdoc, "Build 199 schema status", "database structure update")

    # Keep schema file SQL-comment safe for the newly touched notes.
    for i, line in enumerate(schema.splitlines(), start=1):
        if line.startswith("##") or line == "---" or line.startswith("- "):
            raise AssertionError(f"SUPABASE_SCHEMA.sql has Markdown-looking line {i}: {line}")

    print("Build 199 friendly Site Settings editor guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
