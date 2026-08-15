## Build 259 acceptance — editable media, vehicle-size review and quote operations

- [ ] Apply `sql/2026-08-13_build259_vehicle_size_review.sql` in staging before using vehicle-size review controls.
- [ ] Deploy Pages + Functions together and hard-refresh Services, Pricing, Maintenance Plan, Fleet, Photo Studio, Admin Booking and Admin Quotes.
- [ ] Confirm existing Photo Studio assignments are unchanged; verify new logo/banner/review/background/static-image/maintenance/add-on targets are selectable but unassigned until deliberately chosen.
- [ ] Open an add-on from Services; confirm the internal code is hidden, price/Quote Required and estimated added time fit inside the card, and process/details opens the owner-editable landing page.
- [ ] Review Paint Correction copy for test spots, clear-coat limits, multi-stage labour and condition-driven price escalation.
- [ ] Confirm Package Service Details headings do not overlap and the Services decision cards remain readable at desktop/tablet/phone widths.
- [ ] Edit Maintenance Plan information/waitlist/good-fit copy and assign a test hero image; confirm waitlist/fleet form fields stay inside their panels.
- [ ] Create an uncertain vehicle-size booking; verify staff can mark it verified without customer action.
- [ ] Create a harmless corrected size/price test; confirm the secure email link can confirm or cancel, expires, and cannot be reused.
- [ ] Open Quote Pipeline; select a row, edit/save it, create a test row, and confirm lead/customer/booking link fields persist.
- [ ] Confirm normal public/Photo Studio loads still perform no R2 enumeration; only explicit Sync may scan R2.

## Build 257 acceptance — Worker resource hotfix

- [ ] Deploy Pages + Functions together and hard-refresh `/admin-photo-studio`.
- [ ] Confirm opening Photo Studio does not trigger an R2 scan and returns the managed library promptly.
- [ ] Press **Sync approved R2 photos** once; confirm it returns a bounded scanned/inserted count rather than Error 1102.
- [ ] Open Services and one landing page; confirm `/api/public_website_images` returns compact JSON without enumerating R2.
- [ ] Confirm existing package images, explicit assignments and Before/After pairs remain unchanged.


## Build 256 Photo Studio acceptance
- Confirm an assigned thumbnail displays its human-readable target name.
- Confirm occupied dropdown targets show `✓`, including `— this photo` when applicable.
- Assign harmless test photos to one landing-page Set 1 Before and After target; confirm no block appears after only one side and a paired block appears only after both sides exist.
- Remove the test assignments and confirm the previous page imagery remains unchanged.
# Build 252 operational addition — specialist runbook

**Authority note:** Use `AI_PROJECT_HANDOFF.md` + `MASTER_VALUE_ROADMAP.md` for current state/direction. This file provides detailed acceptance steps only.

## 44. Validate approved public R2 image assignment

1. Deploy Build 252 Pages/Functions together. No Build 252 SQL migration is required.
2. Open `/api/public/website_images` and confirm it lists only `packages/`, `landing_pages/`, and `CarPhotos/`.
3. Confirm the response never contains a `DAIP_MEDIA_BUCKET` object, private raw project key, or private object URL.
4. Open `/services` and change Small → Mid → Oversize. Confirm the five principal service cards prefer the intended service/size images from `packages/`.
5. Verify add-on cards use descriptive package images where available.
6. Open Ceramic Coating, Pet Hair Removal, Odor Removal, Headlight Restoration, Paint Correction and several additional service pages. Confirm matching `landing_pages/` files become hero/gallery imagery.
7. Open Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi and Port Dover pages. Confirm local filename matches are used where uploaded.
8. Open the home page and confirm high-intent service/town cards receive appropriate photos without layout overlap at desktop and ~390px phone width.
9. If a wrong image wins, rename the R2 object with a clearer service/location phrase before creating a hard-coded override.
10. Run the full release check and one-H1 check before production promotion.

**Move on when:** approved R2 images appear in the intended service/package/location contexts, ambiguous files are identified for renaming, no private media is exposed, and no new mobile/CSS or SEO regression is introduced.

---

# Build 249 operational addition — specialist runbook

**Authority note:** Use `AI_PROJECT_HANDOFF.md` + `MASTER_VALUE_ROADMAP.md` for current state/direction. This file provides detailed execution steps only.

## 41. Recover inaccurate supplies/tools with reviewed Amazon refresh

1. Deploy Build 249 Pages/Functions together. No new Build 249 database migration is required.
2. Open `/admin-inventory-manager.html` and choose **Amazon repair candidates**.
3. Pick one known inaccurate row and choose **Amazon refresh**. Confirm `/admin-catalog.html?item=<same key>` loads that row in repair mode.
4. Confirm the item key is read-only/locked. Copy or paste the correct Amazon.ca/Amazon.com/a.co/amzn.to link into the supplier review box.
5. Choose which supplier fields may overwrite the current row: identity, classification, description, CAD price when available, and/or featured image.
6. Select **Review Amazon update**. Inspect every staged before/after field. Do not save if the Amazon page is the wrong variation/package.
7. Verify quantity, reorder point/quantity, purchase date, receipt URL, station, service tags, gallery, ratings, public visibility and active state are unchanged.
8. Save the inventory item and reload the Workbench. Confirm the original item key remains and the row leaves the repair queue when its data is complete.
9. Repeat with one Amazon.com/non-CAD example and confirm the observed foreign price does not overwrite the current CAD unit cost.
10. Only after rows are normalized, use the reviewed two-row merge workflow for genuine duplicates; do not hard-delete historical inventory rows.

**Move on when:** an existing bad row can be repaired from an accurate Amazon link without changing its inventory key or operational history, source metadata persists after save, and desktop/mobile repair links both return to the intended row.

---

# Build 248 operational addition — specialist runbook

**Authority note:** Use `AI_PROJECT_HANDOFF.md` + `MASTER_VALUE_ROADMAP.md` for current state/direction. This file provides detailed execution steps only.

## 40. Apply and accept Build 248 supplier-link + DAIP story-evidence controls

1. Apply `sql/2026-08-09_build248_supplier_daip_story_review.sql` after Build 247.
2. Open `/admin-catalog.html` and preview a harmless Amazon.ca URL, Amazon.com URL, and a.co/amzn.to share URL. None should return `TypeError: patterns is not iterable`.
3. Confirm source price/currency is shown separately and an observed non-CAD Amazon price is not silently stored as CAD cost.
4. Open `/admin-daip-media.html`, select a harmless uploaded asset, set capture stage/consent/story use, and save. Confirm raw media remains private.
5. Exercise retry/block/cancel/dead-letter on harmless processing jobs and confirm the raw asset remains intact.
6. Open `/admin-creative-projects.html`, approve a session, select private story media, generate reviewed draft plans, inspect readiness, then move the content-package gate through review.
7. Confirm the generated planning metadata contains private asset IDs/review state but no raw object URL and that no public publishing happens.

**Move on when:** supplier preview no longer 500s, Build 248 columns are present, private evidence/retry controls persist, the content-package gate works, and privacy/public-destination constraints remain intact.

---

# Startup and Go-Live Blocker Guide — Build 246 Addition

## 37. Complete catalog publishing-readiness acceptance

**Priority:** Blocker  
**Category:** Catalog and inventory  
**Where to find it:** `/admin-catalog.html`, `/admin-inventory-manager.html`, `/api/admin/catalog_readiness_report`, Supabase Table Editor → `catalog_publish_readiness_audit`

### Why this blocks launch

A product or inventory row should not appear publicly with an imported identifier as its name, no category or unit, no featured image, an SVG placeholder, inactive status, or no available consumable stock. Build 246 adds a shared readiness evaluator, server boundary filtering, a preview-first all-or-nothing publishing RPC, and audit history.

### Detailed instructions

