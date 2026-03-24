<!-- SANITY_CHECK.md -->

# Rosie Dazzlers — Sanity / Health Check (as of March 2026)

## What we’ve accomplished (working pieces)

### 1) Modern static site + shared theme
- Standardized styling across pages via: `assets/site.css` (theme variables in `:root`).
- Shared navigation + footer logic via: `assets/chrome.js` (includes socials + footer logo).

### 2) R2 asset hosting (images, charts, packages)
- R2 custom domain pattern is in use:
  - `https://assets.rosiedazzlers.ca/brand/...`
  - `https://assets.rosiedazzlers.ca/packages/...`
  - `https://assets.rosiedazzlers.ca/products/...`
  - `https://assets.rosiedazzlers.ca/systems/...`
- Brand assets and package images are wired into the site through:
  - `assets/config.js`
  - `assets/site.js`
  - `data/rosie_services_pricing_and_packages.json`

### 3) Booking + deposits (Stripe + Supabase)
- Booking endpoint (deposit checkout session):
  - `functions/api/checkout.js`
- Availability endpoint (reads date blocks, slot blocks, bookings):
  - `functions/api/availability.js`
- Stripe booking webhook confirms deposits:
  - `functions/api/stripe/webhook.js`
- Admin tooling (basic):
  - bookings list / status changes: `functions/api/admin/bookings.js`
  - date/slot block add/remove: `functions/api/admin/block_date.js`, `block_slot.js`, `unblock_*`
  - UI pages: `admin.html`, `admin-booking.html`, `admin-blocks.html`

### 4) Gift certificates system (separate from booking)
- Gift cart + checkout:
  - `functions/api/gifts/checkout.js`
- Gift webhook issues certificates in Supabase:
  - `functions/api/gifts/webhook.js`
- Receipt lookup:
  - `functions/api/gifts/receipt.js`
- Gift UI page:
  - `gifts.html`

### 5) Product + gear listing pages (JSON-driven)
- Data lives in `/data/*.json` and pages render lists:
  - `consumables.html` (already working well)
  - `gear.html` (now loading images/names; amazon links still need alignment)

### 6) Admin “progress updates” (field updates)
- Admin pages + endpoints to post progress notes/photos:
  - `admin-progress.html`, `admin-upload.html`
  - `functions/api/admin/progress_post.js`
  - `functions/api/admin/progress_list.js`
  - public viewer: `progress.html` + `functions/api/progress_list_public.js`
- Supabase table expected:
  - `progress_updates`

### 7) Promo codes (discounts separate from gifts)
- Admin promo UI + endpoints:
  - `admin-promos.html`
  - `functions/api/admin/promo_create.js`, `promo_list.js`, `promo_disable.js`
- Table expected:
  - `promo_codes`
- Booking checkout supports optional `promo_code`:
  - `functions/api/checkout.js` (latest version)

---

## Current “must-fix” issues (highest priority)

### A) Duplicate routes / redirect risk
You currently have BOTH:
- `services.html` AND `services/index.html`
- `pricing.html` AND `pricing/index.html`

Depending on Cloudflare Pages “pretty URLs” behavior, this can cause:
- route ambiguity
- occasional redirect loops

**Must-have decision:** choose ONE canonical approach:
- Either “folder routes”: `/services/index.html` and remove `services.html`
- OR “root pages”: keep `services.html` and remove `services/index.html`

Then add a redirect rule to enforce one canonical URL.

### B) Hover carousel media mismatches (blank hover cards)
`assets/site.js` currently references hover images with filenames that **don’t match** your real R2 objects:
- It uses: `.../packages/Exteriordetail.png`, `Interiordetail.png`, `carsizechart.png`
- Your actual objects are like: `Exterior Detail.png`, `Interior Detail.png`, and the size chart is `CarSizeChart.PNG` (often in `brand/`)

This will create the “blank hover” issue (404 images).

### C) Add-ons mismatch: frontend vs backend
- `assets/config.js` contains ADDONS like `engine_bay`, `pet_hair`, `odor_treatment`
- `functions/api/checkout.js` contains a different set of add-ons (the detailed ones)

