# DAIP AI Storytelling Engine

**Version:** 1.0

---

## 1. Purpose

The AI Storytelling Engine turns random detailing footage into compelling transformation stories.

It should understand the basic narrative:

```text
Problem → Process → Transformation → Proof → Call To Action
```

---

## 2. Standard Rosie Dazzlers Story Arc

### 1. Hook

First 1–3 seconds must stop the scroll.

Examples:

- Dirty cupholder close-up.
- Foam cannon blast.
- Half-clean carpet reveal.
- Water beading close-up.
- Before/after split.

### 2. Problem

Show why the customer needed service.

Examples:

- salt stains
- pet hair
- dull paint
- dirty wheels
- stained seats
- cloudy headlights

### 3. Process

Show satisfying work.

Examples:

- vacuum lines
- extractor pulling dirt
- foam coverage
- brush agitation
- polishing reflection

### 4. Transformation

Show clear improvement.

Examples:

- matched before/after
- clean carpet
- glossy paint
- restored headlight
- finished interior

### 5. Proof

Show final inspection and beauty shots.

### 6. Call to Action

End with Rosie Dazzlers branding, service area, phone number, and booking prompt.

---

## 3. Story Tags

Scenes should be tagged with story roles:

- hook_candidate
- before_problem
- process_action
- satisfying_moment
- transformation_reveal
- after_proof
- beauty_shot
- call_to_action_background
- reject

---

## 4. Clip Scoring

Each scene should receive scores:

| Score | Meaning |
|---|---|
| quality_score | sharpness, exposure, stability |
| action_score | visible useful detailing work |
| story_score | helps tell beginning/middle/end |
| marketing_score | likely useful for social media |
| privacy_score | lower if privacy risks are present |
| uniqueness_score | avoids duplicates |

---

## 5. Automatic Short-Form Strategy

### Instagram Reels / TikTok

Recommended format:

- 9:16 vertical
- 7–35 seconds for fast clips
- 45–60 seconds for stronger transformations
- text overlays
- quick cuts
- no long dead space
- strong first frame

### Facebook Videos

Recommended format:

- 1:1, 4:5, or 16:9 depending on use
- slightly slower pacing
- local trust message
- service explanation

### YouTube Video

Recommended format:

- 16:9
- 2–8 minutes
- full story
- chapters possible
- intro/outro branding

---

## 6. Required Generated Concepts

For each job, DAIP should attempt:

1. Full transformation video.
2. Dirty-to-clean hook short.
3. Most satisfying cleaning moment.
4. Before/after proof short.
5. Service-specific short.
6. Local trust/community short.
7. Beauty-shot montage.

---

## 7. Duplicate Avoidance

The system should avoid creating five nearly identical shorts.

Diversify by:

- different hooks
- different service focus
- different length
- different platform pacing
- different thumbnail
- different caption angle

---

## 8. Human Review

Admins should be able to:

- reorder clips
- remove clips
- approve story arc
- regenerate with different tone
- choose music direction
- choose CTA
- select thumbnail

---

## 9. Learning Loop

Future versions should use analytics:

- Which clips got views?
- Which thumbnails got clicks?
- Which services converted?
- Which hooks retained viewers?
- Which platform performed best?

That information should improve future clip selection.

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
