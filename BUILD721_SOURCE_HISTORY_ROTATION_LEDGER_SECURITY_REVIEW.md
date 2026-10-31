# Rosie Dazzlers Build 721 — Private Drift History, Key-Rotation Exceptions & Owner Ledger Security Review

## Exact scope and authorization boundary

Build 721 provides **working, protected, server-verified review APIs and dashboard controls**. It is **not** a production data-retention migration, an external custody sign-off, or approval to activate the six-app gateway. Build/test/Cloudflare Production may be GREEN while each missing real-world approval remains an explicit HOLD. No fabricated staff, signer, device, witness, historical receipt or owner approval is supplied.

### 1. Source drift history persistence design

On the Staff Follow-Up Workload management page, select an eligible staff member and planned hour, provide the **original signed Build 720 provider baseline**, select 7/30/90-day proposed metadata retention, and add a privacy-safe review note. The protected API:

1. Requires a current authenticated admin **staff session**, not the legacy admin password/bridge user.
2. Verifies the unchanged baseline signature against the **current server Ed25519 signer**.
3. Performs an **actual fresh HTTPS roster provider GET**, verifies staff hours, absences, pinned HTTPS origin and provider account, and computes drift for the same exact staff/hour.
4. Produces and signs an `HISTORY_PERSISTENCE_DESIGN_HELD` design receipt that names only a proposed *private*, backend-only, hash-only history schema, immutable fields and retention period.
5. Returns a local file. **No SQL migration, historical row, cron job, alert, customer contact, source response or approval record is created.**

Proposed source-history fields (for a future separately approved implementation): `id`, `occurred_at`, `staff_user_id`, `window_start_at`, `window_end_at`, `baseline_receipt_sha256`, `current_source_sha256`, `provider_origin_pin_sha256`, `provider_account_pin_sha256`, `drift_status`, `severity`, `retention_expires_at`, `actor_staff_user_id`, `server_signer_fingerprint`.

**Design controls before implementation**:

- Place both drift history and owner evidence only in a schema **not exposed** to the Supabase Data API, provisioned by a reviewed migration. `anon` and `authenticated` receive **no** schema/table grants. Never leak the service-role key into any browser.
- Use a minimal privileged backend-only role for append, another role for restricted review, and a separate audited retention/purge role; grant no UPDATE to the app and no ad hoc DELETE to operators. A `service_role` credential bypasses RLS, so a private schema and carefully scoped backend code must be independently verified rather than relying on RLS alone.
- Use RLS as defense in depth on sensitive tables, with specific policies and transaction tests. If a table is later exposed, RLS must be enabled **before** grants, and `TO authenticated` alone is not sufficient ownership protection.
- Raw roster responses, customer contacts, bearer tokens, secret JWKs, raw device files, comments and precise customer location data **do not belong in this history**.
- Retention expiry, backup restoration/purge, breach handling, idempotency, tamper-evident chaining, reviewer segregation, support access and a dry-run rollback must be approved before the first write.
- Run Supabase security advisors and a real SQL role/grant/RLS verification on the **correct project** before deployment. No live schema change was authorized in Build 721.

