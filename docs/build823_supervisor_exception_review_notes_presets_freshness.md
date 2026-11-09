# Rosie Dazzlers Build 823 — Supervisor Exception Review Notes, Preset Usability & Report Source Freshness

## Scope
Builds on the authenticated supervisor follow-up queue and Build 822 exception views. No new database tables, API endpoints, permission increases, or automated customer actions.

## Shipped
- **Internal review drafts:** A supervisor with a verified staff identity can hold one 8–500-character draft per displayed exception category while the page remains open. Drafts live only in JavaScript memory, never browser storage, API, audit history, report preview, or outgoing customer messages. They are cleared on every source refresh or navigation and disabled when the source is not verified or is expired. These are **not persistent or official notes**; an authorized source-backed notes workflow requires a later separately reviewed feature.
- **Comparison preset renaming:** Rename the selected tab-only, staff-isolated Build 822 preset without changing its comparison mode, filter or review target. Validate 2–40 characters, reject duplicates and control characters, retain the four-preset limit, and preserve the existing safety whitelist.
- **Source freshness:** Report source age is assessed from the authenticated queue load time using the local page clock. Under 5 minutes is recently refreshed; 5–15 minutes warns that the source is only a snapshot; 15 minutes or older refuses aggregate report presentation and draft actions until refresh. Invalid/future timestamps or unavailable authorization are treated as unverified. A refresh control requests fresh authenticated records; no false live telemetry.
- **Accessible UX:** Clear status messages, visible freshness warning and expired states, keyboard-accessible controls, and matching /admin-today and /admin-today/ HTML routes. A lightweight timer updates freshness without rerendering edit forms and disrupting unsaved customer responses.

## Safety boundaries
- No notes persisted to GitHub, Cloudflare, sessionStorage, localStorage, backend, or CSV.
- No automatic issue closure, customer outreach, dispatch, booking or payment change.
- Source-dependent ownership and supervisor review filters still fail closed.
- Validated staff identity is required; user-facing draft text is rendered as inert textContent.
- Reports remain aggregate-only and bounded by the current authorized newest 150 records.

## Verification
- `node scripts/build823_supervisor_exception_review_test.mjs`
- `bash scripts/current_booking_wizard_regression.sh`
- `python3 scripts/release_check.py`
- `python3 scripts/build413_workflow_efficiency_accessibility_check.py`
- `node --check assets/admin-worksite-followups-v814.mjs`
- Promotion: protected source PR into `dev`, protected `dev`→`main` PR, and exact `main` SHA Cloudflare Production acceptance before claiming GREEN.
