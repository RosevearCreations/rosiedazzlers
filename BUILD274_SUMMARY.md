# Rosie Dazzlers — Build 274 Summary

**Status: ACTIVE**  
**Started:** 2026-08-30  
**Source branch:** `build274-full-closure-queue`  
**Accepted starting point:** `3cd7f8ac2f1b5639ade16d192569e0259189f0f7`  
**Promotion target:** `dev` only after the latest Build 274 source SHA is green  
**Production rule:** `main` remains untouched.

## Build 274 purpose

Build 274 is the current broader closure/product-value release. It is not complete merely because a source slice exists. Source, focused/cumulative guards, exact Development deployment and the applicable runtime/provider evidence remain separate acceptance layers.

## Source slices now implemented

### I.T. Connections and contextual help

`admin-integrations.html` and `functions/api/_lib/integration-registry.js` provide the safe external/runtime integration catalogue for Supabase, Cloudflare/R2, Stripe, PayPal, notifications, analytics, social/video publishing, Google Business Profile, Search Console and prepared control-plane integrations.

The registry returns presence/readiness metadata, exact runtime names, storage guidance and testing information without returning raw secret values.

Contextual help is shared through:

- `assets/contextual-help-catalog.js`;
- `assets/contextual-help.js`;
- `assets/contextual-help.css`;
- `assets/admin-page-init.js`;
- `assets/admin-menu.js`;
- Build 274 `assets/admin-shell.js` compatibility bridge for protected legacy/module pages.

The AdminShell bridge is intentionally fail-open: contextual-help failure must never block authentication or normal protected-page startup.

### Mobile Quick Book

The first Build 274 mobile-first Quick Book presentation layer is implemented in `assets/booking-quick-start-v274.js` and is loaded through the canonical pricing client only on direct `/book` use.

It preserves the existing booking engine rather than creating another authority:

- problem-first need selection;
- Saved Garage first for returning users;
- year/make/model essentials and existing vehicle-size suggestion;
- optional vehicle fields behind disclosure;
- existing authoritative package/add-on controls;
- photo/quote routing for variable conditions;
- existing availability/calendar, service area, deposit and 409 conflict behavior;
- `booking_quick_need_pick` instrumentation.

True next-three appointment choices and the shortest returning-customer rebook path remain subsequent Build 274 refinement/Development acceptance work.

### Resolved mobile utility authority

Build 274 now treats the standard operating rule as resolved:

> **Rosie brings standard detailing water and power. The customer provides a safe/private work area. Unusual parking, apartment/condo access, site rules, weather or local runoff constraints are reviewed before dispatch.**

Server/browser pricing normalization, the homepage and first guarded specialist pages use this rule. “Customer provides water/power” is no longer an approved normal public rule.

### Public trust cleanup

The homepage source no longer publishes invented “sample customer-style reviews” or named sample testimonials. Verified review proof can populate through the real review mount only when a genuine source is connected.

The homepage is now positioned as:

> **Mobile Auto Detailing & Interior/Exterior Restoration**

while retaining mobile-auto-detailing search intent, Oxford/Norfolk relevance, photo-estimate paths and static crawlable content.

### Headlight Restoration authority

`/headlight-restoration` now has one crawlable H1 and explains current catalog tiers:

- light haze / early coating failure: **From $99 per pair**;
- moderate oxidation: **From $129 per pair**;
- heavy oxidation / rough lens: **From $169+ per pair**.

The page explains condition drivers, sanding/polishing/protection stages, limits such as cracks/internal haze/moisture and replacement review, aftercare, proof placeholders and Quick Book/photo-estimate routing. No unsupported warranty is promised.

### Carpet / spill extraction authority

`/carpet-shampoo` now uses the **current branch catalog**, not older stale pricing notes:

- routine shampoo: **Small $99 / Mid $129 / Oversize $159**;
- heavy salt / beverage / repeated extraction: **From $129–$159+**;
- saturated floor / under-carpet restoration: **From $299+ / inspection quote**.

The page distinguishes maintenance cleaning from deep extraction and water-intrusion restoration; explains safe seat/trim access, carpet lifting where appropriate, drying/follow-up, moisture/odour/biological-growth/corrosion risks and photo-first severe-condition routing. It does not claim mould/mold remediation.

## Source protection

`scripts/build274_release_check.py` now protects:

- shared contextual-help reach, including the legacy AdminShell bridge;
- JavaScript syntax for current Build 274 shared assets;
- JSON-LD-aware inline-script checking so structured data is not incorrectly parsed as JavaScript;
- I.T. runtime-name/readiness/non-secret authority;
- Quick Book presentation-vs-authority boundary;
- canonical Rosie-supplied utilities;
- homepage trust rules and no sample testimonials;
- exactly one H1 and current condition tiers on the first specialist pages;
- photo-estimate paths and realistic service limits;
- documentation/workflow synchronization.

## Build 274 Source Gate

New workflow: `.github/workflows/build274-source-gate.yml`.

It runs on `build274-full-closure-queue` and performs, without touching Cloudflare or external providers:

- `node --check assets/pricing-catalog-client.js`;
- `node --check assets/booking-quick-start-v274.js`;
- `node --check functions/api/_lib/pricing-catalog.js`;
- `python scripts/build274_release_check.py`;
- `python scripts/release_check.py`.

The first source-gate attempts correctly exposed new-guard defects: JSON-LD was being passed to `node --check`, legacy AdminShell pages were not yet a help bridge, and one I.T. guard token did not match the actual `setup:` catalogue structure. Build 274 then made AdminShell a real fail-open contextual-help bridge and corrected those guard assumptions.

**The latest source-gate result remains authoritative. Do not promote `dev` until the newest feature SHA has completed green.**

## Development workflow

`.github/workflows/cloudflare-development-acceptance.yml` remains intentionally separate and `dev`-only. After deliberate source-green promotion it runs the cumulative/focused guard chain, resolves the correct Cloudflare Pages project, requires the exact `dev` SHA to appear in Development deployment history and performs anonymous protected-route/non-5xx smoke checks.

## Current acceptance boundary

Build 274 does **not** yet claim:

- exact-SHA Development acceptance of the current feature work;
- authenticated browser/mobile contextual-help acceptance;
- real Stripe test deposit/final balance/refund/webhook settlement acceptance;
- PayPal sandbox acceptance;
- provider email/SMS/Web Push delivery acceptance;
- Google/Meta/social OAuth or publishing acceptance;
- Search Console/GBP external evidence;
- real-device/PWA/weak-network acceptance;
- completion of the remaining Payments/Finance, maintenance, fleet, reliability, DAIP and provider-evidence queue;
- Production promotion.

These remain Build 274 work/evidence and must not be backdated into older releases.
