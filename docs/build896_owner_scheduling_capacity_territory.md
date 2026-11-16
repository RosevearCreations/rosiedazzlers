# Rosie Dazzlers Build 896 — Capacity, territory and availability (ordered software release)

## Owner feature
Admin → Bookings now has an accessible **Schedule planning — capacity, territory & crew** form. Booking staff can choose a future date, AM/PM/full-day and an owner-configured service area. The tool calls existing authenticated **POST /api/admin/booking_availability** and returns an additive `planning_896` section.

- Reuses **Build 738** one-vehicle daily occupancy: one full day consumes both AM/PM; at most two independently staffed half-day slots may fit. Pending bookings remain held until explicitly canceled/refunded; a timeout alone does not open a slot.
- The existing protected Postgres `pg_advisory_xact_lock` conflict trigger remains the final authority on booking insert/update. No scheduling preview makes or mutates a reservation or payment.
- Recognizes **only exact owner service-area catalogue entries**, not browser-supplied county/zone assertions; unknown or quote-required zones require owner travel and site review.
- Crew and worksite are always **not verified** from the planning form. The owner must confirm actual shift coverage, parking, water/bylaws and equipment before dispatch. A plan is not an assignment.
- Returns provisional AM/PM capacity, requested fit, owner territory, worker/site status, review reasons and explicit false `has_created_booking` and `has_reserved_slot`. It never reads/writes private customer data in the planner.
- Existing admin `availability.available` response remains unchanged for older clients. Protocol 1.1 is backward-compatible with 1.0; no Master/Shell lockstep release, shared secret or Vercel peer deployment.

## Simulated source regression versus actual proof
`tests/build896_scheduling_capacity_territory.test.mjs` uses **SIMULATED** booking/territory/staff scenarios to test:
- Full day vs one/two half-day bookings and pending/failed/cancelled holds.
- Expired-looking pending rows never re-open capacity.
- Unknown territory and quote-required regions fail closed.
- Staffing and worksite must be independently confirmed.
- Source endpoint stays authenticated/read-only and retains DB advisory lock.

The actual source tests, protected PR checks, Cloudflare Pages+Functions exact-main deployment and release-health/queue checks must still run normally. Owner-supervised real workday capacity, staff travel/shift and physical worksite/device acceptance remain **BUSINESS ACCEPTANCE ON HOLD**, and no fixture result can substitute for them.

## Updating operational information later
The owner can update the existing canonical `app_management_settings.pricing_catalog.service_areas`, booking hours/closures and staff availability through the approved admin workflows and source-of-truth database, not by browser flags or direct unaudited client writes. The planning panel surfaces when the area is unrecognized or staffing/worksite proof is missing. Do not invent signed staff coverage or automatically enable standalone booking/payments while Build 892 owner catalogue approval remains absent.