1. Open Supabase Dashboard → SQL Editor.
2. Apply every outstanding migration in order, ending with `sql/2026-08-07_build246_catalog_publish_readiness.sql`.
3. Refresh the Supabase schema cache if the admin page still reports the RPC as missing.
4. Open `/admin-catalog.html`.
5. Choose **Blocked publishing** in the readiness filter.
6. Select one harmless staging row and correct its name, type, category, unit, featured image, active status and stock requirement.
7. Enter a specific audit reason of at least eight characters.
8. Select **Preview public readiness**.
9. Compare the listed blockers/warnings with `/api/admin/catalog_readiness_report`.
10. Confirm the selected row has no blockers; warnings may remain but should be reviewed.
11. Select **Publish ready selection**.
12. Open the public catalog in a private window and confirm only the intended ready row is visible.
13. Select a second incomplete test row together with a ready row.
14. Preview and then attempt the mixed publish.
15. Confirm the entire batch remains unchanged and the incomplete row stays private.
16. Open Supabase Table Editor → `catalog_publish_readiness_audit`.
17. Confirm preview, successful publish and blocked attempt records include safe reasons, counts and item keys.
18. Record only safe row IDs and results in the Startup evidence editor; do not paste credentials, customer data or private supplier receipts.

### Move to the next item when

Ready rows publish together, blocked rows remain private, a mixed batch changes nothing, public catalog filtering agrees with the readiness endpoint, and every attempt has shared audit evidence.

## Build 246 next 20

1. Apply the Build 246 migration in staging and refresh the Supabase schema cache.
2. Preview one ready inventory row and compare browser results with the readiness endpoint.
3. Publish one ready row and confirm the public catalog includes it.
4. Attempt a mixed ready/blocked publish and confirm the full batch remains unchanged.
5. Review the catalog publish-readiness audit row and preserve safe evidence.
6. Correct suspicious names, missing categories, units and featured images.
7. Complete cost, description, gallery and service-tag warnings for priority inventory.
8. Retest Block Calendar full-day, AM and PM behaviour against public booking.
9. Complete one full booking and admin reconciliation test.
10. Complete and refund a controlled Stripe payment and verify webhook evidence.
11. Verify booking, payment, consent and staff emails in external inboxes.
12. Audit Cloudflare variables, bindings, domains and rollback access.
13. Perform Supabase restore and Cloudflare rollback rehearsals.
14. Complete legal, media-consent, staff-permission and accessibility review.
15. Test booking, catalog, Startup and Inventory Workbench on real mobile devices.
16. Complete Search Console sitemap, canonical and structured-data inspection.
17. Align Google Business Profile categories, services, areas, hours and photo cadence.
18. Complete upload interruption/retry and duplicate-media acceptance.
19. Complete payment application, HST, month-end close and accountant-package review.
20. Run an invite-only soft launch and review every early transaction daily.

---

# Rosie Dazzlers Startup and Go-Live Blocker Guide — Build 245

**Updated:** 2026-08-06

## Build 245 deployment and UI acceptance

**Priority:** Launch blocker

### Where to find it

- `/admin-startup-guide.html#ui-health`
- `/admin-ui-health.html`
- Browser Developer Tools → Console, Network, Application → Service Workers and Cache Storage

### Detailed instructions

1. Deploy Build 245 to the preview branch.
2. Open the Startup Command Center in a private window.
3. In **UI & cache health**, confirm the fetched Startup script reports Build 245.
4. If an older build appears, select **Check for app update**. If it remains stale, use **Clear app cache & reload**.
5. Open **UI & SEO Health** and run the complete route scan.
6. Confirm every critical route returns successfully, has one H1, and has no missing local CSS, script or image.
7. Confirm public routes have descriptive titles, descriptions and canonical links.
8. Confirm protected admin routes include `noindex`.
9. Export the scan JSON and record its date, host, pass/fail counts and filename as safe Startup evidence.
10. Test representative routes at phone, tablet and desktop widths; the browser scan does not replace real responsive acceptance.

### Move to the next item when

The deployed scanner shows no unresolved error, the browser is loading Build 245 assets, and real-device review finds no blocking overflow, unreadable contrast or unusable controls.

---

# Rosie Dazzlers Startup and Go-Live Blocker Guide — Build 241

**Updated:** August 5, 2026  
**Primary interface:** `/admin-startup-guide.html`  
**Hotfix status:** Build 241 restores the unified interface after the summary renderer failed with `Cannot access evidenceRows before initialization`. No blocker or instruction was removed.

## Build 241 deployment acceptance

1. Deploy the Build 241 package to the preview branch.
2. Open `/admin-startup-guide.html` in a private/incognito window.
3. Open browser developer tools, choose **Console**, and reload the page.
4. Confirm there is no `evidenceRows before initialization` error.
5. Select **Refresh all** and confirm Overview, Blockers, Evidence, Production, Tests, Roadmap, and automatic checks continue loading even if one API is unavailable.
6. Confirm the page references `startup-command-center.js?v=20260805build241` in the Network panel.
7. Where an API is unavailable, confirm a clearly labelled packaged, browser-cache, or read-only fallback appears instead of a blank page.
8. Record the deployment URL, date, browser, and visible outcome in the Startup evidence note.

**Move to the next item when:** the Startup Command Center loads and refreshes without an uncaught promise error, its summary cards render, and unavailable services produce labelled fallbacks.

---

# Rosie Dazzlers Startup and Go-Live Blocker Guide — Build 239

**Updated:** August 1, 2026  
**Primary interface:** `/admin-startup-guide.html`  
**Purpose:** The single detailed authority for every known item holding back a confident launch. Build 239 preserves every Build 238 item and incorporates Launch Readiness, Production Readiness, guided production testing, current roadmap execution, SEO/local proof, and recovery work into one interface.

## How to use the single Startup Command Center

1. Open `/admin-startup-guide.html`. Do not maintain a separate preflight checklist elsewhere.
2. Start on **Overview**, then use **Blockers & instructions**, **Evidence**, **Production readiness**, **Guided tests**, **Next 20 roadmap**, and **SEO & local proof**.
3. Open the exact route or outside service listed for the current item.
4. Follow the numbered instructions in order. Never put passwords, API keys, card details, private customer content, or sensitive media in evidence notes.
5. Record safe evidence in the same Startup Command Center and move on only when the stated completion condition is true.
6. The old `/admin-launch-readiness`, `/admin-production`, `/admin-test-centre`, and `/admin-roadmap-execution` routes remain only as compatibility redirects to the appropriate Startup section.
7. Guided production acceptance tests are incorporated into the **Guided tests** section; they are no longer a separate current prelaunch checklist.

## Current launch position

- Source code includes a unified command centre, database-backed process catalog, packaged read-only fallback, shared evidence, production health, guided tests, current roadmap editing, transactional inventory tools, reviewed duplicate merge, and detailed recovery instructions.
- Source completion is not production proof. Migrations, deployment, payment/refund, notification delivery, backup/restore, rollback, legal review, real-device testing, accessibility, Search Console, Business Profile, inventory/product completion, and a controlled soft launch still require real evidence.
- Google does not provide a legitimate first-page guarantee. The durable direction remains accurate relevance, real service-area information, approved local proof, legitimate reviews, useful content, concise titles, one primary H1, strong mobile performance, and consistent business information.

## Ordered startup and go-live items

## 1. Deploy Build 239 and verify the unified Startup Command Center

**Priority:** Launch blocker  
**Category:** Deployment and CSS  
**Evidence key:** `deploy_239`

### Why this matters

Build 239 consolidates Startup, Launch Readiness, Production Readiness, guided testing, and roadmap execution into one protected interface. A partial or cached deployment could leave old standalone pages or mismatched assets active.

### Where to find it

- Cloudflare Pages → Deployments → preview branch
- /admin-startup-guide
- /admin-launch-readiness
- /admin-production
- /admin-test-centre
- Browser DevTools → Network and Console

### Detailed instructions

1. Deploy Build 239 to the preview/development branch.
2. Open /admin-startup-guide in a private browser window and press Ctrl+Shift+R.
3. Confirm the Overview, Blockers, Evidence, Production, Guided Tests, and Roadmap sections all load.
4. Open /admin-launch-readiness, /admin-production, and /admin-test-centre and confirm each forwards to the matching Startup Command Center section.
5. In DevTools Network, confirm /assets/site.css, AdminShell, AdminMenu, the startup catalog API, and readiness APIs return HTTP 200 or show a clearly labelled fallback.
6. Repeat the check at phone width and confirm the section navigation, cards, tables, dialogs, and action buttons remain usable.

