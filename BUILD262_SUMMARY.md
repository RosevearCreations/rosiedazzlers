# Build 262 — CPU Self-Diagnostics & Stabilization

> **DOCUMENT STATUS — Build 260:** Historical/specialist release evidence retained for cumulative compatibility; current authority is Build 262 `AI_PROJECT_HANDOFF.md` + `MASTER_VALUE_ROADMAP.md`.
**Build date:** 2026-08-20  
**Priority:** P0 reliability incident response  
**Scope:** Cloudflare Worker CPU stabilization, invocation-volume reduction, browser-local diagnostics, analytics batching/rollups, cache/runtime coherence. No major business feature expansion.

## Why this release exists

Cloudflare reported a severe Rosie Dazzlers Worker CPU incident. The supplied incident baseline records 7,592 observed invocations, 5,348 successes and 2,244 CPU-limit terminations (~29.6% failure rate), with no corresponding memory, internal-error or script-exception spike. The reported CPU distribution was approximately P50 10 ms, P75 11.6 ms, P99 109.6 ms and P99.9 156 ms.

Rosie is still in test mode. **No live-client or DAIP workload** has been used; there are no real customer/DAIP volumes that can explain the incident. Source inspection therefore treated application-generated invocation volume and hot request paths as the immediate priority rather than blaming customer load.

## Concrete application-side amplifiers found

1. **Admin Analytics polled every 30 seconds.** Each refresh launched six API requests. One tab could therefore create 12 Worker invocations per minute indefinitely.
2. **Live Operations auto-refreshed multiple APIs every 15 seconds** after a booking was loaded and also fetched the full bookings list during each refresh.
3. **Customer Progress polled every 20 seconds**, enough for 4,320 API invocations/day from one continuously open page.
4. **Public analytics produced frequent individual telemetry requests**, including a heartbeat in earlier builds.
5. **Photo Studio retried selected 5xx responses automatically**, which can amplify an exceeded-CPU request and can repeat a write whose final response was terminated after partial state was committed.
6. **Analytics rollup refresh could load/aggregate very large raw event sets inside the Worker.** This is structurally incompatible with a 10 ms Free-plan CPU budget.
7. **Shared API response helpers pretty-printed JSON.** More than 50 Functions paths were paying unnecessary JSON serialization/payload cost.
8. **App settings could be loaded through repeated key-by-key requests** in common paths rather than one bounded query.

These findings do not prove that one specific route caused all 2,244 historical failures because persistent Cloudflare invocation logs were not enabled for the incident window. They are concrete source-level waste and amplification paths that should be removed regardless.

## Build 262 fixes

### Invocation volume
- Admin Analytics loads once and refreshes only on explicit owner action or filter change. The 30-second background poll is removed.
- Live Operations no longer starts auto-refresh automatically. Optional refresh is 60 seconds or slower, pauses while the document is hidden, and no longer retrieves the complete booking list on every cycle.
- Customer Progress refresh is visibility-aware and reduced from 20 seconds to 120 seconds.
- Public analytics has no heartbeat interval.

### Analytics CPU
- Browser analytics queues events and sends a maximum of 12 per request.
- Telemetry is fail-open and expendable; 429/5xx/network failure opens a circuit rather than replaying the failed batch.
- `/api/analytics/ingest` accepts bounded batches, caps request/body/payload size, performs one combined settings read and one batched insert.
- Admin Analytics normal overview is rollup-first; raw recent activity is opt-in and tightly bounded.
- Raw fallback limits are substantially reduced.
- Build 262 adds `refresh_site_activity_rollups_cpu_safe()` so heavy rollup computation executes in Supabase/PostgreSQL rather than in a Cloudflare Worker.

### Retry safety
- Photo Studio no longer auto-retries assignment/list/sync 5xx responses. A 5xx is recorded and surfaced; staff must refresh/review state before deliberately retrying.
- This follows the incident rule that CPU termination can occur after an upstream write has already succeeded.

### Common-path CPU reductions
- Shared app settings can be read for several allow-listed keys in one PostgREST request.
- Shared API JSON helpers and routine Functions responses use compact JSON instead of pretty-printing every response.
- Static Pages routing remains constrained by `_routes.json` so only `/api/*` invokes Pages Functions.

## Rosie self-diagnostics

New protected page:

`/admin-runtime-health`

Every protected admin page now wraps same-origin `/api/*` browser calls and records a ring of at most 300 safe diagnostic rows in browser `localStorage`:

- timestamp
- admin page pathname
- API pathname only (query string is not stored)
- HTTP method
- status
- browser wall duration
- success/failure class
- Cloudflare Ray ID when exposed
- build number

It does **not** store request bodies, response bodies, customer fields, passwords, authentication tokens or payment data. The recorder creates no diagnostic Worker request.

