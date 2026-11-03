# Rosie Dazzlers Build 762 — Nonproduction Trial Owner Sign-Off, Rollback Exception Disposition & Production Migration Change-Control Preflight

**Scope: private read-only review of externally signed decisions; production SQL, storage mutation and economic closure remain HOLD.**

Build 761 authenticates external nonproduction operator and witness *claims*, not a database execution. Build 762 re-executes the full Build 761 signed preflight from its eight original JSON inputs. It will not trust a browser-uploaded or downloaded readiness packet. The authenticated owner imports a ninth, newly signed trial decision only after an independent rollback disposition is available.

## Independent rollback exception disposition — signer 12

- A fixed server-owned HTTPS `ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_BASE_URL` responds to GET `/v1/economic-nonprod-rollback-disposition-v762` with an exact-schema Ed25519 envelope.
- A separate `ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_PUBLIC_KEY_B64` / `ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_KEY_ID` must not repeat any of the eleven earlier keys or key IDs. The signature binds booking, source, trial, nonproduction project, original operator and outcome receipt digests, matching rollback status/reference and fresh independent observation.
- A clean Build 761 witness requires `NO_EXCEPTION_CONFIRMED`. Every rollback, failed test, out-of-scope record, production write or customer dispatch claim requires `EXCEPTION_HELD_FOR_MANUAL_REVIEW`. Authentic exceptions remain open, never silently resolved by this page.

## Owner trial sign-off — existing pinned owner, new signing domain

- Owner provides an exact-schema Ed25519 envelope `rosie-owner-nonprod-trial-signoff-v762` signed with the already pinned owner key under a new domain. It binds the Build 761 packet digest, both earlier signed trial receipt hashes, new rollback disposition receipt, three artifact digests, isolated project/trial, nonce and chronology.
- Clean evidence may use only `accept_nonprod_trial_for_change_review`; any exception must use `hold_nonprod_trial_exception`. Neither decision is production SQL authorization.
- Invalid, stale, cross-project, wrong owner key, unsigned or conflicting decisions fail closed. A valid owner HOLD is displayed as such, and production planning remains blocked.

## Independent production change-control design — signer 13

- Server-owned fixed HTTPS `ROSIE_ECONOMIC_CHANGE_CONTROL_BASE_URL` GET `/v1/economic-production-change-review-v762` returns a separately signed change ticket and proposed production window (no more than four hours, at most seven days ahead).
- Pinned `ROSIE_ECONOMIC_CHANGE_CONTROL_PUBLIC_KEY_B64` / `ROSIE_ECONOMIC_CHANGE_CONTROL_KEY_ID` must be distinct from all twelve other role keys. This role must use a different HTTPS origin from the operator, outcome and rollback reviewers.
- Signed `rosie-production-change-control-preflight-v762` binds exact production and nonproduction project refs, owner/rollback receipts, migration/rollback/backup SHA-256 artifacts, DBA/security/rollback **design-only** checks and the required literal `production_execution_authorization: NOT_GRANTED`.

If all external reports agree, status is `READY_FOR_SEPARATE_PRODUCTION_CHANGE_AUTHORIZATION`, **not execution-ready**. Otherwise status is `HOLD_PRODUCTION_CHANGE_CONTROL_PREFLIGHT` with concrete blockers. A signature authenticates a claim but cannot independently prove its physical database observations.

Every response retains `production_execution_authorized: false`, `production_migration_executed: false`, `rollback_executed_by_app: false`, `production_credentials_read: false`, `customer_notifications_sent_by_app: false`, `owner_closure_audit_persisted: false`, `closure_allowed: false`, `automatic_business_write: false`.

No SQL bytes, production API credentials, new migration files, DB query/DDL, storage changes, customer outreach or case closure are used. The UI imports evidence locally and exports an **unsigned** review packet. No real-world operator or owner signatures have been supplied for this release: operational execution and closure still remain HOLD.

## Owner checklist

1. Confirm authentic independent Build 761 nonproduction execution and witness receipts.
2. Obtain an independently signed rollback disposition tied to the original witness. If exceptions appear, sign HOLD and investigate outside this site.
3. Sign the new owner review only for the exact isolated trial and artifact hashes.
4. For a clean trial, obtain the separately signed production change **design** with target project, rollback plan and future window; it explicitly grants no execution.
5. Open **Build 762 · Owner trial sign-off & production change preflight** in Rosie Dazzlers Admin, import all nine JSON documents and review follow-ups. Separate DBA/security/owner production authorization and operational execution must be requested later.

Local acceptance: `node scripts/build762_owner_change_control_test.mjs`, `node scripts/build761_operator_trial_receipt_test.mjs`, `bash scripts/current_booking_wizard_regression.sh`, `python3 scripts/release_check.py`.

Sources: [Supabase branching](https://supabase.com/docs/guides/deployment/branching/working-with-branches), [database migrations](https://supabase.com/docs/guides/deployment/database-migrations), [PostgreSQL RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
