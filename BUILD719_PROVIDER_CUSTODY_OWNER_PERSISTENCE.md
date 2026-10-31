# Rosie Dazzlers — Build 719

**Shift Provider Production Binding Verification, Independent Witness Custody Disposition & Owner Device Evidence Persistence Decision**

## Production provider binding

The protected Follow-Up Workload page now has **Verify actual source account binding**, using the real staff and planned time selected on the dashboard. The same protected API makes one real approved-roster GET and retrieves absence blocks. It then compares the configured HTTPS origin and the **account reference actually returned by the provider** with separately pinned server configuration. It returns a source SHA-256 digest and revision without exposing the provider URL or bearer.

In addition to Build 718's `ROSIE_STAFF_SHIFT_ROSTER_URL` and optional `ROSIE_STAFF_SHIFT_ROSTER_BEARER`, set these two production server-side values only after verifying them from the real shift provider:

- `ROSIE_STAFF_SHIFT_ROSTER_PINNED_ORIGIN`: exact `https://hostname` origin, **no path**, userinfo, query or fragment. It must equal the configured roster URL's origin.
- `ROSIE_STAFF_SHIFT_ROSTER_ACCOUNT_REF`: the real provider's account/tenant reference. The provider's JSON must return this as top-level `source_account_ref`, alongside Build 717's `complete`, `source_revision`, `generated_at` and approved `shifts` fields.

**Only a live, successful, fresh, approved shift readback with a matched origin/account and clear absence blocks can return** `LIVE_PINNED_ORIGIN_AND_ACCOUNT_MATCHED`. A missing or mismatched pin, stale/invalid roster, rejected absence or provider outage produces a HOLD and never simulates source authority. Even a live match does not independently certify who operates the provider or authorize a reassignment. Protected management permission is still required.

## Separately assigned custody reviewer

Build 718 verifies an original witness's Ed25519 envelope against a separate pinned public key. Build 719 adds a **reviewer disposition**, but only for a signed-in administrator with the explicitly pinned reviewer staff ID. New server-only settings:

- `ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID`: actual UUID of the accountable originating internal export signer.
- `ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID`: UUID of a **different** accountable staff administrator assigned to review the external witness.

The reviewer selects the **actual** Build 718 signed witness JSON; then provides an external reference, actual findings and one of two limited dispositions: `accept_for_internal_export_only` or `return_for_independent_followup`. They must confirm the decision does not authorize Proof-B. The server re-verifies the witness, checks the active internal key fingerprint, requires a real authenticated reviewer session and checks the two role IDs are different. On success it issues a **server-signed Ed25519 export** for local preservation. It does not persist the review, certify a human's independence, transfer legal custody, authorize cross-app Proof-B or enable gateway GETs. A legacy admin password or spoofable bridge identity cannot record this review.

## Real owner device files — explicit persistence decision

After genuine desktop/mobile retesting and owner evidence import, the owner chooses one of two visible outcomes:

1. **Download only.** The protected server recomputes and checks the original, desktop and mobile receipt hashes and authenticated administrator identity; it returns a *hash-only* evidence retention decision. An Ed25519-signed export is included only if a real internal export signer is configured and healthy. The original JSON files stay with the owner. **No hashes or file contents are saved server-side.**
2. **Request private hash-only ledger.** The server returns `PROTECTED_HASH_LEDGER_REQUEST_HELD`. No write occurs because a dedicated protected append-only table, approved retention period and independent reviewer approval have **not** been provisioned. The receipt explains this exact blocker.

This is a deliberate privacy and auditability decision, **not** a claim that durable owner acceptance was recorded. Physically using two devices cannot be established from two uploaded JSON files. The owner remains responsible for preserving genuine source files and for any independent review.

No live Supabase schema is changed by Build 719, and no new publicly exposed table is created. A future retention implementation requires schema design, RLS/grant review, security advisors, approved retention/deletion policy, deployed migration and a successful real write/readback. The production application remains functional when all four new configuration values are absent, but those particular evidence gates stay HELD.

## Verification and release boundaries

- `node scripts/build719_provider_disposition_persistence_test.mjs` tests matching/mismatched origin/account pins, absence and shift HOLD, actual authenticated GET against mock external feed, distinct role review, a generated throwaway independent Ed25519 witness, signed internal disposition, failed legacy auth, two actual JSON-format owner files and fail-closed retention decision.
- Existing Builds 627–718 booking tests, source gate contracts, admin UI audit, route parity and release hygiene continue in the canonical regression suite.
- The test fixtures and throwaway keys are synthetic. They do **not** represent a live provider connection, independent real-world witness or owner device observation.

`main` Production is GREEN **only** after exact commit, successful Cloudflare deployment and independent Release Health verification. That result is separate from the above business evidence HOLD statuses.

## Next planned Build 720

**Provider Binding Freshness & Source Drift Alerts, Independent Custody Reviewer Receipt Recovery and Protected Owner Evidence Ledger Approval Gate** — add safe drift comparisons, evidence recovery controls and a reviewed opt-in server-retention proposal without auto-authorizing any proof or customer communication.
