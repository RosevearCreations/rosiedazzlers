# Build 598 — Independently Signed Follow-Up Handoff Receipt Review & Manual Exception Handoff Governance

## Delivered
- A **read-only independent review receipt** for the exact independently pinned Build 597 signed manual owner follow-up handoff. Every verification first rechecks the entire Build 597 cryptographic source and exact immutable versioned COMPLIANCE Object Lock readback; no caller-supplied VERIFIED status is accepted.
- The independent reviewer signs an Ed25519 receipt binding the exact repository/issue/incident, retained object key/VersionId/record SHA-256 digest, follow-up decision-head SHA-256, owner handoff-head SHA-256, reviewer reference, finding and canonical timestamp. The reviewer signer fingerprint is independently pinned, distinct from the verified owner and original investigator keys. Reviews predated before the final owner handoff or placed in the future fail closed.
- Findings are limited to `ACCEPT_FOR_MANUAL_REVIEW`, `FOLLOWUP_EXCEPTION_REPORTED`, and `ADDITIONAL_EVIDENCE_REQUIRED`. None asserts actual transmission or authorizes exception closure.
- An **off-repository receipt pin** must independently match the exact Ed25519-signed reviewer receipt digest, retained record digest, original owner handoff head, reviewer fingerprint and independent evidence reference. A signature alone does not establish independent custody.
- The owner manually creates a separate, complete Ed25519 signed decision history, each record binding that independently verified reviewer receipt, original immutable record/follow-up/handoff digests, issue/incident, sequence, previous SHA-256 receipt digest, canonical decision time and owner decision reference. A distinct, independently controlled owner governance-head pin must match the final decision digest, complete count, reviewer receipt, immutable record, owner handoff and issue.
- Allowed owner actions are `ACKNOWLEDGE_REVIEW_RECEIPT`, `REQUEST_MANUAL_EVIDENCE_RECHECK`, `DEFER_OWNER_HANDOFF`, `ESCALATE_MANUAL_EXCEPTION_REVIEW`. There is **no CLOSE, CLEAR_HOLD, RETAIN, RELEASE or OVERRIDE action**.
- `ownerManualHandoffReviewWorkbench` returns a purely **read-only owner workbench data model** listing the independent finding, signed owner decision chain and manual next step. It always preserves `liveExceptionStatus: UNCHANGED`, `auditHoldCleared: false`, `automaticClosure: false`, `automaticDelivery: false`, and `externalWritePerformed: false`.

## Trust, activation and cost limits
These are provider-neutral cryptographic source contracts with deterministic synthetic regression tests and ephemeral keys. Build 598 does **not** deploy a real admin UI, configure or charge for a WORM archive, create independent signatures/pins, transmit evidence, dispatch a review workflow, close an exception or alter customer records, prices, bookings, or Stripe. Real use requires separately provisioned independent signer custody, a genuine manual owner decision and off-repository pin retention. No automatic activation is included.

The quote-first customer booking wizard remains **optional** alongside standard/direct booking. No production booking route, intake gating or payment flow changes occur in Build 598.

## Tests and release acceptance
- `node scripts/release_incident_followup_handoff_review_test.mjs`
- `node scripts/release_health_monitor_test.mjs` (cumulative mandatory Current Source Gate, including Build 598).
- Protected GitHub `dev` → `main` promotion plus successful exact-main Cloudflare Pages Production deployment, exact Production verification and full Business Acceptance before GREEN.

**Next proposed Build 599 — Independent Owner Handoff Exception Decision Receipt Export & Manual Review Follow-Up.**
