# Rosie Dazzlers 809 — Customer appointment changes and status experience

## Customer journey

1. Sign in to **My Account** and open **Your appointment status and next steps**.
2. Review the current booking record's date, time, and state. An unconfirmed or unknown state explicitly asks the customer to check with Rosie; the UI never invents a confirmed appointment.
3. Select **Request a change**. If the account already has a pending request for that booking, it is displayed in the history rather than allowing a second pending request.
4. Choose **Request cancellation** or **Request a different date**, provide the explanation, and read the live preview of what *will not* happen automatically.
5. Submit the request. The existing authenticated, same-origin `account_history_v742` endpoint records a private, idempotent request for staff review. The booking, availability, deposits, refunds and outbound messages remain unchanged.
6. On ambiguous network failure, check change-request history or contact Rosie before retrying. Cancellation and refund decisions remain subject to applicable terms and manual staff confirmation.

## Operator and security notes

- No database migration, new customer privileges, status writes, payment operations or Comms Hub activation.
- The backend checks the real customer session, matches the exact booking owner, rejects closed bookings, enforces same-origin POST, and retains database uniqueness for pending requests.
- The UI projections are based on the signed-in dashboard and history results only; it does not infer availability or claim a new slot is held. The history module clears protected content when history authentication/retrieval fails.
- HTML labels are escaped; no customer records are written to local storage.
- Both `/my-account` and `/my-account.html` mirror the same experience on mobile and desktop.

## Owner acceptance

- [ ] On a narrow mobile screen, inspect an active, completed and unconfirmed appointment.
- [ ] With a verified signed-in test account, make a future-date reschedule request and verify the original appointment remains intact until Rosie approves it.
- [ ] A pending request appears as **Awaiting Rosie's review** and the form does not offer the same booking for a second pending request.
- [ ] Try an invalid/past date and a no-op date/time; the form explains why submission is blocked.
- [ ] Check a cancelled booking, signed-out view, and network failure for no unintended record exposure.
- [ ] Confirm no automatic refund, charge, booking update, or outbound notification occurred.

## Automated evidence

Run `node scripts/build809_customer_booking_self_service_test.mjs` and `bash scripts/current_booking_wizard_regression.sh`. The latter keeps the existing Build 742 API/session/ownership/idempotency checks and all prior current-booking regressions.
