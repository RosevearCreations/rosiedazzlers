# Rosie Dazzlers Build 771 — Independent Owner Final Decision Attestation, Handoff Dispute Resolution & Retention Exception Escalation

## Scope and evidence boundary

Build 771 is an authenticated, **read-only** review of original external evidence. It does **not** authorize, perform, or imply a final owner acceptance, payment, database migration, customer notification, immutable audit append, archive write, dispute closure, or retention destruction. A software release with green checks is distinct from authentic external business evidence or a real owner's final authorization.

The `/admin-economic-final-owner-v771.html` owner workboard accepts five local, signed JSON envelopes: the original owner decisions from Builds 764, 766, 767 and 768, plus a **new** original-owner final manual decision for Build 771. It sends them via same-origin authenticated POST to `/api/admin/economic_final_attestation_v771`. Browser-provided historical review packets are not trusted. The server independently replays the source verification and signed evidence chain through Build 770 before evaluating 771.

## New signed evidence and original-source readback

1. `rosie-original-owner-final-manual-decision-v771`: original owner signs an exact booking, source, change ticket, execution request, trial, project, Build 768 owner receipt, Build 770 register/acknowledgment/aging receipt, manual choice, owner ticket, owner identity, issue timestamp, nonce and pinned owner key ID. Available choices are manual external acceptance review, external handoff dispute review, or retention exception escalation HOLD. None executes business acceptance.
2. `rosie-independent-final-owner-decision-attestation-v771`: independent final-decision attestor signs the exact owner final-decision receipt, Build 770 register/acknowledgment/aging receipts, before/after decision-register digests, witness result, time, witness and key IDs. A witnessed decision **claim** does not certify a business mutation.
3. `rosie-independent-handoff-dispute-resolution-v771`: independently signed original handoff manifest and acknowledgment alignment, upstream attestation digest, dispute-register digest, case, disposition and witness. An unresolved or contested handoff holds owner review; a referred case is not automatically resolved.
4. `rosie-independent-retention-exception-escalation-v771`: independent retention witness signs original Build 770 aging and exception-register digests, current escalation register digest, escalation case, unresolved-critical count and disposition. A critical exception or open escalation holds owner review and requires real custodian/operator follow-up.

All payloads have exact canonical field sets, domain-separated SHA-256 receipt digests and Ed25519 signatures. The independent HTTPS issuers are server-pinned and read using GET only with redirects rejected and 16 KB response caps; any unavailable/invalid original source is HOLD. New server configuration roles:

- `INDEPENDENT_FINAL_OWNER_DECISION_ATTESTOR`
- `INDEPENDENT_HANDOFF_DISPUTE_WITNESS`
- `INDEPENDENT_RETENTION_ESCALATION_WITNESS`

Each requires `ROSIE_ECONOMIC_{ROLE}_BASE_URL`, `ROSIE_ECONOMIC_{ROLE}_PUBLIC_KEY_B64`, and `ROSIE_ECONOMIC_{ROLE}_KEY_ID`. Across Builds 754–771, all 36 pinned public signing identities and all 27 pinned HTTPS origins must be independent; configure genuine original issuers, not placeholders, clones, or fabricated witnesses.

## Release and business acceptance

Software deployment can become `main` Production GREEN when the exact SHA has passed the protected tests, Cloudflare Pages deployment and release health checks. Original owner final business acceptance **remains external and manual**. In a fully clean review, the application displays `READY_FOR_SEPARATE_MANUAL_FINAL_OWNER_BUSINESS_ACTION`, not an accepted/closed/reopened original business record. Every nonclean or missing claim yields `HOLD_FINAL_OWNER_DISPUTE_OR_RETENTION_ESCALATION` with concrete follow-up items.

Verify with `node scripts/build771_final_owner_dispute_escalation_test.mjs` and `bash scripts/current_booking_wizard_regression.sh` in the full repository; both are wired into the existing protected test runs. The regression tests cover signature, time, scope, unique key, unique source, original manifest, linked digest, critical escalation, owner choice, read-only endpoint and mirrored owner interface.
