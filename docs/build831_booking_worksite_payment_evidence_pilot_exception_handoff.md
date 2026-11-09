# Rosie Dazzlers 831 — Booking-to-Worksite-to-Payment Evidence Pilot & Exception Handoff

**Boundary:** Private, read-only supervisor review of persisted *application* data. No synthetic booking, payment, provider call, owner attestation, customer outreach, migration or shell event. A stored provider event ID or local paid status does **not** prove an independently authenticated Stripe/PayPal receipt.

## Existing source surfaces

The signed operations/admin-only `GET /api/admin/booking_worksite_payment_pilot_v831` reuses `staffAccess811`, explicit supervisor action permission and server-only `serviceHeaders`. It performs five bounded `GET` source reads, and fails closed on missing tables, unauthorized access, malformed source, duplicates or source unavailability:

| Source | Selected safe fields | Use and limitation |
| --- | --- | --- |
| `bookings` | UUID, `created_at`, booking and job state | Latest 40; no customer name, email, address or notes |
| `job_updates` | booking UUID, time, stage, review/decision flags | At most 200 recent *within sampled bookings*; no free-text notes |
| `job_signoffs` | booking UUID, creation and signed time | At most 200; never select signature image or customer identity; dated record is not independent witness proof |
| `quote_deposit_payment_requests` | booking/confirmed link, phase, local status, CAD/USD amount, paid/refund and provider event presence | At most 200; no payment reference, customer identity, checkout URLs or provider secret; a stored event ID is not a signature |
| `final_balance_payment_requests` | booking UUID, local status, currency, amount, paid time, provider event presence | At most 200; no receipt/checkout tokens or PII |

The projection in `assets/build831-booking-worksite-payment.mjs` distinguishes deposit versus final-balance records and preserves failures/refunds/chargebacks even when a later record claims paid. It explicitly flags incomplete signoff, worksite review, early payment, pending payment, missing request, currency/amount mismatch, duplicate/out-of-scope source identity and missing booking handoff. Worksite and payment states are *diagnostic*; completion and provider/owner acceptance remain UNKNOWN/HOLD.

The tenth private section on `/admin-handoff-acceptance.html` presents filterable evidence and manual links to the owning booking, jobsite, payment-recovery and reconciliation pages. No action sends payment, refund, message or Master Shell event. The entire response is `private, no-store`; source IDs are reduced to booking suffixes; no recorded customer names, staff IDs, original signatures or payment tokens leave the server.

## Pilot steps for real-world acceptance

1. Obtain explicit customer consent and a real booking through the existing booking wizard (not created by this build).
2. Have an authorized detailer and separate supervisor witness real arrival, condition/photos, work, QC and dated customer completion signoff.
3. Inspect the original Stripe/PayPal/cash finance records for deposit and final balance; independently reconcile amount, currency, refunds/chargebacks and accounting posting.
4. Review each local exception in its owning screen, recording genuine resolution and owner disposition under established authority. Return/hold unresolved cases; do not infer success from missing or stale evidence.
5. Obtain explicit signed owner approval and approved Master Shell source/consumer consent before any external pilot completion or score. No integration `CONNECTED` or 100% claim is emitted by this release.

**Source sampling:** The 40 newest bookings, 200 updates, 200 signoffs, 200 deposits and 200 final balances are separate bounded windows. Some earlier negative events and external payments can be absent. `sourceWindowMayOmitHistory` and `complete*History:false` deliberately prevent closure based on partial history. Original user/device/provider/owner evidence is not available from source checkout here.

**Regression:** `scripts/build831_booking_worksite_payment_pilot_test.mjs` tests all exception categories, deposit/final linking, negative events, currency/amount/refund mismatches, unsigned signoff, bounded/conflicting source, signed supervisor 401/403 and 503, PII exclusion, GET-only reads, route parity and accessible UI. The cumulative regression, protected PR checks and exact-SHA Cloudflare proof cover software release integrity, not business acceptance.

**Next proposed Build 832:** Job Economics, Inventory, Payroll, Invoice & Tax Source Reconciliation — keep accountant and owner acceptance separate from code GREEN.
