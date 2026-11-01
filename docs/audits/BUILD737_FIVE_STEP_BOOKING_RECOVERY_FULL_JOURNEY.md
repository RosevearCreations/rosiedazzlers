# Build 737 — Five-Step Booking Wizard Recovery & Full Journey Verification

## Acceptance scope

1. **Date + Vehicle:** choose a date, service area, explicit AM/PM/FULL time, vehicle make/model/year and size. A calendar snapshot is informational: advancement and checkout refetch `/api/availability` without using a cached successful date. A closed, changed or unreachable slot is cleared and must be selected again; the interface does not silently replace the customer's choice.
2. **Package:** choose a live-catalog package. Check its source-backed starting price for the selected small, mid or oversized vehicle before continuing; do not alter the canonical Basic Detail three-size pricing.
3. **Add-ons:** confirm live-catalog selections remain offered and allowed by the chosen package. Quote-required extras remain quote requests and do not become fixed charges.
4. **Address / Waiver:** enter the service street, city and optional Canadian postal code; review vehicle notes, site access, environmental requirements and deposit/weather acknowledgement. Address and postal errors are reported at the step where the customer can fix them. Labels retain input associations and alert focus.
5. **Payment / Review:** enter contact details and inspect the estimate, location and booking choices before requesting an existing payment provider session. The server remains authoritative over availability, price, capacity, deposit, voucher and provider behavior.

## Recovery and duplication boundaries

- A same-tab draft may restore only anonymous service area, size, package and eligible add-ons after the user chooses **Continue**. Date/slot, street address, name, email, vehicle identity, photos, notes, consent, vouchers, prices and payment data are never persisted by the draft. Stale or deleted packages and quote-only add-ons are not automatically reinstated; customer must select a new date and time.
- Rapid double clicks cannot cross two steps or submit two checkout requests from the same page. The checkout button locks **before async validation**, stays locked during submission and redirects only on an accepted checkout URL.
- An ambiguous network result, provider-session state or 5xx failure does **not** automatically repeat `/api/checkout_recovery`. The uncertain state persists in the same tab and prevents another checkout submission until staff confirms the outcome or the customer explicitly starts a new booking. A definite validation rejection (400/422) or server-reported stale-availability conflict can be corrected after review.
- The existing server recovery endpoint still matches recent pending booking holds. This release does **not** claim database-level atomic idempotency across devices or simultaneous browser sessions, does not alter the payment provider or booking schema, and does not create a real booking or charge as part of testing. Build 738 explicitly owns capacity/race reconciliation.

## Verification

- `node --experimental-vm-modules scripts/build737_full_wizard_recovery_test.mjs`: five-step panel/field contract, accessibility and focus, address validator parity, catalog selections and restricted add-ons, back/forward choice retention, anonymous interrupted session and expiry, forced fresh availability and stale-slot reset, double-click and ambiguous-retry guard, booking route mirrors and inline module syntax.
- `bash scripts/current_booking_wizard_regression.sh`: complete living booking regression, including preserved Builds 627–736 coverage.
- `bash scripts/current_source_gate_contracts.sh`: retained source-gate contract and role/security coverage.
- `python3 scripts/release_check.py`, `python3 scripts/release_hygiene_check.py`, `node scripts/service_commercial_accuracy_test.mjs`, `python3 scripts/admin_ui_audit.py`: release, pricing/commercial and admin boundaries.
- Required CI promotion: feature → `dev` → `main`, exact-SHA Production business acceptance, Cloudflare Pages deployment and post-promotion release health GREEN.

## Promotion guardrails

No checkout payment calls, customer booking rows, external notifications, Stripe/PayPal provider activation, pricing-source writes or owner approval overrides are authorized by this build. Live verification should exercise the public five-step navigation and reviews without submitting a real payment.

Next queued: **Build 738 — Availability, One-Car Capacity & Manual Scheduling Exceptions**; conflict/race safety and owner-audited overrides belong to that build.