### Move to the next item when

The unified Startup Command Center is the only normal prelaunch workspace, legacy readiness routes forward safely, all sections work on desktop and mobile, and no required CSS/script/API request fails.

---

## 2. Apply the Build 237 database migration

**Priority:** Launch blocker  
**Category:** Database migrations  
**Evidence key:** `migration_237`

### Why this matters

Shared launch evidence and the current roadmap cycle cannot persist until the new tables/columns exist. The UI has a safe local/static fallback, but shared evidence is the intended source of truth.

### Where to find it

- Supabase Dashboard → SQL Editor
- sql/2026-07-28_build237_css_startup_evidence_roadmap.sql
- Supabase Dashboard → Table Editor

### Detailed instructions

1. Open the SQL file from the build package.
2. Copy the complete file into Supabase SQL Editor.
3. Run it in staging/preview first.
4. Confirm app_launch_readiness_evidence and app_launch_readiness_evidence_audit exist.
5. Confirm app_roadmap_execution_items includes cycle_key, is_current_cycle and action_path.
6. Open /admin-launch-readiness and /admin-roadmap-execution and confirm database-backed results load.

### Move to the next item when

The two pages report shared/database evidence rather than browser-only fallback and the current Build 237 roadmap cycle appears.

---

## 3. Apply the Build 238 inventory transaction and merge migration

**Priority:** Launch blocker  
**Category:** Database migrations  
**Evidence key:** `migration_238`

### Why this matters

The new Inventory Workbench deliberately refuses to execute bulk changes or duplicate merges without database functions that validate the whole operation and record audit evidence. This prevents a browser/network failure from leaving half a batch changed.

### Where to find it

- Supabase Dashboard → SQL Editor
- sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql
- Supabase Dashboard → Database → Functions
- /admin-inventory-manager.html

### Detailed instructions

1. Confirm the Build 237 migration has already been applied.
2. Open sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql from the build package.
3. Copy the complete migration into Supabase SQL Editor and run it in staging/preview first.
4. Confirm catalog_inventory_change_batches, catalog_inventory_change_batch_rows and catalog_inventory_merge_audit exist.
5. Confirm admin_catalog_inventory_bulk_update and admin_catalog_inventory_merge appear under database functions.
6. Reload /admin-inventory-manager.html and preview a harmless batch without executing it.
7. Open Transaction & merge history and confirm it loads an empty or current shared audit view without a migration-required error.
8. Record the migration date and staging result in Launch Readiness evidence.

### Move to the next item when

Both new RPC functions can complete dry-run previews, the three audit tables exist, Transaction & merge history loads, and no browser sequential partial-save fallback is used.

---

## 4. Apply the Build 239 unified Startup Command Center migration

**Priority:** Launch blocker  
**Category:** Database migrations  
**Evidence key:** `migration_239`

### Why this matters

The detailed startup catalog should have one database source of truth instead of being duplicated across JSON, Markdown, launch-readiness cards, production checks, and roadmap notes. The static catalog remains only as a safe read-only fallback.

### Where to find it

- Supabase Dashboard → SQL Editor
- sql/2026-08-01_build239_unified_startup_command_center.sql
- Supabase Dashboard → Table Editor → app_startup_process_items
- /admin-startup-guide.html

### Detailed instructions

1. Confirm the Build 237 and Build 238 migrations have been applied.
2. Open sql/2026-08-01_build239_unified_startup_command_center.sql from the build package.
3. Run the complete migration in staging/preview first.
4. Confirm app_startup_process_items and app_startup_process_audit exist.
5. Confirm the table contains every current blocker and no Build 238 blocker was removed.
6. Reload /admin-startup-guide.html and confirm the source badge says Shared database catalog instead of Packaged fallback.
7. Change one evidence status, one guided test result, and one roadmap row; refresh on another browser/device and confirm the shared state remains.

### Move to the next item when

The Startup Command Center loads every detailed process from the database, all existing items remain present, shared evidence/tests/roadmap persist across devices, and the static JSON is used only during migration or outage.

---

## 5. Retest the repaired Block Calendar against public booking

**Priority:** Launch blocker  
**Category:** Booking and scheduling  
**Evidence key:** `block_calendar`

### Why this matters

Availability mistakes can cause double-booking or hide valid dates. A visual repair alone is not enough; save/remove behaviour must be proven against the public booking wizard.

### Where to find it

- /admin-blocks.html
- /book
- Supabase schedule block tables

### Detailed instructions

1. Choose a future date with no customer booking.
2. Create a full-day block and refresh the calendar.
3. Open /book in another tab and confirm that date is unavailable.
4. Remove the full-day block and confirm the date returns.
5. Create an AM-only block and confirm PM remains available.
6. Remove AM, create PM-only, and confirm AM remains available.
7. Remove the test block and record the tested date in Launch Readiness evidence.

### Move to the next item when

Full-date, AM and PM changes persist after refresh and the public booking wizard matches every admin change.

---

## 6. Complete one end-to-end booking test

**Priority:** Launch blocker  
**Category:** Booking and scheduling  
**Evidence key:** `booking_e2e`

### Why this matters

The complete path must work as one system: availability, vehicle, package, add-ons, customer details, deposit, confirmation and admin record.

### Where to find it

- /book
- /admin-booking.html
- Customer confirmation email/inbox

### Detailed instructions

1. Use a clearly labelled test customer and a future test date.
2. Complete every booking step on a phone-sized screen.
3. Confirm pricing, HST/deposit and selected options before payment.
4. Finish the booking and save the confirmation number.
5. Open Admin Booking and verify date, slot, vehicle, package, add-ons, customer and payment state.
6. Cancel or mark the test record according to your test-data policy.

### Move to the next item when

The customer and admin views agree and no manual database correction is needed.

---

## 7. Complete and refund a small live Stripe payment

**Priority:** Launch blocker  
**Category:** Payments  
**Evidence key:** `stripe_live`

### Why this matters

Test-mode success does not prove live keys, webhook secrets, receipts, refunds or accounting evidence are configured correctly.

### Where to find it

- /admin-payments.html
- Stripe Dashboard → Payments
- Stripe Dashboard → Developers → Webhooks
- /admin-accounting.html

### Detailed instructions

1. Confirm the deployment intentionally reports Stripe live mode.
2. Create a small real payment tied to a labelled test booking/quote.
3. Confirm the browser returns to the correct success page.
4. Verify the Stripe event reached the deployed webhook with HTTP 2xx.
5. Verify the payment appears in admin payment/accounting views.
6. Issue a full refund and confirm the refund event and final status.
7. Record only safe payment identifiers; never put card details in evidence notes.

### Move to the next item when

Payment, webhook, receipt, refund and accounting views agree on the final state.

---

## 8. Verify every required email reaches an external inbox

**Priority:** Launch blocker  
**Category:** Notifications  
**Evidence key:** `email_delivery`

### Why this matters

A successful API response does not prove customers or staff receive messages, and spam/mobile formatting failures can block operations.

### Where to find it

- /admin-notifications.html
- Notification provider dashboard
- External Gmail/Outlook inboxes

### Detailed instructions

1. Send a booking confirmation to an external test inbox.
2. Send payment/deposit, staff assignment and consent/review messages where applicable.
3. Check Inbox, Promotions and Spam/Junk folders.
4. Open each message on desktop and mobile.
5. Verify links go to the correct deployed domain and are not expired.
6. Record provider message IDs or timestamps without including private content.

### Move to the next item when

All required messages arrive, render clearly and contain working links.

---

## 9. Audit Cloudflare production variables and bindings

**Priority:** Launch blocker  
**Category:** Deployment and security  
**Evidence key:** `environment`

### Why this matters

Missing or preview-only variables are a common cause of login, payment, notification, storage and API failures after launch.

### Where to find it

