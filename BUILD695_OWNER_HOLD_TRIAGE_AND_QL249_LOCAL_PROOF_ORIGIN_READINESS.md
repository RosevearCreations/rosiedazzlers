# Build 695 — Owner Gift HOLD Triage Queue & QL-249 Git Proof-Origin Readiness

**Release path:** `RosevearCreations/rosiedazzlers` → `dev` → protected `main` → exact Cloudflare Production GREEN.

## Owner-only recent unresolved gift queue

- A read-only signed owner GET, `/api/admin/gift_owner_hold_triage_queue`, reuses existing immutable Build 692/693 events and original gift certificate mapping.
- Reads up to **100 most recent** unresolved fifth-review events; recent evidence selection is bounded, and the result explicitly says when the limit may omit older cases. This is a triage convenience, **not** a complete historical audit.
- Prioritizes missing fifth owner HOLD evidence, overdue 48h owner acknowledgment, expired 14-day independent sixth-witness window, overdue 24h sixth witness, overdue 24h owner assignment, and acknowledged but still unresolved HOLD.
- A safe button copies the exact checkout session into the existing Build 694 read-only watch. No automatic reviewer, customer contact, gift send, delivery assertion, payment, SMS, gateway request or new ledger row.
- Server returns IDs and internal aging/state only. No recipient email, message body or provider receipt is returned. Owner authorization is mandatory; legacy admin fallback and signed-in staff non-owners are denied. No new table, RLS policy, grant or schema change.

## QL-249 local Git object retest — not GitHub attestation

The proposed QL-248 distinction remains in force only as a proposed clarification: the earlier audited source SHA must differ from the later public proof-bearing commit SHA. AI Data Platform consumer agreement is still **PENDING**.

The new offline local helper accepts only independently obtained *nonsecret* metadata:

```sh
node scripts/ql249_rosie_local_git_proof_review.mjs \
  --repo . \
  --source-sha '<earlier-audited-source-40-hex-SHA>' \
  --proof-sha '<later-proof-containing-40-hex-SHA>' \
  --proof-sha256 '<sha256-of-exact-raw-public-json-file>' \
  --public-spki-sha256 '<independently-verified-public-DER-SPKI-sha256>' \
  --ci-url 'https://github.com/RosevearCreations/rosiedazzlers/actions/runs/123456' \
  --challenge-id 'np-from-authorized-operator' \
  --challenge-sha256 '<nonsecret-hash-of-fresh-operator-challenge>'
```

It calls local read-only `git cat-file`, `git merge-base`, `git diff` and `git show` (no clone, fetch or remote call), requires the proof commit to descend from the audited source with only `docs/integration/ql246-source-proof.json` added/changed, checks exact raw JSON digest and existing QL-248 pinned Ed25519 payload verification. A successful test is labeled **LOCAL_GIT_OBJECT_AND_PUBLIC_SIGNATURE_MATCH_ONLY**.

This helper **cannot** establish independently authenticated GitHub provenance/CI, genuine seven denied nonproduction gateway paths, audit durability, revocation, customer authorization or AI Data Platform agreement. It does not create an Ed25519 key, publish a proof, provision an HMAC secret, connect to a gateway or authorize a read-only pilot. No authentic `docs/integration/ql246-source-proof.json` is present yet. Synthetic fixture PASS is strictly test evidence, never a production/witness receipt.

## Verification and deployment requirements

- `scripts/build695_owner_hold_queue_test.mjs`: owner-only, bounded newest evidence, priority order, missing source fail-closed, no raw recipient identifiers/email, no DB mutation or external provider contact.
- `scripts/build695_ql249_local_git_review_test.mjs`: ephemeral local Git fixture with distinct source/proof SHAs, exact public raw bytes, sole proof-file diff, pin/signature validation, invalid SHA, tamper and changed-code rejection; never accepted as real QL-246 evidence.
- Run full Builds 673–695 regression, cumulative source gate, guarded promotion test and `git diff --check`.
- Confirm existing RLS and authorized service-only query access read-only; do **not** widen grants.
- `dev` exact Cloudflare deployment and source suites A–D+aggregate must pass before merging `dev` to `main`; then wait exact Production deployment, business acceptance, source gate, Release Health and public safe HTTP smoke.

## Remaining external HOLD blockers

AI Data Platform has not agreed to QL-248; independent per-app GitHub origin/SPKI/CI pins, original gateway receipts and seven real denial traces remain PENDING. No owner identity approval or read-only pilot authorization exists. Actual connection state stays **DISCONNECTED / HOLD**, regardless of successful source deployment.

**Next queued after this verified release:** Build 696 — Gift HOLD Triage Escalation Runbook & QL-249 Independent GitHub Origin Evidence Intake (HELD). Only begin after Build 695 `main` Production is GREEN.
