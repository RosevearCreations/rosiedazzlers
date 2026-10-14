# Build 556 — Evidence Intake and Owner HOLD Resolution

A protected staff-only section on the Service Economics / Commercial Capacity page provides browser-local metadata intake for the seven canonical HOLD areas from STARTUP_GO_LIVE_BLOCKERS.md. It accepts only explicitly typed evidence references, matching scopes, dated observations and explicit dated owner decisions. Missing, stale, future, duplicated, wrong-class, negative, unsafe or device-coverage-incomplete metadata fails closed.

The review is **never proof of independent provider or business acceptance**. Even a complete source-referenced operator packet is marked manual_closure_review_candidate_unverified and every canonical HOLD remains open. Retain-hold decisions stay retained. The unavailable-source category is not review-ready without an independently verified restoration.

Usage: sign in to the administration page, enter metadata-only JSON, use the optional sample strictly as a format guide, then review and export the sanitized local summary. Do not paste client names, emails, addresses, plates, private media keys, URLs, tokens or secrets. Verify provider records, actual recovery drill observations, authenticated role/device/browser observations, maintenance terms or service-specific seasonal capability independently. A subsequent separately reviewed owner change to STARTUP_GO_LIVE_BLOCKERS.md is required for any real HOLD update.

This build creates no new POST endpoint, persistent evidence storage, Supabase migration, R2 object, provider or customer action, pricing change, public winter claim or social post. Run node scripts/hold_evidence_intake_556_test.mjs and python scripts/hold_evidence_intake_556_check.py. The cumulative gates, protected main PR, exact-SHA Development acceptance, and independent exact main Cloudflare Production deployment/runtime/business acceptance are required to mark Production GREEN.

Next queued after independently verified Production GREEN: Build 557 — DAIP Measured Worker Delivery & Quota Baseline.
