# Rosie Dazzlers AI Project Handoff — Build 209

**Updated:** 2026-06-17  
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
