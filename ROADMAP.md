> Last synchronized: April 10, 2026. Reviewed during the session-first admin recovery/live/progress app-shell pass, recovery audit visibility pass, static stress-check pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the canonical add-on media recovery, crew assignment/senior detailer workflow, responsive app-shell tightening, stability checks, and docs/schema synchronization pass.

> Last synchronized: April 9, 2026. Reviewed during the add-on image restore, assignment identity normalization, month-end checklist, and docs/schema synchronization pass.

> Last synchronized: April 8, 2026. Reviewed during the accounting backend, payable/expense, month-end reporting, and docs/schema synchronization pass.

> Last synchronized: March 29, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

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

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->

## April 9, 2026 accounting workflow roadmap update
- Accounting has now crossed from backend foundation into usable office workflow.
- The next roadmap layer should connect booking-side revenue and inventory-side cost data into cleaner per-job profitability and month-end close routines.
- After that, the strongest route is deeper reconciliation and auth/session hardening rather than adding entirely new accounting tables.


Route hotfix sync reviewed on 2026-04-11.
