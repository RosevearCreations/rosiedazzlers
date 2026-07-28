# DAIP Storage Architecture

**Version:** 1.0

---

## 1. Purpose

DAIP needs predictable, scalable storage for very large original videos, generated proxies, still images, exports, thumbnails, and text content.

Storage must support:

- Multiple vehicles per day.
- 10–15 raw video files per vehicle.
- Original file preservation.
- Generated proxy files.
- Public and private asset separation.
- Easy human browsing.
- Application-level retrieval.

---

## 2. Recommended Job Folder Structure

Each vehicle receives its own folder:

```text
Media/
  Rosie Dazzlers/
    Jobs/
      2026/
        07/
          RD-20260715-001/
            metadata.json
            originals/
              Camera1/
              Camera2/
              Phone/
              Drone/
            proxy/
              1080p/
              720p/
              480p/
            audio/
            transcripts/
            scenes/
            contact_sheets/
            stills/
              before/
              after/
              process/
              beauty/
            privacy/
              masks/
              reviewed/
            exports/
              youtube/
              facebook/
              instagram/
              tiktok/
              website/
              gbp/
            thumbnails/
            captions/
            seo/
            logs/
            review/
```

---

## 3. Job ID Format

```text
RD-YYYYMMDD-###
```

Examples:

```text
RD-20260715-001
RD-20260715-002
RD-20260715-003
```

The daily sequence number prevents conflicts when multiple vehicles are detailed in one day.

---

## 4. Google Drive Role

Google Drive is recommended for:

- Human-friendly organization.
- Manual browsing.
- Familiar backup structure.
- Sharing selected folders if needed.
- Receiving raw uploads from phones/cameras when convenient.

Google Drive should not be the only application storage source. The web application still needs database records and stable asset keys.

---

## 5. Cloudflare R2 Role

Cloudflare R2 is recommended for:

- Application-controlled storage.
- Website asset delivery.
- Generated proxies.
- Generated exports.
- Thumbnails.
- Public gallery media.
- Private processed media.

Suggested R2 prefix:

```text
daip/jobs/RD-20260715-001/
```

Example:

```text
daip/jobs/RD-20260715-001/originals/camera1/clip001.mp4
daip/jobs/RD-20260715-001/proxy/720p/clip001_proxy_720p.mp4
daip/jobs/RD-20260715-001/stills/before/front_before.jpg
daip/jobs/RD-20260715-001/exports/instagram/reel_01.mp4
```

---

## 6. Original Media Policy

Original footage must be:

- Preserved unchanged.
- Marked read-only after upload.
- Never overwritten by processed versions.
- Linked to all derived outputs.
- Retained according to storage policy.

---

## 7. Proxy Media Policy

Proxy files are generated for analysis and review.

Recommended proxies:

| Proxy | Purpose |
|---|---|
| 1080p | Higher quality review/export draft |
| 720p | AI/editorial review |
| 480p | Fast preview/mobile review |
| contact sheet | Quick visual scan |
| thumbnails | UI and selection |

---

## 8. Public vs Private Storage

Public-ready assets must be separate from private/raw media.

Private:

- raw videos
- unblurred clips
- customer documents
- GPS metadata
- plate numbers
- rejected footage

Public-ready:

- approved videos
- blurred exports
- approved gallery images
- approved thumbnails
- approved captions

---

## 9. Retention Policy Direction

Initial suggested retention:

| Asset Type | Suggested Retention |
|---|---:|
| Original raw media | 12–24 months or manual archive |
| Proxy files | 90–180 days after publishing |
| Approved exports | Keep indefinitely |
| Website gallery assets | Keep while published |
| Rejected clips | 30–90 days |
| Logs | 12 months |

These policies should be configurable.

---

## 10. Storage Dashboard Requirements

The Media Operations Center should show:

- Total storage by month.
- Storage by job.
- Original vs proxy vs export usage.
- Files waiting for archive.
- Failed uploads.
- Missing metadata.
- Public/private counts.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.
