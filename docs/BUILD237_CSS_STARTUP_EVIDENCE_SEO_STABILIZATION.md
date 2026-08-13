# Build 237 — Roadmap CSS, Startup Guide, Shared Launch Evidence and SEO Stabilization

**Date:** 2026-07-28

## Completed in this build

1. Repaired `/admin-roadmap-execution` by replacing missing `/assets/styles.css` and `/assets/admin.css` references with the current `/assets/site.css`.
2. Added the missing `admin-shell.js` dependency to pages that called `AdminShell.boot`.
3. Repaired every remaining HTML reference to missing `styles.css`, `admin.css`, or `style.css`.
4. Added compatibility stylesheet shims for cached/historical HTML.
5. Added an emergency minimal admin CSS fallback inside `assets/admin-shell.js`.
6. Rebuilt Roadmap Execution as a responsive current-cycle workspace with search, filters, exact action paths, row editing and static fallback.
7. Added `data/build237_next_steps.json` as a read-only outage/migration fallback.
8. Added current-cycle roadmap schema fields and seeded the next 20 steps.
9. Added shared audited launch-readiness evidence tables.
10. Added protected launch evidence list/save APIs.
11. Migrated Launch Readiness from browser-only confirmation state to DB-first evidence with browser fallback.
12. Required an evidence note before an item can be verified.
13. Added `/admin-startup-guide.html` and clean-route copy.
14. Added `STARTUP_GO_LIVE_BLOCKERS.md` with exact routes and detailed instructions.
15. Added Startup Guide links to Admin Menu, Admin Shell, Roadmap and Launch Readiness.
16. Added a Startup Guide visual placeholder and registry entry.
17. Added noindex protection to internal admin pages that lacked it.
18. Added homepage `WebSite` structured data and refreshed the shared CSS asset version.
19. Added a Build 237 CSS/dependency/schema/route/Markdown release guard.
20. Synchronized canonical schema, roadmap, known gaps, handoff, image and all retained Markdown files.

## Database migration

Apply `sql/2026-07-28_build237_css_startup_evidence_roadmap.sql` in staging before relying on shared launch evidence or the Build 237 current roadmap cycle. The UI remains usable with safe fallbacks before migration.

## Current next 20

1. **Deploy Build 237 CSS and admin-page dependency repair to preview** — Deploy the preview branch, hard-refresh /admin-roadmap-execution, and confirm site.css plus AdminShell load with no 404 or ReferenceError.
2. **Apply Build 237 roadmap-cycle and launch-evidence migration in staging** — Run sql/2026-07-28_build237_css_startup_evidence_roadmap.sql in Supabase SQL Editor, then refresh the schema cache and open both Roadmap Execution and Launch Readiness.
3. **Verify Block Calendar full-date, AM and PM save/remove behaviour** — Create and remove one future full-date block, one AM block and one PM block; verify the public booking wizard reflects each change immediately.
4. **Complete a production-like end-to-end booking and admin verification** — Use a test customer, select date/vehicle/package/add-ons, finish the booking, then verify booking, calendar, customer and staff records.
5. **Complete and refund a small live Stripe transaction** — Confirm live key mode, complete a small payment, verify webhook and receipt evidence, issue a refund, and reconcile the result.
6. **Verify booking, payment, staff and consent email delivery** — Send each notification type to an external inbox, inspect spam and mobile rendering, and record provider/message evidence without storing secrets.
7. **Audit Cloudflare production variables, bindings, domains and branch settings** — Compare production and preview environment names, verify Supabase/Stripe/R2 bindings, and document the exact location of each required variable.
8. **Conduct and document a Supabase backup-and-restore rehearsal** — Confirm backup coverage, restore a safe staging copy or selected records, validate row counts and permissions, and record the recovery steps.
9. **Review and publish customer policies and consent wording** — Review privacy, terms, cancellation, refund, media consent, cookie and service-condition wording; link them from booking, checkout and footer.
10. **Complete real-device mobile workflow testing** — Test home, services, booking, payment, customer progress, Block Calendar, inventory and uploads on at least one iPhone-size and one Android-size viewport/device.
11. **Complete accessibility keyboard, focus, contrast and form-error review** — Keyboard-test public and critical admin flows, verify visible focus, labels, error announcements, touch targets, heading order and contrast.
12. **Submit sitemap and validate canonical URLs and structured data** — Verify Search Console ownership, submit sitemap.xml, inspect index coverage, test home/local/service structured data, and correct canonical inconsistencies.
13. **Verify Google Business Profile service-area information and local proof** — Confirm business name, category, service area, hours, phone, website, services, photos and review link match the live site and real-world business.
14. **Clean suspicious inventory names, categories, costs and inactive duplicates** — Use Inventory Workbench filters, correct customer-facing names, complete costs/categories, archive true duplicates and preserve rows with operational history.
15. **Complete featured and gallery image metadata for sellable products** — For each sellable product set one featured image and up to seven ordered gallery images, then complete descriptive alt text, captions, role and consent/provenance notes.
16. **Replace high-value public visual placeholders with approved local proof** — Prioritize homepage, ceramic coating, paint correction, interior, local town pages, gallery and booking trust areas using Rosie-owned approved images.
17. **Add reviewed duplicate inventory merge and transfer workflow** — Design a preview-only merge that transfers references and stock history, records audit evidence and never hard-deletes an item with operational links.
18. **Replace sequential bulk inventory saves with a transactional RPC** — Create a validated all-or-nothing Supabase RPC with per-row errors, actor audit, rollback behaviour and a dry-run preview.
19. **Run invite-only soft launch and inspect every early transaction** — Accept a small known-customer group, watch bookings/payments/messages/media/inventory/logs daily, and stop expansion if any critical workflow fails.
20. **Modernize historical release guards and archive redundant Markdown safely** — Map every release-guard dependency, replace historical text-marker checks with current feature checks, then move obsolete docs to docs/archive without deleting evidence.

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
