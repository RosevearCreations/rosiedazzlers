# Build 689 — Gift Delivery Exception Follow-Up and QL-243 Integration Hand-off

## Gift follow-up: independent, per-gift and never another send

Build 689 adds three append-only stages against one exact Build 687 dispatch:

1. The original signed owner assigns a **different active independent reviewer** after Build 688 provider triage. The original delivery operator is excluded.
2. The assigned reviewer records a real recipient-source check or a documented unresolved conflict. A provider-accepted receipt cannot count as explicit recipient acknowledgment.
3. The owner may close only a consistent review less than 24 hours old. Confirmed closure requires the Build 688 explicit-recipient-confirmation receipt and the independent reviewer supporting it; unconfirmed closure requires Build 688 no-resend escalation and an independent finding that the recipient remains unconfirmed. Conflicting evidence keeps closure blocked.

The page shows 24-hour follow-up aging, assigned-reviewer aging and independent-review aging. Both the API and the database check active roles, exact gift/case/attempt, evidence timestamps, source fingerprint continuity and unique decision kind. No provider, Stripe, queue, customer message, invoice, gift balance or certificate status is modified.

## Rosie Dazzlers response to QL-243

Read the owner's handoff `ROSEVEAR_INTEGRATION_V1_CONNECTION_TEST_HANDOFF_QL243(1).md`. Rosie Dazzlers implements **nonproduction source-side scaffolding**, not the AI Data Platform gateway and not live connectivity.

- `GET /api/integration/v1/health` and `GET /api/integration/v1/capabilities` are implemented as backend-only Cloudflare Pages Functions, authenticated by the handoff's exact 12-line HMAC-SHA256 request format.
- A strict nonproduction hostname, `CF_PAGES_BRANCH != main`, configured origin and explicit `nonproduction` mode are all required. The routes are closed in Production regardless of credentials.
- Exact identity: caller `ai-data-platform`, source/destination `ai-data-platform → rosiedazzlers`, business `rosiedazzlers`, null tenant represented as `-`, `rosevear.integration.v1`, GET only, no query/body.
- Signature validation, ±300-second timestamp window, lowercase 32-hex nonce and key ID checks are mandatory. A successful nonce is claimed atomically in Supabase, uniquely scoped to this app/business/tenant/environment/key ID. Every enabled attempt yields a sanitized audit decision; duplicate nonce is denied.
- `capabilities` currently has `allowed_operations: []`. Future **read-only** quote/booking reference IDs are advertised as *planned*, not enabled. Gifts, payments, bookings, phone/SMS, cross-business data and dispatch are prohibited.
- Secrets are never placed in source code, browsers, GitHub, reports or attachments; the test uses an ephemeral random HMAC key generated inside the test process.
- Neither this source adapter nor the tests implement gateway Ed25519 signed receipts, identity witness validation, the Comms Hub gateway audit endpoint or owner read-only pilot authorization. **Those remain AI Data Platform / independent-witness responsibilities and HOLD.** No actual cross-app request or live customer action occurs in Build 689.

### Nonproduction configuration (not provisioned by this release)

Configure through the approved **server-side Cloudflare Pages encrypted secret manager**, separately for the nonproduction environment:

- `ROSEVEAR_INTEGRATION_V1_MODE=nonproduction` (explicit feature gate).
- `ROSEVEAR_INTEGRATION_V1_NONPROD_ORIGIN` (exact preview HTTPS origin, never the public production domain).
- `ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_ID` (distinct nonproduction source key identifier issued by the AI Data Platform registry).
- `ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64` (unique **32 random bytes**, base64, from a secure channel; never commit or paste into a test command).
- `ROSEVEAR_INTEGRATION_V1_REVOKED_KEY_IDS` (optional comma-separated revoked key IDs for explicit denial during rotation).
- Existing secure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` on the backend, with the Build 689 migration installed.

Do not enable these until the AI Data Platform nonproduction gateway is ready, DNS/egress and TLS rules are verified, and the owner separately approves a bounded nonproduction GET test. The source's health/capabilities JSON is **not** an Ed25519-signed gateway receipt and must not be submitted as if it were one. Real QL-243 gateway receipt IDs, independent public-key pins, owner/witness challenge attestations and durable gateway restart proof remain **NOT VERIFIED / HOLD**.

### Verification / handoff result fields

| Handoff field | Actual Build 689 state |
| --- | --- |
| Source application | `rosiedazzlers` |
| Allowed paths | `/api/integration/v1/health`, `/api/integration/v1/capabilities` GET only, nonproduction origin only |
| Tenant | `null` (`-` in signed request) |
| Business | `rosiedazzlers` |
| Capabilities | `[]` until independently authorized read-only pilot |
| Key ID, registered gateway credentials | **NOT PROVISIONED** |
| Signed gateway receipts, durable gateway audit IDs, independent witness, three public-key pins | **NOT VERIFIED** (gateway/witness pending) |
| Real live connection / owner pilot authorization | **DISCONNECTED / HOLD** |
| Tested negative paths | Wrong business/tenant, wrong method, URL query, signature tamper, stale timestamp, revoked key, atomic nonce replay, missing key, production-disabled |

Run `bash scripts/current_gift_issuance_regression.sh`. Run `node scripts/build689_followup_integration_canary.mjs` inside one `BEGIN ... ROLLBACK` transaction against the matching schema and require the full B681–B689 sentinel/zero synthetic residue. Then promote through required GitHub A–D/aggregate checks to Cloudflare exact `main` SHA. The gateway and owner pilot remain separate deployment decisions.

**Suggested next Rosie build:** Build 690 — Independent Gift Delivery Closure Recurrence Audit, No-Resend Aging Alert & Integration v1 Nonproduction Readiness Owner Review.
