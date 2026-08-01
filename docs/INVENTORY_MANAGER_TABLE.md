# Inventory Manager Table

Build 234 adds `/admin-inventory-manager.html` without replacing `/admin-catalog.html`.

## Capabilities
- Inline row updates for name, type, category, quantity, cost, vendor, unit, reorder point, visibility and notes.
- Suspicious-name detection for ASIN-like and placeholder names.
- Active, archived, missing-category and name-review filters.
- Soft archive by setting `is_active=false` and `is_public=false`.
- Restore without recreating the inventory record.
- Desktop table and mobile card presentation.

## Boundary
The existing inventory workflow, Amazon-link importer, stock movements, usage, purchase orders and full editor remain unchanged. Build 234 adds no hard-delete control and no database migration.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
