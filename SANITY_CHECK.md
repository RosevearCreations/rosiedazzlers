# Rosie Dazzlers — Sanity / Health Check (updated March 2026)

## What is working / built

### 1) Shared site framework
- `assets/site.css` provides theme/layout
- `assets/chrome.js` handles shared nav/footer/banner/reviews behavior
- `assets/site.js` drives services/pricing/booking/catalog pages

### 2) R2 asset hosting
- Brand, package, product, and system images are served from `https://assets.rosiedazzlers.ca`
- Banner and review image issues were corrected without changing live asset names

### 3) Booking + deposit flow
- Booking form posts to `functions/api/checkout.js`
- Availability checks read from `date_blocks` and `slot_blocks`
- Stripe webhook confirms deposit flow
- Booking lifecycle is represented in the data model with:
  - `pending`
  - `confirmed`
  - `cancelled`
  - `completed`

### 4) Gift certificate flow
- Separate gift checkout + webhook + receipt endpoints exist
- Gift purchase flow works
- Gift system is still separate from full booking-time redemption logic

### 5) Token-based progress system
- Customer progress page: `progress.html`
- Customer read endpoint: `functions/api/progress/view.js`
- Customer signoff endpoint: `functions/api/progress/signoff.js`
- Admin progress enable/post/list foundations exist
- Customer progress link can be enabled and shared from admin
- Token-based progress is now the preferred customer-facing direction

### 6) Admin pages now present
- `admin.html`
- `admin-booking.html`
- `admin-blocks.html`
- `admin-progress.html`
- `admin-jobsite.html`
- `admin-live.html`
- `admin-staff.html`
- `admin-customers.html`
- `admin-promos.html`

### 7) Jobsite intake foundation
- Jobsite intake save/load/detail/delete patterns now exist
- `jobsite_intake` table is part of the schema direction
- Supports:
  - pre-existing condition
  - valuables
  - pre-job checklist
  - owner notes
  - acknowledgement notes
  - intake completion state

### 8) Time tracking foundation
- `job_time_entries` table is part of the schema direction
- Time entry save/list/delete patterns now exist
- Supports work-time style tracking for the jobsite workflow
- Time summaries now feed live/admin views

### 9) Media + signoff foundation
- Media save/list/delete endpoints now exist
- Signoff save/list/delete endpoints now exist
- Jobsite and progress flows now have clearer media/signoff backend structure

### 10) Live admin monitoring foundation
- `admin-live.html` exists
- Live/list/dashboard style API patterns now exist
- Admin can summarize:
  - booking state
  - intake state
  - time state
  - progress
  - media
  - signoff

### 11) Staff / customer / promo admin foundation
- `staff_users` table added
- `customer_tiers` and `customer_profiles` added
- `staff_override_log` added
- Staff admin endpoints/pages exist
- Customer profile/tier endpoints/pages exist
- Promo list/save/toggle/detail/delete patterns exist

### 12) Role-aware API foundation is now much stronger
A large amount of admin/detailer backend scaffolding now exists for:
- bookings
- blocks
- progress
- jobsite intake
- time
- media
- signoff
- live operations
- staff admin
- customers
- customer tiers
- promos

This is the biggest shift on the `dev` branch.

---

## What is still incomplete / highest-priority remaining issues

### A) Real staff login/session is not finished
The project now has role-aware backend patterns, but real staff auth/session is still missing.

Current bridge reality:
- shared `ADMIN_PASSWORD`
- transitional staff identity handling

Big next need:
- real staff login/session for admin/detailer pages

### B) Gift redemption during booking is still incomplete
Gift purchase works, but booking-time redemption still needs the full loop:
- validate gift code
- check remaining value
- apply discount to booking
- update remaining balance
- mark fully redeemed

### C) Add-ons still need one canonical source
Add-on definitions still need to be unified between:
- frontend display
- frontend selection
- checkout logic
- Stripe pricing/session generation

### D) Direct mobile upload flow is still next-phase
Media records now exist in the newer flows, but direct upload from phone still needs:
- signed upload URL flow or direct storage integration
- mobile-first upload experience
- cleaner attachment to `job_media`

### E) Older and newer admin patterns still coexist
The repo has moved forward, but some older shared-password-only or duplicate endpoint patterns still exist beside the newer role-aware versions.

That means cleanup is still needed later to reduce confusion and maintenance cost.

### F) Canonical route cleanup is still unfinished
You still need to fully settle one structure for:
- `services`
- `pricing`

The routing issue is less central than the auth/workflow issues now, but it still should be finished.

---

## MVP status

### Customer-side MVP
Mostly present:
- services/pricing/booking/gifts working
- token-based progress viewing present
- customer signoff path present

### Admin-side MVP
Much stronger now:
- booking operations present
- block operations present
- progress operations present
- jobsite intake foundation present
- time tracking foundation present
- media/signoff foundations present
- live monitor foundation present
- staff/customer/promo admin foundations present

### Detailer-side MVP
Partially present:
- backend structure is much better
- jobsite workflow building blocks exist
- but real login/session and smoother field workflow are still needed

---

## Current practical priorities

1. add real staff login/session
2. make all jobsite actions consistently use real staff identity
3. complete gift redemption during booking
4. unify add-on pricing/config
5. add direct file upload from phone
6. turn the admin/detailer pages into a cleaner role-aware internal shell
7. reduce legacy/duplicate admin endpoint patterns once replacements are fully live

---

## Repo health note

The codebase has moved beyond “simple detailing website with admin tools.”

It is now becoming a real operations platform.

The main risk is no longer missing pages.  
The main risk is keeping:

- access rules
- workflow rules
- schema direction
- old/new endpoint patterns
- pricing logic

consistent while the system grows.

---

## Bottom line

The `dev` branch is in a good place structurally.

The major backend/admin foundation has expanded a lot.

The next phase should focus on:
- authentication
- workflow polish
- consolidation
- upload ergonomics
- gift redemption completion

rather than just adding more isolated endpoints.
