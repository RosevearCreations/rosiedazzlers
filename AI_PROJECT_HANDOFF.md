# Rosie Dazzlers AI Project Handoff — Build 215

**Updated:** 2026-06-30  
**Read first:** This is the primary technical/business handoff for a new AI chat or future build pass.

## Product north star

Rosie Dazzlers is a mobile auto-detailing website and operations application for Oxford County and Norfolk County, Ontario. The app should help a small owner-operated business:

1. get found locally;
2. turn leads into trackable quotes;
3. convert quotes into bookings and deposits;
4. interact with customers during the detail;
5. document work and protect the business with private evidence;
6. invoice, collect payment, request reviews, and bring customers back.

The connected lifecycle is:

`lead / quote → booking → live detail interaction → proof of work → invoice/payment → review/public proof → repeat maintenance`

Avoid creating isolated admin pages unless they clearly advance this lifecycle.



## Build 210 central capability: connected live-job closeout

Build 210 connects the original live-interaction promise to the rest of the business lifecycle instead of leaving updates as isolated timeline entries.

- New live updates and customer replies create customer/staff notification events.
- Customer and staff views expose unread counts using last-view timestamps.
- Detailer media uploads show progress, can be cancelled/retried, and preserve a failed upload session for diagnostics.
- Video uploads have duration/size limits, compression guidance, and retention metadata.
- A booking cannot be marked complete until arrival, during-work, and final media exist, unless an authorized override reason is recorded.
- Issue-stage updates/media can become linked private incident reports with evidence.
- Customer-visible recommendations can include a price and customer approve/decline/discuss controls.
- An approved priced recommendation creates a draft final-balance payment request.
- Staff can generate a completed-job customer summary with proof, products, payment state, care advice, and maintenance recommendations.
- Approved final photos can be queued for Gallery Approval and vehicle history without re-uploading.
- Review requests are blocked when completion, payment, summary, or incident safety conditions are not met.
- `/admin-today.html` provides one owner-friendly prioritized action queue.

Primary Build 210 migration: `sql/2026-06-17_build210_connected_live_workflow.sql`.
Primary structured build record: `data/build210_connected_live_workflow.json`.

## Build 209 central capability: live detail interaction

The original product promise is now explicit throughout the app. During a job, a detailer can post:

- text notes;
- photos;
- short videos;
- before, arrival, during, final, recommendation, and issue-stage updates;
- customer action requests;
- private evidence or discussion.

Every post must use one of three audiences:

1. **Customer now** — immediately customer-visible through the secure progress token.
2. **Admin review first** — private until an administrator approves the customer-safe version.
3. **Staff only** — detailer/administrator only and never returned by the public progress API.

Primary screens:

- `/detailer-jobs.html` — mobile-first live detailer workspace with direct photo/video upload.
- `/admin-progress.html` — staff moderation, approval, hiding, pinning, and customer-safe publishing.
- `/progress.html?token=…` — customer timeline, media, workflow status, comments, and sign-off.
- `/admin.html` — live interaction diagnostics and pending-review warning.

Primary APIs/tables:

- `functions/api/detailer/job_note_post.js`
- `functions/api/admin/progress_post.js`
- `functions/api/admin/progress_media_post.js`
- `functions/api/admin/progress_moderate.js`
- `functions/api/admin/progress_list.js`
- `functions/api/progress/view.js`
- `functions/api/progress/comment_post.js`
- `public.job_updates`
- `public.job_media`
- `public.job_signoffs`

Privacy rules:

- Public progress results include only approved customer-safe notes/media.
- Internal booking-event notes and payloads are filtered from the customer response.
- Private uploaded media may be stored by bucket/path and returned to staff using short-lived signed URLs.
- Review-pending rows remain internal until approval.
- Incident reports remain a separate protected workflow for damage, faulty equipment, or disputes.

Run `sql/2026-06-17_build209_live_detail_interaction.sql` before expecting all enhanced visibility, stage, storage, and review fields to be available.

## Current strong foundations

### Public/customer

