# Build 236 Block Calendar production acceptance

1. Load `/admin-blocks.html` and confirm the schedule API indicator becomes ready.
2. Select a future date and block the full date.
3. Open the public booking flow in a private window and confirm the date is unavailable.
4. Unblock the date and confirm availability returns.
5. Block AM only and verify PM remains available.
6. Remove AM, block PM, and verify AM remains available.
7. Test Previous, Today, Next, Reload, keyboard focus, and a narrow mobile viewport.
8. Confirm the admin dashboard's schedule counts match the Block Calendar lists.

Do not mark the schedule preflight complete from a static code check alone; retain screenshots or notes from the deployed test.

---


# Build 225 — Social & analytics Connections Centre test (staging only)

## Before beginning

- Use the staging/development Cloudflare Pages project, not the production project.
- Use an administrator account and `/admin-integrations.html`.
- Use one provider at a time; recommended first provider is GA4.
- Do not use a real customer booking, customer email, progress link, payment, quote, vehicle, VIN, address, or media.
- Do not paste any Cloudflare Secret, pixel/tag ID, OAuth token, or provider screenshot containing values into a test note.

## 1. Configuration visibility and secret boundary

1. Add only these staging Secrets:
   - `MARKETING_TRACKING_ENABLED=true`
   - `MARKETING_TRACKING_MODE=test`
   - `MARKETING_TRACKING_CONSENT_VERSION=1`
   - one provider ID, such as `GA4_MEASUREMENT_ID=G-...`
2. Redeploy Pages.
3. Sign in to `/admin-integrations.html`.
4. Confirm the page shows **Configured** for GA4, but does not display the Measurement ID.
5. Confirm no browser form accepts a credential.
6. Confirm the DAIP panel states that Gate C is held and that no DAIP connection is created.

**Pass:** status is visible without the actual value; no secret or DAIP capability appears.  
**Fail/Blocked:** a value, token, password, provider account number, customer information, or DAIP technical control is shown.

## 2. Consent before a marketing tag loads

1. Use a private/incognito browser window.
2. Visit a public marketing page such as `/`, `/services`, `/pricing`, `/gallery`, or `/contact`.
3. Before touching the banner, confirm only the normal website loads. Use the browser’s developer tools only if you already know how; never screenshot/copy sensitive request data.
4. Confirm the optional-measurement banner offers **Allow optional measurement** and **Use essential site only**.
5. Choose **Use essential site only** and confirm the public site remains usable.
6. Open another private window, visit the same type of public page, and choose **Allow optional measurement**.
7. Verify the provider with its own official test/diagnostic tool, such as GA4 DebugView/Tag Assistant.
8. Confirm the module did not run on `/book`, `/login`, `/progress`, `/final-balance-payment`, `/client`, `/detailer-jobs`, or `/admin`.

**Pass:** no configured third-party tag starts until optional measurement is selected; protected routes remain excluded.  
**Fail/Blocked:** the tag loads before consent, a protected route loads it, a booking/payment/customer detail is sent, or the public site breaks after a decline.

## 3. Rollback

1. In staging, set `MARKETING_TRACKING_ENABLED=false`.
2. Redeploy.
3. Open a new private browser session on a public marketing page.
4. Confirm no optional-measurement banner appears and `/admin-integrations.html` says the tracking switch is off.
5. Confirm the public website continues working.

**Pass:** tag configuration has a reversible, non-disruptive off switch.

## 4. DAIP external-service boundary

1. Open `/admin-integrations.html` and review the DAIP boundary panel.
2. Confirm social/analytics values are reported only as configured/missing.
3. Confirm there is no bucket name, storage path, upload/download control, signed link, worker, AI, customer-media route, Gallery handoff, social export, or public publishing action.
4. Record the `daip_external_service_boundary` test as Pass only when all checks are true.

**Pass:** external service configuration stays separate from DAIP Gate C technical implementation.


# Rosie Dazzlers Production Test Guide — Build 217

**Use this guide only with an internal test booking.** Do not store passwords, API keys, card information, customer addresses, VINs, or private incident media in test notes or screenshots.



## Build 224 staging checks

