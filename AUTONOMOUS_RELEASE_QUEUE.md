# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and archived gate/deployment evidence.

## Accepted synchronized checkpoint

**Build 328 — Fleet Maintenance Workbench & Staff Planning** is GREEN and closed at exact SHA `ad2e80bae60f296e6fe190c7b90516ee2b9a52a3`. At active-work start, `dev == main` on that SHA.

## Active — Build 329

Branch: `build329-live-fleet-account-pipeline`

Scope: **Live Fleet Account Intake & Pipeline**.

The public fleet assessment already captures real fleet/workplace requests, but staff follow-up is not operational: the old Fleet mini-CRM is static/report-oriented and the existing lead API is read-only. The active release adds a narrow live staff pipeline over the existing `public_inquiry_leads` table.

### Acceptance checklist

- Add authenticated `/admin-fleet-accounts.html` with live fleet assessment KPIs, filters, request context and follow-up controls.
- Hard-filter pipeline reads and writes to `topic=fleet`.
- Reuse Operations/manage-bookings staff authority; do not create a new permission model.
- Permit staff writes only to `status` and internal `staff_note`.
- Allow `new`, `reviewing`, `contacted`, `quoted`, `closed` and `spam` as staff-managed statuses.
- Keep `converted` read-only; conversion must come from approved booking/quote evidence.
- Reject attempts to edit customer/contact fields, vehicle count/cadence, booking IDs, quote IDs, converted booking IDs, recurring-service state or payment data.
- Keep the public `/fleet` submission contract assessment-only: no quote, appointment, conversion or recurring commitment is created.
- Render customer-supplied media as links only for HTTP/HTTPS URLs.
- Keep quote creation in the existing quote workflow and saved-vehicle planning in `/admin-fleet-maintenance.html`.
- Add release-number-independent durable `Fleet Account Pipeline Authority` for every `build*`, `dev` and `main` push.
- Executable tests must prove write-field restriction, converted-status blocking, message parsing and pipeline metrics.
- No database migration is introduced.
- Exact feature SHA must pass Current Source Gate, Fleet Account Pipeline Authority and Cloudflare feature deployment.
- Fast-forward `dev` only after feature GREEN; require both source authorities plus Cloudflare Development Acceptance.
- Fast-forward `main` only after Development GREEN; require both source authorities plus Cloudflare Production deployment.
- Finish with `dev == main` on the accepted SHA.

## Next sequential scope

After synchronization, choose the next unfinished fleet/maintenance operating-depth gap from current repository evidence before deeper payment/Production-readiness work unless a higher-priority defect is discovered.

## Continuing rule

Never start the next RosieDazzlers release from stale Markdown. Verify `dev`, `main`, the prior accepted SHA and exact-SHA gates first. Source promotion never authorizes a database migration.
