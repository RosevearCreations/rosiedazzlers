# Build 262 — Static Worker CPU Source Audit

> **DOCUMENT STATUS — Build 260:** Historical/specialist release evidence retained for cumulative compatibility; current authority is Build 262 `AI_PROJECT_HANDOFF.md` + `MASTER_VALUE_ROADMAP.md`.
This audit is a **source-code heuristic**, not measured Cloudflare CPU. It is packaged so the Runtime & CPU Diagnostics page can identify request handlers that deserve review before production traffic exists.

The machine-readable source is `data/build262_cpu_source_audit.json`; a CSV is exported with the release artifacts.

The audit scores actual Pages Function request handlers using signals such as fetch count, JavaScript loop/array transforms, explicit sorting, JSON operations, source size and large row limits. Library modules are excluded from the route ranking. A high score means **review this route**, not “this route caused the incident.”

Build 262 separately found proven invocation-volume amplifiers in browser code: 30-second Admin Analytics fan-out, 15-second Live Operations polling, 20-second Progress polling, public analytics heartbeat/event fan-out and Photo Studio 5xx retry. Those are corrected independently of this heuristic list.


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
