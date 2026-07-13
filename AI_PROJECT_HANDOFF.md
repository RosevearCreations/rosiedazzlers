# Rosie Dazzlers — AI Project Handoff (Build 225)

**Updated:** 2026-07-07  
**Living source of truth:** Read this file first, then `MASTER_VALUE_ROADMAP.md`. Historical Markdown is retained for audit/release support, not as competing planning.

## Build 225 central capability: social/analytics Connections Centre and DAIP external-service boundary

Build 225 adds `/admin-integrations.html`, a protected administrator workspace that reports only configuration presence for consent-first website measurement and Social Queue publishing connections. It does **not** show, accept, write, or store a credential in the browser, Supabase, GitHub, or Markdown.

- **Cloudflare only:** add every value at Cloudflare Dashboard → Workers & Pages → Rosie Dazzlers project → Settings → Variables and Secrets → **Secret (encrypted)**. The project may show only Secret; that is correct.
- **Website tags:** `META_PIXEL_ID`, `GA4_MEASUREMENT_ID`, `GOOGLE_ADS_CONVERSION_ID`, `TIKTOK_PIXEL_ID`, `LINKEDIN_PARTNER_ID`, `PINTEREST_TAG_ID`, and `MICROSOFT_UET_TAG_ID` are public tag identifiers only. They are stored as Cloudflare Secrets for operations, then may be returned as public code identifiers only when a visitor opts into optional measurement.
- **Server credentials:** Page access tokens, OAuth credentials, webhook secrets, and every other secret remain Cloudflare-only and never pass through `/api/tracking_config`, the admin page, page source, browser logs, app settings, or Supabase.
- **Consent boundary:** `/assets/marketing-consent.js` does not load any third-party tag until a visitor explicitly chooses optional measurement. It excludes admin, client, detailer, login, booking, progress, payment, invoice, account, and completion routes.
- **DAIP:** Build 225 adds `docs/digital-asset-intelligence-platform/20_DAIP_External_Service_Connection_Boundary.md`. Marketing/social credentials are not DAIP credentials. Gate C remains held: no DAIP storage, upload/download, signed link, worker, processing, AI, customer-media access, public export, or publishing exists.

Primary docs:
- `docs/SOCIAL_ANALYTICS_CONNECTIONS.md` — exact variable names, how to obtain IDs/credentials, Cloudflare entry point, staging/test order, current social-publishing limits, and rollback.
- `docs/digital-asset-intelligence-platform/20_DAIP_External_Service_Connection_Boundary.md` — DAIP separation and preflight evidence.
- `docs/PRODUCTION_TEST_GUIDE.md` — Build 225 staging test sequence.

**Current first provider to test:** GA4 only, on staging, with `MARKETING_TRACKING_ENABLED=true`, `MARKETING_TRACKING_MODE=test`, and an administrator verification in `/admin-integrations.html`. Use a private browser on a non-sensitive public marketing page, opt in, and verify through Google’s diagnostic tools. Do not test on a booking/payment/progress/customer route.

# Rosie Dazzlers — AI Project Handoff (Build 224)

**Updated:** 2026-07-06
**Living source of truth:** Read this file first, then `MASTER_VALUE_ROADMAP.md`. Historical Markdown remains retained for audit and release checks.

## Build 224 central capability: Gate C technical review and customer profile-quality safeguards

Build 224 adds `/admin-daip-gate-c.html`, an admin-only, test-mode Gate C technical-review and rollback acceptance workspace. It can save Draft, Blocked, or `accepted_for_test_only_implementation_review` evidence only after the existing Build 222/223 evidence is current. **Gate C remains Held in every state**; technical/public capabilities remain zero.

- **DAIP hard boundary:** Build 224 creates no storage, upload/download, signed authorization, external service configuration, processor, queue, AI, customer-media route, public destination, Gallery/Social/GBP handoff, export, or publishing capability.
- **Customer quality:** managers see a review-only duplicate warning from matching email/phone/sms values and a safe preference-change history. The app never auto-merges accounts or changes consent by itself.
- **Deployment order:** Apply the two Build 224 migrations in development/staging only, deploy Pages and Functions together, execute the five new Guided Production Test Centre cases, then record only verified outcomes.


# Rosie Dazzlers AI Project Handoff — Build 222

**Updated:** 2026-07-04
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





## Build 223 central capability: DAIP private-MVP design blueprint for independent review only

Build 223 creates `/admin-daip-design.html`, a protected, mobile-safe workspace that turns the written DAIP private-MVP proposal into a controlled independent-review record.

