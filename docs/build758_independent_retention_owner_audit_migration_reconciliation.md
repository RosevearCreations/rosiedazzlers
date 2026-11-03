# Build 758 — Independent immutable-retention evidence, owner audit migration review and closure reconciliation

**Deployment scope:** private, read-only evidence verification with no database schema change, no inventory/payroll/pricing/payment mutation and no economic exception closure. `main` deployment health is a release measure, not proof of business custody or an approval to execute a migration.

## Read-only procedure

1. Open `/admin-economic-retention-v758.html` as a capability-bound signed-in `manage_staff` reviewer. Supply the original source record, independent Build 754 owner/source signatures and Build 757 custodian history envelope plus period/booking UUID.
2. The server repeats the complete Build 757→756→755→754→753 authenticated chain and only asks an independent retention provider for evidence **after** the source history chain and its distinct custodian head have matched.
3. The provider endpoint is configured only server-side as `ROSIE_ECONOMIC_RETENTION_VERIFY_BASE_URL` (HTTPS origin; no path/query/credentials, fixed `/v1/economic-retention-proof`). There is no client-controlled URL. The GET includes only booking UUID, source-record UUID and history-head SHA-256. The provider must return a JSON envelope `{ "payload": { ... }, "signature_b64": "..." }` smaller than 16 KB. Missing provider configuration is HOLD, never a reason to fabricate evidence.
4. The provider's detached Ed25519 signature uses `ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64` and `ROSIE_ECONOMIC_RETENTION_PROVIDER_KEY_ID` pinned on the server. Its public key and key ID must be independent from the owner, source witness and source-history custodian. The provider private key is never stored in Cloudflare worker/client code.
5. Signed provider payload has the exact `RETENTION_FIELDS758` field set in its published order (all strings). Sign the bytes `rosie-independent-retention-proof-v758:` + JSON `[field,value]` pairs. Source booking, row and SHA-256 must match the signed history head. A nonempty object version, provider ID and policy reference, `retention_mode=COMPLIANCE`, `retain_until` at least one day ahead, observation not older than 15 minutes, and expiry no more than 30 minutes into the future are required. Missing, forged, stale, conflicting and unsupported evidence are HOLD.
6. The GET+signature checks establish only that a distinct provider asserted a time-bounded, version-specific compliance retention claim. They **do not prove physical WORM immutability, policy enforcement, past revision recoverability, grant separation or non-deletability**. Even a valid provider signature reports `SIGNED_PROVIDER_LOCK_CLAIM_MATCHED_IMMUTABILITY_AUDIT_PENDING` with `immutable_retention_verified:false`.
7. A separate owner-signed request for DBA/security review uses the Build 754 pinned owner key, but a new domain-separated transcript `rosie-owner-migration-review-v758:` + canonical `OWNER_MIGRATION_FIELDS758`. The `audit_plan_sha256` must be the exact hash returned by GET, and `retention_receipt_sha256` must match the provider's verified evidence. Decision must be `request_independent_migration_review`; expiry is at most 48 hours. This is not authorization to execute SQL or close an exception.
8. The final response contains the history head, provider receipt fingerprint, signed owner-review fingerprint, plan hash, blocking actions, and an unsigned session-only reconciliation hash. It cannot create owner audits, run migrations or write business records.

## Migration authorization gate (not executed)

Build 757's proposed private `rosie_private.economic_owner_closure_decision_audit` SQL remains **design-only**. Build 758 identifies 12 binding controls in `AUDIT_PLAN_CONTROLS758`, hashes their canonical list and accepts an attributable owner request to review that exact plan. The next separately authorized workflow must:

- Resolve the actual Rosie Supabase project/schema and active role grants. Do not assume `rosie_private` or any audit table exists just because a REST schema probe responds.
- Require independent DBA and security reviewer approval of private schema, default-deny RLS, server-only least-privilege append, no UPDATE/DELETE/TRUNCATE, unique idempotency token, source snapshot compare, external immutable history/head custody and retention verification.
- Execute `supabase db advisors` or equivalent Supabase MCP security/performance advisors, review current database changelog and use a versioned authorized migration, then test insert+readback, replays, rollback, denial and restore on a nonproduction clone before a production approval.
- Preserve old history and independently witness actual owner authorization. No self-uploaded receipt, successful GitHub CI or server-only service-role readback may substitute for that proof.

Because no genuine independent external evidence, delegated DBA approval, production migration authorization or completed immutable-storage audit has been supplied, Build 758 **never** declares `audit_migration_authorized`, `audit_migration_executed`, `owner_closure_audit_persisted`, `immutable_retention_verified` or `closure_allowed` true. Business closure stays `HOLD_CLOSURE_AUTHORIZATION`.

No changes to the existing Basic Detail starting tiers ($229/$269/$309 CAD), public pricing labels, travel, inventory posting, timesheets, payroll, booking/payment state, customer messages, winter availability, or provider connections.

## Validation

- `node scripts/build758_independent_retention_test.mjs`: correct independent-fourth-key provider signature, fixed HTTPS configuration, stale/altered/missing proof, mismatched head, duplicate identity rejection, owner plan/receipt binding, read-only auth and closure HOLD.
- `bash scripts/current_booking_wizard_regression.sh`, `python3 scripts/release_check.py`, exact tree/PR status, Cloudflare Pages and exact production deployment checks.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api). Verify current Supabase release notes before any separately approved schema migration.
