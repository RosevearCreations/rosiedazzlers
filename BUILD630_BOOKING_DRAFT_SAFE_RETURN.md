# Build 630 — Booking Draft Persistence, Safe Return & Planner Handoff UX

## Purpose
Build on Rosie Dazzlers’ existing same-tab Build 380 checkout recovery instead of adding a second draft store. Safely restore **only non-sensitive booking preferences**, require customer consent before applying them, and always re-evaluate catalog and appointment availability.

## Change log
- `assets/booking-draft-policy-v630.js` defines the new draft format `rosie-booking-choices.v1` (version 630), the six-hour expiry, strict anonymization and a current-catalog reconciliation helper. Persisted fields are **only** vehicle-size class and selected service-town, a package code and up to 20 unique valid add-on codes. No customer identity, contact info, vehicle make/model/year/plate, address, notes, gift/promo code, file/photo URL, consent, acknowledgement, booking ID, price/deposit, date or slot is serialized by the draft.
- `assets/booking-recovery.js` retains server-authoritative `/api/checkout_recovery` interception, existing request-ID behavior and conflict UX, but replaces the prior sensitive `rd_booking_draft_v380` session draft with `rd_booking_draft_v630`. Legacy drafts are purged **without reading or restoring** their previous private fields.
- Restoring a draft is now explicitly offered as **Continue saved choices** or **Discard saved choices**. Saved values are not automatically injected. Only current package buttons and non-disabled, non-quote add-ons can be reselected, and a service town is restored only if it is still listed in the current picker. Unavailable/removal changes are skipped.
- All saved appointment date/slot information and prior policy acknowledgements are intentionally discarded; the live planner must freshly fetch availability and validate the address, price, checkout and any approvals.
- `assets/site-policies.js` dynamically imports the revised recovery module with a cache-busted URL. `book.html`, `book/index.html` and `booking-planner.html` likewise receive cache-busted policy script URLs so the current same-tab recovery implementation loads consistently.
- The Build 380 retained authority checker is updated to **require** the legacy draft purge, private-field restriction, user-initiated resume, and current module references. No payment/booking endpoint code or database schema was modified.
- `scripts/build630_booking_draft_safe_return_test.mjs` checks that private keys are absent from serialized drafts, expiration, invalid legacy formats, owner catalog changes, quote review rules, appointment rechecks, route synchronization, live source integration and checkout preservation.
- Existing Current Source Gate suite A now runs the Build 630 checks along with previous booking UI tests.

## Specific guarantees and limitations
1. Browsing `/book` to select a package does not guarantee a slot or deposit price. The planner remains server-authoritative, and a resumed draft must start from review step 1.
2. **No payment or appointment is automatically resumed or confirmed.** Build 626’s existing server-side exact-match pending-session recovery is separate from this browser-tab draft. Successful payments continue to use their existing confirmation flow.
3. Customers must re-enter personal and address details after a refresh. This is an intentional privacy tradeoff; no personal data is stored in persistent `localStorage` or the draft’s `sessionStorage`.
4. The existing per-tab checkout request ID and successful-payment metadata remain in their distinct transient session keys for controlled provider recovery; this build does not change their backend authorization semantics.
5. A draft expiring after six hours, or one encoded under the old format, is not offered for restoration. Explicit bookmarked query selections override stored preferences.
6. No real customer accounts, pictures, quotes, bookings, deposits or payment provider requests were used to create regression evidence.

## Verify
- `node scripts/build630_booking_draft_safe_return_test.mjs`
- `python3 scripts/booking_recovery_failure_handling_check.py`
- `node --check assets/booking-recovery.js`
- `node --check assets/booking-draft-policy-v630.js`
- Manual browser test: select a size, package and fixed add-on; refresh; choose Continue and confirm only anonymous choices return, with no date/slot or customer details.
- Test Discard, fresh=1, six-hour expiration, stale service town, removed package, quote-only add-on and explicit URL prefill.
- Verify old `rd_booking_draft_v380` key is deleted on any booking/checkout route and is never deserialized for restoration.
- Verify keyboard focus and accessible saved-choice notice, and iframe height on mobile.
- Run protected `dev` / `main` checks and independently verify successful exact-main SHA Cloudflare Production deployment; HTTP 200 alone is not sufficient.

## Future work
Build 631: Final Review, Accessibility & Validation Acceptance, including failure-path testing in real browsers and provider sandbox acceptance. Atomic server capacity reservation and authenticated payment recovery still need separate security review.
