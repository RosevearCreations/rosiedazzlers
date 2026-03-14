<!-- REPO_GUIDE.md -->

# Rosie Dazzlers Repo Guide

## 1) What this repo is
A Cloudflare Pages site with:
- Static HTML pages (marketing + booking + gifts + catalogs)
- Cloudflare Pages Functions (`/functions`) acting as the backend API
- Data JSON in `/data`
- Images served from Cloudflare R2 (custom domain `assets.rosiedazzlers.ca`)

## 2) Folder map (high-level)

### Root HTML pages
- `index.html` — home
- `services.html` and `services/index.html` — **choose one canonical**
- `pricing.html` and `pricing/index.html` — **choose one canonical**
- `book.html` — booking form
- `gifts.html` — gift certificate UI
- `gear.html` — gear catalog
- `consumables.html` — consumables catalog
- `contact.html`, `about.html`, `privacy.html`, `terms.html`, `waiver.html`
- Admin UI:
  - `admin.html`
  - `admin-booking.html`
  - `admin-blocks.html`
  - `admin-progress.html`
  - `admin-upload.html`
  - `admin-assign.html`
  - `admin-promos.html`
  - `progress.html` (customer viewing page)

### `/assets`
Shared site assets:
- `site.css` — theme & global styling
- `chrome.js` — shared nav + footer + socials
- `site.js` — services/pricing render helpers (also hover media)
- `config.js` — constants (R2 base URL, pricing labels, charts, etc.)

### `/data`
Static JSON used by pages:
- `rosie_services_pricing_and_packages.json` — core source of packages/prices/services/add-ons
- `rosie_products_catalog.json` — consumables catalog
- `systems_catalog.json` — gear/systems catalog
- `*_manifest.json` — file lists / inventory-like helpers

### `/functions/api`
Backend endpoints (Cloudflare Pages Functions):
- Booking + availability:
  - `checkout.js`
  - `availability.js`
  - `stripe/webhook.js`
- Gifts:
  - `gifts/checkout.js`
  - `gifts/webhook.js`
  - `gifts/receipt.js`
- Admin:
  - `admin/*` (bookings list, blocks, promos, progress updates, assign booking)
- Debug:
  - `debug/stripe_mode.js`
  - `health.js`

## 3) Environments (dev vs prod)
You typically have:
- **Preview** (branch builds, e.g. `dev.rosiedazzlers.pages.dev`) → Stripe TEST keys
- **Production** (main branch, `rosiedazzlers.ca`) → Stripe LIVE keys

## 4) Cloudflare Pages environment variables

### Required for BOTH preview and prod
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

### Stripe keys
- Preview:
  - `STRIPE_SECRET_KEY` = `sk_test_...`
  - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (booking webhook test)
  - `STRIPE_WEBHOOK_SECRET_GIFTS` = `whsec_...` (gifts webhook test)

- Production:
  - `STRIPE_SECRET_KEY` = `sk_live_...`
  - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (booking webhook live)
  - `STRIPE_WEBHOOK_SECRET_GIFTS` = `whsec_...` (gifts webhook live)

## 5) R2 asset conventions
Your code assumes:
- Brand images: `brand/<filename>`
- Service packages & add-ons images: `packages/<filename>`
- Gear: `systems/<filename>`
- Consumables: `products/<filename>`

Custom domain used in code:
- `https://assets.rosiedazzlers.ca/<folder>/<filename>`

## 6) “Where to change the theme”
Update CSS variables in:
- `assets/site.css` under `:root { ... }`

Recommended pattern:
- only adjust variables (colors, radii, shadows)
- avoid page-by-page style drift

## 7) Known route duplication (important)
Remove duplicates and enforce canonical:
- Pick either `services.html` OR `services/index.html`
- Pick either `pricing.html` OR `pricing/index.html`

Then add a redirect to keep one consistent.
