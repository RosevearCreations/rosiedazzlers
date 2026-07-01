# Rosie Dazzlers Master Value Roadmap — Build 217

**Updated:** 2026-06-30
**Purpose:** This is the one active business/product roadmap. Historical build detail remains in `DEVELOPMENT_ROADMAP.md`; active decisions belong here.

## North star

Build a professional, mobile-first detailing platform that gets found locally and connects every customer relationship from first lead through repeat maintenance.

`lead / quote → booking → live detail interaction → proof of work → invoice/payment → review/public proof → repeat maintenance`

## Build 209 completed priorities

1. Added a mobile-first live detailer workspace with direct photo/video upload.
2. Added three explicit audiences: customer now, admin review first, and staff only.
3. Added job-stage tagging for arrival, pre-existing condition, during work, final, recommendation, issue, and general updates.
4. Added customer-action-required flags.
5. Added enhanced DB metadata for review status, visibility, approval, stages, and source channel.
6. Added private storage bucket/path support with signed staff/customer-safe media reads.
7. Added adaptive legacy-schema fallback so older databases fail safely instead of losing the workflow.
8. Added admin moderation actions for approve, reject/hide, staff-only, visible, and pinned updates.
9. Added live-feed health statistics for customer-visible, review-pending, private, and action-needed items.
10. Added a public customer timeline combining approved notes, photos, and videos.
11. Added 20-second customer timeline refresh plus manual refresh and visibility-change refresh.
12. Added customer comments with private-safe booking event logging.
13. Filtered internal booking events and payloads from the public progress API.
14. Removed private detailer response reasons from customer payloads.
15. Added progress last-viewed, last-customer-message, and last-staff-update timestamps.
16. Added live interaction diagnostics to the Admin Dashboard.
17. Added responsive live-feed/media CSS and mobile sticky actions.
18. Added visual placeholders for live customer updates, private staff notes, and progress video.
19. Added route-copy synchronization for detailer jobs and admin progress.
20. Retired twenty redundant planning/handoff Markdown files into `docs/archive/` while preserving required release-history files.

## Next 20 value-added steps

1. Add customer and admin notifications when a new live update or customer reply is posted.
2. Add unread/read indicators per booking for customer messages and staff updates.
3. Add video duration/file-size limits, pre-upload warnings, and optional client-side compression guidance.
4. Add media retention/archive rules after job completion while preserving incident/legal evidence.
5. Add upload progress, retry, cancellation, and offline queue recovery for weak mobile connections.
6. Connect proof-of-work checklist steps directly to required arrival/during/final media.
7. Add pre-existing-condition walkaround templates by vehicle area.
8. Add one-click conversion of an issue-stage update into a private incident report with linked evidence.
9. Add customer approval/decision buttons for recommended add-on work during a live job.
10. Add price-change approval and payment-request handoff from a customer-approved recommendation.
11. Add a completed-job customer summary that combines checklist, approved media, invoice, and care recommendations.
12. Trigger review requests only after payment/completion and no unresolved incident.
13. Offer approved final media for Gallery Approval without duplicating uploads.
14. Add approved live media into the vehicle history timeline.
15. Create repeat-maintenance suggestions from service type, season, vehicle condition, and completed date.
16. Add owner “Today needs attention” grouping for unread customer replies, pending media approvals, incidents, quotes, and payments.
17. Add storage usage, orphaned upload, broken signed-path, and retention diagnostics.
18. Add audit exports showing who posted, approved, hid, or published every live item.
19. Add accessibility testing for video controls, captions/transcripts, keyboard moderation, and screen-reader timeline labels.
20. Run live Cloudflare/Supabase/R2 mobile testing and capture issues in the two canonical docs.

## Value sequencing after the next 20

### Revenue and conversion

- Real quote CRUD connected to leads, deposits, booking conversion, follow-up age, and close rate.
- Customer approval for in-job recommendations and price changes.
- Meta ad attribution from campaign/UTM through quote, booking, revenue, and repeat work.

### Trust and documentation

- Required proof-of-work checklists with start/finish evidence and customer sign-off.
- Vehicle history timeline with services, invoices, approved photos/videos, recommendations, and incidents.
- Approved media reuse across gallery, review proof, town/service landing pages, and social drafts.

### Repeat revenue

