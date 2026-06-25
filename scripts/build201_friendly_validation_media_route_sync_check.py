#!/usr/bin/env python3
"""Build 201 guard for friendly validation, media pickers, schema preview, and route-copy sync."""
from __future__ import annotations

import importlib.util
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


def main() -> int:
    app = read("admin-app.html")
    app_route = read("admin-app/index.html")
    admin = read("admin.html")
    admin_route = read("admin/index.html")
    roadmap = read("DEVELOPMENT_ROADMAP.md")
    gaps = read("KNOWN_GAPS_AND_RISKS.md")
    dbdoc = read("DATABASE_STRUCTURE_CURRENT.md")
    schema = read("SUPABASE_SCHEMA.sql")
    readme = read("README.md")
    doc_index = read("DOC_INDEX.md")
    release_check = read("scripts/release_check.py")
    sync_script = read("scripts/sync_route_copies.py")
    sql_note = read("sql/2026-06-09_build201_friendly_validation_media_route_sync_no_ddl_note.sql")

    if app != app_route:
        raise AssertionError("admin-app.html and admin-app/index.html are not synchronized")
    if admin != admin_route:
        raise AssertionError("admin.html and admin/index.html are not synchronized")

    require(app, 'data-build201="friendly-validation-media-pickers"', "Build 201 Admin App body marker")
    require(app, "build201EnhanceFriendlyEditors", "friendly editor enhancer")
    require(app, "build201AttachFieldHint", "inline field hint helper")
    require(app, "build201AttachMediaTools", "media picker helper")
    require(app, "build201KnownMediaUrls", "saved media URL source helper")
    require(app, "build201MediaBadgeFor", "consent/source media badge helper")
    require(app, "build201LandingSchemaPreview", "landing schema preview helper")
    require(app, "data-build201=\"landing-schema-preview\"", "landing schema preview marker")
    require(app, "build201RequireSaveReview", "owner-safe save review summary")
    require(app, "Pick saved media URL", "media picker button text")
    require(app, "build201CharHint('Meta title'", "inline meta title counter")
    require(app, "Hero/H1 title", "inline H1 counter")
    require(app, "Confirm source/consent", "external media warning text")

    require(admin, 'data-build201="friendly-editor-validation-dashboard"', "Build 201 Admin Dashboard marker")
    require(admin, "Friendly editor validation", "dashboard validation row")
    require(admin, "Route-copy sync script", "dashboard route sync row")

    require(sync_script, "ROUTE_COPY_PAGES", "route sync page list")
    require(sync_script, "sync_route_copies", "route sync function")
    spec = importlib.util.spec_from_file_location("sync_route_copies", ROOT / "scripts/sync_route_copies.py")
    if not spec or not spec.loader:
        raise AssertionError("Could not import route copy sync script")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    drift = module.sync_route_copies(check_only=True)
    if drift:
        raise AssertionError("Route-copy drift remains after Build 201: " + "; ".join(drift))

    require(roadmap, "Build 201 — 20 completed items", "roadmap completed list")
    require(roadmap, "Next 20 steps after Build 201", "roadmap next steps")
    require(gaps, "Build 201 known gaps and risks", "known gaps update")
    require(dbdoc, "Build 201 schema status", "database schema status update")
    require(schema, "Build 201 friendly editor validation", "schema Build 201 note")
    require(readme, "Build 201 update", "README update")
    require(doc_index, "Build 201 documentation index note", "doc index update")
    require(sql_note, "No database schema changes are required", "Build 201 SQL no-DDL note")
    require(release_check, "scripts/build201_friendly_validation_media_route_sync_check.py", "release check registration")

    for i, line in enumerate(schema.splitlines(), start=1):
        if line.startswith('##') or line == '---' or line.startswith('- '):
            raise AssertionError(f"SUPABASE_SCHEMA.sql has Markdown-looking line {i}: {line}")

    print("Build 201 friendly validation/media/route sync guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
