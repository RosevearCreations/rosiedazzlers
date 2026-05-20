# Social Platform Publishing Plan

## Build 156 status

Build 156 adds the first safe layer for sending job photos and progress summaries outward: a reviewable social queue. Staff can create social drafts from Admin Progress when posting customer updates or media, then review and manage those drafts in Admin Social Queue.

The system now supports draft records for Facebook, Instagram, X, TikTok, Google Business Profile, LinkedIn, YouTube Shorts, and manual copy/paste posting. Direct API publishing is intentionally staged behind credentials, platform approvals, and human review because each platform has different account, token, app-review, media, and rate-limit rules.

## Current workflow

1. Load a booking in Admin Progress.
2. Post a progress update or attach job media.
3. Enable **Create social drafts after posting update/media**.
4. Choose platforms.
5. Save the update/media.
6. Review drafts in Admin Social Queue.
7. Mark a draft ready, posted, skipped, failed, or send it to an optional webhook.

## Why this is safer than direct auto-posting first

The queue avoids accidental customer/privacy issues, gives staff a chance to clean up captions, and prevents unapproved photos from being pushed straight to public platforms. It also works before platform API credentials are approved.

## Direct-posting readiness

Direct posting can be added after credentials are available:

- X: requires an authenticated token that can create posts.
- Facebook/Instagram: requires Meta app configuration, Page/Instagram Business connection, permissions, and access tokens.
- TikTok: requires Content Posting API access, approved scopes, creator authorization, and media that meets TikTok requirements.
- Google Business Profile: should be treated as a local proof/recent-work workflow once the Google business integration path is confirmed.

## Build 156 database tables

- `social_channels`
- `social_post_queue`
- `social_dispatch_attempts`

Run `sql/2026-05-19_build156_social_progress_dispatch_queue.sql` before using the live queue in production.

## Environment variables planned for future direct dispatch

- `SOCIAL_DISPATCH_WEBHOOK_URL` for a generic automation bridge.
- `X_ACCESS_TOKEN` or `X_BEARER_TOKEN` for future X posting support.
- `META_PAGE_ACCESS_TOKEN` or `FACEBOOK_PAGE_ACCESS_TOKEN` for future Meta posting support.
- `INSTAGRAM_ACCESS_TOKEN` for future Instagram publishing support.
- `TIKTOK_ACCESS_TOKEN` for future TikTok direct posting support.

## Next implementation direction

The next pass should add OAuth/token storage policy, a platform approval checklist, per-platform caption length/media rules, and direct publishing adapters one platform at a time. Facebook/Instagram should likely come first because detail photos are a natural fit, followed by Google Business Profile for local trust, then TikTok/YouTube Shorts for vertical video.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.
