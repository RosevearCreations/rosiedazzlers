
> Last synchronized: March 25, 2026. This file was reviewed during the recovery/moderation/docs/schema refresh pass.
# Rosie Dazzlers — Handoff for Next Chat

## Branch rule
Use `dev` as source of truth unless explicitly told otherwise.

## Resume prompt
Continue Rosie Dazzlers from the `dev` branch docs. Use `README.md`, `PROJECT_BRAIN.md`, `CURRENT_IMPLEMENTATION_STATE.md`, `KNOWN_GAPS_AND_RISKS.md`, `DEVELOPMENT_ROADMAP.md`, and `NEXT_STEPS_INTERNAL.md` as source of truth.

## Current state in one paragraph
Rosie Dazzlers is now a role-aware detailing operations platform with booking, deposits, gifts, token-based customer progress, jobsite intake/time tracking, customer/staff/admin screens, recovery messaging foundations, and DB-backed catalog/inventory foundations. The newest pass focused on turning backend moderation and recovery foundations into real admin screens, tightening protected-page SEO behavior, and refreshing repo/schema docs.

## Most likely next priorities
1. real staff auth/session completion
2. actor consistency cleanup across jobsite/progress/media/time flows
3. final pricing/add-on convergence
4. customer-facing gift redemption polish
5. upload/mobile media completion
6. reorder workflow receive/close/reminder lifecycle

## Delivery style preference
- one file at a time
- brief description first
- then one complete code block for the entire file

## Newest pass summary
- Shared public login/account widget added through site chrome
- customer password reset and email verification token flows added
- public analytics/event tracking added for page, heartbeat, and cart signals
- admin analytics now surfaces live-online and cart signal views
- docs and schema snapshot refreshed again


## March 25, 2026 late-pass resume note

The latest pass moved checkout pricing onto a DB-backed canonical setting source, turned admin upload into a signed-upload mobile workflow, and added purchase-order receive/cancel actions in admin catalog. Continue next with converting the remaining legacy internal endpoints to real staff sessions, finishing gift/account messaging polish, hardening production media URL strategy, and continuing route-by-route public SEO cleanup.

## New notes from the March 25 vehicle/session pass
- Run `sql/2026-03-25_vehicle_catalog_and_staff_flow.sql`.
- Booking now calls `/api/vehicle_makes` and `/api/vehicle_models` for the year/make/model selectors.
- Progress enable/moderation now accept staff sessions; continue by removing remaining visible password fallbacks from legacy admin screens.
- Next worthwhile follow-up: extend the same shared vehicle catalog controls into the customer garage (`my-account.html`) and any admin booking editor screen.
