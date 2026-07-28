# Rosie Dazzlers Startup and Go-Live Blockers

**Build:** 237  
**Updated:** 2026-07-28  
**Purpose:** Work through every known launch blocker in a clear order. This document is intentionally detailed because settings and controls can be difficult to locate.

> This is the canonical startup document. Use `/admin-startup-guide.html` for the searchable in-app version and `/admin-launch-readiness.html` to record shared evidence after applying the Build 237 migration.

## How to use this document

1. Work through items marked **Launch blocker** first.
2. Open the exact route or dashboard named under **Where to find it**.
3. Complete every numbered instruction.
4. Record a safe evidence note in Launch Readiness.
5. Update the matching Roadmap Execution row.
6. Do not store secrets, payment card data, private customer media or signed/private URLs in evidence notes.

## 1. Deploy the Roadmap Execution CSS and dependency repair

**Priority:** Launch blocker  
**Category:** Deployment and CSS

**Why this matters**

The deployed page references CSS files that do not exist and calls AdminShell without loading admin-shell.js. The page can appear completely unstyled and its data-loading code can stop before authentication finishes.

**Where to find it**

- `/admin-roadmap-execution`
- `Cloudflare Pages → Deployments → preview branch`
- `Browser DevTools → Network and Console`

**Detailed instructions**

1. Deploy Build 237 to the preview/development branch.
2. Open /admin-roadmap-execution in a private browser window and sign in.
3. Press Ctrl+Shift+R to bypass the old service-worker/browser cache.
4. In DevTools Network, filter for CSS and confirm /assets/site.css returns HTTP 200.
5. In Console, confirm there is no 'AdminShell is not defined' or stylesheet 404 error.
6. Repeat at /admin-roadmap-execution.html and confirm both routes look identical.

**Move to the next item when**

The page has the dark Rosie admin theme, the menu renders, roadmap cards are readable on desktop/mobile, and no required CSS/script request fails.

## 2. Apply the Build 237 database migration

**Priority:** Launch blocker  
**Category:** Database migrations

**Why this matters**

Shared launch evidence and the current roadmap cycle cannot persist until the new tables/columns exist. The UI has a safe local/static fallback, but shared evidence is the intended source of truth.

**Where to find it**

- `Supabase Dashboard → SQL Editor`
- `sql/2026-07-28_build237_css_startup_evidence_roadmap.sql`
- `Supabase Dashboard → Table Editor`

**Detailed instructions**

1. Open the SQL file from the build package.
2. Copy the complete file into Supabase SQL Editor.
3. Run it in staging/preview first.
4. Confirm app_launch_readiness_evidence and app_launch_readiness_evidence_audit exist.
5. Confirm app_roadmap_execution_items includes cycle_key, is_current_cycle and action_path.
6. Open /admin-launch-readiness and /admin-roadmap-execution and confirm database-backed results load.

**Move to the next item when**

The two pages report shared/database evidence rather than browser-only fallback and the current Build 237 roadmap cycle appears.

## 3. Retest the repaired Block Calendar against public booking

**Priority:** Launch blocker  
**Category:** Booking and scheduling

**Why this matters**

Availability mistakes can cause double-booking or hide valid dates. A visual repair alone is not enough; save/remove behaviour must be proven against the public booking wizard.

**Where to find it**

- `/admin-blocks.html`
- `/book`
- `Supabase schedule block tables`

**Detailed instructions**

1. Choose a future date with no customer booking.
2. Create a full-day block and refresh the calendar.
3. Open /book in another tab and confirm that date is unavailable.
4. Remove the full-day block and confirm the date returns.
5. Create an AM-only block and confirm PM remains available.
6. Remove AM, create PM-only, and confirm AM remains available.
7. Remove the test block and record the tested date in Launch Readiness evidence.

**Move to the next item when**

Full-date, AM and PM changes persist after refresh and the public booking wizard matches every admin change.

## 4. Complete one end-to-end booking test

**Priority:** Launch blocker  
**Category:** Booking and scheduling

**Why this matters**

The complete path must work as one system: availability, vehicle, package, add-ons, customer details, deposit, confirmation and admin record.

**Where to find it**

- `/book`
- `/admin-booking.html`
- `Customer confirmation email/inbox`

**Detailed instructions**

1. Use a clearly labelled test customer and a future test date.
2. Complete every booking step on a phone-sized screen.
3. Confirm pricing, HST/deposit and selected options before payment.
4. Finish the booking and save the confirmation number.
5. Open Admin Booking and verify date, slot, vehicle, package, add-ons, customer and payment state.
6. Cancel or mark the test record according to your test-data policy.

