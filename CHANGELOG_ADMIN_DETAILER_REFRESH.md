> Last synchronized: April 1, 2026. Reviewed during the session-first recovery tooling, jobsite upload reuse, DB-first catalog fallback reduction, and docs/schema synchronization pass.

> Last synchronized: March 31, 2026. Reviewed during the known-gaps/risk reduction, DB-first catalog convergence, progress-page upload reuse, and docs/schema synchronization pass.

> Last synchronized: March 30, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.
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

## March 31, 2026
- reused signed upload flow directly inside `admin-progress.html`
- moved shared/public catalog loaders further toward DB-first behavior
- tightened transitional legacy-bridge wording on active admin screens/comments

> Last reviewed in the April 2, 2026 blocks/risk convergence pass.

## April 3, 2026 UI / session / video pass
- Continued route-by-route UI cleanup by moving more admin pages toward signed-in staff session usage instead of password-only page flows.
- Tightened global CSS for dark-mode form usability, including calendar-icon visibility and better wrapping for row-based inputs/buttons on smaller screens.
- Refreshed the public video/social experience so YouTube remains the main playback surface while Instagram supports reels, work photos, and single-image proof-of-work posting.
- Continued docs/schema synchronization for the current build; no new schema migration was required in this pass.



## April 4, 2026 mobile shell / security / cleanup pass
- Tightened shared CSS again for mobile form wrapping, input/button crowding, and dark-mode date-picker visibility so calendar icons remain visible on dark surfaces.
- Added a real installable app shell foundation with `manifest.webmanifest`, `service-worker.js`, and an install banner so the field/detailer workflow feels more complete on phones.
- Continued mobile-first field direction by linking admins and detailers into the same live job workflow path; admins can still act as detailers and work through arrival, evidence capture, sign-off, and billing from the phone side.
- Reduced duplicate-route/file clutter slightly by renaming clearly unlinked legacy block endpoints and one accidental duplicate notes file with an `RM_` prefix for safe removal review.
- Still not honestly complete: full role-aware auth/session convergence on every remaining internal route, final actor normalization everywhere, and total retirement of all transitional bridge assumptions.

<!-- Last synchronized: April 4, 2026. Reviewed during the mobile fit / session cleanup / closeout pass. -->
