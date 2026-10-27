# Rosie Dazzlers — Build 685

## Verified Gift Release Receipt Validation, Manual Delivery Handoff & Recurrence Protection

**Owner-only, one certificate at a time.** Build 684 must already have produced a unique verified release receipt. Build 685 adds a second, append-only handoff event that acknowledges that release for a **separate** manual delivery operation. **Nothing is sent, queued, charged, refunded, redeemed or marked delivered** by this build.

### Operator procedure

1. Open **Admin → Gift Recovery Review**, enter the exact Stripe Checkout session ID in the existing Build 676 field.
2. Confirm the independent auditor's current paid/issuance/delivery evidence and the certificate's verified owner release in Build 684.
3. In **Build 685 — release receipt validation and manual handoff**, refresh. Choose the particular checkout line, read the reason/eligibility status and mark all three explicit owner acknowledgments.
4. Select **Record one manual handoff (NO SEND)**. The database independently checks Stripe's just-read paid evidence fingerprint; the same renewal/release and issuance receipt; current certificate unsent flags; prior queue records; no new recurrence; and a fresh active owner approval.
5. Record the returned receipt ID for a later, separately authorized manual operator delivery process. This handoff is **not** permission for an automatic retry, a duplicate email, any Stripe mutation or cross-business integration action.

### Safety and idempotence

- `gift_issuance_manual_delivery_handoffs` has unique `release_event_id` and `certificate_id`. The append-only trigger blocks updates/deletes; row-level security is enabled, service-role-only SELECT/INSERT and RPC execution, no browser credentials.
- The database takes the same per-session advisory transaction lock as the gift issuance/release engine, checks the current recovery chain and 2-hour proof window, and refuses all stale, prior-sent, queued, mismatched, reopened or duplicate requests. An exact replay returns only a **historical** receipt with `manual_delivery_authorized_now:false`.
- The server checks signed-in owner role and same-origin writes, and re-fetches Stripe payment using read-only GET. GET is only a preview; POST/database control the handoff decision. The UI discloses checkout line numbers without recipient addresses, codes or private gift details.
- A subsequent recurrence **invalidates the handoff for any later operator step**, even though its immutable receipt remains. No delivery may proceed without newly checked independent evidence and explicit action in a future delivery-specific workflow.
- No gift API send queue, payment API write, certificate balance write, or Rosevear gateway event is called.

### Verification

- `bash scripts/current_gift_issuance_regression.sh` (Builds 673–685)
- `node scripts/build685_manual_handoff_canary.mjs` emits the complete transaction-rolled-back 681–685 SQL canary, with negative tests for wrong reviewer, stale proof, changed delivery, reopened case, duplicates and immutable audit history.
- `python scripts/release_hygiene_check.py` and `python scripts/production_readiness_check.py`.

The attached Rosevear Integration Contract v1 still governs future connections. Rosie Dazzlers remains the gift-record authority; this build emits no cross-company event or customer message.
