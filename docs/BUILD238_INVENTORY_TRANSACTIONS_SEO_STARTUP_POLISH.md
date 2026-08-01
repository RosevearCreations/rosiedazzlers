# Build 238 — Inventory Transactions, SEO and Startup Polish

**Date:** 2026-07-30

## Purpose

Make high-volume inventory cleanup safe enough for launch preparation without removing the existing manual/detail editor, JSON tools, supplier importer, archive/restore or gallery workflows.

## Inventory batch transaction

The Workbench builds a selected-row change set and sends it to `/api/admin/catalog_inventory_bulk_update`. The endpoint requires administrator capability and calls the service-role RPC. A dry run validates item keys, fields, types, non-negative numbers, seven-image limit and operation reason. Commit inserts a batch header and row-level before/after evidence in the same database transaction. Any exception rolls back all writes.

### Acceptance test

1. Apply the migration in staging.
2. Select two harmless test rows.
3. Enter a category or vendor change and a meaningful reason.
4. Preview and verify the row count.
5. Commit and verify both rows plus both audit rows.
6. Repeat with one invalid item key or invalid value.
7. Confirm no selected row changed and no committed batch exists for the failed attempt.

## Reviewed duplicate merge

The Workbench allows exactly two selected rows. The operator chooses the survivor, supplies a reason and previews reference counts and proposed values. The RPC blocks self-merge, mismatched item type, incompatible nonblank units and previously merged duplicates. Commit records quantity transfer movements, transfers known references, consolidates missing metadata/tags/gallery (maximum seven), archives the duplicate with zero quantity and writes complete before/after merge evidence.

### Acceptance test

Create controlled test duplicates. Confirm reference counts directly before preview. After commit, verify inventory movements, low-stock alerts, purchase orders, receipts, assignments, service links, creative-project material lines and reservations where applicable. Confirm no hard delete occurred.

## Readable audit history

`/api/admin/catalog_inventory_audit_list` returns recent transaction-batch headers and duplicate-merge evidence through the protected service-role boundary. The Inventory Workbench displays reasons, actors, timestamps, row counts and transferred-reference counts and can export the visible history to CSV. It is read-only and returns a clear migration-required response when the Build 238 tables are unavailable.

## Failure behaviour

- Missing migration: APIs return a clear conflict response naming the migration.
- List API outage: cached data may render, but the Workbench is read-only.
- Partial batch failure: database transaction rolls back all rows.
- Merge uncertainty: preview only; do not execute.
- Recovery: use audit evidence and a reviewed compensating operation. There is intentionally no automatic destructive unmerge.

## SEO and interface polish

Nineteen public titles/descriptions were tightened around natural service, booking, price and local intent. One-H1 and route-copy checks remain. Service-worker/cache identifiers were advanced to avoid stale Build 237 CSS/data masking Build 238.

## Production status

Source complete, staging acceptance required. Continue through `STARTUP_GO_LIVE_BLOCKERS.md` before public launch.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.
