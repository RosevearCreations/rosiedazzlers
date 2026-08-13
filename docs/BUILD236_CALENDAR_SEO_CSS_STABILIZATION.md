# Build 236 — Block Calendar, CSS, SEO and Launch Stabilization

**Date:** 2026-07-26  
**Release type:** no-DDL stabilization and launch-readiness pass  
**Primary regression fixed:** Block Calendar layout and schedule-data compatibility

## Why this build was necessary

The uploaded Build 235 package contained a truncated shared stylesheet. The Block Calendar markup still existed, but its calendar, admin-shell, responsive, overflow, and shared visual rules were missing. Several schedule readers also still queried older `block_date` and `slot_code` names even though the retained production schema uses `blocked_date` and `slot`. That combination could make the page look unlike its earlier version and make saved blocks appear inconsistently across admin and public booking screens.

## Completed in Build 236

1. Restored the complete shared stylesheet from the last known full CSS baseline instead of the truncated stylesheet that caused admin and public drift.
2. Preserved later responsive, live-workflow, media, accessibility, and visual-placeholder rules while restoring the missing shared shell rules.
3. Restored the Block Calendar's full monthly grid, availability colours, blocked-date states, partial AM/PM states, legend, cards, and responsive layout.
4. Added Previous month, Today, Next month, and Reload controls to the Block Calendar.
5. Added current-month counts for available dates, fully blocked dates, partially blocked dates, and block records.
6. Added a selected-date action panel for blocking or unblocking the full day, AM, or PM without leaving the calendar.
7. Added an API health/status indicator so staff can distinguish a schedule-data failure from an empty calendar.
8. Changed the calendar loader to the legacy-compatible `/api/admin/blocks_list` endpoint used by the current production schema.
9. Repaired booking availability reads so `date_blocks.blocked_date` and `slot_blocks.blocked_date/slot` are used instead of obsolete `block_date/slot_code` columns.
10. Repaired booking-form schedule data and kept compatibility aliases for older UI code.
11. Repaired admin/dashboard schedule summaries so current block rows are counted consistently.
12. Aligned all block create/range/list endpoints with the current legacy schema while preserving accepted alias payloads.
13. Restored the legacy-admin fallback on block-management endpoints so the existing password workflow continues during the staff-auth transition.
14. Changed date serialization to local calendar dates to avoid UTC offsets moving a selected date backward or forward.
15. Added keyboard-focus, selected-date, today, and `aria-pressed` states to the calendar.
16. Added busy states to calendar mutation buttons to reduce duplicate submissions.
17. Restored shared mobile navigation, overflow protection, minimum-width safeguards, responsive form grids, and safe button wrapping that had disappeared with the truncated CSS.
18. Added Build 236 visual-placeholder types for the Block Calendar, Inventory Workbench, Launch Readiness, product galleries, and local-service proof.
19. Added shared automatic loading of the visual-placeholder runtime so missing approved imagery is represented consistently instead of leaving unexplained blank areas.
20. Expanded the Launch Readiness Command Center to verify the schedule API and link directly to Block Calendar, Inventory Workbench, existing Inventory Workflow, and Content Center.
21. Restored shared Help Articles and protected Content Center navigation markers required by the historical release guard and useful to customers/staff.
22. Bumped the service-worker cache so deployed clients receive the restored CSS and calendar code rather than a stale cached copy.
23. Synchronized `.html` and clean-route copies for the changed admin pages.
24. Documented this as a no-DDL stabilization pass; no new database migration is required.
25. Added a Build 236 regression guard covering calendar markup, schedule-column compatibility, CSS restoration, route parity, docs, and one-H1 preservation.

## Additional shared regressions recovered

26. Restored the complete shared admin authorization map, including conversions, payments, media health, accounting, DAIP, docs, content and current operational routes.
27. Restored the complete shared Admin Menu and retained the newer Inventory Workbench and Launch Readiness entries.
28. Restored the full shared admin shell, including Conversion, Inventory, Inventory Workbench, Launch Readiness and Accounting shortcuts.
29. Restored editable public business profile, navigation/footer settings, LocalBusiness schema injection, compact mobile-menu behaviour, professional-image fallback and consent-aware analytics loading in `assets/chrome.js`.
30. Restored the editable analytics event registry in `assets/public-analytics.js`, including configured event labels/categories.

## Database and deployment

No new DDL is required. Build 236 uses the existing:

- `date_blocks(blocked_date, reason, created_at)`
- `slot_blocks(blocked_date, slot, reason, created_at)`

Deploy the code, allow the updated service-worker cache to activate, then perform the full-date and AM/PM live checks in `docs/PRODUCTION_TEST_GUIDE.md`.

## Current SEO and competitive direction checked 2026-07-26

The current direction remains sound: dedicated service and town pages, visible pricing/context, direct booking and estimate paths, authentic local proof, useful FAQ/help content, LocalBusiness structured data, Product structured data only where products are actually sold, descriptive image metadata, stable responsive media, and people-first content. Build 236 does not promise first-page ranking; it restores the technical and content foundations that make pages crawlable, understandable, usable, and measurable.

Current external references reviewed:

