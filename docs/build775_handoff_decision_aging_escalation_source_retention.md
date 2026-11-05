# Rosie Dazzlers Build 775 — Independent handoff decision, aging escalation and source retention

This is a **read-only source-evidence review** extension of Build 774. Successful Cloudflare production deployment is a software-release result, **not** original-owner business approval. The application never signs for a human owner, closes a source dispute, changes a handoff, updates a retention table, executes production SQL, archives or deletes originals, appends real business audit history or sends an external notification.

## Admin workboard and endpoint

- `/admin-economic-handoff-closure-v775.html` (with directory alias), linked from management catalogue and Build 774 workboard.
- `GET /api/admin/economic_handoff_closure_v775`: read-only issuer-configuration indicators; signed-in owner-capable session required.
- `POST`: 180 KB limit, same-origin JSON with exact case IDs and **nine original signed owner envelopes**: Builds 764, 765, 766, 768, 771, 772, 773, 774 and a fresh Build 775 original-owner manual decision/HOLD. The server re-fetches and cryptographically revalidates every predecessor Build 774 original source. No browser-supplied readiness claim is accepted.
- `PUT`, `PATCH` and `DELETE`: 405 HOLD. The screen imports local JSON and exports an **unsigned** evidence packet, never a real closure receipt.

## Newly required independent witness roles

1. `INDEPENDENT_HANDOFF_CLOSURE_DECISION_WITNESS` at `/v1/economic-handoff-closure-decision-v775` — exact prior handoff acknowledgment/register, current independent decision-register digest and clear/pending/conflict claim.
2. `INDEPENDENT_DISPUTE_AGING_ESCALATION_WITNESS` at `/v1/economic-dispute-aging-escalation-v775` — exact previous aging register, independent decision receipt, monotonically observed elapsed hours, original source alert threshold, open disputes and escalation result. Overdue, open or conflicting results remain HOLD.
3. `INDEPENDENT_SOURCE_RETENTION_CONTINUITY_WITNESS` at `/v1/economic-source-retention-continuity-v775` — prior signed closure-witness register, original retention policy digest, retained original history digest, current continuity register, critical exception count and source-signed expiry up to 30 days. A preserved claim is not storage enforcement, a completed retention closure or deletion authorization.

New roles use `ROSIE_ECONOMIC_<ROLE>_PUBLIC_KEY_B64`, `ROSIE_ECONOMIC_<ROLE>_KEY_ID`, and `ROSIE_ECONOMIC_<ROLE>_BASE_URL` from trusted hosting configuration, never browser inputs. Verification requires all **48 independent Ed25519 identities and 39 distinct root-pinned HTTPS issuers** across the full history. Missing, duplicated, loopback/private-style hostnames, credentials, altered transcripts, bad signatures, crossed case IDs, misleading chronology, missing receipts or an expired witness result all remain HOLD. Independent original issuer GET requests forbid redirects and limit signed JSON to 16 KB.

## Original-owner decision gate

The original owner manually signs `rosie-original-owner-handoff-closure-review-v775`, referencing the exact signed Build 774 owner, handoff acknowledgment, dispute aging and retention-closure witness receipts. Choices: `REQUEST_SEPARATE_HANDOFF_CLOSURE_REVIEW`, `HOLD_HANDOFF_DISPUTE`, `HOLD_AGING_ESCALATION`, `HOLD_SOURCE_RETENTION`.

`READY_FOR_SEPARATE_ORIGINAL_OWNER_HANDOFF_CLOSURE_DECISION` only means that the review inputs are consistent and independently signed. No real handoff, source closure, custody disposition, retention action, audit append or notification occurs. Human original owner and custodian approval is still a separate required step. Without authentic source claims or configured signers/origins, the correct status is HOLD.

## Regression

Run `node scripts/build775_handoff_decision_retention_test.mjs`. Covers all 48 signing identities, 39 pinned issuers, canonical payloads, exact owner/predecessor receipt binding, independent roles, source register conflict, SLA age threshold and monotonicity, critical retention count, expiry, signed owner HOLD, forbidden writes, authenticated endpoint restrictions, UI alias parity and unsigned packet handling.
