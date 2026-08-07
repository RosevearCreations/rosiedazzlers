# Build 235 — Operational Readiness, JSON Table Editing, and Seven-Image Galleries

## Purpose

Build 235 preserves the existing Inventory Workflow and expands the separate Inventory Workbench. It is a launch-polish release focused on data correction speed, product media readiness, and honest preflight tracking.

## Inventory Workbench

- Spreadsheet row editing remains available.
- Each row now opens a field/value **JSON table editor**.
- Individual fields or the complete row can be updated without editing raw JSON syntax.
- Bulk changes, archive/restore, CSV export, review filters, suspicious-name detection, and readiness scoring are included.
- Archive remains a soft delete so movements, job usage, purchasing, accounting, and project history remain intact.

## Product and inventory galleries

- `image_url` remains the featured image.
- `gallery_image_urls` stores an ordered JSON array of up to seven additional images.
- The existing Inventory Workflow now includes seven visible gallery slots, image previews, clear controls, arrow ordering, and drag ordering.
- The same field is added to both `catalog_inventory_items` and the compatibility `catalog_items` table.
- Apply `sql/2026-07-19_build235_inventory_json_gallery_launch_readiness.sql` before expecting gallery values to persist.

## Launch Readiness Command Center

The new `/admin-launch-readiness.html` page separates:

1. automatic checks based on current APIs/database data; and
2. manual confirmations that require a real booking, live payment/refund, email delivery, backups, policy review, mobile testing, security review, and production operations preparation.

The dashboard deliberately does not claim these items are complete until an administrator confirms them. Use the score as guidance, not as a replacement for real-world testing.

## Safe launch approach

Use an invite-only soft launch first. Keep incomplete products private or inactive, monitor every transaction, and expand public marketing only after the first live workflows are stable.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

Build 210 documentation sync
Build 211 documentation sync
Build 212 documentation sync
Build 213 documentation sync
Build 214 documentation sync
<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->
