# Build 699 — Gift HOLD Snapshot Comparison Readiness & QL-253 Immutable Proof/CI Recheck Continuity (HELD)

**Application release:** Rosie Dazzlers feature → `dev` → protected `main` → exact SHA CI + Cloudflare production verification before GREEN. **Integration:** `DISCONNECTED / HOLD` pending real proof and authenticated private permissions.

## Bounded owner snapshot comparison, no delivery claim

- Existing Build 698 `GET /api/admin/gift_hold_recurrence_followup` remains owner-only, read-only and latest-100 bounded. The Build 699 browser captures its current response to a **locally downloadable**, no-PII, SHA-256-pseudonymized summary with exactly seven unresolved HOLD classes, strict safety flags and a self-integrity digest.
- A separately saved prior JSON can be compared **within the same browser** with a newly captured current snapshot. It is not uploaded, sent to the server, persisted to localStorage or shared with another user. Validation rejects malformed/oversized/duplicate/unsafe snapshots, chronology reversal and digest mismatch.
- The comparison reports unchanged, changed classification/phase, newly visible and no-longer-visible **bounded sample** counts with explicit truncation caveats. It does **not** claim historical authenticity, independently verified recurrence, delivery, missing-case resolution, closure authorization or permission to resend.
- No database migration, grant, new data write, gift notification, checkout, payment or gateway operation.

## QL-253 public GitHub continuity

- New owner-only `GET` status has zero public network calls. Explicit strict-origin `POST` action fetches public GitHub `main`, exact-head completed-GREEN `Current Source Gate` metadata and the original proof path via the QL-252 public-only checker. Any mid-check SHA drift fails closed; missing proof returns HTTP 404 status, not success.
- This public CI result has no private signer trust. Proof commit B, exact raw-byte hash, independent registry/custody/witness receipt IDs, original seven-denial gateway receipts and separately authenticated owner TEST-only decision are **NOT_AVAILABLE / NOT_GIVEN**. No private Windows relay, gateway `GET`, booking or customer operation is run.
- See [QL-253 source/CI provenance HOLD sheet](docs/integration/ql253-rosie-original-source-proof-watch.md). An actual custodian must provide the signed QL-248 proof and independent pin registry attestations before separate proof commit B can be published; synthetic tests never qualify.

## Verification required

1. `node scripts/build699_gift_hold_snapshot_comparison_test.mjs`
2. `node scripts/build699_ql253_public_ci_continuity_test.mjs`
3. `bash scripts/current_gift_issuance_regression.sh`, `bash scripts/current_source_gate_contracts.sh` and guarded production promotion regression.
4. Feature/dev/main source and business CI, Cloudflare exact-SHA Production deployment, release-health drift acceptance, live owner UI and unauthenticated API denial; independently retry public proof path at immutable promoted `main`.

**Next queued:** Build 700 — Gift HOLD Snapshot Provenance Review & QL-254 Original Signed Proof Retrieval Watch (HELD).
