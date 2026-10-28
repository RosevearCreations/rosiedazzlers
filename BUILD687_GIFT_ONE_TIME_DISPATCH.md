# Rosie Dazzlers — Build 687

## Manual Gift Delivery One-Time Dispatch Approval, Provider Receipt Capture & Delivery State Reconciliation

### Owner and operator flow

1. A signed-in owner opens **Admin → Gift Recovery Review**, loads the gift Checkout session, and checks exactly one certificate. Build 684 verified release, Build 685 manual handoff, and Build 686 distinct active operator assignment must be present and current.
2. The owner checks the recipient, prior-send and explicit approval statements. **Owner: approve this one-time email (NO SEND YET)** adds a unique append-only approval. It expires in five minutes. It never sends, queues or changes payment/balance.
3. The **assigned separate signed-in operator** refreshes the same session and checks the final recipient and irreversible-send confirmations. **SEND this one gift email ONCE** is the only customer-facing action. It performs a fresh GET-only Stripe paid check and atomically reserves the certificate, changes delivery to `processing`, creates one `processing` notification event (maximum one attempt), then makes **one** configured email-provider POST.
4. The server hashes the response and atomically reconciles the provider result with the gift and notification record. `provider_accepted` means only provider acceptance, not mailbox arrival. Definite provider rejection and unknown/timeout remain held for owner review. **No resend and no automatic retry.** Even if the response or database acknowledgment is lost, the prior reservation forbids a second send.

This workflow sends to the recipient only; purchaser copies, SMS, automatic retries, integrations, gift reissuance, refunds, new charges and balance changes are excluded. No automatic sending is initiated by deployment or tests.

### Data boundaries and safety

- Two new tables: append-only owner `gift_issuance_one_time_dispatch_approvals` (unique certificate and operator authorization) and one-time `gift_issuance_one_time_dispatch_attempts` (unique certificate, approval and notification).
- Both use RLS and service-role-only access. Three SQL `SECURITY INVOKER` RPCs enforce the same per-session advisory transaction lock. No public or customer RPC access.
- The existing scheduled gift-delivery worker cannot claim a `processing` gift. The generic retry worker explicitly refuses `gift_scheduled_delivery_email`; the manual notification stays `processing` until reconciled and uses `max_attempts=1` with no retry date.
- Approvals require live paid provider matching the immutable B686 proof, an active separate operator, intact issuance receipt, no prior gift send or queue, and no reopened recurrence or webhook HOLD. Future-dated gifts are ineligible.
- Admin UI masks recipient addresses; the server reads the full address only for the exact selected gift at the final dispatch. No credentials or customer content enter the new audit tables.

### Verification

`bash scripts/current_gift_issuance_regression.sh`, `python scripts/release_hygiene_check.py`, `python scripts/production_readiness_check.py`, and transaction-rolled-back `node scripts/build687_one_time_dispatch_canary.mjs` against the live database schema. The canary never calls Stripe or an email provider and leaves no gift or notification rows.

The first real manual send requires a fresh conscious owner and operator interaction in the production admin UI. Never interpret a deploy as authorization to send a customer message.
