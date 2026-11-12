# Rosie Dazzlers 854 — Independent Ledger Atomicity Pilot, Escalation SLA & Master Incident Response

## Source and independent authority

This build adds the original-owner-only private `/api/admin/jobday_atomicity_854` GET/POST route. A live authenticated Rosie owner session is mandatory (staff bridge, legacy password and browser authority alone are denied). The endpoint only works for an exact original booking, unique linked creative project, <=20 posts, <200 attempts per post, <250 prior audits, <100 atomic ledger rows, an explicit original Build 843 consent withdrawal audit and complete Build 852/853 platform routing. Missing or truncated evidence returns HOLD. No public-facing exposure, social-provider action, outbound Master request or consent restoration.

## Atomicity pilot — truly one database operation

Migration `supabase/migrations/20261112064000_build854_incident_atomic_ledger.sql` installs a private RLS-enabled append-only table and a service-role-only PostgREST RPC `rosie854_append_evidence`. Unique database constraints arbitrate concurrent requests for (kind, nonce), exact signed ledger sequence per case/post and one signed independent Master response per original owner incident; `INSERT ... ON CONFLICT DO NOTHING RETURNING` returns `REPLAY_OR_CONFLICT` for retries. No pre-read-only uniqueness claim is used. The ledger has a rewrite-blocking trigger, no anon/authenticated grants and a server-only original booking/project/post relational check.

**Important:** A committed migration file does **not** prove it has been applied to a runtime database. The server must reject writes when its RPC is absent. A successful source-local INSERT verifies only one local database claim, not a distributed two-phase commit, remote consumer-side replay, independent Master transport, or accepted external incident closure. The original Build 853 audit remains historically correct but is **not retroactively marked atomic**.

To claim one pilot snapshot, first persist the exact signed Build 853 snapshot review and its earlier Build 852 consumer audit, then POST action `claim_atomic_replay_pilot` with `booking_id`, `post_id`, `owner_case_reference`, signed Build 853 `receipt`, detached `signature`, `confirm_independent_ledger_signer:true` and `acknowledge_no_master_atomicity_or_transport_grant:true`. The handler independently re-verifies Ed25519 and exact current deployed SHA, prior source review, original case, nonce and sequence before attempting the atomic transaction.

## Escalation SLA and independent response

GET returns recent sanitized atomic ledger entries, original local routing recommendations, SLA due/observed timestamps and explicit external HOLD. SLA time starts at the durable **original 853 owner incident decision audit's recorded time**, not the time somebody later requests a report. Targets are 4h for CRITICAL, 12h HIGH, 24h ELEVATED, and 72h MONITOR. They are internal review clocks only; signed Master observations are not proof of delivery or notification. Missing/changed routes or future/unparseable incident timestamps fail closed.

POST action `reconcile_independent_master_incident` requires an original incident reference with matching original 853 audit, an **atomic Build 854 source ledger snapshot** with exact digest and sequence, and a new independent Ed25519 Master signed response. The exact v854 signed fields include currently deployed Rosie source revision, original booking/project/post/platform/case/incident, prior source atomic digest+sequence, the original owner audit UUID, non-authorizing disposition, receiver, independent signer, nonce and bounded timestamps. The controller must enroll public-only key `ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854` separately from original device (851), consumer (852) and ledger reviewer (853) public keys. Two allowed responses: `hold_response_acknowledged` and `hold_response_recheck_required`; `permissions` must be `review_only_no_master_grant`.

The original owner POST must additionally set `confirm_independent_master_response_signature:true` and `acknowledge_no_delivery_or_connected_grant:true`. New atomic master-response records reject duplicate nonces and duplicate original incident resolutions even with distinct signed receipts. No signed receipt or API claim can change `master_connection:'HOLD'`, `master_runtime_ack:false`, or `master_events_emitted:0`.

## Verification and production boundaries

- Check JS: `node --check functions/api/_lib/jobday-atomic-854.js` and `node --check functions/api/admin/jobday_atomicity_854.js`.
- Run `node scripts/build854_atomicity_sla_test.mjs` and `bash scripts/current_jobday_custody_regression.sh` as part of protected Source Gate.
- Apply the reviewed migration to **the correct Rosie Dazzlers Supabase project**, then confirm the table constraints, RPC permissions, RLS and rewrite trigger. A live duplicate race/rollback pilot against authorized test records is a separate acceptance checkpoint, never inferred from CI alone.
- Promote via feature PR -> `dev` with all protected checks GREEN, then protected `dev` -> `main` PR. Check current exact-SHA `main` CI and Cloudflare Pages Production before declaring **software** production GREEN.
- Even once software production is GREEN, original signed Master ACK, independent remote replay/atomicity, external consent removal and owner operational acceptance remain HOLD until evidenced by real independent systems. No credentials, customer media, private signing keys or bearer tokens are committed.

## Next proposed build

Rosie Dazzlers 855 — Independent Master Transaction Replay Pilot, Cross-Plane SLA Resolution Proof & Owner Incident Acceptance Closure.
