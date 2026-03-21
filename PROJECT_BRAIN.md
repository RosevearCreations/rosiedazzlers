# Rosie Dazzlers — Project Brain

## What it is

Rosie Dazzlers is a mobile auto detailing platform for Norfolk and Oxford Counties, Ontario.

It is no longer just a marketing + booking site.  
On the `dev` branch it is becoming a fuller small-business operations system covering:

- customer booking
- deposit checkout
- gift certificates
- admin booking operations
- customer progress sharing
- detailer jobsite intake
- job time tracking
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

## Core business flow

Customer books service  
→ deposit checkout in Stripe  
→ booking stored in Supabase  
→ admin confirms booking  
→ admin assigns staff  
→ customer progress link can be enabled  
→ detailer performs intake and work  
→ progress, media, and time updates are recorded  
→ customer reviews progress and signs off  
→ booking is completed or reopened if needed

---

## Booking model

- Half-day slots: `AM`, `PM`
- Full day uses both slots
- Capacity is controlled by:
  - `date_blocks`
  - `slot_blocks`

Booking statuses include:

- `pending`
- `confirmed`
- `cancelled`
- `completed`

Job statuses include:

- `scheduled`
- `in_progress`
- `cancelled`
- `completed`

Structured assignment fields now exist alongside legacy `assigned_to`:

- `assigned_staff_user_id`
- `assigned_staff_email`
- `assigned_staff_name`
- `assigned_to` (legacy compatibility)

---

## Progress model

Preferred long-term model is token-based.

Booking stores:

- `progress_enabled`
- `progress_token`

Customer uses:

- `progress.html?token=...`

Progress data comes from:

- `job_updates`
- `job_media`
- `job_signoffs`

The older simple progress flow is no longer the main direction.

---

## Jobsite model

Detailer/admin can now record:

- pre-existing vehicle condition
- valuables
- pre-job checklist
- owner notes
- acknowledgement notes
- intake completion state

Time tracking is now part of the same workflow through:

- `job_time_entries`

This supports:

- work time
- travel time
- setup
- cleanup
- pauses / interruptions

---

## Live monitor model

Admin can open one live screen to watch:

- booking summary
- intake summary
- time summary
- progress notes
- media count / media items
- signoff state

This is the operational view of the day’s work.

---

## Customer model

Customer management is now broader than a booking row.

Foundation now includes:

- `customer_profiles`
- `customer_tiers`

Customer profile data is meant to support:

- repeat-customer management
- tiering / loyalty handling
- linked booking history
- future vehicle history

Important rule:

- customer tiers are business segmentation
- customer tiers are **not** security roles

---

## Staff / security model

### Current bridge reality
Admin pages still use shared `ADMIN_PASSWORD`

### Current design direction
The project is moving toward real role-aware staff access:

- Admin
- Senior Detailer
- Detailer
- Customer

Security foundation added in schema:

- `staff_users`
- `staff_override_log`

The API layer is now being updated to use role-aware checks such as:

- manage bookings
- manage blocks
- manage promos
- manage staff
- work booking
- override lower entries

---

## Override model

Some workflows now support controlled overwrite/delete behavior.

When a higher-authority staff user changes or removes another staff user’s record, the action should be written to:

- `staff_override_log`

This is part of the audit trail direction for:

- intake
- time entries
- progress entries
- media
- signoff
- future higher-risk admin actions

---

## Main operational data groups

### Booking + scheduling
- `bookings`
- `date_blocks`
- `slot_blocks`

### Gifts + promos
- `gift_products`
- `gift_certificates`
- `promo_codes`

### Progress + delivery
- `job_updates`
- `job_media`
- `job_signoffs`

### Jobsite + time
- `jobsite_intake`
- `job_time_entries`

### Staff + customers
- `staff_users`
- `staff_override_log`
- `customer_profiles`
- `customer_tiers`

---

## Current most important development direction

The most important current step is no longer “add more pages.”

It is:

- turning documented access rules into actual API enforcement
- making the admin/detailer system role-aware
- keeping the newer operations model consistent as it grows

---

## Mental model in one sentence

Rosie Dazzlers is now:

a static customer-facing site  
+ a serverless booking and operations API  
+ a Supabase business database  
+ Stripe for payment flows  
+ R2 for media  
+ an emerging role-aware admin/detailer operations layer

## New client account direction

Public pages now have a lightweight client auth direction in progress:

- client sign-up
- client login/logout
- client session cookie
- client account/profile maintenance
- top-of-site sign-in status on public pages

This is intentionally lighter than full staff admin auth but gives customers visible account state and profile ownership.
