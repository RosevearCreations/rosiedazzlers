# DAIP Database Architecture

**Version:** 1.0

---

## 1. Purpose

The DAIP database stores all metadata needed to track media from capture through publishing.

Original video files may live in Google Drive or Cloudflare R2, but all searchable metadata, processing status, AI scores, privacy detections, outputs, approvals, and analytics belong in PostgreSQL/Supabase.

---

## 2. Naming Convention

Suggested table prefix:

```text
daip_
```

Examples:

```text
daip_media_jobs
daip_media_assets
daip_scenes
daip_privacy_detections
daip_exports
```

---

## 3. Core Tables

### daip_media_jobs

Represents one vehicle/detailing media project.

Key fields:

- id UUID primary key
- job_code text unique, example `RD-20260715-001`
- booking_id nullable FK
- customer_id nullable FK
- vehicle_year
- vehicle_make
- vehicle_model
- vehicle_colour
- package_name
- add_ons jsonb
- job_date date
- sequence_number int
- status text
- created_by
- assigned_technician_id
- google_drive_folder_id
- r2_prefix
- created_at
- updated_at

---

### daip_media_assets

Represents each uploaded file or generated file.

Fields:

- id UUID
- media_job_id FK
- asset_type text: original_video, proxy_video, image, thumbnail, audio, export, document
- source_type text: upload, generated, imported, google_drive, r2
- original_filename
- mime_type
- file_size_bytes
- duration_seconds
- width
- height
- frame_rate
- storage_provider
- storage_key
- google_drive_file_id
- public_url nullable
- privacy_status
- processing_status
- created_at
- updated_at

---

### daip_processing_jobs

Tracks background tasks.

Fields:

- id UUID
- media_job_id FK
- media_asset_id nullable FK
- task_type text
- status text
- priority int
- attempts int
- max_attempts int
- error_message text
- started_at
- completed_at
- created_at

Task types:

- generate_proxy
- extract_audio
- extract_frames
- detect_scenes
- detect_objects
- detect_privacy
- apply_privacy_mask
- generate_contact_sheet
- score_scene
- generate_reel
- generate_youtube_video
- generate_captions
- generate_blog

---

### daip_scenes

Represents detected video scenes.

Fields:

- id UUID
- media_job_id FK
- media_asset_id FK
- scene_number int
- start_time_seconds numeric
- end_time_seconds numeric
- duration_seconds numeric
- thumbnail_asset_id nullable FK
- quality_score numeric
- story_score numeric
- marketing_score numeric
- privacy_score numeric
- suggested_use text
- reject_reason text nullable
- created_at

---

### daip_scene_tags

Stores tags for scenes.

Fields:

- id UUID
- scene_id FK
- tag text
- confidence numeric
- source text: ai, human, system

Example tags:

- exterior_before
- interior_before
- foam_cannon
- vacuuming
- extraction
- wheel_cleaning
- water_beading
- beauty_shot
- after_reveal

---

### daip_frame_samples

Stores representative frame metadata.

Fields:

- id UUID
- scene_id FK
- media_asset_id FK
- timestamp_seconds numeric
- frame_asset_id FK
- sharpness_score numeric
- brightness_score numeric
- composition_score numeric
- contains_plate boolean
- contains_face boolean
- created_at

---

### daip_privacy_detections

Stores detected privacy risks.

Fields:

- id UUID
- media_job_id FK
- media_asset_id FK
- scene_id nullable FK
- detection_type text: license_plate, face, child, house_number, document, vin, phone_screen
- confidence numeric
- start_time_seconds numeric nullable
- end_time_seconds numeric nullable
- bounding_box jsonb
- action text: blur, black_box, pixelate, manual_review
- status text: detected, masked, reviewed, approved, rejected
- created_at

---

### daip_exports

Represents generated deliverables.

Fields:

- id UUID
- media_job_id FK
- export_type text: youtube, facebook, instagram_reel, tiktok, website_gallery, gbp_photo_set, blog, thumbnail, caption_package
- title
- description
- platform
- aspect_ratio
- duration_seconds
- asset_id FK nullable
- status text: draft, review, approved, rejected, published
- publish_url nullable
- created_at
- approved_at
- published_at

---

### daip_content_drafts

Stores generated text content.

Fields:

- id UUID
- media_job_id FK
- content_type text: caption, blog, seo_title, meta_description, hashtags, youtube_description, gbp_post
- platform nullable
- title
- body text
- status text
- approved_by
- approved_at
- created_at

---

### daip_publish_queue

Tracks platform publishing.

Fields:

- id UUID
- export_id FK
- platform
- status
- scheduled_at nullable
- published_at nullable
- external_post_id nullable
- error_message nullable
- created_at

---

### daip_media_analytics

Tracks performance after publishing.

Fields:

- id UUID
- export_id FK
- platform
- views
- likes
- comments
- shares
- clicks
- bookings_attributed
- revenue_attributed
- collected_at

---

## 4. Audit Requirements

Every important action should be auditable:

- upload
- delete
- approve
- reject
- publish
- reprocess
- privacy override
- caption edit
- export generation

Suggested table:

```text
daip_audit_log
```

Fields:

- id UUID
- actor_user_id
- media_job_id
- entity_type
- entity_id
- action
- before jsonb
- after jsonb
- created_at

---

## 5. Indexing Direction

Recommended indexes:

- media_job_id on all child tables
- job_code unique
- status indexes for queues
- created_at indexes for dashboards
- tag indexes on daip_scene_tags(tag)
- export platform/status index
- privacy detection status index

---

## 6. Security Direction

Row-level security should follow existing Rosie Dazzlers roles.

- Admin: full DAIP access.
- Senior Detailer: assigned job media and review assistance.
- Detailer: upload/capture for assigned jobs.
- Customer: future private proof gallery only.

Private fields like license plate, VIN, GPS, customer name, and raw private media should never be exposed publicly.

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