- Maintenance plan/reminder engine driven by completed work and season.
- Fleet account vehicles, intervals, terms, recurring quotes, and proof packages.
- Seasonal campaigns for salt removal, spring reset, pet hair, odor, protection, gift cards, and fleets.

### Owner simplicity

- One “today needs attention” command center.
- Fewer separate screens for routine work.
- Friendly forms by default; raw JSON only for emergency recovery.
- Independent diagnostics and safe fallback-backed reads.

## SEO and local visibility guardrails

- One clear H1 per public page.
- Unique, concise titles and useful descriptions aligned with visible content.
- Real search language in titles, H1s, body copy, alt text, and internal links.
- Complete, accurate, non-duplicated town/service content supported by actual service coverage and proof.
- Descriptive image filenames/alt text, nearby captions, and customer consent.
- Crawlable internal links, canonical URLs, sitemap/robots health, and complete structured data.
- Mobile and desktop content parity; do not hide important SEO copy or media from the mobile version.
- Strong page experience, touch targets, resilient layouts, and reduced-motion support.
- Google Business Profile completeness, current hours, service details, photos, posts, reviews, and responses.
- No first-page guarantee: relevance, distance, prominence/popularity, competition, reviews, and indexing are outside the codebase alone.

## Competitive research applied

Official/current source themes reviewed for this direction:

- Google Search Essentials: prominent, people-used wording in titles/main headings and descriptive locations.
- Google title-link guidance: avoid multiple equally prominent page titles/headings.
- Google image guidance: descriptive filenames, titles, alt text, relevant nearby copy, and structured data where appropriate.
- Google Business Profile: local results mainly depend on relevance, distance, and prominence/popularity.
- Jobber: scheduling, route optimization, progress tracking, on-my-way messaging, job photos/checklists, CRM/client portal, quotes, invoices, payments, and follow-up.
- Urable: automotive-detailing CRM, mobile workflow, automated messaging, route optimization, project line items, and customer portal.
- Mobile Tech RX: damage documentation, photos/notes, scheduling, CRM, and reminders.
- OctopusPro: required photos, before/after, findings, approvals, signatures, and proof of work.
- QuoteIQ: route-aware scheduling, photo documentation, quoting/invoicing, reviews, and recurring/fleet work.

Sources:

- https://developers.google.com/search/docs/essentials
- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/appearance/google-images
- https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing
- https://support.google.com/business/answer/7091
- https://www.getjobber.com/industries/auto-detailing-software/
- https://urable.com/
- https://www.mobiletechrx.com/
- https://octopuspro.com/field-service-management/car-wash-auto-detailing-software/
- https://myquoteiq.com/crm-for-mobile-detailing/

## Documentation rule

Active strategy goes only into:

- `AI_PROJECT_HANDOFF.md`
- `MASTER_VALUE_ROADMAP.md`

Append short build/audit summaries to required historical files. Put retired duplicate planning files in `docs/archive/`; do not delete history that may still explain an old migration or release guard.


## Build 210 — connected live workflow completed (2026-06-17)

### Completed 20 steps

1. Added customer notification events for customer-visible live updates, media, approvals, workflow changes, and completed-job summaries.
2. Added staff notification events for customer replies, review-pending updates/media, private notes, and recommendation decisions.
3. Added customer unread update counts based on the previous secure-progress view.
4. Added staff unread customer-reply counts per booking.
5. Added mobile upload progress with a visible progress bar.
6. Added upload cancellation, retry, online/offline messaging, and persisted upload-session diagnostics.
7. Added video duration and file-size enforcement plus compression guidance.
8. Added media retention policy and expiry metadata.
9. Connected arrival, during, and final media to proof-of-work readiness.
10. Blocked job completion when required proof media is missing, with an audited admin override path.
11. Added one-click conversion of issue updates/media into linked private incident reports.
12. Added customer approval, decline, and discussion controls for live recommendations.
13. Added draft payment-request creation when a priced recommendation is approved.
14. Added customer-safe completed-job summaries with proof, payment state, care advice, and maintenance recommendations.
15. Added final-media reuse into Gallery candidate and vehicle-history queues without re-uploading.
16. Added review-request safety gates for completion, payment, summary, and unresolved incidents.
17. Added `/admin-today.html` as a single prioritized owner action queue.
18. Added Today Needs Attention diagnostics to the main Admin Dashboard.
19. Added Gallery Approvals final-media candidate visibility and new connected-workflow visual placeholders.
20. Updated schema, canonical docs, route copies, service worker cache, responsive CSS, and release checks for Build 210.

