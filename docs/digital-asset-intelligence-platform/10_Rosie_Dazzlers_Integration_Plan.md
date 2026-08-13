# DAIP Integration Plan for Rosie Dazzlers

**Status:** Build 215 planning only — no production DAIP code, database tables, workers, or publishing automation were added.  
**Updated:** 2026-06-30  
**Read with:** `README.md`, `00_Project_Charter.md`, `01_System_Architecture.md`, `02_Database_Architecture.md`, `03_Storage_Architecture.md`, `09_Implementation_Roadmap.md`, `11_DAIP_Decision_Register.md`, and `12_DAIP_Phase_1_Security_Acceptance.md`.

## Purpose

The Digital Asset Intelligence Platform (DAIP) is a future media-operations subsystem for turning the approved media from one Rosie Dazzlers detail into reusable customer proof, website gallery material, local SEO assets, Google Business Profile media, and social-content drafts.

Build 215 only defines how DAIP should fit the existing app safely. It does **not** implement a production ingestion worker, AI pipeline, `daip_*` database table, R2 processing bucket, Google Drive connector, public media export, or automatic publishing process.

## Existing Rosie Dazzlers capabilities DAIP must reuse

DAIP must not duplicate the current live-detailing workflow. It should attach to it after the correct staff/admin approvals have occurred.

| Existing area | Existing responsibility | DAIP integration boundary |
|---|---|---|
| `bookings` | Customer, vehicle, appointment, service and location context | Creates the source job/vehicle context only. |
| `job_updates` | Detailer notes and visibility choices | DAIP may read only approved staff-authorized update metadata. |
| `job_media` | Original job photos/video metadata, privacy and customer visibility | Supplies selected media references; raw originals stay immutable. |
| `proof_of_work_checklists` | Arrival/during/final completion proof | Provides the minimum job-story stages, not an automatic public license. |
| `incident_reports` | Private damage/fault evidence | Must be excluded from DAIP public/content pipelines unless a separate explicit decision is recorded. |
| `completed_job_summaries` | Customer closeout package | Can seed care advice, service tags and suggested content context. |
| `gallery_media_candidates` | Approved final media awaiting gallery decision | Is the first safe bridge into public-ready visual reuse. |
| `media_asset_tasks` | Static/site asset health workflow | Remains separate from DAIP video-processing jobs. |

## Non-negotiable privacy and publishing rules

1. Original footage is immutable and access-controlled.
2. Staff-only media, review-pending media, private incident evidence, addresses, VINs, payment data, customer replies, and personal identifiers are excluded by default.
3. Public export requires an explicit DAIP review decision after privacy review; current `customer_visible` status is not automatically `public_publishable` status.
4. License plates, faces, house numbers, documents, screens, and unrelated bystanders must be detected/reviewed before any public export.
5. DAIP must never publish automatically to the website, Google Business Profile, Facebook, Instagram, TikTok, YouTube, or any other destination.
6. All browser access remains through protected Cloudflare Functions; Build 214 RLS containment remains the database boundary.
7. Signed URLs and least-privilege storage paths are required for original/proxy access. Public URLs are allowed only for separately approved public derivatives.
8. Every processing, review, export, and publish decision needs an auditable actor/time/reason record.

## Target subsystem boundary

```text
Existing booking/job/media
  → staff selects eligible completed-job media
  → DAIP media job created
  → private raw upload/original registry
  → worker creates proxies/thumbnails/contact sheets
  → privacy + quality review
  → story/export candidates
  → human approval queue
  → approved public derivative or platform-ready download
```

The DAIP worker must run outside the Cloudflare Pages request path. Large video conversion, scene detection, computer vision, transcription, proxy generation, and retries are background work; they must not block booking, customer progress, or staff job operations.

## Proposed future data and storage design

The DAIP documentation defines future `daip_media_jobs`, `daip_media_assets`, `daip_processing_jobs`, scene/privacy/export/content/publish/analytics records. Those names are planning targets only until a reviewed Phase 1 migration is approved.

Suggested storage separation:

```text
R2 private original: daip/private/{media_job_id}/originals/
R2 private proxy:    daip/private/{media_job_id}/proxies/
R2 private review:   daip/private/{media_job_id}/contact-sheets/
R2 approved public:  daip/public/{media_job_id}/approved/
R2 export package:   daip/private/{media_job_id}/exports/
```

A Google Drive mirror may be added only as a deliberate backup/export policy. It must not become a second uncontrolled source of truth for customer media.

## Integration phases

