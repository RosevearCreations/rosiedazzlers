# Rosie Dazzlers — Build 686

## Manual Gift Delivery Operator Authorization, Final Send-Readiness Checks & Duplicate Prevention

### Scope

Build 686 adds an **owner-authorized operator preparation assignment** after a real Build 684 verified release and Build 685 manual handoff for an individual gift certificate. This is a **15-minute, receipt-linked internal preparation authorization**, not a customer send, resend, delivery, queued notification, charge or change to a gift's balance.

### Owner workflow

1. On **Admin → Gift Recovery Review**, enter the exact gift Stripe checkout session, complete any necessary independent recovery review, verified release, and manual handoff.
2. In **Build 686**, refresh the session. The server checks currently paid Stripe evidence using GET only; release and handoff freshness; issuance counts and receipt; previously attempted sends and queued notifications; and any new recurrence.
3. Choose **one** eligible checkout line and an active, separate admin/senior detailer/detailer operator. Review and check all three owner acknowledgments.
4. Select **Authorize operator preparation (NO SEND)**. The database repeats all checks atomically under the per-session gift transaction lock, records the unique append-only authorization and returns a receipt ID. Operators only see their own assigned certificates on the read-only review endpoint.
5. The designated operator can prepare to review the certificate, but **must not deliver** until a separate send-specific step verifies current evidence, consent and the unused permission immediately before dispatch. A historical/expired authorization is never a send token.

### Data and permissions

`gift_issuance_delivery_operator_authorizations`: append-only immutable event, unique `handoff_event_id` and `certificate_id`, one active *different* operator, expiry, provider evidence SHA-256 and issuance receipt timestamp, without recipient address, certificate code or other customer personal data. Service-role-only access with RLS enabled; no `anon`/`authenticated` table or RPC privileges; Cloudflare endpoint requires a signed-in owner session for mutations and same-origin requests. Role-limited reads show only assigned operator records; no cross-company data transfer.

No external message, queue, Stripe write, refund, reissue, redemption, certificate update, duplicate charge or Rosevear gateway event is performed.

### Verification

- `bash scripts/current_gift_issuance_regression.sh` — Builds 673–686.
- `node scripts/build686_operator_authorization_canary.mjs` produces a full Build 681→686 transaction-rolled-back SQL acceptance fixture. Rejects non-owner assignment, stale proof, inactive operator, already-submitted delivery, reopened case, duplicate assignment and immutable audit changes.
- `python scripts/release_hygiene_check.py` and `python scripts/production_readiness_check.py`.

The integration contract remains read-only until separate owner-approved live capabilities are enabled. Rosie Dazzlers remains the sole gift system of record.
