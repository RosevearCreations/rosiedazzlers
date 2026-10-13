# Build 552 — Booking & Quote Controlled Follow-Up Interpretation + DAIP Private Render Preflight

## Controlled booking/quote comparisons
The existing protected `/api/admin/booking_quote_experiment_follow_up_decision` GET now composes the Build 542 integrity review with an optional **source-owned, read-only** operator cohort-count JSON (`BOOKING_QUOTE_FOLLOW_UP_MEASUREMENTS_JSON`). The staff Booking & Quote learning page provides a manual refresh. Each cohort must match an exact currently recognized measurement lock revision, declared primary metric, current comparable allocation arms and matching window. Operators must supply explicitly eligible sessions, **separately counted weather-ineligible exclusions**, observed conversions, and explicit review of weather exclusions, capacity confounders and booking conflicts. Zero-eligible, mismatched, unreviewed or stopped cohorts retain a HOLD.

Observed rates are **descriptive only**. Neither raw differences nor current evidence establishes statistically significant superiority or causation; there is no automatic price/discount/booking rule change, outreach, winner choice, provider action or HOLD closure. The new configuration is optional and is **not created or modified** by this change.

## DAIP private worker/render acceptance boundary
The existing staff-only Creative Project DAIP screen includes a quota-aware **private render preflight** for its Build 551 editor's shot list: 16:9, 9:16 or 4:5, duration, temporary storage estimate and declared Cloudflare worker CPU budget. It requires actual independently observed private R2 source HEAD, authenticated private FFmpeg runner, private destination binding, current customer consent, independently inspected face/plate/address redaction, and explicit human dispatch. The browser cannot assert these external facts; they remain unverified, so a plan correctly displays **blocked** until a genuine controlled worker and evidence are independently supplied. Raw masters are immutable. No FFmpeg runs, real proxy/video/thumbnail is created, no R2 object is written and no social post is published in this build. No payments, new Cloudflare paid services or DB migration are used.

The intended future worker adapter is authenticated/allowlisted, resolves private asset IDs server-side rather than taking raw R2 keys, validates quota before work, uses idempotent retryable jobs, keeps derivatives private, records actual output checksums and redaction/consent inspection, and requires per-channel human release before publishing. This build **does not claim that adapter exists**.

## Acceptance and promotion
`python scripts/booking_quote_daip_private_render_check.py` and `node scripts/booking_quote_daip_private_render_test.mjs` protect core source integration, mirrored admin routes, season-excluded denominator cases and the no-execution privacy boundary. Protected `dev` and `main` PRs plus independent exact SHA Cloudflare Pages Production deployment and business/runtime checks are needed before GREEN. Do not bypass branch protection or confuse source GREEN with real provider, customer or render evidence.

## Next queued
**Build 553 — Staff Mobile Field Regression Evidence**, plus DAIP privacy- and consent-gated social video package candidates (YouTube, Facebook, Instagram, TikTok) as **drafts only** until actual inspected source renders exist.