**Move to the next item when**

The customer and admin views agree and no manual database correction is needed.

## 5. Complete and refund a small live Stripe payment

**Priority:** Launch blocker  
**Category:** Payments

**Why this matters**

Test-mode success does not prove live keys, webhook secrets, receipts, refunds or accounting evidence are configured correctly.

**Where to find it**

- `/admin-payments.html`
- `Stripe Dashboard → Payments`
- `Stripe Dashboard → Developers → Webhooks`
- `/admin-accounting.html`

**Detailed instructions**

1. Confirm the deployment intentionally reports Stripe live mode.
2. Create a small real payment tied to a labelled test booking/quote.
3. Confirm the browser returns to the correct success page.
4. Verify the Stripe event reached the deployed webhook with HTTP 2xx.
5. Verify the payment appears in admin payment/accounting views.
6. Issue a full refund and confirm the refund event and final status.
7. Record only safe payment identifiers; never put card details in evidence notes.

**Move to the next item when**

Payment, webhook, receipt, refund and accounting views agree on the final state.

## 6. Verify every required email reaches an external inbox

**Priority:** Launch blocker  
**Category:** Notifications

**Why this matters**

A successful API response does not prove customers or staff receive messages, and spam/mobile formatting failures can block operations.

**Where to find it**

- `/admin-notifications.html`
- `Notification provider dashboard`
- `External Gmail/Outlook inboxes`

**Detailed instructions**

1. Send a booking confirmation to an external test inbox.
2. Send payment/deposit, staff assignment and consent/review messages where applicable.
3. Check Inbox, Promotions and Spam/Junk folders.
4. Open each message on desktop and mobile.
5. Verify links go to the correct deployed domain and are not expired.
6. Record provider message IDs or timestamps without including private content.

**Move to the next item when**

All required messages arrive, render clearly and contain working links.

## 7. Audit Cloudflare production variables and bindings

**Priority:** Launch blocker  
**Category:** Deployment and security

**Why this matters**

Missing or preview-only variables are a common cause of login, payment, notification, storage and API failures after launch.

**Where to find it**

- `Cloudflare Dashboard → Workers & Pages → rosiedazzlers → Settings`
- `docs/CLOUDFLARE_ENVIRONMENT_CHECKLIST.md`
- `/api/health`

**Detailed instructions**

1. Open Variables and Secrets for both Preview and Production.
2. Verify Supabase URL/service key, Stripe keys/webhook secret, notification credentials, R2 bindings and public asset settings.
3. Confirm secrets are stored as encrypted secrets, not committed files.
4. Confirm custom domains point to the production deployment.
5. Open /api/health and record the non-secret environment/mode result.
6. Update the environment checklist with the exact Cloudflare screen where each setting lives.

**Move to the next item when**

Every required integration has an intentional production value/binding and no secret is stored in the repository.

## 8. Test backup and restore, not just backup availability

**Priority:** Launch blocker  
**Category:** Recovery

**Why this matters**

A backup is useful only when you know how to restore it and confirm permissions/data integrity afterward.

**Where to find it**

- `Supabase Dashboard → Database → Backups`
- `/admin-recovery.html`
- `docs/PRODUCTION_TEST_GUIDE.md`

**Detailed instructions**

1. Confirm the Supabase plan and backup retention available to the project.
2. Choose a safe staging restore method or export a small representative data set.
3. Restore to a staging project/schema or re-import selected test records.
4. Compare row counts and key relationships.
5. Test staff access and RLS through Cloudflare Functions after restore.
6. Write the exact recovery sequence, owner and expected maximum data-loss window.

**Move to the next item when**

A documented rehearsal proves data can be recovered and accessed through the application boundary.

## 9. Review all policies before accepting unrestricted orders

**Priority:** Launch blocker  
**Category:** Policies and customer trust

**Why this matters**

Booking, deposits, cancellations, driveway requirements, runoff/bylaw responsibility, media use and privacy must be clear before a customer commits.

**Where to find it**

- `/privacy.html`
- `/terms.html`
- `/refund-policy.html`
- `/book`
- `Footer policy links`

**Detailed instructions**

1. Read each policy as a customer, not as a developer.
2. Confirm business name, contact method, province and effective date.
3. Align cancellation/deposit/refund wording with the actual payment workflow.
4. Confirm photo/media consent is optional and visibility choices are clear.
5. Confirm power/water, driveway and local bylaw/service-condition wording matches operations.
6. Have a qualified Ontario professional review any wording that carries legal or tax risk.
7. Verify all policy links are visible from booking, checkout and footer.

**Move to the next item when**

