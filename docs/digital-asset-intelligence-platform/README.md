# DAIP Documentation — Build 225 addition

Read this sequence before proposing technical work:

1. `13_DAIP_Test_Mode_Process.md`
2. `11_DAIP_Decision_Register.md`
3. `15_DAIP_Governance_Workspace_Process.md`
4. `16_DAIP_Phase_1_Readiness_Packet.md`
5. `17_DAIP_Phase_1_Readiness_and_Design_Review.md`
6. `18_DAIP_Private_MVP_Design_Blueprint_Review.md`
7. `19_DAIP_Gate_C_Technical_Review_and_Rollback_Acceptance.md`
8. `20_DAIP_External_Service_Connection_Boundary.md`

Build 225 has not enabled DAIP technical capability. It clarifies that social/analytics Cloudflare Secrets are not DAIP storage or provider configuration. Gate C remains held.

# Rosie Dazzlers Digital Asset Intelligence Platform (DAIP)

**Version:** 1.0  
**Status:** Architecture / Planning  
**Subsystem Type:** Media operations, AI production studio, digital asset management, privacy processing, and marketing automation  
**Primary Goal:** Turn one completed detailing job into a complete set of marketing, customer proof, SEO, gallery, and social media assets.


> **Current operational status — read this first:** The document sections below describe the long-term DAIP vision. They are not a statement that storage, uploads, workers, AI, public assets, customer media, export, or publishing are enabled today. Current active DAIP work is Build 218 metadata-only internal testing, Build 219 owner-decision governance, Build 220 readiness preparation, and Build 222 written-design-review readiness only.
>
> **Current operating order:** `AI_PROJECT_HANDOFF.md` → `MASTER_VALUE_ROADMAP.md` → `13_DAIP_Test_Mode_Process.md` → `11_DAIP_Decision_Register.md` → `15_DAIP_Governance_Workspace_Process.md` → `16_DAIP_Phase_1_Readiness_Packet.md` → `17_DAIP_Phase_1_Readiness_and_Design_Review.md` → `14_DAIP_Production_Promotion_Gates.md` → `12_DAIP_Phase_1_Security_Acceptance.md`.

---

## 1. Purpose

The Digital Asset Intelligence Platform (DAIP) is a planned Rosie Dazzlers subsystem that manages the complete lifecycle of detailing media.

It exists because a normal detailing job can produce 10–15 large video files, many photos, short clips, before/after evidence, customer proof, and social media opportunities. Manually sorting, trimming, censoring, editing, captioning, publishing, and archiving all of that footage is too time consuming.

DAIP solves this by creating a structured media pipeline that:

1. Creates a unique media repository for every vehicle/job.
2. Stores original media safely.
3. Generates smaller proxy files automatically.
4. Detects scenes, story moments, poor footage, good footage, privacy risks, and reusable marketing clips.
5. Builds short-form and long-form content packages.
6. Protects license plates and sensitive customer information.
7. Creates a human review queue before publishing.
8. Produces reusable media assets for the website, Google Business Profile, social media, blog posts, SEO, customer proof, and future campaigns.

---

## 2. Required End Result From One Detailing Job

From one detailing job, DAIP should prepare the following assets automatically for review:

- 1 YouTube video
- 3 Facebook videos
- 5 Instagram Reels
- 5 TikTok videos
- Before/after images
- Website gallery
- Google Business Profile photos
- SEO metadata
- Blog article
- Thumbnail candidates
- Platform-specific captions

Nothing should publish automatically without admin approval.

---

## 3. Guiding Principles

- **Original footage is never modified.**
- **Every vehicle gets its own folder and database record.**
- **Multiple vehicles per day must be supported.**
- **Privacy protection is mandatory before public export.**
- **Human review is required before publishing.**
- **The system should support mobile-first capture in the field.**
- **The system should help technicians capture the right story while on site.**
- **The system should produce business value from every job.**
- **The system should support future AI improvement based on engagement data.**

