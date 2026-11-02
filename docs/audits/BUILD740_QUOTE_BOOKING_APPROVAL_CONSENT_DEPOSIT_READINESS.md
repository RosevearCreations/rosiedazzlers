# Build 740 — Quote-to-Booking Approval, Consent & Deposit Readiness

**Implementation date:** 2026-11-02 UTC (operator time 2026-11-01). Promotion and exact-SHA Production verification are separate release steps.

## Retained authority and sources

- Customer acceptance authority is the recorded `quote_proposal_drafts` accepted response (`acceptance_status`, `accepted_at`, `accepted_terms`, `accepted_terms_hash`, `structured_terms_hash`, delivered/responded timestamps). A staff-edited status is not customer consent; a duplicated customer response is a read-only replay.
- Current price/size/add-on/deposit authority is `loadPricingCatalog` and `resolveCurrentQuotePrice`, compared to the immutable accepted terms by `compareAcceptedTermsToCurrentPrice`. If a package, add-on, amount, deposit or quote expiry differs, **a new customer confirmation is required**. Build 735 Basic Detail size tiers and Build 736 quote-required add-ons are retained.
- Existing provider/payment evidence is read, not inferred, from `quote_deposit_payment_requests`. Pending, unverified, paid and provider states remain distinct; a missing source is **unavailable**, not a zero-balance/payment success claim.
- Supabase schema inspection confirmed existing accepted terms, acceptance hash, follow-up, payment status and provider status columns. No new table, privilege, RLS or payment credential was introduced. Current `app_management_settings` has generic `payment_methods` / `recovery_provider_rules`, but **no authenticated owner approval for quote deposit provider activation** was established; authorization remains **HELD**.
- Read-only production source verification on this build observed **0 quote proposal drafts, 0 customer-accepted proposal rows, and 0 quote deposit payment requests** in the current linked database. Live customer/provider acceptance cannot be claimed from an empty source; regression and replay cases use synthetic in-memory fixtures and do not create sample bookings/payments.

## Workbench and continuity

1. The protected Admin Leads quote card now offers **Review acceptance & deposit readiness**, replacing the old prompt-driven **Create deposit request** action. It loads a staff-authorized, read-only preview: delivery/response/acceptance history, accepted package/size/add-ons, verified total and deposit assumption, status of existing provider requests and next staff follow-up.
   Both `/admin-leads.html` and `/admin-leads/` serve the same reviewed interface; the exact-copy route parity gate is retained.
2. Staff sees a clear HELD label, “live activation OFF / charge OFF”, and the reason when an accepted scope cannot be verified. Readiness is not appointment confirmation and the preview does not send a customer message, create a booking, consume one-car capacity, create payment sessions or write to Supabase.
3. `quote_booking_approval_preview` requires `manage_bookings` and independently reads the quote and associated payment rows. Unavailable sources return 503. No public endpoints expose customer acceptance history or privileged metadata.
4. `quote_proposal_drafts_save` prevents staff from marking a quote accepted or rewriting a customer-accepted draft; the update has an atomic PostgREST condition to protect against a customer acceptance arriving during a save. Staff notes and follow-up remain separate actions.
5. `quote_proposal_respond` applies a compare-and-set acceptance write, so concurrent retries cannot overwrite a different accepted snapshot. An exact accepted response replay remains idempotent even after the original offer expires; it never rebooks or creates payment.
   The public response endpoint also now handles an absent optional note and missing action safely (rather than throwing a server error); controlled handler tests cover both the expired replay and a simulated compare-and-set race.
   `quote_proposal_deliver` also blocks already-accepted drafts and freezes new delivery terms/token with an atomic version/acceptance guard **before contacting the email provider**. The subsequent delivery-status update cannot clear a customer acceptance that occurred in the meantime.
6. The legacy direct `quote_deposit_request_create` endpoint is explicitly **HELD** after staff authorization and before any insert, provider call, or charge. A caller cannot use `allow_unaccepted`, alter the accepted deposit, or bypass the snapshot/current-price check if this hold is explicitly reviewed and changed in a future authorized build. Stripe future-path idempotency uses the immutable payment request ID, and dynamic payment methods remain provider-controlled (no hardcoded card-only parameter).

## Tests and rollout

- `node scripts/build740_quote_booking_approval_deposit_readiness_test.mjs`: immutable acceptance/fingerprint, changed package/add-on/deposit, catalog drift, expiry, tamper, missing consent, existing provider statuses, duplicate preview equality, payment hold, no unaccepted bypass, safe admin copy, and inline syntax.
- `bash scripts/current_booking_wizard_regression.sh`: retained builds through 740, including the five-step booking wizard, one-car capacity, winter workability and source-owned starting-at prices.
- Production acceptance must show main exact-SHA Cloudflare success plus business acceptance and release health GREEN. A green release is **not** authorization to activate held payment providers or to treat a customer acceptance as a reserved appointment.

## Owner decisions still required

- Authorize a specific provider environment, credentials, consent/payment terms and safe idempotent deposit activation with independently verified webhook fulfillment before enabling any new quote deposit request.
- Resolve any accepted quote whose customer-facing scope/amount or catalog price has changed by delivering revised terms and obtaining a new explicit customer response.
