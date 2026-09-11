# Build 381 — Operations Daily Command Centre

Build 381 adds a protected, read-only Operations work surface at `/admin-operations.html` for the current service day.

## Authority boundary

The command centre is an aggregator, not a ledger. It does not create a replacement booking, assignment, payment, inventory, job-progress, completion, customer-follow-up, or attention-task authority.

The current booking list remains authoritative through `/api/admin/bookings`. That legacy endpoint uses an empty `POST {}` request for its read/list path; Build 381 never supplies `booking_id` to that endpoint and therefore never invokes its mutation path. Booking finance remains authoritative through read-only `GET /api/admin/booking_finance?booking_id=...`.

Changes are deliberately delegated to the existing admin surfaces for Bookings, Assignment, Job Site, Progress, Payments, Inventory and Today Needs Attention. The command centre itself issues no status, assignment, finance, inventory, progress, completion or follow-up mutation.

## Daily evidence shown

For each booking whose `service_date` equals the operator's local current date, the page presents:

- appointment start time and booking/job status;
- customer and vehicle context already present on the booking;
- staff assignment evidence already attached to the booking list;
- service area, trusted-coordinate status and arrival-geofence status when present;
- canonical booking total plus collected booking-finance entries, with a derived outstanding balance;
- package code as the service requirement anchor;
- completion state from canonical booking/job status;
- follow-up routing to the existing owner-attention authority.

## Fail-closed evidence rules

The page never invents operational evidence. Live traffic/travel conditions are shown as `Unknown` because there is no canonical live-travel evidence on the booking. Exact required product/equipment proof is not inferred from package names; the operator is sent to the existing booking/inventory/job authorities. Missing finance evidence produces `Unknown`, not a zero balance. Missing staff assignment is shown as `Unassigned`.

The readiness label therefore cannot claim whole-job readiness merely because an appointment exists. It can show that core booking/assignment evidence is present while still requiring the existing inventory/job authorities before dispatch.

## Security and runtime behavior

`/admin-operations.html` is `noindex,nofollow` and boots through the existing Admin Auth/Admin Shell Operations-module guard. API calls include the existing staff session credentials. The page has no background polling, no `setInterval`, and refreshes only on initial authorized load or an operator press of **Refresh now**.

## Schema and provider boundary

No database migration is required. Build 381 adds no table, column, view, trigger, database function, payment-provider mutation, customer-data mutation, or schema repair. It is schema-neutral and read/work-surface only.

## Release acceptance

The Build 381 source authority must prove the protected surface, read-only aggregation contract, fail-closed evidence wording, canonical authority links, absence of recurring polling/mutation primitives, schema-neutral boundary and retained exact-SHA Production acceptance helper before promotion.
