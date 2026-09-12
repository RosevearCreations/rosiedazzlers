# Build 393 — Operations, Inventory & Job-Cost Evidence

Build 393 adds a schema-neutral, read-only operations evidence layer for individual Rosie Dazzlers jobs. It does not replace or duplicate any existing stock authority.

## Canonical authorities

The canonical inventory movement authority remains `catalog_inventory_movements`. Inventory item identity, quantity, reorder thresholds and recorded costs remain owned by `catalog_inventory_items`. Active reorder evidence remains owned by `catalog_purchase_orders` and the existing reorder workflow.

Build 393 creates **no second inventory ledger**. It does not insert, patch or delete stock, movements, purchase orders, accounting entries, payments or provider records.

## Job-scoped evidence

`GET /api/admin/operations_job_cost_evidence?booking_id=<uuid>` projects existing booking-scoped inventory movement evidence into an operations view containing:

- product and consumable usage/depletion;
- reversal-aware net quantities;
- recorded material cost evidence;
- low-stock and active reorder evidence;
- substitution evidence when substitution provenance already exists in the movement record;
- source movement identifiers and source-reference provenance;
- deterministic `ready`, `review`, or `unavailable` status.

The endpoint is staff-authorized and read-only. Existing stock and reorder mutation routes remain the only mutation paths.

## Recorded costs only

Job material cost is calculated only when an inventory item has a recorded `cost_cents` value. Build 393 never invents or estimates a missing product cost. If a consumed item has no recorded cost, material-cost completeness fails closed and the job evidence status becomes `review`.

## Replay and reversal safety

The projection deduplicates canonical movement rows by their existing movement identity. Where source references are available they remain part of evidence provenance. Positive reversal/adjustment movement quantities net against negative depletion quantities, so the read model does not double-count replay evidence or ignore reversals.

No write is performed to make the projection replay-safe; replay safety remains grounded in the existing inventory authority established before Build 393.

## Reorder and readiness evidence

If an inventory item is at or below its recorded reorder point, the projection surfaces any active `draft`, `requested`, or `ordered` purchase-order evidence. Low stock without active reorder evidence is a `review` reason. Build 393 does not create a reorder request automatically.

A job with no canonical inventory movements is `unavailable`, not falsely `ready`. Missing item authority, missing recorded costs, low stock without reorder evidence, or incomplete substitution provenance fails closed to `review`.

## Substitutions

Substitutions are surfaced only when the canonical movement evidence already includes the item being substituted for. Build 393 does not infer substitutions from product names or similar items. Missing substitution reasons remain visible as a review condition.

## Boundaries

Build 393 intentionally preserves these boundaries:

- schema-neutral: no Build 393 migration;
- read-only evidence endpoint;
- no second inventory ledger;
- no inventory, reorder, accounting or Production business-data mutation;
- no Stripe, PayPal, recurring-billing or payment-provider mutation;
- recorded costs only;
- provenance retained from canonical movement evidence;
- replay- and reversal-aware projection;
- incomplete evidence must fail closed as `review` or `unavailable`.