### Next 20 value-added steps

1. Connect notification events to production email/SMS delivery providers and delivery receipts.
2. Add per-user/per-device read receipts rather than booking-level timestamps.
3. Add true resumable/chunked uploads for weak LTE connections.
4. Add optional client-side photo compression while retaining original incident evidence.
5. Add server video transcoding, poster frames, captions, and accessibility transcripts.
6. Add storage usage, orphan upload, broken signed-path, and retention cleanup diagnostics.
7. Add vehicle-area walkaround templates and required pre-existing-condition capture.
8. Add customer signature and terms acknowledgment to price-change approvals.
9. Automatically create and send hosted payment links from approved in-job recommendations.
10. Add invoice PDF generation/download to completed-job summaries.
11. Add completed-summary revision history and customer acknowledgment.
12. Pair before/final media directly in Gallery Approvals without copying URLs.
13. Render approved vehicle-history photos/videos directly in My Account.
14. Convert maintenance recommendations into scheduled customer plans/reminders.
15. Add preview/send controls for notification and review queues.
16. Add owner task assignment, snooze, due date, notes, and resolved state in Today Needs Attention.
17. Add live-interaction and moderation audit export.
18. Complete keyboard, screen-reader, caption, and reduced-motion acceptance testing.
19. Run real Cloudflare/Supabase/R2 mobile tests on weak Wi-Fi/LTE and record evidence.
20. Measure quote-to-booking, recommendation approval, payment, review, and repeat-maintenance conversion improvements.


---

### Build 210 documentation sync — 2026-06-17

Active strategy is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This file is retained for historical, audit, specialist, or release-check context. Build 210 connects live job interaction to proof, customer decisions, payment handoff, closeout summaries, approved-media reuse, safe review requests, and the owner attention queue.

## Build 211 — production reliability completed (2026-06-18)

### Completed 20 steps

1. Added a production reliability registry for notifications, hosted payment links, mobile uploads, retention, Cloudflare/Supabase/R2 checks, and owner simplification.
2. Added `/admin-production.html` as a single production-readiness screen.
3. Added `/api/admin/production_reliability_report` for environment/table/workflow diagnostics without exposing secrets.
4. Added notification provider readiness checks for email/SMS webhook configuration and queued/failed events.
5. Added `/api/admin/notification_provider_test` for controlled provider test sends or configuration-only checks.
6. Added hosted final-balance checkout creation through `/api/admin/final_balance_checkout_create`.
7. Added Stripe Checkout Session support for final balance requests when `STRIPE_SECRET_KEY` is configured.
8. Kept manual-payment fallback when hosted payment providers are not configured.
9. Added final-balance payment-link readiness warnings to the production report.
10. Added upload reliability reporting for failed/cancelled/uploading live upload sessions.
11. Added storage retention reporting for due/expired job media that is not permanent proof or legal hold.
12. Added `/api/admin/storage_retention_sweep` with dry-run default and review-before-archive behavior.
13. Added migration support for provider test logs, retention audit rows, final balance checkout metadata, and production reliability audit snapshots.
14. Added Admin Dashboard production reliability diagnostics card.
15. Added Admin Dashboard shortcut card to the production readiness screen.
16. Added production reliability tasks into Today Needs Attention when provider, payment, upload, or retention issues need owner action.
17. Added visual placeholder category for production reliability / end-to-end testing.
18. Updated the two canonical Markdown files with current production-risk status and the next 20 reliability steps.
19. Updated historical root Markdown, schema docs, service worker cache, route-copy sync, and release guards.
20. Added Build 211 release guard covering new screens, APIs, migration, docs, routes, and registry markers.

### Next 20 value-added steps

