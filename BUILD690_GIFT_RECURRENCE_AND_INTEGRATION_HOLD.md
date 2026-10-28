# Rosie Dazzlers Build 690 — Independent Gift Closure Recurrence & Integration v1 HOLD

## Owner acceptance, 28 October 2026

Build 690 adds an internal independent check of a **closed** Build 689 gift-delivery exception. The original gift-dispatch slot remains consumed. It cannot trigger another recipient message, purchaser copy, SMTP/Resend provider request, queued job, charge, reissue, refund or certificate balance mutation.

1. The original signed-in owner who performed the B689 closure opens a watch and assigns a *third* active staff reviewer. The third reviewer must differ from the original delivery operator, the B689 independent recipient reviewer and the owner.
2. Only that third reviewer may record a fresh recurrence outcome within 14 days of assignment. Outcome is one of `no_recurrence_observed`, `recurrence_detected` or `evidence_missing`. Recipient evidence must be genuine; provider acceptance is not proof of delivery.
3. After the separate review, the original owner may acknowledge the internal no-resend alert. Acknowledgment does **not** close a newly detected recurrence or authorize a second send. The reviewer outcome remains visible in the immutable audit.
4. The read-only view flags watches with closures at least 24 hours old, assignments at least 24 hours old, or new unacknowledged detected/missing evidence. The alert is on-screen only; it does not schedule or dispatch anything.
5. Records are unique by original attempt and event kind, insert-only with an immutability trigger, service-role only, and signed staff session checks. A server-side SQL procedure revalidates exact certificate, case, checkout, original attempt, consumed notification, owner, third-reviewer independence and sequencing while holding a checkout-specific transaction lock.

The owner page is `/admin-gift-recovery-review.html` under **Build 690: closure recurrence**. All evidence references must be non-personal, uppercase identifiers. The application never asks for or reveals the recipient's complete email in this panel.

## QL-243 nonproduction Integration v1 review

The same admin page includes an **owner-only readiness inventory**. Its GET reports whether four nonproduction configuration fields *appear present* (mode, origin, key ID and HMAC key shape), never their values. The server separately reports independent gateway audit `false`, independent witness receipt `false`, and pilot authorization `false`. No gateway is called.

The owner may record an immutable seven-field checklist in `rosevear_integration_v1_owner_readiness_reviews`. Database constraints only accept connection `HOLD` and pilot `false`; receipt records do not grant live scope. Every saved checklist is explicitly **not** a successful connection test.

Integration **must remain disconnected** until a separate owner-approved, authenticated gateway test and independent four-company isolation proof are received and reviewed. The B689 source endpoints stay nonproduction-only on an explicitly configured non-`main` Cloudflare Pages origin with HMAC, timestamp, nonce and audit protections. Build 690 never changes those endpoints or adds dispatch capabilities.

## Verification

- `bash scripts/current_gift_issuance_regression.sh` includes all B673–B690 deterministic tests.
- `node scripts/build690_recurrence_readiness_canary.mjs` emits the complete B681–B690 synthetic SQL chain. Run it **only within BEGIN/ROLLBACK** against Supabase, alongside the B690 migration when trialing it. It includes wrong-reviewer and duplicate rejection, one-time send invariants, independent audit outcome, owner alert acknowledgment, append-only rejection, false gateway-proof denial, HOLD receipt, rollback marker and zero-residue checks.
- CI **Current Source Gate** suites A–D and aggregate; **Production Business Acceptance & Exact-SHA Authority** must all pass on the exact GitHub `main` commit, with Cloudflare production smoke, before calling production GREEN.

No real customer message, payment, provider dispatch, credential, gateway connection, pilot approval or cross-business customer data is part of Build 690.

## Suggested Build 691

**Gift Recurrence Exception Reopening Evidence, Independent Aging Reassessment & QL-243 Nonproduction Gateway Witness Handoff** — track genuine exception reopening instead of interpreting a no-resend alert acknowledgment as resolution; accept only owner-supplied, independently verified *nonproduction* gateway receipts. No launch without a fresh owner approval.