1. Apply `sql/2026-07-06_build224_customer_preference_history_duplicate_review.sql` and `sql/2026-07-06_build224_daip_gate_c_technical_review_rollback.sql` after the prior Build 220 and DAIP migrations.
2. Open `/admin-daip-gate-c.html` as an administrator. Confirm a stale/missing Build 223 blueprint blocks acceptance, save a harmless Draft/Blocked record, and confirm Gate C remains Held with zero technical/public capabilities.
3. Use only safe general text; do not enter customer, booking, media, storage, URL, account, key, token, or external-service details.
4. In `/admin-customers.html`, make a manager-approved notification/live-update change and confirm safe history appears; use matching contact details only in controlled test profiles and confirm it warns but does not merge.
5. Complete the Build 224 Guided Production Test Centre cases.

## Where to test

1. Sign into the staff/admin account.
2. Open `/admin-test-centre.html`.
3. Work through the tests in order.
4. For each test, select **Passed**, **Blocked**, or **Failed** and save the result.
5. When a test fails, record the test booking ID, device/browser, approximate time, and visible error message. Do not include secrets or customer-private content.

## The safe test booking

Create one internal booking labelled clearly, for example **INTERNAL TEST — DO NOT CONTACT**. Use a staff-controlled email address and harmless placeholder images/videos. Do not reuse a real customer record.

## Tests to complete

### 1. Environment preflight

Open `/admin-production.html`, press **Refresh report**, and confirm the page loads. Required configuration that is not ready should be visible as **needs setup**, not as a silent failure. Save the result in Guided Production Test Centre.

### 2. Notification provider

Open `/admin-production.html#notifications`. Select **Email**, press **Check config only**, then use **Send test** only to an internal mailbox. Check inbox and spam/junk. If it does not arrive, record whether the app showed a configuration error, provider error, or sent result with no message received.

### 3. Stripe final balance in test mode

Use a small internal draft balance request. On `/admin-production.html#payments`, paste/select the request ID and press **Create hosted checkout**. Open the returned URL in a new tab. Verify the test amount and branding. Do not use a real card or live mode in the first test. The test is not fully complete until webhook settlement is also verified later.

### 4. Live update privacy

On `/detailer-jobs.html`, create three harmless updates:

- **Customer now:** `TEST CUSTOMER VISIBLE`
- **Admin review first:** `TEST REVIEW PENDING`
- **Staff only:** `TEST PRIVATE NOTE`

Open the test customer progress link in a signed-out/private browser. The customer must see only the customer-visible item. Approve the review-pending item in `/admin-progress.html`, then refresh the customer page. The staff-only item must never appear. Treat any private-content leak as an urgent blocker.

### 5. Mobile upload recovery

Use a phone with Wi-Fi and cellular. Upload a small test photo from `/detailer-jobs.html`, then start a small test video and briefly switch network/disable Wi-Fi. Confirm progress, failure/retry/cancel messaging, recovery state, and `/admin-production.html#uploads` diagnostics. Do not interrupt a real customer upload.

### 6. Proof completion

On the test booking, try to complete before arrival/during/final media exists. Confirm the app lists missing proof. Add harmless test media for all three stages, then complete. An override should require an explicit reason.

### 7. Issue, incident, and review safety

Post a staff-only harmless `TEST ISSUE`, convert it into an incident report, and confirm the new incident is private in `/admin-incident-reports.html`. Confirm the review queue remains blocked while unresolved. Never publish a test incident customer-facing.

### 8. Retention dry run

On `/admin-production.html#retention`, press **Run dry-run**. Permanent proof and legal-hold content must not be listed. Do not mark/archive any row until you have confirmed it is test/eligible content.

### 9. End-to-end smoke test

With the internal booking only, test the lifecycle: quote/booking → live customer update → arrival/during/final proof → priced recommendation → customer decision → test payment URL → completed-job summary → Gallery candidate → review safety → Today Needs Attention clear. Record the first broken handoff rather than continuing past it.

## What counts as production-ready

Do not call the system production-ready when any of the following are true:

- customer-visible privacy test failed;
- notification provider cannot send an internal test;
- payment link is live/unverified or webhook reconciliation is untested;
- proof can be bypassed without a recorded authorized reason;
- weak-network upload loses media silently;
- protected evidence is included in retention actions;
- unresolved incident does not block review requests.

## After testing

Open `/admin-today.html` and `/admin-production.html`. Resolve the urgent and high issues before testing real jobs. Update `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md` only with confirmed test results—not assumptions.

## Build 213 owner-action and customer-trust tests

### 10. Today Needs Attention owner actions

