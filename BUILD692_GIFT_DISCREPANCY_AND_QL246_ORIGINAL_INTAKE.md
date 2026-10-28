# Rosie Dazzlers — Build 692

**Independent Reopened Gift Evidence Discrepancy Resolution Watch & QL-245 Nonproduction Original-Receipt Intake Readiness**

## Gift recovery: exact independent discrepancy follow-up

Only B691 reopened certificates with a **fourth independent review** of `evidence_conflicting` or `new_evidence_not_confirmed` and subsequent **original-owner HOLD acknowledgment** qualify. Owner assigns a fifth reviewer who is distinct from the owner, one-time operator, original recipient reviewer, recurrence reviewer and fourth reviewer. A fifth reviewer records one independent unresolved evidence outcome; the original owner can acknowledge continuing manual HOLD after it.

- Append-only, unique per attempt/event-kind `gift_issuance_delivery_reopened_discrepancy_watch` with service-role-only read/insert and an invoker RPC.
- Atomic source checkout/certificate/attempt/approval matching, transaction advisory lock, active role checks, 14-day reassessment window and 24-hour owner aging watch.
- Three permitted stages: `owner_discrepancy_watch_opened`, `independent_discrepancy_reassessed`, `owner_no_resend_hold_ack`. The permitted discrepancy outcomes remain unresolved; neither stage certifies successful recipient delivery.
- The original gift's one-time provider send stays irrevocably consumed. No new email/SMS, duplicate issuance, charging, refund, balance change, Stripe write or gateway contact.
- New signed-staff endpoint `/api/admin/gift_delivery_discrepancy_watch` and operator panel under `/admin-gift-recovery-review.html`.

## Revised source-proof handoff: QL-246 reviewed

Source: owner-provided `ROSEVEAR_QL246_SIX_APP_SOURCE_PROOF_HANDOFF (1)(1).md` (October 28, 2026).

**This handoff is a technical request to all six apps, not permission to connect.** It supersedes any assumption that an unsigned QL-245 inventory establishes a valid gateway connection. QL-246 requires each app to independently produce a `publicKeyPem` + exact 24-field ordered `payload` + Ed25519 detached base64url `signature` envelope. The signing key must be generated locally, per application, and its private portion must never enter the repository or ChatGPT. Its SPKI SHA-256 pin must be supplied over a different authenticated channel. Exact source revision, immutable GitHub Actions run, fresh operator `np-...` challenge/hash, <=1-hour validity, seven actually observed negative denial traces and *actual* original receipt IDs are required before any signed source proof can be honestly published.

Build 692 includes a canonical QL-246 schema/byte serializer and **local ephemeral-key test** of the signing format. The generated test signature is not published, cannot be used to authenticate Rosie, and never authorizes a gateway.

The new owner-only endpoint `/api/admin/integration_v1_original_receipt_intake` and operator panel accept **nonsecret reference IDs** (starting `np-`) for future independent review. They persist only `UNVERIFIED_ORIGINAL`, `DISCONNECTED`, `NOT_GIVEN`; they never validate a signature or set a denial boolean to true. The references must be independently retrieved, pinned and witnessed; an owner-supplied reference is not proof.

There is deliberately **no** `docs/integration/ql246-source-proof.json`: no actual operator challenge, real app signing key, separately verified SPKI fingerprint, seven original test traces, nonproduction gateway receipts, or independent witness has been provided. Creating a filled or signed proof now would be fraudulent. See [docs/integration/ql246-source-proof-pending.md](docs/integration/ql246-source-proof-pending.md) for the exact six-app return checklist and the remaining external steps.

All integrations remain **DISCONNECTED**, with **NOT_GIVEN** owner authorization and all communications provider dispatch gates held. Two narrow read-only nonproduction endpoints remain disabled until separately provisioned: `GET /api/integration/v1/health` and `GET /api/integration/v1/capabilities`. No other read or write scopes are introduced.

## Validation

- `bash scripts/current_gift_issuance_regression.sh` — all B673–B692 unit/negative safeguards, including independent staff, duplicate denial, QL-246 canonical signing fixture and fail-closed source intake.
- `node scripts/build692_discrepancy_ql246_canary.mjs` — B681–B692 full synthetic progression, **only** executed in one `BEGIN`/`ROLLBACK`. It checks fifth reviewer distinctness, duplicate and mutable-ledger denial, original intake denial, no resend or gateway call, and zero synthetic residue.
- Database migration `20261028030000_build692_gift_discrepancy_and_original_receipt_intake.sql` — invoker RPCs, RLS, append-only ledger triggers, indexes and restricted grants.
- GitHub feature/dev/main A–D gates and Cloudflare exact-production-SHA HTTP smoke before any Production GREEN declaration.

## Next expected: Build 693

**Fifth-Reviewer Gift Discrepancy Recurrence Closure Watch & QL-246 Original Source Signature/Pin Verification Readiness.** Actual signing/verification remains gated by authentic independent operator evidence and separately authorized nonproduction tests.