---

## 4. Recommended Documentation Files

This v1.0 documentation suite starts with these files:

1. `README.md` — Vision, navigation, high-level goals.
2. `00_Project_Charter.md` — Business case, scope, outcomes, success criteria.
3. `01_System_Architecture.md` — Subsystem architecture, applications, data flow, queues, components.
4. `02_Database_Architecture.md` — Planned tables, relationships, audit fields, and indexing direction.
5. `03_Storage_Architecture.md` — Google Drive, Cloudflare R2, Supabase, local backup, naming conventions.
6. `04_Media_Ingestion_Pipeline.md` — Job folder creation, uploads, proxies, queues, validation.
7. `05_AI_Storytelling_Engine.md` — How the system turns random clips into a beginning/middle/end story.
8. `06_Computer_Vision_and_Privacy_Engine.md` — License plates, faces, house numbers, privacy review.
9. `07_Content_Generation_and_Marketing.md` — YouTube, Facebook, Reels, TikTok, website, GBP, SEO, blog.
10. `08_Media_Operations_Center_UI.md` — Admin screens and review workflows.
11. `09_Implementation_Roadmap.md` — Practical phased build plan.
12. `10_Rosie_Dazzlers_Integration_Plan.md` — Current Rosie integration boundary and phased safety plan.
13. `11_DAIP_Decision_Register.md` — Required owner decisions before any implementation.
14. `12_DAIP_Phase_1_Security_Acceptance.md` — Future schema/storage/processing acceptance template.
15. `13_DAIP_Test_Mode_Process.md` — Harmless metadata-only Test Lab workflow.
16. `14_DAIP_Production_Promotion_Gates.md` — Explicit promotion gates and hard stops.
17. `15_DAIP_Governance_Workspace_Process.md` — DAIP-0 decision-register operating process.
18. `16_DAIP_Phase_1_Readiness_Packet.md` — Owner readiness worksheet.
19. `17_DAIP_Phase_1_Readiness_and_Design_Review.md` — Build 222 readiness decision for a written private-MVP design review only.
20. `18_DAIP_Private_MVP_Design_Blueprint_Review.md` — Build 223 independent-review blueprint; it keeps Gate C held and adds no DAIP technical capability.

---

## 5. High-Level Flow

```text
Booking / Job Created
        ↓
Media Job Created
        ↓
Vehicle Folder Created
        ↓
Technician Captures Guided Before / Process / After Media
        ↓
Raw Media Uploaded
        ↓
Proxy + Thumbnail Generation
        ↓
Scene Detection + Quality Scoring
        ↓
Object Detection + Privacy Detection
        ↓
Story Assembly
        ↓
Shorts / Reels / YouTube / Galleries / SEO Drafts Generated
        ↓
Admin Review Queue
        ↓
Approved Assets Published or Exported
        ↓
Analytics Tracked Back to Original Job
```

---

## 6. Primary Applications and Tools Envisioned

### Existing Rosie Dazzlers Platform
Used for job records, booking, customer records, admin workflows, approvals, publishing queues, and website/gallery integration.

### Google Drive
Used as a familiar human-facing repository for organized media folders and backups.

### Cloudflare R2
Used for scalable application media storage: originals, proxies, thumbnails, generated outputs, and public website assets.

### Supabase / PostgreSQL
Used for metadata, media records, scene indexes, tags, AI scores, publish status, audit history, and analytics.

### FFmpeg
Used for video conversion, proxy generation, clip export, audio extraction, thumbnails, watermarks, blurs, black boxes, and final render assembly.

### OpenCV
Used for frame analysis, blur detection, motion detection, sharpness scoring, object tracking, and image quality checks.

### PySceneDetect
Used for automatic scene boundary detection.

### YOLO or Similar Object Detection Model
Used to detect cars, people, license plates, tools, foam, vacuums, wheels, interiors, headlights, and other detailing-related objects.

### Whisper or Similar Speech-to-Text
Used to generate transcripts, identify spoken notes, and create subtitles when needed.

