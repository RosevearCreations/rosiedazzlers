# Build 757 — Immutable source-history verification, append-only owner audit design and closure authorization preflight

**Status: deployed-code candidate only.** The private review is GET-only against owning Supabase source tables, and no audit migrations, owner decisions or business closures are applied. The owner has not supplied a genuine third-custodian signature, externally enforced immutable revision retention, or separately authorized economic closure. All business exceptions remain **HOLD** even if release CI is GREEN.

## Operator workflow

1. Authenticate with a capability-bound `manage_staff` session and open `/admin-economic-history-v757.html`.
2. Supply the booking UUID/month and authentic Build 755 source record, Build 754 independent source witness, and Build 754 owner receipt. Build 757 first repeats Build 756's fresh economic retest, signature and original-document matching, and current authoritative source-row ownership readback. Bad evidence triggers **no history query**.
3. Submit a **separate** signed history-custodian envelope (`payload` plus `signature_b64`). The server must have `ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64` and `ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID`, and the key must differ from both preconfigured owner and source-witness public keys and IDs. Signing material stays with its real external custodian, never in the browser, repository or worker environment.
4. The server GETs `economic_source_revision_history`, hard-filtered by the exact booking, source system and row ID, in ascending `revision_number`, with a maximum of 64 accepted revisions. Only the four UUID-bound types already supported by Build 756 are eligible. Managed pricing remains a separate owning-system history gap.
5. Each canonical revision SHA-256 binds its source/booking identity, actor, original correction reference, event time, content hash and previous revision hash. Revision numbers must be contiguous from 1; timestamps may not go backwards. The final revision must match the independently signed original Build 755 source record. The computed chain head must equal the custodian manifest head.
6. The custodian envelope must have the *exact* `MANIFEST_FIELDS757` names/types in their documented canonical order; sign the bytes of `rosie-economic-history-custodian-v757:` followed by JSON of `[field,value]` pairs in order with detached Ed25519. Signature covers booking, source record, final revision, source document SHA, head SHA, count, issuer/key ID and issue/expiry. It expires within 48 hours and cannot be more than seven days old.
7. Download the unsigned session preflight packet if needed. It describes remaining blockers, never grants write access or marks a business closure done. Unavailable history, non-UUID source identifiers, missing signatures, duplicate numbers, missing middle revisions, forked/altered hashes, stale signatures, different actors/booking or conflicting records all fail closed.

**Important distinction:** A signature on a chain head proves a specific custodian attested to specific bytes, provided that the third key was independently pinned. It does **not** by itself prove source rows were continuously immutable or externally retained. Even a matching chain reports `HISTORY_CHAIN_AND_INDEPENDENT_HEAD_MATCHED_RETENTION_UNVERIFIED` and `immutable_source_history_verified:false`. No automatically generated example keys or witness material count as real owner evidence.

## Append-only owner decision audit — **design only, DO NOT execute without separate approval**

The independent owner, DBA and auditor must review a *private, unexposed schema* `rosie_private` before a separate migration is authorized. A possible minimum SQL contract (not installed by this build):

```sql
-- DESIGN ONLY. Establish schema ownership by a dedicated migration role.
create schema if not exists rosie_private;
revoke all on schema rosie_private from public, anon, authenticated;

create table rosie_private.economic_owner_closure_decision_audit (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  source_record_id uuid not null,
  source_history_head_sha256 text not null check (source_history_head_sha256 ~ '^[a-f0-9]{64}$'),
  owner_receipt_sha256 text not null check (owner_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  source_record_sha256 text not null check (source_record_sha256 ~ '^[a-f0-9]{64}$'),
  decision text not null check (decision in ('RETAIN_HOLD', 'REVIEW_CLOSURE_CANDIDATE')),
  actor_id text not null,
  independent_witness_id text not null,
  authorization_reference text not null,
  request_id uuid not null unique,
  predecessor_receipt_sha256 text,
  receipt_sha256 text not null unique check (receipt_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);
alter table rosie_private.economic_owner_closure_decision_audit enable row level security;
revoke all on rosie_private.economic_owner_closure_decision_audit from public, anon, authenticated;

create function rosie_private.reject_owner_audit_mutation()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Owner closure decision audit is append-only';
end;
$$;
create trigger economic_owner_audit_no_update_delete
before update or delete on rosie_private.economic_owner_closure_decision_audit
for each row execute function rosie_private.reject_owner_audit_mutation();
-- Independently controlled migration/retention roles must also prevent TRUNCATE,
-- trigger removal, privileged bypass and backup/witness deletion.
```

Do not grant browser users `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE` or function execution. A separately authorized server-only **least-privilege** signer/append path would need exact owner identity and `request_id` idempotency, witness/authorization verification, transaction-scoped source snapshot compare, insert + readback, audit head retention outside the DB, replay rejection, rollback tests and operational recovery. The schema must be reviewed with Supabase security advisors before any real migration; PostgreSQL database superusers can still alter triggers, so an external immutable archive and independent retention witness are mandatory for a true history-custody claim.

Build 756's existing GET probe looks for `public.economic_owner_closure_decision_audit`; that read remains a *legacy visibility probe only*. The private-schema design above has **not** been installed, and a table's existence must never be misrepresented as proof that its constraints or grants are active.

## Explicit preflight blockers

- Independent source history and signed custodian head.
- External immutability, retention enforcement, historic revision recovery and independent DBA audit.
- Independently reviewed append-only audit design, least-privilege writer, role isolation, idempotency and rollback.
- Explicit owner closure authorization, independently witnessed durable audit receipt, and separately authorized business write.

No automatic price changes ($229 / $269 / $309 CAD Basic Detail starting tiers), margin changes, inventory deductions, payroll updates, customer messages, booking/payment mutations, winter HOLD changes or provider connections are implemented.

## Verification

- `node scripts/build757_economic_history_preflight_test.mjs` exercises genuine three-distinct-key signatures, full/altered/disordered history, stale/mismatched manifest, unsupported source, private role gating and zero business writes.
- `bash scripts/current_booking_wizard_regression.sh`, `python3 scripts/release_check.py`, mirrored routes and exact deployed commit CI are release gates.

Supabase references: [RLS and privileges](https://supabase.com/docs/guides/database/postgres/row-level-security), [Data API exposure and grants](https://supabase.com/docs/guides/api/securing-your-api). This design **does not** apply a migration to Supabase.
