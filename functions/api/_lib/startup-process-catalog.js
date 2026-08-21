export const STARTUP_PROCESS_CATALOG_BUILD239 = [
  {
    "id": "deploy-239",
    "order": 1,
    "category": "Deployment and CSS",
    "severity": "blocker",
    "title": "Deploy Build 239 and verify the unified Startup Command Center",
    "why": "Build 239 consolidates Startup, Launch Readiness, Production Readiness, guided testing, and roadmap execution into one protected interface. A partial or cached deployment could leave old standalone pages or mismatched assets active.",
    "where": [
      "Cloudflare Pages → Deployments → preview branch",
      "/admin-startup-guide",
      "/admin-launch-readiness",
      "/admin-production",
      "/admin-test-centre",
      "Browser DevTools → Network and Console"
    ],
    "steps": [
      "Deploy Build 239 to the preview/development branch.",
      "Open /admin-startup-guide in a private browser window and press Ctrl+Shift+R.",
      "Confirm the Overview, Blockers, Evidence, Production, Guided Tests, and Roadmap sections all load.",
      "Open /admin-launch-readiness, /admin-production, and /admin-test-centre and confirm each forwards to the matching Startup Command Center section.",
      "In DevTools Network, confirm /assets/site.css, AdminShell, AdminMenu, the startup catalog API, and readiness APIs return HTTP 200 or show a clearly labelled fallback.",
      "Repeat the check at phone width and confirm the section navigation, cards, tables, dialogs, and action buttons remain usable."
    ],
    "done_when": "The unified Startup Command Center is the only normal prelaunch workspace, legacy readiness routes forward safely, all sections work on desktop and mobile, and no required CSS/script/API request fails.",
    "route": "/admin-startup-guide.html",
    "evidence_key": "deploy_239"
  },
  {
    "id": "migration-237",
    "order": 2,
    "category": "Database migrations",
    "severity": "blocker",
    "title": "Apply the Build 237 database migration",
    "why": "Shared launch evidence and the current roadmap cycle cannot persist until the new tables/columns exist. The UI has a safe local/static fallback, but shared evidence is the intended source of truth.",
    "where": [
      "Supabase Dashboard → SQL Editor",
      "sql/2026-07-28_build237_css_startup_evidence_roadmap.sql",
      "Supabase Dashboard → Table Editor"
    ],
    "steps": [
      "Open the SQL file from the build package.",
      "Copy the complete file into Supabase SQL Editor.",
      "Run it in staging/preview first.",
      "Confirm app_launch_readiness_evidence and app_launch_readiness_evidence_audit exist.",
      "Confirm app_roadmap_execution_items includes cycle_key, is_current_cycle and action_path.",
      "Open /admin-launch-readiness and /admin-roadmap-execution and confirm database-backed results load."
    ],
    "done_when": "The two pages report shared/database evidence rather than browser-only fallback and the current Build 237 roadmap cycle appears.",
    "route": "/admin-launch-readiness.html",
    "evidence_key": "migration_237"
  },
  {
    "id": "migration-238",
    "order": 3,
    "category": "Database migrations",
    "severity": "blocker",
    "title": "Apply the Build 238 inventory transaction and merge migration",
    "why": "The new Inventory Workbench deliberately refuses to execute bulk changes or duplicate merges without database functions that validate the whole operation and record audit evidence. This prevents a browser/network failure from leaving half a batch changed.",
    "where": [
      "Supabase Dashboard → SQL Editor",
      "sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql",
      "Supabase Dashboard → Database → Functions",
      "/admin-inventory-manager.html"
    ],
    "steps": [
      "Confirm the Build 237 migration has already been applied.",
      "Open sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql from the build package.",
      "Copy the complete migration into Supabase SQL Editor and run it in staging/preview first.",
      "Confirm catalog_inventory_change_batches, catalog_inventory_change_batch_rows and catalog_inventory_merge_audit exist.",
      "Confirm admin_catalog_inventory_bulk_update and admin_catalog_inventory_merge appear under database functions.",
      "Reload /admin-inventory-manager.html and preview a harmless batch without executing it.",
      "Open Transaction & merge history and confirm it loads an empty or current shared audit view without a migration-required error.",
      "Record the migration date and staging result in Launch Readiness evidence."
    ],
    "done_when": "Both new RPC functions can complete dry-run previews, the three audit tables exist, Transaction & merge history loads, and no browser sequential partial-save fallback is used.",
    "route": "/admin-inventory-manager.html",
    "evidence_key": "migration_238"
  },
  {
    "id": "migration-239",
    "order": 4,
    "category": "Database migrations",
    "severity": "blocker",
    "title": "Apply the Build 239 unified Startup Command Center migration",
    "why": "The detailed startup catalog should have one database source of truth instead of being duplicated across JSON, Markdown, launch-readiness cards, production checks, and roadmap notes. The static catalog remains only as a safe read-only fallback.",
    "where": [
      "Supabase Dashboard → SQL Editor",
      "sql/2026-08-01_build239_unified_startup_command_center.sql",
      "Supabase Dashboard → Table Editor → app_startup_process_items",
      "/admin-startup-guide.html"
    ],
    "steps": [
      "Confirm the Build 237 and Build 238 migrations have been applied.",
      "Open sql/2026-08-01_build239_unified_startup_command_center.sql from the build package.",
      "Run the complete migration in staging/preview first.",
      "Confirm app_startup_process_items and app_startup_process_audit exist.",
      "Confirm the table contains every current blocker and no Build 238 blocker was removed.",
      "Reload /admin-startup-guide.html and confirm the source badge says Shared database catalog instead of Packaged fallback.",
      "Change one evidence status, one guided test result, and one roadmap row; refresh on another browser/device and confirm the shared state remains."
    ],
    "done_when": "The Startup Command Center loads every detailed process from the database, all existing items remain present, shared evidence/tests/roadmap persist across devices, and the static JSON is used only during migration or outage.",
    "route": "/admin-startup-guide.html#overview",
    "evidence_key": "migration_239"
  },
  {
    "id": "block-calendar",
    "order": 5,
    "category": "Booking and scheduling",
    "severity": "blocker",
    "title": "Retest the repaired Block Calendar against public booking",
    "why": "Availability mistakes can cause double-booking or hide valid dates. A visual repair alone is not enough; save/remove behaviour must be proven against the public booking wizard.",
    "where": [
      "/admin-blocks.html",
      "/book",
      "Supabase schedule block tables"
    ],
    "steps": [
      "Choose a future date with no customer booking.",
      "Create a full-day block and refresh the calendar.",
      "Open /book in another tab and confirm that date is unavailable.",
      "Remove the full-day block and confirm the date returns.",
      "Create an AM-only block and confirm PM remains available.",
      "Remove AM, create PM-only, and confirm AM remains available.",
      "Remove the test block and record the tested date in Launch Readiness evidence."
    ],
    "done_when": "Full-date, AM and PM changes persist after refresh and the public booking wizard matches every admin change.",
    "route": "/admin-blocks.html",
    "evidence_key": "block_calendar"
  },
  {
    "id": "booking-e2e",
    "order": 6,
    "category": "Booking and scheduling",
    "severity": "blocker",
    "title": "Complete one end-to-end booking test",
    "why": "The complete path must work as one system: availability, vehicle, package, add-ons, customer details, deposit, confirmation and admin record.",
    "where": [
      "/book",
      "/admin-booking.html",
      "Customer confirmation email/inbox"
    ],
    "steps": [
      "Use a clearly labelled test customer and a future test date.",
      "Complete every booking step on a phone-sized screen.",
      "Confirm pricing, HST/deposit and selected options before payment.",
      "Finish the booking and save the confirmation number.",
      "Open Admin Booking and verify date, slot, vehicle, package, add-ons, customer and payment state.",
      "Cancel or mark the test record according to your test-data policy."
    ],
    "done_when": "The customer and admin views agree and no manual database correction is needed.",
    "route": "/book",
    "evidence_key": "booking_e2e"
  },
  {
    "id": "stripe-live",
    "order": 7,
    "category": "Payments",
    "severity": "blocker",
    "title": "Complete and refund a small live Stripe payment",
    "why": "Test-mode success does not prove live keys, webhook secrets, receipts, refunds or accounting evidence are configured correctly.",
    "where": [
      "/admin-payments.html",
      "Stripe Dashboard → Payments",
      "Stripe Dashboard → Developers → Webhooks",
      "/admin-accounting.html"
    ],
    "steps": [
      "Confirm the deployment intentionally reports Stripe live mode.",
      "Create a small real payment tied to a labelled test booking/quote.",
      "Confirm the browser returns to the correct success page.",
      "Verify the Stripe event reached the deployed webhook with HTTP 2xx.",
      "Verify the payment appears in admin payment/accounting views.",
      "Issue a full refund and confirm the refund event and final status.",
      "Record only safe payment identifiers; never put card details in evidence notes."
    ],
    "done_when": "Payment, webhook, receipt, refund and accounting views agree on the final state.",
    "route": "/admin-payments.html",
    "evidence_key": "stripe_live"
  },
  {
    "id": "email-delivery",
    "order": 8,
    "category": "Notifications",
    "severity": "blocker",
    "title": "Verify every required email reaches an external inbox",
    "why": "A successful API response does not prove customers or staff receive messages, and spam/mobile formatting failures can block operations.",
    "where": [
      "/admin-notifications.html",
      "Notification provider dashboard",
      "External Gmail/Outlook inboxes"
    ],
    "steps": [
      "Send a booking confirmation to an external test inbox.",
      "Send payment/deposit, staff assignment and consent/review messages where applicable.",
      "Check Inbox, Promotions and Spam/Junk folders.",
      "Open each message on desktop and mobile.",
      "Verify links go to the correct deployed domain and are not expired.",
      "Record provider message IDs or timestamps without including private content."
    ],
    "done_when": "All required messages arrive, render clearly and contain working links.",
    "route": "/admin-notifications.html",
    "evidence_key": "email_delivery"
  },
  {
    "id": "environment",
    "order": 9,
    "category": "Deployment and security",
    "severity": "blocker",
    "title": "Audit Cloudflare production variables and bindings",
    "why": "Missing or preview-only variables are a common cause of login, payment, notification, storage and API failures after launch.",
    "where": [
      "Cloudflare Dashboard → Workers & Pages → rosiedazzlers → Settings",
      "docs/CLOUDFLARE_ENVIRONMENT_CHECKLIST.md",
      "/api/health"
    ],
    "steps": [
      "Open Variables and Secrets for both Preview and Production.",
      "Verify Supabase URL/service key, Stripe keys/webhook secret, notification credentials, R2 bindings and public asset settings.",
      "Confirm secrets are stored as encrypted secrets, not committed files.",
      "Confirm custom domains point to the production deployment.",
      "Open /api/health and record the non-secret environment/mode result.",
      "Update the environment checklist with the exact Cloudflare screen where each setting lives."
    ],
    "done_when": "Every required integration has an intentional production value/binding and no secret is stored in the repository.",
    "route": "/admin-production.html",
    "evidence_key": "environment"
  },
  {
    "id": "backup-restore",
    "order": 10,
    "category": "Recovery",
    "severity": "blocker",
    "title": "Test backup and restore, not just backup availability",
    "why": "A backup is useful only when you know how to restore it and confirm permissions/data integrity afterward.",
    "where": [
      "Supabase Dashboard → Database → Backups",
      "/admin-recovery.html",
      "docs/PRODUCTION_TEST_GUIDE.md"
    ],
    "steps": [
      "Confirm the Supabase plan and backup retention available to the project.",
      "Choose a safe staging restore method or export a small representative data set.",
      "Restore to a staging project/schema or re-import selected test records.",
      "Compare row counts and key relationships.",
      "Test staff access and RLS through Cloudflare Functions after restore.",
      "Write the exact recovery sequence, owner and expected maximum data-loss window."
    ],
    "done_when": "A documented rehearsal proves data can be recovered and accessed through the application boundary.",
    "route": "/admin-recovery.html",
    "evidence_key": "backups"
  },
  {
    "id": "legal",
    "order": 11,
    "category": "Policies and customer trust",
    "severity": "blocker",
    "title": "Review all policies before accepting unrestricted orders",
    "why": "Booking, deposits, cancellations, driveway requirements, runoff/bylaw responsibility, media use and privacy must be clear before a customer commits.",
    "where": [
      "/privacy.html",
      "/terms.html",
      "/refund-policy.html",
      "/book",
      "Footer policy links"
    ],
    "steps": [
      "Read each policy as a customer, not as a developer.",
      "Confirm business name, contact method, province and effective date.",
      "Align cancellation/deposit/refund wording with the actual payment workflow.",
      "Confirm photo/media consent is optional and visibility choices are clear.",
      "Confirm power/water, driveway and local bylaw/service-condition wording matches operations.",
      "Have a qualified Ontario professional review any wording that carries legal or tax risk.",
      "Verify all policy links are visible from booking, checkout and footer."
    ],
    "done_when": "Published policy wording matches real operations and every checkout/booking link is easy to find.",
    "route": "/privacy.html",
    "evidence_key": "legal"
  },
  {
    "id": "security",
    "order": 12,
    "category": "Deployment and security",
    "severity": "blocker",
    "title": "Verify staff permissions, sessions and protected APIs",
    "why": "Admin pages and APIs contain customer, payment and operational data. Visual hiding is not authorization.",
    "where": [
      "/admin-security.html",
      "/admin-app.html",
      "Browser DevTools",
      "Supabase Security Advisor"
    ],
    "steps": [
      "Test Admin, Senior Detailer and Detailer accounts separately.",
      "Confirm each role can access only intended pages/actions.",
      "Call protected APIs while signed out and confirm 401/403 responses.",
      "Sign out and confirm old pages cannot continue saving data.",
      "Review Supabase Security Advisor and RLS posture.",
      "Verify security headers on public and admin responses.",
      "Record failures as blockers, not accepted warnings."
    ],
    "done_when": "Server-side authorization, session expiry/logout and database containment are proven for each role.",
    "route": "/admin-security.html",
    "evidence_key": "security"
  },
  {
    "id": "mobile",
    "order": 13,
    "category": "Mobile and accessibility",
    "severity": "high",
    "title": "Complete real-device mobile testing",
    "why": "Responsive browser resizing does not fully test touch, on-screen keyboards, camera uploads, slow connections or mobile payment handoff.",
    "where": [
      "Real phone browsers",
      "/book",
      "/admin-blocks.html",
      "/admin-inventory-manager.html",
      "/detailer-jobs.html"
    ],
    "steps": [
      "Test portrait and landscape on a real phone.",
      "Open/close the mobile dropdown menu on every core page.",
      "Complete booking fields with the on-screen keyboard.",
      "Test calendar tapping, inventory row/card editing and image upload/capture.",
      "Confirm no horizontal page drift except intentional table/calendar scroll regions.",
      "Test a slower network profile and retry behaviour.",
      "Capture screenshots of any overlap or unreadable control."
    ],
    "done_when": "All primary customer and staff tasks can be completed without zooming, clipped controls or lost input.",
    "route": "/admin-test-centre.html",
    "evidence_key": "mobile"
  },
  {
    "id": "accessibility",
    "order": 14,
    "category": "Mobile and accessibility",
    "severity": "high",
    "title": "Complete keyboard, focus, labels and contrast review",
    "why": "Accessible forms reduce customer abandonment and also expose hidden UI/JavaScript problems before launch.",
    "where": [
      "Public home/services/booking/payment pages",
      "Critical admin pages",
      "Browser accessibility tree"
    ],
    "steps": [
      "Navigate every interactive control using Tab/Shift+Tab only.",
      "Confirm visible focus never disappears behind sticky elements.",
      "Verify each input has a useful label and each error is announced/readable.",
      "Check heading order and confirm one H1 per exposed page.",
      "Check colour contrast for text, buttons, notices and disabled states.",
      "Test at 200% browser zoom.",
      "Document exceptions with route, control and screenshot."
    ],
    "done_when": "Critical flows are usable by keyboard and at high zoom with clear labels, focus and errors.",
    "route": "/admin-test-centre.html",
    "evidence_key": "accessibility"
  },
  {
    "id": "search-preflight",
    "order": 15,
    "category": "SEO and local visibility",
    "severity": "high",
    "title": "Complete Search Console, sitemap, canonical and schema preflight",
    "why": "The site already has strong local/service architecture, but indexing and structured-data evidence must be checked on the deployed canonical domain.",
    "where": [
      "Google Search Console",
      "/sitemap.xml",
      "Google Rich Results Test",
      "Public page source"
    ],
    "steps": [
      "Verify the rosiedazzlers.ca Search Console property.",
      "Submit https://rosiedazzlers.ca/sitemap.xml.",
      "Inspect the homepage, booking, primary service and town URLs.",
      "Confirm canonical URLs use the production domain and preferred trailing-slash pattern.",
      "Test LocalBusiness/Service/WebSite structured data and correct errors.",
      "Review indexed pages for accidental admin/dev URLs.",
      "Record real search queries monthly before rewriting titles."
    ],
    "done_when": "The sitemap is accepted, important pages are inspectable/indexable, admin pages are noindex and schema has no critical errors.",
    "route": "/admin-seo-tasks.html",
    "evidence_key": "search"
  },
  {
    "id": "business-profile",
    "order": 16,
    "category": "SEO and local visibility",
    "severity": "high",
    "title": "Complete and align Google Business Profile",
    "why": "Local visibility depends heavily on accurate relevance, distance/service-area and prominence signals; the profile must match the website and real business.",
    "where": [
      "Google Business Profile Manager",
      "/contact.html",
      "/services.html",
      "Town/service landing pages"
    ],
    "steps": [
      "Confirm the real-world business name without keyword stuffing.",
      "Choose the most specific accurate primary category and relevant secondary categories.",
      "Confirm service areas, phone, website and hours.",
      "Add accurate services and descriptions that match the site.",
      "Upload approved real photos regularly.",
      "Create a review-request link and respond to reviews.",
      "Compare profile information with footer/contact/schema data for consistency."
    ],
    "done_when": "The profile is verified, complete, accurate and consistent with the production website.",
    "route": "/admin-marketing.html",
    "evidence_key": "business_profile"
  },
  {
    "id": "inventory-cleanup",
    "order": 17,
    "category": "Inventory and products",
    "severity": "high",
    "title": "Clean inventory records before relying on product sales and job costing",
    "why": "Suspicious imported names, missing costs/categories and duplicates reduce customer trust and make pricing/profitability unreliable.",
    "where": [
      "/admin-inventory-manager.html",
      "/admin-catalog.html",
      "Inventory Workbench filters"
    ],
    "steps": [
      "Filter Suspicious names and replace ASIN/alphanumeric titles with clear product names.",
      "Complete category, vendor, unit, cost and reorder point.",
      "Confirm tool versus consumable classification.",
      "Archive rows that are true duplicates only after checking history/references.",
      "Leave unfinished rows inactive/private.",
      "Export a CSV snapshot before large bulk changes.",
      "Spot-check calculations after updates."
    ],
    "done_when": "Every active/sellable row has a clear name, classification, category, cost and intentional active/public state.",
    "route": "/admin-inventory-manager.html",
    "evidence_key": "inventory_cleanup"
  },
  {
    "id": "product-images",
    "order": 18,
    "category": "Inventory and products",
    "severity": "high",
    "title": "Complete product image sets and metadata",
    "why": "Products need strong visual proof, but multiple images must remain ordered, descriptive, consent-safe and performant.",
    "where": [
      "/admin-inventory-manager.html",
      "/admin-catalog.html",
      "Product public page/gallery"
    ],
    "steps": [
      "Set one featured image that clearly shows the complete item.",
      "Add up to seven gallery images covering detail, scale, packaging, use and variations.",
      "Order images from strongest overview to supporting detail.",
      "Write concise descriptive alt text rather than keyword lists.",
      "Record image role, caption, source/provenance and consent where applicable.",
      "Verify images load on mobile and do not cause layout shift.",
      "Keep products private until the image set and customer-facing copy are ready."
    ],
    "done_when": "Every sellable product has a reliable featured image, useful gallery and accurate accessible metadata.",
    "route": "/admin-inventory-manager.html",
    "evidence_key": "product_images"
  },
  {
    "id": "pricing-tax",
    "order": 19,
    "category": "Payments",
    "severity": "blocker",
    "title": "Verify pricing, deposits, HST and final totals",
    "why": "Customer-visible totals must match booking, checkout, receipts and accounting. Price drift is a launch blocker.",
    "where": [
      "/pricing.html",
      "/book",
      "/admin-site-settings.html",
      "/admin-tax-review.html",
      "Stripe checkout"
    ],
    "steps": [
      "Compare every package and add-on price in public pricing, booking and admin catalog.",
      "Verify vehicle-size price differences.",
      "Confirm deposit rules and cancellation/refund handling.",
      "Verify HST calculation and rounding on representative totals.",
      "Confirm Stripe checkout amount matches the final booking/quote.",
      "Verify receipt and accounting entries use the same amounts.",
      "Document who can change prices and how changes are reviewed."
    ],
    "done_when": "The same selected service produces the same subtotal, tax, deposit and total everywhere.",
    "route": "/admin-tax-review.html",
    "evidence_key": "pricing_tax"
  },
  {
    "id": "analytics",
    "order": 20,
    "category": "SEO and local visibility",
    "severity": "high",
    "title": "Verify analytics and conversion events in production",
    "why": "You need trustworthy evidence before changing SEO, ads or booking UX, and consent settings must be respected.",
    "where": [
      "/admin-analytics.html",
      "Browser DevTools",
      "Analytics provider real-time/debug view"
    ],
    "steps": [
      "Accept and reject analytics consent and confirm expected script behaviour.",
      "Trigger page view, package view, booking start, quote start, booking complete and payment events.",
      "Confirm events use the production domain and useful non-private parameters.",
      "Verify UTM/source values flow into lead/booking reporting.",
      "Exclude internal/admin traffic where practical.",
      "Record a baseline before launch marketing changes."
    ],
    "done_when": "Core conversion events arrive once, contain no sensitive customer data and can be tied to real acquisition sources.",
    "route": "/admin-analytics.html",
    "evidence_key": "analytics"
  },
  {
    "id": "monitoring",
    "order": 21,
    "category": "Recovery",
    "severity": "high",
    "title": "Prepare production monitoring and incident response",
    "why": "During the first live bookings, failures must be noticed quickly and have a clear owner and rollback path.",
    "where": [
      "/admin-production.html",
      "Cloudflare logs",
      "Supabase logs",
      "Stripe webhook logs",
      "KNOWN_GAPS_AND_RISKS.md"
    ],
    "steps": [
      "Confirm where Cloudflare Function errors are viewed.",
      "Confirm Supabase database/auth logs and Stripe webhook logs.",
      "Define who checks failures during the first week and how often.",
      "Write a stop-taking-bookings procedure.",
      "Document rollback to the previous deployment.",
      "Create an incident record for any payment, booking, privacy or data-loss failure.",
      "Review logs daily during soft launch."
    ],
    "done_when": "A named owner can detect, classify, communicate and roll back a critical failure without searching for instructions.",
    "route": "/admin-production.html",
    "evidence_key": "monitoring"
  },
  {
    "id": "soft-launch",
    "order": 22,
    "category": "Go-live decision",
    "severity": "blocker",
    "title": "Use an invite-only soft launch before unrestricted public promotion",
    "why": "A controlled first group gives real evidence without exposing the business to a large volume of simultaneous failures.",
    "where": [
      "/admin-launch-readiness.html",
      "/admin-today.html",
      "/admin-production.html",
      "Business operations calendar"
    ],
    "steps": [
      "Resolve all critical blockers or explicitly document why a controlled exception is safe.",
      "Invite only a small number of known customers.",
      "Limit daily capacity to what can be manually supported.",
      "Review each booking, payment, email, job update, inventory movement and review request.",
      "Hold public advertising until the first transactions are stable.",
      "Record incidents and fixes immediately.",
      "Expand gradually after a defined stable period."
    ],
    "done_when": "Several real transactions complete without critical manual correction and monitoring evidence supports broader launch.",
    "route": "/admin-launch-readiness.html",
    "evidence_key": "operations"
  },
  {
    "id": "duplicate-merge",
    "order": 23,
    "category": "Inventory and products",
    "severity": "high",
    "title": "Test the reviewed duplicate inventory merge workflow",
    "why": "Build 238 now provides a preview-first merge that transfers known operational references, records compensating quantity movements and archives the duplicate. It still requires migration and staging proof before use on important rows.",
    "where": [
      "/admin-inventory-manager.html",
      "Supabase → catalog_inventory_merge_audit",
      "Supabase → catalog_inventory_movements",
      "STARTUP_GO_LIVE_BLOCKERS.md"
    ],
    "steps": [
      "Apply the Build 238 migration in staging.",
      "Choose two harmless test rows that truly represent the same item and have no irreplaceable history.",
      "Select exactly those two rows in Inventory Workbench and choose Review two-row merge.",
      "Choose the survivor row and enter a clear reason.",
      "Select Preview merge and inspect quantity, gallery count and every reference-count card.",
      "Confirm the survivor should keep its current values when present and inherit only missing values.",
      "Execute the merge, reload the page and verify the duplicate is inactive, private and zero quantity.",
      "Verify purchase orders, movements, assignments, service links and project references point to the survivor where applicable.",
      "Verify catalog_inventory_merge_audit contains before/after rows and the reason.",
      "Open Transaction & merge history, confirm the merge appears with the correct survivor, archived duplicate, reason, actor, timestamp and transferred-reference counts, then export the audit CSV."
    ],
    "done_when": "A staging merge preserves history, transfers known references, records compensating quantity movements, archives rather than deletes the duplicate, and appears correctly in the read-only audit history/CSV.",
    "route": "/admin-inventory-manager.html",
    "evidence_key": "inventory_merge_238"
  },
  {
    "id": "bulk-rpc",
    "order": 24,
    "category": "Inventory and products",
    "severity": "high",
    "title": "Test transactional bulk inventory updates and rollback behaviour",
    "why": "Build 238 replaces sequential browser saves with an all-or-nothing database function. The complete batch is validated before any write and records a batch header plus row-level before/after evidence.",
    "where": [
      "/admin-inventory-manager.html",
      "Supabase → catalog_inventory_change_batches",
      "Supabase → catalog_inventory_change_batch_rows",
      "Cloudflare Function logs"
    ],
    "steps": [
      "Apply the Build 238 migration in staging.",
      "Select two harmless inventory test rows.",
      "Choose a bulk field and value and enter a specific audit reason.",
      "Select Preview batch and verify the message says no rows were changed.",
      "Choose Apply transaction and confirm both rows change together.",
      "Verify one batch header and two row evidence records exist.",
      "Repeat with one deliberately invalid test value and confirm the entire transaction fails with neither row changed.",
      "Open Transaction & merge history and confirm the successful batch shows the correct operation, row count, reason, actor and timestamp; export the audit CSV.",
      "Restore the test values through another audited transaction."
    ],
    "done_when": "Valid batches update every selected row together, invalid batches change none, before/after evidence exists for every row, and the committed batch appears correctly in audit history/CSV.",
    "route": "/admin-inventory-manager.html",
    "evidence_key": "inventory_bulk_rpc_238"
  },
  {
    "id": "media-derivatives",
    "order": 25,
    "category": "Media and performance",
    "severity": "planned",
    "title": "Generate responsive product/gallery image derivatives",
    "why": "Seven original images can create slow mobile pages and layout instability without standardized dimensions and modern formats.",
    "where": [
      "R2 derivative worker",
      "Media Health",
      "Product/gallery rendering"
    ],
    "steps": [
      "Define canonical source-image rules and maximum upload size.",
      "Generate thumbnail, card, medium and large dimensions.",
      "Create WebP/AVIF with JPEG/PNG fallback where supported.",
      "Store width, height, format and byte size metadata.",
      "Render srcset/sizes and fixed aspect-ratio boxes.",
      "Keep the original source private or archival according to policy.",
      "Monitor failed derivative jobs and provide retry."
    ],
    "done_when": "Public product/gallery pages load appropriately sized images with stable layout and fallback formats.",
    "route": "/admin-media-health.html",
    "evidence_key": null
  },
  {
    "id": "markdown-retirement",
    "order": 26,
    "category": "Documentation",
    "severity": "planned",
    "title": "Retire redundant Markdown only after release guards are modernized",
    "why": "The project has many historical documents. Deleting them now can break release checks or erase evidence, but treating all of them as current creates confusion.",
    "where": [
      "AI_PROJECT_HANDOFF.md",
      "MASTER_VALUE_ROADMAP.md",
      "DOC_INDEX.md",
      "scripts/release_check.py",
      "docs/archive"
    ],
    "steps": [
      "Treat AI_PROJECT_HANDOFF.md and MASTER_VALUE_ROADMAP.md as the only living direction documents.",
      "Mark operational/reference documents clearly.",
      "Map which release checks read historical text markers.",
      "Replace brittle text-marker guards with current file/route/API tests.",
      "Move superseded documents into docs/archive rather than deleting them.",
      "Update DOC_INDEX.md with canonical, operational and archive sections.",
      "Run the complete release suite after each archive batch."
    ],
    "done_when": "A new developer can find current direction in two files and historical evidence remains available without controlling the roadmap.",
    "route": "/admin-docs.html",
    "evidence_key": null
  },
  {
    "id": "notification-health",
    "order": 27,
    "category": "Production communications",
    "severity": "blocker",
    "title": "Verify notification provider and delivery-queue health",
    "why": "A configured email webhook is not enough. Queued or failed customer and staff messages can cause missed bookings, payment confusion, and consent failures.",
    "where": [
      "/admin-startup-guide.html#production",
      "Cloudflare → Workers & Pages → Settings → Variables",
      "Notification provider dashboard"
    ],
    "steps": [
      "Open the Startup Command Center Production section and refresh the report.",
      "Confirm the email provider is configured before using Send test.",
      "Use Check config only first, then send exactly one message to a Rosie-controlled external inbox.",
      "Confirm the message arrives on desktop and mobile and inspect spam/junk.",
      "Review failed and queued notification counts; repair the provider or retry path before launch.",
      "Record the receive time and safe provider result in evidence without storing addresses, secrets, or message content."
    ],
    "done_when": "The provider test succeeds, the controlled inbox receives the message, and failed/queued notification counts are zero or have a documented accepted reason.",
    "route": "/admin-startup-guide.html#production",
    "evidence_key": "notification_health"
  },
  {
    "id": "payment-link-operations",
    "order": 28,
    "category": "Payments",
    "severity": "blocker",
    "title": "Verify hosted final-balance links, webhook evidence, and reconciliation",
    "why": "Customers need a dependable way to pay the remaining balance. A checkout URL alone is not proof that payment status, webhook processing, receipt, refund, and accounting records agree.",
    "where": [
      "/admin-startup-guide.html#production",
      "Stripe Dashboard → Developers → Webhooks",
      "/admin-accounting.html"
    ],
    "steps": [
      "Create a small internal final-balance request.",
      "From the Production section, create a hosted checkout link and confirm the amount, currency, branding, and customer reference.",
      "Complete the test in Stripe test mode first, then perform the separately approved small live-payment test.",
      "Confirm webhook receipt, payment-request status, receipt, ledger/journal evidence, and customer/admin history agree.",
      "Issue the planned test refund and confirm the refund appears in Stripe and the application records.",
      "Record only safe IDs, timestamps, and outcomes in Startup evidence."
    ],
    "done_when": "A hosted link works, payment and refund webhooks are recorded, receipt and accounting evidence agree, and the manual fallback remains available.",
    "route": "/admin-startup-guide.html#production",
    "evidence_key": "payment_links"
  },
  {
    "id": "upload-recovery",
    "order": 29,
    "category": "Field reliability",
    "severity": "high",
    "title": "Prove mobile photo/video upload interruption and recovery",
    "why": "Detailing proof and customer updates are captured in the field, where connections can be weak. Silent loss or duplicate media would damage trust and job records.",
    "where": [
      "/admin-startup-guide.html#tests",
      "/detailer-jobs.html",
      "/admin-startup-guide.html#production"
    ],
    "steps": [
      "Use a test booking and non-sensitive photo/video on a real phone.",
      "Upload a small photo and confirm visible progress and completion.",
      "Begin a short video upload, switch networks or briefly interrupt connectivity, and confirm a useful retry/cancel state appears.",
      "Restore connectivity and retry once.",
      "Confirm the final media exists once, has the correct visibility, and any failed session appears in Production readiness for review.",
      "Record device, browser, connection type, approximate file size, and outcome."
    ],
    "done_when": "Photo and video uploads show progress, interruption produces a recoverable state, retry does not duplicate media, and failed sessions are visible to staff.",
    "route": "/admin-startup-guide.html#tests",
    "evidence_key": "upload_recovery"
  },
  {
    "id": "retention-review",
    "order": 30,
    "category": "Privacy and storage",
    "severity": "high",
    "title": "Complete media retention, legal-hold, and cleanup review",
    "why": "Unlimited storage increases cost and privacy exposure, while aggressive deletion could remove proof needed for disputes, taxes, or consent records.",
    "where": [
      "/admin-startup-guide.html#production",
      "/admin-media.html",
      "Supabase/R2 storage dashboards"
    ],
    "steps": [
      "Open the Production section and run retention in dry-run mode only.",
      "Review every candidate by booking, media type, stage, consent, incident/legal-hold status, and retention policy.",
      "Confirm permanent proof and legal-hold items are excluded.",
      "Correct any missing policy or expiry date before marking records for review.",
      "Approve deletion only through the documented storage-cleanup process; do not manually delete referenced objects.",
      "Record candidate counts, exclusions, reviewer, and date."
    ],
    "done_when": "Dry-run candidates are explainable, protected evidence is excluded, referenced objects are not orphaned, and an approved cleanup/restore procedure is documented.",
    "route": "/admin-startup-guide.html#production",
    "evidence_key": "retention_review"
  },
  {
    "id": "incident-closeout",
    "order": 31,
    "category": "Customer protection",
    "severity": "blocker",
    "title": "Verify incident closeout, privacy, and review-request safety",
    "why": "An unresolved issue or private incident note must never be exposed to a customer or followed immediately by an automated review request.",
    "where": [
      "/admin-startup-guide.html#tests",
      "/admin-incident-reports.html",
      "/admin-workflow.html",
      "Customer progress link in a private browser"
    ],
    "steps": [
      "Create a harmless internal test incident on a test booking.",
      "Confirm staff-only notes and evidence remain hidden from the signed-out customer progress view.",
      "Publish only specifically approved customer-safe wording.",
      "Confirm booking closeout or review-request automation is blocked while the incident is unresolved.",
      "Resolve the test incident with an auditable decision and verify the review workflow follows the documented policy.",
      "Remove or archive test data according to the test-data policy."
    ],
    "done_when": "Private material never appears to the customer, unresolved incidents block unsafe closeout/review automation, and resolution creates complete audit evidence.",
    "route": "/admin-startup-guide.html#tests",
    "evidence_key": "incident_closeout"
  },
  {
    "id": "rollback-drill",
    "order": 32,
    "category": "Deployment and recovery",
    "severity": "blocker",
    "title": "Complete a deployment rollback and incident-response drill",
    "why": "Backups protect data, but a bad frontend/function deployment also needs a fast, rehearsed rollback path with owners and verification steps.",
    "where": [
      "Cloudflare Pages → Deployments",
      "/admin-startup-guide.html#production",
      "STARTUP_GO_LIVE_BLOCKERS.md",
      "docs/PRODUCTION_TEST_GUIDE.md"
    ],
    "steps": [
      "Choose a safe preview deployment and identify the previous known-good deployment.",
      "Document who can trigger rollback and where the control is located.",
      "Roll preview back or promote a known-good preview in a controlled rehearsal.",
      "Verify home, booking, login, Block Calendar, Startup Command Center, payment endpoint health, and database connectivity after rollback.",
      "Restore the latest build and repeat the smoke check.",
      "Record timestamps, owner, deployment IDs, observed downtime, and any missing permissions."
    ],
    "done_when": "A named owner can restore a known-good deployment, critical smoke tests pass after rollback, and the written incident path is usable without guessing.",
    "route": "/admin-startup-guide.html#production",
    "evidence_key": "rollback_drill"
  },
  {
    "id": "local-proof-cadence",
    "order": 33,
    "category": "Local SEO and trust",
    "severity": "high",
    "title": "Establish an approved local-photo, review, and Business Profile cadence",
    "why": "Local visibility depends on accurate relevance signals and real prominence. Fresh approved work, complete profile information, and legitimate reviews are more valuable than duplicated keyword pages.",
    "where": [
      "/admin-startup-guide.html#blockers",
      "Google Business Profile → Photos, Services, Reviews, Performance",
      "/gallery.html",
      "/admin-gallery.html",
      "Search Console"
    ],
    "steps": [
      "Confirm the Business Profile name, primary category, service areas, phone, hours, website, and services match the live site and real-world operation.",
      "Replace the highest-value public placeholders with Rosie-owned, consent-approved before/after work.",
      "Add descriptive alt text and connect proof to the relevant service/town page without duplicating thin pages.",
      "Create a repeatable post-job review request that follows Google policy and pauses for unresolved incidents.",
      "Schedule a weekly profile/photo/review-response check and a monthly Search Console/local landing-page review.",
      "Record the first completed cycle and the next review date."
    ],
    "done_when": "The profile and website agree, priority pages show authentic approved proof, review requests are policy-safe, and a repeatable local visibility cadence has an owner.",
    "route": "/admin-startup-guide.html#blockers",
    "evidence_key": "local_proof_cadence"
  },
  {
    "id": "startup-single-interface",
    "order": 34,
    "category": "Documentation and operations",
    "severity": "high",
    "title": "Retire duplicate preflight navigation and train staff on one Startup Command Center",
    "why": "Even correct checks become unreliable when staff must guess between Startup Guide, Launch Readiness, Production, Guided Tests, and Roadmap pages.",
    "where": [
      "/admin-startup-guide.html",
      "Admin Menu",
      "AI_PROJECT_HANDOFF.md",
      "STARTUP_GO_LIVE_BLOCKERS.md"
    ],
    "steps": [
      "Confirm the Admin Menu has one Startup Command Center entry.",
      "Confirm old readiness URLs forward to the appropriate Startup section and remain available only for compatibility.",
      "Update internal instructions, bookmarks, and screenshots to use /admin-startup-guide.html.",
      "Train each staff role on Overview, Blockers, Evidence, Production, Tests, and Roadmap tabs.",
      "Confirm permissions allow required staff to view or update only the sections they are authorized to use.",
      "After one complete test cycle, remove duplicate wording from living documentation while retaining historical release evidence."
    ],
    "done_when": "Staff use one interface for launch work, legacy links forward safely, permissions are correct, and no current document instructs staff to maintain a separate preflight checklist.",
    "route": "/admin-startup-guide.html",
    "evidence_key": "startup_single_interface"
  },
  {
    "id": "migration-240",
    "order": 35,
    "category": "Inventory and operations",
    "severity": "blocker",
    "title": "Apply and verify the Build 240 transactional inventory posting migration",
    "why": "Booking and Creative Project material usage must no longer depend on separate browser writes. Build 240 moves preview, shortage validation, stock mutation, movement evidence, reservation status, idempotency and reversal links into one database transaction.",
    "where": [
      "Supabase Dashboard → SQL Editor",
      "sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql",
      "Supabase Dashboard → Database → Functions",
      "/admin-inventory-posting.html"
    ],
    "steps": [
      "Confirm Builds 235, 237, 238 and 239 migrations have been applied in order.",
      "Open the complete Build 240 SQL migration from the ZIP.",
      "Run it in staging/preview first and do not edit individual statements.",
      "Confirm catalog_inventory_posting_batches and catalog_inventory_posting_rows exist.",
      "Confirm admin_catalog_inventory_post and admin_catalog_inventory_post_reverse appear under Database Functions.",
      "Refresh the Supabase schema cache if the admin page reports that the RPC is missing.",
      "Open /admin-inventory-posting.html and preview one harmless booking posting without committing.",
      "Load one reviewed Creative Project reservation and confirm shortages or conflicts are explained before posting.",
      "Record the migration date and staging result in the Startup evidence editor."
    ],
    "done_when": "The two tables and two RPC functions exist, previews load from the shared database, a reviewed project reservation can be validated without changing stock, and the interface no longer reports migration required.",
    "route": "/admin-inventory-posting.html",
    "evidence_key": "migration_240"
  },
  {
    "id": "inventory-post-reversal-acceptance",
    "order": 36,
    "category": "Inventory and accounting",
    "severity": "blocker",
    "title": "Complete transactional inventory posting and authorized reversal acceptance testing",
    "why": "The feature is not production-ready until one committed booking posting, one reviewed project posting, one shortage rejection, one idempotent replay and one compensating reversal have been observed with correct quantities and audit evidence. Booking reversals also require accounting review because stock restoration does not automatically erase journal history.",
    "where": [
      "/admin-inventory-posting.html",
      "/admin-progress.html",
      "/admin-creative-projects.html",
      "/admin-accounting.html",
      "Supabase Dashboard → Table Editor → catalog_inventory_posting_batches"
    ],
    "steps": [
      "Choose a low-risk staging inventory item and record its starting quantity.",
      "Preview a booking posting and confirm the before/after quantity and total lines are correct.",
      "Commit once, refresh history, and confirm the quantity decreased exactly once.",
      "Repeat the same request with the same idempotency key and confirm stock does not decrease again.",
      "Preview a quantity greater than stock and confirm the whole transaction is rejected with no row changed.",
      "Create or use a reviewed Creative Project reservation, preview it, commit it, and confirm the reservation becomes posted/inventory_mutated.",
      "Open Transaction History, choose the test batch, enter a specific reversal reason, and preview the compensating return.",
      "Commit the reversal and confirm quantity returns, the original movement is marked reversed, a return movement exists, and the project reservation returns to reviewed where applicable.",
      "For a booking reversal, open Accounting and review or reverse the related COGS journal evidence rather than deleting it.",
      "Save screenshots or record IDs without customer secrets in Startup evidence."
    ],
    "done_when": "All acceptance cases pass, duplicate submission cannot double-deduct stock, shortages leave every row unchanged, reversals preserve original and compensating history, and booking accounting evidence is reviewed.",
    "route": "/admin-inventory-posting.html",
    "evidence_key": "inventory_posting_reversal_acceptance"
  }
];

