# Rosie Dazzlers Build 763 — Independent Production Change Authorization Decision, Migration Operator Gate & Controlled Rollback Witness Readiness

**Scope: owner-session-only, read-only verification of independent external approval and readiness claims.** No actual production SQL or rollback is performed; no credentials, backups, migration scripts, notifications, persisted audit or business exception closure are touched.

This review re-runs the full Build 762 private signed preflight (which itself re-runs Builds 761/760). The browser never supplies a trusted upstream readiness packet. All original nine source/owner evidence JSON files and a **tenth, new signed owner production decision** must be provided. Server-owned independent HTTPS providers supply the other four receipts.

## Required independent signers and origins

The original 13 unique Ed25519 signer public keys and key IDs from Build 762 remain required. Four further independently pinned roles must have **distinct keys and key IDs from all 17 roles**, and all four HTTPS origins must differ from each other and the four existing trial/change-control provider origins.

| Role | Server-owned HTTPS base URL | New public key and key ID suffix | Fixed GET route |
|---|---|---|---|
| Production DBA authorization | `ROSIE_ECONOMIC_PRODUCTION_DBA_AUTH_BASE_URL` | `PRODUCTION_DBA_AUTH_PUBLIC_KEY_B64` / `PRODUCTION_DBA_AUTH_KEY_ID` | `/v1/economic-production-dba-authorization-v763` |
| Production security authorization | `ROSIE_ECONOMIC_PRODUCTION_SECURITY_AUTH_BASE_URL` | `PRODUCTION_SECURITY_AUTH_PUBLIC_KEY_B64` / `PRODUCTION_SECURITY_AUTH_KEY_ID` | `/v1/economic-production-security-authorization-v763` |
| External migration operator readiness | `ROSIE_ECONOMIC_PRODUCTION_OPERATOR_GATE_BASE_URL` | `PRODUCTION_OPERATOR_GATE_PUBLIC_KEY_B64` / `PRODUCTION_OPERATOR_GATE_KEY_ID` | `/v1/economic-production-operator-readiness-v763` |
| External independent rollback readiness | `ROSIE_ECONOMIC_PRODUCTION_ROLLBACK_READY_BASE_URL` | `PRODUCTION_ROLLBACK_READY_PUBLIC_KEY_B64` / `PRODUCTION_ROLLBACK_READY_KEY_ID` | `/v1/economic-production-rollback-witness-v763` |

All suffixes above are prefixed with `ROSIE_ECONOMIC_`. HTTPS base URLs must be bare origins (no paths, ports, credentials, query strings or fragments). The application never trusts a browser-supplied provider URL. Each provider returns a JSON object consisting only of `payload` (exact string-field schema) and `signature_b64` (64-byte canonical Ed25519 signature). All report timestamps must be fresh, with no more than 30 minutes between issue and expiry, and receipts bind both UUIDs, trial, change ticket, production project and relevant SHA-256 evidence.

### 1. Independent DBA and security decisions (new signers 14–15)

Each uses `canonicalApproval763` with signing domain `rosie-independent-production-authorization-v763:`, but a distinct schema: `rosie-production-dba-authorization-v763` or `rosie-production-security-authorization-v763`.

Exact ordered fields: `schema,booking_id,source_record_id,trial_id,change_ticket_id,production_project_ref,nonprod_project_ref,build762_packet_sha256,change_control_receipt_sha256,migration_artifact_sha256,rollback_artifact_sha256,backup_snapshot_sha256,scope_check,authorization_decision,observed_at,expires_at,reviewer_id,key_id`.

The only clean claim is `scope_check: EXACT_PROJECT_AND_ARTIFACTS_CONFIRMED` with `authorization_decision: APPROVE_EXACT_MANUAL_WINDOW_ONLY`. An independently signed HOLD uses `EXCEPTION_REQUIRES_REVIEW` / `HOLD_CHANGE_WINDOW`. These claims do not establish that SQL has been run or that a real provider exists until its signed receipt is actually available.

### 2. Owner production decision — original pinned owner key, separate domain

