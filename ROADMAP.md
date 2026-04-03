> Last synchronized: April 1, 2026. Reviewed during the session-first recovery tooling, jobsite upload reuse, DB-first catalog fallback reduction, and docs/schema synchronization pass.

> Last synchronized: March 31, 2026. Reviewed during the known-gaps/risk reduction, DB-first catalog convergence, progress-page upload reuse, and docs/schema synchronization pass.

> Last synchronized: March 30, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

# Rosie Dazzlers — Customer / Detailer / Admin Flow Roadmap

Last synchronized: March 27, 2026.

## Customer booking flow
1. **Choose date and vehicle**
   - show open dates and AM / PM / full-day availability
   - allow saved garage vehicle selection when the customer is signed in
   - collect year, make, model, colour, size, and category
2. **Choose main package**
   - show package pricing for the selected vehicle size
   - keep one clear package choice active at a time
3. **Choose add-ons**
   - allow optional quote-required add-ons
   - capture promo and gift codes
4. **Verify requirements**
   - confirm driveway, power, water, environmental / bylaw, and weather rescheduling terms
   - collect special notes and optional vehicle photo link
5. **Review and pay**
   - show subtotal, deposit, add-ons, and quote-required items
   - send the booking into admin review and payment completion

## Admin operations flow
1. review newly placed bookings
2. verify notes, service area, add-ons, vehicle details, and payment state
3. assign a detailer
4. monitor customer-visible and internal-only job activity
5. adjust extras, discounts, and final billing before closeout
6. track inventory usage, reorder needs, purchase receiving, and movement history

## Detailer job flow
1. accept or decline assignment with reason
2. mark dispatched / on the way
3. arrival checklist and customer walk-around
4. collect before photos and signatures
5. start / pause / resume detailing timer and workflow stage
6. add products used, public updates, media, and internal-only notes for admin
7. complete sign-out checklist and move the job to billing

## Customer live job flow
- customer can open the progress feed after the job is enabled
- customer can view public updates, photos, checklist details, products used, and completion status
- customer cannot see internal-only admin/detailer notes
- customer can sign off at the end and later manage garage settings in My Account

## Mobile-first rules
- every active job screen should work comfortably from a phone
- next-step actions should be large tap targets
- field entry should be minimized when saved account / garage data already exists
- private/internal notes must stay clearly separated from customer-visible notes


## Booking + live-job workflow update
- Booking should behave as a true wizard where each step is reachable and readable on a phone without floating headers blocking fields.
- Customer live-job communication now supports public messages from the progress page.
- Detailer live-job communication now supports both public updates and internal-only notes from the jobs screen.
- Admin remains the moderation layer for public and private job communication.

## March 31, 2026 roadmap note
- reduce duplication further by preferring DB-first public catalog feeds anywhere the endpoint already exists
- keep reusing signed-upload flow on every field/admin screen that still leans on manual URLs
- continue removing transitional bridge hints/comments until the remaining operational path is clearly session-first

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
