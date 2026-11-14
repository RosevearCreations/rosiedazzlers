# Rosie Dazzlers Build 889 — Genuine À La Carte Service Selection and Canonical Checkout

This is an **integrated package-free checkout implementation, not an owner approval of any real standalone product**. Build 888's clear entry now links to `/book-custom` (same on `book/index.html` and `book.html`). Its accessible customer form loads live public catalogue, offers individual selections and worksite/date/slot, checks availability, then posts `booking_mode:'ala_carte', service_codes:[…]` **to the existing authoritative** `POST /api/checkout` rather than a second booking/payment system.

## Server-side safety
- `functions/api/_lib/ala-carte-v889.js` requires current server catalogue's explicit `booking_rules.ala_carte_policy: {enabled:true,owner_approved:true,version:'OWNER_RECORDED_VERSION',deposit_cad:OWNER_APPROVED_CAD,minimum_duration_slots:1|2}`. Those are business settings, **not Cloudflare/GitHub secrets**. No automatic activation from Build 889 deployment.
- Every selected service must have `standalone_allowed:true`, not `quote_required`, positive server-owned `prices_cad[vehicle_size]`, valid code and unique selection. Missing/mismatched data fails closed **before insert or payment**. Browser prices, item totals and deposits are ignored.
- The legacy database has `bookings.package_code text NOT NULL`; an approved package-free basket uses sentinel `package_code='ala_carte'` with all authoritative line items in existing `addons jsonb`, and an audit note referencing the owner catalog policy version. Neither the protected column nor DB one-car capacity guard is altered.
- Package-only guided wizard keeps `package_code` requirements, current deposit defaults and the existing private customer booking flow. Both paths use current location/workability, holiday/capacity, Supabase insert, Stripe/PayPal order and verified webhook/capture authorities. New package-free gift/promos explicitly HOLD until owner-approved atomic settlement logic exists.
- November–March requires owner/staff winter review under Build 739, independent of displayed calendar availability. Never override that to make an end-to-end CI demo pass. No live test charge is authorized.
- The manual form labels amounts as service subtotal in CAD; detailed HST/deposit/balance customer wording is owned by Build 890. No hidden client-side total can override the server amount.

## Actual owner configuration gap — DO NOT invent values
At the 14 Nov 2026 read-only original Rosie Supabase inspection: `public.bookings.package_code` was NOT NULL, and zero of 12 current database addon records explicitly had `standalone_allowed:true`. The bundled fallback also had no enabled standalone items. Therefore initial manual route must **honestly show HOLD** even though the code is deployable. To activate a service, an owner must individually review scope, required tools/materials, safe time slots, vehicle-size prices, quote-only requirements and deposit, then **approve** `standalone_allowed:true` on chosen official catalog entries and configure the policy above through authenticated Rosie App Management after source-driven acceptance. Never silently set those flags in migration or scripts. A real test order requires a separately configured Stripe test/PayPal Sandbox environment, independent callback and owner real-device acceptance. Source unit fixtures are not business authorization.

## Regression and release
`node --test tests/build889_ala_carte_checkout.test.mjs`
`node scripts/build888_booking_paths_test.mjs`

Protected PR → dev → main required. After `main` merge, require independent exact-main Cloudflare Pages/Functions-aware deployment and health GREEN, queue WITHIN_BUDGET. Software GREEN does not imply the owner has authorized standalone pricing, verified real payments, or approved winter use.
