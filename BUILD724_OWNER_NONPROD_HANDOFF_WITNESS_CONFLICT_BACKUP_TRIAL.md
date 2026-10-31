# Rosie Dazzlers Build 724 — Owner Handoff, Witness Reference Conflict & Retention/Backup Trial

**Software release:** Eligible for normal `dev` → `main` production checks.
**Real external decisions:** **HELD**. No external signatory, third-party custodian, independent SQL authorization, backup deletion, production data retention or Proof-B approval is asserted.

This build adds three nested, optional admin review screens to **Staff Follow-Up Workload**. All actions authenticate an active administrator session, require original current-key Ed25519-signed receipts, verify exact SHA-256 lineage, sign a **new review-only receipt**, and offer a private local download. The server does not retain uploaded files or run SQL, backup/restore, deletion, calls/SMS, or cross-app traffic.

## 1. Owner-controlled nonproduction authorization handoff

The original owner administrator uploads three originals: Build 723 nonproduction execution checklist, Build 722 rollback dry-run and Build 720 owner ledger gate. The server checks the three signed hashes, original owner and separate reviewer, pinned nonproduction project, nonproduction-versus-production project boundary, rollback-only SQL artifact, and previous explicit non-execution flags.

The owner may **prepare a private packet**, **defer** or **reject**. The downloaded signed receipt contains only hashes, the non-secret project ref, status and a short privacy-safe note. It does **not** transmit a packet, approve a test, identify a real external reviewer, or authorize any connection. A rejected upstream execution proposal cannot be prepared for handoff.

Status values:

- `OWNER_NONPROD_HANDOFF_PACKET_PREPARED_EXTERNAL_APPROVAL_HELD`
- `OWNER_NONPROD_HANDOFF_DEFERRED`
- `OWNER_NONPROD_HANDOFF_REJECTED`

**Specific next external evidence required:** a real owner authorization, named independent reviewer/custodian role, confirmed disposable nonproduction project identity, separately witnessed permission to connect, and a reviewed SQL SHA. Store any actual private approval in the owner's protected channel, never in a public repository or an admin note. The UI does not collect the actual approval.

## 2. Witness identity reference conflict

The separately appointed **reference reviewer** supplies original signed Build 723 witness identity disposition, Build 722 witness provenance and Build 721 rotation exception. It requires the exact configured reviewer UUID in `ROSIE_EXPORT_WITNESS_REFERENCE_REVIEWER_STAFF_ID`, different from the signer, custody reviewer, rotation reviewer and Build 723 identity reviewer.

The reviewer enters only a non-personal witness reference ID and SHA-256 of the observed original witness payload. The server compares those values against the pinned signed origins, then signs one of the following:

- `WITNESS_REFERENCE_CRYPTOGRAPHIC_MATCH_IDENTITY_HELD` — cryptographic references match; **not** proof of human identity.
- `WITNESS_REFERENCE_CONFLICT_PENDING_EXTERNAL_REVIEW` — ID and/or payload SHA disagree; resolve out of band.
- `WITNESS_REFERENCE_REVIEW_DEFERRED`
- `WITNESS_REFERENCE_REJECTED`

Never upload passports, addresses, phone numbers, private identity documents, raw signatory keys or witness secrets. A matching ID/hash does **not** authorize custody, old-key trust, a signer rotation, external witness acceptance or Proof-B.

## 3. Owner retention and backup-purge trial prerequisites

The original owner supplies the signed Build 723 expiry calculation and Build 722 retention reconciliation. The backend confirms original owner, signed hashes, 7/30/90-day ceiling, original gate and security hashes, rejection consistency, and (unless storage was rejected) the exact hypothetical UTC expiry arithmetic.

The owner declares backup scope as `unverified`, `provider_managed` or `application_controlled` for planning only. All choices remain **unverified**; no genuine backup inventory can be inferred from a dropdown. The owner may request future independent trial planning, defer or reject. Rejected storage has no purge trial to run.

The receipt explicitly marks false for actual row expiration, backup retention inventory, provider policy, restore/recovery rehearsal, purge execution, role grants/RLS, Data API visibility, advisor checks, and independent disposable-environment authorization.

## Owner walkthrough (no special technical knowledge needed)

1. Open Rosie Dazzlers Admin → **Staff Follow-Up Workload** and expand the appropriate advanced Build 723 group.
2. **Owner handoff:** under “Nonproduction execution authorization checklist,” open the nested **Build 724** section. Upload the original signed Build 723 checklist; the previous group already contains inputs for the signed Build 722 dry-run and Build 720 gate. Sign in as the original owner; choose the handoff decision and download the result. No file is sent externally.
3. **Witness conflict:** under “External witness identity disposition,” open the nested **Build 724** section. Upload the original signed Build 723 identity disposition; the previous group already holds the signed Build 722 provenance and Build 721 exception. Sign in as the separately appointed reference reviewer. Compare the exact ID and SHA-256 from the original evidence, record a decision and download the held result.
4. **Backup/retention:** under “Owner retention expiry verification,” open the nested **Build 724** section. Upload the original signed Build 723 expiry receipt; the earlier field provides the signed Build 722 owner reconciliation. Sign in as the original owner; choose the *unverified* backup scope, record trial planning and download the held result.
5. Save downloads privately. An uploaded file is never treated as a human authorization, and the app keeps the ledger inactive.

## Protected configuration

Keep the Build 716–723 signer, owner, nonproduction and reviewer bindings unchanged. New **non-secret** binding:

| Variable | Real value to supply |
|---|---|
| `ROSIE_EXPORT_WITNESS_REFERENCE_REVIEWER_STAFF_ID` | Actual independent active admin staff UUID, not the signer, custody reviewer, rotation reviewer or identity reviewer. |

Existing `ROSIE_LEDGER_NONPROD_PROJECT_REF` must still equal the operator's selected disposable project and differ from the Production `SUPABASE_URL` project. **No value is invented here.** Missing role/project bindings return 409/HOLD. The external witness verification remains pending until a genuine independent identity artifact is examined outside this UI.

## Verification commands

```sh
node scripts/build724_handoff_reference_purge_test.mjs
bash scripts/current_booking_wizard_regression.sh
bash scripts/current_source_gate_contracts.sh
python3 scripts/release_check.py
python3 scripts/seo_metadata_check.py
python3 scripts/responsive_static_check.py
python3 scripts/admin_ui_audit.py
python3 scripts/sync_route_copies.py --check
python3 scripts/release_hygiene_check.py
git diff --check
```

The tests use **synthetic Ed25519 signed fixture records**, fake actors and a stubbed read-only staff-session source. They verify that no database writes, SQL or backup operations occur. Real Supabase schema/RLS and backup tests must wait for separately granted nonproduction authorization.

References: [Supabase Data API security](https://supabase.com/docs/guides/api/securing-your-api), [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase product security](https://supabase.com/docs/guides/security/product-security), [Supabase changelog](https://supabase.com/changelog), and [Build 723 operational handoff](BUILD723_NONPROD_EXECUTION_WITNESS_IDENTITY_RETENTION_EXPIRY.md).

**Next planned Build 725:** Private Owner Handoff Receipt Reconciliation, Witness Reference Conflict Aging & Nonproduction Retention Trial Readiness Review (HELD until authentic external evidence).
