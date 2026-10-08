# Repository cleanup — dependency-checked tranche (October 2026)

## Preservation and recovery
The immutable pre-cleanup source archive is available at https://github.com/RosevearCreations/rosiedazzlers/archive/f3d8ecdd502c84b100e57f64481ffd3c1cd7c4f9.zip . It preserves every file before this cleanup, including historical docs, SQL migrations, and evidence snapshots. Git history also retains all deleted blob objects.

## Removed, only after reference searches
- `data/build260_go_live_blockers.json`
- `data/build262_cpu_source_audit.json`
- `data/build262_ui_health_routes.json`
- `data/markdown_sanity_build245.json`
- `data/markdown_sanity_build246.json`
- `data/markdown_sanity_build247.json`
- `data/markdown_sanity_build249.json`

These seven files were historical, dated planning, reporting, or audit snapshots. Searches on the full path and/or basename found no current references in indexed source. They have no known production import, runtime route, migration, or CI dependency. No migrations, protected workflows, release-critical Markdown files, primary system manifests, or user-provided evidence have been deleted.

## Deliberately retained
The hundreds of historical Markdown documents, migration SQL, versioned release checkers, and authority workflows remain wherever references still exist. These files cannot be safely deleted by file age or extension. In particular, current source checks still load numbered historical proof documents and scripts. The cleanup is intentionally conservative: any further removal requires an exact-reference and runtime migration audit.

## Verification
Use `python scripts/repository_cleanup_check.py` in CI to verify removed paths stay absent, immutable linked original remains recoverable by commit, and critical runtime/SQL/current authorities remain present. Standard Current Source Gate, Development Acceptance, Production Business Acceptance, and exact-SHA Cloudflare Production validation govern promotion.
