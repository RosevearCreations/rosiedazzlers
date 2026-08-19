# Build 261 — Admin Runtime Reliability, DAIP Test UX & Photo Assignment Audit

> **DOCUMENT STATUS — Build 260:** Historical/specialist release evidence retained for cumulative compatibility; current authority is Build 261 AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md.

**Build date:** 2026-08-19

## Why this build exists

Build 261 responds to two live admin failures:

1. `/api/admin/daip_test_job_create` returned HTTP 400 while creating a harmless DAIP test job.
2. During Photo Studio work, `/api/admin/photo_assignment_save` and repeated `/api/analytics/ingest` calls returned HTTP 503 at the same time that `site.css` and `manifest.webmanifest` also failed.

The 503 pattern is treated as a transient Pages/Workers/runtime availability event rather than evidence that multi-placement is unsupported. Build 261 reduces avoidable request load, improves static-asset resilience, and makes assignment/report recovery explicit.

## Photo Studio

- One managed photo may still be assigned to multiple independent website placement targets.
- Resetting one target removes only that explicit Photo Studio override and restores that location's authored/default image; all other placements remain.
- `/api/admin/photo_assignment_save` no longer performs a two-query schema probe before every assignment write. After staff authentication it performs the direct idempotent assignment upsert/reset and converts genuine missing-schema errors into the existing Build 253 migration message.
- Photo Studio retries one transient 502/503/504 for the idempotent library list, bounded sync page, and assignment-save operations. A persistent 503 reports that confirmation was not received and instructs staff to refresh before retrying.
- New live **Download unassigned placements CSV** and **Print unassigned placements** controls derive the current report from the target registry plus active assignment rows already loaded from the database.
- The report means “no manual Photo Studio override”; a location may still show an authored/default or automatic fallback image.
- Photo Studio stats now distinguish photos from placement targets: total known placement slots, active manual placements, and locations still needing a deliberate manual image.

## Analytics and protected admin traffic

- Public analytics no longer loads on `/admin*`, `/client*`, or `/detailer*` screens, or on protected account/payment flows where public engagement tracking is not useful.
- Public analytics now trips a client-side circuit breaker after a 429 or 5xx and suppresses repeated calls for a bounded backoff period.
- Public heartbeat frequency is reduced from 30 seconds to 120 seconds.
- This prevents a temporary Cloudflare/runtime problem from producing repeated analytics failures while staff are trying to recover an admin operation.

## Static/PWA resilience

- Added an explicit Pages `_routes.json` with `include: ["/api/*"]`, so ordinary HTML/CSS/JS/manifest/static asset requests do not invoke Pages Functions.
- The public web manifest is no longer injected on protected admin/client/detailer pages.
- Service worker cache identity is `rosie-app-v20260819build261`.
- For same-origin non-API GET requests, a network 5xx now falls back to an existing cached copy when available, including `site.css` and `manifest.webmanifest`.
- API writes never use a cached response.

## DAIP Test Lab

The safety boundary remains the same, but the 400-prone entry form is easier to use correctly:

- the required phrase `INTERNAL TEST ONLY` is prefilled and read-only;
- a **Generate safe test reference** button creates a valid `RD-TEST-BOOKING-DEMO-...` reference;
- the browser validates the safe label and all three acknowledgements before calling the API;
- the API normalizes harmless case/whitespace differences in the locked phrase and returns field-specific 400 codes when validation fails;
- no real booking UUID, customer data, storage upload, processor execution, or public export is added by this change.

## Cache/startup coherence

- Startup Command Center runtime stamp: Build 261.
- Cache Health expected runtime asset: Build 261.
- UI Health scanner runtime stamp/data copy: Build 261.
- Service worker cache: Build 261.
- The current operational Startup catalog remains the Build 260 catalog because Build 261 changes reliability/runtime behavior rather than adding a new launch-policy catalog.

## Printable image placement audit

- Photo Studio now generates the **live** unassigned-only CSV/print view from current active assignment rows after deployment.
- The release package also includes a 617-row master placement checklist (CSV + printable PDF) for source-level planning.
- The master checklist is not presented as live assignment state because current Supabase assignment rows are not stored in the source ZIP.

## Database

**No new SQL migration is required for Build 261.**

Build 253 photo-management tables, Build 218 DAIP test-mode tables, Build 259 vehicle-size review, and Build 260 startup/catalog migrations remain applicable as previously documented.

## Important deployment check

If 503 responses affect both APIs and ordinary static files at the same moment after Build 261, review Cloudflare Pages **Functions Metrics / Invocation Statuses** for that timestamp. Build 261 reduces avoidable request pressure and provides cached static fallback, but an actual platform/runtime outage cannot be repaired entirely in browser code.

## Documentation authority

`AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md` remain the two living planning authorities. This summary is release evidence, not a third roadmap.

<!-- BUILD261_SYNC: 2026-08-19 | Admin analytics isolation; transient 503 resilience; DAIP test-job UX; multi-placement/reset retained; live printable unassigned placement audit. -->


## Historical release compatibility markers

<!-- BUILD260_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD259_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD258_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD257_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD252_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD253_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD254_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD255_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD256_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD247_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD248_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD249_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD250_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD251_SYNC: retained for cumulative release compatibility. -->
<!-- Build 210 documentation sync -->
<!-- Build 211 documentation sync -->
<!-- Build 212 documentation sync -->
<!-- Build 213 documentation sync -->
<!-- Build 214 documentation sync -->
> **Build 237 synchronization (2026-07-28):** Compatibility/history marker retained; current authority remains the living handoff and roadmap.
> **Build 238 synchronization (2026-07-30):** Compatibility/history marker retained; current authority remains the living handoff and roadmap.
<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
<!-- BUILD240_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->
<!-- Build 246 synchronization: historical compatibility marker retained. -->