Published policy wording matches real operations and every checkout/booking link is easy to find.

## 10. Verify staff permissions, sessions and protected APIs

**Priority:** Launch blocker  
**Category:** Deployment and security

**Why this matters**

Admin pages and APIs contain customer, payment and operational data. Visual hiding is not authorization.

**Where to find it**

- `/admin-security.html`
- `/admin-app.html`
- `Browser DevTools`
- `Supabase Security Advisor`

**Detailed instructions**

1. Test Admin, Senior Detailer and Detailer accounts separately.
2. Confirm each role can access only intended pages/actions.
3. Call protected APIs while signed out and confirm 401/403 responses.
4. Sign out and confirm old pages cannot continue saving data.
5. Review Supabase Security Advisor and RLS posture.
6. Verify security headers on public and admin responses.
7. Record failures as blockers, not accepted warnings.

**Move to the next item when**

Server-side authorization, session expiry/logout and database containment are proven for each role.

## 11. Complete real-device mobile testing

**Priority:** High priority  
**Category:** Mobile and accessibility

**Why this matters**

Responsive browser resizing does not fully test touch, on-screen keyboards, camera uploads, slow connections or mobile payment handoff.

**Where to find it**

- `Real phone browsers`
- `/book`
- `/admin-blocks.html`
- `/admin-inventory-manager.html`
- `/detailer-jobs.html`

**Detailed instructions**

1. Test portrait and landscape on a real phone.
2. Open/close the mobile dropdown menu on every core page.
3. Complete booking fields with the on-screen keyboard.
4. Test calendar tapping, inventory row/card editing and image upload/capture.
5. Confirm no horizontal page drift except intentional table/calendar scroll regions.
6. Test a slower network profile and retry behaviour.
7. Capture screenshots of any overlap or unreadable control.

**Move to the next item when**

All primary customer and staff tasks can be completed without zooming, clipped controls or lost input.

## 12. Complete keyboard, focus, labels and contrast review

**Priority:** High priority  
**Category:** Mobile and accessibility

**Why this matters**

Accessible forms reduce customer abandonment and also expose hidden UI/JavaScript problems before launch.

**Where to find it**

- `Public home/services/booking/payment pages`
- `Critical admin pages`
- `Browser accessibility tree`

**Detailed instructions**

1. Navigate every interactive control using Tab/Shift+Tab only.
2. Confirm visible focus never disappears behind sticky elements.
3. Verify each input has a useful label and each error is announced/readable.
4. Check heading order and confirm one H1 per exposed page.
5. Check colour contrast for text, buttons, notices and disabled states.
6. Test at 200% browser zoom.
7. Document exceptions with route, control and screenshot.

**Move to the next item when**

Critical flows are usable by keyboard and at high zoom with clear labels, focus and errors.

## 13. Complete Search Console, sitemap, canonical and schema preflight

**Priority:** High priority  
**Category:** SEO and local visibility

**Why this matters**

The site already has strong local/service architecture, but indexing and structured-data evidence must be checked on the deployed canonical domain.

**Where to find it**

- `Google Search Console`
- `/sitemap.xml`
- `Google Rich Results Test`
- `Public page source`

**Detailed instructions**

1. Verify the rosiedazzlers.ca Search Console property.
2. Submit https://rosiedazzlers.ca/sitemap.xml.
3. Inspect the homepage, booking, primary service and town URLs.
4. Confirm canonical URLs use the production domain and preferred trailing-slash pattern.
5. Test LocalBusiness/Service/WebSite structured data and correct errors.
6. Review indexed pages for accidental admin/dev URLs.
7. Record real search queries monthly before rewriting titles.

**Move to the next item when**

The sitemap is accepted, important pages are inspectable/indexable, admin pages are noindex and schema has no critical errors.

## 14. Complete and align Google Business Profile

**Priority:** High priority  
**Category:** SEO and local visibility

**Why this matters**

Local visibility depends heavily on accurate relevance, distance/service-area and prominence signals; the profile must match the website and real business.

**Where to find it**

- `Google Business Profile Manager`
- `/contact.html`
- `/services.html`
- `Town/service landing pages`

**Detailed instructions**

1. Confirm the real-world business name without keyword stuffing.
2. Choose the most specific accurate primary category and relevant secondary categories.
3. Confirm service areas, phone, website and hours.
4. Add accurate services and descriptions that match the site.
5. Upload approved real photos regularly.
6. Create a review-request link and respond to reviews.
7. Compare profile information with footer/contact/schema data for consistency.

**Move to the next item when**

The profile is verified, complete, accurate and consistent with the production website.

## 15. Clean inventory records before relying on product sales and job costing