1. Configure the real email provider webhook and send one test notification from `/admin-production.html`.
2. Configure SMS only if customer consent, quiet hours, and cost controls are ready.
3. Configure Stripe final-balance checkout and test a low-value internal final-balance request in test mode.
4. Add PayPal hosted final-balance checkout parity if PayPal will be used for final balances.
5. Add Stripe webhook reconciliation from final-balance checkout back into `final_balance_payment_requests`.
6. Add notification delivery templates for each live-workflow event type.
7. Add customer/staff notification preference controls and quiet-hour rules.
8. Add true multipart/resumable upload for large videos using R2 multipart or Supabase TUS where practical.
9. Run live mobile upload testing on weak Wi-Fi and cellular and record pass/fail notes in production audits.
10. Add a scheduled storage-retention worker that produces a review queue before deleting any customer/job media.
11. Add a storage orphan detector for objects with no linked `job_media` or `live_upload_sessions` row.
12. Add payment-link expiry and resend controls.
13. Add customer-safe payment status updates to the secure progress page.
14. Add one-click owner actions from Today Needs Attention for retry notification, create checkout, archive media, and generate summary.
15. Add a full end-to-end smoke-test checklist screen for quote → booking → live proof → payment → summary → review.
16. Add route/network diagnostics for Cloudflare Pages Functions, Supabase REST, Supabase Storage, and R2 bindings.
17. Add production audit exports for evidence, approvals, provider test sends, and payment-link creation.
18. Add alert thresholds for failed notifications, upload failures, open payment requests, and overdue retention review.
19. Add accessibility checks for production-critical owner screens.
20. Run a real deployment acceptance test and update the two canonical docs with confirmed production results.

Build 211 documentation sync: active roadmap updated for production reliability rather than additional disconnected screens.

## Build 212 — guided production testing completed (2026-06-20)

### Completed 20 steps

1. Added a protected Guided Production Test Centre with plain-language instructions.
2. Added a strict internal-test-data warning and no-secret/no-private-evidence guidance.
3. Added environment preflight test instructions.
4. Added controlled email provider configuration/send-test instructions.
5. Added Stripe test-mode hosted final-balance checkout instructions.
6. Added customer-now/review-first/staff-only privacy acceptance instructions.
7. Added mobile Wi-Fi/cellular upload and retry/cancel acceptance instructions.
8. Added arrival/during/final proof-gate acceptance instructions.
9. Added issue-to-private-incident and review-blocker acceptance instructions.
10. Added retention dry-run protection instructions.
11. Added full lifecycle smoke-test instructions.
12. Added DB-backed production test result history.
13. Added safe browser-only fallback when the migration is missing.
14. Added protected list/save APIs for test history.
15. Added production-readiness test status counts.
16. Added Today Needs Attention coverage for failed/blocked or absent acceptance tests.
17. Added detailed external guide in `docs/PRODUCTION_TEST_GUIDE.md`.
18. Added mobile-responsive test cards and visual placeholder enrichment.
19. Updated migration, schema documentation, canonical handoff, and Markdown governance.
20. Added a Build 212 release guard and route/service-worker synchronization.

### Next 20 value-added steps

1. Configure and verify the real email notification provider with a controlled mailbox.
2. Configure SMS only after consent, sender identity, quiet hours, and cost controls are approved.
3. Verify Stripe test checkout and webhook settlement with actual Stripe test events.
4. Decide whether PayPal final-balance parity is still required.
5. Implement verified final-balance Stripe webhook reconciliation.
6. Upgrade large videos to true resumable/multipart uploads after field testing proves the need.
7. Consider client-side video compression only after real-device evidence supports it.
8. Add thresholds/alerts for failed notifications, uploads, payment links, and retention reviews.
9. Add scheduled retention review with archive approval before deletion.
10. Add orphaned-storage object diagnostics.
11. Add one-click audited recovery actions from Today Needs Attention.
12. Add non-secret preview-deployment smoke checks.
13. Capture keyboard, focus, caption, and screen-reader acceptance results.
14. Add customer notification preferences and quiet hours.
15. Add payment-link expiry and resend workflows.
16. Add customer-safe payment status updates to the secure progress timeline.
17. Add an optional closeout PDF after privacy/retention testing passes.
18. Run a full internal mobile job simulation on Wi-Fi and cellular.
19. Update canonical docs with only verified production results.
20. Retire/simplify owner screens that do not feed the connected lifecycle or Today queue.

Build 212 documentation sync: detailed testing instructions now live in the app and in `docs/PRODUCTION_TEST_GUIDE.md`; static checks remain necessary but are not a substitute for real provider, payment, storage, and mobile-network testing.

## Build 213 — owner action control and customer-trust records completed (2026-06-22)

### Completed 20-step reliability/conversion pass