- Cloudflare Dashboard → Workers & Pages → rosiedazzlers → Settings
- docs/CLOUDFLARE_ENVIRONMENT_CHECKLIST.md
- /api/health

### Detailed instructions

1. Open Variables and Secrets for both Preview and Production.
2. Verify Supabase URL/service key, Stripe keys/webhook secret, notification credentials, R2 bindings and public asset settings.
3. Confirm secrets are stored as encrypted secrets, not committed files.
4. Confirm custom domains point to the production deployment.
5. Open /api/health and record the non-secret environment/mode result.
6. Update the environment checklist with the exact Cloudflare screen where each setting lives.

### Move to the next item when

Every required integration has an intentional production value/binding and no secret is stored in the repository.

---

## 10. Test backup and restore, not just backup availability

**Priority:** Launch blocker  
**Category:** Recovery  
**Evidence key:** `backups`

### Why this matters

A backup is useful only when you know how to restore it and confirm permissions/data integrity afterward.

### Where to find it

- Supabase Dashboard → Database → Backups
- /admin-recovery.html
- docs/PRODUCTION_TEST_GUIDE.md

### Detailed instructions

1. Confirm the Supabase plan and backup retention available to the project.
2. Choose a safe staging restore method or export a small representative data set.
3. Restore to a staging project/schema or re-import selected test records.
4. Compare row counts and key relationships.
5. Test staff access and RLS through Cloudflare Functions after restore.
6. Write the exact recovery sequence, owner and expected maximum data-loss window.

### Move to the next item when

A documented rehearsal proves data can be recovered and accessed through the application boundary.

---

## 11. Review all policies before accepting unrestricted orders

**Priority:** Launch blocker  
**Category:** Policies and customer trust  
**Evidence key:** `legal`

### Why this matters

Booking, deposits, cancellations, driveway requirements, runoff/bylaw responsibility, media use and privacy must be clear before a customer commits.

### Where to find it

- /privacy.html
- /terms.html
- /refund-policy.html
- /book
- Footer policy links

### Detailed instructions

1. Read each policy as a customer, not as a developer.
2. Confirm business name, contact method, province and effective date.
3. Align cancellation/deposit/refund wording with the actual payment workflow.
4. Confirm photo/media consent is optional and visibility choices are clear.
5. Confirm power/water, driveway and local bylaw/service-condition wording matches operations.
6. Have a qualified Ontario professional review any wording that carries legal or tax risk.
7. Verify all policy links are visible from booking, checkout and footer.

### Move to the next item when

Published policy wording matches real operations and every checkout/booking link is easy to find.

---

## 12. Verify staff permissions, sessions and protected APIs

**Priority:** Launch blocker  
**Category:** Deployment and security  
**Evidence key:** `security`

### Why this matters

Admin pages and APIs contain customer, payment and operational data. Visual hiding is not authorization.

### Where to find it

- /admin-security.html
- /admin-app.html
- Browser DevTools
- Supabase Security Advisor

### Detailed instructions

1. Test Admin, Senior Detailer and Detailer accounts separately.
2. Confirm each role can access only intended pages/actions.
3. Call protected APIs while signed out and confirm 401/403 responses.
4. Sign out and confirm old pages cannot continue saving data.
5. Review Supabase Security Advisor and RLS posture.
6. Verify security headers on public and admin responses.
7. Record failures as blockers, not accepted warnings.

### Move to the next item when

Server-side authorization, session expiry/logout and database containment are proven for each role.

---

## 13. Complete real-device mobile testing

**Priority:** High priority  
**Category:** Mobile and accessibility  
**Evidence key:** `mobile`

### Why this matters

Responsive browser resizing does not fully test touch, on-screen keyboards, camera uploads, slow connections or mobile payment handoff.

### Where to find it

- Real phone browsers
- /book
- /admin-blocks.html
- /admin-inventory-manager.html
- /detailer-jobs.html

### Detailed instructions

1. Test portrait and landscape on a real phone.
2. Open/close the mobile dropdown menu on every core page.
3. Complete booking fields with the on-screen keyboard.
4. Test calendar tapping, inventory row/card editing and image upload/capture.
5. Confirm no horizontal page drift except intentional table/calendar scroll regions.
6. Test a slower network profile and retry behaviour.
7. Capture screenshots of any overlap or unreadable control.

### Move to the next item when

All primary customer and staff tasks can be completed without zooming, clipped controls or lost input.

---

## 14. Complete keyboard, focus, labels and contrast review

**Priority:** High priority  
**Category:** Mobile and accessibility  
**Evidence key:** `accessibility`

### Why this matters

Accessible forms reduce customer abandonment and also expose hidden UI/JavaScript problems before launch.

### Where to find it

- Public home/services/booking/payment pages
- Critical admin pages
- Browser accessibility tree

### Detailed instructions

1. Navigate every interactive control using Tab/Shift+Tab only.
2. Confirm visible focus never disappears behind sticky elements.
3. Verify each input has a useful label and each error is announced/readable.
4. Check heading order and confirm one H1 per exposed page.
5. Check colour contrast for text, buttons, notices and disabled states.
6. Test at 200% browser zoom.
7. Document exceptions with route, control and screenshot.

### Move to the next item when

Critical flows are usable by keyboard and at high zoom with clear labels, focus and errors.

---

## 15. Complete Search Console, sitemap, canonical and schema preflight

**Priority:** High priority  
**Category:** SEO and local visibility  
**Evidence key:** `search`

### Why this matters

The site already has strong local/service architecture, but indexing and structured-data evidence must be checked on the deployed canonical domain.

### Where to find it

- Google Search Console
- /sitemap.xml
- Google Rich Results Test
- Public page source

### Detailed instructions

1. Verify the rosiedazzlers.ca Search Console property.
2. Submit https://rosiedazzlers.ca/sitemap.xml.
3. Inspect the homepage, booking, primary service and town URLs.
4. Confirm canonical URLs use the production domain and preferred trailing-slash pattern.
5. Test LocalBusiness/Service/WebSite structured data and correct errors.
6. Review indexed pages for accidental admin/dev URLs.
7. Record real search queries monthly before rewriting titles.

### Move to the next item when

The sitemap is accepted, important pages are inspectable/indexable, admin pages are noindex and schema has no critical errors.

---

## 16. Complete and align Google Business Profile

**Priority:** High priority  
**Category:** SEO and local visibility  
**Evidence key:** `business_profile`

### Why this matters

Local visibility depends heavily on accurate relevance, distance/service-area and prominence signals; the profile must match the website and real business.

### Where to find it

- Google Business Profile Manager
- /contact.html
- /services.html
- Town/service landing pages

### Detailed instructions

1. Confirm the real-world business name without keyword stuffing.
2. Choose the most specific accurate primary category and relevant secondary categories.
3. Confirm service areas, phone, website and hours.
4. Add accurate services and descriptions that match the site.
5. Upload approved real photos regularly.
6. Create a review-request link and respond to reviews.
7. Compare profile information with footer/contact/schema data for consistency.

### Move to the next item when

The profile is verified, complete, accurate and consistent with the production website.

---

## 17. Clean inventory records before relying on product sales and job costing

**Priority:** High priority  
**Category:** Inventory and products  
**Evidence key:** `inventory_cleanup`

### Why this matters

Suspicious imported names, missing costs/categories and duplicates reduce customer trust and make pricing/profitability unreliable.

### Where to find it

- /admin-inventory-manager.html
- /admin-catalog.html
- Inventory Workbench filters

### Detailed instructions

1. Filter Suspicious names and replace ASIN/alphanumeric titles with clear product names.
2. Complete category, vendor, unit, cost and reorder point.
3. Confirm tool versus consumable classification.
4. Archive rows that are true duplicates only after checking history/references.
5. Leave unfinished rows inactive/private.
6. Export a CSV snapshot before large bulk changes.
7. Spot-check calculations after updates.

### Move to the next item when

Every active/sellable row has a clear name, classification, category, cost and intentional active/public state.

---

## 18. Complete product image sets and metadata

