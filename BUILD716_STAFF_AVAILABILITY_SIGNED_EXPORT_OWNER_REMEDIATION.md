# Rosie Dazzlers — Build 716

**Staff Availability Source Integration, Signed Export Receipt Options & Owner Feedback Remediation**

## Manager follow-up assignment

- Select an actual saved quote and active booking-authorized staff member.
- Choose the **planned internal follow-up time** (one-hour review window, up to 30 days forward).
- The server reads existing protected `staff_availability_blocks` for that staff member and time. Recorded `unavailable`, `vacation`, `sick` or `training` overlaps block the reassignment; source outage or the 50-record limit also blocks it.
- Recorded `light_duty` overlap requires an explicit, documented manager override, alongside any conservative queue overload. An override **cannot** bypass an absent or firm unavailability block.
- The server repeats the live availability query on POST before writing the existing internal follow-up assignment event. A successful action carries the planned time, absence-source readback counts and manager decision; previous consent rechecks become stale.
- No absence block **does not prove** the staff member is scheduled or actually available. This is not a shift scheduling engine, work-hour budget, payroll check or physical ability determination.

## Optional cryptographically signed export

- A manager may download the current source-linked resolution evidence JSON, always available in unsigned form when source data is safe and the manager is authenticated.
- A separate signed option is enabled **only** if the production server has `ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK` (JSON Cloudflare secret) and `ROSIE_FOLLOWUP_EXPORT_SIGNER_ID` (non-secret identifier). Do not store private keys in source files, JavaScript or GitHub variables visible to browsers.
- The server signs the exact UTF-8 JSON payload bytes with Ed25519 and exports a verifiable detached envelope: base64 payload, signature, public JWK, signer ID and explicit custody limitation.
- The signature proves possession of the configured **server key**, not independent custodian authority, Proof-B, source authenticity, service completion, customer consent or audit closure. This build does not provision an independent signer or assert one exists.
- When the key is missing or invalid, signed export is disabled/refused; no substitute signature is fabricated.

To verify an exported signed envelope, decode `receipt_base64` and `signature_base64`, import `public_key_jwk` as an Ed25519 **verify** key, and verify the signature against the exact decoded receipt bytes. Treat the public key as trusted only after independent out-of-band identification.

## Actual owner issue remediation

1. Run the real owner walkthrough on desktop/mobile and download a **needs_changes** Build 715/716 local feedback JSON.
2. Make the actual UI change; select the unresolved JSON in the new remediation panel. The browser validates the receipt and computes its SHA-256 digest locally.
3. Retest all five acceptance checks on the live device, set the outcome to **Accepted**, write a 20+ character remediation/retest note and explicitly acknowledge the retest.
4. Download the Build 716 remediation receipt that references the original unresolved feedback SHA-256.

Both receipts remain local, unverified self-attestations. No server approval, independent signature or customer operation is implied. If a problem remains, download another **needs_changes** feedback receipt and keep it open.

## Safety and tests

Build 716 reuses existing staff availability data and existing protected follow-up events. No new public tables, customer notification, SMS/email dispatch, automatic consent or audit closure.

Run `node scripts/build716_availability_signature_owner_remediation_test.mjs` plus the existing Build 714/715 tests, `bash scripts/current_booking_wizard_regression.sh`, source gate, admin UI audit, route sync and release hygiene checks.

## Next planned Build 717

**Staff Shift Roster Verification, Export Signer Custody Audit & Owner Cross-Device Remediation Review** — require a verified shift-hour source before claiming schedule availability, review any actual key custody evidence and collect real cross-device owner closure feedback.
