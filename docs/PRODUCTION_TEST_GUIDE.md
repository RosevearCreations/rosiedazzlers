# Rosie Dazzlers Production Test Guide — Build 212

**Use this guide only with an internal test booking.** Do not store passwords, API keys, card information, customer addresses, VINs, or private incident media in test notes or screenshots.

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