**Priority:** High priority  
**Category:** Inventory and products  
**Evidence key:** `product_images`

### Why this matters

Products need strong visual proof, but multiple images must remain ordered, descriptive, consent-safe and performant.

### Where to find it

- /admin-inventory-manager.html
- /admin-catalog.html
- Product public page/gallery

### Detailed instructions

1. Set one featured image that clearly shows the complete item.
2. Add up to seven gallery images covering detail, scale, packaging, use and variations.
3. Order images from strongest overview to supporting detail.
4. Write concise descriptive alt text rather than keyword lists.
5. Record image role, caption, source/provenance and consent where applicable.
6. Verify images load on mobile and do not cause layout shift.
7. Keep products private until the image set and customer-facing copy are ready.

### Move to the next item when

Every sellable product has a reliable featured image, useful gallery and accurate accessible metadata.

---

## 19. Verify pricing, deposits, HST and final totals

**Priority:** Launch blocker  
**Category:** Payments  
**Evidence key:** `pricing_tax`

### Why this matters

Customer-visible totals must match booking, checkout, receipts and accounting. Price drift is a launch blocker.

### Where to find it

- /pricing.html
- /book
- /admin-site-settings.html
- /admin-tax-review.html
- Stripe checkout

### Detailed instructions

1. Compare every package and add-on price in public pricing, booking and admin catalog.
2. Verify vehicle-size price differences.
3. Confirm deposit rules and cancellation/refund handling.
4. Verify HST calculation and rounding on representative totals.
5. Confirm Stripe checkout amount matches the final booking/quote.
6. Verify receipt and accounting entries use the same amounts.
7. Document who can change prices and how changes are reviewed.

### Move to the next item when

The same selected service produces the same subtotal, tax, deposit and total everywhere.

---

## 20. Verify analytics and conversion events in production

**Priority:** High priority  
**Category:** SEO and local visibility  
**Evidence key:** `analytics`

### Why this matters

You need trustworthy evidence before changing SEO, ads or booking UX, and consent settings must be respected.

### Where to find it

- /admin-analytics.html
- Browser DevTools
- Analytics provider real-time/debug view

### Detailed instructions

1. Accept and reject analytics consent and confirm expected script behaviour.
2. Trigger page view, package view, booking start, quote start, booking complete and payment events.
3. Confirm events use the production domain and useful non-private parameters.
4. Verify UTM/source values flow into lead/booking reporting.
5. Exclude internal/admin traffic where practical.
6. Record a baseline before launch marketing changes.

### Move to the next item when

Core conversion events arrive once, contain no sensitive customer data and can be tied to real acquisition sources.

---

## 21. Prepare production monitoring and incident response

**Priority:** High priority  
**Category:** Recovery  
**Evidence key:** `monitoring`

### Why this matters

During the first live bookings, failures must be noticed quickly and have a clear owner and rollback path.

### Where to find it

- /admin-production.html
- Cloudflare logs
- Supabase logs
- Stripe webhook logs
- KNOWN_GAPS_AND_RISKS.md

### Detailed instructions

1. Confirm where Cloudflare Function errors are viewed.
2. Confirm Supabase database/auth logs and Stripe webhook logs.
3. Define who checks failures during the first week and how often.
4. Write a stop-taking-bookings procedure.
5. Document rollback to the previous deployment.
6. Create an incident record for any payment, booking, privacy or data-loss failure.
7. Review logs daily during soft launch.

### Move to the next item when

A named owner can detect, classify, communicate and roll back a critical failure without searching for instructions.

---

## 22. Use an invite-only soft launch before unrestricted public promotion

**Priority:** Launch blocker  
**Category:** Go-live decision  
**Evidence key:** `operations`

### Why this matters

A controlled first group gives real evidence without exposing the business to a large volume of simultaneous failures.

### Where to find it

- /admin-launch-readiness.html
- /admin-today.html
- /admin-production.html
- Business operations calendar

### Detailed instructions

1. Resolve all critical blockers or explicitly document why a controlled exception is safe.
2. Invite only a small number of known customers.
3. Limit daily capacity to what can be manually supported.
4. Review each booking, payment, email, job update, inventory movement and review request.
5. Hold public advertising until the first transactions are stable.
6. Record incidents and fixes immediately.
7. Expand gradually after a defined stable period.

### Move to the next item when

Several real transactions complete without critical manual correction and monitoring evidence supports broader launch.

---

## 23. Test the reviewed duplicate inventory merge workflow

**Priority:** High priority  
**Category:** Inventory and products  
**Evidence key:** `inventory_merge_238`

### Why this matters

Build 238 now provides a preview-first merge that transfers known operational references, records compensating quantity movements and archives the duplicate. It still requires migration and staging proof before use on important rows.

### Where to find it

- /admin-inventory-manager.html
- Supabase → catalog_inventory_merge_audit
- Supabase → catalog_inventory_movements
- STARTUP_GO_LIVE_BLOCKERS.md

### Detailed instructions

1. Apply the Build 238 migration in staging.
2. Choose two harmless test rows that truly represent the same item and have no irreplaceable history.
3. Select exactly those two rows in Inventory Workbench and choose Review two-row merge.
4. Choose the survivor row and enter a clear reason.
5. Select Preview merge and inspect quantity, gallery count and every reference-count card.
6. Confirm the survivor should keep its current values when present and inherit only missing values.
7. Execute the merge, reload the page and verify the duplicate is inactive, private and zero quantity.
8. Verify purchase orders, movements, assignments, service links and project references point to the survivor where applicable.
9. Verify catalog_inventory_merge_audit contains before/after rows and the reason.
10. Open Transaction & merge history, confirm the merge appears with the correct survivor, archived duplicate, reason, actor, timestamp and transferred-reference counts, then export the audit CSV.

### Move to the next item when

A staging merge preserves history, transfers known references, records compensating quantity movements, archives rather than deletes the duplicate, and appears correctly in the read-only audit history/CSV.

---

## 24. Test transactional bulk inventory updates and rollback behaviour

**Priority:** High priority  
**Category:** Inventory and products  
**Evidence key:** `inventory_bulk_rpc_238`

### Why this matters

Build 238 replaces sequential browser saves with an all-or-nothing database function. The complete batch is validated before any write and records a batch header plus row-level before/after evidence.

### Where to find it

- /admin-inventory-manager.html
- Supabase → catalog_inventory_change_batches
- Supabase → catalog_inventory_change_batch_rows
- Cloudflare Function logs

### Detailed instructions

1. Apply the Build 238 migration in staging.
2. Select two harmless inventory test rows.
3. Choose a bulk field and value and enter a specific audit reason.
4. Select Preview batch and verify the message says no rows were changed.
5. Choose Apply transaction and confirm both rows change together.
6. Verify one batch header and two row evidence records exist.
7. Repeat with one deliberately invalid test value and confirm the entire transaction fails with neither row changed.
8. Open Transaction & merge history and confirm the successful batch shows the correct operation, row count, reason, actor and timestamp; export the audit CSV.
9. Restore the test values through another audited transaction.

### Move to the next item when

Valid batches update every selected row together, invalid batches change none, before/after evidence exists for every row, and the committed batch appears correctly in audit history/CSV.

---

## 25. Generate responsive product/gallery image derivatives

**Priority:** Planned next work  
**Category:** Media and performance  
**Evidence key:** `Roadmap status only`

### Why this matters

Seven original images can create slow mobile pages and layout instability without standardized dimensions and modern formats.

### Where to find it

- R2 derivative worker
- Media Health
- Product/gallery rendering

### Detailed instructions

1. Define canonical source-image rules and maximum upload size.
2. Generate thumbnail, card, medium and large dimensions.
3. Create WebP/AVIF with JPEG/PNG fallback where supported.
4. Store width, height, format and byte size metadata.
5. Render srcset/sizes and fixed aspect-ratio boxes.
6. Keep the original source private or archival according to policy.
7. Monitor failed derivative jobs and provide retry.

### Move to the next item when

Public product/gallery pages load appropriately sized images with stable layout and fallback formats.

---

## 26. Retire redundant Markdown only after release guards are modernized

