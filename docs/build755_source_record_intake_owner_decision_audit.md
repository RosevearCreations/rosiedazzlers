# Build 755 — Independent source-record evidence intake, owner closure decision audit and exception follow-up

**Production code scope:** Private **verification-only** evidence intake. This is not an authority to close, amend or repair any source ledger. No real independently authenticated owner/witness material has yet been supplied, so the business-source closure gate remains HOLD.

## Operator flow

1. Start with the Build 753 baseline/retest source comparison for a specific booking and YYYY-MM.
2. Obtain the actual original source correction history through the owning system. It must have a source actor, revision, provenance, before/after snapshot IDs and source reference. Do not invent or backfill these records.
3. Normalize that source-owned record to the exact 13-field Build 755 schema below. The SHA-256 of its canonical transcript must be bound into the **independent source witness's** signed Build 754 `source_record_sha256`. Owner's separately signed Build 754 receipt must bind the exact source-witness transcript SHA-256.
4. In `/admin-economic-intake-v755.html`, import or paste the source-record JSON and the two signed JSON envelopes, enter the matching booking/period and click **Verify evidence against live source**. The private endpoint checks the session, same-origin request, independent Ed25519 signatures, fresh Build 753→752→751 economic source, exact source document hash and scope/chronology.
5. Inspect the derived **owner decision audit** and **blocking follow-up queue**. Download the unsigned review packet if needed for manual handoff. Its SHA-256 is a consistency fingerprint, **not an immutable or persisted audit entry** and never a valid approval in itself.
6. Obtain independent authoritative source custody/history verification and separately authorized owner closure recording in its owning workflow. This build deliberately does neither.

If any evidence is missing, expired, changed, contradictory, or currently flagged as an exception, status stays HOLD. Matching source-document bytes can yield `MATCHED_SOURCE_DOCUMENT_MANUAL_CLOSURE_HOLD`—still no closure. Owner's signed `retain_hold` remains HOLD even with a matching document.

## Canonical original-record schema

`source_record` is a JSON object with **exactly** these 13 string fields (no additional keys):

1. `schema` = `rosie-economic-source-record-v755`
2. `booking_id` — booking UUID
3. `period` — YYYY-MM
4. `source_correction_reference` — source reference also in both Build 754 signed receipts
5. `source_system` — `accounting_records`, `bookings`, `job_time_entries`, `catalog_inventory_posting_rows`, or `managed_pricing_catalog`
6. `source_record_id` — original source record identifier (6–120 safe characters)
7. `source_revision_id` — immutable source revision identifier (same size constraint)
8. `source_recorded_at` — UTC ISO timestamp no later than the signed witness and owner issuance
9. `source_actor_id` — original correction actor reference (6–120 safe characters)
10. `correction_kind` — `pricing_source_review`, `accounting_reconciliation`, `shift_time_reconciliation`, `consumable_cost_reconciliation`, or `booking_vehicle_size_review`
11. `baseline_snapshot_sha256` — same 64-character hex SHA as the signed baseline
12. `retest_snapshot_sha256` — same 64-character hex SHA as the signed retest; must differ from baseline
13. `original_provenance_reference` — independent source-owned audit or trace reference (6–120 safe characters)

Canonical transcript bytes are UTF-8 of the literal prefix:

```
rosie-economic-source-record-v755:
```

followed immediately by `JSON.stringify([[field,value],...])` with the fields **in the order above** (ECMAScript JSON string escaping). The source witness places SHA-256 of this entire transcript in its independently signed Build 754 attestation `source_record_sha256`. Do not hash an arbitrary pretty-printed JSON object or sign the record under a different prefix. The owner receipt must bind the signed witness transcript as defined in `docs/build754_owner_receipt_authentication_source_closure_gate.md`.

## Server-side boundaries

- `GET/POST /api/admin/economic_source_intake_v755` requires a signed-in `manage_staff` session; legacy admin bridge, anonymous origin and cross-origin POSTs are rejected. POST accepts JSON under 32 KB.
- The endpoint never writes to Supabase, Cloudflare storage, customer notifications or a source ledger. Uploaded record bytes are evaluated in the request and never echoed back; the downloadable packet omits raw evidence content.
- Only independently pinned public keys configured for Build 754 verify the actual detached Ed25519 signatures. A signer identity string or source reference alone is not authentication.
- The original record is a client-supplied representation. A matching witness-bound SHA-256 verifies the **bytes** but cannot establish that these bytes were really extracted from an authoritative source or that their change was legitimate. The outcome always states `source_correction_record_verified:false`, `source_record_custody_verified:false`, `owner_closure_audit_persisted:false`, `closure_recorded:false`, `closure_allowed:false`, `automatic_business_write:false`.
- The derived audit stages are source baseline/retest, independent witness, source-record content, owner's signed decision and owning-system closure. The final stage is always explicitly **not recorded**.
- Follow-up items remain blocking for independent source custody and separately recorded owner approval. Fresh signatures are required after any new source drift.
- Build 755 does not modify canonical Basic Detail starting prices (CAD $229/$269/$309), vehicle-size tiers, job time, consumables, accounting, service eligibility, winter HOLD or public communications.

## Validation

`node scripts/build755_source_record_intake_test.mjs` generates **test-only** distinct Ed25519 keypairs, signs both transcripts, matches the canonical source document, checks mismatched source bytes, scope/timing and format, retained HOLD and live-source drift. The test also checks no anonymous source reads, no mutation methods and paired HTML route equality.

Run the full `bash scripts/current_booking_wizard_regression.sh` and `python3 scripts/release_check.py` before `dev`→`main` promotion. No generated signing keys are deployed or persisted.