- Responsive desktop website and mobile-first booking/progress experiences.
- Service, pricing, add-on, service-area, town, fleet, gift, maintenance, and gallery pages.
- Booking wizard, deposits, customer dashboard, progress token, comments, and sign-off.
- Before/after gallery with image fallback and approval workflow.
- Local service/town copy, structured-data previews, one-H1 release guard, sitemap/robots checks.

### Admin/owner

- Independent dashboard diagnostics so one failing card does not blank the dashboard.
- Booking, lead, quote, payment, accounting, inventory, media, gallery, incident, marketing, SEO, and editable-setting foundations.
- Workflow Command Center connecting quote through repeat maintenance.
- Gallery Approvals, Quote Pipeline, Value-Added Operations, Docs/Sanity, and live interaction diagnostics.
- Friendly editors for routine settings; raw JSON is emergency recovery only.

### Detailer/staff

- Assigned-job mobile workspace.
- Workflow status actions, notes, photos, videos, visibility selection, customer-action requests, incidents, and progress links.
- Proof-of-work and vehicle-history foundations from Build 206.

## Documentation policy

Only two Markdown files are active strategy documents:

1. `AI_PROJECT_HANDOFF.md` — current system state, safety rules, architecture, deployment, and continuation instructions.
2. `MASTER_VALUE_ROADMAP.md` — completed priorities, next 20 steps, SEO/competitive direction, and value sequencing.

Required audit/history files remain in the repository because historical release guards depend on them:

- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `DATABASE_STRUCTURE_CURRENT.md`
- `SUPABASE_SCHEMA.sql`
- `README.md`
- `DOC_INDEX.md`
- competitor/release-check documents named in `scripts/release_check.py`

Twenty redundant handoff/planning files were moved to `docs/archive/` in Build 209. Do not restart active planning inside archived files.

## SEO/local visibility rules

- Keep exactly one meaningful visible H1 on every public page.
- Keep title, meta description, H1, canonical, and structured data aligned.
- Use real customer language and town/service combinations without creating thin duplicate pages.
- Prioritize Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Norwich/Otterville, and Waterford/Vittoria where service coverage and proof are legitimate.
- Use descriptive image filenames, alt text, captions, and nearby relevant copy.
- Add owned/customer-approved local proof; placeholders are temporary only.
- Keep Google Business Profile information, hours, services, photos, and review responses current.
- Never claim that a code change guarantees first-page placement. Search visibility also depends on distance, competition, prominence, reviews, crawl/index status, and ongoing proof.

## Competitive direction

Current detailing/field-service platforms emphasize the same direction this app is taking:

- Jobber: scheduling, route optimization, progress tracking, on-my-way messages, job photos, checklists, client portal, quoting, invoices, payments, and automated follow-up.
- Urable: automotive-detailing CRM, mobile workflow, route optimization, automated messaging, line-item projects, and customer portal.
- Mobile Tech RX: damage documentation with photos/notes, scheduling, photo capture, CRM, and reminders.
- OctopusPro: required photos, before/after evidence, findings, approvals, signatures, and proof of work.
- QuoteIQ: route-aware operations, photo documentation, quoting/invoicing, reviews, and recurring/fleet workflows.

Rosie Dazzlers should match the useful workflow outcomes without copying competitor wording or adding enterprise complexity that does not help a one-vehicle-per-day business.

## Current risks and constraints

1. **Migration dependency:** enhanced live interaction safely falls back to legacy columns, but the Build 209 migration is required for full review/storage metadata.
2. **Admin complexity:** many foundations exist; owner “today needs attention” grouping remains more valuable than more siloed pages.
3. **Real media:** visual placeholders improve presentation, but real approved photos/videos create trust and local prominence.
4. **Video cost/limits:** future work should add file-size/duration limits, compression guidance, retention controls, and storage diagnostics.
5. **Browser testing:** static release checks do not replace testing Cloudflare Pages, Supabase, R2, Stripe, PayPal, email, and mobile devices.
6. **Legacy release guards:** old build guards make documentation cleanup slower. Retire guards only after replacing their current coverage.

## Deployment checklist

