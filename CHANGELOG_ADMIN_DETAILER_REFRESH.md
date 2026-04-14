> Last synchronized: April 13, 2026. Reviewed during the social-feed-public endpoint repair, accounting GL duplicate-key cleanup, booking-lock carry-forward, route-completeness verification, and docs/schema synchronization pass.

# Rosie Dazzlers — Admin/Detailer Refresh Changelog

## Scope of this refresh

This changelog summarizes the major admin/detailer backend expansion documented on the `dev` branch.

It is meant as a quick reference for:
- what has been added
- what architectural direction changed
- what still remains

---

## Major direction change

The project moved from:

- a mostly shared-password admin toolset

toward:

- a role-aware admin/detailer backend foundation

This does **not** mean full staff authentication is complete yet.

It means the backend now has a much stronger structure for:
- scoped staff access
- role-aware operations
- override logging direction
- customer/staff/admin separation

---

## Main areas expanded

### 1) Booking operations
Added broader admin booking support for:
- search
- detail
- save
- confirm
- complete
- cancel
- delete
- availability check
- form bootstrap
- day schedule view

### 2) Jobsite operations
Added fuller jobsite workflow support for:
- intake save/list/detail/delete
- time save/list/delete
- media save/list/delete
- signoff save/list/delete

### 3) Progress operations
Expanded progress handling with:
- enable/disable progress sharing
- post/list/detail
- delete support
- token-oriented progress direction

### 4) Operations visibility
Added operational summary endpoints for:
- live work list
- dashboard summary
- day-level schedule visibility

### 5) Staff admin
Expanded staff-side admin structure with:
- current actor endpoint
- staff detail
- active toggle
- assignable list
- override log visibility

### 6) Customer admin
Expanded customer admin structure with:
- customers list/detail/save/delete
- customer tiers list/save/delete

### 7) Promo admin
Expanded promo admin structure with:
- promo list/detail/save
- active toggle
- delete

---

## Important architecture notes

### Token-based progress is preferred
Customer progress should continue to center on:
- `progress_token`
- `job_updates`
- `job_media`
- `job_signoffs`

### Customer tiers are not security roles
Customer tiers remain:
- business segmentation
- loyalty / profile grouping

They must not be mixed with:
- Admin
- Senior Detailer
- Detailer

### Shared password is still a bridge
`ADMIN_PASSWORD` still exists as a bridge layer.

The long-term direction is:
- real staff login/session
- real resolved staff identity
- cleaner role-aware internal access

---

## Tables central to this phase

### Booking / scheduling
- `bookings`
- `date_blocks`
- `slot_blocks`

### Progress / delivery
- `job_updates`
- `job_media`
- `job_signoffs`

### Jobsite / time
- `jobsite_intake`
- `job_time_entries`

### Staff / customer structure
- `staff_users`
- `staff_override_log`
- `customer_profiles`
- `customer_tiers`

### Business tools
- `promo_codes`
- `gift_certificates`

---

## What this phase did not finish

This refresh did **not** fully finish:

- real staff login/session auth
- booking-time gift redemption
- unified add-on pricing/config
- direct file upload from phone
- full cleanup of older/duplicate admin endpoint patterns
- final internal admin/detailer shell UX

---

## Recommended next phase

Most logical next development order:

1. real staff auth/session
2. consistent real staff identity across jobsite actions
3. gift redemption during booking
4. unified add-on source
5. direct upload flow
6. cleaner role-aware internal shell
7. cleanup of older endpoint patterns

---

## Bottom line

This phase substantially improved the backend foundation.

Rosie Dazzlers is now much closer to being:
- an internal operations platform
- not just a static site with a few admin tools

## Additional auth/profile expansion

After the admin/detailer refresh, the dev branch also gained:
- client login/sign-up foundation
- client account page foundation
- nav-level session status for public pages
- richer profile fields for future admin/client workflows


## Latest auth/progress/gift pass
- Added actual gift redemption writes through booking confirmation webhook using `gift_certificate_redemptions`.
- Added staff/detailer observation-thread posting through `progress_comments`.
- Added notification queue hooks through `notification_events` for customer email/SMS preference flows.
- Added richer customer/staff profile field direction and a current schema snapshot in `DATABASE_STRUCTURE_CURRENT.md`.


## Current snapshot — March 21, 2026

Latest pass completed:
- fixed booking add-on checkbox/text layout pressure
- improved service/package image fallback with extra photo cards
- expanded staff management toward richer Admin/Detailer profile editing
- added customer tier discount support in the UI/data model direction
- added/confirmed garage, gift, and redemption visibility in client/admin screens
- added current SQL for tier discounts and richer staff/customer fields

Current next priorities:
- picture-first observation interface
- richer client/detailer threaded comments UI
- manual scheduling / app-management rules UI completion
- final layout polish across booking and internal screens

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


Route hotfix sync reviewed on 2026-04-11.

## 2026-04-11 pass 9 sync
- Booking flow now uses a clearer service-area selector with town-level choices across Oxford and Norfolk communities.
- Booking availability shows open, partial, and unavailable dates in the next 21-day snapshot, and the date picker contrast was tightened for dark mode.
- Year / Make / Model on booking is now typeable with datalist-assisted lookup and validation against the existing vehicle catalog.
- Public analytics was deepened with richer action tracking, viewport/session details, and location/device enrichment stored inside event payloads.
- Route-collision folders and temporary check artifacts were removed again to keep Pages routing stable.

## 2026-04-11 pass 11 sync note
- Tightened the booking preferred-date control so it no longer stretches wider than needed and added a visible white picker button.
- Public booking, services, and pricing pages now read the canonical pricing catalog API first and only fall back to bundled JSON if the API is unavailable.
- App Management now includes a pricing catalog editor so package prices, included services, add-ons, service-area rules, and chart links can be maintained from one source of truth.
- No schema shape change landed in this pass; `SUPABASE_SCHEMA.sql` was refreshed to note the pricing-catalog consolidation and booking UI tightening work.

> Pass update 2026-04-12: Re-synced the current uploaded build to the latest safe route structure. Removed duplicate clean-route folders that were reintroducing Cloudflare Pages redirect loops, preserved the newer booking experience already present in `book.html`, refreshed the deployed booking smoke check to recognize the shared `chrome.js` analytics bootstrap, and cleaned the login form autocomplete attributes. Immediate next step after deploy: verify `/`, `/services`, `/pricing`, `/book`, and `/admin` on the active branch before resuming larger feature work.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.
