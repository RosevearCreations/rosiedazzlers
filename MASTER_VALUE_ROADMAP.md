# Rosie Dazzlers Master Value Roadmap — Build 210

**Updated:** 2026-06-17  
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
