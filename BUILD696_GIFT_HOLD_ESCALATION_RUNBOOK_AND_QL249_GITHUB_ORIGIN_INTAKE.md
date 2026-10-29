# Build 696 — Gift HOLD Triage Escalation Runbook & QL-249 Independent GitHub Origin Evidence Intake (HELD)

**Release:** `RosevearCreations/rosiedazzlers` → `dev` → protected `main`, exact Cloudflare Production GREEN after all source, business and deployment checks.

## Owner-only escalation runbook

- `GET /api/admin/gift_owner_hold_escalation_runbook` delegates to the Build 695 signed-owner, no-legacy-fallback, bounded latest-100 unresolved fifth-review queue. It creates no new SQL queries, tables, RLS policies or grants.
- Every returned case is ordered by the existing safety priority and has a practical **manual** sequence for missing fifth-owner acknowledgment, 48h overdue sixth-witness owner acknowledgment, expired 14-day witness window, overdue 24h witness, overdue owner assignment, or continuing acknowledged HOLD.
- The runbook is decision support **only**. It does not create reviewer assignment, reopen/close any ledger, record owner approval, contact customer, resend a gift, charge/refund payment, call a provider or connect a gateway.
- The page displays text safely as `textContent`, and an explicit button opens the pre-existing exact-checkout read-only watch. It warns that a 100-item recent slice is not a complete historical audit.
- Every item retains `manual_hold=true`, `resend_permitted=false`, `delivery_confirmed=false`, `customer_contact_authorized=false` and `automatic_escalation=false`. No recipient email or message content is returned.

## QL-249 public GitHub response intake — still HELD

`GET /api/admin/integration_v1_ql249_github_origin_intake` reports owner-only safe readiness flags, without exposing trusted pins. `POST` accepts *only* two lowercase 40-hex SHAs. It validates a signed owner session, same-origin request, strict JSON and independently configured exact source SHA, later proof commit SHA, raw public JSON SHA-256, Ed25519 public DER-SPKI fingerprint, matching source CI URL, fresh challenge ID/hash and `tenantId=null` **before any public network request**.

When all trusted expectations exist and the owner explicitly requests the check, a bounded public **GitHub API** fetch uses fixed repository `RosevearCreations/rosiedazzlers` and at most three allowlisted read-only GET URLs:

1. Git commit object at `proofCommitSha`: exactly one parent must be the earlier `sourceRevisionSha`.
2. GitHub compare of source to proof: exactly one ahead commit, exactly one added file `docs/integration/ql246-source-proof.json`, no other code changes.
3. Exact-commit contents of that public proof file: strict bounded base64, raw byte count, Git blob SHA-1 identity (supplementary only), independent raw SHA-256 and canonical Ed25519 public signature/pin using the Build 694 verifier.

There is **no** GitHub token, app private key, HMAC credential, customer record, service call, database write or arbitrary URL argument. A GitHub 404, timeout, malformed JSON, unexpected diff or missing independent pin is **BLOCKED / HOLD**.

**Crucial evidentiary limit:** even an exact public GitHub API and signature match is labeled `PUBLIC_GITHUB_API_AND_PINNED_SIGNATURE_MATCH_ONLY`. It is not independent authenticated operator origin/CI attestation, AI Data Platform's acceptance of QL-248, genuine seven-denial gateway receipt proof, durable audit/revocation validation, or a time-bounded owner-authorized read-only pilot. No genuine signed `docs/integration/ql246-source-proof.json` is published by this build. All connections remain **DISCONNECTED / HOLD**; pilot approval **NOT GIVEN**.

## Verification and release acceptance

- `scripts/build696_gift_hold_escalation_test.mjs` checks all urgency classes, complete immutable HOLD/no-resend safety flags, signed owner-only source reuse, zero writes and no customer PII.
- `scripts/build696_ql249_github_origin_test.mjs` uses strictly synthetic ephemeral public Ed25519 test material to check pinned raw Git blob/sha256, proof-only compare, source parent, tamper/expiry/CI/pin denial, cross-origin/role/auth denial and no GitHub request before independent pin readiness. It cannot be used as an original source proof.
- Run full Builds 673–696 gift regression, cumulative source contracts and guarded production promotion contracts. No Supabase schema migration or permission expansion.
- Before `dev` → `main`, verify the feature PR A–D/aggregate and Cloudflare preview, exact `dev` Cloudflare acceptance and source A–D/aggregate, and prior `main` GREEN.
- After protected `main` merge, confirm exact SHA GitHub source A–D/aggregate, business acceptance A–D/aggregate, Cloudflare Pages and exact Production SHA, Release Health and live read-only HTTP asset/auth checks.

## Outstanding original evidence

AI Data Platform consumer adoption: PENDING. Independent origin and source CI attestation: PENDING. Original gateway GET, seven genuine denial/audit receipts, revocation and durable audit: PENDING. Authenticated owner pilot authorization: NOT GIVEN. Actual connection: DISCONNECTED / HOLD.

**Next queued after verified Production GREEN:** **Build 697 — Gift HOLD Escalation Outcome Audit & QL-250 Independent Source/CI Pin Custody Reconciliation (HELD)**. Do not begin until Build 696 is fully promoted.
