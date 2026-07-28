# DAIP System Architecture

**Version:** 1.0

---

## 1. Architectural Summary

DAIP is a multi-stage processing subsystem connected to the existing Rosie Dazzlers platform.

It consists of:

1. Job/media repository creation.
2. Media ingestion.
3. Storage coordination.
4. Background processing.
5. Proxy creation.
6. Scene and frame analysis.
7. Computer vision detection.
8. Privacy processing.
9. Story construction.
10. Export generation.
11. Admin review.
12. Publishing and archive.
13. Analytics feedback.

---

## 2. High-Level Component Diagram

```text
Rosie Dazzlers Booking / Admin
          ↓
DAIP Media Job Service
          ↓
Folder + Storage Provisioning
          ↓
Upload Manager
          ↓
Processing Queue
          ↓
Worker Pipeline
   ├── FFmpeg
   ├── PySceneDetect
   ├── OpenCV
   ├── Object Detection
   ├── Privacy Engine
   ├── Story Engine
   └── Content Generator
          ↓
Review Queue
          ↓
Approved Exports
   ├── Website
   ├── Google Business Profile
   ├── YouTube
   ├── Facebook
   ├── Instagram
   ├── TikTok
   └── Archive
```

---

## 3. System Roles

| Role | Capabilities |
|---|---|
| Admin | Full access, approve, publish, delete, reprocess |
| Senior Detailer | Upload, tag, review job media, suggest approvals |
| Detailer | Upload media, capture required shots, view assigned jobs |
| Customer | Future: private proof gallery only |
| System Worker | Process media, generate outputs, update status |

---

## 4. Processing State Machine

A media job should move through clear states:

```text
created
↓
waiting_for_uploads
↓
uploading
↓
upload_complete
↓
queued_for_processing
↓
processing
↓
privacy_review_required
↓
story_review_required
↓
content_generated
↓
admin_review
↓
approved
↓
published_or_exported
↓
archived
```

Failure states:

```text
upload_failed
processing_failed
privacy_failed
export_failed
manual_review_required
```

---

## 5. Applications and Processes

### Rosie Dazzlers Web App

Responsibilities:

- Create media jobs.
- Display upload interface.
- Show processing status.
- Provide review/approval UI.
- Manage publishing queue.
- Connect output assets to website galleries and customer records.

### Supabase / PostgreSQL

Responsibilities:

- Store job metadata.
- Track media assets.
- Track processing stages.
- Store AI scores.
- Store privacy detections.
- Store exports and publishing history.
- Store audit logs.

### Cloudflare R2

Responsibilities:

- Store original media when required.
- Store generated proxies.
- Store thumbnails.
- Store final exports.
- Store website/public assets.

### Google Drive

Responsibilities:

- Human-friendly folder repository.
- Long-term media organization.
- Optional backup and manual browsing.
- Familiar upload destination for large raw files.

### Background Worker

Responsibilities:

- Pull queued jobs.
- Run FFmpeg/PySceneDetect/OpenCV/object detection.
- Generate proxies and outputs.
- Update processing status.
- Retry failures.

### FFmpeg

Responsibilities:

- Read videos.
- Generate proxy copies.
- Extract still frames.
- Export clips.
- Apply blur/black box overlays.
- Add watermarks.
- Normalize audio.
- Render final videos.

### PySceneDetect

Responsibilities:

- Detect scene boundaries.
- Segment raw video into useful scene candidates.

### OpenCV

Responsibilities:

- Blur detection.
- Shake/motion estimation.
- Brightness/exposure scoring.
- Frame difference analysis.
- Object tracking support.

### YOLO / Object Detection

Responsibilities:

- Detect vehicle, people, tools, plates, seats, wheels, foam, vacuums, polishers, etc.

### Whisper / Speech-to-Text

Responsibilities:

- Create transcripts.
- Detect spoken notes.
- Generate subtitles when useful.

---

## 6. Deployment Direction

Recommended staged deployment:

1. Documentation only.
2. Database tables and storage naming.
3. Manual upload UI.
4. Proxy generation worker.
5. Thumbnail/contact-sheet generation.
6. Scene detection.
7. Privacy detection.
8. Review UI.
9. Export generation.
10. Marketing content generation.
11. Publishing integrations.

---

## 7. Processing Strategy for 2 GB Files

The system should not expect AI chat tools to consume 20–30 GB per job.

Instead:

1. Upload raw footage to Drive/R2.
2. Background worker downloads/streams files server-side.
3. Worker creates 720p/480p proxy files.
4. Worker extracts scene contact sheets.
5. AI/editorial systems work from proxies, frames, metadata, and short extracted clips.
6. Final exports are rendered from original media when practical.

---

## 8. Review-First Safety Model

All automation produces drafts.

Final publishing requires admin approval because:

- Privacy detection is never perfect.
- AI editorial decisions may be wrong.
- Customer consent must be respected.
- Branding must remain consistent.
- Some footage may be useful internally but not publicly.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.