- A blueprint can be Draft, Paused, or submitted for independent review only.
- Submission requires a **currently valid** Build 222 written-design-review authorization, named design owner and independent reviewer, a safe design scope, threat model, upload-control outline, private-original/derived separation, cost/stop-rule outline, rollback/acceptance outline, all three hard-stop acknowledgements, and the exact phrase `SUBMIT DESIGN BLUEPRINT`.
- The database stores only safe design evidence and audit notes behind RLS/service-role access. The server rejects submission if the readiness authorization is missing or stale.
- **Hard boundary:** Build 223 creates no bucket, upload/download, signed URL, object key, worker, queue, processing, AI, customer-media route, public export, Gallery/Social/GBP handoff, or automatic publishing. Gate C remains Held.

Primary migration: `sql/2026-07-05_build223_daip_private_mvp_design_blueprint.sql`.

**Deployment order:** apply in development/staging after Builds 218, 219, and 222; deploy Pages and Functions together; run the three Build 223 Guided Production Test Centre cases; then record only verified outcomes in this handoff and `MASTER_VALUE_ROADMAP.md`.


## Build 222 central capability: DAIP Phase 1 readiness review for written private-MVP design only

Build 222 creates `/admin-daip-readiness.html`, a protected test-mode workspace that joins the Build 218 internal-test evidence, Build 219 owner decisions, and Build 220 readiness packet into one explicit decision: whether the owners may begin a **written** private-MVP design review.

- The server only accepts `ready_for_design_review` when Gate A (all 12 DAIP-0 decisions) and Gate B (all three Build 218 internal tests plus safe test control) are Ready.
- The exact phrase `AUTHORIZE DESIGN REVIEW`, consent separation, retention/legal-hold ownership, a budget stop rule, review date, and an accountable owner are required for that record.
- Records are append-only snapshots with safe audit events and stored gate evidence. Reopening a DAIP decision or losing passing test evidence makes an old authorization invalid for current planning.
- The system remains service-role-only behind Cloudflare Functions; browser roles are revoked from the new tables.
- **Hard boundary:** Build 222 does not provision storage, upload/download permissions, signed links, queues, workers, FFmpeg, proxies, thumbnails, AI, customer media, exports, Gallery/Social/GBP handoff, or automatic publishing. Gate C remains held.

Primary migration: `sql/2026-07-04_build222_daip_phase1_readiness_design_review.sql`.

**Deployment order:** apply the Build 222 migration in development/staging after Builds 218 and 219; deploy Pages and Functions together; run the three Build 222 Guided Production Test Centre cases; then record only verified outcomes in this handoff and `MASTER_VALUE_ROADMAP.md`.

## Build 220 central capability: controlled customer access management and DAIP readiness

Build 220 closes the client-account support gap without turning passwords or personal data into staff-editable content.

- `/admin-customers.html` is now the role-aware client workspace: directory, profile editing, booking/vehicle summary, safe audit history, secure access actions, archive-first lifecycle controls, and forgotten-sign-in-email help queue.
- **Detailer / senior detailer:** may update job-relevant operational fields such as safe contact/access and detailer-visible notes.
- **Administrator / booking manager:** may create client profiles, edit protected customer fields, send account-setup/reset/verification email, revoke sessions, and work the forgotten-email queue.
- **Administrator / staff-management role:** may suspend, restore, and archive an account. There is no permanent customer-delete button because linked bookings, payments, tax, consent, and audit records must remain traceable.
- Clients sign in with the email address on record; there is no separate username. `/login` now offers password reset, email verification, and a privacy-neutral forgotten-email support form.
- Staff never see or set a client password. Recovery uses server-issued opaque links. New same-purpose messages retire earlier links, token consumption is single-use/atomic, and a successful password reset revokes old sessions before a new session is created.
- New audit and recovery-intake tables remain RLS-protected and service-role-only.

Primary migration: `sql/2026-07-03_build220_customer_access_management_and_daip_readiness.sql`.

**Customer-auth deployment setting:** set `PUBLIC_SITE_ORIGIN` to the approved HTTPS site origin (as a Cloudflare Secret in this project) before production email-link testing. The code rejects unapproved origins rather than building account links from an arbitrary host.

**DAIP boundary:** Build 220 adds only `docs/digital-asset-intelligence-platform/16_DAIP_Phase_1_Readiness_Packet.md`, an owner meeting/acceptance worksheet. It does not create DAIP storage, upload, signed-link, worker, AI, export, customer-media, gallery/social, or publication capability. Gates C–F remain held.

**Deployment order:** apply the Build 220 migration in development/staging, deploy Pages and Functions together, run the four Build 220 Guided Test Centre cases, then record only verified outcomes in this handoff and `MASTER_VALUE_ROADMAP.md`.