1. Added DB-backed owner task state for generated attention rows.
2. Added owner assignment actions from Today Needs Attention.
3. Added one-day and one-week task snooze actions.
4. Added resolution notes and 24-hour generated-row suppression after resolution.
5. Added reopen support for owner tasks.
6. Added manual-task data support for future owner-created work.
7. Added owner-task audit events.
8. Added a booking-scoped live interaction audit export endpoint.
9. Added CSV export from Admin Progress.
10. Added customer typed-name acknowledgement for priced recommendation approval.
11. Added explicit price acknowledgement confirmation before a priced approval is accepted.
12. Added recommendation acknowledgement audit records.
13. Added automatic Stripe Checkout attempt after an approved paid recommendation.
14. Preserved draft payment requests when a hosted checkout cannot be created.
15. Returned only booking-scoped unpaid payment links to the secure progress token.
16. Added customer completed-summary acknowledgement capture.
17. Added completed-summary revision number and revision archive support.
18. Added customer acknowledgement status to the completed-summary card.
19. Added new visual placeholder categories for owner attention and customer acknowledgement.
20. Added migration, data record, production-test guidance, schema/documentation sync, and Build 213 release guard.

### Next 20 value-added steps

1. Add a form for owners to create manual Today Needs Attention tasks from the UI.
2. Add task ownership filters and a “my assigned work” mode.
3. Add due dates and escalation rules for owner tasks.
4. Add notification delivery for assignment, resolution, and overdue task changes.
5. Record verified Stripe webhook settlement against final-balance requests.
6. Add PayPal hosted-link parity only if the business elects to support it.
7. Add payment-link expiry, resend, and cancellation controls.
8. Add customer-safe payment receipt/status timeline updates.
9. Add a full vehicle walkaround template with area, condition, severity, and media anchors.
10. Add vehicle area/condition badges to detailer media capture.
11. Add final-media before/after pairing directly in Gallery Approvals.
12. Add automatic vehicle-history cards for approved final proof.
13. Add review-request scheduling after closeout acknowledgement and settled payment.
14. Add customer communication preferences and quiet hours.
15. Add notification delivery attempt timeline and provider-message IDs.
16. Upgrade large-video uploads to resumable/multipart transfer after field evidence supports it.
17. Add retention archive approval and orphaned-object reconciliation.
18. Add one-click deep links from Today Needs Attention into the exact affected record.
19. Add end-to-end role/permission tests for detailer, senior detailer, admin, and customer token views.
20. Run the full acceptance guide on Wi-Fi and cellular, then update the handoff only with observed results.

Build 213 documentation sync: owner task controls, acknowledgement records, payment-link handoff, summary revision history, and safe audit export now sit in the connected workflow. Static code checks are not proof of real provider/webhook/storage behavior.

---

### Build 214 documentation sync — 2026-06-23

Build 214 prioritizes Supabase containment and owner-task reliability. The active security action is to run `sql/2026-06-23_build214_security_task_orchestration.sql`, refresh Supabase Security Advisor, and test the application through Cloudflare Functions rather than restoring direct browser access to tables. Canonical planning remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.


## Build 214 — security containment and owner-task orchestration completed (2026-06-23)

### Completed 20 steps

1. Added public-schema RLS containment migration.
2. Removed direct `anon`, `authenticated`, and `PUBLIC` table privileges.
3. Preserved server-side `service_role` table/sequence access.
4. Added safe future-table default privileges.
5. Added protected Supabase security posture RPC.
6. Added protected Cloudflare security posture API.
7. Added `/admin-security.html` with table-name-only risk indicators.
8. Added Admin Dashboard Security Posture entry point.
9. Added security placeholder guidance that excludes secrets and customer data.
10. Added manual owner task creation.
11. Added My assigned work filter.
12. Added unassigned-work filter.
13. Added overdue/today/no-due-date filters.
14. Added due-date metadata to owner tasks.
15. Added escalation metadata to owner tasks.
16. Added Set Due Date owner action.
17. Raised overdue manual tasks to urgent in Today Needs Attention.
18. Added task-audit notification queue records without claiming provider delivery.
19. Updated schema, canonical docs, route copies, service worker, and visual registry.
20. Added Build 214 release guard and detailed security acceptance steps.

### Next 20 value-added steps