1. Run outstanding SQL migrations, especially Build 209.
2. Set/verify Cloudflare and Supabase/R2 environment variables.
3. Run `python3 scripts/release_check.py`.
4. Run `python3 scripts/seo_h1_check.py`.
5. Run `python3 scripts/sync_route_copies.py --check`.
6. Deploy and browser-test:
   - `/`
   - `/book`
   - `/gallery`
   - `/detailer-jobs.html`
   - `/admin-progress.html`
   - `/progress.html?token=<real token>`
   - `/admin`
7. Test all three live-update audiences with a real staff session.
8. Confirm a staff-only update never appears in the customer response.
9. Confirm an admin-review update appears only after approval.
10. Confirm photo/video upload, signed preview, customer comment, and sign-off on mobile and desktop.

## Next best direction

Continue with the next 20 steps in `MASTER_VALUE_ROADMAP.md`. The first priorities are live-update notifications, media retention/compression, customer unread indicators, proof-of-work checklist integration, and automatic handoff from completed work to invoice/review/maintenance.


---

### Build 210 documentation sync — 2026-06-17

Active strategy is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This file is retained for historical, audit, specialist, or release-check context. Build 210 connects live job interaction to proof, customer decisions, payment handoff, closeout summaries, approved-media reuse, safe review requests, and the owner attention queue.

## Build 211 central capability: production reliability hardening

Build 211 focuses on making the connected live workflow production-ready rather than adding more scattered screens.

Primary additions:

- `/admin-production.html` — one owner/staff screen for notification providers, hosted payment links, upload reliability, retention cleanup, and end-to-end readiness.
- `/api/admin/production_reliability_report` — safe diagnostics that check provider configuration, payment-link gaps, failed notifications, weak-network upload sessions, retention-due media, unresolved incidents, and environment readiness without exposing secrets.
- `/api/admin/notification_provider_test` — configuration-only or safe test-send checks for email/SMS providers.
- `/api/admin/final_balance_checkout_create` — creates Stripe-hosted final-balance checkout sessions when `STRIPE_SECRET_KEY` is configured; manual fallback remains available.
- `/api/admin/storage_retention_sweep` — dry-run first retention review; permanent proof and legal-hold evidence are excluded and no physical object deletion happens.
- `/admin-today.html` now includes production reliability work such as provider setup, payment-link creation, upload recovery, and retention review.

Primary Build 211 migration: `sql/2026-06-18_build211_production_reliability.sql`.
Primary structured build record: `data/build211_production_reliability.json`.

Production reality check: email/SMS delivery still requires real provider webhook configuration; hosted final-balance links require Stripe test/live keys and webhook reconciliation; mobile upload reliability must still be tested on real devices and weak connections.

Build 211 documentation sync: canonical handoff updated for production reliability, hosted payment-link automation, notification provider checks, upload/retention diagnostics, and owner action simplification.

## Build 212 central capability: guided production testing

Build 212 converts the remaining reliability work into a plain-language, staff-facing acceptance process rather than leaving it as technical endpoint names.

- `/admin-test-centre.html` is the protected Guided Production Test Centre.
- It covers environment preflight, notification delivery, Stripe test checkout, customer privacy, mobile upload recovery, proof gates, incident/review safety, retention dry-run, and an end-to-end internal smoke test.
- Each test includes prerequisites, safety notes, exact actions, expected result, failure-recording instructions, and pass/blocked/fail history.
- Results are stored in `public.production_test_runs` after `sql/2026-06-20_build212_guided_production_testing.sql` is applied. Browser-only fallback is explicit when that table is not deployed.
- `docs/PRODUCTION_TEST_GUIDE.md` provides the same detailed instructions outside the app.

Build 212 does **not** prove the live Cloudflare/Supabase/R2/Stripe/provider environment from this build workspace. Production-readiness claims must be based on recorded internal tests, not static code checks.

Primary Build 212 migration: `sql/2026-06-20_build212_guided_production_testing.sql`.

> **Build 212 documentation sync:** Active direction is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. For real-world test instructions, use `docs/PRODUCTION_TEST_GUIDE.md` and `/admin-test-centre.html`; this file is retained for historical, audit, specialist, or release-check context.

