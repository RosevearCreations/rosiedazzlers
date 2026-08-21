> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

> **Build 248 documentation status:** Historical/compatibility reference. Current state is `AI_PROJECT_HANDOFF.md`; current direction is `MASTER_VALUE_ROADMAP.md`. Retained to preserve audit/release history and old references.

# Known Gaps and Risks — Build 245 Update

## Closed or reduced

- Critical-route CSS/script/image/H1/metadata drift now has a browser-based acceptance scanner.
- Stale Startup assets now have visible build diagnostics and a safe app-cache recovery control.
- Service-worker installation no longer fails completely because one optional cached URL is missing.
- Non-navigation offline failures no longer receive homepage HTML in place of JavaScript or images.
- Twelve add-on pages no longer depend entirely on JavaScript for a main heading and useful metadata.

## Still open

- Connected booking, payment, refund, webhook, external email, backup/restore and production-variable acceptance.
- Real-device mobile and accessibility testing.
- Final Rosie-owned local proof and sellable-product media completion.
- Inventory cleanup, product readiness, payment application, HST review, month-end close and accountant export.
- Controlled soft launch and first-week monitoring.

---

# Known Issues and Gaps — Build 241

**Updated:** 2026-08-05

## Resolved in source

- The Startup Command Center no longer shadows the `evidenceRows()` function with a same-named local constant.
- Refresh failures are isolated and reported rather than escaping as an uncaught promise rejection.
- Cache tokens force retrieval of the corrected script after deployment.

## Acceptance risk still open

- The fix must be deployed and verified in an incognito browser because an already-open tab or old service worker may retain the faulty Build 239 asset until refresh/reload.
- All Build 240 migration and production-acceptance gaps remain open until proven through the Startup Guide.

---

# Known Issues and Gaps — Build 240

**Updated:** 2026-08-05

## Critical acceptance gaps

- Build 240 migration is source-complete but not proven against the connected staging/production Supabase project.
- One booking posting, one project reservation posting, an over-stock rejection, idempotent replay and compensating reversal must be observed end to end.
- Booking inventory reversal restores stock but intentionally leaves accounting evidence for reviewed journal reversal/adjustment.
- Builds 235, 237, 238 and 239 migrations must be verified before Build 240.
- Existing launch blockers remain: calendar, booking/payment/email, recovery, legal, mobile/accessibility, Search Console/GBP, product readiness and soft launch evidence.

## Remaining engineering gaps

- Resumable weak-network media upload and responsive derivative worker.
- Enforced product publish readiness gates.
- Payment application, HST review, month-end close/lock/reopen and accountant export.
- Approved local image/review proof cadence and replacement of high-value public placeholders.

---

# Known Issues and Gaps — Build 238

## Critical production evidence still missing

- Build 237 and Build 238 migrations must be confirmed in staging/production in order.
- Block Calendar full-day/AM/PM behaviour must be proven against the public booking wizard.
- A complete booking, live Stripe charge/refund/webhook, external email delivery and backup/restore rehearsal remain launch blockers.
- Policies, media consent, real-device mobile, accessibility, Search Console, structured data and Google Business Profile evidence remain incomplete until manually verified.
- The invite-only soft launch has not yet supplied first-week operational evidence.

## Build 238 source complete but awaiting acceptance

- Transactional bulk inventory updates are implemented; do not call them accepted until valid and invalid-batch rollback tests pass.
- Reviewed duplicate merge and its audit-history viewer are implemented; do not use on valuable production rows before a controlled test verifies every reference type and the displayed evidence.
- The merge is intentionally irreversible in the UI. Recovery is a reviewed compensating operation using audit evidence, not an automatic rollback button.
- Cached inventory fallback is read-only by design; stale cached rows must never be edited or treated as authoritative.

## Remaining product/operations gaps

- Inventory cleanup still contains suspicious imported names, incomplete categories/costs and potential duplicates.
- Sellable products still need approved featured/gallery images, alt text, captions, roles and provenance/consent.
- High-value public placeholders still need authentic Rosie-owned local proof.
- Transactional posting for real job consumption, payment application, HST/GST review, month-end close/lock/reopen and accountant export remain open.
- Product publish readiness does not yet enforce every missing image role, consent/provenance, price, pickup/shipping and SEO condition.
- Production monitoring, incident ownership and soft-launch stop conditions still require live evidence.

## Documentation risk

Historical Markdown is intentionally retained because old release guards still depend on content markers. The authoritative order is `AI_PROJECT_HANDOFF.md`, `MASTER_VALUE_ROADMAP.md`, then `STARTUP_GO_LIVE_BLOCKERS.md`. Do not delete historical files until guards are converted to current capability checks and an archive manifest passes the complete release suite.

---

# Build 237 current gaps and risks

## Critical before unrestricted public launch

- Deploy and verify the Roadmap Execution CSS/dependency repair.
- Apply the Build 237 shared evidence/current-roadmap migration.
- Re-test Block Calendar full-date/AM/PM behaviour against public booking.
- Complete end-to-end booking, live Stripe/refund, external email, environment, backup/restore, legal/policy, pricing/tax and security tests.
- Use an invite-only soft launch before unrestricted promotion.

## High priority while preparing

- Real-device mobile and accessibility testing.
- Search Console/sitemap/canonical/schema and Google Business Profile alignment.
- Inventory name/cost/category cleanup and product gallery metadata.
- Replace high-value placeholders with approved Rosie-owned local proof.

## Engineering gaps retained

- Duplicate inventory merge remains review-only/not implemented.
- Bulk inventory updates remain sequential rather than transactional.
- Responsive media derivative generation remains outstanding.
- Historical Markdown cannot be archived until release guards are modernized.

Use `STARTUP_GO_LIVE_BLOCKERS.md` for exact routes, detailed instructions and completion evidence.

---

# Build 236 known gaps and launch risks

Block Calendar layout and current-schema reads are repaired in code, but deployment must still be proven by saving/removing a full-date and AM/PM block and checking the public booking wizard. Launch blockers remain real booking/payment/email tests, environment and backup verification, policy review, security/accessibility/mobile testing, inventory cleanup, and approved local imagery. See `docs/BUILD236_CALENDAR_SEO_CSS_STABILIZATION.md`.

---

# Rosie Dazzlers known gaps and risks — Build 217

**Updated:** 2026-06-30
**Build:** 217

Build 215 retains the two canonical strategy documents, repairs public media format compatibility, and adds DAIP integration planning. It does not complete every historical enhancement and it does not make DAIP production-ready.

## Reduced in Build 207

- Future AI/chat handoff is clearer through `AI_PROJECT_HANDOFF.md`.
- Future roadmap planning is clearer through `MASTER_VALUE_ROADMAP.md`.
- Historical Markdown files are explicitly retained but no longer the main place for new strategy.
- Admin can review documentation sanity from `/admin-docs.html`.
- Public/admin cards with missing or broken images now have professional SVG placeholders instead of blank visual gaps.
- Visual placeholder slots are documented by purpose, replacement target, and privacy rule.
- Dashboard now surfaces Markdown and visual-placeholder readiness.

## Still outstanding after Build 207

1. Historical Markdown files are still physically present because older release guards reference them.
2. Quote Pipeline, Meta ROI, memberships, proof-of-work, fleet, reviews, campaigns, and routing still need deeper real CRUD screens after the Build 206 foundations.
3. Visual placeholders should be replaced by approved Rosie-owned/R2 media as soon as possible.
4. Placeholder automation cannot judge image quality; Media Health and human review are still needed.
5. Mobile admin tables still need more card-view conversions.
6. Live browser testing is still required after deployment.
7. The owner “Today needs attention” dashboard is still the next major simplification goal.

---

# Build 205 known gaps and risks — Sanity check and value-added roadmap

Build 205 confirms that the biggest project risk has shifted from missing foundations to business-owner complexity. The app has many strong modules, but the next work should reduce friction by grouping approvals, quote revenue, lead follow-up, gallery consent, review requests, and local proof into simpler screens.

## Reduced in Build 205

- A dedicated sanity-check document now summarizes the current application state.
- Admin Dashboard now has a Build 205 sanity/value-roadmap diagnostic card.
- A staff-protected API now exposes value-added priorities for the admin UI.
- Competitor-inspired feature ideas are captured in a structured backlog file.
- SEO, mobile/desktop, visual polish, CRM, membership, gallery approval, proof-of-work, and fleet opportunities are documented together.

## Still outstanding after Build 205

- Gallery approval still needs its own dedicated screen; it is still mostly handled through Admin App and diagnostics.
- Quote revenue pipeline needs a clearer dashboard with open dollars, close rate, and follow-up age.
- Meta ads tracking needs actual spend/lead/revenue tables rather than only marketing notes.
- Memberships/maintenance plans need real recurring billing/reminder workflow.
- Customer vehicle history needs a polished mobile customer timeline.
- Proof-of-work checklists and sign-off are still not complete.
- Fleet CRM features are present as public/lead ideas but not yet a full account-management workflow.
- Visual enrichment should continue with before/after sliders, trust badges, seasonal graphics, and mobile action bars.

## Highest-value next risk reduction

Build the Gallery Approvals screen and Quote Pipeline dashboard next. These two additions reduce admin confusion and increase revenue visibility immediately.

# Build 204 known gaps and risks — Gallery image resilience

**Updated:** 2026-06-12  
**Build:** 204

Build 204 fixes the visible Gallery/media regression by making public before/after media more tolerant of older saved field names, missing DB rows, local sample assets, and broken image loads. Broken media no longer leaves a blank gallery; the page tries packaged fallbacks and then shows a clear repair message.

## Reduced in Build 204

- Public before/after gallery no longer depends only on one exact `before_url` / `after_url` field shape.
- Saved gallery content with no usable media URLs falls back to bundled static samples instead of returning an empty broken gallery.
- Known Rosie brand assets now resolve through packaged `/assets/brand/...` paths.
- Homepage recent-work cards now use the same image fallback behavior as the Gallery page.
- Admin Dashboard now has a Gallery image health card to reveal fallback use and obvious media-source issues.

## Still outstanding after Build 204

1. The gallery still needs a true media-library picker instead of copy/paste URLs.
2. The new health report checks URL/source shape but does not yet perform full R2 image HEAD/existence checks.
3. Gallery rows still need stronger job/booking/customer-consent linking.
4. Per-row restore-from-history is still not available for gallery items.
5. Image crop/blur prep is still manual before customer-safe publishing.
6. Gallery proof rotation on town/service landing pages is still outstanding.
7. Browser smoke testing on the live Cloudflare dev URL is still required after deployment.
8. External media sources should be migrated to owned Rosie/R2 assets where possible.
9. Media Health should eventually include the same gallery fallback warnings.
10. Advanced JSON repair remains available for emergency gallery recovery and should continue to shrink over time.

---

# Build 203 known gaps and risks — Desktop/mobile and visual polish

Build 203 improves the shared responsive CSS, homepage visual presentation, and admin diagnostics for desktop/mobile readiness. It does not replace hands-on browser testing; it makes the most likely issues easier to find before deployment.

## Reduced in Build 203

- Desktop and mobile layout expectations are now documented in `data/responsive_visual_registry.json`.
- The homepage now shows a professional desktop/mobile section without adding extra H1 tags.
- Shared CSS now includes visual frame, hover, reduced-motion, and mobile touch-target improvements.
- Admin Dashboard now reports sampled viewport/H1/image/shared-CSS health.
- The service worker cache name was bumped so visitors receive the newer CSS/chrome files.

## Still outstanding after Build 203

1. The responsive visual registry is still bundled JSON; it should become a friendly Admin Site Settings editor later.
2. The dashboard report samples key pages but does not run real screenshots or visual diffing.
3. Mobile admin tables still need more card-view conversions on the widest accounting/catalog screens.
4. Some public pages still depend on fallback or sample imagery until enough approved local proof photos are uploaded.
5. Professional visual effects should be checked on older phones to ensure they remain smooth.
6. Incident evidence still needs customer-safe crop/blur tools before publishing sensitive vehicle photos.
7. Landing-page visual slots should eventually be scored per town/service.
8. The visual polish should be reviewed after each CSS-heavy pass because site styles have drifted before.

---

# Build 202 known gaps and risks — Incident reporting and marketing tracker

**Updated:** 2026-06-12  
**Build:** 202

Build 202 adds the first DB-backed incident-report workflow and a practical marketing tracker based on the attached detailer notes. The incident workflow separates private staff/admin discussion from customer-visible wording and evidence, but several follow-up controls should still be added before this becomes a complete claims/dispute-management system.

## Reduced in Build 202

- Damage/faulty-equipment reports no longer need to live in generic notes.
- New incident reports require a booking ID and at least one evidence photo.
- Private report/admin discussion is stored separately from customer-facing summary/discussion.
- Customer visibility is off by default and requires admin-published approved wording plus selected public evidence.
- Customer progress pages can now show approved incident reports without exposing private staff discussion.
- The attached detailer marketing ideas were converted into a practical marketing tracker instead of remaining only as notes.

## Still outstanding after Build 202

1. Incident-report email/customer notification templates are not yet wired.
2. Incident-report PDF/export packaging is still outstanding.
3. Incident reports do not yet create automatic follow-up tasks.
4. Incident evidence upload works through R2, but the screen is not yet connected to the full media-library picker.
5. Faulty-equipment incidents are not yet connected to equipment maintenance/vendor warranty records.
6. Customer acknowledgement/signoff for published incident outcomes is still needed.
7. Detailer job pages still need a mobile quick-create incident button.
8. Public customer rendering depends on the Build 202 SQL migration being applied.
9. The marketing tracker is a calculator; it does not yet persist campaign/quote metrics to DB.
10. Real CRM quote analytics, lead-source attribution, and Meta campaign reporting are still outstanding.

