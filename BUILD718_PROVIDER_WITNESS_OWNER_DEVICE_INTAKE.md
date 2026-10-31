# Rosie Dazzlers — Build 718

**Verified Shift Provider Connection Trial, Independent Export Key Custody Witness Intake & Real Owner Device Acceptance Closure**

## What is implemented

The protected Follow-Up Workload dashboard now has three additional evidence operations. All operate on original records and reject missing or mismatched inputs. They do **not** send customer notifications, change bookings, authorize cross-app Proof-B, or imply any live external service has already been connected.

1. **Actual shift provider GET trial.** Select a real staff account and planned follow-up time, then choose *Trial actual shift source*. The server makes a GET to its preconfigured HTTPS roster provider, verifies the source's approved shift coverage against protected recorded absence blocks, and includes the returned source revision and SHA-256 of the received JSON in a downloadable receipt. It reports `NOT_CONFIGURED` when no endpoint is configured, `SOURCE_UNAVAILABLE` on a configured-provider failure, and `HOLD` when a received source cannot substantiate the requested shift. A provider-reported approved shift is not an independent certification of that provider.
2. **Independent export key witness signature intake.** A signed Ed25519 JSON envelope can be selected by a *signed-in* staff administrator. The server verifies it against a separately pinned witness public JWK and compares its signed subject signer ID and SHA-256 fingerprint against the current live export signer self-test. The server explicitly rejects the same key for server signing and witness attestation, stale envelopes, incorrect scope, tampering, and missing keys. A cryptographically valid external signature is not itself proof that the witness is organizationally independent or has accepted any cross-app Proof-B custody.
3. **Owner cross-device receipt server review.** An authenticated named administrator selects the original unresolved owner feedback JSON and two **separate** accepted desktop/mobile owner feedback JSON files, explicitly confirms retesting on actual devices, and provides a remediation note. The server independently recomputes file hashes and checks consistency, chronology and the existing Build 717 cross-device rules. It returns a downloadable, authenticated response but **does not persist closure** or independently prove device origin. Legacy password-only admins have no identifiable staff account and cannot record this owner review. A real staff login is required.

## Configuration and evidence contract

These are server-side Cloudflare Pages configuration names; do not commit any key or bearer value to Git:

| Setting | Purpose |
| --- | --- |
| `ROSIE_STAFF_SHIFT_ROSTER_URL` | Operator-approved HTTPS GET provider, using Build 717 complete approved-shift schema and query parameters. |
| `ROSIE_STAFF_SHIFT_ROSTER_BEARER` | Optional private access credential for that provider. |
| `ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK` | Existing internal Ed25519 export signing private key. |
| `ROSIE_FOLLOWUP_EXPORT_SIGNER_ID` | Existing internal export signer identifier. |
| `ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK` | Newly required public-only Ed25519 JWK controlled separately from the internal export signer. |
| `ROSIE_EXPORT_CUSTODY_WITNESS_ID` | Newly required independently assigned witness identifier; cannot equal internal signer ID. |

The witness envelope format is:

```json
{
  "signature_algorithm": "Ed25519",
  "payload_base64": "base64-of-exact-UTF8-JSON-payload-bytes",
  "signature_base64": "base64-of-64-byte-Ed25519-signature-over-exact-payload-bytes"
}
```

Its signed JSON payload must have these fields: `type` = `rosie_export_signer_custody_witness`, `scope` = `internal_export_key_only`, `subject_signer_id`, `subject_public_key_sha256`, `witness_id`, and `witnessed_at` (valid ISO timestamp no older than 30 days, maximum 5 minutes into the future). The signer ID/fingerprint must be copied from the **live** protected signer audit, and the witness signer must actually sign the UTF-8 payload bytes with its separately held **private** key. The server only receives the pinned witness **public** key and the signed envelope, never the witness private key.

An independent human custody decision, legal witness validation, authorizing a source-proof record, and the six-app authenticated GET gateway remain **HELD** until authentic separately reviewed evidence exists. A production deploy is not that evidence.

## How we verify

- `node scripts/build718_provider_witness_owner_trial_test.mjs` tests real GET invocation against a mock remote provider, source digest and bearer confidentiality, fail-closed source states, a generated independent Ed25519 test witness and signature-negative cases, valid and invalid actual owner file structures, a session-backed admin review, and denial of anonymous or legacy-password-only owner closure.
- `bash scripts/current_booking_wizard_regression.sh`, `bash scripts/current_source_gate_contracts.sh`, `python3 scripts/admin_ui_audit.py`, `python3 scripts/sync_route_copies.py --check`, and `python3 scripts/release_hygiene_check.py` guard earlier booking, admin, source and route functionality.

Tests use generated throwaway keys and synthetic fixtures only to check code behavior. They do **not** supply a real shift provider, independent human witness, or owner device acceptance. Those evidence states must remain pending until actually provided.

## Next planned Build 719

**Shift Provider Production Binding Verification, Independent Witness Custody Disposition & Owner Device Evidence Persistence Decision** — validate the true owner-configured provider binding, record reviewable independent custody decisions without self-approval, and explicitly decide how authenticated owner feedback should be persisted and audited.
