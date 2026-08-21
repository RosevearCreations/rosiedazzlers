> **DOCUMENT STATUS — Build 260:** Release evidence and deployment summary. Current implementation authority is `AI_PROJECT_HANDOFF.md`; current direction is `MASTER_VALUE_ROADMAP.md`.

# Build 260 — Photo Sync Stabilization, Current Startup Evidence, Media Health & DAIP Operator Clarity

**Build date:** 2026-08-18  
**Primary purpose:** remove current operational false alarms and resource-limit failures while making the existing Photo Studio, Startup Command Center, Media Health and DAIP workflow safe and understandable for day-to-day use.

## 1. Photo Studio R2 sync — subrequest-limit repair

The observed `Too many subrequests by single Worker invocation` failure was traced to the prior sync path performing one Supabase PATCH for each refreshed photo after the R2 list. That request pattern does not scale on Cloudflare Workers Free, where an invocation has a limited subrequest budget.

Build 260 changes the sync architecture:

- Photo Studio asks the server to synchronize **one approved R2 prefix at a time**.
- Each Worker invocation reads **one cursor page** from that prefix, with at most **100 approved image objects**.
- If R2 reports `truncated`, the server returns its opaque `next_cursor`; the browser issues a new HTTP request for the next page.
- The current database rows for that page are loaded by the exact R2 keys being synchronized rather than loading an arbitrary first 2,000 media rows.
- New/replaced storage identity fields are written with a **batched PostgREST upsert**, not one PATCH per photo.
- Managed metadata such as alt text, caption, tags, focal point, attribution, decorative status and usage context is preserved during direct-R2 refreshes.
- Normal Photo Studio opening remains database-first and performs no R2 enumeration, preserving the Build 257 resource boundary.

A behavior-level mock covering 130 photos across two R2 pages produced 2 R2 list calls and 4 Supabase calls total across the two HTTP-page operations, with 0 per-photo PATCH calls and preserved managed metadata.

## 2. Photo placement behavior clarified

- One photo can intentionally be assigned to **multiple independent placements**.
- Photo Studio now includes **Reset this location to default**.
- Reset deactivates only the selected target assignment; the authored/default image becomes active again at that location.
- Other placements using the same photo remain unchanged.
- The photo itself remains in the managed library.
- Existing assignment destination labels/checkmarks/Before-After behavior from Builds 255–258 remains intact.

## 3. Startup Command Center — current evidence only

The old Startup UI had version drift: the service worker was newer while Startup/cache/UI-health scripts still identified older builds. Build 260 aligns the current acceptance surface:

- Startup Command Center script: Build 260.
- Cache/build checker: expected Build 260.
- UI health scanner: Build 260.
- Service-worker cache: `rosie-app-v20260818build260`.
- Current packaged fallback: `data/build260_go_live_blockers.json`.
- Current UI route matrix: `data/build260_ui_health_routes.json`.

Historical migration/deployment process rows are **retained for audit** but retired from the current active process catalog. The Evidence tab filters the evidence store to evidence keys referenced by the current catalog. The interface now describes these as **verification records**, not blanket approvals.

## 4. Media Health rebuilt around the current photo system

`/admin-media-health` no longer starts an old fan-out public media scan on page load.

Current behavior:

- reads `app_media_library` and active `app_media_assignments`;
- reports assigned/unassigned images;
- flags missing contextual alt text;
- flags files over 5 MB;
- flags missing recorded dimensions or storage identity;
- reports duplicate candidates by storage signature and similar filename;
- links issue rows directly back into Photo Studio;
- optional **Run delivery sample (12 max)** checks at most 12 exact managed public URLs;
- does not scan R2 during normal health-summary loading.

Legacy media-health APIs remain in source for historical compatibility, but they are no longer the normal operator workflow.

## 5. DAIP pages now explain their distinct jobs

### Creative Projects
`/admin-creative-projects` is the **normal starting point for a fresh DAIP/Creative Project**. Create/select the project first, then move into private DAIP Media Intake for raw photos/videos.

