> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# DAIP Test Mode Process — Rosie Dazzlers

**Status:** Build 218 implemented in internal test mode only.  
**Purpose:** Let us prove the DAIP safety and review process before handling real customer media or deploying storage/worker infrastructure.

## What Build 218 proves

Build 218 changes DAIP from planning papers into a controlled, database-backed test process. The registry deliberately has no foreign key or lookup into customer booking records:

1. An authorized administrator creates one opaque DAIP-only test reference, such as `RD-TEST-BOOKING-DEMO-01`; it is not linked to the `bookings` table.
2. The administrator creates a test-only media job with a unique `RD-TEST-YYYYMMDD-###` code.
3. The job is hard-locked to `internal_test`, `metadata_only`, no storage, no worker, no public export, and no automatic publishing.
4. A harmless sample photo/video **metadata record** is registered. No bytes are uploaded and no URL/path/key/Drive ID is accepted.
5. An internal privacy result is recorded: review required, internal-only cleared, or blocked private.
6. The record can be archived, while the safe audit history remains.
7. Three guided acceptance tests record whether the safeguards worked.

## What Build 218 does not do

This build deliberately has **no** original upload, R2 DAIP bucket, signed URL, Google Drive synchronization, proxy/contact-sheet worker, FFmpeg, AI, vision, transcription, clip export, gallery import, customer access, social handoff, or publication action.

“Internal-only cleared” means only that the harmless test record passed an internal test review. It is never marketing consent, public approval, gallery permission, or platform publishing permission.

## Exact operating procedure

### Before opening the Test Lab

- Confirm Build 214 RLS containment and Security Posture pass.
- Apply `sql/2026-07-02_build218_daip_test_mode_foundation.sql` in the development/staging Supabase project.
- Deploy the Build 218 site and Functions together.
- Choose one opaque DAIP-only reference such as `RD-TEST-BOOKING-DEMO-01`. Do not use a booking UUID or any customer job.
- Prepare a fictional filename and optional harmless technical metadata. Do not upload a file.

### In `/admin-daip.html`

1. Confirm the summary says `internal_test` and `0` executable tasks.
2. Enter only the opaque DAIP-only test reference; do not enter a booking UUID, customer name, address, vehicle, VIN, phone number, or note.
3. Use a clearly safe label such as `Internal DAIP test — harmless sample set A`.
4. Type `INTERNAL TEST ONLY` and check all three safety confirmations.
5. Create the test job and confirm an `RD-TEST-...` code appears.
6. Register a metadata-only test asset. It must have a safe filename such as `internal-test-before-01.jpg`; no URL, bucket, object key, path, signed link, or Drive reference is accepted.
7. Save `internal_only_cleared` or `blocked_private` as an internal privacy result.
8. Confirm the asset still says `not uploaded` and `public blocked`.
9. Open Gallery, Social Queue, and a test progress route in a private browser. Confirm the DAIP record is not present.
10. Archive the test job after the test. The audit remains but no further asset record can be added.

## Test outcomes and stop rules

Record outcomes in `/admin-test-centre.html` using:

- **DAIP Test Lab safety preflight**
- **DAIP internal test job and metadata registry**
- **DAIP internal privacy review and export block**

Stop the DAIP path immediately if any real/customer data is entered, any public/customer/gallery/social route shows a DAIP record, any worker/storage/export flag is enabled, or the RLS Security Posture shows browser access for a DAIP table.

## Promotion boundary

Build 218 is **DAIP-1A: internal test registry**, not DAIP production. The next phase requires every DAIP-0 owner decision, successful Build 218 guided results, a reviewed worker/storage design, fixed cost ceiling, retention rules, consent wording, and a separate migration that introduces only the smallest approved storage/worker capability.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

Build 210 documentation sync
Build 211 documentation sync
Build 212 documentation sync
Build 213 documentation sync
Build 214 documentation sync
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

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
