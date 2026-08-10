# Build 246 — Catalog Publishing Readiness

## Purpose

Create one shared decision for whether an inventory/product record can be public, while preserving the existing detailed editor, Workbench, JSON editor, archive/restore, image galleries and audit workflows.

## Required publishing fields

- meaningful name that is not an ASIN/SKU-like identifier
- tool or consumable type
- category
- unit label
- non-SVG featured image
- active status
- positive stock for consumables

## Warnings

Cost, description, preferred vendor, subcategory, service tags and additional gallery images improve readiness but are not current hard blockers.

## Safety properties

- preview before commit
- all selected records publish together or none publish
- row locking in the database function
- direct and bulk public writes use the same server-side evaluator
- public catalog filters incomplete rows
- audit evidence stores safe reasons, counts and item keys
- no browser sequential-write fallback for public publishing

## Acceptance

Follow process 37 in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

Build 238 synchronization (2026-07-30)

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->

<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Specialist runbook: STARTUP_GO_LIVE_BLOCKERS.md | Inventory recovery: reviewed existing-row Amazon refresh -->
