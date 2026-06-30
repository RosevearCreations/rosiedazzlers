# DAIP Implementation Roadmap

**Version:** 1.0

---

## Phase 0 — Documentation and Planning

Deliverables:

- DAIP documentation folder.
- Project charter.
- Architecture overview.
- Database plan.
- Storage plan.
- Roadmap.

Exit criteria:

- Documentation committed to project.
- Future build chat can understand the subsystem.

---

## Phase 1 — Database and Storage Foundation

Build:

- media job tables
- media asset tables
- processing queue tables
- export tables
- privacy detection tables
- audit log
- storage naming constants
- RLS policies

Exit criteria:

- App can create media job records.
- Each job gets a unique code.
- Multiple vehicles per day supported.

---

## Phase 2 — Manual Media Job Creation and Upload UI

Build:

- `/admin/media`
- create media job screen
- upload screen
- file listing
- upload progress
- raw asset records

Exit criteria:

- Admin can create a job and upload media.
- Files are stored and linked to job.

---

## Phase 3 — Proxy and Thumbnail Worker

Build worker tasks:

- metadata extraction
- proxy generation
- thumbnail extraction
- contact sheets
- error/retry tracking

Tools:

- FFmpeg
- background worker
- R2/Drive integration

Exit criteria:

- A large video can produce smaller proxies and thumbnails.

---

## Phase 4 — Scene Detection and Quality Scoring

Build:

- scene detection via PySceneDetect or equivalent
- scene records
- frame samples
- blur/shake/brightness scoring
- scene contact sheets

Exit criteria:

- System can split one video into scenes and rank likely useful clips.

---

## Phase 5 — Privacy Engine MVP

Build:

- license plate detection
- bounding box storage
- blur/black-box export
- privacy review queue
- manual approve/reject

Exit criteria:

- Exported clips can mask license plates.
- Public publishing blocked until privacy review complete.

---

## Phase 6 — Story Engine MVP

Build:

- story tags
- before/process/after classification
- short-form candidate selection
- timeline preview
- admin story review

Exit criteria:

- System suggests at least five usable short clips from a media job.

---

## Phase 7 — Export Generation

Build:

- YouTube draft export
- Facebook draft exports
- Instagram Reel exports
- TikTok exports
- thumbnail candidates
- before/after still extraction

Exit criteria:

- One job can generate review-ready videos and images.

---

## Phase 8 — Content Generation

Build:

- captions
- hashtags
- YouTube title/description
- GBP captions
- website gallery captions
- SEO title/meta
- blog draft

Exit criteria:

- One job can generate a full marketing text package.

---

## Phase 9 — Website and Gallery Integration

Build:

- approved gallery import
- alt text application
- service tags
- town tags
- website display controls

Exit criteria:

- Approved media can appear in Rosie Dazzlers website galleries.

---

## Phase 10 — Publishing Queue

Build:

- manual export/download
- scheduling records
- platform-ready packages
- future API publishing hooks

Exit criteria:

- Admin can approve and export/publish assets in an organized way.

---

## Phase 11 — Analytics Feedback

Build:

- platform analytics storage
- engagement tracking
- job-to-content attribution
- simple performance dashboard

Exit criteria:

- Rosie Dazzlers can see which content types produce engagement and leads.

---

## Recommended First Build Task for Existing App Chat

Ask the Rosie Dazzlers development chat to:

1. Add these Markdown files under:

```text
docs/digital-asset-intelligence-platform/
```

2. Add a short link/reference from the main roadmap Markdown.
3. Do not implement code yet unless documentation has been committed.
4. Next, create Phase 1 database migration draft for the core DAIP tables.

---

## Build Discipline

Every DAIP implementation pass must update:

- relevant DAIP Markdown file
- roadmap status
- schema/migration notes
- known issues/gaps
- testing checklist

This keeps the subsystem understandable for future chats and future maintainers.

## Build 215 planning checkpoint — 2026-06-30

The DAIP documentation is now referenced by the active Rosie Dazzlers roadmap and known-gaps files. `10_Rosie_Dazzlers_Integration_Plan.md` defines the boundary with existing job media, incident privacy, gallery approvals, RLS, and future background workers.

**Status:** Phase 0 planning remains open. No production DAIP tables, workers, R2 DAIP buckets, AI processing, exports, or automatic publishing were added in Build 215. Begin with DAIP-0 decisions and a reviewed Phase 1 migration draft, not implementation code.
