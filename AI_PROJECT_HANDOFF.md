# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and archived gate/deployment evidence remain the historical record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Last fully accepted/synchronized release: **Build 334 — Durable Completed-Service Vehicle History Sync**.
- Exact accepted SHA: `a5feaa71df1d87581674f93526ae44e2f861d244`.
- At active-work start, `dev == main` on that exact SHA.
- Active work: **Build 335 — Controlled Fleet Lead → Draft Quote Handoff**.
- Active branch: `build335-controlled-fleet-quote-handoff`.
- No database migration is introduced; the live fleet-lead and quote-pipeline tables already contain the required authorities.

## Why this scope is active

The live fleet pipeline safely captures and reviews fleet/workplace inquiries, while the existing quote dashboard owns durable `quote_pipeline_items`. Until now staff had to manually copy a fleet lead into the quote system, and the generic fleet PATCH correctly prohibited quote/conversion writes. This release adds one explicit server-authorized bridge without turning fleet status edits into quote, customer, booking, scheduling or payment authority.

## Active operating contract

- Only authenticated staff with `manage_bookings` may invoke fleet quote handoff.
- The server reloads the requested row from `public_inquiry_leads` with `topic=fleet`; the browser cannot supply customer, quote or booking ownership.
- `converted`, `closed` and `spam` leads cannot create a new draft quote.
- Existing quotes linked by `quote_pipeline_items.lead_id` are reused rather than duplicated.
- More than one existing quote for a lead is treated as ambiguous and fails closed for staff cleanup.
- When no quote exists, the draft quote UUID is deterministically the fleet lead UUID. The quote table primary key therefore prevents concurrent retry duplication without a new schema constraint.
- New handoff quotes start as `draft`, with quoted/accepted amounts at zero and follow-up stage `prepare_quote`. Pricing remains staff-controlled in the Quote dashboard.
- Handoff does not change the fleet lead status. Staff may use `quoted` only after the quote is actually prepared/sent.
- Handoff does not create or mutate a customer profile, booking, appointment, schedule, recurring-service enrollment or payment.
- The Quote dashboard accepts `quote_id` only as a UI selection hint after loading the authorized quote list; it does not create authority from the URL.
- The existing generic fleet pipeline remains limited to writable status + internal staff note.

## Release procedure

1. Feature exact SHA must pass Current Source Gate, Fleet Account Pipeline Authority, Booking Vehicle Identity Authority, Maintenance Retention Follow-up Authority and Cloudflare feature deployment.
2. No schema application is required.
3. Fast-forward `dev` with `force=false`; require exact-SHA source authorities plus Cloudflare Development Acceptance.
4. Only after Development is GREEN, fast-forward `main` with `force=false`.
5. Require source authorities plus Cloudflare Production deployment on that exact SHA.
6. Verify `dev == main`; only then call the release GREEN/closed.

## Durable authorities

- `.github/workflows/fleet-account-pipeline-authority.yml` — fleet intake/follow-up plus controlled draft-quote handoff authority.
- `scripts/fleet_account_pipeline_check.py` — source boundary, no-migration guard and executable fleet tests.
- `scripts/fleet_quote_handoff_test.mjs` — deterministic draft identity, reuse, duplicate ambiguity and blocked-status behavior proof.
- `functions/api/_lib/fleet-quote-handoff.js` — pure handoff eligibility/draft identity rules.
- `functions/api/admin/fleet_quote_handoff.js` — staff-authorized runtime handoff and retry-race recovery.
- `.github/workflows/development-source-gate.yml` and existing booking, maintenance, payment, Production-readiness, rollback/recovery, responsive UX and SEO authorities remain cumulative.

## Public/SEO and help contracts

Every sitemap public page retains one meaningful H1, valid metadata/canonical/robots/structured data, and responsive behavior. Authenticated admin pages remain `noindex`. Admin work screens must include useful operating help, safe loading/error/empty states and must never expose server secrets.

## Restart point

If interrupted during active work, verify `build335-controlled-fleet-quote-handoff` and inspect the first failing fleet/source/Cloudflare authority. Do not make generic fleet status writes create quotes, do not infer/create customer identity from a fleet inquiry, and do not add booking/payment side effects to draft handoff.
