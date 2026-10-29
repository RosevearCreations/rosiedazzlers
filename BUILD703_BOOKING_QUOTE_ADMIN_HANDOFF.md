# Rosie Dazzlers Build 703 — Customer booking to reviewed quote handoff

**Scope:** Customer-facing functionality, quote-first enquiry preparation and staff quote intake. No gift testing restart; no six-app connection authorization.

## What now works

1. The public `/book` page has **Request a reviewed quote first** beside the normal booking action.
2. Selecting a vehicle size, package and add-ons automatically updates a safe `/contact` link with *only* those non-private choices and whether any extras need inspection.
3. `/contact` prepares an editable email enquiry with the chosen scope and vehicle size. The customer must review and send the email in their own email app; opening the page never sends a message or reserves an appointment.
4. `/admin-quotes` now has **New website enquiry quote**. This opens an *unsaved*, explicitly `requested` quote with `website_booking_quote_email` as its source, for staff to fill from the received email and save deliberately through the existing authenticated pipeline. Email enquiries do **not** automatically create quote/lead records.
5. The canonical root and folder-index routes for `/book` and `/contact` are now protected by the repository route-copy synchronization check, preventing inconsistent versions after deployment.

## Owner/staff walkthrough

1. Customer opens `/book`, chooses size/package/extras and clicks **Request a reviewed quote first**.
2. Customer reviews the prepared enquiry on `/contact`, adds vehicle condition and town, then explicitly opens and sends the draft email to `info@rosiedazzlers.ca`.
3. Staff receives that email, signs in to `/admin-quotes`, clicks **New website enquiry quote**, enters actual customer/scope and review notes, and saves only when appropriate.
4. Staff separately follows the existing quote and booking workflow. A quoted amount does not reserve a date or automatically collect payment.

## Safety and verification

- No name, address, email, photo, gift code, date/slot, account token, or price is copied into the handoff URL.
- The contact stage is browser-only; no new public write endpoint, database table or credential is added.
- The staff button opens an unsaved editor only; existing authenticated backend save authorization is unchanged.
- Existing gift HOLD/no-resend controls remain unchanged and discretionary Gift testing stays paused per Build 702.
- QL-257 signer and independent custody remain unverified; integration `DISCONNECTED / HELD`; no gateway requests are performed.

Tests: `node scripts/build703_quote_handoff_test.mjs`, `python3 scripts/release_check.py`, and the current booking regression scripts.

**Next functional priority:** Make quote follow-up easier and improve customer communication about confirmed availability, without charging for unreviewed extras.
