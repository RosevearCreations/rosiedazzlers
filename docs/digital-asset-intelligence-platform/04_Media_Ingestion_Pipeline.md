> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# DAIP Media Ingestion Pipeline

**Version:** 1.0

---

## 1. Purpose

The ingestion pipeline ensures every detailing job starts with organized, complete, story-ready media.

The goal is not just to accept files. The goal is to make sure the right media exists to create a strong transformation story.

---

## 2. Start New Media Job

When a booking or manual detail job starts, the system should create:

1. Media job database record.
2. Unique job code.
3. Google Drive folder.
4. R2 storage prefix.
5. Upload session.
6. Required shot checklist.
7. Processing queue placeholder.

---

## 3. Required Capture Checklist

The technician should be guided to capture the following:

### Exterior Before

- Front view
- Rear view
- Driver side
- Passenger side
- Wheels/tires
- Bug/tar areas
- Salt/dirt buildup
- Headlights if relevant

### Interior Before

- Driver seat
- Passenger seat
- Rear seats
- Carpets
- Floor mats
- Cupholders
- Dash/console
- Door panels
- Pet hair/problem areas

### Process Clips

- Foam cannon
- Pressure rinse
- Wheel cleaning
- Vacuuming
- Brushing
- Steam cleaning
- Shampoo extraction
- Clay bar
- Polish
- Ceramic/wax/sealant
- Trim restoration
- Glass cleaning

### After Proof

- Same exterior angles as before
- Same interior angles as before
- Close-up proof
- Final walk-around
- Reflection shot
- Water beading if applicable

---

## 4. Capture Quality Checks

The app should warn the user when a required shot is likely unusable:

- too blurry
- too dark
- too bright
- finger covering lens
- no vehicle visible
- too short
- wrong orientation for requested asset
- duplicate of previous shot

---

## 5. Upload Requirements

Upload system should support:

- Large files.
- Resumable uploads.
- Mobile weak connection recovery.
- Background retry.
- Upload progress.
- Pause/resume.
- File checksum validation.
- Duplicate detection.

---

## 6. Ingestion Validation

After upload, each asset should be validated:

- file exists
- file readable
- mime type valid
- duration detected
- width/height detected
- file size recorded
- checksum stored
- storage key saved
- linked to media job

---

## 7. Proxy Generation

After validation, queue proxy generation.

Recommended FFmpeg outputs:

- 1080p MP4 H.264
- 720p MP4 H.264
- 480p MP4 H.264
- audio-only MP3/WAV
- thumbnail every 5–10 seconds
- contact sheet per file

---

## 8. Contact Sheets

Contact sheets help humans and AI scan footage quickly.

Example:

- One image grid per raw video.
- Frame every 10 seconds.
- Timestamp burned into each frame.
- Stored in `contact_sheets/`.

---

## 9. Processing Queue

Each uploaded video creates tasks:

1. metadata extraction
2. proxy generation
3. thumbnail extraction
4. scene detection
5. quality scoring
6. object detection
7. privacy detection
8. story tagging

Tasks should run asynchronously.

---

## 10. Failure Handling

Failures should never break the entire job.

If one file fails:

- mark that file failed
- continue with other files
- show failure in admin UI
- allow retry
- store error message

---

## 11. Manual Override

Admins should be able to:

- mark media as before/process/after manually
- exclude clips
- force reprocess
- upload missing media
- merge media jobs
- split accidental mixed jobs

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
