# Build 756 — Authoritative source-custody readback, owner decision persistence readiness and exception closure authorization review

**Release scope:** private, read-only analysis of whether submitted Build 755 evidence corresponds to a currently readable authoritative source row and whether a dedicated owner closure audit table is discoverable. No closure or audit persistence is enabled by this build. No authentic externally witnessed original source history or separately authorized owner closure has been supplied; business closure remains HOLD.

## Private workflow

1. Use Builds 753–755 to collect the real baseline/retest, the canonical source record and two independently signed Ed25519 envelopes. The owner and source-witness public keys must be configured on the server as described in Build 754.
2. Open `/admin-economic-closure-v756.html` with a signed-in `manage_staff` session. Import three authentic JSON documents and supply matching booking UUID/period.
3. On submit, Build 756 rechecks the current authenticated Build 753→752→751 economic evidence, the Build 754 owner/witness signatures and the Build 755 original-document fingerprint and chronology.
4. **Only if** those checks match, an allowlisted, GET-only Supabase read verifies the present source row identity and association to the specified booking. For inventory posting rows, the read also checks the real `catalog_inventory_posting_batches.source_kind` and `source_reference_id` booking relationship.
5. A separate GET-only schema probe checks whether `economic_owner_closure_decision_audit` is visible with the intended owner audit fields. Even a successful 200 response does not prove database append-only protections, ownership, idempotent writing or the authority to persist decisions.
6. Review the explicit blocking actions, readback SHA-256, schema status, and downloadable **unsigned, non-persisted** review packet. There is no endpoint for saving decisions, changing records, or lifting HOLD.

## Exactly scoped readback

The readback implementation is `functions/api/_lib/economic-closure-review-v756.js`. It never interpolates an arbitrary user-supplied table name: a hardcoded allowlist is required, `source_record_id` and `booking_id` must be real UUIDs, the maximum source result is one row, and selected columns exclude customer PII.

| Source record kind | Authoritative GET and binding |
| --- | --- |
| `accounting_records` | Row by UUID; verifies `booking_id` |
| `bookings` | Row by UUID; verifies row `id` equals booking ID |
| `job_time_entries` | Row by UUID; verifies `booking_id` |
| `catalog_inventory_posting_rows` | Row by UUID; then private batch by UUID; verifies `source_kind=booking` and `source_reference_id` equals booking ID |
| `managed_pricing_catalog` | **Unsupported for row-level custody**; requires an independent managed pricing revision-history workflow |

The current row is hashed over the read-only selected row and table identity for traceability. The hash is useful for recheck comparisons, **not** for proving the original historical revision. A row can be updated, replaced, or legitimately corrected after the original event. The schema does not establish a universal immutable correction audit for these source types. Therefore the readback can truthfully say `CURRENT_ROW_IDENTITY_MATCHED_HISTORY_UNVERIFIED` but always leaves `original_revision_custody_verified:false`, `immutable_source_history_verified:false`.

The dedicated owner audit probe selects only:

```
id,booking_id,owner_receipt_sha256,source_record_sha256,decision,created_at
```

with `limit=0`. If missing/unreachable it reports `HOLD_AUDIT_TABLE_UNAVAILABLE`. If visible it reports `AUDIT_TABLE_VISIBLE_WRITE_POLICY_UNVERIFIED`. It **never** attempts an INSERT or infers that the table has correct RLS, append-only triggers, role separation, retention policy or rollback/read-after-write guarantees.

## Safe authorization outcome

The response always includes:

- `closure_review_status: HOLD_CLOSURE_AUTHORIZATION`
- `source_record_custody_verified: false`
- `owner_decision_persistence_ready: false`
- `owner_closure_audit_persisted: false`
- `closure_authorized: false`
- `closure_recorded: false`
- `closure_allowed: false`
- `automatic_business_write: false`

If supplied evidence fails signatures, source document hash or live snapshot, there is **no additional direct raw-source or audit-table probe**. A matching current row still requires original immutable history and independent custody, a reviewed append-only decision audit, explicit owner authorization and a separately authorized owning-system record mutation workflow. The review packet hash is a fingerprint, not a signed approval or saved business audit.

No changes to Basic Detail starting-price tiers ($229/$269/$309 CAD), vehicle sizes, travel costs, shift pay, consumables, inventory, booking/payment state, customer communications, winter HOLD or integrations are allowed by this endpoint.

## Security and tests

- Only session-authenticated `manage_staff` may call GET/POST. POST must be same-origin JSON under 32 KB; legacy admin bridge and anonymous access are rejected before any source I/O.
- Supabase service-role credentials remain exclusively on the server. All own-source and schema probes use GET only. Unavailable/ambiguous rows fail closed.
- `node scripts/build756_closure_authority_review_test.mjs` exercises current matching rows, cross-booking mismatches, unsupported selectors, spoofed/ambiguous/missing evidence, source revision chronology, inventory posting batch ownership, table 404/200, always-HOLD audit readiness, private auth, route parity and zero mutation methods.
- Run full `bash scripts/current_booking_wizard_regression.sh`, `python3 scripts/release_check.py`, and exact-head protected branch checks before reporting production GREEN.

Reference: [Supabase Data API Security](https://supabase.com/docs/guides/api/securing-your-api) explains the distinction between table grants, RLS, and server-only privileged access. Nothing in this release modifies Supabase RLS, grants, schemas or migrations.