## Build 219 central capability: DAIP governance and promotion gates

Build 219 turns the DAIP-0 decision register into an admin-only, database-backed governance workspace without moving DAIP into media production.

- `/admin-daip-governance.html` records a draft or owner-approved answer for each of the 12 DAIP-0 decisions.
- Approval requires an exact decision-specific phrase, a recorded accountable owner, cost/operational impact, privacy/safety impact, review date, revision number, actor/time, and audit event.
- The workspace reads the three Build 218 DAIP Test Lab results and exposes Gates A–F in plain language.
- Gate A can only become ready when all twelve DAIP-0 rows are approved. Gate B can only become ready when Build 218 Test Lab evidence is passed and the test control remains safe.
- Gates C–F remain hard-held. Build 219 cannot provision storage, accept upload bytes, issue a signed URL, create a background worker, process a file, expose a customer route, hand off to Gallery/Social, or publish anything.
- New tables use RLS, revoke browser-role grants, and are accessed only through Cloudflare Functions using the service role.

Primary migration: `sql/2026-07-02_build219_daip_governance_workspace.sql`.

**Operational rule:** Complete decisions and Test Lab evidence in development/staging first. A DAIP-0 approval is a governance record, not a production switch. Before the next technical phase, read `docs/digital-asset-intelligence-platform/15_DAIP_Governance_Workspace_Process.md` and the promotion gates.

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

## Build 217 — secure final-balance links and customer-safe payment status (2026-06-30)

Build 217 closes the previously incomplete final-balance path. Staff can now create a tracked final-balance request, issue a short-lived opaque link, create Stripe Checkout from that request, and let the Stripe webhook settle the record idempotently. The customer-facing payment page is token-gated, has one clear H1, is noindex/noarchive, returns no customer PII, and only exposes an open/paid/expired/cancelled state with amount and a provider checkout URL when appropriate.

### What changed

- Added `/final-balance-payment.html` and clean route copy as the customer-safe landing page for a final-balance link.
- Added SHA-256 token-hash storage, 14-day default expiry, 90-day maximum expiry, replacement, cancellation, reopen, and explicit notification-queue controls.
- Added `/api/final_balance_payment_view`, which requires both request UUID and opaque token and disables caching.
- Added an Admin Payments final-balance work queue with copy, checkout, expiry, rotate, cancel/reopen, and notification actions.
- Added Stripe `checkout.session.completed` final-balance settlement with idempotency and safe booking-event logging.
- Removed token hashes and staff-entered notes from browser-facing final-balance responses.
- Added a generic secure-payment visual placeholder slot; it must never use a real invoice, payment link, QR code, card data, or customer details.

### Required deployment and controlled test

1. Apply `sql/2026-06-30_build217_secure_final_balance_links.sql` after the existing payment migrations.
2. Deploy Cloudflare Pages and Functions together.
3. In Stripe **test mode**, create one final-balance request, create checkout, complete it once, then resend the same event to confirm idempotency.
4. Verify invalid-token, expired, and cancelled URLs reveal no customer information.
5. Test notification queuing with a controlled mailbox before treating it as delivery-confirmed.

### Current next best direction

Do not expand payments further until the migration, Stripe test-mode webhook, and controlled notification test pass. Then pair approved final media with consent into Gallery and vehicle history, complete the real mobile upload tests, and only schedule review requests after final payment, customer acknowledgement, and incident checks.

### SEO and competitive recheck — 2026-06-30

- Rechecked Google Search Central guidance: keep people-first service copy, use the words customers search in titles and the single main heading, make links crawlable, and keep descriptive image filenames/alt text near relevant content. Continue validating structured data against visible page content rather than using markup as a ranking shortcut.
- Rechecked Jobber Client Hub and Urable’s detailing workflow positioning. The competitive baseline is a mobile-friendly self-service journey: request/quote approval, appointment information, payment/receipt, connected booking-to-billing status, customer communication, and vehicle/job history.
- Build 217 directly improves the payment/receipt/status portion of that path. Do not chase broad feature parity before the controlled payment release, consent-aware proof reuse, and review/maintenance gates work reliably.



## Build 218 — DAIP internal test foundation (2026-07-02)

Build 218 turns the DAIP documentation into a narrow **internal-test-only** system without treating DAIP as production-ready. The protected **DAIP Test Lab** is the only Build 218 operating surface.

### What is implemented

