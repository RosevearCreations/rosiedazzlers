# Rosie Dazzlers Build 750 — Consumable Usage, Partial Stock Deduction & Job Cost Traceability

## Scope

The Inventory admin screen (`/admin-catalog.html`) now offers a two-step **Preview stock & cost** then **Confirm exact deduction** workflow. A signed-in inventory manager must supply a genuine booking UUID, choose an active **consumable**, and enter the quantity in the item's configured *usage unit*.

- Example: 125 mL from a 1,000 mL bottle costs 0.125 bottle of stock. At CAD $25/bottle, the recorded stock ledger costs CAD $3.13 at cent precision.
- The server rejects amounts that cannot be represented *exactly* in the database's 0.001-stock-unit precision, shortages, missing/archived/tools, expired previews, different booking/actor, and source drift before commit.
- The live Supabase `admin_catalog_inventory_post` function dry-runs the booking + item under transactional stock validation before exposing a signed 10-minute preview. **Dry-run never writes inventory**.
- Confirmation uses the same database RPC to deduct once, atomically, with a unique idempotency key and recorded movement and posting-row evidence. Replaying the same confirmation checks the original posting batch and item/quantity; it never posts cost accounting again. Uncertain outcomes direct the operator to the cost history, not a new debit.
- Actual posted cost is derived from `catalog_inventory_posting_rows.quantity × unit_cost_cents` at *posting time*, not today's editable inventory cost. A concurrent edit after preflight cannot bypass the RPC's locked stock validation; any difference between the recorded posting and the preview is explicitly flagged for Operations review. The booking trail shows batch and movement IDs, actor, timestamp, reversal, and accounting state. Reversed batch cost nets to zero; missing cost remains **review** instead of fabricated zero. A failed accounting journal does not reverse the stock deduction and must be reconciled by Operations.
- No customer invoice adjustment, payment charge, purchase order, or promotional-media permission is performed by this workflow.

## Owner acceptance / production safety

1. Sign in to Rosie Dazzlers Admin → Inventory. Select an active liquid consumable whose Stock unit = `bottle`, Usage unit = `mL`, and conversion = `1000`.
2. Enter a **test/staging booking**, `125` for use amount, preview. Check the `0.125 bottle` debit, prior and next stock, and estimated cost. **Do not confirm on live stock without owner authorization.**
3. Inspect a stock shortage and non-representable amount; both must produce a safe error with no debit.
4. In an approved staging trial only, confirm one preview; repeat that same request (not a new preview) and ensure quantity decreases once. Read the booking history; assert the movement ID and frozen unit cost, accounting status and original batch ID are present.
5. Authorize any reversal through the existing inventory posting/reversal page. Recheck the booking cost trail; the original cost is visible and net cost is zero. Accounting journal reversal requires separate review.
6. Confirm no live inventory records were changed by release tests. Monitor production deployment, exact `main` SHA and production health status as separate promotion gates.

Build 751 is queued next: **Package, Vehicle Size, Travel & Seasonal Margin Review**. Any external stock debit remains subject to explicit operator confirmation and normal authorizations.
