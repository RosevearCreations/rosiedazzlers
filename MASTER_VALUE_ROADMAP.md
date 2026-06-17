# Rosie Dazzlers Master Value Roadmap — Build 207

**Updated:** 2026-06-14  
**Purpose:** This is the main roadmap file going forward. It replaces scattered planning across many historical Markdown files while keeping those files available for release history.

## North star

Build a mobile detailing website/app that helps a small local business get found, quote faster, book easier, document work professionally, collect payment, earn reviews, and bring customers back for maintenance.

## Business-value priorities

### 1. Revenue visibility

- Connect Quote Pipeline to real quote proposals, deposits, accepted/declined status, source, follow-up age, and projected revenue.
- Add close-rate trends by source, service, month, and town.
- Track Meta ads from spend → leads → quotes → booked jobs → revenue.

### 2. Trust and proof

- Keep Gallery Approvals focused: approve/hide/repair photos, confirm consent, and publish customer-safe before/after images.
- Add before/after sliders to Gallery, service pages, and town pages.
- Add proof-of-work checklists with start/finish photos, condition notes, and customer sign-off.
- Convert approved reviews and photos into local proof blocks.

### 3. Repeat revenue

- Build maintenance memberships/reminders from completed vehicle history.
- Add customer vehicle timelines with past service, invoices, photos, notes, and next suggested service.
- Add seasonal campaigns for salt removal, spring reset, pet hair, ceramic/wax protection, gift cards, and fleet cleanup.

### 4. Mobile-detailer operations

- Turn the detailer job page into a mobile-first job workspace: route, checklist, incident quick-create, photos, notes, timer, customer sign-off, and final proof summary.
- Add route clustering by town/area/day to reduce travel gaps.
- Add fleet mini-CRM for company contacts, vehicles, intervals, quote terms, and recurring service history.

### 5. Owner simplification

- Create a “Today needs attention” dashboard that combines gallery approvals, quote follow-ups, payment warnings, incident decisions, review requests, media health, and SEO proof gaps.
- Reduce raw JSON editing to emergency-only paths.
- Keep dashboards independent so one broken API card does not blank the whole admin.

## SEO and local visibility roadmap

- Maintain one clear H1 per public page.
- Use concise, helpful title/meta copy for town + service combinations.
- Keep service pages for ceramic coating, pet hair removal, odor removal, headlight restoration, paint correction, waxing/sealant, interior detailing, exterior detailing, fleet, and maintenance plans.
- Add local proof cards to Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Norwich/Otterville, and Waterford/Vittoria pages.
- Add descriptive alt text to every real image.
- Use visual placeholders only until real customer-approved photos are available.
- Keep Google Business Profile complete with hours, services, photos, posts, and review responses.

## Competitive features to keep tracking

- App-style online booking and account management.
- Quote/CRM pipeline with dollar value and close rate.
- Mobile app job workspace for staff.
- Route optimization / clustering.
- Fleet and recurring contract support.
- Membership credits or recurring maintenance reminders.
- Before/after documentation and proof-of-work signatures.
- Review request automation.
- Payment, invoice, receipt, and accounting export workflows.
- Fast follow-up through templates and reminders.

## Build 207 sanity-check outcome

- Documentation now has two primary living docs: this file and `AI_PROJECT_HANDOFF.md`.
- Historical Markdown files are retained but should stop collecting new strategy except short build summaries.
- Visual placeholder registry and automatic placeholder rendering are in place to keep missing-image areas professional.
- Admin Docs/Sanity page exposes the documentation and visual-placeholder status inside the app.


## Research sources checked in Build 207

- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google title-link guidance: https://developers.google.com/search/docs/appearance/title-link
- Google Business Profile local ranking guidance: https://support.google.com/business/answer/7091
- Jobber auto detailing software feature set: https://www.getjobber.com/industries/auto-detailing-software/
- QuoteIQ mobile detailing CRM feature set: https://myquoteiq.com/crm-for-mobile-detailing/
- OctopusPro car wash / auto detailing software feature set: https://octopuspro.com/field-service-management/car-wash-auto-detailing-software/
- ALPHASHINE app/membership direction: https://www.alphashine.io/app
- Detailing Knights mobile/fleet positioning: https://www.detailingknights.ca/

## Next 20 steps after Build 207

1. Connect Quote Pipeline to real quote proposal/draft/deposit tables.
2. Add quote create/edit/save workflow from leads and admin quotes.
3. Add quote follow-up reminders and overdue badges.
4. Add Meta campaign CRUD rows with spend/leads/revenue by source/UTM.
5. Add proof-of-work checklist editor and job-type checklist templates.
6. Add mobile proof-of-work checklist to `/detailer-jobs.html`.
7. Add customer signature/approval capture for completed work.
8. Add vehicle history timeline to customer account and admin customer profile.
9. Add membership reminder creation from completed bookings.
10. Add recurring service reminders by plan, vehicle, and season.
11. Add fleet account create/edit with company contacts and vehicle list.
12. Add route clustering preview from real booked jobs by town/date.
13. Add review request queue after completed bookings.
14. Add approved testimonial/public proof workflow from review replies.
15. Add seasonal campaign builder with placeholder/approved-image picker.
16. Add before/after slider component to Gallery and landing pages.
17. Add owner “Today needs attention” dashboard.
18. Add visual placeholder replacement tasks into Media Health.
19. Add Markdown archive process once old release guards are consolidated.
20. Continue CSS overlap/mobile testing after every visual pass.

## Build 208 — connected workflow command center

Build 208 moves the app from scattered feature foundations toward the main lifecycle: **lead / quote → booking → proof of work → invoice/payment → review → repeat maintenance**.

Completed in this pass:
- Added `/admin-workflow.html` and `/admin-workflow/` as the owner-facing workflow command center.
- Added `/api/admin/workflow_command_center_report` with DB-first reads from Build 206 tables and safe JSON fallback data.
- Added `data/workflow_connection_build208.json` as the structured workflow map, next 20 steps, visual enrichment slots, and competitor-aligned feature checklist.
- Added Admin Dashboard workflow diagnostics so owners can see open quote value, likely revenue, follow-ups, review queue, maintenance reminders, and fallback status.
- Expanded visual placeholders for quote, booking, proof-of-work, invoice/payment, review/public proof, and repeat-maintenance cards.
- Kept old Markdown as retained history while continuing to make `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md` the main living docs.

Next build should connect `/admin-quotes.html` to real quote create/edit/save actions and add a one-click accepted-quote-to-booking conversion.
