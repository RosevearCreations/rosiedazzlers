# Rosie Build 915 — Provider Readback, Private Receipts, Safe Attribution, Cross-Device Pilot

November 20, 2026. This source work adds independently authenticated read-only provider queries and a private original-database receipt workflow. It does NOT publish videos, claim received supplier equipment, grant customer marketing consent, or constitute an original device test. Software and original business acceptance are separate.

## Source of Value mapping

- RD14: Customer intake photos remain private. Publication requires separate signed-in human approval, current Creative Project and selected DAIP-media public consent, a supplier receipt, and original provider corroboration.
- RD20: Measure opt-in first-party landing, product-interest and quote-started events only, grouped by a minimum of five. Never infer people, sales, profit or campaign ROAS from an event count.
- RD21–RD25: Rosie still owns its independent service/retail/HST books, material costs, route contribution, tender settlement, deposits and accounts receivable. No cross-business financial changes.

## End-to-end implementation

1. Original Build 911 supplier-review and Build 914 custody/publication approval are necessary. Staff cannot publish unreceived VEVOR samples or private customer media.
2. Staff open /admin-supplier-915.html (linked from retail administration). Responsive accessible form accepts an original review and provider-issued video ID, not an arbitrary URL.
3. POST /api/admin/supplier_provider_v915 requires an authenticated current staff session, DAIP management rights, same origin, correct current project consent, selected asset consent, original source work complete and physical supplier receipt flagged verified.
4. Live owner-scoped read-only provider adapters: YouTube OAuth channels.list mine + videos.list public processed and matching channel; Meta Facebook Page/Instagram professional account identity readback plus video/post owner, publication and canonical host checks. Credentials are private Cloudflare settings, not client arguments. Missing secrets or real public proof => HOLD.
5. Original Postgres RPC rosie_supplier_confirm_provider_v915 performs one transaction: lock pending publication; recheck original consent/custody and media; insert unique durable provider receipt; update original publication to provider_verified. Repeat and stale approval rejected.
6. GET /api/admin/supplier_provider_v915 is staff-only, shows original readback, consent HOLD and privacy-safe aggregates; a prior certificate is not proof of present consent after withdrawal.
7. POST /api/public/supplier_attribution_v915 allows only {publication_id,event_uuid,event_kind}, strict first-party origin, verified provider publication, receipt and still-current consent. The real source channel is taken from the original DB. UUID events deduplicated; optional ROSIE_ATTRIBUTION_ENABLED must be true.
8. Public retail.html opt-in attribution script accepts a verified-publication UUID campaign parameter, requires the existing interest checkbox and sends ephemeral event UUIDs only. No user identity, cookie, IP, destination URL, media key or customer contact data is recorded. Rollup function reports groups with at least 5 events.

## Source and security artifacts

- supabase/migrations/20261120214000_build915_provider_receipts_attribution.sql — private receipt table, UUID deduplication, security-invoker rollup and atomic proof function; service_role-only grants, RLS enabled, zero anon/auth table privileges.
- functions/api/_lib/supplier-provider915.js — fixed provider domains, bounded read-only GET, no redirect, no publication mutation.
- functions/api/admin/supplier_provider_v915.js — signed staff authorization and original-source consent check.
- functions/api/public/supplier_attribution_v915.js — opt-in anonymous engagement only.
- assets/build915-anonymous-attribution-client.mjs and admin-supplier-915.html — public opt-in and owner review interfaces.
- tests/build915_provider_proof.test.mjs and tests/build915_live_provider_pipeline.test.mjs — provider mocks, wrong-owner/private denials, RLS and event privacy.
- .github/workflows/rosie915-provider-proof.yml — Node24 syntax and previous Rosie 911–914 regression checks.

## Independent acceptance remains mandatory

Original staff database last inspected contains one active Admin and one active Senior Detailer, one customer profile and zero new Build914 supplier/attribution records. A standard Detailer login and genuine customer sign-in were not verified. Owner must witness actual cross-device Admin, Detailer and Customer tasks on desktop and phone. Live supplier custody and original external posted video receipts require actual data, not fake stock, mock provider replies, or pasted URLs. Configure original YouTube OAuth channel or Meta owner credentials as Cloudflare secrets, test approved video and withdrawal recall, then enable real anonymous measurement. Separate Build882 original signer HOLD is not waived.

**Do not report production GREEN** until protected dev and main checks, exact immutable main Cloudflare deployment and release/business health gates pass. A software GREEN release can still have provider/device business acceptance HOLD when no original evidence exists. No synthetic data or original financial mutation are introduced here.

Next queued after Build 915 software release: Build 916 — Original Supplier/Customer Consent Revocation and Real Cross-Channel Recall, with Tenant-Safe Financial Attribution and Device Evidence.