Supabase references: [RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Secure the Data API](https://supabase.com/docs/guides/api/securing-your-api).

### 2. Reviewer key-rotation recovery exceptions

Build 720 intentionally rejects old signer keys. Build 721 adds a **separate** recovery workflow to inspect a genuine old-key **Build 719 custody disposition**, solely as a bounded exception. It requires **all** of:

- Current signer `ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK` and `ROSIE_FOLLOWUP_EXPORT_SIGNER_ID`, with a successful current live self-test.
- Separately pinned *retired public* JWK in `ROSIE_FOLLOWUP_EXPORT_PREVIOUS_ED25519_PUBLIC_JWK` (public material only; never place the retired private key in the app), distinct `ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID`, and operator-confirmed ISO date `ROSIE_FOLLOWUP_EXPORT_PREVIOUS_KEY_RETIRED_AT`.
- Pinned independent witness public key and identity `ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK` and `ROSIE_EXPORT_CUSTODY_WITNESS_ID`, with witness public key distinct from current and retired keys.
- A genuinely independent, signed witness envelope whose `payload_base64` decodes to exactly this signed scoped object (example **shape only**, not evidence):

  ```json
  {
    "type": "rosie_export_signer_rotation_exception_witness",
    "scope": "internal_export_custody_receipt_only",
    "witness_id": "actual-configured-witness-id",
    "previous_signer_id": "actual-retired-signer-id",
    "previous_public_key_sha256": "64 hex characters of the pinned prior public JWK fingerprint",
    "current_signer_id": "actual-current-signer-id",
    "current_public_key_sha256": "64 hex characters of the live current signer fingerprint",
    "subject_receipt_sha256": "64 hex characters of the original old signed receipt bytes",
    "rotation_reviewer_staff_user_id": "actual-pinned-reviewer-staff-uuid",
    "witnessed_at": "actual-ISO-timestamp"
  }
  ```

- An authenticated admin staff UUID equal to `ROSIE_EXPORT_CUSTODY_ROTATION_REVIEWER_STAFF_ID`, distinct from the originating signing staff UUID. The original receipt must identify the currently pinned historical custody reviewer, be **no older than 90 days**, and predate the pinned retirement cutoff. The witness signature must be **no older than 7 days**.

Only an exact match of both cryptographic signatures, pinned keys, original receipt SHA, current signer fingerprint, scope, date and reviewer allows a new **internally server-signed exception readback**. Its state remains `PINNED_OLD_SIGNATURE_AND_ROTATION_WITNESS_VERIFIED_HELD`; it does not automatically trust the old key, reissue the old receipt, recover a server-stored record, verify the human's identity, authorize external custody transfer or grant Proof-B. An independent human/process still needs to accept the real evidence.

### 3. Protected owner-ledger security approval review

Provide the unchanged **signed Build 720** `LEDGER_APPROVAL_GATE_HELD` receipt. The authenticated, separately configured security reviewer `ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID` must be **different** from the original owner, Build 720 reviewer and originating signer staff. The API re-verifies the original receipt using the currently pinned server key and permits only:

- `OWNER_LEDGER_SECURITY_REVIEW_HELD` — documented private schema/security requirements, pending real verification; or
- `OWNER_LEDGER_SECURITY_PROPOSAL_REJECTED` — explicit rejection.

The signed local output makes each security checkpoint explicit: private unexposed schema, browser grant denial, append-only policy, hashes-only records, retention/backups, separate owner authorization, live DB/role/RLS checks and Supabase advisories. **All deployment, approval persistence and ledger activation flags remain false**, even after a successful review. No persistent owner data is accepted or stored by this action.

### Verification and owner handoff

1. `node scripts/build721_source_history_rotation_security_test.mjs` uses **disposable synthetic crypto fixtures only** to test valid scoped receipts, tampering, role separation, key drift, witness mismatch, expiry, no-write API guarantees and route controls.
2. Run the complete `scripts/current_booking_wizard_regression.sh` suite plus source contracts, admin UI audit, route copy parity and release hygiene.
3. Promote exact checked source to `dev` and `main`; require the exact immutable `main` SHA in a successful Cloudflare Production deployment, real HTTP smoke, Business Acceptance PASS and *later* independent Release Health GREEN.
4. For real use, a responsible administrator must configure the *actual* provider/signing/witness/reviewer references in protected Cloudflare bindings, retain original signed exports securely, and obtain real human approvals. Never paste private key material or credentials into a public issue or user-facing export.

**Next planned build 722:** Private Ledger Schema Dry-Run, Rotation Witness Provenance Intake & Owner Retention Decision Reconciliation (HELD until genuine external approvals).