---

# Build 201 known gaps and risks — Friendly validation and media picker pass

**Updated:** 2026-06-09  
**Build:** 201

Build 201 reduces owner-facing editing risk by adding inline validation, media URL picker helpers, consent/source badges, landing schema previews, save-review summaries, and an automatic route-copy synchronization script. Raw JSON remains available only for emergency repair, but routine Admin App editing now gives clearer feedback before staff save public-facing content.

## Reduced in Build 201

- Friendly Admin App fields now show inline warnings instead of relying only on whole-page validation.
- Landing-page SEO fields show live title/meta/slug/H1 style guidance near the field being edited.
- Image URL fields can reuse saved media URLs from packages, add-ons, landing pages, and gallery rows.
- Media fields now show simple owned/R2, external-source, or consent-review badges.
- Landing-page editors include a schema preview so local/service structured-data issues are easier to spot.
- Route-copy drift can be checked or repaired with `scripts/sync_route_copies.py`.

## Still outstanding after Build 201

1. Admin Site Settings friendly rows still need the same inline helper coverage added to Admin App.
2. The media picker currently cycles known editor URLs; it is not yet connected to a full DB/R2 media library picker.
3. Save-review summaries are not full visual diff modals yet.
4. Per-row restore-from-history is still outstanding.
5. Prompt-based new-location creation should be replaced with an owner-safe inline card/modal.
6. Staff-role enforcement still needs to be wired directly to save/publish buttons.
7. Public crawl validation after deploy is still outstanding.
8. Browser smoke tests for the friendly editor workflows are still needed.
9. Media consent badges are advisory; final publish blocking should be enforced server-side too.
10. Remaining advanced JSON panels still exist for emergency repair and should stay collapsed.

---

# Build 200 known gaps and risks — Pricing JSON retirement pass

**Updated:** 2026-06-09  
**Build:** 200

Build 200 reduces the remaining Admin App pricing JSON risk. Routine chart work and richer package details now use friendly editor state and selected-package fields. The raw pricing catalog JSON remains available, but it is explicitly an emergency repair/developer recovery panel.

## Reduced in Build 200

- Pricing chart previews/downloads no longer require staff to refresh or edit raw JSON.
- Package included services, chart details, notes, best-for copy, image URL, duration label, and SEO focus phrase can be edited through normal fields.
- Admin Dashboard now lists remaining Advanced JSON panels so future builds can retire them intentionally.
- `/admin-app.html` and `/admin-app/` were synchronized after the pricing editor work.
- `/admin.html` and `/admin/` were synchronized after the dashboard diagnostics card was added.

## Still outstanding after Build 200

1. The raw pricing catalog JSON panel still exists for emergency repair and should stay collapsed unless a developer-level recovery is needed.
2. Recovery provider/conditional rules still need a visual rule builder beyond the common delivery-rule fields.
3. Friendly pricing and Site Settings rows still need inline validation beside each field.
4. Media-library picker buttons are still needed beside image URL fields.
5. Consent/privacy badges are not yet shown beside every package/add-on/landing/gallery media field.
6. Per-row restore-from-history is not available yet; most restore controls remain whole-domain.
7. Visual diff modals should be added before saving pricing, navigation, landing, media, analytics, and policy changes.
8. Route-copy synchronization is still performed during the build pass rather than by an automatic packaging script.
9. Browser-level smoke tests are still needed for Admin App and Site Settings add/remove/save flows.
10. Public crawl validation after Cloudflare deployment is still outstanding.

---

# Build 199 known gaps and risks — Site Settings JSON replacement

**Updated:** 2026-06-07  
**Build:** 199

Build 199 reduces the biggest remaining direct-JSON editing risk inside Admin Site Settings. Routine edits for navigation/footer, analytics registry, media requirements, holiday closures, and landing-page SEO/hero fields now use row/card editors. Raw JSON is still present, but it is collapsed and labelled as an emergency repair/fallback tool.

## Reduced in Build 199

- Admin Site Settings no longer presents navigation/footer, analytics events, media requirements, holiday closures, or landing-page content as primary JSON textareas.
- Landing-page content previews now understand object-based fallback content, not just arrays.
- Admin Recovery delivery rules no longer require direct Rules JSON edits for common send-window/quiet-hour/retry settings.
- Route-copy drift was avoided for the converted Admin Site Settings and Recovery screens.
- Staff have clearer boundaries between normal owner-safe editing and advanced developer/fallback repair.

## Still outstanding after Build 199

1. Pricing catalog still has an Advanced raw JSON panel for charts, included-service details, and deep package notes.
2. Some recovery provider/conditional rule structures still need a fuller visual rule-builder.
3. Friendly Site Settings rows need inline validation beside the field, not only domain-level validation buttons.
4. Friendly rows need visual diff modals before save/restore.
5. Per-row history restore is not available yet; history restore is still domain-level.
6. Media URL fields should connect to the media library instead of requiring manual URL copying.
7. Landing-page media and gallery fields need stronger consent/privacy badges before publish.
8. Route-copy synchronization is still done manually during the build pass rather than by a dedicated packaging script.
9. A dashboard card should list all remaining advanced JSON panels so they can be retired intentionally.
10. Browser-level tests are still needed for add/remove/apply/save flows in the new friendly Site Settings editor.

---

# Build 198 known gaps and risks — Friendly editor conversion

**Updated:** 2026-06-07  
**Build:** 198

Build 198 reduces the risk of staff breaking JSON while making routine updates. Social feeds, before/after gallery rows, and water-use rules now have friendly row-based editors while retaining advanced JSON recovery panels.

## Reduced in Build 198

- Social feed updates no longer require direct JSON editing for normal post/platform updates.
- Before/after gallery proof can be maintained with clear fields for consent, media type, URLs, and notes.
- Water restriction rules can be maintained as rows with source/review fields instead of one large JSON textarea.
- The raw JSON payloads remain available as emergency repair/fallback views rather than the primary editing surface.
- Route-copy drift was avoided for the two changed admin screens.

## Still outstanding after Build 198

1. Admin Site Settings still contains some generic JSON helper fields for complex domains such as navigation/footer groups, analytics registry, media requirements, and landing-page content.
2. Pricing catalog still has an Advanced raw JSON panel for charts/included services/richer notes, although the main package/add-on/service-area workflow is structured.
3. The new friendly editors still need visual diff modals before saving major changes.
4. Gallery rows should block or warn more strongly when consent is missing but publishing is attempted.
5. Water-rule source URLs should be validated and reviewed on a schedule.
6. A reusable row-editor component should replace the current page-specific JavaScript patterns.
7. A release-time route-copy sync script is still needed so copied routes cannot drift.
8. DB-to-bundled-fallback synchronization is still manual/documented rather than fully automated.

---

# Build 197 known gaps and risks — Self-healing admin diagnostics

**Updated:** 2026-06-06  
**Build:** 197

Build 197 reduces the risk of hidden admin drift by adding pricing-catalog diagnostics/repair, route-copy parity checks, and landing-page SEO readiness warnings. No new database tables are required.

## Reduced in Build 197

- A partial DB pricing catalog can now be diagnosed from the dashboard instead of only showing symptoms such as missing Landing Page Builder add-ons.
- Staff can repair missing pricing catalog groups/rows from bundled fallback data while preserving existing DB edits.
- Root HTML versus folder route-copy drift can now be reported from an admin endpoint and dashboard card.
- Dashboard cards now load independently, so one failed diagnostics endpoint should not hide unrelated warnings.
- Landing pages now warn about overlong titles/meta descriptions, missing hero/H1 text, missing images, and messy slugs before save.

## Still outstanding after Build 197

1. Pricing repair has an inline confirm prompt, but it does not yet show a full visual diff modal before writing.
2. Route-copy parity is visible in admin, but route-copy synchronization is not yet automatic during packaging.
3. Landing-page SEO/readiness warnings render on section load/save; they do not yet update live while typing.
4. Landing images still need consent/privacy badges directly beside each hero/gallery field.
5. Local SEO proof recommendations still need one-click task assignment from the dashboard card.
6. Public landing-page structured-data validation should be shown beside the editor before publish.
7. GET/POST compatibility for every admin fetch should be guarded by an automated release check.
8. More hard-coded payment/booking/public copy still needs to move into DB-backed editable settings.

---

# Build 196 known gaps and risks — Live admin error repairs

**Updated:** 2026-06-06  
**Build:** 196

## Closed or reduced in Build 196

- `/api/admin/local_seo_proof_report` no longer fails with 405 when the Admin Dashboard calls it with GET.
- Local SEO proof output now includes compatibility aliases for older/newer dashboard readers.
- Admin App no longer depends on an undefined `esc()` helper during option-library dropdown hydration.
- The Landing Page Builder can recover add-ons from bundled pricing JSON when a saved editable pricing row is partial.
- Pricing catalog loading now falls back to bundled JSON when the public pricing API is unavailable.

## Still outstanding after Build 196

1. Live browser testing is still needed after deploy for `/admin`, `/admin-app`, and landing builder save/reload.
2. Partial DB settings should eventually have a one-click repair/sync flow instead of relying only on runtime fallback hydration.
3. Landing-page SEO fields need live character counters and one-H1 preview warnings in Admin App.
4. Landing-page media fields still need stronger consent/privacy readiness badges.
5. Admin route/API method compatibility needs a broader automated guard across every admin screen.
6. The dashboard should show whether key editable settings are coming from DB, API fallback, or bundled JSON.
7. Local SEO proof recommendations should become assignable tasks directly from the dashboard card.

---


# Build 184 update — 20-step operations, media, and payment hardening

**Updated:** 2026-06-01  
**Build:** 184

Build 184 completes the requested next-20 pass by tightening the payment/refund operations, improving image/media readiness review, and documenting the next operational bundle. This pass is intentionally no-DDL: it uses the existing Build 180–182 payment tables and the Build 183 image requirements foundation.

## Build 184 — 20 completed items

1. Added `/admin-media-health.html` and `/admin-media-health/` so staff can review missing required photos/videos from a protected admin page.
2. Added `/api/admin/media_asset_health_scan` to scan required public R2/media URLs and return missing/not-public files with upload keys.
3. Added `data/image_requirements_build184.json` as the machine-readable source for required app, add-on, landing, gallery, and proof images.
4. Added the Media Health page to the shared Admin Menu.
5. Added Media Health access rules to `assets/admin-auth.js`.
6. Added a Media Health card to the Admin Dashboard.
7. Added `/api/admin/payment_refund_status_poll` so staff can poll Stripe/PayPal refund status and refresh local refund rows.
8. Added `/api/admin/payment_receipt_resend` so staff can requeue a customer quote-deposit receipt email from a payment request.
9. Added `/api/admin/payment_accountant_package_export` for an accountant-style payment CSV with Ontario HST allocation estimates.
10. Added an **Export accountant package** button to Admin Payments.
11. Added **Resend receipt** controls to quote deposit/payment request cards.
12. Added **Poll provider status** controls to refund record cards.
13. Kept manual refund records, provider refund initiation, webhook settlement, and replay controls on one Payments page for easier review.
14. Added `sql/2026-06-01_build184_twenty_step_ops_media_payment_no_ddl_note.sql` to document the no-DDL Build 184 schema status.
15. Updated `SUPABASE_SCHEMA.sql` with Build 184 operational notes.
16. Updated `DATABASE_STRUCTURE_CURRENT.md` with the Build 184 no-DDL dependency summary.
17. Updated `IMAGES.md` with the Admin Media Health scan workflow and upload review method.
18. Updated `COMPETETIVE_COMPLETION_MATRIX.md` to reflect Build 184 media/payment/accounting hardening.
19. Added `scripts/build184_twenty_step_ops_media_payment_check.py` and wired it into the release check chain.
20. Re-ran the one-H1 and release guard path so exposed public pages still use one clear H1.

## Next 20 steps after Build 184

1. Deploy Build 184 and test `/admin-media-health.html` against live R2 assets.
2. Upload the missing add-on images listed in `IMAGES.md`, then re-run the Media Health scan.
3. Replace regional landing placeholders with Rosie-owned images for Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Norwich/Otterville, and Waterford/Vittoria.
4. Capture the first four approved-public before/after gallery proof sets by town/service.
5. Add real image dimension validation instead of URL-only health checks.
6. Add R2 signed upload URLs for admin media replacement so uploads can happen from the app instead of the Cloudflare dashboard only.
7. Add a media task status table so missing-image items can be assigned, marked uploaded, reviewed, and approved.
8. Add provider refund polling for payment requests without refund rows, not only existing refund records.
9. Add scheduled retry checks for pending Stripe/PayPal refunds.
10. Add payment reconciliation variance warnings for paid amount vs. quote/deposit amount.
11. Add processor fee capture and estimated net payout fields to the payment export.
12. Add HST/GST allocation review screens before accountant export is considered final.
13. Add failed receipt email retry controls and visible notification-event status on Admin Payments.
14. Add customer-facing receipt PDF/download links.
15. Add final-balance invoice/payment requests after job completion.
16. Add payment application to final invoices, deposits, refunds, and tips.
17. Add month-end payment close checklist tied to reconciled provider exports.
18. Add dashboard warnings for missing images on high-traffic public pages.
19. Add Search Console/local SEO task cards tied to missing service/town proof content.
20. Add a consolidated accountant export package that bundles payment CSV, refund CSV, journal candidates, HST summary, and close checklist.

---

# Build 181 known gaps and risks — payment webhook settlement

**Updated:** 2026-05-26

Build 181 reduces the risk of missed quote deposits by connecting verified Stripe/PayPal payment events directly to `quote_deposit_payment_requests`. Staff manual confirmation remains available, but verified provider events can now mark deposits paid automatically.

## Reduced in Build 181

