# Build 694 — Sixth-Witness Gift HOLD Aging & QL-248 Two-SHA Proof Commit Readiness

**Release target:** `RosevearCreations/rosiedazzlers` → `dev` → `main` (Cloudflare Pages Production GREEN)

## Gift discrepancy: bounded sixth-witness aging

- Read-only owner/staff scoped GET: `/api/admin/gift_sixth_witness_hold_aging?session_id=cs_...`.
- Reuses the Build 693 exact-checkout signed staff access, assignment visibility, masked recipient and immutable fifth-recurrence ledger. Does **not** create a seventh review table, assign a reviewer or write a record.
- Surfaces 24-hour owner assignment and sixth-witness follow-up, 48-hour owner HOLD acknowledgment due after independent check, and 14-day sixth-witness deadline (336 hours).
- Every phase keeps original discrepancy unresolved, manual HOLD and permanent no-resend. Expiration triggers manual internal escalation only; it does **not** allow fresh dispatch, confirmed delivery, customer messages or automatic reassignment.
- Existing B693 signed owner-only event recording remains unchanged; this new route has GET only.

## QL-248: proposed two-SHA transport clarification

See `docs/integration/ql246-source-proof-pending.md` and the cross-application QL-248 handoff.

| Identity | Meaning | Independent authority required |
| --- | --- | --- |
| `sourceRevisionSha` | Earlier audited/tested source commit | Pin source SHA + matching green CI run; signed QL-246 `payload.source_revision` |
| `proofCommitSha` | Later commit that contains signed public proof JSON | Independently pinned GitHub-origin commit, **outside** signed payload |
| `proofSha256` | SHA-256 of exact public JSON bytes | Separate authenticated operator manifest |
| `publicKeySpkiSha256` | SHA-256 of public Ed25519 DER SPKI | Different authenticated pin channel; never from proof itself |
| CI/challenge | Earlier source commit CI + fresh one-hour nonce | Independently authenticated expectations, with tenant `null` |

The new `/api/admin/integration_v1_ql248_proof_commit_readiness` GET reports configuration **flags** and a PENDING template, and POST checks one Rosie public row (`system`, `sourceRevisionSha`, `proofCommitSha`, `rawProofBase64`). POST is signed owner-only, same-origin and bounded. It hashes precise supplied raw bytes, checks distinct independently configured SHAs/digest/SPKI/CI/challenge and verifies QL-246 canonical Ed25519 bytes. It performs **no** GitHub lookup, external gateway call, HMAC provision, proof publication or operational write. Test Ed25519 fixtures are ephemeral and are never source evidence.

**Critical distinction:** A successful *offline cryptographic match* cannot attest immutable GitHub origin, actual independent seven-denial traces, original gateway GET and audit receipts, revocation, an AI Data Platform consumer amendment, or owner authorization. The six-app QL-248 Comms Hub proof bundle is not published here. Consumer agreement **PENDING**; actual integration **DISCONNECTED / HOLD**; owner pilot authorization **NOT GIVEN**.

No new environment values are set by this build. A designated authorized operator must independently validate and provision any genuine nonsecret expectations (`ROSEVEAR_QL246_EXPECTED_SOURCE_SHA`, `ROSEVEAR_QL248_EXPECTED_PROOF_COMMIT_SHA`, `ROSEVEAR_QL248_EXPECTED_PROOF_SHA256`, existing QL-246 public SPKI/CI/challenge settings). **Never** publish keys, mock receipts, personal data or tenant secrets.

## Verification and operational invariants

- `scripts/build694_sixth_aging_test.mjs`: all four phases, 24h / 48h / 14d boundaries, authenticated GET, email masking, only Supabase GETs, no new POST.
- `scripts/build694_ql248_two_sha_test.mjs`: synthetic ephemeral Ed25519 proof, raw bytes/digest, separate SHAs, pin/CI/challenge, tamper/expiry/cross-origin/staff rejection, never external gateway, always DISCONNECTED.
- `scripts/current_gift_issuance_regression.sh`: Build 673 through 694 historical no-resend/checkout regressions.
- `scripts/current_source_gate_contracts.sh` and guarded promotion contract checks remain mandatory.
- Existing Build 693 DB ledger reused. **No new migration, no new RLS surface or grants**; production DB checks are read-only.

## External verification needed before any QL-246/248 proof can be real

1. AI Data Platform QL-246 consumer expressly agrees to two-SHA amendment and all six systems separately acknowledge it.
2. Operator pins the real earlier source SHA / green matching CI and later proof-bearing SHA / precise raw bytes from independently authenticated GitHub origin.
3. Distinct per-app public SPKI pins independently verified; private signing keys remain local and secret.
4. Owner separately authorizes only narrow nonproduction GET tests; seven real gateway-denial paths, exact receipt/audit IDs, revocation and rollback are witnessed. No actual source tests or claims have been made here.
5. Fresh challenge and real signed public proof file can be published **only when original evidence exists**; then independently check immutable proof commit, source-to-proof diff and raw digest.
6. Any future read-only pilot requires a **separate, authenticated, time-bounded, reversible owner approval**. Current authorization: NOT GIVEN.

The GitHub/Cloudflare release being GREEN means only this safe, disconnected code and its checks are live. It does **not** change the integration's DISCONNECTED / HOLD state or certify gift delivery.