**Priority:** High priority  
**Category:** Inventory and products

**Why this matters**

Suspicious imported names, missing costs/categories and duplicates reduce customer trust and make pricing/profitability unreliable.

**Where to find it**

- `/admin-inventory-manager.html`
- `/admin-catalog.html`
- `Inventory Workbench filters`

**Detailed instructions**

1. Filter Suspicious names and replace ASIN/alphanumeric titles with clear product names.
2. Complete category, vendor, unit, cost and reorder point.
3. Confirm tool versus consumable classification.
4. Archive rows that are true duplicates only after checking history/references.
5. Leave unfinished rows inactive/private.
6. Export a CSV snapshot before large bulk changes.
7. Spot-check calculations after updates.

**Move to the next item when**

Every active/sellable row has a clear name, classification, category, cost and intentional active/public state.

## 16. Complete product image sets and metadata

**Priority:** High priority  
**Category:** Inventory and products

**Why this matters**

Products need strong visual proof, but multiple images must remain ordered, descriptive, consent-safe and performant.

**Where to find it**

- `/admin-inventory-manager.html`
- `/admin-catalog.html`
- `Product public page/gallery`

**Detailed instructions**

1. Set one featured image that clearly shows the complete item.
2. Add up to seven gallery images covering detail, scale, packaging, use and variations.
3. Order images from strongest overview to supporting detail.
4. Write concise descriptive alt text rather than keyword lists.
5. Record image role, caption, source/provenance and consent where applicable.
6. Verify images load on mobile and do not cause layout shift.
7. Keep products private until the image set and customer-facing copy are ready.

**Move to the next item when**

Every sellable product has a reliable featured image, useful gallery and accurate accessible metadata.

## 17. Verify pricing, deposits, HST and final totals

**Priority:** Launch blocker  
**Category:** Payments

**Why this matters**

Customer-visible totals must match booking, checkout, receipts and accounting. Price drift is a launch blocker.

**Where to find it**

- `/pricing.html`
- `/book`
- `/admin-site-settings.html`
- `/admin-tax-review.html`
- `Stripe checkout`

**Detailed instructions**

1. Compare every package and add-on price in public pricing, booking and admin catalog.
2. Verify vehicle-size price differences.
3. Confirm deposit rules and cancellation/refund handling.
4. Verify HST calculation and rounding on representative totals.
5. Confirm Stripe checkout amount matches the final booking/quote.
6. Verify receipt and accounting entries use the same amounts.
7. Document who can change prices and how changes are reviewed.

**Move to the next item when**

The same selected service produces the same subtotal, tax, deposit and total everywhere.

## 18. Verify analytics and conversion events in production

**Priority:** High priority  
**Category:** SEO and local visibility

**Why this matters**

You need trustworthy evidence before changing SEO, ads or booking UX, and consent settings must be respected.

**Where to find it**

- `/admin-analytics.html`
- `Browser DevTools`
- `Analytics provider real-time/debug view`

**Detailed instructions**

1. Accept and reject analytics consent and confirm expected script behaviour.
2. Trigger page view, package view, booking start, quote start, booking complete and payment events.
3. Confirm events use the production domain and useful non-private parameters.
4. Verify UTM/source values flow into lead/booking reporting.
5. Exclude internal/admin traffic where practical.
6. Record a baseline before launch marketing changes.

**Move to the next item when**

Core conversion events arrive once, contain no sensitive customer data and can be tied to real acquisition sources.

## 19. Prepare production monitoring and incident response

**Priority:** High priority  
**Category:** Recovery

**Why this matters**

During the first live bookings, failures must be noticed quickly and have a clear owner and rollback path.

**Where to find it**

- `/admin-production.html`
- `Cloudflare logs`
- `Supabase logs`
- `Stripe webhook logs`
- `KNOWN_GAPS_AND_RISKS.md`

**Detailed instructions**

1. Confirm where Cloudflare Function errors are viewed.
2. Confirm Supabase database/auth logs and Stripe webhook logs.
3. Define who checks failures during the first week and how often.
4. Write a stop-taking-bookings procedure.
5. Document rollback to the previous deployment.
6. Create an incident record for any payment, booking, privacy or data-loss failure.
7. Review logs daily during soft launch.

**Move to the next item when**

A named owner can detect, classify, communicate and roll back a critical failure without searching for instructions.

## 20. Use an invite-only soft launch before unrestricted public promotion

**Priority:** Launch blocker  
**Category:** Go-live decision

**Why this matters**

A controlled first group gives real evidence without exposing the business to a large volume of simultaneous failures.

**Where to find it**