- Stripe webhook settlement now uses raw-body signature verification and quote deposit metadata.
- PayPal webhook settlement now verifies events against PayPal before updating payment request rows.
- PayPal quote-deposit orders can be created from Admin Leads when PayPal credentials are configured.
- The private quote-payment page can capture a returned PayPal order and update the same deposit record.
- Deposit settlement now uses one shared helper to keep quote draft, conversion draft, booking, and booking-event updates consistent.

## Still outstanding

1. Webhook event history is not yet shown in admin for failed or ignored provider events.
2. Provider retries/replay tools are not yet available.
3. Customer receipt/booking-confirmation emails after verified deposit are not fully automated.
4. Refund/partial refund and dispute workflows are not yet connected to quote deposits.
5. Processor-fee accounting and deposit journal candidates still need a dedicated workflow.
6. PayPal requires `PAYPAL_WEBHOOK_ID`, `PAYPAL_CLIENT_ID`, and `PAYPAL_CLIENT_SECRET`/`PAYPAL_SECRET`; Stripe requires the correct webhook secret for the deployed endpoint.

# Build 178 update — Status Saves, Saved Price Reviews, Public Content Rendering & Privacy Badges

**Current build:** Build 178  
**Date:** 2026-05-25

Build 178 closes the next operational gaps after Build 177 by adding conversion-draft status saving, saved final price reviews, live rendering of Admin Content Center blocks on public pages, media privacy readiness badges in the Social Queue/App Management flow, and deeper local SEO proof recommendations. No new DDL is required; this pass depends on the Build 175 content/conversion tables and Build 177 final-price review fields.

## Completed in Build 178

1. Added `/api/admin/lead_conversion_status_save` so staff can move conversion drafts through `draft_booking`, `needs_review`, `ready_to_book`, `converted`, and `closed`.
2. Added `/api/admin/lead_conversion_price_review_save` so catalog reconciliation results can be saved before booking creation.
3. Updated `/admin-conversions.html` with Save Status and Save Price Review controls.
4. Added `/assets/public-content-blocks.js` and live public content mounts on Home, Services, Specials, Fleet, Maintenance, and Help pages.
5. Added Social Queue media privacy readiness badges using the existing media privacy summary endpoint.
6. Expanded local SEO proof reporting with concrete next-proof recommendations by town/service.
7. Added a Build 178 release guard and no-DDL SQL note.

## Updated completion status after Build 178

| Area | Status | Build 178 notes |
| --- | --- | --- |
| Conversion draft status workflow | Stronger foundation | Status can now be saved without creating a booking. |
| Final price reconciliation | Stronger foundation | Reconciliation can be saved before booking creation. |
| Admin Content public rendering | Added foundation | DB/fallback content blocks can now render on public pages. |
| Media privacy before reuse | Stronger foundation | Social/Admin flows now show privacy readiness reminders. |
| Local SEO proof reporting | Stronger foundation | Report now recommends next town/service proof to create. |

## Remaining priority after Build 178

1. Add a fuller conversion-draft detail page with audit history.
2. Render saved content blocks into exact page sections rather than only generic cards.
3. Add admin approval gates that block publish/API actions unless consent and privacy statuses are approved.
4. Turn proof recommendations into assignable content/media tasks.
5. Add quote/proposal email delivery and customer acceptance tracking.

---

# Build 177 update — Conversion Review Queue, Price Reconciliation & Local Proof Reporting

**Updated:** 2026-05-25  
**Current build:** Build 177  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 177 closes the next workflow gap after Build 176 by adding a dedicated `/admin-conversions.html` review queue. Staff can now review all lead conversion drafts in one place, reconcile final package/add-on/travel/HST pricing from the pricing catalog, confirm the required booking fields, and create a live booking only after the draft is ready. Build 177 also adds local SEO proof reporting that counts only privacy-approved before/after examples by town and service.

## Completed in Build 177

1. Added `/admin-conversions.html` and `/admin-conversions/` as a protected conversion-draft review queue.
2. Added `/api/admin/lead_conversion_price_reconcile` for catalog-backed package/add-on/travel/HST/deposit review before booking creation.
3. Added `/api/admin/local_seo_proof_report` for privacy-approved town/service proof coverage reporting.
4. Updated Admin Analytics with a **Local SEO proof coverage** card.
5. Updated public Gallery cards with clearer consent/privacy badges.
6. Added optional final-price review fields to `public.lead_conversion_drafts` via `sql/2026-05-25_build177_conversion_review_price_local_proof.sql`.
7. Updated Admin Dashboard, Admin Menu, Admin Shell, and Admin Leads access paths so the Conversion Queue is easy to find.
8. Updated `SUPABASE_SCHEMA.sql`, `DATABASE_STRUCTURE_CURRENT.md`, and release guards.

## Updated completion status after Build 177

| COMPETETIVE.md area | Current status | Build 177 notes |
| --- | --- | --- |
| Lead → booking workflow | Stronger foundation | Dedicated review queue now separates draft review from the lead card UI. |
| Final price reconciliation | Added foundation | Catalog-backed package/add-on/travel/HST review is available before creating a real booking. |
| Quote/booking status workflow | Improved | Conversion drafts can be filtered/reviewed before becoming live booking rows. |
| Admin-managed content | Partial but improved | FAQ and reusable content blocks exist; page-specific live rendering remains next. |
| Service/town proof reporting | Added foundation | Analytics now reports approved proof coverage by target town/service. |
| Media privacy enforcement | Improved | Public Gallery shows consent/privacy badges and still filters non-approved media. |
| Conversion analytics | Improved | Lead/quote summary exists and local proof coverage was added to Admin Analytics. |

## Remaining competitive gap priority after Build 177

1. Save final price reconciliation payloads directly from `/admin-conversions.html` before booking creation.
2. Add a dedicated conversion-draft status update endpoint for `needs_review`, `ready_to_book`, `converted`, and `closed`.
3. Add visible privacy badges beside every admin gallery/social publish action, not only public gallery and App Management warnings.
4. Render Admin Content Center blocks live on public Specials, service, homepage, fleet, maintenance, and Help pages.
5. Add town/service proof dashboards that recommend the next local page or gallery item to create.
6. Add customer-facing quote/proposal send and acceptance tracking.

---

# Build 174 update — Admin Leads quote/proposal drafts

**Updated:** 2026-05-24  
**Current build:** Build 174  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 174 completes the next open competitive-matrix item after the quote starter: staff can now save generated quote starter text as a persistent quote/proposal draft from `/admin-leads.html`. This moves the workflow from copy-only follow-up toward a real quote pipeline while staying fallback-safe if the new table has not been applied yet.

## Completed in Build 174