- `sql/2026-07-02_build218_daip_test_mode_foundation.sql` creates service-role-only DAIP test control, `RD-TEST-YYYYMMDD-###` media-job records, metadata-only asset records, non-executing planning tasks, internal privacy reviews, and safe audit events.
- Every control flag is constrained to internal test/no storage/no worker/no public export/no automatic publishing.
- The asset table deliberately has no public URL, signed URL, storage bucket, storage key, object path, or Drive ID column.
- `/admin-daip.html` is an administrator-only mobile/desktop Test Lab. It does not show customer details or receive media bytes.
- `/admin-test-centre.html` now includes three Build 218 tests: DAIP safety preflight, internal registry, and internal privacy/export-block proof.
- `docs/digital-asset-intelligence-platform/13_DAIP_Test_Mode_Process.md` describes exact test use; `14_DAIP_Production_Promotion_Gates.md` defines the next production gates.

### What remains intentionally disabled

No DAIP original upload, R2 DAIP bucket, signed URL, Google Drive mirror, worker, FFmpeg, proxy, contact sheet, AI/vision/transcription, export, gallery handoff, customer media access, social/GBP integration, or publishing is available in Build 218.

### Required deployment/test order

1. Confirm Build 214 RLS containment and Security Posture still pass.
2. Deploy site and Functions together.
3. Apply `sql/2026-07-02_build218_daip_test_mode_foundation.sql` in **development/staging only**.
4. Open `/admin-daip.html` as admin and confirm `internal_test`, metadata-only, public blocked, and zero executable tasks.
5. Use one opaque DAIP-only test reference and fictional test asset metadata only; never connect the Test Lab to a booking record.
6. Record all three DAIP tests in `/admin-test-centre.html`.
7. Confirm Gallery, customer progress, and Social Queue never show the DAIP test record.
8. Do not consider real media/storage/worker work until DAIP-0 decisions and `14_DAIP_Production_Promotion_Gates.md` are complete.

### Current strongest next direction

First run the Build 218 internal tests. Then complete the 12 DAIP-0 owner decisions in the decision register, especially worker host, budget stop rule, storage/backup policy, consent language, retention, and privacy approvers. The next code pass should be a reviewed private upload/storage design only—not AI, public galleries, or automatic posting.

## Build 221 hotfix — customer-admin route 405 repair

Build 221 is a no-schema hotfix for the `/admin-customers.html` page after staging showed `api/admin/customer_admin_list` returning HTTP 405 while the page displayed the Customer account access visual placeholder.

What changed:
- Added generic Cloudflare Pages `onRequest` dispatchers to the Build 220 customer-admin endpoints so GET, POST, and OPTIONS are accepted through a single route entrypoint as well as the method-specific handlers.
- Added a safe page-side fallback so list-style customer-admin requests retry with GET if a deployment returns 405 on POST.
- Updated the service-worker cache to `rosie-app-v20260703build221` so old admin page code is less likely to stay cached.
- Added `data/build221_customer_admin_route_hotfix.json` and a Build 221 guard script.

No Supabase migration is required. Deploy the Pages site and Functions together, then hard-refresh `/admin-customers.html`. A correct result is a normal JSON response, authentication response, or permission response from `/api/admin/customer_admin_list`; it should not be 405.

DAIP boundary remains unchanged: no production storage, uploads, workers, AI, customer media access, public gallery export, social publishing, Google Business Profile export, or automatic publishing was added.


## Build 226 — DAIP metadata-only intake dry run (2026-07-08)

Build 226 adds a protected fictional-manifest validator at `/admin-daip-intake-dry-run.html`. It validates filename, MIME type, declared size, fictional SHA-256 shape, rejection reasons, aggregate size, and a planning-only cost estimate. It accepts no file bytes and creates no storage authorization, object path, worker execution, customer-media route, public destination, or publishing path. Gate C remains held.

Apply `sql/2026-07-08_build226_daip_intake_dry_run.sql` in staging only, then run one accepted and one rejected fictional manifest. The two living strategy documents remain this file and `MASTER_VALUE_ROADMAP.md`; older Markdown remains retained audit and release evidence.

## Build 227 — roadmap execution and DAIP validation policy (2026-07-09)

### Completed next 20 steps

1. Added a DB-backed active roadmap execution queue.
2. Seeded the current next 20 cross-workstream priorities.
3. Added roadmap status values: planned, in progress, blocked, done, and deferred.
4. Added priority, workstream, owner, target build, source document, and sort order.
5. Added safe evidence notes for deployment/test proof.
6. Added an append-only roadmap audit table.
7. Added protected admin dashboard and save APIs.
8. Added `/admin-roadmap-execution.html` with responsive desktop/mobile controls.
9. Added status KPI counts for the active next 20.
10. Added a visual placeholder for the internal execution workflow.
11. Moved DAIP manifest-count limits into a protected DB policy.
12. Moved image/video declared-size limits into the protected DB policy.
13. Moved storage-rate planning assumptions into the protected DB policy.
14. Added monthly warning and hard-stop planning values.
15. Forced Gate C to remain held at the database constraint level.
16. Forced technical capability to remain disabled at the database constraint level.
17. Updated Build 226 validation to read policy with safe code defaults.
18. Updated admin navigation, route copies, service worker, and access rules.
19. Updated canonical schema, active Markdown, test guidance, and release evidence.
20. Re-ran one-H1, route parity, JavaScript, CSS/responsive, and release checks.

