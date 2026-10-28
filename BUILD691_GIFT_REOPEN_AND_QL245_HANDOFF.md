# Rosie Dazzlers — Build 691

**Gift Recurrence Exception Reopening Evidence, Independent Aging Reassessment & Integration v1 Nonproduction Gateway Witness Handoff**

## Outcome and boundaries

Build 691 adds a narrow *internal-only* path for gift-delivery exceptions that an independent Build 690 reviewer already marked `recurrence_detected` or `evidence_missing`. No new certificate, email, SMS, resend, recipient copy, charge, refund, adjustment, or provider request is part of the path. A reopened case and an owner's subsequent acknowledgment **remain held for manual resolution**; they never constitute confirmed delivery.

1. The original owner can reopen the exact gift only after a distinct third reviewer's Build 690 recurrence evidence. The owner assigns a **fourth distinct active staff reviewer**, different from that owner, original one-time delivery operator, Build 689 recipient rechecker and Build 690 recurrence reviewer.
2. Only the fourth reviewer records a later independent evidence/aging reassessment, within 14 days. Outcomes: `still_unresolved`, `new_evidence_not_confirmed`, or `evidence_conflicting`. A provider-accepted receipt is not recipient delivery confirmation.
3. The original owner can then acknowledge *continuing HOLD*, not close or retry the gift. A 24-hour internal aging alert reports overdue evidence; it does not schedule contact, write to Stripe, or bypass the consumed one-time email slot.
4. Each stage is one-time per original delivery attempt, service-role insert-only with RLS and append-only trigger. The SQL function checks original case, certificate, checkout, irreversible notification, source recurrence ID and full review role separation within a transaction-scoped advisory lock.

The operator page is `/admin-gift-recovery-review.html` → **Build 691**. Only exact checkout session IDs and nonpersonal uppercase evidence codes are entered; recipient emails are masked.

## Revised QL-245 six-app connectivity document, reviewed

Source: owner-provided `ROSEVEAR_INTEGRATION_V1_QL245_EVIDENCE_RETURN_HANDOFF(3).md`, titled *QL-245 six-app evidence return and conditional connection-testing handoff* (dated October 27, 2026).

The critical correction: **production-green code, synthetic HMAC tests and an unsigned local metadata draft are not proof of an actual nonproduction gateway connection.** All four company connections stay **DISCONNECTED** and all twelve communications dispatch gates remain **HELD_UNVERIFIED**. Build 691 does **not** provision a key, call a gateway, issue a signature, register a tenant, prove an independent witness, or grant a pilot.

Rosie is limited to the two existing QL-243 authenticated server-only routes:

- `GET /api/integration/v1/health`
- `GET /api/integration/v1/capabilities`

They require an exact nonproduction origin/branch, HMAC key, identity, canonical 12-line request, timestamp, nonce, atomic replay audit, and fail-closed behavior. Both remain off unless separately provisioned. There is **no** product/listing/booking/customer read capability, and absolutely no dispatch/write scope.

The B691 owner-only QL-245 panel exposes **a 22-field UNSIGNED metadata draft** with exact field order and seven **false/unverified** original negative-test flags. It has null signature/key/receipt/CI proof fields and null issuance/expiry timestamps intentionally. It cannot pass the offline QL-245 signature verifier. The owner's acknowledgment saves only an append-only **EVIDENCE_PENDING / DISCONNECTED / NOT_GIVEN / UNVERIFIED** record. All seven denial claims are explicitly `false` in database checks: nonce replay, stale request, wrong business, wrong tenant, revoked key, prohibited write and prohibited dispatch.

### What must happen before sending real nonproduction proof to Comms Hub

1. Independently pin the exact **new Build 691** source SHA, green Actions run and nonproduction deployment revision. A production `main` SHA is code readiness only.
2. Separately approve and provision source-specific and gateway-specific nonproduction credentials through the secret manager. Keep all secrets off chat and GitHub.
3. With separate owner approval for *testing*, witness real signed GET health/capabilities results plus their original source and gateway audit IDs, seven distinct actually executed denials, key revocation/rollback and read-after-restart durability. Do not infer any from fixture PASS.
4. Obtain separately authenticated, distinct Ed25519 public SPKI SHA-256 pins for all six source apps and seventh assessor; sign canonical public metadata and verify it offline against separately sourced pins, not packet-supplied trust.
5. Only after an independent original-source witness review could an owner consider a **new**, scoped, time-bound, separately authenticated pilot decision. No pilot is authorized by this build.

The returned plain-language Rosie status and missing proof inventory is in [ROSEVEAR_QL245_ROSIE_EVIDENCE_RETURN.md](ROSEVEAR_QL245_ROSIE_EVIDENCE_RETURN.md).

## Verification

- `bash scripts/current_gift_issuance_regression.sh` — complete B673–B691 signed-staff and no-duplicate-customer-action regressions.
- `node scripts/build691_reopen_ql245_canary.mjs` — generates the entire B681–B691 synthetic chain, to run **only inside BEGIN/ROLLBACK**. Tests fourth-reviewer independence, negative role bypass, duplicate denial, append-only records, permanent no-resend invariants, true/false QL-245 denial claims, and zero synthetic residue.
- Supabase migration `20261028020000_build691_gift_reopen_and_ql245_handoff.sql` — restricted service-role `SECURITY INVOKER` functions, RLS and append-only owner/independent audit tables.
- Source promotion gates A–D + aggregate on feature and dev/main; exact Cloudflare Production SHA and public HTTP smoke must be GREEN before announcing completion.

## Next expected: Build 692

**Independent Reopened Gift Evidence Discrepancy Resolution Watch & QL-245 Nonproduction Original-Receipt Intake Readiness** — evidence-only review, and a signed-receipt intake proposal gated behind actual separately authorized nonproduction tests. No dispatch or activation by default.
