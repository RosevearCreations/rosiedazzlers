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