The tenth owner-uploaded envelope uses `rosie-owner-production-decision-v763:` and schema `rosie-owner-production-decision-v763`. It binds original trial, both project refs, **Build 762 packet hash**, change review hash, both independent approvals, exact three artifact digests, the scheduled window, an owner nonce and fresh timestamps.

The only clean owner decision is `AUTHORIZE_OFFLINE_OPERATOR_GATE_REVIEW`, and only if both independently authenticated approval claims are clean. Otherwise the only signed option is `HOLD_PRODUCTION_CHANGE`. A clean owner decision authorizes examination of a restricted **external** operator handoff, not SQL execution from the application.

### 3. Production operator readiness — new signer 16

The operator's `rosie-production-operator-gate-v763` envelope (domain `rosie-production-operator-gate-v763:`) binds the approved ticket, production project, owner/DBA/security hashes, migration/rollback/backup SHA-256 values, a separate runbook SHA-256, named execution request, exact window and operator identity. It requires:

- `credential_scope: PRODUCTION_CREDENTIALS_NOT_ACCESSED_BY_APP`
- `operator_ack: AVAILABLE_NO_MIGRATION_EXECUTED`
- `two_person_control: SEPARATE_WITNESS_REQUIRED`

It reports availability only. It must not include live credentials, migration SQL or a claim that production has been modified.

### 4. Independent rollback witness readiness — new signer 17

The `rosie-production-rollback-witness-ready-v763` envelope (domain `rosie-production-rollback-witness-ready-v763:`) binds the operator gate receipt digest, owner decision, rollback and backup artifacts, exact operator runbook, separately hashed incident runbook, escalation ID and witness identity. It requires `availability: ON_CALL_READY_NO_ROLLBACK_EXECUTED` and `protocol: MANUAL_TWO_PERSON_APPROVAL_REQUIRED`. It cannot run or close a rollback.

## Gate outcome and limits

If all real signed evidence matches, the transient review status is `READY_FOR_EXTERNAL_MANUAL_CHANGE_MANAGER_RECHECK`. This is **not a production execution permit**; the human change manager must separately verify approval freshness, one-time-use/replay controls, backup viability, actor identity, window, infrastructure policy and credential scope immediately before any independent manual operation.

Every response retains `production_execution_authorized:false`, `production_execution_authorized_by_app:false`, `production_migration_executed:false`, `rollback_executed_by_app:false`, `production_credentials_read:false`, `customer_notifications_sent_by_app:false`, `owner_closure_audit_persisted:false`, `closure_allowed:false`, `automatic_business_write:false`.

Invalid/expired/cross-project/replayed claims cannot be accepted by the application as an execution right. Since this review does **not** persist nonce state, it cannot independently enforce one-time use; the external human control remains mandatory. Any independent signed HOLD blocks operator and witness progression. No real-world signatures or proof of execution are supplied in this build; operational production execution and economic closure remain **HOLD**.

## Owner workflow

1. Obtain the exact signed Build 761 trial and Build 762 owner/rollback/change preflight documents. Review any holds before proceeding.
2. Have independent production DBA and security authorities sign their exact project/artifact/ticket approvals or explicit HOLDs, using separate controlled signer keys.
3. Only after approvals, sign the owner production decision using the pinned owner identity and new domain.
4. For an approved gate, obtain an independent operator acknowledgement of *availability*, followed by a separate rollback witness and escalation acknowledgement.
5. In **Rosie Dazzlers Admin → Build 763**, import ten JSON documents and inspect signed claims and blockers; export the unsigned review if needed. Execution, incident handling and closure remain external, separately authorized work.

Local tests: `node scripts/build763_production_authorization_test.mjs`, `node scripts/build762_owner_change_control_test.mjs`, `bash scripts/current_booking_wizard_regression.sh`, `python3 scripts/release_check.py`.

Source references: [Supabase database migrations](https://supabase.com/docs/guides/deployment/database-migrations), [Supabase branching](https://supabase.com/docs/guides/deployment/branching), [Supabase access controls](https://supabase.com/docs/guides/security/product-security).
