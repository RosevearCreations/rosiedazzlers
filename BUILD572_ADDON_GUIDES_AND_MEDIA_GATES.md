# Build 572 — Detailed Add-on Landing Pages, Service Explanations & Approved Media

**Release scope:** 24 unindexed, individually addressable add-on editorial routes at `/preview/addons/{code}`, backed by a single Cloudflare Pages Functions read-only rendering template. The directory `/preview/addons/` lists all 24. Original canonical catalog codes are used. Existing public routes, commercial pricing, quotes, bookings, media data, Supabase and Stripe remain unchanged.

Each guide includes a unique introduction, service suitability/assessment, truthful limitations, an owner approval media slot, practical booking advice, and links back to existing `/book` and quote-first preview. No prices or final terms are fabricated. The source catalog's real current pricing/eligibility remains authoritative; the preview requires staff confirmation rather than claiming booking availability.

## Media evidence
The repository already has `data/media_requirements.json`, `IMAGES.md`, and locally bundled add-on images, but a file existing in R2 or Git is **not evidence of the customer's consent, licensing, dimensions or public editorial approval**. No public image is displayed by this build. The `approvedAddonImage572` gate requires owner-review provenance, approved public consent and privacy, approved license, dimensions >=1200x800, alt text, and a local allowed path. The route passes no media approval manifest, ensuring all photos remain pending until owner-reviewed future work.

Images requested for all 24 addon pages: minimum **1200×800**, target **1600×1067**, clear real Rosie-owned photos of the actual treatment on an authorized vehicle, matched neutral light, no recognizable customer/plate without consent, descriptive alt and approved owner/reviewer audit reference. Priority missing images from `IMAGES.md`: pet hair, odour, seat shampoo, carpet shampoo, salt stain, headlight restoration, windshield ceramic, ceramic spray, trim, bug/tar, truck box wash and fleet add-on. Use `/admin-media-health.html` for dimension and approval review. No images uploaded or approval invented.

## Owner decisions deferred
Actual public-facing service pages (SEO canonical migration), exact pricing-display matrix, customer quotes, media rights and detailed visual approval are separate owner decisions. Build 573+ may be authorized independently. No existing customer quotes/payments or public navigation are altered.

## Acceptance
Run `node scripts/addon_guides_572_test.mjs` and Cloudflare exact feature preview. Dev merge required full source/business/security tests and exact Cloudflare Development; protected dev→main PR must pass gates, then exact main Cloudflare Production and source/business/runtime. **Code GREEN != approved media publication**.
