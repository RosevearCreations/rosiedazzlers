# Rosie Dazzlers — Build 693

**Fifth-Reviewer Gift Discrepancy Recurrence Closure Watch & QL-246 Original Source Signature/Pin Verification Readiness**

## Internal gift evidence-only recurrence watch

The original one-time gift send remains consumed and unresolved. Only a B692 fifth independent
review with `still_disputed`, `documentary_gap` or `contradiction_not_resolved` **followed by the
original owner's no-resend HOLD acknowledgment** qualifies.

1. The original owner may assign a **sixth active independent witness**, distinct from the
   owner, original operator, first recipient reviewer, third recurrence reviewer, fourth
   reopened-exception reviewer and fifth discrepancy reviewer.
2. Only the assigned sixth witness may check recurrence risk within 14 days. Their allowed
   outcomes remain unresolved: `discrepancy_still_open`, `new_discrepancy_detected`, or
   `original_evidence_missing`. A 24-hour internal watch flags outstanding risk.
3. Only the original owner may acknowledge **continuing manual HOLD** after that witness.
   Acknowledgment does not certify recipient delivery or grant a new resend.
4. The append-only `gift_issuance_delivery_fifth_recurrence_closure_watch` records one event
   of each kind per original attempt, protected by service-role-only grants, RLS,
   an immutability trigger and an invoker RPC. The RPC locks the exact checkout and checks
   case, certificate, prior reviewer lineage, notification one-time state and event order.

The signed-staff operator panel is on `/admin-gift-recovery-review.html` → Build 693.
The source does not contact payment, email, SMS, notification, gift mutation or external gateway.

## QL-246 separately pinned public signature readiness

`functions/api/_lib/rosevear-integration-ql246.js` now implements an Ed25519 **verification-only**
routine: exact 24-field canonical UTF-8 bytes, detached base64url signature, Ed25519 SPKI PEM,
SHA-256 DER-SPKI pin and exact independent source SHA / CI URL / `np-` operator challenge.
The owner-only `/api/admin/integration_v1_ql246_signature_readiness` GET reports only whether
expected values are configured; POST accepts **public nonsecret JSON only** and checks them
without storing the packet, calling a gateway, or accepting an owner pilot.

The server-side, separately authenticated expectations are deliberately **not provisioned**:

- `ROSEVEAR_QL246_TRUSTED_SPKI_SHA256` — pinned public DER-SPKI fingerprint from a
  distinct authenticated route, never the untrusted packet.
- `ROSEVEAR_QL246_EXPECTED_SOURCE_SHA` and `ROSEVEAR_QL246_EXPECTED_CI_RUN_URL` — exact
  immutable source revision and its real green CI run, verified independently.
- `ROSEVEAR_QL246_EXPECTED_CHALLENGE_ID` and `ROSEVEAR_QL246_EXPECTED_CHALLENGE_SHA256`
  — the genuine fresh operator challenge and nonce digest (not raw nonce).

These configuration names are not credentials to populate by guessing. Until independently
provided, the verifier fails closed. A valid synthetic signature proves **only cryptography**;
it cannot prove original health/capabilities GETs, seven separately witnessed denials, durable
audit, key rotation/revocation, original tenant/source authenticity or a future owner pilot.

No `docs/integration/ql246-source-proof.json` is published. QL-246 remains `PENDING / BLOCKED`;
all integrations remain `DISCONNECTED`, approval `NOT_GIVEN`, Comms Hub dispatch held.
This is consistent with the October 28 six-app handoff; Rosie cannot verify five other apps.

## Verification and promotion authority

- `bash scripts/current_gift_issuance_regression.sh` — Builds 673–693, including wrong
  sixth witness, duplicate denial, hold, no gateway, Ed25519 tamper/pin/expiry negatives.
- `node scripts/build693_fifth_recurrence_ql246_canary.mjs` — complete B681–B693
  synthetic source progression; **execute only inside one `BEGIN`/`ROLLBACK`** on a
  prepared database after migration is available. Verify zero synthetic residue.
- Migration generated with Supabase CLI:
  `supabase/migrations/20261028163645_build693_fifth_reviewer_recurrence_closure_watch.sql`.
- Source PR checks, `dev` Development Cloudflare, `main` Production Cloudflare,
  exact-SHA runtime and business acceptance must all be GREEN before Production GREEN.

Next QL-246 operation is an independent **nonproduction-only** evidence collection under a
separate, explicit owner approval. This code release does not authorize that operation.