1. Run Build 214 migration and verify Security Advisor findings clear.
2. Review any named sensitive table and invalidate exposed sessions/tokens as appropriate.
3. Verify Stripe final-balance webhook settlement in test mode.
4. Add payment-link expiry, resend, and cancellation controls.
5. Add customer-safe payment receipt/status timeline updates.
6. Add manual-task editing and specific-staff assignment.
7. Add due-date reminder delivery once the provider is verified.
8. Add approved final-media before/after pairing in Gallery Approvals.
9. Add automatic vehicle-history cards for approved final proof.
10. Add vehicle walkaround templates with media anchors.
11. Add customer communication preferences and quiet hours.
12. Add provider message IDs and delivery-attempt timeline.
13. Add retention archive approval plus orphan-object reconciliation.
14. Add payable/refund webhook settlement regression tests.
15. Add role/permission regression tests for detailer, senior detailer, admin, and customer token views.
16. Run real Wi-Fi/cellular upload tests and record actual evidence.
17. Add payment request deep links from Today Needs Attention.
18. Add application health checks for Cloudflare Function publish/binding readiness.
19. Simplify or retire any owner screen that does not feed Today Needs Attention.
20. Replace visual placeholders with approved local proof photos/video stills.

## Build 215 — verified media rendering and DAIP integration planning (2026-06-30)

### Completed 20 steps

1. Traced public service-hub/local-hero fallback behavior to extension-specific legacy media references.
2. Added a shared client media-source resolver for known Rosie asset URLs.
3. Preserved the original requested URL as the first image attempt.
4. Added compatible same-key JPG lookup.
5. Added compatible same-key JPEG lookup.
6. Added compatible same-key WebP lookup.
7. Added compatible same-key PNG lookup.
8. Added uppercase extension candidates for case-sensitive R2 extension uploads.
9. Updated landing-page hero rendering to prefer `local_hero_image_url`.
10. Updated landing-page gallery/related-media rendering to use the resolver before fallback.
11. Updated service hub package/add-on images to use the resolver before fallback.
12. Updated booking add-on thumbnails to use the resolver before fallback.
13. Prevented the visual-placeholder listener from interrupting a still-running format-resolution chain.
14. Updated Admin Media Health scan to test compatible image extensions.
15. Updated Admin Media Health cards to display the resolved URL and compatible-format result.
16. Changed canonical Local Hero static data to JPG keys and URLs.
17. Updated regional media requirement files to accept JPG/JPEG/WebP/PNG while documenting JPG as canonical.
18. Added a safe legacy media-task JPG alignment migration.
19. Reviewed all DAIP documentation and added a Rosie-specific integration-plan document.
20. Added Build 215 schema, handoff, known-gap, image-guide, documentation-index, release-check, and cache-version synchronization.

### DAIP status and value sequencing

DAIP is valuable because one approved completed job could create reusable proof for the customer summary, vehicle history, before/after gallery, service/town pages, Google Business Profile, marketing drafts, and future social packages. It is also a high-cost/privacy-sensitive subsystem.

**Build 215 status: planning only.** Do not begin a worker, AI model, processing queue, `daip_*` table, Drive sync, public export, or auto-publication until the DAIP-0 decisions in `docs/digital-asset-intelligence-platform/10_Rosie_Dazzlers_Integration_Plan.md` are accepted.

### Next 20 value-added steps

1. Deploy Build 215 and confirm Cloudflare Functions publish successfully.
2. Run `sql/2026-06-30_build215_media_asset_format_alignment.sql` in Supabase after Build 214 security/RLS containment is confirmed.
3. Open `/admin-media-health.html` while signed in and run the image-health scan.
4. Confirm the eight Local Hero rows show a public JPG resolved URL and acceptable dimensions.
5. Open each Local Hero page in a private/incognito browser and confirm no blank/default image appears.
6. Open `/services` and confirm Service Hub images render before any placeholder fallback.
7. Record any still-failing exact R2 key, resolved URL, HTTP status, and image dimensions; do not guess by replacing filenames.
8. Ensure Cloudflare R2 custom-domain public access allows only intended approved public asset prefixes.
9. Keep originals, private incidents, and staff-only job media out of the public `assets.rosiedazzlers.ca` namespace.
10. Decide DAIP worker hosting and monthly cost ceiling.
11. Decide DAIP original/proxy/public-derivative storage boundaries.
12. Decide whether Google Drive is backup-only, operator-viewable, or deferred.
13. Define DAIP consent wording and public-marketing approval rule.
14. Define DAIP privacy-review roles and legal-hold behavior.
15. Choose one controlled internal test detail for future DAIP acceptance testing.
16. Draft, review, and approve a separate Phase 1 DAIP schema migration before executing it.
17. Build only selected manual media-job intake after the migration is reviewed.
18. Add real alerting for persistent missing public image URLs after verified R2 uploads.
19. Replace any remaining generic visual placeholders with approved Rosie-owned media through Gallery/Media Health review.
20. Re-run the Guided Production Test Centre after each deployed reliability/security/media change.

