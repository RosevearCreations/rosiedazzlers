# Rosie Dazzlers — AI Context

Use this document as the fast handoff context for future work on the `dev` branch.

---

## Branch rule

Treat the **`dev` branch** as the current source of truth for active Rosie Dazzlers development work.

Do not assume `main` is current.

---

## What Rosie Dazzlers is now

Rosie Dazzlers is no longer only a static marketing and booking website.

It is becoming a fuller small-business operations platform for a mobile auto detailing business covering:

- customer booking
- Stripe deposit checkout
- gift certificates
- admin booking management
- token-based customer progress sharing
- detailer jobsite intake
- time tracking
- media handling
- customer signoff
- live admin monitoring
- staff roles and permissions
- customer profiles and loyalty tiers

---

## Core stack

- Cloudflare Pages
- Cloudflare Pages Functions
- Supabase Postgres
- Stripe
- Cloudflare R2

---

## Main customer pages

- `/`
- `/services`
- `/pricing`
- `/book`
- `/gifts`
- `/gear`
- `/consumables`
- `/progress?token=...`

---

## Main admin pages

- `/admin`
- `/admin-booking`
- `/admin-blocks`
- `/admin-progress`
- `/admin-jobsite`
- `/admin-live`
- `/admin-staff`
- `/admin-customers`
- `/admin-promos`

---

## Current system direction

### Preferred progress model
Use the **token-based progress system** as the long-term path.

Important tables:
- `job_updates`
- `job_media`
- `job_signoffs`

Booking should use:
- `progress_enabled`
- `progress_token`

Customer should view progress using:
- `progress.html?token=...`

### Security direction
Current bridge:
- shared `ADMIN_PASSWORD`

Current build direction:
- Admin
- Senior Detailer
- Detailer
- Customer

Important:
- customer tiers are **not** security roles
- customer tiers are business segmentation only

### Booking model
- Half-day slots: `AM`, `PM`
- Full-day consumes both
- Capacity is controlled by:
  - `date_blocks`
  - `slot_blocks`

Booking statuses:
- `pending`
- `confirmed`
- `cancelled`
- `completed`

Job statuses:
- `scheduled`
- `in_progress`
- `cancelled`
- `completed`

---

## What has already been built recently

A large role-aware admin/detailer backend scaffold now exists across:

### Booking operations
- search
- detail
- save
- confirm
- complete
- cancel
- delete
- availability checks
- schedule/day view
- form bootstrap support

### Block operations
- list
- save
- date/slot schedule checks

### Progress operations
- enable
- post/list/detail
- delete

### Jobsite operations
- intake save/list/detail/delete
- time save/list/delete
- media save/list/delete
- signoff save/list/delete

### Operations views
- live list
- dashboard summary
- day schedule

### Staff operations
- current actor
- staff list/save/detail
- active toggle
- assignable list
- override log list

### Customer operations
- customer list/detail/save/delete
- customer tier list/save/delete

### Promo operations
- promo list/detail/save
- promo active toggle
- promo delete

---

## Important schema direction

Core groups now include:

### Booking / scheduling
- `bookings`
- `date_blocks`
- `slot_blocks`

### Gifts / promos
- `gift_products`
- `gift_certificates`
- `promo_codes`

### Progress / delivery
- `job_updates`
- `job_media`
- `job_signoffs`

### Jobsite / time
- `jobsite_intake`
- `job_time_entries`

### Staff / customers
- `staff_users`
- `staff_override_log`
- `customer_profiles`
- `customer_tiers`

---

## Current biggest remaining priorities

1. Add real staff login/session handling
2. Make all jobsite actions consistently use real staff identity
3. Complete gift certificate redemption during booking
4. Unify add-on pricing/config into one canonical source
5. Add direct phone-friendly media upload flow
6. Build a cleaner role-aware internal admin/detailer shell
7. Reduce legacy/duplicate admin endpoint patterns after replacements are fully live

---

## What not to break

- working booking checkout flow
- Stripe webhook behavior
- token-based progress flow
- live R2 asset filenames and paths
- JSON keys already used by the frontend
- separation between customer tiers and security roles

---

## Working style for future updates

When continuing work:

- prefer additive changes over destructive rewrites
- avoid renaming files or keys unless necessary
- keep code blocks complete when delivering file replacements
- treat `dev` as the active branch
- keep admin/detailer work aligned with role-aware access
- keep customer tiers separate from permissions
- avoid parallel old/new systems longer than necessary

---

## Best next tasks after docs refresh

The most logical next build steps are:

- staff auth/session layer
- staff-linked jobsite identity cleanup
- gift redemption during booking
- add-on unification
- direct upload flow
- internal admin/detailer shell cleanup

---

## One-sentence handoff

Rosie Dazzlers on `dev` is now a growing detailing operations platform with a large role-aware backend foundation, and the next phase is to finish auth, unify workflow logic, and make the internal staff experience smoother.

## Recent additions

- public client login/sign-up flow
- public client account page
- nav-level sign-in status for staff/client users
- richer profile/session SQL migration for customer and staff records


## Latest auth/progress/gift pass
- Added actual gift redemption writes through booking confirmation webhook using `gift_certificate_redemptions`.
- Added staff/detailer observation-thread posting through `progress_comments`.
- Added notification queue hooks through `notification_events` for customer email/SMS preference flows.
- Added richer customer/staff profile field direction and a current schema snapshot in `DATABASE_STRUCTURE_CURRENT.md`.
