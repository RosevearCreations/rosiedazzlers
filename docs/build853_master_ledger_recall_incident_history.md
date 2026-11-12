# Rosie Dazzlers Build 853 — Consumer Replay-Ledger Evidence, Recall Escalation & Owner Incident History

## Original-source read and owner-only workflow

The private `GET /api/admin/jobday_replay_853?booking_id=<uuid>` route requires an original signed-in Rosie owner, the exact booking, a single linked project and bounded complete local post/attempt/audit windows. It computes **local-source** per-platform recommendations for open recall cases. At 24 hours, route to supervisor follow-up; at 72 hours, route to critical owner review. These are **proposed review targets**, not delivered notifications or provider actions. Missing manifest entries, tampered or future recall events, absent revocation, incomplete receipts, duplicate post IDs or truncated histories fail closed.

The private `POST /api/admin/jobday_replay_853` accepts two actions:
- `review_independent_replay_snapshot` validates a separately pinned Ed25519 signature on the exact v853 schema, signed from a consumer-side reviewer distinct from the original device and previous Master consumer signer, with a SHA-256 snapshot and chain digest, bounded ledger sequence, nonce, short expiry, exact booking/project/post/platform/case/current deployed SHA, and matching **previously audited** Build 852 Master decision hash/nonce/source revision. It stores only a sanitized owner audit receipt. That cryptographic review does **not** constitute independent remote ledger GET, transactional uniqueness proof, durable transport or Master CONNECTED. Missing evidence remains HOLD.
- `record_owner_incident_decision` permits a named original owner to append one safe, idempotent incident reference, action, exact route and current priority for the original booking/post and owner case. Allowed internal actions are critical acknowledgement, provider evidence recheck request, Master replay evidence recheck request, supervisor follow-up assignment, and continued external HOLD. These record owner intentions; they do not send messages, create external assignments, close global mirrors or grant receiver authority. Reused incident references and unsupported downgrades are rejected.

`GET` displays the most recent 50 sanitized owner incident decisions with timestamp, case reference, action, route, priority and explicit undelivered status. The underlying evidence is preserved through private `creative_project_audit`, subject to a hard 250-row audit history boundary. Historical nonce scans prevent a duplicate inside that window but **are not an atomic database replay ledger**; a separately proven transactional unique ledger remains an independent Master prerequisite.

## Security and operations boundaries

- New contract: `rosie.ai-data.social-recall.replay-review.v853`.
- New public key-only enrollment: `ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853`; must be distinct from `ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852` and `ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851`.
- Uses existing `ROSIE_RECALL_EXPECTED_PLATFORMS_852` manifest and `CF_PAGES_COMMIT_SHA`. Never check in private signing keys, bearer tokens, customer media or raw signed receipts.
- All source-side results remain `master_connection: HOLD`, `consumer_authorized: false`, `master_events_emitted: 0`, external provider/mirror removal unverified. No cross-app transport, browser-based CONNECTED grants, background dispatch or consent restoration is implemented.
- Independent AI Data Platform controller must verify its own durable replay and source receipts, signed endpoint audience, signer custody, atomically unique nonce ledger and owner acceptance to change any operational gate. See issue #861 and 853 controller follow-up.

## Protected release and evidence

The release-neutral `scripts/current_jobday_custody_regression.sh` includes Build 850, 851, 852 and 853 JavaScript regressions and syntax checks, executed by the permanent protected four-part Current Source Gate. Run `bash scripts/current_jobday_custody_regression.sh` locally before promotion and retain all normal Source Gate / documentation / Production Business Acceptance checks.

Merge the 853 feature PR into `dev` **only after required checks GREEN**, then a protected `dev`→`main` PR after every check passes. After merging, verify the exact `main` commit Cloudflare Pages Production status and all six business acceptance / exact-SHA smoke jobs GREEN before claiming software production. Source-only CI GREEN never means external provider removal or Master runtime CONNECTED.

## Next proposed build

Rosie Dazzlers 854 — Independent Ledger Atomicity Pilot, Escalation SLA Evidence & Master Incident Response Reconciliation.