**Must-have:** unify the add-on keys + prices between:
- front-end config / JSON
- backend checkout logic

### D) Booking availability error (slot_blocks / schema drift)
You recently fixed some schema errors; however, the codebase still contains multiple variants of block endpoints (`admin/blocks.js` vs `admin/block_*`).
**Must-have:** keep ONE system and remove/ignore the other to reduce confusion.

---

## “Must haves” to be considered complete (MVP definition)

### Customer side MVP
- Services page correct (images + included service matrix + add-ons)
- Pricing page correct (prices must match your 2025 chart)
- Booking page:
  - availability works
  - vehicle info required (year/make/model)
  - deposit checkout works
  - confirmation/return flow clear
- Gift certificates:
  - buy gift (service or dollar amount)
  - receipt page returns the code
  - customer can redeem on booking

### Admin side MVP
- Block dates and slots (AM/PM)
- View bookings list + set status (pending/confirmed/cancelled/completed)
- Assign staff name to booking (simple `assigned_to`)
- Progress updates:
  - admin can post notes/photos
  - customer can view link

---

## Wishlist (next wave features)

### 1) Proper customer accounts + vehicle profiles
- Supabase Auth:
  - create account / login
  - store customer profile
- Vehicle table:
  - year/make/model/plate/mileage
  - photos interior/exterior
- Booking references customer + vehicle record

### 2) Direct photo upload from the field
- Best approach:
  - signed upload URLs (Supabase Storage or R2 signed URLs)
  - upload directly from phone browser
  - auto-create a “progress update” with uploaded media reference

### 3) Completion sign-off workflow
- Customer view: “sign off” (typed signature)
- Store signoff record:
  - name, email, timestamp, user agent
- Optional: draw signature (canvas) later

### 4) Staff assignment + permissions
- Staff accounts
- Restrict admin endpoints (no single shared admin password)

### 5) Admin calendar / capacity view
- Visual schedule: “today + next 30 days”
- One-car-per-day logic + half-day slot rules
- Time-off blocks + travel-day blocks

---

## What’s left to do (practical next steps in order)

1) **Choose canonical routes** (services/pricing) and remove the duplicate pages causing route ambiguity.
2) **Fix `assets/site.js` hover media** to point to the real filenames and correct folders.
3) **Unify add-ons** (front-end selection + backend pricing + images).
4) **Confirm booking schema + block schema** and remove duplicate admin endpoints.
5) **Harden gift certificate redemption flow** so booking can accept a gift code and reduce remaining total.
6) **Add one “Admin dashboard page” link list** to everything admin (blocks, bookings, promos, progress, assign).
7) **Implement customer signoff UI** (you already have `/api/progress/signoff` scaffolded).

---

## Repo health notes
- The repo contains TWO progress systems:
  1) `progress_updates` table + `/api/progress_list_public` (simple, working)
  2) “token-based” progress system (`job_updates/job_media/job_signoffs`) (more secure, partially wired)
  
**Recommendation:** pick ONE path and complete it.  
If you want security + shareable customer links without exposing booking IDs, finish the token-based system.


## March 24, 2026 pass additions
- Checkout now loads canonical package/add-on pricing from `data/rosie_services_pricing_and_packages.json`.
- Checkout now supports gift-aware deposit handling and gift-only confirmation when the deposit is fully covered.
- Admin progress now supports threaded replies plus moderation statuses (`visible`, `hidden`, `internal_only`, `pinned`).
- Recovery template persistence was added through `functions/api/admin/recovery_templates.js`, `functions/api/admin/recovery_preview.js`, and `admin-recovery.html`.
- Inventory/purchasing foundations were added through `functions/api/catalog_public.js`, `functions/api/admin/catalog_inventory_list.js`, `functions/api/admin/catalog_inventory_save.js`, `functions/api/admin/catalog_reorder_request.js`, and `admin-catalog.html`.
- Public `gear.html` and `consumables.html` now try the database inventory first and fall back to JSON.
