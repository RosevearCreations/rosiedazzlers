# Rosie Dazzlers — Cloudflare Observability Setup for Build 262

> **DOCUMENT STATUS — Build 260:** Historical/specialist release evidence retained for cumulative compatibility; current authority is Build 262 `AI_PROJECT_HANDOFF.md` + `MASTER_VALUE_ROADMAP.md`.
**Purpose:** Persist future Pages Functions/Worker invocation logs so CPU-limit events can be grouped by request path instead of diagnosed from aggregate metrics alone.

## Important safety boundary

Rosie's Pages project is currently configured through the Cloudflare dashboard and the source tree does not contain an active Wrangler production configuration. **Do not hand-create and deploy a partial Wrangler file.** Cloudflare warns that once a Pages deployment is made with Wrangler configuration, the file becomes deployment configuration and must match the real bindings/settings.

Do not paste Cloudflare API tokens, Global API Keys, Supabase secrets, passwords or service-role keys into chat, source code, Markdown or screenshots.

## Safe migration path

1. From a trusted local checkout of the Rosie project, authenticate Wrangler to the intended Cloudflare account.
2. Download the existing Pages configuration rather than recreating it by hand:

   ```bash
   npx wrangler pages download config <ROSIE_PAGES_PROJECT_NAME>
   ```

3. Review the generated file against the Cloudflare dashboard. Verify **every** existing binding/environment before making it production-authoritative, especially R2 bindings, environment variables/secrets, compatibility date/flags and Pages build output settings.
4. Add persistent observability only after that comparison is complete. Current Cloudflare Workers configuration supports:

   ```jsonc
   {
     "observability": {
       "enabled": true,
       "logs": {
         "invocation_logs": true,
         "head_sampling_rate": 1
       }
     }
   }
   ```

   Cloudflare also documents the shorter top-level `head_sampling_rate` form for Workers configuration. Use the syntax generated/accepted by the current Wrangler version and verify before deploy.
5. During this CPU incident, use a sampling rate of `1` (100%) for the controlled test window so exceeded-CPU paths are not sampled away. Reduce sampling later if traffic volume/cost warrants it.
6. Deploy Pages + Functions together only after configuration parity is confirmed.
7. Generate a few harmless test requests and wait for Observability ingestion.
8. Open Cloudflare **Observability → Query Builder → Cloudflare Workers → Invocations** and verify invocation data is present.

## What to query after Build 262

Start with a representative test period and group by request pathname. Prioritize:

- outcome / exceeded CPU;
- request pathname;
- HTTP method;
- CPU time;
- wall time;
- response status;
- Ray ID;
- deployment/script version.

Correlate those results with `/admin-runtime-health` exports. The browser report supplies route, status, wall time and Ray ID without creating extra Worker telemetry requests.

## Live logging fallback

For immediate reproduction while persistent logs are not yet available, Cloudflare supports a Pages deployment tail, including:

```bash
npx wrangler pages deployment tail --project-name <ROSIE_PAGES_PROJECT_NAME> --environment production
```

A live tail is useful while reproducing one harmless operation, but it is not a substitute for persistent historical logs.

## Acceptance evidence

Record:

- configuration source reviewed;
- bindings compared to dashboard;
- observability enabled;
- test invocation visible in Query Builder;
- representative monitoring window;
- exceeded-CPU count;
- CPU P50/P75/P95/P99 where available;
- top paths by invocation count;
- top paths by CPU/resource failure;
- Build/deployment identifier.

Build 262 production/test acceptance target: **Exceeded CPU Time Limits = 0** for the representative monitoring period before major feature work resumes.


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
