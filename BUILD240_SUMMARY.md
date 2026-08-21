> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# Rosie Dazzlers Build 240 Summary

**Updated:** 2026-08-05

## Primary advancement

Build 240 adds preview-first, transactional inventory posting and authorized compensating reversal for ordinary bookings and reviewed Creative Projects while preserving all existing inventory editors, JSON tools, galleries, archive/restore, merge, bulk-update, booking and project workflows.

## New operator route

`/admin-inventory-posting.html`

## New migration

`sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql`

Apply after Builds 235, 237, 238 and 239, staging first.

## Safety properties

- Complete batch succeeds or fails as one inventory database transaction.
- Inventory rows are locked and checked for shortages before mutation.
- Stable idempotency keys prevent retry/double-click duplicate deductions.
- Creative Project quantity must exactly match a reviewed reservation.
- Original movements are retained; reversal creates compensating return movements.
- Booking reversal flags accounting for review rather than deleting journal history.
- API outage history fallback is labelled read-only and cannot mutate stock.
- Inventory and movement quantities are aligned to thousandth-level precision.

## Startup Guide

Every prior Build 239 process remains. Build 240 adds process 35 for migration verification and process 36 for posting/reversal/accounting acceptance.

## Current next 20 steps

1. **Deploy Build 240 and verify the Inventory Posting page** — Deploy preview, hard-refresh /admin-inventory-posting, verify CSS/scripts/menu/route copy and confirm no console error.
2. **Apply the Build 240 transaction migration in staging** — Run the complete Build 240 migration after prior migrations, refresh schema cache, and confirm tables/RPCs.
3. **Complete booking inventory posting acceptance** — Preview and commit a small booking usage batch; verify stock, movement, batch, row and job history evidence.
4. **Complete Creative Project reservation posting acceptance** — Post reviewed project reservations and verify project ownership, shortage checks, status and inventory_mutated evidence.
5. **Complete idempotency, shortage and rollback tests** — Replay the same key, submit an over-stock request, and confirm no duplicate or partial mutations.
6. **Complete authorized reversal and accounting review** — Preview/commit a compensating reversal and reconcile booking COGS journal evidence without deleting history.
7. **Retest Block Calendar full-day, AM and PM behaviour** — Create/remove each block type and confirm public booking availability matches after refresh.
8. **Complete end-to-end booking, payment and notification test** — Run phone-sized booking, deposit, webhook, email and admin reconciliation with safe evidence.
9. **Complete Cloudflare and Supabase recovery rehearsal** — Audit variables/bindings then perform staging restore and deployment rollback with smoke tests.
10. **Complete legal, consent and staff permission review** — Publish policies, verify links, roles, session expiry and private media/incident boundaries.
11. **Complete real-device mobile and accessibility acceptance** — Test customer/admin paths, keyboard, focus, labels, contrast, wrapping, tables and touch targets.
12. **Finish resumable media upload and derivative worker** — Implement resumable weak-network upload recovery, deduplication and WebP/AVIF responsive derivatives.
13. **Add automatic product publish-readiness gates** — Block public publishing when required image roles, price, tax, category, stock, SEO or consent are incomplete.
14. **Complete inventory name/category/cost/duplicate cleanup** — Use suspicious-name, transactional bulk update, merge preview and audit history tools.
15. **Complete sellable product galleries and pricing review** — Finish featured plus seven images, alt/captions/roles, costs, HST, margins and public display.
16. **Complete payment application and tax workflow** — Post approved receipts against AR, add HST review, exceptions and traceable journal links.
17. **Add month-end close, lock/reopen and accountant export** — Implement controlled period close, authorized reopen and evidence-complete export packaging.
18. **Complete Search Console, schema and GBP alignment** — Submit sitemap, validate canonicals/schema/indexing and align GBP services, areas, hours, photos and reviews.
19. **Replace high-value placeholders with approved local proof** — Prioritize homepage, town/service pages, booking, galleries and trust blocks using customer-approved Rosie-owned images.
20. **Run invite-only soft launch and prioritize observed failures** — Accept a small known-customer cohort and review every booking, payment, notification, upload, inventory and incident event daily.

## Documentation authority

1. `AI_PROJECT_HANDOFF.md`
2. `MASTER_VALUE_ROADMAP.md`
3. `STARTUP_GO_LIVE_BLOCKERS.md`

Supporting Development Roadmap, Known Gaps, implementation state, sanity, schema and image documents remain synchronized for future AI/developer handoff.

## Validation

- Complete historical release suite passed.
- Build 240 guard passed.
- Cloudflare Pages Functions static/syntax checks passed.
- One-H1 validation passed.
- Route-copy and local asset checks passed.
- Canonical schema and migration markers passed.
- All Markdown files carry Build 238, Build 239 and Build 240 synchronization evidence.

Build 238 synchronization (2026-07-30)

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

Build 210 documentation sync
Build 211 documentation sync
Build 212 documentation sync
Build 213 documentation sync
Build 214 documentation sync

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->

<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Specialist runbook: STARTUP_GO_LIVE_BLOCKERS.md | Inventory recovery: reviewed existing-row Amazon refresh -->

<!-- BUILD250_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public services clarity + rosie-assets/CarPhotos runtime manifest -->

<!-- BUILD251_SYNC: 2026-08-11 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Gate C dark-theme readability + approved rosie-assets/CarPhotos context -->

<!-- Build 210 documentation sync -->
<!-- Build 211 documentation sync -->
<!-- Build 212 documentation sync -->
<!-- Build 213 documentation sync -->
<!-- Build 214 documentation sync -->
> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

> **Build 237 synchronization (2026-07-28):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.
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
