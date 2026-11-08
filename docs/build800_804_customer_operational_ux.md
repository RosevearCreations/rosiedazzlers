# Rosie Dazzlers Builds 800–804 — customer and operations UX improvements

This is an application-functional release after Build 799. It does **not**
change the Comms Hub trust protocol, payment or deposit processor, booking
mutation rules, availability authority, customer permissions or staff roles.

## Five independently scoped improvements

| Build | Deliverable | Files |
| --- | --- | --- |
| 800 | Authorized admin menu search with keyboard shortcut `/`, clear control and screen-reader count; mobile friendly charcoal/gold treatment | `assets/admin-workspace-v800.mjs`, `assets/admin-shell.js`, `assets/ux-800-804.css` |
| 801 | Step-specific booking instructions, accessible validation-error review and focus recovery using the existing five-step planner | `assets/booking-wizard-ux-v801.mjs`, `booking-planner.html` |
| 802 | Clear AM/PM/FULL availability snapshot guidance and accessible selected-slot state; stale/failed reads never claim a reservation | `assets/booking-availability-v802.mjs`, `booking-planner.html` |
| 803 | Catalogue-derived itemized *starting* estimate, with quote-only extras explicitly excluded and a source-total parity guard | `assets/booking-quote-breakdown-v803.mjs`, `book.html`, `book/index.html` |
| 804 | Searchable customer self-service shortcuts to existing booking, profile, reschedule, communication, garage, gift and review sections | `assets/customer-actions-v804.mjs`, `my-account.html`, `my-account/index.html` |

## Trust, pricing and capacity boundaries

- Admin search filters only links already rendered after `AdminAuth.requireAuth`;
  it does not discover, grant or unhide restricted routes.
- The booking wizard and availability modules do not call booking APIs, make
  holds, change a slot, advance steps or submit payment. The original server
  continues to validate prices, service area, capacity and checkout.
- The quote breakdown uses the same live catalogue inputs as the existing
  `totals()` computation. If values disagree, it declines the itemization.
  It is CAD before HST and excludes quote-only work; it never becomes an invoice.
- Account shortcuts are local navigation into pre-existing signed-in
  workflows; no customer data, token, consent, notification or payment is
  read/written by the shortcut module.
- Existing source roles, Stripe/PayPal paths, original QL-364 handler,
  six-peer `DISCONNECTED / HOLD` software manifest and release gates are unchanged.

## Acceptance

`node scripts/build800_804_ux_test.mjs` validates source-only menu search,
five-step guidance, stale/failed availability, quote-only exclusions, account
navigation and route parity. It is included in the established
`scripts/current_booking_wizard_regression.sh` release suite alongside the
previous booking and Comms security checks.

Production `main` and independent deployment acceptance must be recorded
from actual GitHub/Cloudflare results; this document makes no runtime or
original customer-device claim by itself.
