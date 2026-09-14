# Build 398 — Customer Journey, Booking QoL & Acquisition Quality

Build 398 advances the 396–405 roadmap with customer-facing booking convenience and aggregate acquisition-quality evidence while preserving the Build 396 privacy/evidence boundary and Build 397 responsive baseline.

## Customer journey / booking QoL

- `/book` keeps the existing live-pricing and canonical booking-planner engine.
- A browser-only draft stores **only** vehicle-size, package-code and add-on-code selections for up to 48 hours.
- The customer is offered an explicit **Resume service choices** or **Start fresh** choice; a saved draft is not silently applied over an explicit URL selection.
- The draft does **not** store name, email, phone, address, notes, appointment date/slot, customer/profile identifiers or payment/card data.
- The booking page receives clearer “what happens next” and unavailable-slot guidance plus phone-first touch/layout improvements.
- Existing booking recovery remains authoritative for canonical server-side booking/checkout recovery. Build 398 does not claim that browser draft state is a server booking.

## Acquisition quality evidence

- New protected Admin surface: `/admin-acquisition-quality.html`.
- New protected aggregate endpoint: `/api/admin/marketing_acquisition_quality`.
- Evidence comes from existing `site_activity_events`; no schema migration is introduced.
- Source, campaign, normalized referrer-host and device coverage are reported from observed fields only.
- Missing source/campaign remains **Unattributed** rather than being inferred from another layer.
- Status fails closed to `unavailable` or `insufficient` when evidence is missing/sparse.
- The endpoint is bounded to 2,000 rows and discloses when the row limit is reached, so partial samples cannot masquerade as complete-period totals.
- No IP address, User-Agent string, visitor ID, session ID, raw postal code, customer name/email, or exact customer-profile data is returned.
- No anonymous-to-customer cross-layer identity join, fuzzy attribution, persistent scoring, automatic outreach or background polling is authorized.

## Responsive acceptance

Build 397’s shared phone/tablet/desktop responsive authority remains mandatory. Build 398 adds explicit mobile touch targets and stacked selection summary behavior to the customer booking convenience layer and responsive cards/controls to the acquisition-quality Admin surface.

## Mutation boundary

Build 398 is source-only and schema-neutral: no database migration is authorized. It also authorizes no Production business-data mutation, customer charge/refund, Stripe/PayPal/provider mutation, accounting posting, period-close mutation, inventory mutation, R2 write/delete, DNS mutation or secret rotation. Normal candidate → Development → protected-main → exact Production release promotion remains the only deployment mutation.

## Release sequence

- Candidate must pass Build 398 Customer Journey & Acquisition Quality Authority, retained responsive/growth authorities, Current Source Gate and Cloudflare feature-preview acceptance.
- `dev` advances non-force to the exact accepted candidate and must pass exact-SHA Development acceptance.
- Production promotion must use a protected-main pull request and required checks.
- The resulting `main` merge SHA must receive exact-SHA Cloudflare Production/runtime/business acceptance before Build 398 is GREEN.
- Next planned release after GREEN is **Build 399 — Customer Communication, Self-Service & Booking Funnel**.