**Priority:** Planned next work  
**Category:** Documentation  
**Evidence key:** `Roadmap status only`

### Why this matters

The project has many historical documents. Deleting them now can break release checks or erase evidence, but treating all of them as current creates confusion.

### Where to find it

- AI_PROJECT_HANDOFF.md
- MASTER_VALUE_ROADMAP.md
- DOC_INDEX.md
- scripts/release_check.py
- docs/archive

### Detailed instructions

1. Treat AI_PROJECT_HANDOFF.md and MASTER_VALUE_ROADMAP.md as the only living direction documents.
2. Mark operational/reference documents clearly.
3. Map which release checks read historical text markers.
4. Replace brittle text-marker guards with current file/route/API tests.
5. Move superseded documents into docs/archive rather than deleting them.
6. Update DOC_INDEX.md with canonical, operational and archive sections.
7. Run the complete release suite after each archive batch.

### Move to the next item when

A new developer can find current direction in two files and historical evidence remains available without controlling the roadmap.

---

## 27. Verify notification provider and delivery-queue health

**Priority:** Launch blocker  
**Category:** Production communications  
**Evidence key:** `notification_health`

### Why this matters

A configured email webhook is not enough. Queued or failed customer and staff messages can cause missed bookings, payment confusion, and consent failures.

### Where to find it

- /admin-startup-guide.html#production
- Cloudflare → Workers & Pages → Settings → Variables
- Notification provider dashboard

### Detailed instructions

1. Open the Startup Command Center Production section and refresh the report.
2. Confirm the email provider is configured before using Send test.
3. Use Check config only first, then send exactly one message to a Rosie-controlled external inbox.
4. Confirm the message arrives on desktop and mobile and inspect spam/junk.
5. Review failed and queued notification counts; repair the provider or retry path before launch.
6. Record the receive time and safe provider result in evidence without storing addresses, secrets, or message content.

### Move to the next item when

The provider test succeeds, the controlled inbox receives the message, and failed/queued notification counts are zero or have a documented accepted reason.

---

## 28. Verify hosted final-balance links, webhook evidence, and reconciliation

**Priority:** Launch blocker  
**Category:** Payments  
**Evidence key:** `payment_links`

### Why this matters

Customers need a dependable way to pay the remaining balance. A checkout URL alone is not proof that payment status, webhook processing, receipt, refund, and accounting records agree.

### Where to find it

- /admin-startup-guide.html#production
- Stripe Dashboard → Developers → Webhooks
- /admin-accounting.html

### Detailed instructions

1. Create a small internal final-balance request.
2. From the Production section, create a hosted checkout link and confirm the amount, currency, branding, and customer reference.
3. Complete the test in Stripe test mode first, then perform the separately approved small live-payment test.
4. Confirm webhook receipt, payment-request status, receipt, ledger/journal evidence, and customer/admin history agree.
5. Issue the planned test refund and confirm the refund appears in Stripe and the application records.
6. Record only safe IDs, timestamps, and outcomes in Startup evidence.

### Move to the next item when

A hosted link works, payment and refund webhooks are recorded, receipt and accounting evidence agree, and the manual fallback remains available.

---

## 29. Prove mobile photo/video upload interruption and recovery

**Priority:** High priority  
**Category:** Field reliability  
**Evidence key:** `upload_recovery`

### Why this matters

Detailing proof and customer updates are captured in the field, where connections can be weak. Silent loss or duplicate media would damage trust and job records.

### Where to find it

- /admin-startup-guide.html#tests
- /detailer-jobs.html
- /admin-startup-guide.html#production

### Detailed instructions

1. Use a test booking and non-sensitive photo/video on a real phone.
2. Upload a small photo and confirm visible progress and completion.
3. Begin a short video upload, switch networks or briefly interrupt connectivity, and confirm a useful retry/cancel state appears.
4. Restore connectivity and retry once.
5. Confirm the final media exists once, has the correct visibility, and any failed session appears in Production readiness for review.
6. Record device, browser, connection type, approximate file size, and outcome.

### Move to the next item when

Photo and video uploads show progress, interruption produces a recoverable state, retry does not duplicate media, and failed sessions are visible to staff.

---

## 30. Complete media retention, legal-hold, and cleanup review

**Priority:** High priority  
**Category:** Privacy and storage  
**Evidence key:** `retention_review`

### Why this matters

Unlimited storage increases cost and privacy exposure, while aggressive deletion could remove proof needed for disputes, taxes, or consent records.

### Where to find it

- /admin-startup-guide.html#production
- /admin-media.html
- Supabase/R2 storage dashboards

### Detailed instructions

1. Open the Production section and run retention in dry-run mode only.
2. Review every candidate by booking, media type, stage, consent, incident/legal-hold status, and retention policy.
3. Confirm permanent proof and legal-hold items are excluded.
4. Correct any missing policy or expiry date before marking records for review.
5. Approve deletion only through the documented storage-cleanup process; do not manually delete referenced objects.
6. Record candidate counts, exclusions, reviewer, and date.

### Move to the next item when

Dry-run candidates are explainable, protected evidence is excluded, referenced objects are not orphaned, and an approved cleanup/restore procedure is documented.

---

## 31. Verify incident closeout, privacy, and review-request safety

**Priority:** Launch blocker  
**Category:** Customer protection  
**Evidence key:** `incident_closeout`

### Why this matters

An unresolved issue or private incident note must never be exposed to a customer or followed immediately by an automated review request.

### Where to find it

- /admin-startup-guide.html#tests
- /admin-incident-reports.html
- /admin-workflow.html
- Customer progress link in a private browser

### Detailed instructions

1. Create a harmless internal test incident on a test booking.
2. Confirm staff-only notes and evidence remain hidden from the signed-out customer progress view.
3. Publish only specifically approved customer-safe wording.
4. Confirm booking closeout or review-request automation is blocked while the incident is unresolved.
5. Resolve the test incident with an auditable decision and verify the review workflow follows the documented policy.
6. Remove or archive test data according to the test-data policy.

### Move to the next item when

Private material never appears to the customer, unresolved incidents block unsafe closeout/review automation, and resolution creates complete audit evidence.

---

## 32. Complete a deployment rollback and incident-response drill

**Priority:** Launch blocker  
**Category:** Deployment and recovery  
**Evidence key:** `rollback_drill`

### Why this matters

Backups protect data, but a bad frontend/function deployment also needs a fast, rehearsed rollback path with owners and verification steps.

### Where to find it

- Cloudflare Pages → Deployments
- /admin-startup-guide.html#production
- STARTUP_GO_LIVE_BLOCKERS.md
- docs/PRODUCTION_TEST_GUIDE.md

### Detailed instructions

1. Choose a safe preview deployment and identify the previous known-good deployment.
2. Document who can trigger rollback and where the control is located.
3. Roll preview back or promote a known-good preview in a controlled rehearsal.
4. Verify home, booking, login, Block Calendar, Startup Command Center, payment endpoint health, and database connectivity after rollback.
5. Restore the latest build and repeat the smoke check.
6. Record timestamps, owner, deployment IDs, observed downtime, and any missing permissions.

### Move to the next item when

A named owner can restore a known-good deployment, critical smoke tests pass after rollback, and the written incident path is usable without guessing.

---

## 33. Establish an approved local-photo, review, and Business Profile cadence

**Priority:** High priority  
**Category:** Local SEO and trust  
**Evidence key:** `local_proof_cadence`

### Why this matters

Local visibility depends on accurate relevance signals and real prominence. Fresh approved work, complete profile information, and legitimate reviews are more valuable than duplicated keyword pages.

### Where to find it

- /admin-startup-guide.html#blockers
- Google Business Profile → Photos, Services, Reviews, Performance
- /gallery.html
- /admin-gallery.html
- Search Console

### Detailed instructions

1. Confirm the Business Profile name, primary category, service areas, phone, hours, website, and services match the live site and real-world operation.
2. Replace the highest-value public placeholders with Rosie-owned, consent-approved before/after work.
3. Add descriptive alt text and connect proof to the relevant service/town page without duplicating thin pages.
4. Create a repeatable post-job review request that follows Google policy and pauses for unresolved incidents.
5. Schedule a weekly profile/photo/review-response check and a monthly Search Console/local landing-page review.
6. Record the first completed cycle and the next review date.