1. Open `/admin-today.html` as an administrator.
2. Use an internal-test task only; do not resolve an active customer issue for this test.
3. Press **Assign me**, refresh the page, and confirm the task records your name.
4. Press **Snooze 1 day**, refresh, and confirm the row is hidden until its snooze time.
5. Repeat with a second safe row and press **Resolve**. Enter only a harmless internal note.
6. Open `/admin-test-centre.html` and record the result.

Expected: the action is retained after refresh. If the page says the task table is missing, run `sql/2026-06-22_build213_owner_action_customer_trust.sql`.

### 11. Priced recommendation acknowledgement and payment link

1. Create an internal test booking and post a customer-visible recommendation with a small test price.
2. Open the secure progress token in a private/incognito browser.
3. Press **Approve**. Confirm the page asks for a typed name and acknowledgement before saving.
4. Enter an internal test name, check the acknowledgement control, then approve.
5. If Stripe test keys are configured, confirm a payment-link card appears; otherwise confirm the app reports a draft request without claiming payment is complete.
6. Verify that same link is not shown by a different booking token.

Expected: no priced recommendation can be approved without an acknowledgement. Do not use a real customer or real card for this test.

### 12. Completed-job summary acknowledgement and audit export

1. Generate a customer-visible completed-job summary for the internal test booking in `/admin-progress.html`.
2. Open the matching customer token and acknowledge the summary with an internal test name.
3. Regenerate the summary in the admin view.
4. Confirm the new revision is shown and acknowledgement is reset for the revised customer summary.
5. In `/admin-progress.html`, choose **Export interaction audit**.
6. Open the downloaded CSV and confirm it includes safe timeline metadata only.

Expected: the CSV must not expose private signed URLs, R2 paths, secrets, card data, customer addresses, VINs, or private incident evidence. Any such value is a privacy blocker.



# Build 214 security and owner-task tests

## A. Supabase RLS containment

1. Deploy Build 214.
2. In Supabase SQL Editor, run `sql/2026-06-23_build214_security_task_orchestration.sql`.
3. Open **Database → Advisors → Security** and refresh the checks.
4. Open `/admin-security.html` while signed in as an administrator.
5. Expected result: `RLS disabled`, `Browser grants`, and `Risk rows` are all `0`.
6. Then use an internal booking to test `/book`, `/detailer-jobs.html`, `/admin-progress.html`, `/progress.html?token=...`, and `/admin-today.html`.
7. If a normal application route shows a permission error, copy the exact route, time, and error text. Do not add broad anonymous policies or restore table grants.

## B. Owner task due date and filters

1. Open `/admin-today.html`.
2. Create a harmless task titled `INTERNAL TEST — Security follow-up`.
3. Set urgency to High and select a due date about five minutes in the future.
4. Refresh the page.
5. Use **My assigned work**, **Unassigned**, **Overdue**, and **Due today** filters.
6. Press **Assign me**, then refresh and verify the task appears in My assigned work.
7. Use **Due date** and set it to a time in the past only for this internal test. Refresh and verify the task becomes urgent/overdue.
8. Press **Resolve**, add `Internal test resolved`, refresh, and confirm it is temporarily suppressed.

Never use customer passwords, card data, service keys, raw booking tokens, or private incident details in a manual task note.

## Build 215 — Public image rendering and DAIP planning verification (2026-06-30)

Use this test after Build 215 has deployed. It checks the public JPG/JPEG/WebP/PNG compatibility fix and records DAIP planning decisions without starting DAIP production work.

### Before testing

- Use a staff-controlled browser account for Admin Media Health.
- Use a private/incognito browser window for public-page checks.
- Do not upload or expose private incident media, customer progress media, original videos, addresses, VINs, or payment screenshots to the public assets bucket.
- Confirm Build 214 RLS containment is already applied before running the Build 215 media task migration.

### A. Apply the optional DB task alignment migration

This migration aligns the **media task records** shown in Admin Media Health. It does not upload images, convert files, or change private media.

1. In Supabase, open **SQL Editor**.
2. Click **New query**.
3. Open:

```text
sql/2026-06-30_build215_media_asset_format_alignment.sql
```

4. Copy the complete SQL file into the query editor.
5. Click **Run** once.
6. At the bottom result panel, confirm the Local Hero rows use `.jpg` keys and public `assets.rosiedazzlers.ca` URLs.
7. If Supabase reports a permission/RLS error, stop and record the exact error. Do not relax RLS or add broad browser policies.

