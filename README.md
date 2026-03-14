<!-- README.md (replace repo README with this) -->

# Rosie Dazzlers — Mobile Auto Detailing (Cloudflare Pages + Supabase + Stripe)

Modern static site + serverless backend for Rosie Dazzlers (Norfolk & Oxford Counties).

## Stack
- Cloudflare Pages (static hosting + Functions backend)
- Cloudflare R2 (public image hosting)
- Supabase (Postgres database)
- Stripe (deposits + gift certificate checkout)

## Local structure
- `/*.html` — site pages
- `/assets/*` — shared CSS/JS (theme + nav/footer + helpers)
- `/data/*` — JSON data powering services, pricing, gear, consumables
- `/functions/api/*` — backend endpoints (Cloudflare Pages Functions)

## Key Pages
- Home: `/`
- Services: `/services` (choose canonical: `services.html` OR `services/index.html`)
- Pricing: `/pricing` (choose canonical: `pricing.html` OR `pricing/index.html`)
- Booking: `/book`
- Gifts: `/gifts`
- Gear: `/gear`
- Consumables: `/consumables`
- Admin: `/admin`

## API Endpoints (core)
### Booking
- `GET /api/availability?date=YYYY-MM-DD`
- `POST /api/checkout` → returns Stripe `checkout_url`

### Stripe booking webhook
- `POST /api/stripe/webhook`

### Gifts
- `POST /api/gifts/checkout`
- `POST /api/gifts/webhook`
- `POST /api/gifts/receipt`

### Admin
- `POST /api/admin/bookings` (list + set status)
- `POST /api/admin/block_date` / `unblock_date`
- `POST /api/admin/block_slot` / `unblock_slot`
- `POST /api/admin/progress_post` / `progress_list`
- `POST /api/admin/assign_booking`
- `POST /api/admin/promo_create` / `promo_list` / `promo_disable`

## Environment Variables (Cloudflare Pages)
Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

Stripe:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (bookings)
- `STRIPE_WEBHOOK_SECRET_GIFTS` (gifts)

## R2 Assets
This repo expects an R2 custom domain:
- `https://assets.rosiedazzlers.ca`

Folders:
- `brand/`
- `packages/`
- `products/`
- `systems/`

## Database
See `SUPABASE_SCHEMA.sql` (create/repair statements for the tables used by this codebase).

## Notes
- Booking capacity is AM/PM slots (half-day), with a full-day option (AM+PM).
- Customers must provide driveway + power + water; acknowledgements are required at checkout.
- Gift certificates are separate from bookings and have a 1-year expiry (no refunds).
