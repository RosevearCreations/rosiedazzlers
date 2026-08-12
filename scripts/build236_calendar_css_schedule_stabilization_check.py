#!/usr/bin/env python3
"""Build 236 Block Calendar, CSS, schedule compatibility, docs and route-copy guard."""
from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "admin-blocks.html": [
        "data-build236", "/api/admin/blocks_list", "calendarPrevBtn", "calendarTodayBtn",
        "blockApiHealth", "selectedDatePanel", "data-selected-action", "toLocalIso"
    ],
    "admin-launch-readiness.html": [
        "data-build236", "/api/admin/blocks_list", "Block Calendar", "Content Center"
    ],
    "assets/site.css": [
        "Build 236: restored schedule calendar", ".block-calendar-grid", ".block-selected-panel",
        ".app-shell", ".mobile-preview-card", "min-width:0"
    ],
    "assets/visual-placeholders.js": [
        "block_calendar", "inventory_workbench", "launch_readiness", "product_gallery", "local_service_proof"
    ],
    "assets/chrome.js": ["Help Articles", "loadPublicSiteSettings", "injectBusinessProfileSchema", "ensurePublicAnalytics", "visual-placeholders.js?v=20260726build236"],
    "assets/admin-auth.js": ["admin-conversions", "admin-payments", "admin-content", "admin-inventory-manager", "admin-launch-readiness"],
    "assets/admin-menu.js": ["Conversion Queue", "Content Center", "Inventory Workbench", "Launch Readiness"],
    "assets/admin-shell.js": ["admin-conversions.html", "admin-inventory-manager.html", "admin-launch-readiness.html"],
    "assets/public-analytics.js": ["analytics_event_registry", "event_label", "event_category"],
    "functions/api/admin/blocks_list.js": ["blocked_date", "slot", "block_date", "slot_code"],
    "functions/api/admin/booking_availability.js": ["blocked_date", "slot"],
    "functions/api/admin/booking_form_data.js": ["blocked_date", "slot", "block_date", "slot_code"],
    "functions/api/admin/dashboard_summary.js": ["blocked_date", "slot"],
    "sql/2026-07-26_build236_calendar_css_schedule_compatibility_no_ddl.sql": ["Build 236", "no database schema change"],
    "docs/BUILD236_CALENDAR_SEO_CSS_STABILIZATION.md": [
        "Completed in Build 236", "Next update", "Markdown sanity decision", "Current SEO and competitive direction"
    ],
    "docs/MARKDOWN_RETIREMENT_PLAN_BUILD236.md": ["Authoritative living documents", "release-guard dependencies"],
    "docs/SEO_COMPETITIVE_REVIEW_BUILD236.md": ["LocalBusiness", "Core Web Vitals", "No guaranteed rankings"],
    "data/markdown_sanity_build236.json": ["AI_PROJECT_HANDOFF.md", "MASTER_VALUE_ROADMAP.md", '"current_build": 236'],
    "data/build236_calendar_css_schedule_stabilization.json": ["no_ddl_stabilization", "schedule_source_of_truth", "live_evidence_required"],
    "AI_PROJECT_HANDOFF.md": ["Build 236 current handoff"],
    "MASTER_VALUE_ROADMAP.md": ["Build 236 active roadmap"],
    "SANITY_CHECK.md": ["Build 236 sanity check"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 236 known gaps"],
}

FORBIDDEN_QUERY_MARKERS = {
    "functions/api/admin/booking_availability.js": ["select=block_date", "select=slot_code"],
    "functions/api/admin/booking_form_data.js": ["select=block_date", "select=slot_code"],
    "functions/api/admin/dashboard_summary.js": ["select=block_date", "select=slot_code"],
}


def main() -> int:
    problems: list[str] = []
    for rel, markers in REQUIRED.items():
        path = ROOT / rel
        if not path.exists():
            problems.append(f"Missing required file: {rel}")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for marker in markers:
            if marker not in text:
                problems.append(f"Missing marker in {rel}: {marker}")

    for rel, markers in FORBIDDEN_QUERY_MARKERS.items():
        text = (ROOT / rel).read_text(encoding="utf-8", errors="replace")
        for marker in markers:
            if marker in text:
                problems.append(f"Obsolete schedule query marker remains in {rel}: {marker}")

    css = ROOT / "assets/site.css"
    mirror = ROOT / "functions/api/assets/site.css"
    if css.exists() and css.stat().st_size < 35000:
        problems.append("assets/site.css appears truncated (expected restored shared CSS baseline).")
    if css.exists() and mirror.exists() and css.read_bytes() != mirror.read_bytes():
        problems.append("Shared site.css and Functions mirror are not identical.")

    for left, right in [
        ("admin-blocks.html", "admin-blocks/index.html"),
        ("admin-launch-readiness.html", "admin-launch-readiness/index.html"),
    ]:
        lp, rp = ROOT / left, ROOT / right
        if not lp.exists() or not rp.exists() or lp.read_bytes() != rp.read_bytes():
            problems.append(f"Route copies differ: {left} vs {right}")

    if problems:
        print("Build 236 calendar/CSS/schedule stabilization guard failed:")
        for problem in problems:
            print(f"- {problem}")
        return 1

    print("Build 236 calendar/CSS/schedule stabilization guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
