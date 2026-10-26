# Build 674 — Gift Certificate Issuance Atomicity, Webhook Replay Evidence & Owner Recovery Hold

## Scope

- Replace the webhook's race-prone `GET exists` followed by bulk `POST` with one service-role-only Supabase RPC. `issue_gift_certificates_atomic` serializes by the paid Stripe Checkout session ID; certificate rows, session receipt, and minimal webhook evidence commit together or roll back together. A per-session/line unique index provides an additional database guard. Generated code values are excluded from a deterministic SHA-256 checkout-intent fingerprint.
- Require a verified, signed `checkout.session.completed` **with `payment_status: paid`** or `checkout.session.async_payment_succeeded` **with `payment_status: paid`**. Unpaid completed checkouts never issue a redeemable certificate. Unrelated events remain ignored.
- Repeated identical events increment receipt replay counts and record distinct event IDs, type, first/last seen time, and event re-delivery count. No raw webhook bodies, purchaser email, certificate code, provider keys, or gift message is copied into these ledgers.
- Existing certificates for a session without an issuance receipt, contradictory fingerprint or certificate count, and previously held receipts cause `owner_recovery_hold`. The RPC changes only unsent `pending` delivery metadata to `review_required`. It never reduces balances, deletes or replaces certificates, refunds, or submits messages.
- Add read-only staff `/api/admin/gift_issuance_recovery_review?session_id=…` and a review panel in Admin Site Settings. Owners compare session-level receipts, counts and safe webhook event references without an automatic recovery button.

## Prerequisite and safety boundaries

**Migration first.** The additive `supabase/migrations/20261026231937_build674_gift_issuance_atomic_replay_hold.sql` must be applied, security-checked, and tested in the intended database before this webhook code can issue gift certificates. Without that RPC it returns 503 and issues nothing; neither a source deploy nor a screenshot proves database readiness.

Build 673's recipient and purchaser-copy separate delivery claims remain unchanged. Only first-time successful issuance attempts due delivery; a replay cannot send again. A transient RPC/HTTP failure leaves a Stripe retry eligible, but the database constraint prevents duplicate issuance; if the database is unavailable there can be no durable receipt, so staff must verify database and Stripe histories before manual intervention. Never convert a 503 or provider-accepted email event into proof of delivery.

Historic sessions without receipts are not automatically backfilled. An authorized operator must reconcile these against Stripe's settled session and the individual existing certificates. The read-only review does **not** approve new certificates, a replay, a refund, or a resend.

## Verification

Run `node scripts/build673_gift_delivery_idempotency_test.mjs` and `node scripts/build674_gift_issuance_atomicity_test.mjs`. Tests simulate two concurrent workers, identical event replay, mismatched payload holds, unpaid completion, asynchronous paid success, unavailable RPC and staff read-only boundaries. Source-gate and Production business acceptance include Build 674's tests.

After applying the database migration, separately verify unique indexes, grants, an all-or-nothing synthetic transaction **rolled back** without customer data changes, and real Stripe sandbox signed events before accepting provider end-to-end fulfilment. Production acceptance additionally requires the exact `main` commit, Cloudflare deployment health, and database migration/readiness evidence. This build does not run live charges or send real customer emails as a side effect of testing.

On 2026-10-26, the additive migration was applied to the connected Rosie Dazzlers Supabase project (migration history `20261026233754`). Read-only checks confirmed that the RPC, event table, receipt table and per-session/line unique index exist. `anon` and `authenticated` cannot invoke the RPC; `service_role` can. A synthetic *database transaction deliberately aborted after passing* issuance → identical replay → conflicting-payload hold assertions. The subsequent check found **zero retained certificates, receipts and webhook events** for that canary. This is database transaction evidence, not a real Stripe charge, webhook delivery or customer email acceptance. The new tables intentionally have RLS enabled with no public policies.

## Next expected

Build 675 — Gift Issuance Recovery Decision Ledger, Paid-Session Cross-Check & Customer-Safe Exception Closeout.
