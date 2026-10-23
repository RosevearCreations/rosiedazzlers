# Build 619 — Partial Consumable Usage & Job Cost Traceability

## Scope

The Admin Inventory editor now sets stock unit, usage unit, and usage units per stock unit. The job-use form displays the converted stock debit, available stock and estimated CAD job cost before submission. The server recalculates conversion from the saved inventory item; it never trusts a client-provided conversion or cost.

The existing Build 240 transactional inventory posting RPC remains authoritative for booking verification, row locks, negative-stock prevention, stock movement and stable action-key replay. No new automatic reorder or purchasing is introduced. Job movement reasons preserve the quantity in both units and estimated cost, and COGS is based on the **stock-unit** debit, not the displayed usage-unit amount.

## Precision boundary

The stock ledger stores three decimal places. Values that cannot be represented exactly at 0.001 stock units are rejected before posting (no rounded-to-zero or silent extra consumption). The source of truth is the saved `catalog_inventory_items` conversion configuration; concurrent changes to item conversion during a posting remain an operational risk until a dedicated transactional conversion-locked RPC is deployed.

## Acceptance

1. A 1,000 mL bottle costing CAD 25 with 125 mL job use previews and posts 0.125 bottle and CAD 3.13 estimated cost.
2. Attempting to consume more than the available stock fails; the existing RPC independently enforces the final stock check atomically.
3. Very small amounts that cannot be represented in 0.001 stock units fail without a debit.
4. The same client action ID retries without a second stock debit.
5. Save/reopen an item and verify `stock_unit`, `usage_unit`, and `usage_units_per_stock_unit` round-trip against the live inventory API.
6. Check the booking movement and journal for the original usage amount, stock quantity and posted COGS. Production live-data verification requires an authenticated staff session.

## Dependencies and hold

Requires the existing additive `sql/2026-10-02_inventory_stock_usage_units.sql` and `sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql` to have been applied on the target Supabase project. No migration is executed by this build and no live inventory is modified by the code rollout. If either schema contract is absent, live acceptance is **HOLD**, not GREEN.