### B. Verify the public R2 URL itself

1. Open `/admin-media-health.html` while signed in as admin.
2. Click **Run image health scan**.
3. Find a Local Hero row, such as **Tillsonburg local hero**.
4. Confirm the card says:
   - `public`;
   - a non-zero HTTP status in the successful range;
   - dimensions at least `1600 × 900`;
   - a **Resolved URL** ending in the object format that actually exists in R2.
5. Copy only the resolved public URL and open it in a private/incognito window.
6. Confirm the image itself loads without signing in.
7. Repeat for all eight Local Hero rows and the service-hub/package images we uploaded.

Expected result: a verified JPG can show as **canonical file format**. A verified same-name WebP/PNG/JPEG can show as **matched a compatible file format**. Either is acceptable. A missing/not-public result is not.

### C. Verify public service and Local Hero pages

1. In an incognito/private browser, open:

```text
/services
```

2. Refresh once using a hard refresh (`Ctrl+F5` on Windows) after deployment.
3. Confirm Service Hub/package/add-on images appear rather than a blank/default card.
4. Open the public Local Hero pages one by one:

```text
/tillsonburg-auto-detailing
/woodstock-ingersoll-auto-detailing
/simcoe-delhi-auto-detailing
/port-dover-auto-detailing
/norwich-otterville-auto-detailing
/zorra-thamesford-embro-auto-detailing
/waterford-vittoria-auto-detailing
/port-rowan-turkey-point-auto-detailing
```

5. Confirm each hero uses the intended local image and not the generic fallback visual.
6. Check the page title, main heading, town/service wording, and booking link still appear normally.

If an image fails, record exactly:

```text
Public page URL:
Expected R2 key:
Resolved URL shown by Admin Media Health:
HTTP status shown by Admin Media Health:
Browser and approximate time:
Whether the exact resolved URL loaded directly in incognito:
```

Do not rename a file repeatedly until the exact folder, filename, and letter case have been compared. R2 keys are case-sensitive.

### D. Confirm cache refresh behavior

1. On a browser that previously showed the blank fallback, close all Rosie Dazzlers tabs.
2. Reopen the site.
3. Hard-refresh the page once.
4. If the old fallback persists, open browser DevTools → **Application** → **Service Workers**, then use **Unregister** only for the Rosie Dazzlers development site.
5. Refresh and test again.

Expected result: Build 215 uses a new service-worker cache version. It should not require clearing all browser data.

### E. DAIP planning-only confirmation

1. Open:

```text
docs/digital-asset-intelligence-platform/10_Rosie_Dazzlers_Integration_Plan.md
```

2. Review the **Required decisions before the first DAIP implementation pass** section.
3. Record answers/unknowns for worker hosting, monthly cost ceiling, storage/Drive policy, consent, retention, privacy reviewer, legal holds, and internal test media.
4. Do **not** create a DAIP bucket, table, worker, queue, or public export workflow during this test.

Expected result: we have a documented decision plan, not unreviewed production DAIP infrastructure.

## Build 216 — detailed public-media recovery test

Run this test only after Build 214 security/RLS containment is confirmed and the Build 216 migration has been applied.

1. Sign in and open `/admin-media-health.html`.
2. Run **Run image health scan** once.
3. Choose one harmless deliberately missing internal/public test key. Do not use a customer photo, private job media, incident image, or any real customer name in the key.
4. Run the scan again. The first failure should be available under **Monitoring**; the second consecutive failure should appear under **Active**.
5. Copy the expected R2 key from the alert card. Upload or point the same harmless test asset to that exact public key, using a supported JPG/JPEG/WebP/PNG file.
6. Run the scan again. Confirm the health card reports a public resolved URL and the persistent alert moves to **Resolved** automatically.
7. Open the resolved URL in an incognito browser. Confirm the image loads directly.
8. Open `/services` and one Local Hero page in incognito. Confirm no blank/default image appears.
9. If any item fails, record the page URL, expected key, resolved URL, HTTP status, measured dimensions, and approximate time. Do not paste signed URLs, secrets, customer media, incident evidence, addresses, or VINs into notes.

## Build 217 — secure final-balance release test (2026-06-30)

Use Stripe **test mode** and a harmless internal booking. Do not use a real customer, card, customer name, or public payment link in screenshots.

