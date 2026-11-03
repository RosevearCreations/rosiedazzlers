# Build 754 — Independent owner receipt authentication and source-correction closure gate

Status: **implemented read-only verification; business closure HOLD**. This release does not invent independent records, authenticate unconfigured identities, or mutate operational data.

## Private verification workflow

- `/admin-economic-verify-v754.html` is accessible from the Build 753 retest and inventory administration screens. It accepts two genuine signed JSON envelopes and a booking UUID/month. No signing secret should be entered into the browser.
- `GET /api/admin/economic_receipt_verify_v754` exposes only the presence of four server-side configuration values. `POST` requires a signed-in `manage_staff` session, same-origin JSON, and a maximum 16 KB input; no legacy or bridge-only session qualifies.
- The POST reads the current Build 753 → 752 → 751 economic source afresh with staff authentication and compares its exact month, booking, snapshot SHA-256 and exception status. A changed source means HOLD.
- Only two distinct pinned Ed25519 verification keys can authenticate the owner receipt and independently signed source attestation. The owner must bind the SHA-256 of the **entire signed source attestation transcript**.
- If keys are missing, identities overlap, signatures or dates fail, hashes or booking/period differ, or owning sources report exceptions, the result is HOLD. Even valid signatures produce only `ELIGIBLE_FOR_MANUAL_CLOSURE_REVIEW`.
- In **every** response, `source_correction_record_verified:false`, `closure_recorded:false`, `closure_allowed:false`, `automatic_business_write:false`. A separately authorized workflow must independently verify the original correction record and record the owner's closure decision in the owning system. This build is never a ledger writer.

## Configuration

Configure these **public** values in the production and preview Cloudflare Pages project settings (Variables and Secrets, or Builds → Build variables depending on interface); redeploy after changing configuration:

| Variable | Value |
| --- | --- |
| `ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64` | Base64 of 32 raw bytes of the owner's Ed25519 public verification key |
| `ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64` | Base64 of 32 raw bytes of an independently held source-reviewer's Ed25519 public verification key |
| `ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID` | Distinct stable public owner-key identifier (6–120 safe characters) |
| `ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID` | Distinct stable public source-key identifier (6–120 safe characters) |

**Never configure or commit private Ed25519 keys.** The two independent signers are responsible for private-key custody and authorization. Nothing is configured automatically. In the absence of real owner or source witness evidence, HOLD is the truthful outcome.

## Canonical signature protocol

The envelope is `{ "payload": { ...fields }, "signature_b64": "..." }`. All payload fields are nonempty strings except where a strict field constraint says otherwise, with *no extra or missing keys*. Each payload is canonically encoded into UTF-8 bytes using:

```
rosie-economics-receipt-v754:<kind>:<JSON.stringify([[field,value],...])>
```

where `kind` is `owner` or `source`, the JSON array uses the **exact field order below**, and `JSON.stringify` escapes strings according to ECMAScript. The signer creates a detached 64-byte Ed25519 signature over those exact bytes, then encodes the raw signature as padded standard Base64. Do not sign merely the JSON object without the prefix and ordered array.

`source` fields in order:

1. `schema` = `rosie-source-correction-attestation-v754`
2. `booking_id` (UUID)
3. `period` (YYYY-MM)
4. `baseline_snapshot_sha256` (64 hex characters)
5. `retest_snapshot_sha256` (64 hex characters)
6. `source_correction_reference` (6–120 safe characters)
7. `source_record_sha256` (SHA-256 of independently retained owning source record; **not** verified from its original here)
8. `issuer_id` (authenticated independent issuer reference)
9. `issuer_role` = `finance_reviewer`, `inventory_reviewer`, or `shift_reviewer`
10. `issued_at` (UTC ISO timestamp)
11. `expires_at` (UTC ISO timestamp)
12. `nonce` (32–64 hexadecimal characters)
13. `key_id` (must match the configured source-witness key ID)

`owner` fields in order:

1. `schema` = `rosie-owner-economic-receipt-v754`
2. `booking_id`
3. `period`
4. `baseline_snapshot_sha256`
5. `retest_snapshot_sha256`
6. `source_attestation_sha256` (SHA-256 of the exact **canonical source transcript** above)
7. `source_correction_reference` (same as source attestation)
8. `owner_id` (distinct from `issuer_id`)
9. `owner_role` = `owner`
10. `decision` = `approve_for_manual_closure_review` or `retain_hold`
11. `issued_at`
12. `expires_at`
13. `nonce` (distinct from source nonce)
14. `key_id` (must match configured owner key ID)

Receipts must be no older than seven days, expire in the future, have a lifetime of no more than 48 hours, and not be issued more than five minutes in the future. The baseline and retest snapshot hashes must differ. Signature and scope checks are performed server-side; browser metadata never grants approval. Key configuration or public labels alone cannot prove source-owner identity or custody; those require independent owner onboarding.

## Regression and boundaries

`node scripts/build754_owner_receipt_verify_test.mjs` uses freshly generated **test-only** Ed25519 keypairs; it tests two real valid signatures, role and SHA bindings, mismatched and stale signatures, current-source exceptions, missing and non-independent keys, retained owner HOLD, anonymous access and route parity. Test keys are never deployed.

No managed Basic Detail prices (Starting at $229/$269/$309 CAD), vehicle classes, consumables, shift/wages, source ledger, customer communication, provider authorization, winter HOLD, or public booking rules are changed.
