> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# DAIP Media Operations Center UI

**Version:** 1.0

---

## 1. Purpose

The Media Operations Center is the admin interface for DAIP.

It should allow Rosie Dazzlers to manage uploads, processing, privacy review, generated content, publishing, and archive without needing a separate video editing workflow for every job.

---

## 2. Main Navigation

Suggested admin section:

```text
/admin/media
```

Subsections:

- Dashboard
- Today's Media Jobs
- Uploads
- Processing Queue
- Privacy Review
- Story Review
- Generated Videos
- Galleries
- Captions & SEO
- Publishing Queue
- Archive
- Storage Health
- Analytics

---

## 3. Dashboard Widgets

Dashboard should show:

- media jobs today
- uploads in progress
- jobs waiting for processing
- jobs needing privacy review
- generated assets awaiting approval
- failed processing tasks
- storage used this month
- published assets this month

---

## 4. Media Job Detail Screen

Each job screen should show:

- job code
- customer/vehicle summary
- package/add-ons
- upload status
- original files
- proxy files
- detected scenes
- best clips
- privacy detections
- generated outputs
- captions
- publishing status
- audit history

---

## 5. Upload Screen

Features:

- drag and drop
- mobile upload
- camera source label
- before/process/after label
- resumable upload progress
- failed upload retry
- duplicate detection

---

## 6. Processing Queue Screen

Columns:

- job code
- task type
- file
- status
- progress
- attempts
- error
- retry button

---

## 7. Privacy Review Screen

Must show:

- video frame preview
- detected bounding box
- timestamp
- confidence
- chosen action
- approve mask
- reject false positive
- apply stronger blur
- mark manual review complete

---

## 8. Story Review Screen

Should show a timeline:

```text
Hook → Before → Process → Reveal → After → CTA
```

Admin can:

- reorder clips
- remove clips
- replace clips
- trim start/end
- choose music direction
- choose title style
- approve story

---

## 9. Generated Videos Screen

Group outputs by platform:

- YouTube
- Facebook
- Instagram
- TikTok

For each:

- preview
- duration
- aspect ratio
- caption
- thumbnail
- privacy status
- approve/reject/regenerate

---

## 10. Gallery Review Screen

Show:

- before/after pairs
- image quality score
- alt text
- captions
- service tags
- publish destination

---

## 11. Captions and SEO Screen

Tabs:

- SEO title/meta
- blog draft
- Facebook captions
- Instagram captions
- TikTok captions
- YouTube description
- GBP post
- hashtags

---

## 12. Publishing Queue Screen

Shows approved assets waiting for publishing/export.

Columns:

- platform
- asset title
- status
- scheduled time
- published URL
- error message

---

## 13. Archive Screen

Searchable archive by:

- job code
- vehicle
- town
- service
- tag
- date
- platform
- quality score

Example searches:

- black SUV ceramic water beading
- pet hair removal before after
- Tillsonburg interior shampoo

---

## 14. Accessibility and Mobile

UI must be:

- mobile-friendly
- large tap targets
- progress visible
- easy retry buttons
- colour contrast safe
- usable in driveway/sunlight conditions

---

## 15. Safety Design

Any public publishing action should clearly show:

- privacy status
- customer consent status
- plate/face masking status
- approval history

No asset should be publishable if privacy review is incomplete.

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