1. Apply `sql/2026-06-30_build217_secure_final_balance_links.sql`; confirm the migration completes without restoring direct table grants.
2. In Admin Payments, create a final-balance request with a valid test booking and a small test amount. Confirm the copied link contains `request_id` and an opaque `token`, but Admin list responses do not expose `token_hash`.
3. Open the exact link in a private browser. Confirm it has one H1, says Secure payment, is not indexed, has no customer name/email/vehicle/note, and only shows amount/status.
4. Replace one character in the token. Confirm the response is unavailable and exposes no payment/customer data.
5. Set expiry to a near-future allowed time in a controlled test; after expiry confirm the page reports expired and does not show checkout. Cancel/reopen once and confirm the old link no longer works after rotation.
6. Create Stripe Checkout in test mode, complete it once, and confirm the webhook changes the request to paid. Replay the same signed event and confirm it remains paid without duplicate payment/notification effects.
7. Test Queue customer notification with a controlled mailbox. Record whether the app queued the alert separately from whether the provider actually delivered it.
8. Confirm the secure payment page is absent from the sitemap and no public analytics, screenshots, social captions, or logs include its token URL.



## Build 218 — DAIP internal-test registry release test (2026-07-02)

Build 218 is a **test-only registry**. It does not upload, store, process, display, or publish media. Run it in development/staging only after the Build 214 Security Posture/RLS check has passed.

1. Apply `sql/2026-07-02_build218_daip_test_mode_foundation.sql` once in the development/staging Supabase project. Do not apply this as a production media system.
2. Sign in as administrator and open `/admin-daip.html`. Confirm the control cards report `internal_test`, metadata-only, no storage, no worker, public blocked, and zero executable tasks.
3. Enter an opaque DAIP-only reference such as `RD-TEST-BOOKING-DEMO-01`. It is not a booking UUID and must not be linked to a customer record.
4. Create a safe job label and type `INTERNAL TEST ONLY`; check each safety acknowledgment. Confirm the app creates an `RD-TEST-YYYYMMDD-###` code.
5. Register one fictional photo metadata record and one fictional video metadata record. Do not upload a file and do not paste a URL, storage key/path, bucket name, signed link, Google Drive ID, customer name, vehicle, address, VIN, or payment information.
6. Save one `internal_only_cleared` result and one `blocked_private` result. Confirm both remain `public blocked` and `not uploaded`.
7. Open Gallery, Social Queue, and a progress route in a private browser. Confirm neither `RD-TEST` asset appears. Archive the DAIP test job and confirm no further asset can be registered.
8. Record **Pass**, **Fail**, or **Blocked** for the three Build 218 DAIP tests in `/admin-test-centre.html`. Record only the safe `RD-TEST` job code, device/browser, time, and visible error text.

Stop immediately if any DAIP item reaches a public, customer, gallery, social, storage, worker, or export path. Do not advance to a storage/worker build until every DAIP-0 decision and the promotion gates are approved.

## Build 219 — DAIP governance workspace release test (2026-07-02)

Build 219 records governance only. It does not create storage, upload media, issue a signed link, run a worker, or enable public/costly processing.

1. In development/staging, apply `sql/2026-07-02_build219_daip_governance_workspace.sql` after Build 214 and Build 218 are present.
2. Sign in as an administrator and open `/admin-daip-governance.html`.
3. Confirm the banner states that no storage, upload, worker, AI, customer route, export, or publishing capability is enabled.
4. Save one safe DAIP-0 draft. Do not enter secrets, URLs, bucket names, paths, customer details, VINs, payment data, or media.
5. Confirm a draft audit event appears and Gates C–F remain Held.
6. Review the draft with the owner(s); only then select Approved by owner and type the exact displayed approval phrase.
7. Confirm the decision shows Approved, revision number, review date, actor/time, and an approval audit event.
8. Confirm the workspace still shows `Production features: 0`.
9. Record Pass, Blocked, or Failed for **DAIP governance draft and hard-stop boundary**, **DAIP owner approval record and review date**, and **DAIP promotion-gate hold verification** in `/admin-test-centre.html`.

Stop immediately if any decision action enables a bucket, upload, URL, worker, customer/public page, Gallery/Social handoff, or publication. A governance approval is not production authorization.

## Build 220 — customer access management and DAIP readiness packet (2026-07-03)

Run this release in development/staging before any live use. Use a harmless staff-created test client and a controlled email inbox. Do not use a real client, real payment data, customer media, addresses, VINs, passwords, raw reset links/tokens, or service credentials.

