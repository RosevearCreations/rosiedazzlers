# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable Development work. Completed release history belongs in Git history and archived evidence.

## Accepted Development checkpoint

Build 323 is GREEN at exact SHA `740d809eb069808bec2ccb411f694d5aa974f129`. Production `main` remains frozen at its last user-authorized checkpoint until the user explicitly requests another Production promotion.

## Active — Build 324

Scope: Booking Funnel Analytics & Conversion.

Acceptance checklist:

- Reuse the existing analytics event model and server-side mobile/tablet/desktop classifier; do not add duplicate customer telemetry.
- Add a read-only booking-funnel authority that counts unique sessions, not repeated event clicks.
- Measure Date + Vehicle, Package, Add-ons, Customer Details, Deposit / Payment, Checkout Started and Checkout Completed.
- Separate mobile, tablet, desktop and unknown-device funnel results.
- Calculate start-to-completion, checkout-completion and stage drop-off rates per device.
- Surface the mobile-vs-desktop completion gap and classify directional gaps greater than five percentage points.
- Return aggregate evidence only; do not expose session IDs, visitor IDs, names, emails, phones or IP addresses.
- Keep the raw-event evidence query bounded to at most 30 days and 2,500 rows and explicitly report truncation when the cap is reached.
- No background polling; refresh only on page load or explicit window/refresh actions.
- Add a responsive admin cockpit with mobile/tablet/desktop device cards and 44px controls.
- `scripts/booking_funnel_device_check.py` must pass in the cumulative Current Source Gate.
- No database migration is introduced.
- Exact feature SHA must pass Current Source Gate and Cloudflare feature preview.
- The identical SHA must then be fast-forwarded to `dev` and pass Current Source Gate plus Cloudflare Development Acceptance.
- Stop after Development acceptance. `main` remains unchanged unless the user explicitly requests Production promotion.

## Next sequential Development scope

After exact Development acceptance, use the funnel evidence contract as the base for the next booking-wizard mobile/desktop UX refinement build. Preserve one shared backend/business-rule authority across form factors.

## Continuing rule

After the active build is GREEN on exact `dev`, implement the next sequential Development build from that SHA. Keep Production frozen unless the user changes the instruction.