### Queue Worker / Background Processor
Used to process large jobs asynchronously without blocking the web app.

---

## 7. Key Concept: One Vehicle = One Media Job

Every vehicle/detail receives a unique ID:

```text
RD-YYYYMMDD-###
```

Examples:

```text
RD-20260715-001
RD-20260715-002
RD-20260715-003
```

This supports multiple vehicles in one day without overwriting or confusing footage.

---

## 8. Development Rule

DAIP must be documentation-driven.

Before adding code, update the related Markdown file and database/schema notes. This keeps future AI conversations, future developers, and future rebuilds aligned with the intended architecture.

## Build 215 planning status

Build 215 reviewed this DAIP documentation and added `10_Rosie_Dazzlers_Integration_Plan.md`. That plan maps DAIP to the existing Rosie Dazzlers booking, live-media, incident, gallery, vehicle-history, and RLS/privacy foundations. **No production DAIP code, database tables, worker, storage bucket, AI processing, or publishing automation was implemented in Build 215.**

Read the integration plan before beginning any Phase 1 database or storage work.


## Build 216 governance note

Build 216 adds decision and acceptance templates only. DAIP remains planning-only: no DAIP worker, storage bucket, queue, schema, AI processing, Drive synchronization, export, or publication system has been implemented.


## Build 218 — DAIP internal-test foundation

Build 218 is the first controlled implementation step. It creates **DAIP-1A internal test mode**, not live DAIP production:

- `sql/2026-07-02_build218_daip_test_mode_foundation.sql` provides service-role-only test control, `RD-TEST` job codes, metadata-only asset records, non-executing planning tasks, internal privacy review, and audit events.
- `/admin-daip.html` is an admin-only Test Lab for a harmless internal booking/test record.
- No file upload/storage, signed URLs, worker, proxy, AI, Drive sync, public export, gallery handoff, customer access, or publication is available.
- Read `13_DAIP_Test_Mode_Process.md` for exact test steps and `14_DAIP_Production_Promotion_Gates.md` before proposing the next phase.

## Build 219 — DAIP governance workspace

Build 219 adds `/admin-daip-governance.html` and `sql/2026-07-02_build219_daip_governance_workspace.sql`. It records draft or owner-approved DAIP-0 decisions, reads Build 218 test evidence, and displays Gates A–F. It creates no storage, upload, signed URL, worker, AI, customer access, export, or publishing path. Gates C–F remain held until a separately reviewed future private-media build passes its own acceptance criteria.

## Build 220 — DAIP readiness packet

Build 220 adds `16_DAIP_Phase_1_Readiness_Packet.md`, an owner-facing meeting worksheet. It does not change the technical boundary or unlock Gate C.

## Build 222 — DAIP Phase 1 readiness review

Build 222 adds `/admin-daip-readiness.html`, `sql/2026-07-04_build222_daip_phase1_readiness_design_review.sql`, and `17_DAIP_Phase_1_Readiness_and_Design_Review.md`. The workspace can record drafts, pauses, and—only after Gate A and Gate B are ready—a decision to begin a **written private-MVP design review**. It cannot create storage, upload/download access, signed links, workers, processing, AI, customer media, exports, Gallery/Social/GBP handoff, or publishing. Gate C remains held.

## Build 223 — DAIP private-MVP blueprint review

Build 223 adds `/admin-daip-design.html`, `sql/2026-07-05_build223_daip_private_mvp_design_blueprint.sql`, and `18_DAIP_Private_MVP_Design_Blueprint_Review.md`. The page stores only a safe written blueprint for independent review after a current Build 222 authorization. It creates no storage, upload/download, signed-link, worker, processing, AI, customer-media, export, Gallery/Social/GBP handoff, or publishing path. Gate C remains held.

- `21_DAIP_Metadata_Only_Intake_Dry_Run.md` — Build 226 fictional manifest validation; Gate C remains held.

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
