# Rosie Dazzlers Build 704 — Quote Follow-up Inbox and Booking Review

## Functionality

- Authenticated admin Quote Pipeline now supports an in-memory search and seven focused follow-up queues. Due/overdue follow-ups sort first; requested scope reviews and accepted-unlinked quotes are separated from already-linked and closed items.
- Staff may select Plan tomorrow 9 AM (unsaved) to prepare the local follow-up date and stage, then explicitly Save quote using the existing permission-checked endpoint. Search terms and customer data are not written to local storage or URLs.
- Unsaved changes require confirmation before replacing the editor; a malformed booking UUID is rejected instead of silently removed by the server. The saved accepted quote must have a positive accepted amount before the booking review handoff is labelled ready.
- Booking conversion remains manual in /admin-booking.html. The operator verifies date, capacity, vehicle, waiver and payment conditions, creates/locates the actual booking using existing controls, then links its real booking ID to the saved quote. No customer email, booking, payment, auto-resend or dispatch occurs through the new inbox.
- Existing Build 703 customer quote email preparation remains unchanged. Gift testing remains paused; unresolved Gift delivery safeguards remain. QL-258 six-app integration remains DISCONNECTED/HOLD, with no new secrets, signer key or connection permission.

## Verification

- node scripts/build704_quote_followup_test.mjs
- bash scripts/current_booking_wizard_regression.sh
- python3 scripts/release_hygiene_check.py
- python3 scripts/release_check.py
- python3 scripts/sync_route_copies.py --check

## Production acceptance

The feature is complete only after protected pull requests through dev and main, successful exact-SHA CI/source and Cloudflare deployment authority, and a read-only public-page asset check. Deployment GREEN is independent from QL-258 connectivity HOLD.
