> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# Rosie Dazzlers Build 247 — DAIP Private Large-Media Ingestion

**Build date:** 2026-08-07

## Purpose

Build 247 turns the existing DAIP planning/test foundation into a private Creative Project raw-media ingestion layer for real detailing footage while preserving the standard booking workflow and the historical metadata-only DAIP Test Lab.

## Main implementation

- New protected `/admin-daip-media.html` screen.
- Private R2 bucket binding expected as `DAIP_MEDIA_BUCKET`.
- 32 MiB multipart upload for large MOV/MP4 files.
- Resume based on shared Supabase session/part ETags.
- Idempotent chunk replay when a response is lost after the part was already recorded.
- Completion reconciliation when R2 has the finished object but the DB status update was interrupted.
- Duplicate completed-master protection by project + filename + size.
- Incomplete-upload abort; completed raw originals cannot be deleted from the intake UI.
- Project-scoped raw keys under `projects/<project_uuid>/raw/...`.
- Raw media is private-only and structurally cannot be a public destination.
- Processing-job rows are created for metadata/privacy/content indexing and, for video, proxy/frame/audio/transcript/scene analysis.
- Optional `DAIP_PROCESSING_QUEUE` dispatch; the DB queue remains authoritative if dispatch is unavailable.
- Creative Projects deep-link directly to their DAIP media intake.
- Production Readiness, Startup Command Center, UI Health, Admin Menu and route-copy infrastructure know about DAIP Media Intake.

## Database separation

Build 218 already contains a metadata-only Test Lab table named `daip_media_assets`. Build 247 deliberately does not alter or reuse it. Real Creative Project masters use:

- `daip_project_media_assets`
- `daip_media_upload_sessions`
- `daip_media_upload_parts`
- `daip_media_processing_jobs`

Migration:

`sql/2026-08-07_build247_daip_private_media_ingestion.sql`

## Cloudflare action required

The source cannot create resources inside the owner's Cloudflare account without an authenticated Cloudflare management connection. The user must create a private R2 bucket (recommended `rosie-daip-media`), bind it to the Pages project as `DAIP_MEDIA_BUCKET`, redeploy, and then apply the Build 247 migration. Exact steps are in `DAIP_R2_MEDIA_SETUP_GUIDE.md`.

## Images

The current runtime was audited for deprecated SVG photo fallbacks. No runtime references remain to the old review/generic/add-on SVG photo placeholders. Real raster PNG/JPG fallback assets remain bundled. The vehicle front/rear framing SVGs remain because they are instructional diagrams rather than missing photos.

## SEO / competitive direction

The existing one-H1, concise-title, canonical, description, admin-noindex and local-intent rules remain. Build 247 does not add thin location pages. The private DAIP media layer is intended to become a source of authentic local before/after proof only after consent/privacy review. Current Woodstock-area competitors continue to emphasize recognizable services, mobile convenience, booking and before/after evidence; Rosie should compete with authentic proof and workflow quality rather than keyword repetition.

## Important processing boundary

Build 247 does not yet execute FFmpeg-class processing or generate the final edited YouTube/Reels/TikTok MP4s. It creates the secure raw-media source of truth, upload recovery and durable processing-job contract required for the processor. The next major engineering build should implement the private processing consumer and rendering adapter.

## Acceptance priority

1. Create/bind the private bucket.
2. Apply the migration in staging.
3. Test a harmless JPG.
4. Test a harmless video over 300 MB.
5. Interrupt and resume that video.
6. Verify duplicate protection and immutable completed master behavior.
7. Import the three historical detailing projects one at a time.
8. Only then begin processor/render implementation against those private masters.

<!-- Build 210 documentation sync -->
<!-- Build 211 documentation sync -->
<!-- Build 212 documentation sync -->
<!-- Build 213 documentation sync -->
<!-- Build 214 documentation sync -->

> **Build 237 synchronization (2026-07-28):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->
<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->
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

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
