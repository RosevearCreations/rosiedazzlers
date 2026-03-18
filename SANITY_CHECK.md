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

### 4) Gift certificate flow
- Separate gift checkout + webhook + receipt endpoints exist
- Gift system is still separate from full booking redemption logic

### 5) Token-based progress system
- Customer progress page: `progress.html`
- Customer read endpoint: `functions/api/progress/view.js`
- Customer signoff endpoint: `functions/api/progress/signoff.js`
- Admin progress enable/post/list/media endpoints exist
- Customer progress link can now be enabled and shared from admin

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
- Pre-inspection intake UI created
- Intake save/load endpoints created
- `jobsite_intake` table added
- Supports pre-existing damage notes, valuables notes, owner acknowledgement, garbage/debris notes, and pre-job checklist

### 8) Time tracking foundation
- `job_time_entries` table added
- Time entry post/get/summary endpoints created
- Jobsite page can now record arrival, work start, breaks, weather pauses, and stop events
- Live monitor page can summarize tracked work and pause time

### 9) Live admin monitoring foundation
- `admin-live.html` created
- Can auto-refresh booking, intake, time summary, progress notes, media, and signoffs

### 10) Access/security foundation
- `staff_users` table added
- `customer_tiers` and `customer_profiles` added
- `staff_override_log` added
- Staff admin endpoints/pages exist
- Customer profile/tier endpoints/pages exist
- Booking can now be linked to a customer profile and inherit a tier

## Highest-priority remaining issues

### A) Canonical route cleanup
You still need to fully choose one structure for services/pricing.

### B) Add-on unification
Add-ons still need one true source of truth shared by frontend and checkout logic.

### C) Gift redemption completion
Gift purchase works, but booking-time redemption still needs full implementation.

### D) Security is documented but not fully enforced
Shared admin password still gates most admin actions.
Role-based enforcement for Admin vs Senior Detailer vs Detailer is the next major security step.

### E) Direct mobile upload flow
Progress media currently supports URL posting. Direct signed uploads are still a next-phase feature.

## MVP status
### Customer-side MVP
Mostly present:
- services/pricing/booking/gifts working
- progress viewing + signoff present

### Admin-side MVP
Now much stronger:
- booking ops present
- block ops present
- progress ops present
- jobsite intake foundation present
- live monitor present
- staff/customer admin present

## Next practical priorities
1. Enforce role-aware API access
2. Link jobsite/staff actions to real staff users instead of just names
3. Complete gift redemption on booking
4. Unify add-on pricing/config
5. Add direct photo upload from phone
6. Add actual live detailer-safe login/session flow

## Repo health note
The codebase has moved from a simple booking site toward an operations platform. The next major risk is not missing features — it is keeping architecture and access rules consistent while the system grows.
