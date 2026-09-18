# Build 409 — Inventory & Job-Cost Operational Evidence

Build 409 closes the next evidence gap in the Rosie Dazzlers forward roadmap without creating a second inventory ledger, changing Production schema, purchasing supplies, posting accounting entries, or mutating Production business data.

## Canonical authorities

The canonical inventory movement authority remains `catalog_inventory_movements`. Inventory item identity, on-hand quantity, reorder thresholds, units and recorded costs remain owned by `catalog_inventory_items`. Purchase-order evidence remains owned by `catalog_purchase_orders`.

Build 409 is schema-neutral and read-only. It extends the retained Build 393 evidence model rather than replacing it.

## No inferred consumption

Only an explicit canonical `job_use` movement with a negative quantity delta may become job-consumption evidence.

Booking-linked `waste`, negative `adjustment`, or any other depletion remains visible operational evidence but is excluded from job material cost. Build 409 does not infer that a write-off, defect, recount, waste movement, or generic adjustment was consumed on the customer job.

If a job has canonical inventory movements but no explicit `job_use` row, job consumption and job material cost remain unavailable/review. They are not converted to zero-cost success.

## Server-authoritative quantity evidence

Each movement exposes the recorded quantity delta together with recorded previous/new quantities when available. When all three are present, Build 409 verifies that previous quantity plus delta reconciles to new quantity.

Incomplete quantity continuity is explicitly unavailable. A mismatch is review. The read model never repairs inventory values and never derives a replacement on-hand quantity.

## Recorded costs only

Job material cost uses only the recorded `cost_cents` from the canonical inventory item attached to an explicit `job_use` row.

Missing item authority or missing recorded cost fails closed. Build 409 never estimates material cost from purchase URLs, vendor names, package prices, historical averages, replacement products, or an external provider.

## Row-level approval boundary

Build 409 surfaces row-level approval evidence only when a stable approval/review field is already present on the canonical movement record. Missing approval evidence is `unavailable` and prevents a job-use row from being operationally ready.

Approval is never inferred from the actor, note, booking status, movement type, timestamp, or the fact that a stock mutation succeeded.

## Row-level accounting-posting boundary

Build 409 surfaces row-level accounting-posting evidence only when a stable posting state, timestamp or accounting/journal reference is already present on the canonical movement record.

The current inventory mutation route may have accounting behavior for selected stock actions, but Build 409 does not infer that an individual movement was posted merely because its movement type could have accounting consequences. Missing stable row linkage remains unavailable/review.

Build 409 itself never calls `postJournalEntry` and never creates or updates an accounting entry.

## Purchase-order boundary

Low-stock and active purchase-order evidence remains read-only. Build 409 may report that an explicit job-use item is at/below its reorder point and whether a current `draft`, `requested`, or `ordered` purchase order exists.

No reorder request or purchase order is created automatically. Missing reorder evidence may require review, but purchasing is not inferred.

## Endpoint

`GET /api/admin/inventory_job_cost_operational_evidence?booking_id=<uuid>`

The endpoint is staff-authorized with booking-management authority and returns:

- exact canonical movement rows for the requested booking;
- explicit-job-use classification;
- ambiguous depletion rows excluded from job consumption;
- quantity continuity evidence;
- recorded item cost evidence;
- row-level approval evidence;
- row-level accounting-posting evidence;
- substitution provenance when recorded;
- low-stock and active purchase-order evidence;
- deterministic `ready`, `review`, or `unavailable` status;
- explicit mutation/schema/inference boundaries.

The endpoint accepts only GET/OPTIONS. POST/PATCH/DELETE remain method-not-allowed.

## Acceptance boundaries

Build 409 preserves all of these boundaries:

- schema-neutral; no Build 409 migration;
- read-only evidence endpoint;
- no second inventory ledger;
- server-authoritative quantities only;
- recorded costs only;
- explicit `job_use` only for job consumption;
- no inferred consumption;
- no inferred purchasing;
- no inferred accounting posting;
- row-level approval/posting evidence required before a job-use row can be operationally ready;
- no inventory mutation;
- no reorder/purchasing mutation;
- no accounting posting;
- no payment/provider mutation;
- no Production business-data mutation;
- incomplete evidence must fail closed as `review` or `unavailable`.

## Retained compatibility

Build 393 remains a retained historical/read-model authority and is still exercised by cumulative Production acceptance. Build 409 adds the stricter operational evidence contract required by the 405–415 roadmap without rewriting historical Build 393 semantics.