1. Added `/api/admin/quote_proposal_drafts_save` for staff-protected quote/proposal draft creation and updates.
2. Added `/api/admin/quote_proposal_drafts_list` for staff-protected draft lookup by lead, booking, status, search, or id.
3. Updated `/admin-leads.html` and `/admin-leads/index.html` with **Save quote draft** and **Load drafts** actions on each public lead.
4. Added persistent draft display directly under the lead card so staff can see saved follow-up text before contacting a customer.
5. Added migration-safe fallback messages when the new draft table has not been applied yet.
6. Added SQL migration `sql/2026-05-24_build174_quote_proposal_drafts.sql`.
7. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` with the quote/proposal draft table plan.
8. Added release guard `scripts/quote_proposal_drafts_build174_check.py` and wired it into `scripts/release_check.py`.
9. Re-ran Cloudflare Functions checks, one-H1 validation, and release checks.

## Active next steps after Build 174

1. Apply `sql/2026-05-24_build174_quote_proposal_drafts.sql` after the Build 167/168 lead SQL.
2. Browser-test `/admin-leads.html` by building a quote starter, saving it as a draft, and loading it again.
3. Add draft status controls for `needs_review`, `ready_to_send`, `sent`, `accepted`, and `declined`.
4. Add one-click lead → draft booking/quote conversion.
5. Add package/add-on price suggestions from the live pricing catalog.
6. Extend Admin Content Center to specials, service blurbs, homepage cards, and help articles.
7. Add service/town-aware proof filtering and media privacy enforcement before public gallery/social use.

---
# Build 173 known gaps and risks — Admin Content Center and Help Articles access

**Updated:** 2026-05-24

## Closed or reduced in Build 173

- FAQ/help content now has a protected admin editing path at `/admin-content.html`.
- Staff can list, edit, create, hide, and sort FAQ entries through `/api/admin/content_faqs_list` and `/api/admin/content_faqs_save` once the Build 172 FAQ table is applied.
- The Help Articles page is no longer thin. It now explains road salt, pet hair, coating/protection, paint correction, mobile-detailing preparation, photo-estimate triggers, gift cards, fleet, specials, and maintenance paths.
- Help Articles are now easier to discover because `assets/chrome.js` links `/blog` from the main navigation as **Help** and from the footer.

## Still outstanding

1. Apply Build 172 SQL before relying on live FAQ saves.
2. Extend Admin Content Center beyond FAQ entries to specials, service page blurbs, help articles, and education cards.
3. Add persistent quote/proposal draft records.
4. Add lead → booking/quote conversion.
5. Add service/town-aware gallery and recent-work filtering.
6. Add media privacy enforcement before gallery/social use.
7. Add analytics to measure FAQ/help article views, lead starts, quote starts, and booking conversions.

---
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 172 known gaps and risks — FAQ/content-access pass

**Updated:** 2026-05-24

## Closed or reduced in Build 172

- The FAQ route is no longer just a roadmap item. `/faq` and `/faq/index.html` now have real customer-facing content.
- New public pages are easier to discover because FAQ is linked from navigation, footer, homepage, Services, Pricing, Contact, and sitemap.
- FAQ/help content now has a DB target (`public_faq_entries`) and a fallback API (`/api/public_faqs`), reducing future duplicate static-copy drift.
- FAQPage and BreadcrumbList schema are present on the new FAQ page.

## Still outstanding

1. Apply Build 172 SQL before expecting FAQ content to come from Supabase.
2. Build an Admin Content editor for FAQ, specials, services, and education content.
3. Add persistent quote/proposal draft records and send/review workflow.
4. Add lead → booking/quote conversion and status analytics.
5. Add service/town-aware gallery/recent-work filtering.
6. Enforce per-media privacy review before public gallery or social reuse.
7. Continue testing auth/session fallback after every deploy because missing env vars still prevent successful login, even though the console no longer hard-fails.

---
# Build 171 known gaps and risks update

**Updated:** 2026-05-24  
**Current build:** Build 171

Build 171 reduces the Admin Leads conversion gap by adding a quote-starter action. Staff can now transform a lead into consistent internal quote follow-up copy, but it still does not create a real booking, invoice, saved proposal, or customer-facing message automatically.

## Reduced in Build 171

- Admin Leads can build a quote starter from each public lead.
- Linked uploads and customer-provided photo/share links are included in the quote context.
- Privacy warnings are surfaced before staff use uploaded media publicly.
- Service-key alias checks are more consistent across lead/upload endpoints.
- A Build 171 release guard now requires the endpoint, UI action, SQL note, schema note, and docs markers.

## Remaining risks

- Build 167 SQL must exist before `public_inquiry_leads` and `photo_estimate_uploads` can store live data.
- Build 168 SQL is still needed for upload staff/privacy notes and reviewer tracking.
- The quote starter is copy-ready text only; it is not a persistent quote object yet.
- Staff must still manually verify pricing, service area, photos, water/power/parking access, and any quote-required add-ons before sending a customer message.
- Lead-to-booking conversion, saved quote drafts, DB-managed public content, service/town proof filtering, and media eligibility automation remain next major work.

---
# Build 168 known gaps and risks update

**Updated:** 2026-05-23  
**Current build:** Build 168

Build 168 reduces the biggest Build 167 operations risk: public leads and optional estimate uploads are no longer just stored in database tables. Staff now have a protected Admin Leads screen to search, triage, update status, attach notes, link a lead/upload to a booking UUID, and mark media privacy status.

## Reduced in Build 168

- Admin Leads now exists for `public_inquiry_leads`.
- Staff can move public leads through `new`, `reviewing`, `contacted`, `quoted`, `converted`, `closed`, or `spam`.
- Staff can save lead notes and converted booking UUIDs.
- Admin photo/video upload review now exists for `photo_estimate_uploads`.
- Staff can mark upload status and media privacy status before photos are used elsewhere.
- Photo upload review can store staff notes, privacy notes, reviewer, and reviewed timestamp after the Build 168 SQL is applied.
- Release checks now require the Admin Leads page, endpoints, SQL migration, docs, and schema markers.

## Remaining risks

- Build 167 SQL must be applied before public lead/upload tables exist.
- Build 168 SQL must be applied before photo upload staff/privacy notes and reviewer tracking are fully stored.
- Direct uploads should remain disabled until storage bucket, public base URL, file-size limit, and privacy workflow are confirmed.
- Admin Leads can link a lead/upload to an existing booking UUID, but it does not yet create the booking or quote automatically.
- A full quote-builder, DB-managed public content editor, service/town proof filters, and gallery/social eligibility automation remain the next major backend/admin steps.

---

# Build 167 known gaps and risks update

**Updated:** 2026-05-23  
**Current build:** Build 167

Build 167 reduces the remaining competitor-completion gap by adding structured fleet/maintenance lead capture, optional direct quote-photo upload foundation, public FAQPage/Breadcrumb schema foundations, and a release guard for the updated completion matrix.

## Reduced in Build 167

- Direct customer upload now has a safe env-gated foundation instead of only shared photo links.
- Fleet quote interest is now captured with a structured public form.
- Maintenance plan interest is now captured with a structured public form.
- Public lead capture now has an SQL-backed table.
- Optional quote-photo uploads now have an audit table for later privacy/media review.
- FAQPage and BreadcrumbList schema foundations are now present on public competitor routes.
- `COMPETETIVE_COMPLETION_MATRIX.md` now distinguishes complete public foundations from still-open admin/backend workflow.

## Remaining risks

- Direct uploads should stay disabled until storage bucket, public base URL, size limits, and privacy workflow are confirmed.
- Lead forms require the Build 167 SQL migration before saving into Supabase.
- There is not yet an Admin Leads screen to triage `public_inquiry_leads`.
- Uploaded estimate media is appended to booking links, but uploaded media still needs admin review and booking-linking workflow.
- Service/town proof filtering, quote builder, DB-managed content editing, and gallery/social eligibility automation remain the next major admin/backend tasks.

---

# Build 166 known gaps and risks update

**Updated:** 2026-05-23  
**Current build:** Build 166

Build 166 reduces the public-facing competitor-roadmap gap by adding the missing public entry routes for specials, gift cards, fleet/commercial work, maintenance plans, and customer education. It also expands add-on coverage and documents the remaining backend/admin work in `COMPETETIVE_COMPLETION_MATRIX.md`.

## Reduced in Build 166

- Specials are no longer only a roadmap idea; `/specials` now exists.
- Gift cards now have a customer-friendly `/gift-cards` guide in addition to the existing gift system.
- Fleet/commercial quoting now has `/fleet` as a plain-language entry point.
- Maintenance-plan messaging now has `/maintenance` as a public guide tied to the existing interest flow.
- Customer education now has `/blog` and starter articles.
- Add-on coverage now better matches the competitor roadmap.
- Sticky CTAs now keep Book, Send photos, Call/text, and Specials close to users.

## Remaining risks

- These new pages are static/public foundations; high-change content should still move into DB/admin management.
- Direct upload is still not complete; Build 165 share-link capture remains the current safe route.
- Gallery proof still needs service/town filtering and approval controls.
- Quote building from photo estimates still needs a staff workflow.
- Per-media privacy review is still needed before automatic public gallery/social eligibility.


---

# Build 165 known gaps and risks update

**Updated:** 2026-05-22  
**Current build:** Build 165

Build 165 reduces the quote-first conversion gap by letting customers paste photo-estimate links before checkout. The links are included in booking notes immediately and can be stored directly in `bookings.photo_estimate_links` after the Build 165 migration is applied.

## Reduced in Build 165

- Photo-estimate customers no longer have to rely on free-form notes only.
- Submitted photo/media links are visible in Admin Booking's intake/media consent panel.
- Checkout stays fallback-safe before the new optional column is live.
- Release checks now verify the booking-page, checkout, admin-booking, SQL, and roadmap markers for this workflow.

## Remaining risks

- Direct customer file upload still needs a follow-up pass; Build 165 captures share links, not uploaded files.
- Staff still need a quote-building workflow that turns reviewed photos into recommended packages/add-ons.
- Media-level privacy review is still booking-level plus staff checklist; each individual photo/video should get its own privacy status later.
- Social/gallery eligibility should eventually require both consent and per-media privacy approval.
- The Build 162, 163, 164, and 165 migrations should be applied in order before relying on direct reporting fields.

---

# Build 164 known gaps and risks update

**Updated:** 2026-05-22  
**Current build:** Build 164

Build 164 reduces the staff workflow gap from Build 163 by adding Admin Booking controls for photo-estimate status, condition review status, media/privacy status, privacy checklist flags, blur/crop flags, and a staff review note. The admin action is fallback-safe, but direct reporting still depends on the Build 162, Build 163, and Build 164 migrations being applied.

## Reduced in Build 164

- Staff can now save intake-review statuses instead of only viewing intake details.
- Photo-estimate, condition, and media/privacy review workflows now have a clear admin action path.
- Privacy checklist flags can be stored for plates, faces, addresses/private identifiers, blur/crop needed, and blur/crop complete.
- Staff review notes can be stored directly when the Build 164 migration is applied.
- If optional columns are not migrated yet, the review action is appended to booking notes instead of breaking the admin workflow.

## Still open after Build 164

1. Apply the Build 162 migration, then Build 163, then Apply the Build 164 migration.
2. Confirm the live Supabase schema cache sees the new optional booking fields.
3. Add true customer photo upload/lead capture before checkout.
4. Add media-level privacy review actions for individual job photos/videos.
5. Enforce gallery/social eligibility from consent, privacy review, and blur/crop completion.
6. Add staff quote-building tools from customer photo estimates and condition flags.
7. Add automated customer messages for photo-estimate received and quote-ready states.
8. Continue migrating scattered public service content into DB-managed admin content.
9. Continue clean/orphan branch planning to prevent stale GitHub files from surviving web uploads.

---

# Build 163 known gaps and risks update

**Updated:** 2026-05-21  
**Current build:** Build 163

Build 163 reduces the staff-side risk created by Build 162 note-only intake capture. Checkout can now write the optional condition/photo/media-consent fields directly when migrations are applied, and Admin Booking now surfaces the intake/consent review in its own panel. The main remaining risk is that the new optional fields must be migrated before reporting/editing can rely on them fully.

## Reduced in Build 163

- Admin Booking no longer relies only on buried notes for condition-helper and media-consent review.
- Checkout has fallback-safe optional-field insertion, so the booking flow should not break if the new columns are not live yet.
- Staff can quickly see whether a customer requested a photo estimate.
- Staff can see media-use preference before using job photos publicly or socially.
- Schema now has planning fields for photo-estimate, condition-review, and media-privacy workflows.

## Still open after Build 163

1. Apply the Build 162 migration and then the Build 163 migration.
2. Add admin edit controls for the new intake/review status fields.
3. Add real customer photo upload/lead capture before checkout.
4. Add per-media privacy review fields/actions for plates, faces, addresses, and blur/crop.
5. Enforce gallery/social eligibility using consent + privacy-review status.
6. Expand FAQ, proof filtering, specials, gift-card merchandising, and DB-first public content management.
7. Continue clean/orphan branch planning once deploy stability is confirmed.

---

# Build 162 known gaps and risks update

**Updated:** 2026-05-21  
**Current build:** Build 162

Build 162 reduces the public conversion gap by adding a condition-based booking helper, photo-estimate intent capture, and media-consent preference. The workflow still needs direct DB field writes after migration, admin display panels, true media upload, privacy/blur/crop tracking, proof filtering, FAQ expansion, and DB-first public content management.

## Reduced in Build 162

- Booking now has a condition helper that recommends a package and eligible add-ons from customer-selected conditions.
- Photo-estimate intent is now captured in the public booking flow.
- Media-consent preference is now explicit before photos are used for public proof or social posts.
- Checkout preserves customer notes and the new recommender details in booking notes for backwards compatibility.
- Optional schema fields are prepared for later direct reporting/storage.

## Still open after Build 162

1. Apply the Build 162 optional SQL migration before storing condition/media fields directly.
2. Update booking insert/admin detail screens to use the new columns once applied.
3. Customer-facing photo upload/lead capture is still link/notes based and needs real storage.
4. Plate/face/address blur/crop tracking remains a future privacy workflow.
5. Public gallery/social eligibility still needs consent + privacy-review gating.
6. FAQ/proof/specials/gift-card conversion content still needs expansion.
7. High-change content should continue moving toward DB-first admin-managed records.
8. Clean/orphan branch replacement remains recommended after deploy stability.

---

# Build 161 known gaps and risks update

**Updated:** 2026-05-21  
**Current build:** Build 161

Build 161 closes part of the competitor-aligned conversion gap by adding package aliases, Booking Step 2 service chooser guidance, and stronger photo-estimate CTAs. Remaining high-priority gaps are the true condition-based recommender, customer-facing photo upload/lead capture, consent capture, media privacy review fields, FAQ expansion, proof filtering, DB-first service content, and clean/orphan branch replacement after deploy stability.

---

# Known Gaps and Risks — Build 160 competitor sanity reset

**Updated:** 2026-05-21  
**Current build:** Build 160

## Reduced in Build 160

- The competitor/service roadmap in `COMPETETIVE.md` has now been sanity-checked against the current website/app.
- `DEVELOPMENT_ROADMAP.md` has been reset as the top implementation source of truth.
- A new `COMPETITOR_SANITY_CHECK.md` captures current state, target state, priority ranking, completed steps, and next steps.
- Services page now includes a plain-language decision guide before visitors reach package cards.
- Services page now includes a stronger photo-estimate / quote CTA.
- Release checks now include a competitor-roadmap guard so the key planning documents and Services decision-guide markers do not drift away silently.

## Still open after Build 160

1. Package display aliases still need to be added so customer-facing tiers match the competitor roadmap while preserving current pricing codes.
2. Booking still needs condition-based package recommendations.
3. Booking and Contact still need a more obvious photo-estimate upload/request path.
4. Customer consent capture for public/social use is not finished yet.
5. Media privacy status for plates, faces, addresses, and blur/crop completion is not finished yet.
6. Specials/promos need stronger public merchandising and admin-managed content blocks.
7. Gift cards exist, but service-specific gift-card merchandising still needs improvement.
8. FAQ blocks need to be expanded across the highest-value service pages.
9. Proof/reviews/recent work are not yet automatically filtered by town and service.
10. High-change service/add-on/specials/FAQ copy still needs to move toward DB-first admin management.
11. Search Console and Google Business Profile reporting are not connected into admin analytics yet.
12. Social metrics snapshots have schema support, but staff entry/dashboard rollups still need completion.
13. Clean/orphan branch replacement remains recommended after deploy stability because GitHub web uploads can leave stale files.
14. Older Markdown files remain for history, but future planning should start from `DEVELOPMENT_ROADMAP.md`.

---

# Known Gaps and Risks — Build 159

**Updated:** 2026-05-20

## Reduced in Build 159

- Admin Social Queue now loads reusable caption templates and hashtag presets from the DB when available.
- Built-in fallback templates keep the page usable before the Build 158/159 SQL migrations are applied.
- Manual drafts can now include a planned publish time and can be filtered by planned/unscheduled status.
- Duplicate draft warnings are visible when the same platform/caption/first-media signature appears more than once in the current queue view.
- Staff can capture a posted URL and optional platform post ID when marking a manual post as posted.
- Build 159 schema support adds duplicate review helpers and optional social metrics snapshots for future reporting.

## Still open after Build 159

1. Build 156, Build 158, and Build 159 SQL migrations must be applied in order on Supabase before all social fields are available.
2. Direct API posting still depends on platform credentials, scopes, and platform approval.
3. TikTok, Google Business Profile, LinkedIn, and YouTube Shorts remain safer as webhook/manual flows until the account/app approval paths are confirmed.
4. Draft text cannot yet be edited inline after creation.
5. Scheduled publish times are stored and visible, but there is no automated scheduler worker yet.
6. Duplicate warnings are advisory only; they do not yet block approval or provide an ignore/approve-as-intentional workflow.
7. Customer-facing consent capture still needs to be wired into the booking/progress experience.
8. Media crop/blur confirmation is still checklist-based, not image-analysis based.
9. Social metrics snapshots have schema support, but the admin data-entry/reporting UI still needs to be added.
10. A clean branch/orphan upload is still the cleanest way to permanently remove stale GitHub files left behind by web uploads.

---

# Build 158 update — Social review gates and local caption templates

**Updated:** 2026-05-20  
**Current build:** Build 158

Build 158 continues the Build 156/157 social publishing workflow and makes it safer before any job/crafting-progress photo or summary is pushed to X, Facebook, Instagram, TikTok, Google Business Profile, or manual/webhook channels.

## Completed in Build 158

1. Added `functions/api/_lib/social-compliance.js`.
2. Added customer/public-use consent checks for social drafts.
3. Added license plate, face, address, and private-identifier review checks.
4. Added no-private-customer-info caption review.
5. Added platform warning generation for X length, Instagram media requirements, TikTok media requirements, Facebook media recommendations, and Google Business Profile local wording hints.
6. Added `Approve & ready` review action in Admin Social Queue.
7. Blocked direct `Publish/API` unless a draft is marked ready and the review gate passes.
8. Added fallback-safe inserts if the Build 158 SQL migration has not been applied yet.
9. Added fallback-safe social queue reads when new review columns do not exist yet.
10. Added review checklist controls to Admin Social Queue manual draft creation.
11. Added review checklist controls to Admin Progress social draft creation.
12. Updated immediate push workflow to approve-ready first, then publish only if the review gate passes.
13. Added review badges and platform warning display to Admin Social Queue cards.
14. Added `social_caption_templates` table.
15. Added `social_hashtag_presets` table.
16. Seeded local caption templates for Southern Ontario, Oxford County, Norfolk County, and Tillsonburg-style posts.
17. Seeded local hashtag presets for Rosie Dazzlers local discovery.
18. Added `duplicate_signature` on queued posts to support future duplicate-content warnings.
19. Updated social workflow release checks for Build 158 markers.
20. Updated Markdown and schema notes for the new social review gate.

## Next 20 value-added steps after Build 158

1. Apply the Build 156 social queue migration if it has not already been run.
2. Apply `sql/2026-05-20_build158_social_review_gates_and_templates.sql`.
3. Test Admin Progress with one internal job update and one media URL.
4. Confirm a draft is created with platform warnings in Admin Social Queue.
5. Confirm `Publish/API` is blocked until `Approve & ready` is clicked.
6. Add a duplicate-content warning in the Admin Social Queue UI using `duplicate_signature`.
7. Add a template picker that loads `social_caption_templates` from the DB.
8. Add a hashtag preset picker that loads `social_hashtag_presets` from the DB.
9. Add a scheduler calendar for planned posting times.
10. Add a posted URL capture form for manual posts.
11. Add customer-facing consent capture on the booking/progress flow.
12. Add media-crop/blur status fields for license plates and private identifiers.
13. Add staff training notes explaining that drafts are not public until approved/published.
14. Add platform-specific preview cards for Facebook, Instagram, X, TikTok, Google Business Profile, and manual.
15. Add basic post analytics fields: clicks, views, likes, comments, shares, and last checked time.
16. Add webhook payload signing/verification documentation for Make/Zapier/n8n bridges.
17. Add scheduled retry rules for failed webhook/API attempts.
18. Add a public gallery promotion workflow that only uses approved social media rows.
19. Add Google Business Profile post/manual workflow notes once the account flow is finalized.
20. After deploy is stable, consider a clean-branch/orphan upload to remove stale GitHub files that web upload does not delete.

---

# Known Gaps and Risks — Build 157


**Updated:** 2026-05-19

## Reduced in Build 157

- Social posts are no longer only passive drafts: Admin Social Queue now has `Publish/API`, `Send webhook`, and `Copy text/media` actions.
- Admin Progress can now create social drafts automatically after job/crafting progress updates or media posts.
- Admin Progress can optionally attempt approved platform API/webhook publishing immediately after draft creation.
- Direct API attempts are guarded: X, Facebook Page, and Instagram Business need configured tokens; unsupported platforms fail safely to webhook/manual flow.
- The root `/admin-progress.html` and `/admin-social.html` files were synchronized with their folder `index.html` versions to reduce stale-route drift.
- Release checks now require Build 157 social publishing bridge markers.

## Still open after Build 157

- TikTok, Google Business Profile, LinkedIn, and YouTube Shorts still need final approved platform apps/OAuth flows before true direct posting.
- X image upload is not wired yet; Build 157 posts text/progress links through X and keeps images available for manual/webhook flow.
- Facebook and Instagram publishing require public media URLs and valid Meta page/account tokens.
- Webhook automation needs the destination service configured in Cloudflare Pages environment variables.
- Customer privacy review for license plates/faces/addresses still needs a dedicated checklist before auto-publish is made default.


**Updated:** 2026-05-18

## Reduced in this pass

- Cloudflare Pages Functions deploy blocker from Build 151 was repaired in `/api/admin/media_library_list`.
- Duplicate object-key warnings in `landing_pages_public.js` were cleaned up.
- Release checks now include a Cloudflare Pages Functions deploy-safety guard for JavaScript syntax, esbuild-sensitive regexes, and duplicate landing-page normalization keys.
- Admin Catalog now has a media-library-aware image picker path through `/api/admin/media_library_list`.
- The picker can search DB media rows, app-setting media rows, bundled consumables/tools fallback rows, saved DB inventory rows, and helper image URLs.
- Staff can select inventory rows and use **Repair selected images** to persist fallback-matched images instead of only seeing temporary UI hydration.
- Browser-side **Scan visible images** can flag image URLs that fail to load during the current admin session.
- Duplicate-image groups are counted in the quality summary and shown on affected rows.
- Release checks now guard the Cloudflare deploy hotfix, media-library picker, selected image repair, duplicate diagnostics, image health scan, and endpoint markers.
- Schema tracking now includes the Build 151 `app_media_library` table/index baseline.

## Still open

1. The media-library endpoint can read `app_media_library`, but the table still needs to be seeded from the actual R2 product/tool folders.
2. Admin Catalog can pick existing media URLs, but it does not yet upload new files directly to R2.
3. Browser image scans are useful for staff checks, but they are not a scheduled/server-side 404 monitor yet.
4. Duplicate-image warnings do not yet have an approval/ignore list for intentional duplicate tools, multipacks, or shared product photos.
5. `Repair selected images` is intentionally conservative; a fuller review screen is still needed for repairing all fallback-matched rows at once.
6. Existing DB rows with blank images are hydrated visually, but the URL is only persisted after save or selected repair.
7. Supabase dev still needs the Build 150 and Build 151 SQL migrations applied and smoke-tested.
8. External location photos are still placeholders and should be replaced with Rosie-owned/R2-hosted images.
9. Reviews, before/after proof, and inventory/tool stories are not yet automatically filtered by town/service page.
10. Inventory/accounting still needs stock-count sessions, variance review, receipt attachment, and lockable month-end inventory valuation.
11. Search Console and Google Business Profile reporting are not yet connected.
12. Some historical Markdown snapshots remain for traceability, but active docs are the Build 155 working handoff source.

<!-- Build 155 sync 2026-05-18: reviewed during Cloudflare deploy hotfix and inventory/media image workflow pass. -->

## Build 155 known risks update

- Build 155 should resolve the Cloudflare unresolved `_lib` import errors by correcting root API import paths and hardening release checks.
- Deploy still needs to be confirmed on Cloudflare Pages because the previous failure happened during Cloudflare's Functions bundling step.
- Legacy flat root API JavaScript copies still exist for compatibility in this ZIP, but they should be retired after a clean deploy confirms `/functions/api` is the only needed route source.

## Build 155 Cloudflare stale root function shim hotfix - 2026-05-19

Cloudflare still saw older flat `/functions/api/*.js` route files after GitHub web uploads, because uploading ZIP contents does not reliably delete older files from the branch. Build 155 intentionally includes compatibility shim files for the stale flat routes listed in the Cloudflare deploy log. Each shim re-exports the active `/functions/api/admin/*.js` implementation and prevents Pages Functions bundling failures while preserving the newer admin route implementation.

Next step: after Build 155 deploys cleanly, optionally remove the compatibility shims in a clean-branch/orphan rebuild so only the intended folder-backed route files remain.


## Build 155 Cloudflare root import release-check hotfix - 2026-05-18

Build 155 repairs the remaining root Cloudflare Pages Function import paths that could still break deployment after Build 154. Four root `/functions/api/*.js` files still used `../_lib/...`; root routes must use `./_lib/...`. Build 155 fixes those files, keeps the stale-route shims, wires the stale-root import guard into the release checklist, and updates the release runner so the full check can complete in this sandbox.

Remaining risk: GitHub web uploads can leave older files in the branch. Build 155 guards the import pattern, but the cleanest long-term fix is still a clean/orphan branch replacement after a successful deploy.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.


## Next 20 value-added steps after Build 156

1. Run the Build 156 social queue SQL migration in Supabase.
2. Add a Social Queue card to staff role training notes so detailers know drafts are not public posts yet.
3. Decide the first direct-post platform: recommended order is Facebook/Instagram, Google Business Profile, X, TikTok, then YouTube Shorts.
4. Add per-platform caption length warnings and media-count warnings.
5. Add a privacy checklist before any customer vehicle/photo can be marked ready.
6. Add license-plate blur/cover reminder fields to the media workflow.
7. Add customer consent flags for public before/after use.
8. Add a reusable caption template library for job type, vehicle size, service area, and upsell language.
9. Add platform-specific hashtag presets for local SEO and discovery.
10. Add OAuth setup notes and token rotation guidance for each social platform.
11. Add a direct Meta/Facebook Page adapter after the app permissions are approved.
12. Add an Instagram Business publishing adapter after Meta media-container requirements are confirmed.
13. Add a Google Business Profile recent-work publishing path after the Google account scope is finalized.
14. Add a TikTok direct-post adapter only after app review and creator authorization are confirmed.
15. Add a queue calendar so posts can be scheduled by day/time.
16. Add duplicate-content warnings when the same photo/caption is queued twice.
17. Add analytics fields for clicked progress links and posted platform URLs.
18. Add customer-friendly public gallery promotion rules from approved job media.
19. Add fallback export buttons: copy caption, download media list, and open platform composer.
20. Add social performance notes back into the booking/customer history for future marketing decisions.

## Build 169 resolved issue — Auth/analytics 500 noise on login and Admin Leads

Resolved the immediate browser-console 500 pattern by changing `auth_me` endpoints and analytics ingest to return safe JSON fallbacks when Supabase config, session tables, or analytics tables are unavailable. Login endpoints now return application-level JSON errors instead of raw 500s for missing config, schema drift, or unavailable password-hash support.

Remaining operational risk: successful login still requires Cloudflare Pages variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` plus the Supabase tables `staff_users`, `staff_auth_sessions`, `customer_profiles`, `customer_auth_sessions`, and `site_activity_events`. If a staff password is stored as bcrypt and `bcryptjs` is not bundled, re-bootstrap the account with `hash_mode='sha256'` or add a package/build step for bcryptjs.

## Build 170 resolved issue — Customer dashboard 401 console noise

Observed on the live dev site: `/api/client/dashboard` returned HTTP 401 when no customer session existed. This was technically correct for a protected dashboard, but it created noisy DevTools errors when public pages only wanted optional customer context. Build 170 resolves this by returning a safe signed-out JSON payload with HTTP 200 for dashboard reads. This should remove the reported `api/client/dashboard:1 Failed to load resource: 401` message during normal signed-out browsing.

Still verify after deploy: actual login must create a customer session cookie, and protected customer write actions must still require a valid session.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.


## Build 175 known gaps

The new lead conversion draft workflow is intentionally safer than creating a live booking automatically. A real booking should still require staff confirmation of date, slot, address, water/power access, vehicle size, package, add-ons, and final price. Media privacy is now enforced on the public gallery API, but App Management still needs stronger UI validation so pending/private/rejected gallery items are easier to spot before save.

## Build 176 Update — conversion-to-booking, dashboard cards, and privacy warnings

- Added a reviewed conversion draft → real booking workflow so Admin Leads can create a live booking only after staff confirms service date, AM/PM slot, address, package, vehicle size, customer name, and customer email.
- Added Admin Analytics cards for FAQ/help/lead/quote conversion summary using `/api/admin/conversion_funnel_summary`.
- Added App Management media privacy readiness warnings using `/api/admin/media_privacy_review_summary` so gallery/social reuse is checked before publishing.
- Preserved the one-H1 exposed-page rule and kept local SEO wording/access paths focused on Oxford/Norfolk service discovery.
- Added Build 176 SQL/schema notes for `lead_conversion_drafts.converted_booking_id` and `lead_conversion_drafts.converted_at`.

### Build 176 known gaps

- Real booking creation from conversion drafts now exists, but staff still need to manually confirm the date, AM/PM slot, address, package, vehicle size, and pricing before saving.
- The conversion draft screen is functional but still basic; a dedicated conversion review queue would be cleaner than working only from each lead card.
- Media privacy warnings now exist in App Management, but the warning state is not yet shown directly beside every social/gallery publishing button.
- Pricing suggestions still require staff judgement before the final invoice/booking amount is confirmed.
> Build 177 documentation sync (2026-05-25): added protected conversion-draft review queue, catalog-backed final price reconciliation, local SEO proof coverage reporting, public gallery privacy badges, SQL/schema notes, and release guard coverage.


> Build 178 documentation sync (2026-05-25): added conversion status saving, saved final price reviews, public content block rendering, media privacy badges, proof recommendations, schema note, and release guard coverage.

---

## Build 179 documentation sync — publish blocking, proof tasks, quote acceptance

Build 179 adds hard social publish blocking before webhook/API/manual posted actions, assignable local SEO proof tasks from proof recommendations, and customer-facing quote/proposal delivery plus accept/decline tracking. Schema tracking now points to `sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql`. The one-H1 SEO rule, local service/town wording, and fallback-safe API pattern remain required on every pass.

### Build 179 risk update

Reduced risk: social webhook/API/manual posted actions now hard-block if a draft has not passed readiness/privacy review. Remaining risk: any future publish provider must reuse the same gate. Quote acceptance now has token tracking, but payment/deposit and final schedule confirmation remain outstanding.

---

### Build 180 update — accepted quote deposit/payment request and final booking confirmation

Build 180 connects the accepted quote workflow to a safer payment-request foundation. Staff can create a tracked deposit/payment request from an accepted quote/proposal draft, share the private `/quote-payment.html` customer page, mark deposits paid from Admin Leads, and link or confirm the final booking when a booking row is available. Schema tracking was updated for `public.quote_deposit_payment_requests` and the quote/conversion deposit status fields.

## Build 180 gaps and risks

Reduced risk:
- Accepted quotes no longer stop at customer acceptance; they now have a tracked deposit/payment request path.
- The public payment page is marked `noindex,nofollow` so customer-specific quote/payment links are not meant for search indexing.

Still a gap:
- Stripe checkout creation is supported when `STRIPE_SECRET_KEY` is configured, but automatic paid-status webhook reconciliation for this new quote deposit table is still outstanding.
- Staff can manually mark deposits paid; provider-verified payment confirmation should be added next before relying fully on automated checkout.
---

> Build 181 documentation sync (2026-05-26): Added verified Stripe/PayPal webhook settlement for `quote_deposit_payment_requests`, PayPal quote-deposit order/capture support, automatic deposit-paid updates, booking confirmation linking, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard and local service/town wording rules remain required on every pass.

> Build 182 documentation sync (2026-05-26): Added quote-deposit webhook event history, verified-event replay controls, customer receipt email queueing, manual/provider refund and partial-refund tracking, `/admin-payments.html`, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard, local service/town wording, fallback-safe APIs, and Markdown/schema synchronization remain required on every pass.

## Build 182 updated gaps

- Direct refund initiation through Stripe/PayPal APIs is not yet implemented; Build 182 records provider refund webhooks and manual refund records.
- Receipt and refund emails are queued, but final delivery still depends on `notification_events` provider dispatch being configured and running.
- Replay is intentionally conservative: unverified and failed webhook rows are visible but not blindly replayed.
- Payment reconciliation exports should be added next so deposits, refunds, and quote/payment request status can be reviewed with accounting close.

---

## Build 183 documentation sync — direct refunds, reconciliation export, webhook warnings, and image requirements

Build 183 adds direct Stripe/PayPal refund initiation from Admin Payments, a payment reconciliation CSV export, dashboard/payment-page warnings for failed or unverified webhook events, and a cleared/rebuilt `IMAGES.md` with missing image/video requirements and upload methods. This build is no-DDL and depends on the Build 180–182 payment tables. SEO/H1, local service/town wording, fallback-safe APIs, schema tracking, and Markdown synchronization remain required on every pass.

### Build 183 updated gaps

- Direct refund initiation exists for Stripe/PayPal, but provider webhook follow-up and pending-refund status polling still need a stronger reconciliation loop.
- Payment reconciliation export is CSV-ready, but accountant packaging and tax allocation exports are still separate outstanding accounting work.
- `IMAGES.md` now identifies missing media, but the actual real photos/videos still need to be uploaded and reviewed.
- R2 image health still needs a server-side checker so missing public URLs can be detected automatically instead of manually reviewed.


## Build 185 — Next 20 completed foundations

1. Added real image dimension validation to Media Health for PNG/JPEG/WebP files.
2. Added admin R2 upload endpoint with size validation and safe allowed folders.
3. Added DB-backed media task workflow with JSON fallback.
4. Added `public.media_asset_tasks` SQL foundation.
5. Added refund retry scan endpoint for pending/failed provider refunds.
6. Added payment variance warning summary.
7. Added processor-fee capture endpoint and Admin Payments fee field.
8. Added HST/GST review screen and tax summary endpoint.
9. Added receipt retry queue endpoint.
10. Added customer receipt HTML/download endpoint.
11. Added final-balance payment request tables and APIs.
12. Added payment application tables and APIs for deposits/invoices/refunds.
13. Added month-end close checklist table/API/screen.
14. Added dashboard warnings for missing media, undersized media, payment variances, and receipt retries.
15. Added Search Console/local SEO task card table/APIs/screen.
16. Added consolidated full accountant export endpoint.
17. Added processor-fee fields to `quote_deposit_payment_requests`.
18. Added `data/image_requirements_build185.json` for scan/task fallback.
19. Rebuilt `IMAGES.md` with exact upload keys, sizes, requirements, and methods.
20. Added Build 185 release guard and schema/docs synchronization.

## Next 20 recommended steps after Build 185

1. Deploy Build 185.
2. Apply `sql/2026-06-02_build185_next_twenty_ops_foundations.sql`.
3. Configure the Cloudflare Pages R2 bucket binding for admin uploads.
4. Upload the 12 missing add-on images listed in `IMAGES.md`.
5. Replace the eight regional placeholder hero images with Rosie-owned photos.
6. Test `/admin-media-health.html` upload, scan, and task creation.
7. Add R2 signed/direct browser upload support for larger video files.
8. Add media approval status transitions: assigned → uploaded → reviewed → approved_public.
9. Add automatic image alt-text suggestions from the media task label/category/town.
10. Add a public-page missing-media warning badge beside affected page links.
11. Test processor-fee capture on real Stripe and PayPal sandbox transactions.
12. Add automatic processor-fee import from Stripe balance transactions and PayPal captures.
13. Test `/admin-tax-review.html` and confirm HST assumptions with the accountant.
14. Test `/admin-close.html` for a month-end payment close dry run.
15. Add final-balance payment checkout links for Stripe and PayPal.
16. Add customer-facing final invoice/receipt PDF generation.
17. Add payment application posting into journal candidates.
18. Add variance approvals so resolved warnings stop showing on the dashboard.
19. Add Search Console API import for query/page data if credentials are configured.
20. Build the full accountant package zip with separate CSVs, PDF receipts, close checklist, HST summary, and journal candidates.

---

## Build 186 - verified water restrictions and next-20 planning sync (2026-06-02)

Build 186 corrected the service-area water-use guidance after source verification. Oxford County / Tillsonburg now uses the May 1-September 30 rule under Oxford County By-law No. 4193-2002: outdoor water use by hose or attachment, including vehicle washing and power washing, follows address parity, with residential hours of 6:00-9:00 a.m. or 6:00-9:00 p.m. and commercial/industrial hours of 8:00-10:00 a.m. or 3:00-5:00 p.m. Norfolk County now uses the May 15-September 15 Water Restriction By-law rule: 9:00-11:00 a.m. and 7:00-10:00 p.m., with odd/even house-number days and the first-24-hours sod exemption note.

Updated runtime/content areas: `data/service_area_rules.json`, `data/water_restriction_rules_build186.json`, booking fallbacks, Admin App service-area defaults, landing page content, `functions/api/water_restrictions_public.js`, `functions/api/admin/water_restrictions_audit.js`, and the Build 186 release guard.

Completed next-20 items for this pass:
1. Verified Tillsonburg/Oxford County water restrictions from the official Tillsonburg and Oxford pages.
2. Verified Norfolk County watering restrictions from the official Norfolk County page.
3. Corrected all Oxford County service-area rows in `data/service_area_rules.json`.
4. Corrected all Norfolk County service-area rows in `data/service_area_rules.json`.
5. Added the Tillsonburg water-restriction page as an official source for Tillsonburg rows.
6. Added `data/water_restriction_rules_build186.json` as a compact verified rule source.
7. Corrected booking fallback water rules in `book.html`.
8. Synced the `/book/` mirror.
9. Corrected Admin App default service-area water rules in `admin-app.html`.
10. Synced the `/admin-app/` mirror.
11. Corrected water wording in root landing-page public content.
12. Corrected water wording in the Functions landing-page public content copy.
13. Added `/api/water_restrictions_public` as a public safe fallback endpoint.
14. Added `/api/admin/water_restrictions_audit` as a staff DB audit endpoint.
15. Added a no-DDL SQL note for Build 186.
16. Updated `SUPABASE_SCHEMA.sql` with the Build 186 schema/data note.
17. Updated `DATABASE_STRUCTURE_CURRENT.md` with the water-rule data dependency note.
18. Updated `COMPETETIVE_COMPLETION_MATRIX.md` with water-rule accuracy progress.
19. Added `scripts/build186_verified_water_restrictions_check.py`.
20. Wired the Build 186 guard into `scripts/release_check.py`.

Next 20 steps to move toward:
1. Deploy Build 186.
2. Re-import/resave `data/service_area_rules.json` into Supabase if the `service_area_rules` table is live.
3. Test `/api/water_restrictions_public` for Oxford County and Norfolk County.
4. Test `/api/admin/water_restrictions_audit` while signed in as admin.
5. Check `/book` and confirm the selected service-area rules show the corrected wording.
6. Check `/admin-app` and confirm service-area defaults show the corrected wording.
7. Add an Admin App button to import bundled service-area rules into Supabase.
8. Add a visual warning when the DB service-area rules are older than bundled fallback rules.
9. Add a scheduled or manual source-verification checklist for municipal rule pages.
10. Add a public FAQ item explaining water-use timing for mobile detailing.
11. Add booking-time validation that reminds staff when a requested appointment conflicts with local water-use windows.
12. Add a customer-facing note that Rosie Dazzlers can bring water/power when needed, but municipal rules still need checking.
13. Add per-town temporary notice overrides for drought/emergency restrictions.
14. Add a service-area rule version field in Supabase.
15. Add admin change history for service-area rule edits.
16. Add local SEO copy snippets that mention the accurate county rules without over-promising availability.
17. Add a quick “Can we do exterior work at this time?” helper for staff dispatch.
18. Continue payment/tax work from Build 185: processor-fee imports and HST/GST review.
19. Continue media work from Build 185: R2 direct uploads, media approval transitions, and missing-media warnings.
20. Continue accountant export work: HST summary, journal candidates, receipts, and close checklist packaging.


## Build 187 Sync — Verified Local Page Water Rules (2026-06-03)

- Reverified Oxford/Tillsonburg, Woodstock/Oxford, and Norfolk water-use restrictions from official public sources.
- Corrected the static town landing-page shell so `/tillsonburg-auto-detailing/` and every other local page shows the water-use note even before client-side rendering.
- Added server-side landing-page enforcement so stale Admin App/DB landing-page rows cannot hide the corrected water-rule note.
- Added `data/water_restriction_rules_build187.json`, updated service-area/local SEO data, and added a no-DDL SQL note.
- Added a Build 187 release guard to check every local page for the correct Oxford/Norfolk water-rule language.


## Build 187 Completed Next 20

1. Reverified Tillsonburg/Oxford water restrictions from the official Town of Tillsonburg page.
2. Reverified Oxford County water-conservation communities and hours from the official Oxford County page.
3. Reverified City of Woodstock outdoor water-use wording from the official Woodstock page.
4. Reverified Norfolk County watering restrictions from the official Norfolk County page.
5. Added `data/water_restriction_rules_build187.json`.
6. Synced `data/water_restriction_rules_build186.json` so older fallback references are not stale.
7. Added Zorra Township to `data/service_area_rules.json` with the verified Oxford County water rule.
8. Added verified water-rule summaries to `data/local_seo_targets.json`.
9. Added static visible water-rule sections to all eight local town landing pages.
10. Updated `/tillsonburg-auto-detailing/` so the corrected Tillsonburg/Oxford rule is visible without waiting for JavaScript.
11. Updated `/woodstock-ingersoll-auto-detailing/` with Woodstock/Oxford verified rule wording.
12. Updated `/norwich-otterville-auto-detailing/` with Oxford verified rule wording.
13. Updated `/zorra-thamesford-embro-auto-detailing/` with Oxford verified rule wording.
14. Updated all Norfolk local pages with Norfolk May 15–September 15 odd/even and time-window wording.
15. Updated `assets/landing-page.js` to render a dedicated local water-use reminder card.
16. Updated `landing_pages_public.js` and `functions/api/landing_pages_public.js` to enforce verified local water rules over stale DB landing-page values.
17. Updated `/api/water_restrictions_public` to Build 187 fallback data.
18. Added CSS for local water-rule cards.
19. Added `sql/2026-06-03_build187_local_page_water_rules_no_ddl_note.sql`.
20. Added and wired `scripts/build187_local_page_water_rules_check.py`.


## Build 187 Next 20 To Move Toward

1. Deploy Build 187.
2. Hard refresh `/tillsonburg-auto-detailing/` and confirm the static water-use note appears.
3. Test `/api/landing_pages_public` for `tillsonburg-auto-detailing`.
4. Test `/api/water_restrictions_public?slug=tillsonburg-auto-detailing`.
5. Re-import the bundled service-area rules into Supabase if live DB rows are used.
6. Add an Admin App “sync verified service-area rules” button.
7. Add DB row version warnings when DB service-area rules are older than bundled fallback rules.
8. Add booking-time warnings when exterior work conflicts with a customer’s local water-use window.
9. Add address parity helper: even/odd address + date = “allowed/not allowed.”
10. Add staff “Can we use customer water at this time?” helper.
11. Add emergency/drought override rows by county/town.
12. Add municipal-source recheck reminders before each May water-restriction season.
13. Add Search Console/local SEO task cards for all town pages.
14. Add local proof cards to each town page once real before/after photos are uploaded.
15. Replace Wikimedia/placeholder region photos with Rosie-owned local photos.
16. Add Admin Media Health warnings beside local pages that still use placeholder photos.
17. Continue R2 signed/direct uploads for larger video files.
18. Continue processor-fee imports and HST/GST review.
19. Continue final balance invoice/payment request work.
20. Continue accountant export packaging with HST summary, journal candidates, receipts, and close checklist.

## Build 188 documentation sync — 2026-06-04

Build 188 replaces hard-coded municipal water-rule wording with a DB-first editable authority and one stable JSON fallback. The immediate `landing_pages_public.js` Worker startup crash is fixed without reintroducing mutable rule text into JavaScript. See `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json` for the broader hard-coding audit.

## Build 188 hard-coding risks and remaining gaps

- **Resolved:** mutable water-rule text no longer lives in `landing_pages_public.js`; this also removes the Worker startup crash caused by initialization order.
- **Resolved:** service-area rows no longer store duplicate `water_rule` text; they use `water_rule_key`.
- **Resolved:** pricing-catalog loaders no longer embed a giant inline mutable catalog object.
- **Remaining high risk:** large landing-page default objects are still stored in JavaScript and can drift from DB content.
- **Remaining high risk:** business identity/contact/structured-data values are still repeated in several files.
- **Remaining high risk:** policy copy and notification/document templates are still partly hard-coded.
- **Operational risk:** DB edits must be synchronized back to stable fallback files during a reviewed deployment so outages do not return stale content.
- **Deployment risk removed:** `_redirects` no longer contains the `/landing/* /landing/index.html 200` infinite-loop rule.

### Cloudflare Functions build warnings still outstanding

The Build 188 Functions bundle compiles successfully, but Wrangler still reports pre-existing wrapper warnings where some public API bridge files reference `onRequestPut`, `onRequestDelete`, or `onRequestOptions` exports that their admin route does not provide. These warnings are not the Build 187/188 startup failure, but they should be cleaned up in a future pass so real deployment warnings are easier to spot.


---

## Build 189 — Editable site settings and hard-coding reduction (2026-06-04)

This pass moves the next high-priority mutable content/configuration domains out of hard-coded JavaScript and into DB-first app-management settings with stable JSON fallbacks. Completed items:

1. Extracted large default landing-page fallback content from `functions/api/landing_pages_public.js` into `data/landing_pages_content.json`.
2. Added `functions/api/data/landing_pages_content.json` so Cloudflare Functions can import the same stable fallback.
3. Moved add-on landing-page templates out of JavaScript into the landing-page content fallback.
4. Added editable `business_profile` fallback data for identity, contact, social links, and structured-data values.
5. Added editable `site_policies` fallback data for deposit, cancellation, refund, driveway, water, power, and media privacy copy.
6. Added editable `document_templates` fallback data for notification, receipt, refund, quote, proposal, invoice, and confirmation templates.
7. Added editable `business_hours_holidays` fallback data for hours, closure days, and availability notes.
8. Added editable `navigation_footer` fallback data for top navigation and footer links.
9. Exposed dropdown/option libraries through the editable settings registry.
10. Added editable `analytics_event_registry` fallback data for analytics event keys and display labels.
11. Added stable `data/media_requirements.json` as the long-term media requirement fallback.
12. Added shared `functions/api/_lib/editable-settings.js` for DB-first / JSON-fallback setting loading.
13. Added protected `/api/admin/editable_site_settings` for staff editing.
14. Added public `/api/site_settings_public` for safe front-end consumption.
15. Added `/admin-site-settings.html` and `/admin-site-settings/` as the protected editor bridge.
16. Added Admin Menu and Admin Auth access for the new editor page.
17. Added `sql/2026-06-04_build189_editable_site_settings_foundation.sql`.
18. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md`.
19. Updated `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json`.
20. Added `scripts/build189_editable_site_settings_check.py` and wired it into `scripts/release_check.py`.

Next 20 steps after Build 189:

1. Deploy Build 189.
2. Apply `sql/2026-06-04_build189_editable_site_settings_foundation.sql`.
3. Open `/admin-site-settings.html` and verify all editable domains load.
4. Save one small test edit to `business_profile`.
5. Save one small test edit to `site_policies`.
6. Sync the full landing-page fallback payload into `app_management_settings.landing_pages_content` only after reviewing size/performance.
7. Move live landing-page editor controls from raw JSON into a structured form.
8. Render public business profile values into structured data and page footer from `/api/site_settings_public`.
9. Render editable navigation/footer links from `navigation_footer`.
10. Wire editable policies into booking, FAQ, quote, and payment pages.
11. Wire document templates into quote delivery, deposit receipts, refund notices, invoices, and final confirmations.
12. Add business-hours and holiday-closure checks to booking availability.
13. Replace scattered hard-coded dropdown values with `option_libraries`.
14. Add analytics event validation against `analytics_event_registry`.
15. Replace build-specific media requirement checks with stable `media_requirements`.
16. Add a one-click “sync bundled JSON into DB setting” control for each editable domain.
17. Add setting version history or audit events.
18. Add field-level validation for each editable setting.
19. Add a public settings cache/version badge in Admin Diagnostics.
20. Continue moving remaining large inline page/content objects into DB-managed content blocks.

## Build 190 - Editable settings live rendering and diagnostics

Build 190 continues the editable-content migration by rendering public business profile, contact details, social links, navigation/footer links, policy notes, LocalBusiness structured data, analytics labels, and media requirements from DB-first editable settings with bundled JSON fallback. It adds validation, sync-from-bundle controls, DB/fallback diagnostics, and setting history support through `/admin-site-settings.html` and the Build 190 SQL migration.

---

## Build 191 — Editable settings hardening and live-use pass

- Fixed `/admin-site-settings.html` crash by adding `AdminAuth.guardPage()` and `AdminAuth.fetchWithAuth()` compatibility helpers and by making the page initialization defensive.
- Added structured helper fields for business profile and navigation/footer settings while keeping raw JSON available.
- Added editable setting dependency map and restore-from-history API foundations.
- Wired editable policy copy into booking, FAQ, quote-response, and quote-payment customer pages with a static fallback.
- Wired editable document templates into quote/proposal delivery plus deposit receipt/refund email queue helpers.
- Added business-hours/holiday status API and booking-page helper.
- Added analytics ingest validation against the editable analytics event registry.
- Switched Media Health JSON fallback from build-specific image requirement files to stable `data/media_requirements.json`.
- Added Build 191 release guard.

## Build 192 gap update — 2026-06-05

### Resolved or reduced

- Editable settings now have structured editor helpers across all editable domains instead of only partial business/navigation helpers.
- Restore-from-history is now available directly in the Editable Site Settings UI and the Media Health media-requirements section.
- Public booking availability now receives business-hours/holiday conflict information and the booking wizard disables closed dates/slots accordingly.
- Admin booking saves now return business-hours warning details when staff create or update a booking on a closed/holiday date.
- Invoice and appointment confirmation copy now renders from editable document templates where available.
- Quote payment and booking requirement copy are now connected to editable site policies instead of being fully hard-coded.
- Admin Analytics now warns on unknown raw event names that are missing from the editable analytics registry.
- Admin Dashboard now shows fallback-backed editable setting diagnostics.

### Still open

- Structured editors still need per-field schema validation, JSON diff views, and stronger role scoping by domain.
- Admin booking warnings are returned by the API, but each admin UI that creates bookings should display those warning payloads beside the save result.
- Option-library dropdown usage has started in Admin App and still needs to be expanded everywhere options are typed manually.
- Template rendering is live for invoice/appointment confirmation payloads, but test-send controls and PDF/export packaging are still future steps.
- Business-hours conflict checks currently treat closed-day/holiday closures as blockers; exact sub-day hour windows are still future work.

---

## Build 193 gap update — 2026-06-05

### Resolved or reduced

- The reported `/api/admin/social_templates_list` 500 was traced to optional fields being lowercased before null checks. Build 193 normalizes omitted query parameters and fallback row fields safely.
- Admin Social now continues to load even if social template options are temporarily unavailable; manual drafting remains usable and the page shows a clear warning.
- Editable settings now have a bundled validation schema file and stronger required-path checks before saves.
- Navigation/footer link issues and unknown document-template tokens now appear as warnings before save.
- The structured document-template editor now includes an inline token reference so invoice, confirmation, receipt, refund, quote, and proposal copy can be edited more safely.

### Still open

- Validation is now stronger, but it is still lightweight. It does not yet provide a visual JSON diff or a full JSON Schema implementation.
- Force-sync exists, but staff should only use it after reviewing DB-versus-fallback differences because it intentionally replaces the DB-backed value.
- Admin Analytics can warn about unknown events, but it still needs one-click registry insertion.
- Template rendering is available, but test-send controls and invoice PDF/export packaging are still future work.
- Business-hours checks still focus on closed-day/holiday conflicts; exact partial-day scheduling windows remain a future enhancement.

---

## Build 194 gap update — 2026-06-06

### Resolved or reduced

- Editable Site Settings now has a compare button so staff can review DB/editor JSON against bundled fallbacks before force-syncing.
- Editable settings now show usage previews, permission guidance, and SEO copy-length warnings in the UI.
- Admin Analytics can now add unknown event names to the editable analytics registry directly from the warning card.
- Option-library dropdown hydration has expanded beyond Admin App into Booking, Catalog, and Leads screens.
- The route copy for `/admin-site-settings/` has been brought back into parity with `/admin-site-settings.html`.
- Admin App option-library loading now understands the current public settings API response shape.

### Still open

- Diffing is current-versus-fallback first; side-by-side selected-history visual diffing is still future work.
- Permission guidance is visible in the UI, but dedicated per-domain save enforcement still needs a richer staff capability model.
- Template test-send controls and invoice PDF/export packaging remain future steps.
- Business-hours conflict handling still focuses on closed-day/holiday warnings, not exact sub-day windows.
- Option-library dropdown hydration still needs to be expanded into every remaining manually typed admin screen.

---

## Build 195 gap update — 2026-06-06

### Resolved or reduced

- Editable-setting validation now returns field-level results and the editor can display schema markers instead of only plain text errors.
- Restore-from-history workflows now have selected-history diffs so staff can compare a saved row against the current editor JSON before restoring.
- Document templates now have sample preview and dry-run test-send payload controls for invoice, appointment confirmation, deposit receipt, refund notice, quote, and proposal wording.
- Navigation/footer links, sitemap/robots previews, and structured-data previews now have admin-side checks before public copy is treated as ready.
- Dashboard diagnostics now include a fallback-backed settings report and local SEO proof-gap reminders.
- Booking documents now carry a policy version stamp so customer-facing documents can identify which editable policy set was in use.
- Admin booking saves now return and attempt to log override reasons when staff keep a booking on a closed/holiday date.
- Media requirements can be diffed before restore/force-sync, reducing the risk of overwriting required image lists blindly.

### Still open

- Editable-setting save enforcement is still mostly capability-level plus guidance; per-domain role scopes remain a future staff-role-model enhancement.
- Template test-send is intentionally dry-run only until the final provider, recipient confirmation, and notification logging rules are approved.
- Invoice PDF/export packaging is still simple HTML/JSON; a true PDF generator or final export bundle remains future work.
- Business-hours protection still warns/logs rather than hard-blocking closed/holiday overrides without a reason.
- Link and sitemap checks are static previews; live route-response crawling should be added after deployment.

## Build 206 — value-added operations foundations

Completed the next high-value bundle from the sanity check list:

1. Added dedicated `/admin-gallery.html` Gallery Approvals screen.
2. Added gallery approval list/save APIs with DB-first editable-setting storage and bundled fallback.
3. Added approve, hide/private, reject, delete, and add-gallery-row controls.
4. Added customer-safe consent/status guidance on the dedicated gallery screen.
5. Added `/admin-quotes.html` Quote Pipeline dashboard foundation.
6. Added `/admin-growth.html` Value-Added Operations workbench.
7. Added a shared value-added operations report API.
8. Added sample/seed foundation for quote pipeline metrics.
9. Added sample/seed foundation for Meta ads ROI metrics.
10. Added sample/seed foundation for membership/maintenance plans.
11. Added sample/seed foundation for vehicle history events.
12. Added sample/seed foundation for proof-of-work checklists.
13. Added sample/seed foundation for fleet mini-CRM prospects.
14. Added sample/seed foundation for review request automation.
15. Added sample/seed foundation for seasonal campaign planning.
16. Added sample/seed foundation for route clustering hints.
17. Added database migration destinations so these modules can move beyond JSON-only records.
18. Added Admin Dashboard cards for Gallery Approvals, Quote Pipeline, and Value-Added Operations.
19. Synced route copies and extended route-copy automation for the new admin pages.
20. Added Build 206 release guard and updated schema/documentation notes.

### Next 20 recommended steps after Build 206

1. Connect Quote Pipeline dashboard to real quote proposal drafts and lead conversion rows.
2. Add quote follow-up reminders with overdue badges.
3. Add quote accepted/declined reason tracking.
4. Add Meta campaign create/edit/save screens instead of seed rows.
5. Add Meta campaign UTM/source attribution into lead records.
6. Convert membership interest rows into real customer plan records.
7. Add automatic next-service reminder suggestions after completed jobs.
8. Add customer-facing vehicle history timeline on `/my-account`.
9. Add detailer proof-of-work checklist completion directly inside `/detailer-jobs`.
10. Add required start/finish photo checks before job completion.
11. Add fleet account create/edit screen with vehicle roster.
12. Add fleet quote-to-contract conversion.
13. Add review request queue with preview/send controls.
14. Add Google Business Profile review-link setting.
15. Add seasonal campaign builder with hero image and service/town pairing.
16. Add campaign-to-landing-page publishing workflow.
17. Add route clustering hints inside Admin Booking calendar.
18. Add travel-time warnings between same-day bookings.
19. Add mobile bottom action bar for Book/Call/Text/Gift Card.
20. Add before/after slider visual treatment for approved Gallery rows.

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

## Build 209 known gaps and risks — live interaction (2026-06-17)

### Reduced

- Live detailing updates are no longer limited to scattered URL/note fields.
- Detailers can upload photos/videos from the job workspace and assign an explicit audience.
- Review-pending and staff-only content are separated from immediate customer content.
- Public progress responses filter internal booking-event notes/payloads.
- Private media can use protected storage paths and signed URLs.
- Customer timelines now support notes, photos, videos, refresh, comments, and sign-off.
- Documentation strategy is reduced to two active files; twenty redundant planning files are archived.

### Outstanding

- The Build 209 SQL migration must be deployed for all enhanced fields and diagnostics.
- Video limits, compression, retention, and storage-cost controls are not finished.
- New-update notifications and unread counters are not finished.
- Offline upload queue/retry behavior is not finished.
- Proof-of-work checklist requirements are not yet enforced against live media stages.
- In-job recommendation approval and price/payment change flow are not finished.
- Gallery/vehicle-history reuse of approved live media is not yet automatic.
- Browser/device testing with real R2/Supabase credentials remains required.
- Archived Markdown may still contain stale internal links; it is historical only.


## Build 210 known gaps and risks (2026-06-17)

### Reduced
- Live updates now trigger queued customer/staff notifications and unread counts.
- Mobile uploads have progress, cancel, retry, connection feedback, duration/size checks, and upload-session records.
- Arrival/during/final proof is enforced before completion.
- Recommendations, price decisions, incidents, completed summaries, media reuse, review safety, and owner attention are connected.

### Outstanding
- `sql/2026-06-17_build210_connected_live_workflow.sql` must be deployed.
- Notification events still require configured production delivery workers/providers.
- Upload retry restarts the file; true chunked/resumable transfer is not implemented.
- Browser compression/transcoding is guidance only; original evidence must not be silently changed.
- Payment-request creation is a draft handoff until a hosted payment link is generated/sent.
- Gallery candidates still require before/after pairing and consent review.
- Live Cloudflare/Supabase/R2 mobile testing remains mandatory.


---

### Build 210 documentation sync — 2026-06-17

Active strategy is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This file is retained for historical, audit, specialist, or release-check context. Build 210 connects live job interaction to proof, customer decisions, payment handoff, closeout summaries, approved-media reuse, safe review requests, and the owner attention queue.

Build 211 documentation sync: retained for historical context while the active project direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; production reliability, provider setup, hosted payment links, upload/retention diagnostics, and owner simplification were reviewed in this pass.

## Build 212 reliability risk update

The test screen reduces operator uncertainty but cannot substitute for deployment testing. Remaining high risks are real provider setup, Stripe webhook settlement, real-device upload behavior, storage cleanup policy, and production environment routing. Do not declare these areas complete until an internal test run is recorded with a Pass result in Guided Production Test Centre.

> **Build 212 documentation sync:** Active direction is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. For real-world test instructions, use `docs/PRODUCTION_TEST_GUIDE.md` and `/admin-test-centre.html`; this file is retained for historical, audit, specialist, or release-check context.

## Build 213 documentation sync

Build 213 adds owner action controls in Today Needs Attention, customer price/summary acknowledgements, secure payment-link handoff, summary revision history, and booking-scoped safe interaction audit export. Active direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; use `docs/PRODUCTION_TEST_GUIDE.md` for hands-on testing.

---

### Build 214 documentation sync — 2026-06-23

Build 214 prioritizes Supabase containment and owner-task reliability. The active security action is to run `sql/2026-06-23_build214_security_task_orchestration.sql`, refresh Supabase Security Advisor, and test the application through Cloudflare Functions rather than restoring direct browser access to tables. Canonical planning remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.

## Build 215 — asset compatibility and DAIP planning gaps (2026-06-30)

### Reduced

- The public image renderer and verifier no longer assume `.webp` is the only valid format for the same approved Rosie R2 asset name.
- Canonical Local Hero data now prefers JPG, matching the uploaded Local Hero format.
- Admin Media Health can show a resolved compatible URL rather than only reporting the stale expected URL.
- DAIP has a Rosie-specific planning boundary instead of being an unreferenced documentation folder.

### Still open / must be tested after deploy

1. **R2 exact-key confirmation:** client fallback tries compatible extensions only. It cannot correct an incorrect folder, base filename, access policy, custom-domain mapping, or letter case inside the filename. R2 object keys are case-sensitive.
2. **Cloudflare cache propagation:** verified assets can still show stale fallback until the new client code and service-worker cache version are deployed and the browser is refreshed/cleared.
3. **Media task alignment:** legacy DB task rows may retain `.webp` until `sql/2026-06-30_build215_media_asset_format_alignment.sql` is applied.
4. **Public/private separation:** only intentionally public website assets should use `assets.rosiedazzlers.ca`; incident evidence, staff-only updates, originals, and DAIP future processing artifacts must stay private.
5. **DAIP is planning only:** no DAIP table, RLS policy, worker, queue, R2 DAIP bucket, Google Drive synchronization, FFmpeg, vision/transcription model, export, or publication flow exists yet.
6. **DAIP cost and privacy risk:** background media processing can create large storage/egress/compute costs and privacy exposure. DAIP-0 decisions are mandatory before any implementation.
7. **DAIP marketing consent:** customer-visible job proof does not automatically create a marketing/public-export right.
8. **DAIP worker reliability:** Pages Functions must not be used as the long-running processing engine; a separate background-worker architecture must be selected and tested.
9. **Production verification required:** static checks cannot prove public R2 CORS/custom-domain behavior, image caching, actual dimensions, or deployed page rendering.

> **Build 207 known gaps and risks — retained historical marker:** The Build 207 documentation and visual-placeholder baseline remains preserved for historical release checks. Current risks are updated through Build 215 above.

## Build 216 — media reliability and DAIP governance gaps (2026-07-01)

### Reduced

- Public JPG Local Hero compatibility is now monitored with bounded server and browser fallback behavior rather than relying only on a single `.webp` assumption.
- Media Health now distinguishes likely wrong key, access denial, timeout, origin failure, invalid content type, and undersized image conditions.
- Repeated public-asset failures can become protected persistent alerts after the Build 216 migration and active alerts roll into Today Needs Attention.
- DAIP now has explicit decision and acceptance gates rather than only high-level architecture documents.

### Still open / must be tested

1. The Build 216 SQL migration must be applied after Build 214 RLS containment.
2. A failed scan can only prove what Cloudflare’s Function sees at that time; it cannot diagnose a browser extension, ISP cache, or unknown custom-domain routing issue by itself.
3. Client-side resolver timeouts prevent indefinite blank states but do not fix a wrong R2 folder, basename, letter case, object policy, or custom-domain mapping.
4. Public-asset alert records appear only after Media Health is run by staff; no scheduled worker/cron is installed in Build 216.
5. Email/SMS alert delivery is deliberately not enabled until controlled provider tests pass.
6. Persistent alert tables store public-asset metadata only; do not extend them with job media, private URLs, customer data, or incident content.
7. DAIP-0 decisions remain open. No DAIP Phase 1 migration, worker, R2 DAIP prefix, Drive sync, processing queue, AI model, export, or publication can begin yet.
8. DAIP processing remains a future cost/privacy risk and must stay outside the Cloudflare Pages request path.
9. Production testing is required for Cloudflare Function publish, R2 public routing, service-worker refresh, mobile upload behavior, payment settlement, and notifications.

### Build 216 synchronization — 2026-07-01

Build 216 synchronized this retained document with the active `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`: public media recovery now uses bounded JPG/JPEG/WebP/PNG health checks and protected recurring alerts after its migration; DAIP remains planning-only behind the documented decision/security gates.

## Build 217 current gaps and risks — secure final-balance release

- The SQL migration must be applied before expiry, lifecycle, and Stripe-settlement fields are available.
- Source-level checks cannot verify a live Stripe test checkout, signed webhook, Cloudflare deployment, Supabase RLS state, or provider email/SMS delivery.
- Public payment links remain sensitive bearer links; staff should use copy controls carefully, rotate a mistaken link immediately, and never place a link in public posts.
- The public payment page intentionally omits customer names, email, vehicle, notes, invoice details, and payment-card data.
- Do not mark final-balance notification delivery as successful until a controlled provider test confirms delivery.
- DAIP remains planning-only; do not let final-balance work bypass consent/provenance gates for media reuse.



## Build 218 DAIP risk update — internal test boundary

- **Current status:** DAIP test registry exists only in development/staging after the Build 218 migration. It is metadata-only and must not be called a media-processing or publishing system.
- **Non-negotiable block:** no customer media, original upload, R2 DAIP bucket, signed URL, Drive sync, worker, AI, export, gallery/customer/social handoff, or automatic publishing is in Build 218.
- **Before any next phase:** all DAIP-0 owner decisions, three Build 218 guided tests, RLS posture, consent language, cost ceiling/stop rule, storage/backup policy, retention/legal-hold policy, and worker design require evidence.
- **Privacy risk:** `internal_only_cleared` is never public approval or marketing consent. Any public/customer leak is a release blocker.
- **Cost/reliability risk:** video ingestion/processing remains unimplemented. Do not promise large-file or weak-network workflows until resumable private upload and worker recovery are separately tested.

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


## Build 229 status
Resolved: Creative Project Intelligence no longer implies that every booking must become a project. Normal customer bookings stay lightweight and operational.
Remaining: linked-project unlink/archive policy, structured materials, output generation, approval workflow and DAIP media storage remain future gated work.


## Build 230 — Creative project costs, templates, drafts and controls (2026-07-13)

Build 230 extends only the opt-in Creative Project Intelligence path. Ordinary customer bookings remain standard jobs and retain their existing inventory, service, payment and completion workflow.

Added: structured project-only material, labour and other-cost lines; optional project templates; before/after applicability; consent status and summary; story/platform/commerce/report drafts; unified batch output review; reversible booking unlink, archive and restore; and a project-to-DAIP metadata association that is denied until Gate C is accepted and technical capability is explicitly enabled. Nothing publishes automatically.

Primary workspace: `/admin-creative-projects.html`. Migration: `sql/2026-07-13_build230_project_costs_templates_outputs.sql`.

## Build 231 remaining risks

- Project inventory reservations do not yet decrement stock; they are intentionally a reviewed ledger with `inventory_mutated=false`.
- Cost-line editing currently uses a safe JSON prompt and should be replaced with dedicated accessible forms.
- Generated content plans are deterministic drafts, not published content and not external AI output.
- Consent expiry is recorded but notification delivery is not automatic yet.
- DAIP media association remains blocked until Gate C is genuinely enabled.


## Build 232 — accessible project controls and archive history (2026-07-15)

Build 232 replaces the remaining JSON prompt used to edit project material, labour and cost rows with an accessible dialog form. It adds project budget and target-margin guidance, budget variance and break-even calculations, assignable/evidence-aware shot plans, reviewed consent-reminder queue records, draft revision history, and authenticated metadata-only archive downloads. Ordinary bookings remain unchanged; inventory posting still does not mutate stock; DAIP Gate C and all media/publication controls remain held.

Migration: `sql/2026-07-15_build232_project_controls_archive_history.sql`. Workspace: `/admin-creative-projects.html`.

### Next 20 connected steps
1. Apply and test Build 232 in staging.
2. Add reservation availability checks against live inventory.
3. Define the transactional stock-posting and reversal RPC.
4. Add sales-channel revenue-source and fee lines.
5. Add budget-warning tasks to Today Needs Attention.
6. Connect approved consent reminders to the notification review queue.
7. Add shot-plan drag ordering and mobile capture evidence selection after Gate C.
8. Display draft version comparisons and restore controls.
9. Add provider-neutral AI draft adapter contracts with hard cost limits, disabled by default.
10. Add editable YouTube chapter timecodes.
11. Add clip evidence selection after Gate C.
12. Add Pinterest board administration.
13. Add Etsy taxonomy and shipping-profile lookup.
14. Add website schema validation and internal-link checks.
15. Add educational safety reviewer assignment.
16. Add CSV archive exports alongside JSON.
17. Add lessons-to-knowledge-base promotion with human approval.
18. Improve recommendation scoring with cost, audience and reusable-skill factors.
19. Add destination-readiness checks before social or commerce handoff.
20. Keep standard bookings, DAIP media and publishing approval-only.


## Build 233 — Supplier-link inventory intake
- Added a provider-neutral supplier-link preview contract, with Amazon.ca and Amazon.com enabled first.
- Staff paste a product URL, review extracted public metadata and suggested tool/consumable classification, then save through the existing authoritative inventory endpoint.
- Exact duplicate checks use normalized Amazon URL and ASIN. Imported images, prices and descriptions are drafts only and require human review.
- Import attempts are audited in `catalog_supplier_import_audit`; no browser credentials, scraping tokens or automatic purchases are introduced.
- Ordinary booking inventory, project reservation ledgers and DAIP Gate C remain unchanged.


## Build 234 — Separate Inventory Manager

Build 234 preserves the existing `admin-catalog.html` Inventory Workflow and adds `admin-inventory-manager.html` as an optional spreadsheet-style management surface. It supports row-level edits, suspicious-name review, filtering, sorting, soft archive, restore, desktop tables, and mobile cards. The authoritative save path remains `/api/admin/catalog_inventory_save`; no hard delete was added.


## Build 235 remaining gaps and risks
- The gallery migration must be deployed before seven-image values persist.
- Gallery derivative generation, role metadata, captions, alt text, consent metadata, and cross-platform crop management remain future work.
- JSON table editing is intentionally whitelisted and does not expose immutable IDs/audit timestamps for direct editing.
- Bulk updates currently save rows sequentially; a future transactional bulk RPC would improve all-or-nothing behaviour.
- Launch readiness manual confirmations are browser-local and should later be stored as shared audited production evidence.
- A high dashboard score does not replace live booking/payment/refund/email/restore testing.
- Duplicate merge remains a review workflow gap; do not hard-delete rows with operational history.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.
## Build 239 remaining gaps and risks

- The unified Startup Command Center is implemented in source but requires preview deployment and the Build 239 migration before the database catalog becomes authoritative.
- Build 237 and Build 238 migrations may still be outstanding and must be verified first.
- Real payment/refund, notification delivery, backup/restore, rollback, mobile, accessibility, Search Console, Business Profile, incident/privacy, retention, and invite-only soft-launch evidence cannot be completed by static code checks.
- Cached catalog/production/test/roadmap data is intentionally read-only; local evidence fallback must be re-saved after shared service returns.
- Approved Rosie-owned photos, complete product galleries, inventory cleanup, and local review/photo cadence remain operational work.
- Historical readiness pages and Markdown remain for redirects, emergency fallback, and release guards; they are no longer current operating surfaces.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->


## Build 242 update

- Repaired `/admin-daip-intake-dry-run` contrast and card styling.
- Replaced many SVG-only visual placeholders with reusable local raster photo-style placeholders.
- Advanced Startup Command Center cache-busting and service-worker references to Build 242.
- No new database migration was introduced in this build.

## Build 244 update

- Bundled the new AI-generated raster placeholder images directly into the application zip so the site no longer depends on missing SVG photo fallbacks for common empty-image states.
- Replaced review, add-on, catalog, booking, workflow, and admin placeholder-photo references from SVG files to real PNG/JPG files.
- Preserved instructional SVG graphics, such as framing guides and charts, where SVG is still the correct format.
- Sanity check: the remaining strongest live-readiness work is acceptance testing, content completion, operational policy confirmation, and production credential/provider validation rather than placeholder-media cleanup.

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

## Build 247 open gaps and risks

- **Cloudflare account setup remains external:** `rosie-daip-media` must be created and bound as `DAIP_MEDIA_BUCKET` before the new intake can store bytes.
- **Processing runtime is not yet implemented:** Build 247 creates processing jobs but does not execute FFmpeg/transcoding/transcription/scene analysis or final long/short video rendering.
- **Queue is optional in this build:** without `DAIP_PROCESSING_QUEUE`, DB jobs remain queued for the future processor.
- **Raw masters are intentionally private:** no direct public URL or automatic copy to `rosie-assets` exists.
- **Three historical projects need staged acceptance:** upload a harmless >300 MB test first, then import the real projects one at a time.
- **Storage/retention cost policy still needs operational acceptance:** raw masters should be preserved; proxies/derivatives can later receive a lifecycle policy.
- **Customer consent/privacy review remains mandatory before any derivative is promoted to public gallery/social use.**

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

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

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
