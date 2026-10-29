# Rosie Dazzlers — QL-255/256 real signer provisioning and independent custody handoff

**Repo:** `RosevearCreations/rosiedazzlers`.
**Business:** `rosiedazzlers`; **tenant:** `null`; **environment:** `nonproduction`.
**Status as inspected 29 October 2026:** `SIGNER_STATUS_UNKNOWN`; no original QL-246 proof published (`HTTP 404` at Build 700 main `79751649527a3b4a887ce252f8a1c5b93a9434bd`). **Connection:** `DISCONNECTED / HOLD`. No owner TEST-only authorization.

This document is an **operator action sheet**, not a source proof, private attestation, owner approval or observed gateway receipt. Do not put a private key, home IP address, customer/booking/gift record, unpublished endpoint, token or private identity document in GitHub, this document or chat.

## Real next tasks (in dependency order)

1. **Privately nominate three distinct people/roles:** (a) Rosie Ed25519 signing-key custodian, (b) separate out-of-band key-pin witness, (c) independent decision reviewer. Authenticate each person on a trusted private channel. Their names/identity documents stay outside GitHub. Current state: `NOT_ASSIGNED / PRIVATE_REVIEW_REQUESTED` — code cannot assign or authenticate human beings.
2. **On a persistent trusted computer controlled by the custodian**, create the parent of a new restricted directory **outside any Git worktree, cloud-synced share, CI, Pages assets or public server**. Store it on an encrypted disk with a tested private backup. On Windows, use the directory's **Properties → Security → Advanced** to disable broad inheritance and grant access only to the authorized custodian/SYSTEM; Node's POSIX `0600` alone does **not** establish a Windows ACL. Use a unique directory name, e.g. `C:\RosevearSecure\rosie-ql256-source` (illustrative path, not an existing or verified folder). Install and trust Node.js on that computer.
3. **Generate the real app-specific Ed25519 pair** by running from a trusted clone of the current repository on the custodian's computer:

   ```powershell
   node scripts/ql256_rosie_signer_custody.mjs provision --custody-dir "C:\RosevearSecure\rosie-ql256-source"
   ```

   The tool **refuses to overwrite** an existing key, refuses a directory inside this repository, writes the private PKCS#8 file inside the restricted directory and prints **only** the public DER-SPKI SHA-256 (64 hex characters) and an honest `SIGNER_EXISTS_CUSTODY_NOT_VERIFIED`. A CI-generated key, fixture, an ephemeral ChatGPT scratch key or a self-asserted witness **must not** be recorded as real custody.
4. **Independent pin + five-minute challenge.** The custodian gives the witness the *public* PEM and public fingerprint through two separately authenticated trusted channels (never the private PEM). The witness computes SHA-256 over **DER-SPKI bytes**, compares it out of band, independently pins it in the private registry, and issues a cryptographically random short-lived challenge scoped to exact audited **source A**, **A's successful `Current Source Gate` Actions run**, `rosiedazzlers`, tenant `null`, and nonproduction. Use `issued_at` and `expires_at` as Unix milliseconds, with a lifetime at most 300,000 ms. A private challenge has exactly these fields:

   ```json
   {
     "business_id":"rosiedazzlers",
     "challenge_id":"np-<independent-random-nonsecret-id>",
     "ci_run_url":"https://github.com/RosevearCreations/rosiedazzlers/actions/runs/<actual-run-id>",
     "environment":"nonproduction",
     "expires_at":0,
     "issued_at":0,
     "nonce":"<fresh-cryptographically-random-base64url-nonce>",
     "repository":"RosevearCreations/rosiedazzlers",
     "source_sha_A":"<40-character-tested-SHA>",
     "tenant_id":null
   }
   ```

   The angle-bracket placeholders/zero timestamps above are **not valid evidence**. The custodian uses an actual independently issued private challenge file and executes, before expiry:

   ```powershell
   node scripts/ql256_rosie_signer_custody.mjs respond --custody-dir "C:\RosevearSecure\rosie-ql256-source" --challenge-file "C:\PrivateReview\challenge.json" --response-file "C:\PrivateReview\rosie-response.json"
   ```

   The response is genuinely Ed25519-signed and includes the signed challenge **hash**, exact source, CI, public key, fingerprint and explicit `real_world_custody_verified: false`. It excludes the private key and raw nonce. The custodian transmits it privately to the distinct witness. The independent reviewer authenticates each real-world identity, freshness and distinct fingerprints, checks the source/CI and registers separate **opaque nonsecret** receipt IDs. A matching signature proves *key possession only* until those independent checks finish.