### DAIP-0 — Decisions, security review, and cost ceiling

Before any code or migration:

- Choose a background-worker hosting approach suitable for FFmpeg/OpenCV/AI processing.
- Decide whether original media remains only in R2, is mirrored to Drive, or both.
- Decide monthly storage, egress, transcription, vision, and rendering budget ceilings.
- Define retention periods for originals, proxies, rejected candidates, approved derivatives, and legal-hold material.
- Confirm consent/contract wording for marketing reuse.
- Decide who can start a DAIP job, review privacy, approve exports, and publish.

**Exit condition:** written decisions are entered in the DAIP decision log and approved by the owners.

### DAIP-1 — Database and storage foundation

Build only after DAIP-0 approval:

- Reviewed migration for core `daip_*` tables and indexes.
- RLS policies with no browser-wide direct access.
- Explicit storage bucket/prefix policy.
- Unique media-job ID generation tied to an existing booking/vehicle.
- Audit-event foundation.

**Exit condition:** a test job can create an empty media-job record with no public assets or processing.

### DAIP-2 — Manual selected-media intake

Build a staff-only media job page that lets us choose existing approved/internal job media or upload selected original files, with a purpose and consent/review state.

**Exit condition:** staff can create one media job and see its selected raw asset inventory without publishing anything.

### DAIP-3 — Safe technical processing MVP

Add a background queue and worker for metadata, checksums, thumbnails, proxies, contact sheets, retry/error status, and storage usage. Do not add AI content generation yet.

**Exit condition:** a large internal test video produces a private proxy, thumbnail, and contact sheet with a complete audit record.

### DAIP-4 — Privacy review MVP

Add manual privacy masks/review first; automated detection may suggest plate/face/house-number regions but cannot approve itself.

**Exit condition:** public export is technically blocked until a human privacy reviewer approves it.

### DAIP-5 — Story and export candidate review

Add before/process/after tags, timeline selection, manual clips, thumbnail candidates, social ratios, and human review queues.

**Exit condition:** one completed internal test job can produce a review-only short-form candidate package.

### DAIP-6 — Approved website/gallery and content handoff

Connect only approved DAIP derivatives to Gallery Approvals, vehicle history, local service/town proof, GBP draft media, captions, SEO drafts, and marketing workbench. No automatic posting.

**Exit condition:** one approved final media item is reused with its provenance, alt text, town/service tags, consent state, and approval history intact.

## Build 215 media asset alignment and DAIP relationship

Build 215 fixes a separate immediate issue: public service-hub/local-hero assets were verified in R2 as JPG files while some legacy runtime/verifier records assumed `.webp`.

The Build 215 asset resolver and migration:

- Prefer canonical Local Hero JPG URLs.
- Accept the same known asset filename with `.jpg`, `.jpeg`, `.webp`, or `.png` variants.
- Show the resolved URL/format in Admin Media Health.
- Align legacy `media_asset_tasks` hero records to JPG.

This is **not DAIP processing**. It is public-site asset compatibility and must remain independent of DAIP’s future original/proxy/derivative pipeline.

## Required decisions before the first DAIP implementation pass

1. Which worker platform will run FFmpeg/OpenCV/transcription workloads?
2. What is the monthly maximum cost for storage, egress, AI/transcription, and rendering?
3. Will Google Drive be backup-only, operator-visible, or omitted from the first release?
4. Which customer consent language permits public marketing reuse?
5. Who can approve privacy, content, gallery reuse, and eventual publication?
6. What is the default retention duration for originals, proxies, rejected candidates, and approved public derivatives?
7. What happens when a job contains a private incident, a customer dispute, or a legal hold?
8. Which single internal test booking/media set will be used for acceptance testing?

## Acceptance discipline

Every eventual DAIP pass must update:

- the relevant DAIP Markdown document;
- `AI_PROJECT_HANDOFF.md`;
- `MASTER_VALUE_ROADMAP.md`;
- `KNOWN_GAPS_AND_RISKS.md`;
- schema/migration notes;
- guided acceptance steps;
- privacy/RLS and retention checks.

No DAIP phase is complete because a worker runs. It is complete only when an owner can verify that selected media stays private, processing is auditable, privacy review blocks public outputs, and approved derivatives can be traced back to the original job without exposing sensitive information.


## Build 216 governance update

Build 216 adds the DAIP-0 decision register and the DAIP-1 future acceptance template. Both are planning controls only. A DAIP implementation pass remains blocked until all DAIP-0 rows are owner-approved and an internal test job is selected.

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