## Build 213 central capability: owner action control and customer trust records

Build 213 reduces the last recurring owner friction in the connected workflow. Generated rows in **Today Needs Attention** are no longer only links: an authorized owner can assign a row to themselves, snooze it for one day or one week, resolve it with a recorded note, or reopen it. Each action is stored in `owner_attention_tasks`, avoids repeated noise for the configured suppression window, and writes a best-effort live-interaction audit event.

Customer-facing price decisions now require a typed acknowledgement name and explicit confirmation before a priced recommendation is approved. When Stripe is configured, the approval tries to create a hosted final-balance Checkout Session automatically while preserving the draft payment request when Checkout creation cannot complete. The secure progress page now displays approved payment links only for that booking token.

Completed-job summaries now support a customer acknowledgement, revision number, and revision archive. Staff can export a booking-scoped interaction audit CSV from `/admin-progress.html` without exposing signed private URLs or private storage paths.

Primary Build 213 migration: `sql/2026-06-22_build213_owner_action_customer_trust.sql`.

### Build 213 required acceptance tests

1. On `/admin-today.html`, use a safe internal test row and select **Assign me**, **Snooze 1 day**, and **Resolve**. Refresh and confirm the recorded state is respected.
2. On a test progress token, approve a paid recommendation only after typing an internal test name and checking the acknowledgement box. Confirm an open payment link is visible only on that test token.
3. Generate a completed-job summary, acknowledge it through the customer token, regenerate it, and confirm the new revision resets the customer acknowledgement while the prior revision is archived.
4. In `/admin-progress.html`, export the interaction audit and confirm the CSV does not contain a private media URL, R2 key, API key, address, or customer payment details.

Build 213 does not claim a final payment is settled until the real Stripe/PayPal webhook reconciliation is configured and tested in the deployed environment.

> **Build 213 documentation sync:** Active direction remains in this handoff and `MASTER_VALUE_ROADMAP.md`. Use `docs/PRODUCTION_TEST_GUIDE.md`, `/admin-test-centre.html`, and `/admin-production.html` for real-world acceptance evidence. Historical Markdown remains retained for audit and prior release guards.

---

### Build 214 documentation sync — 2026-06-23

Build 214 prioritizes Supabase containment and owner-task reliability. The active security action is to run `sql/2026-06-23_build214_security_task_orchestration.sql`, refresh Supabase Security Advisor, and test the application through Cloudflare Functions rather than restoring direct browser access to tables. Canonical planning remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.


## Build 214 central capability: security containment and owner-task orchestration

Build 214 responds to the Supabase Security Advisor RLS/public-table alert while reducing owner workflow friction.

Primary changes:

- `sql/2026-06-23_build214_security_task_orchestration.sql` enables RLS for public-schema tables, removes direct `anon`/`authenticated`/`PUBLIC` table grants, preserves service-role access for Cloudflare Functions, and adds the protected `rosie_security_posture_report()` RPC.
- `/admin-security.html` shows only table names, RLS state, and browser access flags. It never exposes records, keys, tokens, or customer data.
- `/admin-today.html` now supports manual tasks, My assigned work, due-date filters, due dates, and escalation metadata.

Critical deployment order:

1. Run the Build 214 SQL migration in Supabase SQL Editor.
2. Refresh Security Advisor and confirm RLS/public-access findings clear.
3. Use an internal booking to run the Guided Production Test Centre.
4. If a normal site screen fails, repair its Cloudflare Function or create a narrow server endpoint—never reintroduce broad direct browser table grants.

The browser must never contain `SUPABASE_SERVICE_ROLE_KEY`; Cloudflare Functions are the intended database boundary.

## Build 215 — public asset compatibility and DAIP planning (2026-06-30)

Build 215 addresses two separate concerns without conflating them.

### Public site asset compatibility

Verified Rosie-owned Service Hub/Local Hero images may exist in R2 as JPG files even where older runtime records, media tasks, or client markup expected `.webp`. The public image path is now format-aware for known Rosie asset URLs:

- canonical Local Hero keys use `landing-pages/<local-page-slug>.jpg`;
- the client tries the original URL, then same-name JPG/JPEG/WebP/PNG variants before visual fallback;
- the Admin Media Health scan reports the actual resolved URL and whether a compatible extension was used;
- `sql/2026-06-30_build215_media_asset_format_alignment.sql` aligns legacy Local Hero `media_asset_tasks` records to canonical JPG keys.

This does not hide a wrong filename, wrong folder, or wrong letter case. R2 keys are case-sensitive. The required first test is an incognito load of the exact `https://assets.rosiedazzlers.ca/<key>` URL and then the public page.

### DAIP documentation-only planning

The Digital Asset Intelligence Platform documentation under `docs/digital-asset-intelligence-platform/` is now part of the active planning context. Read `docs/digital-asset-intelligence-platform/10_Rosie_Dazzlers_Integration_Plan.md` before any DAIP implementation.

**Build 215 deliberately adds no DAIP production code, `daip_*` tables, worker, R2 DAIP bucket, AI model, Google Drive integration, processing queue, public export, or automatic publishing.** The plan establishes safe boundaries with existing bookings, job media, incidents, gallery approvals, vehicle history, RLS, retention, and staff approvals.

Primary future decision sequence:

`DAIP-0 security/cost/retention/consent decisions → DAIP-1 reviewed schema/storage foundation → selected manual intake → proxy/thumbnail worker → privacy review → story/export review → approved gallery/content handoff.`

## Build 216 — public media recovery and DAIP governance

Build 216 strengthens the public-asset boundary without changing the DAIP implementation status.

### Media reliability

- `/admin-media-health.html` now performs bounded concurrent public-image checks and reports failure categories rather than only blank/missing status.
- The client resolver still tries the approved original URL first, then compatible JPG/JPEG/WebP/PNG variants of the same known public asset key. It now has a bounded candidate timeout before it proceeds to the next safe fallback.
- After `sql/2026-07-01_build216_media_reliability_daip_governance.sql` is applied, each Media Health scan records only public asset metadata in `media_asset_health_observations`.
- A failure is **monitoring** after its first failed scan and becomes an active persistent alert after the second consecutive failed scan. One passing scan resolves it automatically.
- `media_asset_alerts` is staff-only and must never hold signed URLs, customer media, incident evidence, customer names, addresses, VINs, payment data, or secrets.
- Active/acknowledged public-media alerts also roll into Today Needs Attention as staff-only tasks.
- Public asset alerts are not yet automatically sent by email/SMS; use the protected Media Health screen and Today Needs Attention until notification provider delivery has passed guided tests.

### DAIP governance

DAIP remains **planning only**. Build 216 adds:

- `docs/digital-asset-intelligence-platform/11_DAIP_Decision_Register.md`
- `docs/digital-asset-intelligence-platform/12_DAIP_Phase_1_Security_Acceptance.md`

No DAIP worker, queue, schema, bucket, Drive sync, AI processing, export, or publishing flow was added. Do not create DAIP production code until all DAIP-0 decisions are owner-approved and a harmless internal test job is selected.

### Required Build 216 deployment order

1. Confirm Build 214 RLS containment is active and Supabase Security Advisor is clear.
2. Deploy Build 216 and confirm Cloudflare publishes both assets and Functions.
3. Run `sql/2026-07-01_build216_media_reliability_daip_governance.sql`.
4. Run Media Health twice with a harmless missing internal key; confirm monitoring then active alert.
5. Verify a passing scan resolves the alert.
6. Test Local Hero and Service Hub pages in incognito before replacing any further filenames.

### Current next best direction

Do not add another large standalone module. Verify the media/security production path, wire active media alerts into Today Needs Attention only after live testing, complete DAIP-0 decisions, and continue connecting approved final proof to gallery, vehicle history, reviews, and repeat maintenance.

### Build 216 synchronization — 2026-07-01

Build 216 synchronized this retained document with the active `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`: public media recovery now uses bounded JPG/JPEG/WebP/PNG health checks and protected recurring alerts after its migration; DAIP remains planning-only behind the documented decision/security gates.