### A. Apply the controlled customer-account migration

1. Back up or snapshot the staging database.
2. Apply:

```text
sql/2026-07-03_build220_customer_access_management_and_daip_readiness.sql
```

3. Confirm the migration does **not** create a DAIP bucket, upload URL, storage key/path, worker, public route, or publishing control.
4. In Supabase, confirm RLS remains enabled and only the server-side service role has table access for `customer_admin_audit_events`, `customer_account_recovery_requests`, `customer_auth_sessions`, and `customer_auth_tokens`.

### B. Customer profile and role boundary

1. Sign in as an administrator or booking manager and open `/admin-customers.html`.
2. Create one harmless internal client profile. Confirm the page says email is the sign-in identifier and no separate username exists.
3. Update a safe operational field such as city, phone, or detailer-visible note; refresh and confirm it remains.
4. Sign in as a detailer. Confirm the detailer sees only job-relevant fields, not private notes, client email edits, notification controls, reset/setup links, account-help queue, or account lifecycle controls.
5. Confirm a safe audit row appears after the profile update.

### C. Password reset and forgotten sign-in email

1. At `/login`, submit the controlled test email under **Forgot your password**.
2. Submit a deliberately non-existent email. Confirm the public response has the same generic wording and does not reveal account existence.
3. From `/admin-customers.html`, request a password reset twice. Confirm staff sees delivery status only—never a raw link or token.
4. Privately open the newest controlled test email, reset the test password, then try the same link again. It must fail as invalid/expired/used.
5. Confirm an existing client session is revoked and the new password signs in successfully.
6. Submit **Forgot which email you used?** with harmless information. Confirm a manager sees a queued request but the public form does not confirm an account exists.
7. Resolve it using only a safe note; do not write a password, reset link, token, payment detail, or customer media reference.

### D. Archive rather than permanent deletion

1. As administrator, choose the harmless internal test client.
2. Select **Archive client account**, enter a short safe reason, and type `ARCHIVE CLIENT` exactly.
3. Confirm sign-in is blocked, active sessions are revoked, and the directory can filter the profile under **Archived only**.
4. Confirm the audit and booking summary remain visible. Archive must preserve linked business history instead of deleting it.
5. Restore the internal test client and confirm the audit still remains.

### E. DAIP readiness packet hard stop

1. Read `docs/digital-asset-intelligence-platform/16_DAIP_Phase_1_Readiness_Packet.md` with the owner(s).
2. Confirm the twelve DAIP-0 decisions, Build 218/219 evidence, cost stop rule, consent separation, retention/legal-hold requirements, and private-MVP design questions are understood.
3. Open `/admin-daip-governance.html`; confirm Gates C–F remain **Held**.
4. Open `/admin-daip.html`; confirm it remains metadata-only, no storage, no worker, no export, and no public publishing.
5. Record the four Build 220 cases in `/admin-test-centre.html`.

Stop and mark Blocked/Failed if any password, raw reset link/token, session token, storage location, upload, signed URL, worker action, customer DAIP asset, gallery/social handoff, or public publishing route appears.

## Build 222 — DAIP Phase 1 readiness review (development/staging only)

Apply `sql/2026-07-04_build222_daip_phase1_readiness_design_review.sql` after the Build 218 and Build 219 DAIP migrations. Deploy Pages and Functions together. Sign in as an administrator, then open `/admin-daip-readiness.html`.

1. With Gate A or Gate B incomplete, confirm **Ready for written design review only** is unavailable and the server rejects a forged or stale request.
2. Save one harmless draft or paused readiness review using only general governance text.
3. After all 12 decisions and all three Build 218 tests are verified as ready in staging, save one authorization using the exact phrase displayed by the page.
4. Refresh and confirm an audit event appears, the latest readiness record contains no sensitive details, and the technical/public feature counters remain zero.
5. Open `/admin-daip-governance.html` and `/admin-daip.html`; confirm Gate C stays Held and no upload, storage, signed-link, worker, customer-media, export, or publication control appears.
6. Record the three Build 222 Guided Production Test Centre cases. Do not use production customer media.



## Build 223 — DAIP private-MVP design blueprint (development/staging only)

Apply `sql/2026-07-05_build223_daip_private_mvp_design_blueprint.sql` after Builds 218, 219, and 222. Deploy Pages and Functions together, sign in as an administrator, then open `/admin-daip-design.html`.