## Build 216 — public media reliability and DAIP governance (2026-07-01)

### Completed 20 steps

1. Reviewed the Build 215 Local Hero JPG compatibility work and retained JPG as the valid canonical format.
2. Kept the original public image URL as the first candidate before any extension fallback.
3. Added bounded candidate timeouts to the browser image resolver so a stalled public asset does not remain blank indefinitely.
4. Preserved JPG, JPEG, WebP, PNG, and upper-case extension compatibility for the same approved R2 object key.
5. Added explicit resolved/exhausted resolver events for safe UI fallback handling.
6. Reworked the server-side Media Health scan to use bounded fetches instead of unbounded public-image loads.
7. Added concurrent scan processing so a large asset list is less likely to time out a Pages Function.
8. Added HTTP/failure classification for not found, not public, timeout, origin error, unreachable, wrong content type, and undersized assets.
9. Kept exact expected R2 key, resolved URL, dimensions, and compatible-format information available to staff.
10. Added optional persistent public-asset health observations after the Build 216 SQL migration is applied.
11. Added recurring alert state that starts as monitoring on the first failed scan.
12. Added activation after a second consecutive failed scan so a one-time transient response does not create a persistent owner alarm.
13. Added automatic alert resolution after one verified passing scan.
14. Added a staff-only persistent alert list with acknowledge/reopen controls and safe CSV export.
15. Connected active/acknowledged public-media alerts to Today Needs Attention so they do not remain isolated in Media Health.
16. Ensured public-media alert records never store customer media, signed URLs, private evidence, or customer-identifying content.
17. Added RLS, revoked direct browser grants, and server-only alert recording through a protected Supabase function.
18. Added a public-media recovery visual placeholder category without using customer media as fallback artwork.
19. Added a DAIP-0 owner decision register with no assumed decisions and no production implementation.
20. Added a DAIP Phase 1 security/acceptance template and synchronized canonical docs, schema notes, visual registry, media guide, tests, documentation index, and release checks.

### Next 20 value-added steps

1. Deploy Build 216 and confirm both Cloudflare assets and Functions publish successfully.
2. Confirm the Build 214 RLS/security migration is applied and Supabase Security Advisor is clear before applying new tables.
3. Run `sql/2026-07-01_build216_media_reliability_daip_governance.sql` in Supabase.
4. Run Admin Media Health twice using a harmless intentionally missing internal test asset key and confirm the first scan is monitoring while the second becomes active.
5. Restore the harmless test asset or use a known public image and confirm a passing scan resolves the alert automatically.
6. Test the eight Local Hero pages and `/services` in an incognito browser after a cache refresh; record the exact expected key and resolved URL for any failure.
7. Verify active public-media alerts appear correctly in Today Needs Attention without exposing a public URL to unauthenticated users.
8. Add narrowly scoped notification delivery for persistent public-media alerts after provider test delivery passes.
9. Replace remaining generic public visual placeholders with approved Rosie-owned local proof photos through Gallery/Media Health review.
10. Complete every DAIP-0 decision in `11_DAIP_Decision_Register.md`; do not infer decisions from this roadmap.
11. Choose one harmless internal job/media set for future DAIP acceptance tests.
12. Review the DAIP Phase 1 security acceptance template with the chosen storage/worker model before writing a migration.
13. Configure and test notification-provider webhooks with a controlled mailbox.
14. Verify Stripe test-mode checkout, webhook settlement, receipt status, cancellation, and resend paths.
15. Complete guided mobile upload testing on real Wi-Fi and cellular networks, including retry and failed video behavior.
16. Confirm R2 private/public prefix separation and retention dry-run behavior with no customer media exposed.
17. Pair approved final media into before/after Gallery candidates with consent and provenance review.
18. Create automatic vehicle-history cards from approved final proof only after privacy/consent review.
19. Schedule review requests only after settled payment, customer summary acknowledgement, and no unresolved incident.
20. Conduct a quarterly competitor/local SEO review based on real quotes, reviews, service areas, customer proof, and Search Console/Business Profile evidence.

