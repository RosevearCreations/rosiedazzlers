# Rosie Dazzlers Build 848 — Recovery reclosure, independent Master receipt freshness and owner marketing exceptions

**Source:** Rosie Dazzlers owned-business shell. **Feature release:** pending protected `dev` / `main` merge and exact-SHA Cloudflare Production GREEN verification. **Independent live provider/custodian, original-device, all public mirrors and AI Data runtime acceptance:** HOLD until separately verified.

## Recovered recall evidence

`GET/POST /api/admin/jobday_recovery_848` requires the **original signed-in Rosie owner session**, exact original job, uniquely linked private Creative Project, source-bound post, non-truncated private evidence ledger and explicit owner confirmations. Legacy admin-password and bridge authorization are not sufficient.

`reclose_verified_recovery` can record one new, **scoped** `recall_reclosed_verified_recovery_848` row only after an original Build 847 verified reopening, still-revoked customer consent, **fresh and separately signed** provider removal and CDN purge receipts admitted after that reopening, and original R2 deletion provenance. It checks the approved public derivative binding and performs a **new live authenticated R2 HEAD** proving the origin is still absent. A subsequent authenticated LIVE provider post prevents reclosure; another LIVE observation after recovery reopens the conflict state and removes that closure from current closed counts. Old pre-reopening provider, CDN or deletion receipts cannot alone reclose the episode. No provider mutation, CDN purge or external mirror deletion occurs in Build 848.

## Independently signed AI Data freshness receipt

`admit_independent_master_freshness` accepts a detached Ed25519 receipt only when the independently controlled AI Data public pin `ROSIE_AIDATA_SOCIAL_CONTRACT_ED25519_PUBLIC_KEY` is enrolled server-side, the original booking and project, v848 contract, named Master consumer, and current deployed `CF_PAGES_COMMIT_SHA` match. `issued_at` and `observed_at` must be within **15 minutes**, and expiry must be no later than 30 minutes after issue. Duplicate nonces, foreign signers, invalid signatures, unexpected fields and stale or drifting revisions fail closed.

Receipt fields **exactly**: `version, kind, source_id, shell_id, source_contract, source_revision, consumer_id, decision, permissions, booking_id, project_id, master_case_reference, nonce, issued_at, observed_at, expires_at, signer_id`.

Canonical signed bytes: `ROSIE-848-AIDATA-FRESHNESS-V1\n` followed by JSON array of the field values in this order. Receipt values: `version=1`, `kind=source_contract_freshness_review`, `source_id=shell_id=rosiedazzlers`, `source_contract=rosie.ai-data.social-evidence.preview.v848`, `consumer_id=ai-data-platform`, `decision=freshness_reviewed_no_runtime_ack`, `permissions=read_redacted_counts_only_no_event`. Source-bound `booking_id`, `project_id`, owner case, nonce and distinct signer required. Only a private canonical SHA-256 audit is persisted; **no operational Master health receipt, remote consumer, consumer ACK or CONNECTED state** is inferred.

## Owner marketing exceptions dashboard

The new Rosie Socials panel displays bounded per-job recall states, outstanding fresh provider/CDN proof, new R2 live recheck requirement, verified reclosures, conflict reopen counts and signer custody status. It is owner-only and accessible with status announcements and deliberate confirmations. `/api/admin/master_social_intelligence_v848` remains **signed-supervisor-only**, no external read or outbound events, and projects only de-identified aggregate counts; truncated-source windows and unknown completion scoring remain explicit. Existing 846/847 source previews also account for recovered and re-conflicted recalls.

**Validation:** `node scripts/build848_recovery_master_exceptions_test.mjs` plus cumulative `scripts/current_booking_wizard_regression.sh`. Test fixtures prove no production provider, CDN or Master actions. **Master handoff:** https://github.com/RosevearCreations/ai-data-platform/issues/839 — AI Data must independently accept v848 schema and its own signer, pin, receiver/audience, replay ledger, exact deployed revision and runtime acceptance. Until then Master HOLD stays in place.

**Next proposed Build 849 — Multi-Episode Recall Recovery Integrity, Marketing Exception Prioritization & Independent Master Runtime ACK Preflight.**
