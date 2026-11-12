# Rosie Dazzlers 861 — Independent Intake Exception Aging, External Custodian Discrepancy Evidence & Owner HOLD History

Build 861 extends the original revoked-consent incident chain **855 → 858 → 859 → 860 → 861**. It supplies original-owner scoped, immutable claims and an age-aware private HOLD escalation history. **External transport, receiver ACK, provider recall completion, incident closure, and Master CONNECTED remain unverified and false**. An Ed25519 signature establishes receipt authorship, not the truth of an operational claim.

## Independent intake aging

GET `/api/admin/jobday_exception_861?booking_id=<UUID>&post_id=<UUID>&owner_case_reference=<ref>&incident_reference=<ref>&transaction_reference=<ref>` requires a signed-in original Rosie owner with `manage_staff`, disabled legacy-admin fallback, exact source revision, original revoked consent, matching incident audit, original 855 transaction, unique 857 readback, 858 handoff, 859 owner decision, open original 856 conflict, and private bounded 859/860/861 rows. An incomplete source window fails closed.

First owner exception age is computed from the **earliest** 860 owner exception (queried separately), not merely the latest 25 entries. Age thresholds: under 24 hours remains open; at 24 hours `ESCALATION_DUE_HOLD`; at 48 hours `CRITICAL_HOLD`. Missing or stale independent 860 intake reports `MISSING`/`STALE`; fresh is at most `FRESH_REVIEW_ONLY`, never a connection. Signed 861 disputes remain unresolved even after an owner review.

## External custodian discrepancy claims

POST `/api/admin/jobday_exception_861` with exact incident references, `action:"record_independent_custodian_discrepancy"`, `plane` (`ai-data-platform` or `rosevear-comms-hub`), an exact original `intake_860_id`, the v861 `receipt`, detached `signature`, a new `review_nonce`, `confirm_external_ed25519_discrepancy_claim:true`, and `acknowledge_discrepancy_is_not_runtime_delivery:true`.

Use two **distinct public-only** current custodian Ed25519 verification pins on the protected runtime:

- `ROSIE_AIDATA_DISCREPANCY_ED25519_PUBLIC_KEY_861`
- `ROSIE_COMMS_DISCREPANCY_ED25519_PUBLIC_KEY_861`

Neither pin may be reused from the enrolled 856, 859, or 860 keys. The exact signed fields/canonicalization are defined in `functions/api/_lib/jobday-exception-861.js`. Allowed codes are `INTAKE_DIGEST_DISPUTED` and `INTAKE_OBSERVATION_STALENESS_DISPUTED`. A digest dispute must claim a distinct 860 digest, not reassert it. Claims bind to the exact original 855 transaction, 858 handoff, 859 owner, 860 intake, current 860 owner exception, and deployed Rosie source SHA. Signatures and 5-minute issued-at freshness are checked server-side. Only the SHA-256 receipt digest and scoped reviewer metadata are persisted; never private keys or full receipts.

## Immutable owner HOLD escalation

The original owner can POST `action:"record_owner_hold_escalation"` with a unique `review_nonce`, `owner_action` one of `maintain_hold`, `request_independent_custodian_reconciliation`, `escalate_original_owner_incident`, and all of:

- `confirm_original_incident_still_open:true`
- `acknowledge_external_discrepancy_unresolved:true`
- `acknowledge_no_master_receiver_ack:true`

The record commits an age/status snapshot and an SHA-256-bound previous HOLD escalation ID/digest. Only one escalation per transaction/UTC day is possible. A concurrent tip change, replay, cross-source reference or changed original 860 owner exception fails closed. New incident actions **cannot** approve publication, mark recovery completed, or change Master connectivity.

POST `action:"export_original_owner_hold_history"` and `confirm_private_hold_export_only:true` returns a private, privacy-reduced snapshot containing source IDs, disputed claim digests, the newest 25 escalations, an explicit window-truncation marker and a deterministic bundle SHA-256; it does not send to either external Master.

## Release and operations

Migration: `supabase/migrations/20261112190000_build861_intake_aging_custodian_discrepancy.sql`, applied **only** to confirmed Rosie Supabase project after the preceding 860 migration. It creates `rosie_intake_discrepancy_v861`, restrictive RLS and service-role-only insert/select, immutable trigger, source-scoped atomic RPC with advisory lock, uniqueness constraints and predecessor verification.

Verify `node scripts/build861_intake_discrepancy_hold_test.mjs`, node syntax for the protected lib and route, and `bash scripts/current_jobday_custody_regression.sh` (retains 850–861). Promote feature → `dev` → protected `main` only on passing checks. Separately check exact `main` SHA Cloudflare Production and all required business-acceptance jobs. **GitHub/Cloudflare production GREEN is a software release state, not independent real-world source onboarding/receiver ACK or owner-accepted incident closure.**

## Next proposed build

**Rosie Dazzlers 862 — Independent Discrepancy Resolution Witness Review, Owner Aging Escalation SLA Recheck & Durable Master HOLD Custody Export.**
