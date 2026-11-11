# Rosie Dazzlers 844 — Independent Provider Receipts, Public Derivative Recall & Device Review

Release state: **software source candidate** pending protected `dev`, `main` and immutable exact-main Production proof. Real platform, provider access, original customer consent, witness enrollment and device hardware observations are independent external evidence gates; source GREEN never resolves them.

## What ships

1. Owner-only `GET/POST /api/admin/jobday_independent_acceptance_844`, using the existing private Supabase service-only Creative Project, social attempt, Photo Studio and audit ledgers. GET exposes only bounded, sanitized platform state, independent witness evidence and public recall status; it does not return customer photos, private media, provider tokens or witnesses' private keys.
2. **Signed independent provider-response receipt admission.** A separate approved verifier must actually authenticate to the named platform, capture the exact provider API request ID, response digest and HTTP outcome, then Ed25519-sign a source-bound Build 844 envelope. `post_live` requires an authenticated 200/`provider_post_found`. `post_removed` requires an authenticated 200/204 explicit `provider_delete_acknowledged`, with an existing Build 843 consent withdrawal and recall request. A 404, public URL inspection, self-attested checkbox, unpinned key, stale signature, wrong platform, wrong external ID/URL, replayed nonce or owner-self witness cannot make a post VERIFIED. Rosie checks the independent witness signature but **does not call the social provider API itself**. Provider-native cryptographic signature and original API custody must be reviewed separately.
3. **Independent device witness receipt.** A distinct independent signer must attest the same booking, DAIP project, Build 842 original-device PASS audit, Build 843 owner closure, device type, recent accessibility/recovery checks and external evidence digest. Rosie verifies the configured separate device public key and writes an append-only signed-witness review. This verifies the *independent witness signature*, not the physical device, automated accessibility coverage, or a blanket suite-wide device acceptance.
4. **Owner-gated public R2 derivative recall.** After durable consent revocation, an owner may specifically authorize the permanent deletion of one exact, previously attached approved Photo Studio public object. The backend refuses private media, missing ownership lineage, wrong URLs, active site placements, another booking's use, unblocked social reuse, missing R2, or an unbound original object. It records a preflight audit; checks authenticated R2 HEAD; archives the Photo Studio row to block new assignments; calls DELETE; independently checks HEAD is absent; and saves an origin-deletion receipt. **This can permanently destroy the public derivative.** Private originals are untouched. CDN caches, social platform copies, third-party mirrors and unrelated static references are **not** proven deleted. Partial storage/database failures require manual recovery rather than a fabricated success.
5. No new SQL schema or credentials in frontend. Existing RLS/service-role boundary is retained. No new Windows tasks on Ree's original server; no automatic social posting, provider deletion, or background polling.

## Trust and setup (separate from code deployment)

- An independent custodian separately creates and retains the provider-response Ed25519 private signer. Only its verified 32-byte public pin, base64url encoded, is installed as `ROSIE_SOCIAL_PROVIDER_WITNESS_ED25519_PUBLIC_KEY` in Rosie's protected Cloudflare runtime. Device reviews use a **different** custodian/key and `ROSIE_DEVICE_INDEPENDENT_WITNESS_ED25519_PUBLIC_KEY`. Neither private key belongs in the repo or staff browser. Do not reuse a legacy unrelated signer or manufacture its custody.
- The verifier constructs a JSON receipt with **exactly** the Build 844 fields listed in `functions/api/_lib/jobday-acceptance-844.js`. The detached Ed25519 signature covers UTF-8 `ROSIE-844-PROVIDER-V1\n` or `ROSIE-844-DEVICE-V1\n` followed by `JSON.stringify(fields.map(k => receipt[k]))`, using the exported field order. Provider receipt validity is 24 hours; the required original-device PASS is at most 30 days old. The original independent verifier must itself retain the real provider response and authenticated API operation evidence for audit.
- Public R2 origin deletion additionally requires the existing **specific public assets bucket binding** with authenticated `head` and `delete`, the owner's explicit per-item confirmation, no active cross-use, and a linked Build 842 approved derivative. Do not apply this action to private DAIP media.
- Where enrollment, independent API checks, customer consent, account ownership, device observation or public cache invalidation is missing, show **HOLD**. Signed witness evidence is not a Meta/Google/TikTok/etc provider-native signature. No real-world action occurs merely by deploying code.

## Regression

```sh
node scripts/build842_owner_device_derivative_delivery_test.mjs
node scripts/build843_platform_recall_mobile_closure_test.mjs
node scripts/build844_independent_provider_r2_device_test.mjs
bash scripts/current_booking_wizard_regression.sh
python scripts/release_check.py
python scripts/release_authority_documentation_convergence_check.py
```

Next conditional **Build 845 — Real Provider Adapter Enrollment, Recall Outcome Escalations & Original Device Acceptance Pilot**. Only independently observed and accepted live runtime receipts may move original provider/device gates out of HOLD.