- `/admin-launch-readiness.html`
- `/admin-today.html`
- `/admin-production.html`
- `Business operations calendar`

**Detailed instructions**

1. Resolve all critical blockers or explicitly document why a controlled exception is safe.
2. Invite only a small number of known customers.
3. Limit daily capacity to what can be manually supported.
4. Review each booking, payment, email, job update, inventory movement and review request.
5. Hold public advertising until the first transactions are stable.
6. Record incidents and fixes immediately.
7. Expand gradually after a defined stable period.

**Move to the next item when**

Several real transactions complete without critical manual correction and monitoring evidence supports broader launch.

## 21. Build a reviewed duplicate inventory merge workflow

**Priority:** Planned next work  
**Category:** Inventory and products

**Why this matters**

Soft archive prevents data loss, but duplicates still fragment stock, costs and history. A safe merge must transfer references rather than delete blindly.

**Where to find it**

- `Future Inventory Workbench merge assistant`
- `MASTER_VALUE_ROADMAP.md`

**Detailed instructions**

1. Choose a survivor and duplicate in preview mode.
2. List every booking/project/stock/purchase/image reference attached to each row.
3. Show proposed quantity/cost/image decisions.
4. Require an administrator reason and confirmation.
5. Transfer references transactionally and create an audit record.
6. Archive the duplicate only after verification.
7. Provide reversal/compensating action where possible.

**Move to the next item when**

Duplicate rows can be consolidated without losing operational history or silently changing totals.

## 22. Replace sequential bulk saves with a transactional inventory RPC

**Priority:** Planned next work  
**Category:** Inventory and products

**Why this matters**

Sequential browser saves can partially succeed, leaving a batch in an uncertain state after network or validation failure.

**Where to find it**

- `Supabase RPC`
- `/admin-inventory-manager.html`
- `Inventory audit tables`

**Detailed instructions**

1. Define a whitelist of bulk-editable fields.
2. Validate every row before changing any row.
3. Return row-specific validation errors in dry-run mode.
4. Apply all valid changes in one transaction.
5. Record actor, before/after values and batch identifier.
6. Roll back the entire batch on an unexpected failure.
7. Keep CSV export as pre-change evidence.

**Move to the next item when**

Bulk changes are all-or-nothing, auditable and previewable.

## 23. Generate responsive product/gallery image derivatives

**Priority:** Planned next work  
**Category:** Media and performance

**Why this matters**

Seven original images can create slow mobile pages and layout instability without standardized dimensions and modern formats.

**Where to find it**

- `R2 derivative worker`
- `Media Health`
- `Product/gallery rendering`

**Detailed instructions**

1. Define canonical source-image rules and maximum upload size.
2. Generate thumbnail, card, medium and large dimensions.
3. Create WebP/AVIF with JPEG/PNG fallback where supported.
4. Store width, height, format and byte size metadata.
5. Render srcset/sizes and fixed aspect-ratio boxes.
6. Keep the original source private or archival according to policy.
7. Monitor failed derivative jobs and provide retry.

**Move to the next item when**

Public product/gallery pages load appropriately sized images with stable layout and fallback formats.

## 24. Retire redundant Markdown only after release guards are modernized

**Priority:** Planned next work  
**Category:** Documentation

**Why this matters**

The project has many historical documents. Deleting them now can break release checks or erase evidence, but treating all of them as current creates confusion.

**Where to find it**

- `AI_PROJECT_HANDOFF.md`
- `MASTER_VALUE_ROADMAP.md`
- `DOC_INDEX.md`
- `scripts/release_check.py`
- `docs/archive`

**Detailed instructions**

1. Treat AI_PROJECT_HANDOFF.md and MASTER_VALUE_ROADMAP.md as the only living direction documents.
2. Mark operational/reference documents clearly.
3. Map which release checks read historical text markers.
4. Replace brittle text-marker guards with current file/route/API tests.
5. Move superseded documents into docs/archive rather than deleting them.
6. Update DOC_INDEX.md with canonical, operational and archive sections.
7. Run the complete release suite after each archive batch.

**Move to the next item when**

A new developer can find current direction in two files and historical evidence remains available without controlling the roadmap.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

> Build 210 documentation sync: retained in the synchronized documentation set; Build 237 remains the current authority.
> Build 211 documentation sync: retained in the synchronized documentation set; Build 237 remains the current authority.
> Build 212 documentation sync: retained in the synchronized documentation set; Build 237 remains the current authority.
> Build 213 documentation sync: retained in the synchronized documentation set; Build 237 remains the current authority.
> Build 214 documentation sync: retained in the synchronized documentation set; Build 237 remains the current authority.