5. **Reviewer accepts the phased dependency:** establish authentic signer/public pin/source A first, then obtain a separately authenticated *future ≤30-minute UTC* owner TEST-only decision for precisely `rosiedazzlers`, `null` tenant, `GET` `/api/integration/v1/health` and `GET` `/api/integration/v1/capabilities`. Never send gateway requests until approved. An app release is not that consent.
6. **Genuine test and final proof:** separately witness real health/capabilities GETs and seven denial cases on an isolated synthetic test identity with durable audit, revocation and rollback. No real gifts, charge/refund, bookings, recipients, SMS or customer state. Collect original nonsecret receipt references. Using the still-valid nonproduction challenge and original receipts, the custodian signs QL-246 canonical payload referencing tested **A**. A distinct *proof-only* commit **B** adds `docs/integration/ql246-source-proof.json` and descends from **A**. B must not be embedded in its own payload. Promote B through protected `dev/main`; recheck immutable public HTTP 200 at B, raw SHA-256 and A→B ancestry, source CI for A and independent custody receipts. If the challenge has expired, renew it; never backdate evidence.

## Configuration names (secret values withheld)

The owner-only site control `GET /api/admin/integration_v1_ql256_config_inventory` checks **live Pages runtime presence and basic format**, never the actual values or fingerprint. It does not enumerate GitHub Actions secrets, private Windows vaults or the custodian's storage. The command-shell context of the maintainer had **none of these integration trust variables configured** on 29 October 2026; deployed Pages values cannot be inferred from that. No GitHub/Cloudflare administrative secret-management token was available in the maintainer's shell.

| Name | Where it belongs | Value / confirmed fact |
| --- | --- | --- |
| `CF_PAGES_BRANCH` | Cloudflare Pages runtime built-in | Production expected `main`; deploy-specific actual value must be checked in runtime |
| `CF_PAGES_COMMIT_SHA` | Pages runtime built-in | Last independently verified public `main` **before Build 701**: `79751649527a3b4a887ce252f8a1c5b93a9434bd`; runtime value not disclosed |
| `SUPABASE_URL` | Server binding | Configured value unknown from shell; never print URL here |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server secret only** | Actual value not accessible; must never go in browser/GitHub |
| `ROSEVEAR_INTEGRATION_V1_MODE` | Nonproduction Pages deployment only | Desired `nonproduction` only after separate authorization; **not enabled on production** |
| `ROSEVEAR_INTEGRATION_V1_NONPROD_ORIGIN` | Nonproduction Pages binding | Unknown; must match isolated HTTPS preview origin, never home/private gateway |
| `ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_ID` | Nonproduction gateway binding | Unknown; distinct per app, not a proof signer |
| `ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64` | **Nonproduction HMAC secret** | Unknown; independent of Ed25519 signer; 32 random bytes encoded base64url |
| `ROSEVEAR_INTEGRATION_V1_REVOKED_KEY_IDS` | Nonproduction gateway binding | Unknown; revocation list, do not infer test evidence |
| `ROSEVEAR_QL246_TRUSTED_SPKI_SHA256` | Source verifier runtime, **after out-of-band pin** | Unknown; must be real independent DER-SPKI SHA-256, **never derive trust from public proof alone** |
| `ROSEVEAR_QL246_EXPECTED_SOURCE_SHA` | Verifier runtime, after A finalized | Candidate A: last proven GREEN Build 700 SHA above; select fresh exact Build 701 A after promotion |
| `ROSEVEAR_QL246_EXPECTED_CI_RUN_URL` | Verifier runtime, after A finalized | Historical GREEN Build 700 run: `https://github.com/RosevearCreations/rosiedazzlers/actions/runs/40878439083`; replace when A changes |
| `ROSEVEAR_QL246_EXPECTED_CHALLENGE_ID` | Verifier runtime | Unknown; private issuer must generate fresh `np-...` challenge |
| `ROSEVEAR_QL246_EXPECTED_CHALLENGE_SHA256` | Verifier runtime | Unknown; independently obtained 64-hex digest |
| `ROSEVEAR_QL248_EXPECTED_PROOF_COMMIT_SHA` | Verifier runtime, after B exists | `NOT_AVAILABLE` — original B not published |
| `ROSEVEAR_QL248_EXPECTED_PROOF_SHA256` | Verifier runtime, after B exists | `NOT_AVAILABLE` — no original raw proof bytes |

**Do not put the Ed25519 private key in `ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64` or GitHub CI**; that key is a *different* HMAC mechanism. Do not enable the preview-only integration mode on `main`. Configuration presence is not independently witnessed custody or TEST consent.

## Verifiable public Build 700 source facts

- Audited candidate source **A** (before Build 701): `79751649527a3b4a887ce252f8a1c5b93a9434bd`.
- [GREEN A source CI, exact head](https://github.com/RosevearCreations/rosiedazzlers/actions/runs/40878439083).
- QL-246 proof at this exact SHA: [immutable raw path](https://raw.githubusercontent.com/RosevearCreations/rosiedazzlers/79751649527a3b4a887ce252f8a1c5b93a9434bd/docs/integration/ql246-source-proof.json) — **HTTP 404** at last observed check.
- Proof B, raw SHA-256, authenticated custodian/witness/reviewer, independent registry, original gateway receipts: `NOT_AVAILABLE`.

**Next specific blocker:** name and privately authenticate a real custodian, a separate public-key witness and an independent reviewer; then provision the durable key on the custodian-controlled machine and obtain an independently pinned 5-minute challenge-response. No source proof, TEST-only gateway request or cross-app connection is permitted until that private gate is satisfied.