- Google Search Central — LocalBusiness structured data: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Google Search Central — general structured data guidelines: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Google Search Central — Product structured data: https://developers.google.com/search/docs/appearance/structured-data/product
- Google Search Central — image SEO best practices: https://developers.google.com/search/docs/appearance/google-images
- Google Search Central — Core Web Vitals: https://developers.google.com/search/docs/appearance/core-web-vitals
- Google Search Central — helpful, reliable, people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Wash Me Now service/booking presentation: https://www.washmenow.ca/
- LV's Car Detailing service detail pages: https://lvscardetail.com/

## Markdown sanity decision

Only two Markdown files are living strategy sources:

1. `AI_PROJECT_HANDOFF.md` — current architecture, safeguards, implementation state, deployment and continuity.
2. `MASTER_VALUE_ROADMAP.md` — current business priorities, completed work, launch sequence and next steps.

The following are maintained as operational/audit references, not competing roadmaps: `KNOWN_GAPS_AND_RISKS.md`, `SANITY_CHECK.md`, `DEVELOPMENT_ROADMAP.md`, `CURRENT_IMPLEMENTATION_STATE.md`, `DOC_INDEX.md`, `README.md`, `IMAGES.md`, `DATABASE_STRUCTURE_CURRENT.md`, `SUPABASE_SCHEMA.sql`, and `docs/PRODUCTION_TEST_GUIDE.md`.

Older files remain in place because historical release guards and audit links still reference them. Do not add new strategy to them. Move them into `docs/archive/` only after the release guards have been modernized and dependency-scanned.

## Next update — at least 20 connected steps

1. Deploy Build 236 to the development/preview branch and open Block Calendar on desktop and a real phone.
2. Create and remove one future full-date block, then confirm the public booking wizard removes and restores that date.
3. Create and remove one AM block and one PM block, confirming only the intended slot disappears from public availability.
4. Apply the Build 235 seven-image gallery migration in staging if it has not already been applied, then verify featured and gallery persistence.
5. Complete a full customer booking from public availability through admin receipt and customer confirmation.
6. Complete a small live Stripe payment and refund, verifying webhook settlement, receipt delivery, and accounting evidence.
7. Test booking, payment, staff, consent, and reminder emails against controlled external inboxes and record delivery evidence.
8. Audit Cloudflare production variables, Pages bindings, Supabase service credentials, R2 bindings, branch settings, and custom domains.
9. Perform and document a Supabase backup/restore drill using harmless staging data.
10. Review and version-stamp privacy, terms, cancellation, refund, media-consent, and cookie policy pages for Ontario operations.
11. Run real-device mobile tests for booking, payment, Block Calendar, Inventory Workbench, image upload, and staff navigation.
12. Complete a keyboard, focus, label, contrast, form-error, and screen-reader landmark accessibility pass on public conversion pages.
13. Submit and inspect the sitemap in Google Search Console; verify canonical URLs, indexing exclusions, and one-H1 page titles.
14. Verify Google Business Profile hours, phone, website, service areas, services, primary category, and current photos.
15. Validate LocalBusiness structured data on location/contact pages and Product structured data only on genuine sellable product pages.
16. Run a production broken-link, redirect, missing-image, and mixed-content crawl across public and authenticated routes.
17. Record PageSpeed/Core Web Vitals baselines for Home, Services, Book, Gallery, and primary town pages; fix the largest image/layout/JavaScript causes first.
18. Replace highest-value visual placeholders with approved Rosie-owned local photos, beginning with service heroes, add-ons, regional pages, and proof galleries.
19. Complete alt text, caption, role, order, consent, and provenance metadata for product galleries of up to seven images.
20. Add or verify WebP/AVIF responsive derivatives, dimensions, lazy loading, and stable aspect-ratio placeholders for public media.
21. Run the Inventory Workbench suspicious-name and duplicate review; correct customer-facing names before enabling public visibility.
22. Design and test a reversible duplicate-merge workflow that preserves stock movements, purchase history, project references, and audit evidence.
23. Complete transactional inventory reservation/posting/reversal design for standard jobs and opt-in projects without mutating stock during draft planning.
24. Connect reviewed consent-reminder records to the notification approval queue and verify no unapproved media is published.
25. Add generated-draft comparison/restore and destination-readiness checks while keeping all social/commerce publishing approval-only.
26. Add CSV archive exports for projects, inventory, gallery metadata, payment evidence, and launch-preflight results.
27. Create production monitoring alerts and a first-week incident playbook for API failures, payment exceptions, email failures, and booking conflicts.
28. Run an invite-only soft launch with a small known customer group and review every booking, payment, message, photo, and inventory movement.
29. Review first-week evidence, resolve repeated friction, and only then expand public marketing and paid promotion.
30. Modernize release guards so redundant historical Markdown can be moved into `docs/archive/` without losing audit coverage.

## Automated validation

- Cloudflare Pages Functions static check passed across 552 JavaScript files.
- Historical release guards from Build 159 through Build 232 passed after restoring the shared regressions.
- Build 236 calendar/CSS/schedule guard passed.
- Public one-H1 scan passed.
- Changed route copies and shared asset mirrors match.
- JavaScript syntax and ZIP integrity are checked before release.

Static validation cannot replace the deployed schedule, booking, payment, email, backup, accessibility, security, and real-device tests listed above.

## Sanity conclusion

The application is broad enough to begin a controlled soft launch after the real booking, payment, email, backup, legal, mobile, security, and schedule tests are completed. The highest-value work is no longer another large subsystem. It is proving the existing customer journey end to end, replacing the most visible placeholders with approved local evidence, cleaning inventory/product data, and watching the first transactions closely while development continues in the background.

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
