# Rosie Dazzlers — Project Brain

## What it is
Rosie Dazzlers is a mobile auto detailing platform for Norfolk and Oxford Counties, Ontario.

It is no longer just a marketing + booking site. It is now becoming a full small-business operations system covering:
- customer booking
- deposit checkout
- gift certificates
- admin operations
- customer progress sharing
- detailer jobsite intake
- time tracking
- live admin monitoring
- staff roles
- customer loyalty tiers

## Core stack
- Cloudflare Pages
- Cloudflare Pages Functions
- Supabase Postgres
- Stripe
- Cloudflare R2

## Main customer pages
- `/`
- `/services`
- `/pricing`
- `/book`
- `/gifts`
- `/gear`
- `/consumables`
- `/progress?token=...`

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

## Core business flow
Customer books service → deposit checkout in Stripe → booking stored in Supabase → admin confirms / assigns staff → progress link enabled → detailer performs intake and work → progress/media/time updates happen → customer reviews progress and signs off.

## Booking model
- Half-day slots: `AM`, `PM`
- Full day uses both slots
- Capacity controlled by `date_blocks` and `slot_blocks`
- Booking statuses include `pending`, `confirmed`, `cancelled`, `completed`

## Progress model
Preferred system is token-based:
- booking stores `progress_token`
- customer uses `progress.html?token=...`
- progress data comes from `job_updates`, `job_media`, `job_signoffs`

## Jobsite model
Detailer/admin can now record:
- pre-existing vehicle condition
- valuables
- pre-job checklist
- owner acknowledgement notes
- intake completion state
- work/break/weather timing through `job_time_entries`

## Live monitor model
Admin can open one live screen to watch:
- booking summary
- intake summary
- time summary
- progress notes
- media
- signoffs

## Security model
Current production reality:
- admin pages use shared `ADMIN_PASSWORD`

Current design direction:
- Admin
- Senior Detailer
- Detailer
- Customer
- customer tiers separate from access tiers

Security foundation added in schema:
- `staff_users`
- `customer_tiers`
- `customer_profiles`
- `staff_override_log`

## Important rule
Customer tiers are business segmentation, not security roles.

## Current most important next step
Turn documented access rules into actual API enforcement.