### Next 20 steps after Build 227

1. Apply the Build 227 migration in staging and verify RLS/service-role containment.
2. Assign owners and statuses to all 20 seeded roadmap items.
3. Record Build 226 accepted and rejected fictional-manifest evidence.
4. Confirm warning and hard-stop amounts with the owners.
5. Complete all DAIP Gate A owner decisions.
6. Complete all DAIP Gate B safety-test evidence.
7. Conduct the independent Gate C rollback review.
8. Keep real uploads, storage, workers, AI, and publishing disabled until Gate C is separately approved.
9. Run customer recovery, archive, and restore staging tests.
10. Build a manual duplicate-customer merge dry run with no automatic transfer.
11. Verify Stripe final-balance settlement, cancellation, and webhook replay in test mode.
12. Verify notification delivery with a controlled inbox.
13. Run mobile weak-network upload retry tests using harmless test media.
14. Add approved final proof to gallery candidates only with consent/provenance.
15. Add approved final proof to vehicle history only after privacy review.
16. Gate review requests on settled payment, acknowledgement, and no unresolved incident.
17. Review Search Console and Business Profile evidence before changing local titles.
18. Replace public placeholders only with approved Rosie-owned local proof.
19. Archive redundant Markdown only after release-guard dependency scanning.
20. Continue one-H1, title/meta, local wording, error fallback, and CSS drift checks every pass.


## Build 228 — Creative Project Intelligence foundation (2026-07-12)

Build 228 changes the operational centre from product-first to **project/process-first**. `/admin-creative-projects.html` records a project idea, purpose, audience, lifecycle, work sessions, materials, mistakes/fixes, time, costs, outcomes, lessons, and future recommendations. Each new project receives governed output records for YouTube, Shorts, Reels, TikTok, Facebook video, Pinterest, Etsy draft, website page, blog, gallery, before/after, educational article, archive, material report, cost analysis, lessons learned, and future recommendations.

Publishing is never automatic: public publishing defaults off, consent review is separate, and every output follows planned → drafting → review → approved → scheduled → published or not applicable. Product pages and Etsy drafts are optional outputs; they are not the primary project record.

Primary migration: `sql/2026-07-12_build228_creative_project_intelligence_foundation.sql`. Primary UI: `/admin-creative-projects.html`. Canonical schema: `SUPABASE_SCHEMA.sql`.

### Next 20 steps after Build 228

1. Apply the Build 228 migration in staging and verify RLS/service-role containment.
2. Create one fictional project and verify all seventeen output records are seeded.
3. Test mobile project creation and session logging.
4. Add controlled project-to-booking association without making bookings the project source of truth.
5. Add media-manifest references after DAIP Gate C approval; keep file bytes disabled until then.
6. Add structured material-line usage tied to inventory transactions.
7. Add session time rollups and estimated-versus-actual labour.
8. Add project cost breakdown with material, labour, overhead, fees, and waste.
9. Add before/after applicability and consent gating.
10. Add a project story outline generated from approved session notes.
11. Add YouTube long-form outline drafts.
12. Add short-form hook and clip-plan drafts for Shorts, Reels, TikTok, and Facebook.
13. Add Pinterest title/description/image-plan drafts.
14. Add Etsy and website listing drafts without automatic publication.
15. Add blog and educational article drafts with source-note citations.
16. Add project archive export and recovery package.
17. Add lessons-learned extraction with human approval.
18. Add future-project recommendation ranking using completed project history.
19. Add output approval dashboard and destination readiness checks.
20. Keep one-H1, title/meta, local wording, responsive CSS, fallback, and privacy checks in every release.


## Build 229 — standard jobs remain first-class
Rosie Dazzlers now has two explicit operating paths. The existing customer-led booking workflow remains the default **standard job** and does not require a creative project. Staff may deliberately opt a selected booking into Creative Project Intelligence from `/admin-booking.html`; that creates a separate project record while the booking remains the operational source of truth for scheduling, service, payment, progress and completion. No booking is automatically converted and no project output publishes automatically.
