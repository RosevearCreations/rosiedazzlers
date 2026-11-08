# Rosie Dazzlers Build 807 — Customer History, Rebooking and Staff Follow-Up

## Customer experience

In **My Account**, signed-in customers can filter their recent completed-service snapshot (up to 12 source-backed services) by text, year, service and currently bookable status. Each valid completed service shows its original date/area, seasonal discussion guidance and a clear indication whether the **current** pricing catalog still offers the same service. Safe repeat-booking links retain the original package/date only as an authenticated history-match key; the booking wizard independently revalidates history, catalog, service/vehicle choices, available date and all payment terms. Historical prices or availability never become current offers.

The existing customer-initiated interest form remains available. New filtering does not submit an interest or send a message. Incomplete dates, invalid source IDs, future-dated completion evidence, retired/unpriced packages and unavailable catalog data cannot generate a repeat-booking shortcut. A failed authenticated read clears the previous history and disables the interest/availability controls. Late availability replies are ignored after the customer changes the selected service or date.

## Staff experience

In **Admin → Notifications**, the existing role-protected, read-only customer-interest queue now shows summary counts, masked-customer search, interest-type and review-state filters, and consent-change triage. Staff may open an original booking in its established authority. The queue clearly distinguishes **needs fresh consent review** from **current preference (not send approval)**. No customer contact, reservation, pricing, revenue, subscription or status mutation is performed here.

The source API requires active staff access plus `it.notifications.view`; customer data remains masked and no private secret or service role key is exposed to the browser. The customer endpoint requires a valid customer session and enforces ownership for completed bookings. No schema migration or new Supabase grants are required. No background polling or browser-side customer-data ledger is introduced.

## Verification

```sh
node scripts/build744_customer_followup_consent_test.mjs
node scripts/build807_customer_service_experience_test.mjs
bash scripts/current_booking_wizard_regression.sh
python3 scripts/release_check.py
```

Manual acceptance (with approved test accounts): verify history sorting and filters on a mobile device; test a current vs retired service, a consent-change/stale-permission staff row, and cross-account access denial. Confirm the existing booking wizard recalculates all live commercial terms and that no contact is dispatched by simply filtering or opening a source booking.