### DAIP Intake Dry Run
`/admin-daip-intake-dry-run` is a **fictional metadata rehearsal**. It exists to test filename/type/size/checksum/rejection/cost-stop validation without uploading real bytes or using customer media. It is not where a real project starts.

### Gate C
`/admin-daip-gate-c` is a **technical/governance/rollback evidence checkpoint**. Saving Gate C evidence does not itself enable upload, processing, publishing or public destinations. It should be revisited when the technical/governance boundary materially changes, not re-approved for every Creative Project.

The normal operational path is:

**Creative Project → private raw-media intake → reviewed story/consent/content-package evidence → approved derivative/public placement only when explicitly allowed.**

## 6. Build 260 database/startup migration

New migration:

`sql/2026-08-18_build260_startup_catalog_health_sync.sql`

It:

- deactivates obsolete historical Startup process rows without deleting their evidence;
- seeds/updates current Build 260 process rows;
- seeds current evidence records;
- starts the Build 260 next-20 roadmap execution cycle.

Apply it **after** `sql/2026-08-13_build259_vehicle_size_review.sql` if Build 259 has not already been applied.

## 7. Markdown sanity/consolidation

The repository intentionally retains historical Markdown because many release guards and audit references depend on it, but current authority is reduced to exactly two files:

1. `AI_PROJECT_HANDOFF.md` — current implementation/deployment/handoff authority.
2. `MASTER_VALUE_ROADMAP.md` — current business/engineering direction.

`STARTUP_GO_LIVE_BLOCKERS.md` is a specialist acceptance runbook and `DOC_INDEX.md` is navigation. Other Markdown files are explicitly marked historical/specialist and must not override the two living authorities.

## 8. Current SEO/competitive direction

The Aug 18 2026 market review still supports Rosie's existing direction: strong local competitors expose dedicated paint-correction/ceramic pages, mobile-service CTAs, clear package/service navigation, vehicle-type coverage, fleet/custom quote paths, gift cards/maintenance concepts and visible work proof. Rosie should continue differentiating by connecting those expected features to transparent condition/vehicle-size uncertainty, owner-editable public proof, evidence/technique galleries, and a coherent booking/quote/customer-confirmation workflow.

Current SEO guardrails remain:

- one meaningful H1 per public/indexable page;
- concise descriptive titles/meta copy;
- authentic local/service content rather than thin town-name swaps;
- contextual alt text for informative images;
- no keyword-stuffed alt text or headings;
- responsive HTML image presentation and fast mobile paths;
- complete/accurate Google Business Profile information and authentic current photos/reviews;
- no promise of first-page ranking.

## 9. Validation completed

Build 260 release validation includes:

- Photo sync behavior mock: cursor continuation, batched writes, 0 PATCH fan-out, metadata preservation.
- Build 184/185/192/195/215 Media Health historical guards retained through compatibility markers without restoring old runtime behavior.
- DAIP Build 216/224/226/228 guards.
- Startup Build 237/239/241/245 guards.
- Photo Builds 253–259 guards.
- Build 260 dedicated release guard.
- one-H1 SEO check.
- Cloudflare Pages Functions static/syntax validation.
- route-copy parity for changed admin pages.

## 10. Important work still requiring acceptance or further engineering

Build 260 makes the current application easier and safer to operate, but it does **not** claim that all production launch work is finished. The most important remaining items are deliberately maintained in the Build 260 current next-20 queue, especially:

- real payment/refund/webhook/notification production acceptance;
- vehicle-size review acceptance after Build 259 SQL;
- inventory posting/reversal acceptance;
- real-device CSS/accessibility acceptance;
- Search Console/Business Profile evidence review;
- restore/rollback rehearsal;
- private DAIP processing consumer, retry/dead-letter and reviewed derivative production path;
- controlled soft launch.

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->

## Historical release compatibility markers

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

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
