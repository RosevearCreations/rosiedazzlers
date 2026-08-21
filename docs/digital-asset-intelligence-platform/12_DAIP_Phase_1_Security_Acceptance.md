> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# DAIP Phase 1 Security and Acceptance Template — Rosie Dazzlers

**Status:** Planning template only — do not mark complete before DAIP-0 decisions are approved.  
**Updated:** 2026-07-01  
**Scope:** Future DAIP-1 database/storage foundation. This template does not add any production code or schema.

## Purpose

This is the acceptance record for a future DAIP-1 build. It exists now so that the team does not start a media-processing system without clear privacy, RLS, storage, cost, and recovery checks.

## Preconditions

Before any Phase 1 migration is written or applied:

- [ ] DAIP-0 decision register is complete and owner-approved.
- [ ] One harmless internal test booking/media set is selected.
- [ ] Build 214 Supabase RLS containment is confirmed and Security Advisor is clear.
- [ ] Private original/proxy/public-derivative storage prefixes are approved.
- [ ] Retention and legal-hold policy is approved.
- [ ] No public export or automatic publishing is in scope for Phase 1.

## Future Phase 1 schema acceptance

The future migration must prove:

- [ ] Every `daip_*` table has Row-Level Security enabled.
- [ ] `anon`, `authenticated`, and `PUBLIC` do not have direct table grants.
- [ ] Cloudflare Functions remain the browser-to-database boundary.
- [ ] Every media job links to an existing booking/vehicle without duplicating private customer information unnecessarily.
- [ ] Original asset metadata is immutable after intake except for limited operational fields.
- [ ] Audit records capture actor, timestamp, action, source media, and reason.
- [ ] Incident/dispute/legal-hold exclusion flags prevent intake by default.
- [ ] No signed URL, API key, customer address, VIN, payment detail, or private note is stored in a public field.

## Future storage acceptance

- [ ] Private originals are not publicly routable.
- [ ] Private proxies/contact sheets are not publicly routable.
- [ ] Public derivatives require a separate approved export record.
- [ ] A storage key cannot be substituted across two media jobs.
- [ ] Test signed URLs expire and cannot be reused after expiry.
- [ ] Storage deletion/retention changes are dry-run first.
- [ ] Legal-hold records prevent automated retention cleanup.

## Future manual intake acceptance

- [ ] Staff choose source media explicitly; intake never sweeps all job media automatically.
- [ ] Staff see consent/review state before intake.
- [ ] Staff see incident/dispute/legal-hold exclusion warnings.
- [ ] One selected internal photo can enter a private media job.
- [ ] One selected internal video can enter a private media job.
- [ ] Neither asset appears in Gallery, website, GBP, social, or customer portal automatically.

## Future processing acceptance

- [ ] Background processing is outside the Pages request path.
- [ ] A failed job exposes a safe error reason and retry state.
- [ ] Cost/usage is recorded against the job without exposing provider secrets.
- [ ] Processing can be cancelled without deleting immutable originals.
- [ ] Retry does not duplicate public outputs or audit records.

## Future privacy and export acceptance

- [ ] Privacy review blocks export when faces, plates, house numbers, documents, or unrelated people require review.
- [ ] Automated detection is advisory only; a human approves/rejects privacy clearance.
- [ ] Customer portal visibility is not treated as marketing/public consent.
- [ ] Gallery candidate creation requires separate approval/provenance.
- [ ] Any future publication remains a deliberate human action with a recorded actor/time/reason.

## Evidence record

For every future test, record only safe evidence:

```text
Test name:
Internal test booking reference (no customer name/address/VIN):
Tester:
Date/time:
Expected result:
Actual result:
Pass / Blocked / Failed:
Safe evidence link or screenshot location:
Follow-up owner:
```

Do not paste secrets, signed URLs, raw original paths, customer details, payment information, private incident evidence, or personal identifiers into this template.


## Build 218 test-mode evidence before future Phase 1

Before considering this Phase 1 template, complete the three Build 218 Test Centre records. Those results prove the test boundary only; they do not approve original file storage, upload URLs, worker execution, public release, or customer-media intake.

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

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
