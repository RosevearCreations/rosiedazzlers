# DAIP Project Charter

**Subsystem:** Rosie Dazzlers Digital Asset Intelligence Platform  
**Version:** 1.0  
**Status:** Planned  

---

## 1. Mission

The mission of DAIP is to turn every completed Rosie Dazzlers detailing job into a complete media, marketing, SEO, and proof-of-work package with minimal manual editing.

The technician should focus on detailing the vehicle and capturing the required footage. The application should organize, analyze, protect, edit, package, and prepare the media for approval.

---

## 2. Business Problem

Rosie Dazzlers may record 10–15 video files per detailing job, with each file around 2 GB. Uploading those directly into a chat-based workflow is not practical. Manually sorting 20–30 GB of media per job is also too time consuming.

Without automation:

- Good footage gets buried.
- Bad footage wastes editing time.
- Before/after proof may be missed.
- License plates or private customer details may be accidentally shown.
- Social media opportunities are lost.
- Website galleries do not stay current.
- Google Business Profile content may not be updated often enough.
- SEO value from real local jobs is underused.

DAIP solves this by processing media inside the Rosie Dazzlers system before AI editorial decisions are made.

---

## 3. Business Goals

DAIP should help Rosie Dazzlers:

1. Save time editing video.
2. Create more frequent local marketing content.
3. Improve website galleries.
4. Improve Google Business Profile freshness.
5. Build trust with before/after proof.
6. Protect customer privacy.
7. Create reusable video and image assets.
8. Support future paid advertising campaigns.
9. Improve local SEO through job-based content.
10. Build a searchable media archive.

---

## 4. Required Output Package

Each completed detailing job should produce a review-ready content package containing:

| Asset Type | Required Quantity | Notes |
|---|---:|---|
| YouTube video | 1 | Long-form, cinematic, 2–8 minutes depending on footage |
| Facebook videos | 3 | Different hooks or service angles |
| Instagram Reels | 5 | Vertical, fast-paced, hook-first |
| TikTok videos | 5 | Vertical, energetic, quick transformation format |
| Before/after images | 10–30 | Matched angles when possible |
| Website gallery | 1 gallery package | Captions, alt text, service tags |
| Google Business Profile photos | 5–15 | Strong local proof and service photos |
| SEO metadata | 1 package | Title, meta, alt text, schema, internal-link suggestions |
| Blog article | 1 | Local job story / service highlight |
| Thumbnail candidates | 3–5 | Ranked by likely click appeal |
| Captions | Platform-specific | Facebook, Instagram, TikTok, YouTube, GBP |

---

## 5. Out of Scope for Version 1.0

The following are future possibilities but not required for first implementation:

- Fully automatic public publishing without approval.
- Advanced generative video creation.
- Paid ads automation.
- Customer-facing live video portal.
- Drone-specific cinematic editing.
- 360-degree interactive tours.
- Training model from scratch.

---

## 6. Success Criteria

Version 1.0 is successful when the system can:

1. Create a unique folder/database record for each vehicle.
2. Accept multiple large video uploads per job.
3. Generate proxy videos automatically.
4. Extract thumbnails and scene contact sheets.
5. Detect likely bad footage.
6. Detect likely good footage.
7. Detect license plate regions and apply blur/black box.
8. Create a draft story timeline.
9. Suggest at least five short-form clips.
10. Export review-ready deliverables.
11. Keep all outputs tied to the original job.
12. Require admin approval before publishing.

---

## 7. Risk Areas

| Risk | Mitigation |
|---|---|
| Large video files are expensive to process | Use background queues, proxies, and staged processing |
| License plate detection may miss frames | Add confidence scoring and manual review queue |
| AI may choose weak clips | Use human approval and engagement feedback |
| Storage can grow quickly | Add retention policies, archive tiers, and storage dashboards |
| Uploads may fail on mobile | Use resumable uploads and retry logic |
| Privacy-sensitive data may appear in reflections | Add manual review and optional face/house/document detection |

---

## 8. Human Review Requirement

DAIP should automate preparation, not final judgment.

No generated asset should publish publicly until approved by an authorized admin.

Review screens must allow:

- Approve
- Reject
- Trim
- Regenerate
- Re-run privacy detection
- Add/remove caption text
- Mark as private
- Publish/export

---

## 9. Strategic Value

DAIP can become a major Rosie Dazzlers competitive advantage.

Most local detailing businesses post occasional before/after photos manually. DAIP would allow Rosie Dazzlers to turn every job into a structured, polished, privacy-safe content package for multiple platforms.

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