Runtime & CPU Diagnostics provides:
- route call/failure counts;
- recent 5xx/network failures;
- average/max browser wall time by route;
- Ray IDs;
- CSV export;
- complete JSON export;
- packaged source-risk audit of actual request handlers;
- the Cloudflare CPU incident baseline.

Browser wall time is not Cloudflare CPU time. The local report identifies routes and repetitions; Cloudflare Observability remains authoritative for actual CPU.

## Persistent Cloudflare logs

Build 262 deliberately does **not** invent a `wrangler.toml`/`wrangler.jsonc`. The Pages project is currently dashboard-configured and changing to a Wrangler configuration makes that file a deployment source of truth. Follow `CLOUDFLARE_OBSERVABILITY_BUILD262.md`: download the existing Pages configuration first, verify every binding, then deliberately enable observability and redeploy.

## Database action required

Apply:

`sql/2026-08-20_build262_cpu_safe_analytics_rollups.sql`

This is required only for the CPU-safe **Refresh rollups** action. The other browser/runtime stabilization changes can deploy independently, but applying the migration before testing Admin Analytics is recommended.

## Acceptance target

Build 262 is not accepted merely because it deploys.

During a representative test period:

- Exceeded CPU Time Limits: **0**
- Script Threw Exception: **0**
- Exceeded Memory: **0**
- no 15/20/30-second API polling loops on routine screens;
- no analytics retry storm;
- no automatic replay of Photo Studio 5xx writes;
- no regression to booking/payment/inventory/accounting/permissions;
- no public SEO/mobile/CSS regression.

If a failure occurs, export `/admin-runtime-health` JSON/CSV before clearing local diagnostics and correlate route/Ray ID with Cloudflare invocation data once Workers Logs are enabled.

## What remains

Build 262 reduces and instruments known source-side risks but cannot truthfully name the historical #1 exceeded-CPU path because Cloudflare did not retain queryable invocation logs for that window. After deployment, enable persistent Workers Logs safely, monitor a representative period and use the new local diagnostics plus Cloudflare Query Builder to identify any remaining hot route before resuming major feature work.


<!-- BUILD257_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD258_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD259_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD260_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->

<!-- Build 210 documentation sync -->

<!-- Build 211 documentation sync -->
<!-- Build 212 documentation sync -->

<!-- Historical release-compatibility markers retained; no runtime behavior implied.
BUILD239_SYNC
BUILD240_SYNC
BUILD241_SYNC
BUILD247_SYNC
BUILD248_SYNC
BUILD249_SYNC
BUILD250_SYNC
BUILD251_SYNC
BUILD252_SYNC
BUILD253_SYNC
BUILD254_SYNC
BUILD255_SYNC
BUILD256_SYNC
Build 172 documentation sync
Build 173 documentation sync
Build 174 documentation sync
Build 177 documentation sync
Build 178 documentation sync
Build 179 documentation sync
Build 181 documentation sync
Build 182 documentation sync
Build 183 documentation sync
Build 188 documentation sync
Build 192 documentation sync
Build 196 documentation sync
Build 197 documentation sync
Build 198 documentation sync
Build 213 documentation sync
Build 214 documentation sync
-->

> **Build 237 synchronization (2026-07-28):** Historical release compatibility marker; Build 262 authorities remain AI_PROJECT_HANDOFF.md and MASTER_VALUE_ROADMAP.md.
> **Build 238 synchronization (2026-07-30):** Historical release compatibility marker; Build 262 authorities remain AI_PROJECT_HANDOFF.md and MASTER_VALUE_ROADMAP.md.

<!-- Exact historical synchronization lines retained for cumulative release guards. -->
<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->
<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->
<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->
<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->
<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->
<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->
<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Specialist runbook: STARTUP_GO_LIVE_BLOCKERS.md | Inventory recovery: reviewed existing-row Amazon refresh -->
<!-- BUILD250_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public services clarity + rosie-assets/CarPhotos runtime manifest -->
<!-- BUILD251_SYNC: 2026-08-11 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Gate C dark-theme readability + approved rosie-assets/CarPhotos context -->
<!-- BUILD252_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public packages/landing_pages/CarPhotos R2 assignment -->
<!-- BUILD253_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Photo Studio: /admin-photo-studio.html | Public manifest: /api/public_website_images | Migration: sql/2026-08-12_build253_photo_management_studio.sql -->
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images protected; explicit Photo Studio override only; automatic R2 matching fallback-only; Photo Studio reflow hotfix. -->
<!-- BUILD255_SYNC: 2026-08-12 | Photo Studio click-to-edit drawer + explicit grouped website target dropdown; no automatic image reassignment. -->
<!-- BUILD256_SYNC: 2026-08-12 | Photo assignment labels + checked occupied targets + explicit Before/After pairs; no automatic image reassignment. -->
<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->
<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->
<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->
