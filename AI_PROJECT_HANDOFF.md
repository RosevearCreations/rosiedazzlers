# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and archived gate/deployment evidence remain the historical record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Last fully accepted/synchronized release: **Build 328 — Fleet Maintenance Workbench & Staff Planning**.
- Exact accepted SHA: `ad2e80bae60f296e6fe190c7b90516ee2b9a52a3`.
- At active-work start, `dev == main` on that exact SHA.
- Active work: **Build 329 — Live Fleet Account Intake & Pipeline**.
- Active branch: `build329-live-fleet-account-pipeline`.
- No database migration is introduced; the scope uses existing `public_inquiry_leads` fields.

## Why this scope is active

The public `/fleet` assessment already records quote-first fleet/workplace requests in `public_inquiry_leads`, and Admin can list those leads. The missing operational layer is a staff follow-up pipeline: the existing Fleet mini-CRM is static/report-oriented and there is no narrow staff write path for live fleet lead status or internal notes.

## Active operating contract

- Public fleet intake remains an assessment only; submission creates no quote, appointment, conversion, recurring commitment or payment.
- The staff API hard-filters `topic=fleet` and uses existing Operations/manage-bookings authorization.
- Staff may write only `status` and `staff_note` for a fleet lead.
- Writable statuses are `new`, `reviewing`, `contacted`, `quoted`, `closed` and `spam`.
- `converted` is read-only here. Conversion must come from the approved booking/quote workflow and cannot be asserted from the fleet workbench.
- Customer identity/contact fields, vehicle count, cadence, booking IDs, quote IDs, converted booking IDs and payment/recurring-service authority cannot be changed here.
- Customer-supplied media links render clickable only when they resolve to HTTP/HTTPS.
- The staff surface is `/admin-fleet-accounts.html`; it includes live KPIs, status filtering, request context and internal follow-up notes.
- The existing `/admin-fleet-maintenance.html` remains the separate saved-vehicle maintenance planner.
- Quoting remains in `/admin-quotes.html`; actual service still goes through approved booking/payment flows.

## Current release procedure

1. Feature exact SHA must pass Current Source Gate, Fleet Account Pipeline Authority and Cloudflare feature deployment.
2. Fast-forward `dev` with `force=false`; require Current Source Gate, Fleet Account Pipeline Authority and Cloudflare Development Acceptance on the identical SHA.
3. Only after Development is GREEN, fast-forward `main` with `force=false`.
4. Require Current Source Gate, Fleet Account Pipeline Authority and Cloudflare Production deployment on that exact SHA.
5. Verify `dev == main`; only then call the release GREEN/closed.
6. Source promotion never authorizes a database migration.

## Durable authorities

- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/fleet-account-pipeline-authority.yml` — live fleet pipeline/write-boundary authority.
- `scripts/fleet_account_pipeline_check.py` and `scripts/fleet_account_pipeline_test.mjs` — static and executable fleet pipeline contracts.
- `scripts/fleet_maintenance_planning_check.py` — saved-vehicle maintenance planning boundary.
- `scripts/maintenance_retention_check.py` — vehicle-aware maintenance/reminder boundary.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- Existing payment, production-readiness, rollback/recovery, booking funnel, responsive UX and SEO authorities remain cumulative.

## Public/SEO and help contracts

Every sitemap public page retains one meaningful H1, valid metadata/canonical/robots/structured data, and responsive behavior. Authenticated admin pages remain `noindex`. Admin work screens must include useful operating help, safe loading/error/empty states and must never expose server secrets.

## Restart point

If interrupted, verify the head of `build329-live-fleet-account-pipeline`, inspect the first failing source/fleet/Cloudflare authority, and continue there. Keep `dev` and `main` on the accepted baseline until the exact feature SHA is fully GREEN. After synchronization, choose the next unfinished fleet/maintenance operating-depth slice before deeper payment/Production work unless a higher-priority defect is found.
