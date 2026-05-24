# Build 168 internal next steps

1. Apply `sql/2026-05-23_build167_competetive_matrix_leads_upload_schema.sql`.
2. Apply `sql/2026-05-23_build168_admin_leads_photo_review.sql`.
3. Test `/admin-leads.html` with one fleet lead and one maintenance lead.
4. Add lead-to-quote/booking conversion action.
5. Add quote-builder from photo estimates, condition flags, package recommendations, and add-ons.
6. Continue local SEO, CSS drift, one-H1, Cloudflare import, and fallback checks every pass.

---

# Next Steps Internal — Build 153

**Updated:** 2026-05-18

1. Deploy Build 153 and confirm Cloudflare Pages Functions compile without the prior `media_library_list.js` regex error.
2. Apply Build 150 and Build 151 SQL migrations in Supabase dev.
3. Smoke-test `/api/admin/media_library_list?usage_context=inventory_item`.
4. Seed `app_media_library` from current R2 products/tools folders.
5. Add direct Admin Catalog upload-to-R2 workflow.
6. Add picker metadata editing: alt, caption, source, consent, preferred-public-image.
7. Add **Repair all fallback-matched images** with review before write.
8. Add server-side image health report for scheduled broken-image monitoring.
9. Add intentional duplicate-image approval/ignore controls.
10. Connect media rows to service/town/review/before-after proof tags.
11. Move before/after gallery to admin-managed DB content.
12. Add receipt/bill upload to inventory purchases and accounting entries.
13. Connect booking closeout consumable usage to COGS/accounting posting.
14. Add inventory stock-count sessions and variance approvals.
15. Add month-end inventory valuation lock/reopen controls.
16. Share vendor data between Admin Catalog and Accounting.
17. Add Search Console and Google Business Profile reporting once credentials are ready.
18. Replace remaining placeholder/external landing photos with Rosie-owned R2 images.
19. Expand admin fallback banners for DB/app-setting/JSON source clarity.
20. Add mobile detailer closeout tools for media, sign-off, consumables, and notes.
21. Continue release checks for one H1, title/meta clarity, structured data, CSS drift, and redirects.

<!-- Build 153 sync 2026-05-18 -->

## Build 153 immediate next steps

1. Upload/deploy Build 153.
2. Confirm Cloudflare Pages Functions compile past the previous unresolved `_lib` import errors.
3. If clean, continue with media-library seeding and Admin Media Library editing.
4. If not clean, paste the next deploy log before making feature changes.

## Build 156 completed work - social progress publishing foundation

1. Added a reviewable social queue for job progress photos and summaries.
2. Added Admin Progress controls to create social drafts after posting updates.
3. Added Admin Progress controls to create social drafts after attaching job media.
4. Added per-platform draft selection for Facebook, Instagram, X, TikTok, and Google Business Profile.
5. Added default local hashtags for Rosie Dazzlers job proof posts.
6. Added Admin Social Queue page for reviewing drafts.
7. Added manual social draft creation for content not tied to a booking.
8. Added social post status workflow: draft, ready, posted, failed, skipped.
9. Added optional webhook dispatch action for future automation bridge tools.
10. Added platform readiness display without exposing credentials.
11. Added `social_post_queue` schema for staged publishing.
12. Added `social_channels` schema for platform/channel setup.
13. Added `social_dispatch_attempts` schema for audit history.
14. Added booking event logging when drafts are created from job progress.
15. Added social draft loading into Admin Progress for the current booking.
16. Fixed missing `resolveBookingIdByToken` runtime helper in progress update routes.
17. Hardened progress media posting with consistent CORS and auth fallback handling.
18. Added social workflow release checks.
19. Added Cloudflare Pages Functions static/import checks for this pass.
20. Re-checked one-H1-per-page behavior after adding Admin Social Queue.


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


## Build 159 sync — social queue usability and release discipline

- Added caption/hashtag DB picker support for Admin Social Queue.
- Added planned publish time for manual drafts and schedule filtering.
- Added duplicate draft warnings using `duplicate_signature`.
- Added manual posted URL and platform post ID capture.
- Added `social_post_metrics_snapshots` schema support for future reporting.
- Release checks now require the Build 159 social template/schedule markers.

---

## Build 161 sync note

Build 161 keeps `DEVELOPMENT_ROADMAP.md` as the source of truth and advances the competitor-aligned conversion path with Booking service chooser guidance, package aliases, and photo-estimate CTAs.

## Build 169 immediate next steps

1. Deploy Build 169.
2. Confirm Cloudflare Pages variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and preferred session secrets.
3. Confirm Supabase tables: `staff_users`, `staff_auth_sessions`, `customer_profiles`, `customer_auth_sessions`, `site_activity_events`.
4. If login returns a bcrypt warning, re-bootstrap the admin password using `hash_mode='sha256'` or add `bcryptjs` bundling.
5. Resume Admin Leads lead-to-quote conversion once login is stable.

## Build 170 immediate next steps

1. Deploy Build 170.
2. Open `/login`, `/book`, and `/my-account` signed out and confirm `/api/client/dashboard` does not report a 401 failed resource.
3. Sign in as a test customer and confirm `/api/client/dashboard` returns `ok:true`.
4. If signed-in dashboard still returns `not_authenticated`, inspect `CUSTOMER_SESSION_SECRET`, `customer_auth_sessions`, and cookie creation from `/api/client/auth_login`.
5. Resume Admin Leads lead-to-draft-quote conversion once customer session flow is quiet.
