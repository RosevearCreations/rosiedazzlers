# DAIP Production Promotion Gates — Rosie Dazzlers

**Status:** Active control document after Build 218.  
**Rule:** No one may treat a DAIP Test Lab record as real-media production readiness.

## Gate A — owner decisions

All DAIP-0 rows in `11_DAIP_Decision_Register.md` must be owner-approved and dated:

- worker host and operating owner;
- monthly storage/egress/AI/render ceiling and stop rule;
- original-storage/backup policy;
- Google Drive role or explicit deferral;
- customer consent wording;
- privacy/content/gallery/publication roles;
- retention, dispute, incident, and legal-hold rules;
- selected internal test data; and
- public-destination scope.

## Gate B — Build 218 safety evidence

The three Build 218 guided tests must pass in development/staging. The recorded evidence must be safe: no signed URL, no customer record, no storage key, no invoice/payment data, and no private media.

## Gate C — storage and upload design review

A new reviewed build must define all of the following before any original byte can be accepted:

- dedicated private bucket/prefix separation for originals, proxies, review derivatives, and approved public derivatives;
- short-lived, single-purpose upload/download authorization; no embedded storage credentials;
- resumable upload recovery and checksums;
- source-to-derivative provenance;
- retention/hold rules and a dry-run cleanup report;
- backup policy with one controlled source of truth.

Cloudflare R2 supports presigned S3 URLs for narrow, time-limited object operations; they must be generated only server-side and treated as sensitive bearer URLs. This is a future design decision, not an enabled Build 218 feature.

## Gate D — non-public processing MVP

The first worker phase must remain private and limited to metadata extraction, validation, checksum, thumbnail/proxy/contact-sheet generation, retry state, cancellation, and cost recording. It must run outside Cloudflare Pages request handling. No AI/publishing work is included until the private technical pipeline passes.

## Gate E — privacy/export proof

Before public derivatives exist:

- privacy review must block export by default;
- automated detections remain advisory and need a human decision;
- customer portal visibility remains separate from marketing consent;
- every derivative shows source, privacy decision, consent state, reviewer, and time;
- gallery/social/website handoff is a separate explicit action.

## Gate F — controlled production promotion

Only after Gates A–E pass may a limited internal-first production pilot be proposed. The pilot must have a written rollback, cost dashboard, incident escalation owner, daily review, and zero automatic publishing.

## Invariant rules across every gate

- Original media remains private and immutable.
- Incident, dispute, legal-hold, customer-portal, and staff-only material remain excluded unless a separately approved narrow exception exists.
- Browser roles do not receive direct database access; Cloudflare Functions remain the application boundary and Supabase RLS/grants remain enforced.
- No generated asset publishes automatically.
- An asset is useful for local SEO only after it is truly approved for the relevant public page, has accurate descriptive filename/alt/caption context, and is placed near relevant local service content.

## Build 219 governance evidence

Build 219 makes Gate A and Gate B observable in `/admin-daip-governance.html`. Gate A is ready only when all twelve DAIP-0 decisions have recorded owner approval. Gate B is ready only when the Build 218 Test Lab control is safe and all three internal-test acceptance cases have latest recorded Pass results. Gates C–F remain held in Build 219 and cannot be advanced by decision entry alone.


## Build 247 current gate interpretation

The owner has now commissioned the narrow private-ingestion implementation described by Gate C. Build 247 provides private R2 original storage, resumable multipart recovery, project/source provenance, private-by-default metadata and a downstream processing-job ledger. **Gate C is not considered operationally passed until Startup processes 38 and 39 are completed in staging/preview with safe evidence.** Gate D (actual non-public processing execution), Gate E (privacy/export proof), and Gate F (controlled production promotion) remain held. No Build 247 upload automatically creates a public destination.

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