### Move to the next item when

The profile and website agree, priority pages show authentic approved proof, review requests are policy-safe, and a repeatable local visibility cadence has an owner.

---

## 34. Retire duplicate preflight navigation and train staff on one Startup Command Center

**Priority:** High priority  
**Category:** Documentation and operations  
**Evidence key:** `startup_single_interface`

### Why this matters

Even correct checks become unreliable when staff must guess between Startup Guide, Launch Readiness, Production, Guided Tests, and Roadmap pages.

### Where to find it

- /admin-startup-guide.html
- Admin Menu
- AI_PROJECT_HANDOFF.md
- STARTUP_GO_LIVE_BLOCKERS.md

### Detailed instructions

1. Confirm the Admin Menu has one Startup Command Center entry.
2. Confirm old readiness URLs forward to the appropriate Startup section and remain available only for compatibility.
3. Update internal instructions, bookmarks, and screenshots to use /admin-startup-guide.html.
4. Train each staff role on Overview, Blockers, Evidence, Production, Tests, and Roadmap tabs.
5. Confirm permissions allow required staff to view or update only the sections they are authorized to use.
6. After one complete test cycle, remove duplicate wording from living documentation while retaining historical release evidence.

### Move to the next item when

Staff use one interface for launch work, legacy links forward safely, permissions are correct, and no current document instructs staff to maintain a separate preflight checklist.

---

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- Historical release guard marker: Startup and Go-Live Blocker Guide — Build 238 -->

<!-- Historical release synchronization markers retained for automated guards. -->
Build 210 documentation sync
Build 211 documentation sync
Build 212 documentation sync
Build 213 documentation sync
Build 214 documentation sync
> **Build 238 synchronization (2026-07-30):** Historical release evidence retained; current launch authority is Build 239.


## Build 240 additions — preserved items 35 and 36

### 35. Apply and verify the Build 240 transactional inventory posting migration

**Priority:** blocker  
**Category:** Inventory and operations  
**Open:** `/admin-inventory-posting.html`

**Why this holds launch:** Booking and Creative Project material usage must no longer depend on separate browser writes. Build 240 moves preview, shortage validation, stock mutation, movement evidence, reservation status, idempotency and reversal links into one database transaction.

**Where to find it**

- Supabase Dashboard → SQL Editor
- sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql
- Supabase Dashboard → Database → Functions
- /admin-inventory-posting.html

**Detailed instructions**

1. Confirm Builds 235, 237, 238 and 239 migrations have been applied in order.
2. Open the complete Build 240 SQL migration from the ZIP.
3. Run it in staging/preview first and do not edit individual statements.
4. Confirm catalog_inventory_posting_batches and catalog_inventory_posting_rows exist.
5. Confirm admin_catalog_inventory_post and admin_catalog_inventory_post_reverse appear under Database Functions.
6. Refresh the Supabase schema cache if the admin page reports that the RPC is missing.
7. Open /admin-inventory-posting.html and preview one harmless booking posting without committing.
8. Load one reviewed Creative Project reservation and confirm shortages or conflicts are explained before posting.
9. Record the migration date and staging result in the Startup evidence editor.

**Move to the next item when:** The two tables and two RPC functions exist, previews load from the shared database, a reviewed project reservation can be validated without changing stock, and the interface no longer reports migration required.

### 36. Complete transactional inventory posting and authorized reversal acceptance testing

**Priority:** blocker  
**Category:** Inventory and accounting  
**Open:** `/admin-inventory-posting.html`

**Why this holds launch:** The feature is not production-ready until one committed booking posting, one reviewed project posting, one shortage rejection, one idempotent replay and one compensating reversal have been observed with correct quantities and audit evidence. Booking reversals also require accounting review because stock restoration does not automatically erase journal history.

**Where to find it**

- /admin-inventory-posting.html
- /admin-progress.html
- /admin-creative-projects.html
- /admin-accounting.html
- Supabase Dashboard → Table Editor → catalog_inventory_posting_batches

**Detailed instructions**

1. Choose a low-risk staging inventory item and record its starting quantity.
2. Preview a booking posting and confirm the before/after quantity and total lines are correct.
3. Commit once, refresh history, and confirm the quantity decreased exactly once.
4. Repeat the same request with the same idempotency key and confirm stock does not decrease again.
5. Preview a quantity greater than stock and confirm the whole transaction is rejected with no row changed.
6. Create or use a reviewed Creative Project reservation, preview it, commit it, and confirm the reservation becomes posted/inventory_mutated.
7. Open Transaction History, choose the test batch, enter a specific reversal reason, and preview the compensating return.
8. Commit the reversal and confirm quantity returns, the original movement is marked reversed, a return movement exists, and the project reservation returns to reviewed where applicable.
9. For a booking reversal, open Accounting and review or reverse the related COGS journal evidence rather than deleting it.
10. Save screenshots or record IDs without customer secrets in Startup evidence.

**Move to the next item when:** All acceptance cases pass, duplicate submission cannot double-deduct stock, shortages leave every row unchanged, reversals preserve original and compensating history, and booking accounting evidence is reviewed.

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->


## Build 242 update

- Repaired `/admin-daip-intake-dry-run` contrast and card styling.
- Replaced many SVG-only visual placeholders with reusable local raster photo-style placeholders.
- Advanced Startup Command Center cache-busting and service-worker references to Build 242.
- No new database migration was introduced in this build.

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->
## 38. Create and bind the private DAIP R2 bucket

**Priority:** blocker  
**Category:** DAIP and media  
**Open:** `/admin-daip-media.html#setup`

**Why this holds DAIP launch:** Raw customer/project masters must not be uploaded into the publicly served `rosie-assets` bucket. The Build 247 intake APIs intentionally fail closed until a private R2 bucket is bound to the Pages project as `DAIP_MEDIA_BUCKET`.

**Where to find it**
- Cloudflare Dashboard → R2 Object Storage
- Cloudflare Dashboard → Workers & Pages → Rosie Dazzlers Pages project → Settings → Bindings
- `/admin-daip-media.html#setup`
- `DAIP_R2_MEDIA_SETUP_GUIDE.md`

**Detailed instructions**
1. Sign in to the Cloudflare account that owns the Rosie Dazzlers Pages project.
2. Open **R2 Object Storage**.
3. Select **Create bucket**.
4. Use `rosie-daip-media` as the recommended bucket name.
5. Create the bucket and leave public `r2.dev` access disabled.
6. Do not attach a public custom domain to this bucket.
7. Open **Workers & Pages** and select the Rosie Dazzlers Pages project.
8. Open **Settings → Bindings**.
9. Select **Add binding → R2 bucket**.
10. Enter `DAIP_MEDIA_BUCKET` as the variable/binding name.
11. Select `rosie-daip-media` and save.
12. Repeat for Preview and Production environments if Cloudflare presents them separately.
13. Redeploy the Pages project; bindings are not retroactively added to an already-running deployment.
14. Open `/admin-daip-media.html`.
15. Confirm **Private R2 binding** reports Ready.
16. Do not paste R2 credentials, secrets, signed links or private object URLs into Startup evidence.

**Move to the next item when:** The bucket exists, has no public endpoint, the Pages deployment contains the `DAIP_MEDIA_BUCKET` binding, and DAIP Media Intake reports that the private R2 binding is ready.

## 39. Complete DAIP large-media multipart and recovery acceptance

**Priority:** blocker  
**Category:** DAIP and media  
**Open:** `/admin-daip-media.html`

**Why this holds DAIP launch:** The three historical projects should not be imported until one harmless test confirms that large raw files can survive interruption, remain private, complete exactly once and create the expected downstream processing records.

