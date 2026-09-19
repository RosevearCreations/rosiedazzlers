# Build 427 — Booking Conversion & Quote Clarity

## Purpose

Use existing first-party booking-funnel evidence to reduce avoidable uncertainty between service selection, condition-aware estimates and the authoritative booking planner.

## Customer clarity

- Fixed catalogue package/add-on prices remain catalogue values and are revalidated by the existing booking path.
- Work marked quote-required or condition review is not silently converted into a fixed price. It remains excluded from the fixed subtotal until reviewed.
- An estimate or accepted quote is not a booking confirmation and does not reserve an appointment slot.
- Availability remains server-authoritative in the existing booking planner and checkout path.
- The public booking page may explain these boundaries and emit bounded non-PII interaction events only.

## Evidence

The existing protected Customer Booking Funnel surface may count these anonymous interaction events in the same bounded evidence layer:

- `booking_quote_clarity_view`
- `unified_vehicle_size_pick`
- `unified_service_pick`
- `unified_addon_toggle`
- `unified_booking_start`

These counts are not unique people and are never joined to customer identities. Canonical booking-status evidence stays a separate layer.

## Mutation boundary

This release is schema-neutral. It authorizes no database migration, booking mutation, availability override, price/catalogue mutation, customer/profile mutation, payment/refund/provider action, accounting or inventory posting, staff-role change, consent change, message dispatch, secret/DNS change, Production restore, destructive R2 mutation or permanent polling.

## Acceptance

The exact candidate must pass:

1. focused Booking Conversion & Quote Clarity authority;
2. retained quote/booking and booking-funnel authorities;
3. Current Source Gate and exact feature-preview acceptance;
4. identical-SHA Development deployment/runtime acceptance after non-force fast-forward to `dev`;
5. protected-main pull-request checks; and
6. independent exact resulting `main` Cloudflare Production deployment/runtime/business acceptance.

Missing telemetry or provider/owner evidence remains unavailable or a HOLD; source/runtime GREEN never fabricates conversion success.