1. With a missing or stale Build 222 authorization, attempt **Submit for independent review only** and confirm the server rejects it.
2. Save one harmless Draft or Paused blueprint with general design text only.
3. Only when Build 222 authorization is Current, complete all blueprint sections, three acknowledgements, and the exact phrase displayed by the page.
4. Refresh and confirm the audit entry appears while Gate C remains **Held** and technical/public capability counts remain zero.
5. Open `/admin-daip-governance.html` and `/admin-daip.html`; confirm no storage, upload, signed-link, queue, worker, processing, customer-media, export, or publishing control exists.
6. Record the three Build 223 Guided Production Test Centre cases. Never use real customer media or production configuration.


## Build 226 DAIP intake dry run
Apply the Build 226 migration in staging. Run one valid and one intentionally rejected fictional manifest at `/admin-daip-intake-dry-run.html`. Confirm zero media bytes, storage authorizations, worker executions, and public destinations.


## Build 227 staging tests
1. Apply `sql/2026-07-09_build227_roadmap_execution_daip_policy.sql`.
2. Open `/admin-roadmap-execution.html` as an administrator.
3. Change one item from planned to in progress, assign an owner, and add a harmless evidence note.
4. Refresh and confirm the values persist.
5. Change DAIP warning/hard-stop planning values and confirm hard stop cannot be lower than warning.
6. Open `/admin-daip-intake-dry-run.html` and confirm its validation uses the saved policy.
7. Confirm Gate C remains held and there is no file selector, upload, object path, worker, AI, customer media, or public destination.


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


## Build 229 — standard job/project choice
1. Create or select a harmless staging booking.
2. Confirm the Job documentation mode panel says **Standard job**.
3. Complete ordinary status, assignment and finance actions without creating a project.
4. Explicitly choose **Create creative project from this booking** and confirm the warning.
5. Confirm one linked project is created with all outputs unpublished.
6. Refresh and confirm a second project cannot be created for the same booking.
7. Confirm the booking remains usable through its ordinary progress, payment and completion workflow.
8. Confirm mobile controls stack without overlap.


## Build 230 — Creative project costs, templates, drafts and controls (2026-07-13)

Build 230 extends only the opt-in Creative Project Intelligence path. Ordinary customer bookings remain standard jobs and retain their existing inventory, service, payment and completion workflow.

Added: structured project-only material, labour and other-cost lines; optional project templates; before/after applicability; consent status and summary; story/platform/commerce/report drafts; unified batch output review; reversible booking unlink, archive and restore; and a project-to-DAIP metadata association that is denied until Gate C is accepted and technical capability is explicitly enabled. Nothing publishes automatically.

Primary workspace: `/admin-creative-projects.html`. Migration: `sql/2026-07-13_build230_project_costs_templates_outputs.sql`.

## Build 231 staging tests

1. Apply the Build 231 migration.
2. Edit, soft-delete and restore one material, labour and cost line.
3. Confirm deleted lines are excluded from project totals.
4. Save expected/actual revenue and verify profit/margin.
5. Test therapeutic and non-commercial classifications.
6. Save a draft, reviewed and posted inventory reservation; verify `inventory_mutated` remains false and ordinary stock is unchanged.
7. Confirm linked booking comparison is read-only.
8. Save a project template and re-open the project.
9. Record a consent expiry date and reminder interval.
10. Add before, during and after shot-plan items.
11. Approve one session for story use and generate content plans.
12. Confirm drafts include planning metadata but nothing publishes.
13. Save and approve a lesson and score a future recommendation.
14. Prepare an archive manifest and confirm it contains no media bytes or public destination.
15. Confirm DAIP association remains blocked unless Gate C is genuinely enabled.

## Build 232 staging tests
1. Edit material, labour and cost rows using the dialog; confirm no JSON prompt appears.
2. Save budget and target margin; verify variance, break-even and target revenue.
3. Add shot owner, order and evidence note.
4. Queue a consent reminder and verify no customer message is sent.
5. Save a draft twice and verify a version-history row exists.
6. Prepare and download a JSON archive; confirm media/public destinations are absent.
7. Confirm standard bookings and inventory quantities do not change.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

Build 210 documentation sync
Build 211 documentation sync
Build 212 documentation sync
Build 213 documentation sync
Build 214 documentation sync
<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

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
