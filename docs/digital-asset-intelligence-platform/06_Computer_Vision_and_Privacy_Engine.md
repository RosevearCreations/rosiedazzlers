# DAIP Computer Vision and Privacy Engine

**Version:** 1.0

---

## 1. Purpose

The Computer Vision and Privacy Engine detects useful media content and protects sensitive customer information before anything is published.

Privacy protection is mandatory because detailing videos can easily show:

- license plates
- faces
- children
- house numbers
- street signs
- neighbour vehicles
- VIN labels
- insurance documents
- parking permits
- phone screens
- reflections

---

## 2. License Plate Detection

The system should detect plates in:

- front vehicle views
- rear vehicle views
- side reflections
- neighbouring vehicles
- trailers
- motorcycles
- temporary permits

Detection output:

- media_asset_id
- timestamp
- bounding box
- confidence
- recommended action

---

## 3. Privacy Actions

Available masking actions:

| Action | Use Case |
|---|---|
| black_box | strongest privacy protection |
| heavy_blur | acceptable for most video |
| pixelate | stylistic alternative |
| manual_review | low confidence or risky frame |
| ignore | false positive approved by admin |

Recommendation: default public exports should use black box or heavy blur for plates.

---

## 4. Tracking Across Frames

Plate detection should not only detect a single frame.

The system should:

1. Detect plate region.
2. Track it across nearby frames.
3. Apply mask consistently.
4. Re-check output after masking.
5. Flag missed or low-confidence spans.

---

## 5. Face Detection

Optional but recommended.

Detect:

- customers
- technicians
- bystanders
- children
- reflections

Faces can be:

- allowed if staff consent exists
- blurred if customer/bystander
- sent to manual review if uncertain

---

## 6. Sensitive Object Detection

Future privacy detections:

- house numbers
- mailboxes
- documents
- VIN labels
- license/ownership papers
- credit cards
- garage codes
- phone screens
- personal photos

---

## 7. Quality Detection

Computer vision should also detect quality issues:

- blur
- darkness
- overexposure
- severe camera shake
- blocked lens
- no useful subject
- duplicate scene
- long static footage

These scores help reject bad footage before editing.

---

## 8. Detailing Object Detection

Objects/classes to detect:

- vehicle
- wheel
- tire
- windshield
- headlight
- seat
- carpet
- floor mat
- dashboard
- door panel
- foam cannon
- pressure washer
- vacuum
- extractor
- steam cleaner
- brush
- microfiber towel
- polisher
- ceramic spray
- wax bottle
- water beads

---

## 9. Review Queue

Any asset with privacy risk should require review before publication.

Review statuses:

- pending_detection
- detection_complete
- masking_applied
- needs_manual_review
- approved_private
- approved_public
- rejected_public

---

## 10. Safety Rule

If the system is uncertain, it should protect privacy first.

Better to over-blur than accidentally expose a customer plate or private information.

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
