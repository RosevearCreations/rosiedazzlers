# Build 746 — Onsite Setup, Pre-Damage & Valuables Checklist Completion

Build 746 extends the existing assigned Detailer App, canonical `jobsite_intake`,
Build 383 field media/notes and `booking_events`. It does not create another
inspection ledger, customer signature, invoice, charge or public photo gallery.

## Staff flow

1. Sign in, manually reconcile the assigned job and mark **Arrived**.
2. Review the safe, permitted work area, keys, usable/tested water and power,
   weather/access exceptions, pre-existing damage and valuables. A draft may be
   saved with missing items; it remains **held** until resolved.
3. Review the one-included-medium-bag policy and any potential **$5 per additional
   bag**. Record extra-bag count, discussion and acknowledgement. Nothing is billed.
4. Record the customer's actual pre-work inspection, condition, keys and
   **private job-photo** acknowledgements. Staff confirmations are **not** a
   customer signature or permission for public/marketing use.
5. Save; the server checks the exact booking and intake revisions, writes only
   the relevant columns to the existing intake, appends a booking-scoped event
   with actor, time, changed-field names, consent and the resulting readiness,
   and reads back the latest revision and receipt.
6. With a current private-photo consent receipt, capture a **new internal arrival
   photo** using the existing media tools, save the Build 383 staff checklist,
   then Start. Start independently checks same-origin staff session, canonical
   assignment, stage/booking revision, current intake/receipt revision, all
   acknowledgements, a non-rejected internal arrival photo captured **after**
   consent, and the existing saved staff checklist.

## Failure and privacy rules

- A missing customer acknowledgement, unsafe utility/workspace, missing damage
  or valuables review, refused/missing photo consent, unacknowledged extra-bag
  possibility or changed intake blocks Start. Unresolved cases go back to the
  customer/owner for decision; no acknowledgement is fabricated.
- The staff app neither creates an extra charge nor calls a payment, message or
  public-media publication API for this flow. Photo consent is private job
  evidence only; Build 747 will handle broader media/R2 consent controls.
- The browser keeps no persisted checklist snapshot and queues no offline
  writes. Ambiguous success or audit-append failure requires **manual Reload**;
  an intake with no matching audit receipt cannot pass the Start gate.
- Legacy Admin intake fields and photo URLs are preserved, not rewritten.
  Existing Admin saves to the same intake naturally invalidate the v746 receipt
  revision and require fresh review. No schema migration or provider enablement.
- `booking_events` records source-linked audit metadata and changed field
  names, not a second copy of sensitive valuables/damage text or private media.
  The form also shows current intake revision and outstanding readiness checks.

## Acceptance

```sh
node scripts/build746_onsite_setup_test.mjs
node scripts/build745_detailer_mobile_offline_continuity_test.mjs
python3 scripts/mobile_detailer_field_workflow_check.py
python3 scripts/release_check.py
python3 scripts/sync_route_copies.py --check
```

The Build 746 tests cover anonymous/cross-origin refusal, canonical assignment,
stale booking/intake revisions, bad bag counts, held consent, accepted evidence,
early photos, required checklist, successful Start, failed audit receipt and
manual reconciliation. Staff/owner actual-device evidence remains a separate
acceptance step; green software does not imply a real customer's signature or
customer permission to publish images.

**Next queued:** Build 747 — Before/After Photo Capture, R2 Recovery & Media Consent.