### Build 216 planning boundary

DAIP remains planning only. Build 216 adds no DAIP worker, queue, AI model, `daip_*` table, bucket, Drive synchronization, public export, or automatic publishing. The decision register is a required gate, not an invitation to start implementation.

### Build 216 synchronization — 2026-07-01

Build 216 synchronized this retained document with the active `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`: public media recovery now uses bounded JPG/JPEG/WebP/PNG health checks and protected recurring alerts after its migration; DAIP remains planning-only behind the documented decision/security gates.

## Build 217 — secure final-balance collection path (2026-06-30)

### Completed value steps

1. Replaced predictable/public final-balance URLs with random opaque token links stored only as SHA-256 hashes.
2. Added a secure, noindex, no-cache customer payment-status page with one H1 and no customer PII.
3. Added default expiry, controlled maximum expiry, link rotation, cancellation, and reopen controls.
4. Added an Admin Payments final-balance queue with customer-safe operational actions.
5. Added hosted Stripe Checkout handoff that returns the customer to the token-gated payment page.
6. Added Stripe webhook settlement and idempotent duplicate-event handling for final balances.
7. Added progress-page payment states for open, paid, expired, and cancelled requests.
8. Prevented final-balance token hashes and staff-entered notes from being sent to browser clients.
9. Added a generic secure-payment visual placeholder rule that prohibits real invoices, payment links, QR codes, card data, or customer details.
10. Added a Build 217 SQL migration, app-readable implementation record, route-copy sync, service-worker cache entries, and release guard.

### Next 20 value steps

1. Apply the Build 217 SQL migration and verify RLS/direct-browser containment remains intact.
2. Use Stripe test mode to create, pay, return, and replay a final-balance checkout event.
3. Confirm invalid, expired, rotated, and cancelled secure links reveal no customer information.
4. Test the configured notification provider with a controlled inbox; record queued versus actually delivered outcomes.
5. Add staff-visible final-balance status to the existing payment/reconciliation work queue only after a real test transaction passes.
6. Verify tax/HST records and processor-fee handling with the accountant workflow before using live collection.
7. Pair approved final media into Gallery candidates only with recorded media consent and provenance.
8. Create a vehicle-history card only from approved final proof and never from private incident media.
9. Schedule review requests only when final payment is settled, customer acknowledgement is present, and no unresolved incident remains.
10. Complete real mobile Wi-Fi and cellular upload retry tests with harmless media.
11. Verify public/private R2 prefixes and retention dry-run results.
12. Replace only appropriate public placeholder slots with approved Rosie-owned local proof.
13. Continue local page improvements using distinct people-first copy, verified service-area proof, and descriptive approved images.
14. Review quote-to-booking conversion data before adding more marketing integrations.
15. Validate payment/refund/receipt workflows with the accountant export in test records.
16. Run the Guided Production Test Centre after deployment.
17. Complete DAIP-0 decisions; keep DAIP planning-only until the security template is approved.
18. Build a small consent-aware gallery pairing shortcut only after production media reliability passes.
19. Review real Search Console and Google Business Profile evidence before altering SEO titles or town-page scope.
20. Repeat the competitor/local SEO review quarterly using actual client feedback, visibility, and booked-job outcomes.

### Build 217 boundary

This build does **not** process card details, prove a live Stripe/Cloudflare/Supabase deployment, or assert notification delivery. Those require the controlled release tests above.

### Current SEO and competitive recheck — 2026-06-30

Google’s current guidance supports the existing safeguards: one clear page purpose, people-first content, search-language in the title/main heading, crawlable internal links, and descriptive approved image names/alt text. Structured data must describe visible, current page content and can improve eligibility, not guarantee appearance.

Current service-software competitors reinforce the same customer experience target: Jobber’s client portal emphasizes self-serve work requests, approvals, appointment details, payments, and receipts; Urable’s detailing CRM emphasizes connected quoting, scheduling, job tracking, customer communication, payments, and vehicle history. Rosie Dazzlers should differentiate by keeping this journey simple for a one-car-per-day mobile detailer, with consent-aware proof and local Oxford/Norfolk trust—not by copying every enterprise feature.