export const STARTUP_PROCESS_CATALOG_BUILD240 = STARTUP_PROCESS_CATALOG_BUILD239;

export const STARTUP_PROCESS_CATALOG_BUILD246 = [
  ...STARTUP_PROCESS_CATALOG_BUILD240,
  {
    id: "catalog-publish-readiness",
    order: 37,
    category: "Catalog and inventory",
    severity: "blocker",
    title: "Complete catalog publishing-readiness acceptance",
    why: "Public inventory rows should never expose placeholder names, missing categories, empty images, inactive records, or zero-stock consumables. Build 246 adds one reviewed publish gate and audit trail.",
    where: [
      "/admin-catalog.html",
      "/admin-inventory-manager.html",
      "/api/admin/catalog_readiness_report",
      "Supabase Dashboard → catalog_publish_readiness_audit"
    ],
    steps: [
      "Apply the Build 246 migration in staging.",
      "Open Admin Inventory and filter to Blocked publishing rows.",
      "Correct one harmless test item until its readiness score has no blockers.",
      "Select the item and choose Preview public readiness.",
      "Confirm the preview lists warnings but no blockers.",
      "Publish the selection and confirm it appears in the public catalog.",
      "Select an intentionally incomplete test row and confirm publishing is blocked without changing any selected row.",
      "Review catalog_publish_readiness_audit and record safe IDs in Startup evidence."
    ],
    done_when: "Ready rows publish together, blocked rows remain private, incomplete batch publishing changes nothing, and every preview/publish attempt has audit evidence.",
    route: "/admin-catalog.html",
    evidence_key: "catalog_publish_readiness"
  }
];

