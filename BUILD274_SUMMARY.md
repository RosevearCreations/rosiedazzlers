# Rosie Dazzlers — Build 274 Summary

**Status: ACTIVE** — final Build 274 convergence / promotion authorized  
**Started:** 2026-08-30  
**Source branch:** `dev`  
**Accepted Development checkpoint:** `e923256c5812523a6e89e25560823ad427739515`  
**Promotion target:** `main`, using the exact finalized Build 274 `dev` tree  
**Promotion rule:** preserve both branch histories; no force reset.

## Build 274 purpose

Build 274 is the current broader closure/product-value release. It is not complete merely because a source slice exists. Source, focused/cumulative guards, exact Development deployment and applicable runtime/provider evidence remain separate acceptance layers.

## Source slices implemented

### I.T. Connections and contextual help

`admin-integrations.html` and `functions/api/_lib/integration-registry.js` provide the safe external/runtime integration catalogue for Supabase, Cloudflare/R2, Stripe, PayPal, notifications, analytics, social/video publishing, Google Business Profile, Search Console and prepared control-plane integrations.

The registry returns presence/readiness metadata, exact runtime names, storage guidance and testing information without returning raw secret values.

Contextual help is shared through `assets/contextual-help-catalog.js`, `assets/contextual-help.js`, `assets/contextual-help.css`, `assets/admin-page-init.js`, `assets/admin-menu.js`, and the Build 274 `assets/admin-shell.js` compatibility bridge. The AdminShell bridge is intentionally fail-open: contextual-help failure must never block authentication or normal protected-page startup.

### Mobile Quick Book

The Build 274 mobile-first Quick Book presentation layer is implemented in `assets/booking-quick-start-v274.js` and is loaded through the canonical pricing client only on direct `/book` use. It preserves the existing booking engine rather than creating another authority, including problem-first need selection, Saved Garage handling, vehicle-size suggestion, authoritative package/add-on controls, photo/quote routing, existing availability/calendar/service-area/deposit behavior, 409 conflict handling, and `booking_quick_need_pick` instrumentation.

True next-three appointment choices and the shortest returning-customer rebook path remain later refinement rather than a reason to misstate the accepted Build 274 source.

### Resolved mobile utility authority

Build 274 treats the standard operating rule as resolved:

> **Rosie brings standard detailing water and power. The customer provides a safe/private work area. Unusual parking, apartment/condo access, site rules, weather or local runoff constraints are reviewed before dispatch.**

“Customer provides water/power” is not an approved normal public rule.

### Fleet authority

Fleet and workplace work is individually scoped. Build 274 does **not** invent a six-vehicle or other numeric eligibility threshold, minimum, or discount. Vehicle count, location, service frequency, invoicing and scheduling needs may inform a quote without becoming a public eligibility rule unless the business explicitly adopts one later.

### Maintenance-plan guard

The public maintenance-plan page remains an interest/waitlist path and does not invent final subscription pricing or perks. Its Build 274 client initialization is null-safe when optional summary mounts are absent, so growth-setting hydration cannot fail merely because `#cycleSummary` is not rendered.

### Public trust and specialist service authority

The homepage source does not publish invented sample customer-style reviews or named sample testimonials. Verified review proof can populate only from genuine sources. The homepage remains positioned as **Mobile Auto Detailing & Interior/Exterior Restoration** while retaining mobile-auto-detailing search intent, Oxford/Norfolk relevance, photo-estimate paths and static crawlable content.

`/headlight-restoration` explains condition-dependent service tiers, realistic restoration limits, protection/aftercare and photo-first quote routing without unsupported warranty promises. `/carpet-shampoo` distinguishes routine maintenance cleaning, deeper extraction and water-intrusion restoration while explaining safe access, drying/follow-up and condition-driven pricing without claiming mould remediation.

## Source protection

`scripts/build274_release_check.py` protects Build 274 shared/contextual-help reach, JavaScript syntax, JSON-LD-aware inline-script handling, I.T. readiness/non-secret authority, Quick Book presentation-vs-authority boundaries, canonical Rosie-supplied utilities, homepage trust rules, specialist-page H1/condition/estimate requirements, and documentation/workflow synchronization.

`.github/workflows/build274-source-gate.yml` remains the Build 274 source gate. `.github/workflows/cloudflare-development-acceptance.yml` remains the Development acceptance workflow and is separate from source-only checks.

## Acceptance and promotion boundary

The accepted Development checkpoint immediately preceding this final convergence is `e923256c5812523a6e89e25560823ad427739515`. The final Build 274 authority is the commit containing this summary on `dev`; the corresponding `main` promotion must use the exact same tree while preserving both branch histories.

Promotion to `main` is a source-release action. It does **not** fabricate or backdate external evidence. The following remain separate runtime/provider acceptance where applicable:

- authenticated browser/mobile contextual-help acceptance;
- real Stripe test deposit/final balance/refund/webhook settlement acceptance;
- PayPal sandbox acceptance;
- provider email/SMS/Web Push delivery acceptance;
- Google/Meta/social OAuth or publishing acceptance;
- Search Console/Google Business Profile external evidence;
- real-device/PWA/weak-network acceptance;
- later business decisions such as final maintenance pricing/perks or fleet discounts/minimums.

These items must be recorded when actual evidence or explicit business decisions exist; they do not prohibit the authorized Build 274 `dev` → `main` source promotion.
