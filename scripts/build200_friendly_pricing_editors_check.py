#!/usr/bin/env python3
"""Build 200 guard for friendly pricing editor completion."""
from __future__ import annotations

from pathlib import Path

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
    app = read("admin-app.html")
    app_route = read("admin-app/index.html")
    admin = read("admin.html")
    admin_route = read("admin/index.html")
    roadmap = read("DEVELOPMENT_ROADMAP.md")
    gaps = read("KNOWN_GAPS_AND_RISKS.md")
    dbdoc = read("DATABASE_STRUCTURE_CURRENT.md")
    schema = read("SUPABASE_SCHEMA.sql")
    sql_note = read("sql/2026-06-09_build200_friendly_pricing_editors_no_ddl_note.sql")

    if app != app_route:
        raise AssertionError("admin-app.html and admin-app/index.html are not synchronized")
    if admin != admin_route:
        raise AssertionError("admin.html and admin/index.html are not synchronized")

    require(app, 'data-build200="friendly-pricing-editors"', "Build 200 Admin App marker")
    require(app, 'data-build200="package-rich-details-editor"', "package rich details editor panel")
    require(app, 'Package details without JSON', "package detail editor heading")
    require(app, 'data-pkg-detail-lines="included_services"', "included services line editor")
    require(app, 'data-pkg-detail-lines="chart_details"', "chart detail line editor")
    require(app, 'data-pkg-detail-field="seo_focus"', "SEO focus package field")
    require(app, 'data-save-package-detail', "selected package save button")
    require(app, 'data-duplicate-package-detail', "duplicate package control")
    require(app, 'data-build200="friendly-chart-helper"', "friendly chart helper panel")
    require(app, 'window.__rosiePricingCatalogState', "chart helper state bridge")
    require(app, 'Advanced raw catalog JSON / emergency repair', "advanced pricing JSON emergency label")
    forbid(app, 'Use this for charts, included services, richer notes', "old chart/included-services raw JSON guidance")
    forbid(app, 'Refresh JSON from editor first when you have changed form fields', "old chart refresh JSON instruction")

    require(admin, 'data-build200="advanced-json-panel-dashboard"', "Build 200 dashboard marker")
    require(admin, 'Remaining advanced JSON panels', "dashboard advanced JSON card")
    require(admin, 'data-build200="remaining-json-panel-dashboard"', "advanced JSON diagnostics card marker")

    require(roadmap, 'Build 200 — 20 completed items', "roadmap completed list")
    require(roadmap, 'Next 20 steps after Build 200', "roadmap next steps")
    require(gaps, 'Build 200 known gaps and risks', "known gaps update")
    require(dbdoc, 'Build 200 schema status', "database schema status update")
    require(schema, 'Build 200 friendly pricing editor completion pass', "schema Build 200 note")
    require(sql_note, 'No database schema changes are required', "Build 200 SQL no-DDL note")

    for i, line in enumerate(schema.splitlines(), start=1):
        if line.startswith('##') or line == '---' or line.startswith('- '):
            raise AssertionError(f"SUPABASE_SCHEMA.sql has Markdown-looking line {i}: {line}")

    print("Build 200 friendly pricing editor guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
