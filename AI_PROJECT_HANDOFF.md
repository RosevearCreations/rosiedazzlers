# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 282  
**Updated:** 2026-08-31  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current release state

Build 281 is the accepted Development reliability baseline at `6e0b6015066d2056ee023c35f939da4f5ad23384`. Build 282 is the active customer/business release and is summarized in `BUILD282_SUMMARY.md`.

Acceptance is evidence-based, not document-based: the current Build 282 SHA is accepted only when its feature source gate is green, `dev` points to that exact SHA, Cloudflare reports the exact Development deployment successful with Functions attached, exact static smoke passes, and the `dev` alias passes the full runtime smoke.

Production remains deliberately separate. `main` is still the Build 274 Production line and must not be force-moved to `dev`; future promotion must reconcile the known divergent histories deliberately.

## Application boundary

Rosie Dazzlers is one secured, mobile-first platform with a static-first public acquisition website and eight independently loadable modules:

1. Customer
2. Detailer
3. Operations / Supervisor
4. Business Administration
5. I.T. & Reliability
6. Finance
7. DAIP
8. Socials & Promotion

Permanent runtime rule:

> **Role defines the maximum module set; the staff profile may narrow non-admin access; the global module switch may make a module unavailable; workflow state decides whether an authorized module actually wakes.**

Server authorization remains authoritative. Dormant modules do not wake merely because they exist.

## Retained Build 272/273 authority

These exact retained authorities remain live and must not be weakened by later customer/business work:

- narrow Operations/Finance action permissions;
- Complete = **Best value** and the current Small/Mid/Oversized pricing authority;
- Exterior Detail remains differentiated from Premium Wash;
- condition/quote rules apply before final price where work can vary materially;
- booking/deposit/conflict mechanics remain authoritative;
- one meaningful H1 per indexable public page;
- persistent Finance tax-support records, evidence links, T2125 workpaper and accountant-package workflow remain retained;
- accounting automation must not fabricate tax facts or professional judgment.

## Retained business/public authority

Do not regress these rules:

- public positioning: **Mobile Auto Detailing & Interior/Exterior Restoration** while retaining “mobile auto detailing” as the primary high-intent category;
- vehicle-size/package/add-on pricing comes from the canonical catalogue, not page-specific duplicate prices;
- material condition variability uses photo/inspection review and an explicit expanded-scope confirmation boundary;
- booking keeps service-area, availability, capacity/conflict, quote, deposit and payment authority;
- production canonicals, crawlable static-first content and useful sitemap/internal links;
- no fabricated/sample customer reviews or invented provider evidence;
- private/customer media never becomes public without consent/review;
- no public R2 enumeration on normal requests;
- **Rosie brings standard detailing water and power. The customer provides a safe, private and permitted work area.** Unusual parking, building access, site rules, weather or local runoff restrictions are reviewed before dispatch.

## Completed forward work through Build 281

- Build 274 established Mobile Quick Book, I.T. Connections/help and the retained public/business foundation.
- Build 275 added booking/retention convergence, including true next useful AM/PM appointment shortcuts, returning-customer rebook acceleration and funnel-exit evidence.
- Build 276 hardened Development source/release mechanics.
- Builds 277–280 deepened all indexed add-on destinations, normalized the self-contained mobile operating model, deepened eight distinct Oxford/Norfolk local pages and closed sitemap/canonical/H1 coverage.
- Build 281 hardened exact Cloudflare deployment versus mutable `dev` alias acceptance, including `uses_functions=true`, immutable static identity and bounded full-runtime alias convergence.

Do not re-open these items because an older roadmap mentions them.

## Build 282 — active customer/business slice

Build 282 converts three high-intent customer situations into first-class acquisition → booking paths without creating another transaction system.

### Pre-Sale / Lease-Return Detail

`/pre-sale-lease-return-detailing`

