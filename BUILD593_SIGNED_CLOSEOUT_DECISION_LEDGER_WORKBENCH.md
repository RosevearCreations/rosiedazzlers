# Build 593 — Independent Signed Closeout Decision Ledger & Owner Review Workbench Integration

## Scope and delivered behavior
Build 593 extends the full Build 592 independently retained owner-review-head rotation, Ed25519 independent auditor resolution receipt, independently pinned handoff and owner-signed closeout review candidate.

- `scripts/release_incident_signed_closeout_decision_ledger.mjs` provides a canonical signed owner closeout **decision ledger**. Every verification re-runs the complete Build 592 proof, which in turn verifies the pinned exact-S3-version Object Lock readback, rotated review-head digests and external register, signed handoff, independent auditor signature and explicit owner closeout candidate. A supplied or fabricated `status: VERIFIED` cannot substitute for these underlying proofs.
- Only four Ed25519-signed human owner decisions are allowed: `ACKNOWLEDGE_CANDIDATE`, `DEFER_REVIEW`, `REJECT_CANDIDATE`, and `REQUEST_MANUAL_HANDOFF`. **No CLOSE, RESOLVE, CLEAR_HOLD, DELETE or OVERRIDE decision exists.**
- Every signed decision is bound to exact repository, issue, incident, rotation-head digest, handoff-head digest, owner closeout receipt digest, independent auditor receipt digest, manual owner decision reference, timestamp, and its prior signed decision digest.
- Decision receipts must form a complete ordered SHA-256 predecessor chain with independent externally retained `headDigest`, `receiptCount`, `sourceCloseoutReceiptDigest`, `exceptionRotationDigest`, and `externalReference`. Removed, reordered, altered, replayed, future-dated, forged, wrongly signed or unanchored receipts produce HOLD.
- `ownerCloseoutReviewWorkbench()` produces a read-only, owner-facing presentation model of the cryptographically verified decision history and latest human decision. It always returns `liveExceptionStatus: "UNCHANGED"`, `manualOwnerActionRequired: true`, `auditHoldCleared: false`, `automaticClosure: false`, `automaticEscalation: false`, and `externalWritePerformed: false`.
- Deterministic tests use ephemeral Ed25519 keys and synthetic evidence and are imported by the required cumulative Current Source Gate.

## Operating boundaries
No live owner signature, real independent auditor, independent storage provider, WORM write, GitHub issue comment, production exception, business record, payment or booking was created or changed. This is a **read-only verification and workbench data model**, not a functioning administrative UI route. Operational usage still requires independently held signed evidence and trust pins, explicit human authorization, and a future, separate owner-approved implementation for any actual exception-state change.

Rosie Dazzlers **guided quote-first booking wizard remains optional** alongside existing direct booking. Build 593 does not modify quote-first intake configuration, Stripe, deposits, pricing, booking slots or booking navigation.

## Tests and release acceptance
- `node scripts/release_incident_signed_closeout_decision_ledger_test.mjs`
- `node scripts/release_health_monitor_test.mjs` (full suite including Build 593).
- Protected `dev`/main source checks, Cloudflare Pages exact-main production deployment, and final business acceptance must all pass before release GREEN.

**Next proposed: Build 594 — Manual Closeout Review Evidence Export & Owner Decision History Handoff.**
