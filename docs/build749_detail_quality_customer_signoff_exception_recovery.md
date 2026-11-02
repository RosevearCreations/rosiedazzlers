# Rosie Dazzlers · Build 749 — Detail Quality Control, Customer Sign-Off & Exception Recovery

## Outcome and operator path

1. Assigned staff open the Detailer App and manually refresh the current booking. The Build 749 card loads booking-scoped immutable quality events and private before/after photo **presence**, without leaking private media URLs into a public feed.
2. Staff explicitly record three before-work checks (existing condition, agreed scope, safe worksite) and three after-work checks (exterior, interior, final walkaround). Scope, safety and final walkaround must **pass**; other not-applicable items need a factual note. Missed steps cannot be marked done merely because a note exists.
3. Staff raise concerns as private `booking_events` receipts. `rework` and `missing_step` can be closed only by a separate booking manager after inspecting a real private job-media record captured **after** the concern. Damage/dispute/claim concerns stay on hold; this release does not approve a claim, liability, refund, credit or customer notification.
4. Submission captures the exact current QC source revision. The manager opens `/admin-quality.html` from Admin Progress, reviews source history and media presence, and records `accepted` or `needs_rework` with a reason. The submitting staff member cannot approve their own packet. Any later source change invalidates the old acceptance and requires fresh review.
5. The mobile job **Complete** action requires a verified manager acceptance for that exact revision in addition to previous Build 383 field evidence and Build 746/747 photo consent rules. The server repeats the QC revision check; a stale/offline browser cannot bypass it.
6. The actual customer or authorized vehicle owner uses the existing private `/progress` or `/complete` token link and signs personally after quality acceptance. The Progress page now requires an explicit customer/owner acknowledgement and an ink signature; the existing server signoff route still treats a **legacy already-completed job with no Build 749 record** as an older workflow, not retrospectively incomplete. Staff QC/manager review do not create a customer signature or mark a booking signed.

## Data and privacy

- Reuses `booking_events`, `job_media`, `job_signoffs`, and existing `bookings` status. No new database schema/migration, storage bucket, email or provider configuration.
- Customer reads receive **only coarse quality status**, not staff notes, private photos, evidence IDs, incident details or raw events.
- Staff and manager APIs require a signed-in same-origin session, exact booking assignment or manager capability, and source revision readback. Mutations append immutable booking audit receipts; no automatic replay after uncertain outcomes. Manual reload/reconcile first.
- No automatic public media, review request, claim, message, signoff, payment, refund, inventory deduction or payroll posting.
- Existing legacy staff signoff administration is a separate workflow: owner acceptance should confirm it is restricted to verified *in-person* customer signatures before treating those legacy records as independently verified customer actions.

## QA and limitations

- `node scripts/build749_detail_quality_signoff_exception_test.mjs`
- `python3 scripts/mobile_detailer_field_workflow_check.py`
- `bash scripts/current_booking_wizard_regression.sh`
- `python3 scripts/release_check.py`
- `python3 scripts/sync_route_copies.py --check`

The automated tests verify controls and deterministic source reconciliation. They cannot claim a customer actually signed, inspected a vehicle or accepted a dispute. Authenticate on a real staff device and owner phone for field acceptance. The queue deliberately fails closed at its bounded read limit rather than silently omitting older entries. If photo/booking source is unavailable, manager approval and mobile completion remain held. No background polling.

**Next queued:** Build 750 — Consumable Usage, Partial Stock Deduction & Job Cost Traceability.