- starts Quick Book with `need=presale`;
- recommends the existing Complete Detail path as the normal inside/outside starting point;
- keeps headlights, paint correction/protection, pet hair, stains, odour, engine-bay work and other extras separate and condition-reviewed;
- does **not** guarantee sale value, trade value or avoidance of lease-return charges.

### Spring Salt Recovery

`/spring-salt-recovery-detailing`

- starts Quick Book with `need=spring_salt`;
- recommends the existing Interior Detail path;
- distinguishes light residue, crusted carpet salt and wet/saturated-floor history;
- escalates heavy extraction, hidden moisture, seat/trim access or under-carpet work to photo/inspection review;
- does not claim mould/mold remediation.

### Fall / Winter Protection Prep

`/fall-winter-protection-detailing`

- starts Quick Book with `need=winter_prep`;
- recommends the existing Exterior Detail path;
- uses the retained clay/sealant/ceramic-spray/glass/trim/coating services only after preparation/condition review;
- explicitly does **not** represent rustproofing or undercoating.

### Booking adapter

`assets/booking-usecase-entry-v282.js` is presentation-only. It clicks the retained Quick Book choices, preserves staff notes and photo-review state, and emits `booking_usecase_entry`. It never owns package/add-on prices, availability, deposits, checkout or conflicts. Its loader is fail-open so ordinary booking remains usable if the optional preset layer fails.

`/specials` is now a seasonal/use-case discovery hub. It no longer presents unapproved same-address/senior discounts as if they are current offers.

## Current validation authority

- cumulative: `scripts/release_check.py`;
- public H1/current conversion hook: `scripts/seo_h1_check.py`;
- focused Build 282 guard: `scripts/build282_release_check.py`;
- feature source workflow: `.github/workflows/build282-source-gate.yml`;
- Development source workflow: `.github/workflows/development-source-gate.yml`;
- exact/static + alias/full smoke: `scripts/development_http_smoke.sh`;
- Development deployment workflow: `.github/workflows/cloudflare-development-acceptance.yml`.

Build 282 smoke explicitly proves the use-case adapter, all three public routes and their sitemap entries on the accepted Development artifact.

## Next business/product work after Build 282

Proceed in this order where work is not blocked by business/provider evidence:

1. real Rosie before/after proof placement on the exact service/local/use-case pages it proves;
2. Search Console/Google Business Profile measurement and genuine review authority when account access is available;
3. maintenance-plan product/account/booking path **after** cadence, price/perks and pause/cancel rules are approved;
4. fleet/workplace acquisition path **after** minimum-vehicle, discount/travel and recurring-service rules are approved;
5. customer retention/account improvements around recommended next service and low-friction rebook;
6. authenticated/mobile/accessibility/weak-network acceptance for customer flows;
7. Stripe/PayPal provider acceptance and Finance settlement/reconciliation closure;
8. continued module/security/reliability work without waking dormant subsystems.

## Manual / external evidence that must not be fabricated

- Google Business Profile ownership/review connection;
- Search Console ownership/property/sitemap/indexing evidence;
- real customer review/proof publication consent;
- maintenance-plan and fleet commercial rules not yet approved;
- authenticated role/action/direct-URL/API matrix;
- real email/SMS/Web Push delivery evidence;
- Stripe deposit/final-balance/refund/webhook acceptance;
- PayPal sandbox acceptance if retained;
- Supabase restore and Cloudflare rollback rehearsals;
- representative real-device/PWA/accessibility/weak-network evidence;
- accountant/tax facts and judgment-heavy review.

## Permanent runtime/cost guardrails

- no open Detailer job → no live job/media/message monitors;
- hidden/inactive refresh sleeps;
- completed jobs reject new live-message writes;
- no automatic replay of ambiguous non-idempotent writes;
- heavy filtering/aggregation belongs in Postgres rather than Worker loops;
- Functions remain under `/api/*`;
- secrets never belong in browser code or Git.

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Build summaries are release checkpoints; Git history is the archive. Old build-numbered documents must not override these two current authorities.