**Detailed instructions**
1. Apply `sql/2026-08-07_build247_daip_private_media_ingestion.sql` in **staging first**.
2. In Supabase Table Editor confirm these tables exist: `daip_project_media_assets`, `daip_media_upload_sessions`, `daip_media_upload_parts`, `daip_media_processing_jobs`.
3. Create or select a harmless Creative Project for acceptance testing.
4. Upload one non-sensitive JPG. Confirm the progress reaches 100% and the asset status becomes `uploaded`.
5. In Supabase confirm its object key starts `projects/<project_uuid>/raw/photos/` and `public_destination_enabled=false`.
6. Select a harmless video larger than 300 MB.
7. Start upload and allow several 32 MiB parts to complete.
8. Interrupt the connection or close the page.
9. Return to DAIP Media Intake, select the same project and reselect the exact same local file.
10. Resume. Confirm recorded parts are skipped rather than uploaded again.
11. Finish the upload and verify the raw object is stored under `projects/<project_uuid>/raw/video/`.
12. Confirm rows exist for `proxy_video`, `frame_extract`, `audio_extract`, `transcript`, `scene_analysis`, `metadata_extract`, `privacy_review`, and `content_candidate_index`.
13. Re-select the same completed file and confirm the UI reports it is already present instead of creating a duplicate raw master.
14. Start a second harmless incomplete upload and test **Abort**. Confirm only that incomplete multipart session is aborted.
15. Confirm a completed raw master cannot be deleted or aborted from the intake screen.
16. Record safe test date/project code/outcome in Startup evidence. Do not record private filenames if they identify a customer.

**Move to the next item when:** A >300 MB test video resumes from completed parts, completes privately exactly once, processing jobs are created, duplicate import is blocked, incomplete abort works, and a completed raw original remains protected.

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->

<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Specialist runbook: STARTUP_GO_LIVE_BLOCKERS.md | Inventory recovery: reviewed existing-row Amazon refresh -->



## 42. Validate simplified Services path and approved CarPhotos

**Priority:** high  
**Category:** Public UX, media and SEO  
**Open:** `/services` and `/api/public/car_photos`

**Why this matters:** Visitors who do not know detailing terminology should be able to choose a vehicle size, understand the five main packages and start booking without navigating duplicate charts or the broader service hub. Approved public Rosie photos should replace generic fallback imagery without ever reading private DAIP media.

**Detailed instructions**
1. Deploy Build 250 Pages and Functions together and hard-refresh `/services`.
2. Open `/api/public/car_photos`; confirm `bucket_ready=true` and the expected `CarPhotos/` objects are listed.
3. If the endpoint reports no binding, add the existing `rosie-assets` bucket to the Pages project using one supported public binding alias and redeploy.
4. Confirm the vehicle-size selector is prominent at desktop and phone widths and that changing size updates the five package prices.
5. Confirm Premium Wash, Basic Detail, Complete Detail, Interior Detail and Exterior Detail appear before Full Service Hub.
6. Confirm `Open price chart` and `Open details chart` are absent from Services; detailed comparison remains available through Pricing.
7. Confirm each main package shows the intended service-matched `CarPhotos/` image when a descriptive filename exists. If a filename is ambiguous, rename it to include the service phrase and redeploy/refresh.
8. Temporarily test one missing package image and confirm fallback uses an approved Rosie car photo before the intentional `service-photo-needed.svg` placeholder.
9. Check the goal-based chooser at 1440px, 1024px, 768px and ~390px widths; cards and buttons must not overlap or drift.
10. Complete one Services → Book journey on phone width without opening Pricing and record whether any step is unclear.

**Move to the next item when:** A first-time visitor can understand size → main package → booking, principal images are real approved Rosie assets where available, no private media is exposed, and mobile/desktop layouts remain stable.

<!-- BUILD250_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public services clarity + rosie-assets/CarPhotos runtime manifest -->

> **Build 237 synchronization (2026-07-28):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.
<!-- BUILD251_SYNC: 2026-08-11 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Gate C dark-theme readability + approved rosie-assets/CarPhotos context -->
<!-- BUILD252_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public packages/landing_pages/CarPhotos R2 assignment -->


## 43. Validate Gate C readability
Historical Build 251 compatibility marker; current acceptance is superseded by Build 252 item 44 while Gate C readability remains required.


---

## Validate Build 253 Photo Management Studio

**Priority:** High-value staging acceptance  
**Category:** Public media / admin tooling  
**Evidence key:** `photo_studio_253`

### Why this matters

Build 253 makes public website imagery owner-manageable instead of source-code-dependent. The database migration, public R2 isolation, explicit assignment precedence, metadata persistence, rename/move safety, and public-page rendering all need one controlled staging proof before normal use.

### Detailed instructions

1. Apply `sql/2026-08-12_build253_photo_management_studio.sql` in staging.
2. Deploy Pages and Functions together and hard-refresh `/admin-photo-studio`.
3. Confirm `/api/public_website_images` returns JSON and lists only approved public website prefixes.
4. Press **Sync approved R2 photos** and confirm known `packages/`, `landing_pages/`/`landing-pages/`, and `CarPhotos/` assets appear.
5. Select one harmless image and save a label, useful alt text, title/caption, tags and focal point. Refresh and confirm persistence.
6. Assign that image to one harmless package/card/page target. Confirm the exact public placement uses the assigned photo, alt text and focal point.
7. Remove the assignment and confirm automatic filename matching resumes.
8. Move/rename one harmless test image within approved public folders. Confirm the media record and assignment survive and the old R2 key is removed only after the database update succeeds.
9. Verify no private DAIP object, key, customer filename or signed/raw URL appears in the public manifest.
10. Record the test image/target and outcome without including private customer-identifying media.

### Move to the next item when

Photo Studio can sync, edit metadata, assign/unassign, rename/move and render one approved public image end-to-end; the canonical manifest works at `/api/public_website_images`; and public/private media isolation is proven.

<!-- BUILD253_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Photo Studio: /admin-photo-studio.html | Public manifest: /api/public_website_images | Migration: sql/2026-08-12_build253_photo_management_studio.sql -->


## Build 254 — Verify existing imagery preservation and Photo Studio performance

1. Deploy Build 254 and hard-refresh `/services` and one existing service/location landing page.
2. Confirm principal package cards display their established configured images unless an explicit Photo Studio override exists.
3. Confirm add-on cards retain their established images.
4. Open `/admin-photo-studio`, press **Sync approved R2 photos**, and confirm merely syncing does not change any public card.
5. Select several thumbnails and type in Search. Confirm the editor updates without rebuilding/jumping the whole page; occasional browser layout diagnostics may occur, but the repeated forced-reflow warnings from selection should no longer reproduce.
6. Save one harmless explicit override, verify only that exact target changes, then remove the override and verify the original configured image returns.

**Move on when:** existing site images stay stable during R2 sync/metadata edits, explicit overrides affect only their selected target, and Photo Studio remains responsive on desktop/mobile.
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images protected; explicit Photo Studio override only; automatic R2 matching fallback-only; Photo Studio reflow hotfix. -->

<!-- BUILD255_SYNC: 2026-08-12 | Photo Studio click-to-edit drawer + explicit grouped website target dropdown; no automatic image reassignment. -->
<!-- BUILD256_SYNC: 2026-08-12 | Photo assignment labels + checked occupied targets + explicit Before/After pairs; no automatic image reassignment. -->

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->

## Validate Build 258 public photo consistency and cleanup

- Deploy Pages and Functions together; hard-refresh the modified public/admin pages.
- Open Photo Studio without Sync and confirm Build 257 resource protections remain stable.
- Run one explicit R2 Sync and verify both new-photo and refreshed-existing-photo counts.
- Verify Pricing town/high-intent cards and Services hub/special/town cards reflect explicit assignments.
- Verify FAQ access-card and Gift Card visuals.
- Verify Home/Pricing/Services/landing review-proof slots can be assigned.
- Verify multiple complete Before/After sets plus Evidence/Technique/Efficiency items render in Gallery.
- Verify assigned images cannot be deleted; verify one harmless unassigned duplicate can be deleted from library + public R2.
- Verify `Which service should we choose?` is three/two/one columns across desktop/tablet/phone.
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->
