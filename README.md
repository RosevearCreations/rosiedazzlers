# Rosie Dazzlers — Mobile Auto Detailing

Modern static site + serverless backend for Rosie Dazzlers (Norfolk & Oxford Counties).

## Stack
- Cloudflare Pages (static hosting + Functions backend)
- Cloudflare R2 (public image hosting)
- Supabase (Postgres database)
- Stripe (deposits + gift certificate checkout)

## Main site
- `/` — home
- `/services` — services
- `/pricing` — pricing
- `/book` — booking form
- `/gifts` — gift certificates
- `/gear` — gear catalog
- `/consumables` — consumables catalog
- `/progress` — customer progress page (token-based)

## Admin area
Clean admin routes are available through redirects:
- `/admin`
- `/admin-booking`
- `/admin-blocks`
- `/admin-progress`
- `/admin-jobsite`
- `/admin-live`
- `/admin-staff`
- `/admin-customers`
- `/admin-promos`

## Core backend areas
### Booking
- `GET /api/availability?date=YYYY-MM-DD`
- `POST /api/checkout`
- `POST /api/stripe/webhook`

### Gifts
- `POST /api/gifts/checkout`
- `POST /api/gifts/webhook`
- `POST /api/gifts/receipt`

### Progress
- `GET /api/progress/view?token=...`
- `POST /api/progress/signoff`
- `POST /api/admin/progress_enable`
- `POST /api/admin/progress_post`
- `POST /api/admin/progress_media_post`
- `POST /api/admin/progress_list`

### Jobsite / live ops
- `POST /api/admin/jobsite_intake_get`
- `POST /api/admin/jobsite_intake_save`
- `POST /api/admin/job_time_entry_post`
- `POST /api/admin/job_time_entries_get`
- `POST /api/admin/job_time_summary_get`

### Admin operations
- `POST /api/admin/bookings`
- `POST /api/admin/assign_booking`
- `POST /api/admin/booking_customer_link`
- `POST /api/admin/blocks`
- `POST /api/admin/block_date`
- `POST /api/admin/unblock_date`
- `POST /api/admin/block_slot`
- `POST /api/admin/unblock_slot`
- `POST /api/admin/staff_list`
- `POST /api/admin/staff_save`
- `POST /api/admin/customer_profiles_list`
- `POST /api/admin/customer_profiles_save`

## Environment variables
Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

Stripe:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_SECRET_GIFTS`

## Assets
R2 custom domain:
- `https://assets.rosiedazzlers.ca`

Folders:
- `brand/`
- `packages/`
- `products/`
- `systems/`

## Database
See `SUPABASE_SCHEMA.sql`.

Recent schema additions include:
- token-based progress fields on `bookings`
- `job_updates`, `job_media`, `job_signoffs`
- `jobsite_intake`
- `staff_users`
- `customer_tiers`
- `customer_profiles`
- `staff_override_log`
- `job_time_entries`

## Notes
- Booking capacity is AM/PM slot based.
- Customers must acknowledge driveway, power, water, bylaw, and cancellation rules.
- Token-based progress is now the preferred customer progress path.
- Shared admin-password pages still exist now, but the project is moving toward role-based staff access.