// Build 260 keeps historical process rows for audit, but removes completed build/migration
// mechanics from the current operator checklist. Current launch acceptance remains explicit.
export const RETIRED_STARTUP_PROCESS_IDS_BUILD260 = new Set([
  'deploy-239',
  'migration-237',
  'migration-238',
  'migration-239',
  'migration-240',
  'startup-single-interface',
  'media-derivatives',
  'markdown-retirement'
]);

const STARTUP_PROCESS_BUILD260_ADDITIONS = [
  {
    id:'deploy-260', order:1, category:'Deployment and UI health', severity:'blocker',
    title:'Deploy Build 260 and verify current assets, cache and Startup Command Center',
    why:'A mixed deployment can make current pages execute historical startup scripts or service-worker caches. Build 260 makes deployed-build parity a current acceptance requirement rather than asking staff to re-approve old build migrations.',
    where:['Cloudflare Pages → Deployments','/admin-startup-guide.html#ui-health','/admin-ui-health.html','Browser DevTools → Network and Application'],
    steps:[
      'Deploy the complete Build 260 Pages and Functions output to preview/staging.',
      'Hard-refresh /admin-startup-guide and run Check cache & build.',
      'Confirm the expected startup script build, fetched build and active rosie-app service-worker cache all report Build 260.',
      'Open /admin-ui-health and run the current route scan at desktop and phone widths.',
      'Confirm there is no recurring 404/500/1102 on required startup, media or booking APIs.',
      'Record only the deployment ID/date and safe outcome in evidence; do not store credentials or customer data.'
    ],
    done_when:'The current deployment, startup script, UI scanner and service-worker cache all identify Build 260, required routes pass, and no historical cache/build mismatch remains.',
    route:'/admin-startup-guide.html#ui-health', evidence_key:'deploy_260', source_build:260
  },
  {
    id:'photo-studio-sync-260', order:40, category:'Media and public proof', severity:'high',
    title:'Accept the bounded Photo Studio R2 sync and assignment reset workflow',
    why:'The public image library is now large enough that one Worker invocation must not scan and patch the entire library. Build 260 synchronizes one cursor-bounded page from one approved R2 folder per invocation and batches database upserts while preserving explicit placements.',
    where:['/admin-photo-studio.html','Cloudflare Workers Logs','Supabase → app_media_library','Supabase → app_media_assignments'],
    steps:[
      'Open Photo Studio normally and confirm it loads from the managed database without scanning R2.',
      'Press Sync approved R2 photos once and confirm each approved folder completes without Too many subrequests or Error 1102.',
      'Assign one harmless photo to two different test placements and confirm both placements remain visible.',
      'Reset one of those placements to default and confirm only that placement returns to its authored/default image.',
      'Confirm the second placement still uses the selected photo and the photo remains in the library.',
      'Remove the remaining test assignment or restore the original authored assignment before finishing.'
    ],
    done_when:'Approved-folder sync completes within Worker limits, one photo can safely serve multiple placements, and Reset to default removes only the selected explicit placement.',
    route:'/admin-photo-studio.html', evidence_key:'photo_sync_260', source_build:260
  },
  {
    id:'vehicle-size-review-259', order:41, category:'Booking and customer communication', severity:'blocker',
    title:'Accept the Build 259 uncertain vehicle-size review and customer correction flow',
    why:'Bookings with an uncertain vehicle classification must not silently charge the wrong package size. Staff need to verify the selected size or send a secure correction that the customer can confirm or cancel.',
    where:['sql/2026-08-13_build259_vehicle_size_review.sql','/admin-booking.html','/book.html','test customer email'],
    steps:[
      'Confirm the Build 259 vehicle-size review migration has been applied in staging.',
      'Create one harmless booking with a model that can be classified confidently and confirm it remains verified.',
      'Create one harmless uncertain/manual vehicle and confirm it is flagged for staff review.',
      'Verify one uncertain booking without changing size and confirm no customer interruption is required.',
      'For another test booking, propose a corrected size/price and send the secure confirmation link.',
      'Open the link as the test customer, confirm the corrected booking, then separately test the cancel outcome with another harmless record.',
      'Verify expired/used tokens cannot be reused.'
    ],
    done_when:'Known vehicles stay verified, uncertain vehicles enter review, staff can accept or propose a correction, and the one-time customer link can confirm or cancel safely.',
    route:'/admin-booking.html', evidence_key:'vehicle_size_review_259', source_build:260
  },
  {
    id:'media-health-260', order:42, category:'Media and public proof', severity:'high',
    title:'Accept database-first Media Health and a bounded public-delivery sample',
    why:'Media Health should summarize the managed library cheaply and only perform a small explicit delivery sample. It must not fan out hundreds of public URL probes during page load.',
    where:['/admin-media-health.html','/admin-photo-studio.html','Cloudflare Workers Logs'],
    steps:[
      'Open Media Health and confirm the managed-library summary loads without a deep public scan.',
      'Review missing alt text, large files, unassigned images, missing storage identity and duplicate candidates.',
      'Use the Photo Studio links from a few flagged items and confirm they select or locate the correct asset.',
      'Run the explicit public-delivery sample and confirm it checks only the bounded sample shown in the interface.',
      'Confirm normal page load and summary refresh do not produce subrequest-limit or 1102 errors.'
    ],
    done_when:'Media Health is current with Photo Studio, normal load is database-first, and the explicit delivery sample is bounded and actionable.',
    route:'/admin-media-health.html', evidence_key:'media_health_260', source_build:260
  },
  {
    id:'daip-project-flow-260', order:43, category:'DAIP and media', severity:'high',
    title:'Accept the normal fresh DAIP project workflow and governance boundaries',
    why:'Creative Projects is the normal starting point for new DAIP work. Intake Dry Run is only a fictional validation rehearsal and Gate C is a governance/technical evidence gate, not a per-project publishing button.',
    where:['/admin-creative-projects.html','/admin-daip-media.html','/admin-daip-intake-dry-run.html','/admin-daip-gate-c.html'],
    steps:[
      'Create one harmless Creative Project using the Start fresh DAIP project guidance.',
      'Open private DAIP Media Intake for that project and confirm raw media remains private.',
      'Use Intake Dry Run separately with fictional metadata to confirm validation/rejection rules without uploading a real file.',
      'Open Gate C and confirm it records technical/governance review evidence only and remains held unless the broader gate criteria are deliberately satisfied.',
      'Return to the Creative Project and confirm consent/content-package review remains separate from raw-media intake.'
    ],
    done_when:'Staff can explain and follow Create Project → private raw intake → review/content package, while Dry Run and Gate C are used only for their intended validation/governance purposes.',
    route:'/admin-creative-projects.html', evidence_key:'daip_project_flow_260', source_build:260
  },
  {
    id:'quote-pipeline-259', order:44, category:'Leads and fleet', severity:'high',
    title:'Accept the editable quote pipeline and booking hand-off',
    why:'Fleet and custom-service leads need an actionable quote workspace rather than a read-only dashboard.',
    where:['/admin-quotes.html','/fleet.html','/admin-booking.html'],
    steps:[
      'Create or select one harmless quote row.',
      'Edit customer, town, scope, quoted amount, probability, source, follow-up stage and follow-up date.',
      'Save and refresh to confirm the shared database record persists.',
      'Link a harmless booking where appropriate and use Open booking dashboard.',
      'Confirm mobile/tablet controls remain usable and no quote action silently changes an unrelated booking.'
    ],
    done_when:'A quote can be selected, edited, saved, followed up and deliberately linked to a booking with clear shared state.',
    route:'/admin-quotes.html', evidence_key:'quote_pipeline_259', source_build:260
  }
];

export const STARTUP_PROCESS_CATALOG_BUILD260 = [
  ...STARTUP_PROCESS_CATALOG_BUILD246.filter((item)=>!RETIRED_STARTUP_PROCESS_IDS_BUILD260.has(String(item.id||item.process_key||''))),
  ...STARTUP_PROCESS_BUILD260_ADDITIONS
].sort((a,b)=>Number(a.order||a.sort_order||9999)-Number(b.order||b.sort_order||9999));

export const STARTUP_PROCESS_BUILD = 260;
