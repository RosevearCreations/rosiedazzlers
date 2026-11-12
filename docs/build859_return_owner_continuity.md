# Rosie Dazzlers Build 859 — Independent Escalation Receipt Return, Owner Decision and Long-Lived Incident Continuity

This release extends the **original** revoked-consent Rosie incident proof lineage (855→857→858). An independently signed return is an acknowledgment **for review only**, never proof that a receiver performed a delivery/removal, recovered a case, accepted a service-level target, or transitioned a Master to CONNECTED. All operational states remain HOLD.

## Independent cross-plane escalation receipt return

`POST /api/admin/jobday_return_859` with the exact original booking, post, owner case, incident and transaction references, `action:"record_independent_escalation_return"`, `plane:"ai-data-platform"` (or `"rosevear-comms-hub"`), an original independent v859 receipt and detached Ed25519 `signature`, unique `review_nonce`, `confirm_independent_ed25519_return_verification:true`, and `acknowledge_receiver_observation_not_operational_ack:true`.

The complete strictly canonical signed contract is `CONTRACT_859` in `functions/api/_lib/jobday-return-859.js`: version, kind, plane, source, handoff/review revisions, exact booking/project/post/case/incident/855 transaction, immutable 858 handoff ID and SHA-256, original 857 owner readback, non-authorizing review claim/disposition/permissions, nonce, time bounds, and independent signer. The signed receipt binds the 858 handoff to its historical source revision **and** the current deployed Rosie review revision. New observations must be no older than five minutes, unexpired, and after the original handoff. Invalid signatures, signer pin reuse, cross-plane substitution, tampering, replay and stale receipts fail closed.

Two separately enrolled pinned **public** Ed25519 keys are required on the protected server: `ROSIE_AIDATA_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859` and `ROSIE_COMMS_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859`. They must be distinct from each other and previously enrolled original delivery witness pins. Do not place private keys, raw receipts, tokens or customer media in GitHub or public builds. The new service-only ledger stores only digests, signer labels, and timestamps. No outbound network request or provider mutation occurs.

## Original-owner recovery decision

With a signed-in original Rosie owner session, the unique original 857 readback, the exact immutable 858 handoff and owner export, original revoked-consent source and incident routing, and **two distinct** Ed25519 return custody records no more than 24 hours old, the owner may `POST` `action:"record_original_owner_recovery_decision"`, `owner_action:"maintain_external_hold"` / `"request_independent_master_recheck"` / `"escalate_unresolved_conflicts"`, a new nonce, and both explicit `confirm_both_signed_escalation_returns:true` and `acknowledge_unresolved_master_and_incident_hold:true`. Exactly one non-authorizing immutable owner decision can be accepted per original transaction. No action allows incident close, CONNECTED, auto-send or replay.

## Long-lived incident continuity

The signed-in owner may record an immutable `action:"record_incident_continuity_checkpoint"` with new nonce, `confirm_owner_incident_still_open:true` and `acknowledge_no_external_resolution:true`. The service-only database independently verifies original 855/857/858 lineage, open source conflicts, the current predecessor chain tip, and **one checkpoint per UTC calendar day**. First checkpoint is `INITIAL_OWNER_HOLD_CHECKPOINT`, later up to 48 hours is `CURRENT_HOLD`, and a gap beyond 48 hours is `GAP_REVIEW_REQUIRED`. A gap does not auto-resolve or erase prior custody. Every checkpoint is linked by previous checkpoint UUID and SHA-256; tampering/duplicate day/source drift fails.

`GET /api/admin/jobday_return_859?booking_id=<UUID>&post_id=<UUID>&owner_case_reference=<ref>&incident_reference=<ref>&transaction_reference=<ref>` provides scoped return/owner review status and the most recent 25 immutable continuity checkpoints. Older history remains in the private database; the response explicitly flags possible truncation rather than claiming an exhaustive multi-year export. `POST` with `action:"export_owner_incident_continuity"` and `confirm_private_owner_export_review:true` produces a privacy-safe, SHA-256-hashed **bounded** owner HOLD evidence snapshot, never remote submission.

## Production controls

- Apply `supabase/migrations/20261112170000_build859_return_owner_continuity.sql` in the **original RosieDazzlers** Supabase project only. Verify RLS enabled, service-role SELECT/INSERT only, browser-role EXECUTE revoked, immutable trigger, unique return/daily-checkpoint indexes, and invoker/advisory-lock RPC.
- Run `node scripts/build859_return_owner_continuity_test.mjs` and the retained `bash scripts/current_jobday_custody_regression.sh` as part of the protected four-part Current Source Gate, then all PR/source/production authorities.
- Promote feature branch → `dev` after exact feature checks, then separately `dev` → protected `main`; verify the exact `main` SHA in Cloudflare Pages, the six-job Production Business Acceptance and release health.
- No live customer/receiver test records should be fabricated in production. The new live independent signer enrollment and actual receipt issuance are operator prerequisites; source code GREEN is **not** independent Master acceptance.

## Next proposed build

**Rosie Dazzlers 860 — External Escalation Intake Correlation, Independent Custodian Return Freshness & Owner Continuity Exception Review.**
