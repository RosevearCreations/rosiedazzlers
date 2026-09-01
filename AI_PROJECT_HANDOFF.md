# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 287  
**Updated:** 2026-09-01  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current release state

Development entered Build 287 from the accepted Build 286 checkpoint `c00e118449ece60b39b0d229afdef76ba695ceba`. Build 286 closed the direct customer-review authority gap: a signed-in customer can submit a review only against a booking the server proves belongs to that account and is genuinely completed.

Build 287 is the active **customer review follow-up + referral sharing mechanics** slice. It extends the completed-service trust loop without introducing referral credits, discounts, payouts, loyalty economics, a parallel review store, or a booking-attribution schema.

Production remains closed. `main` remains the deliberately promoted Build 285 Production line at `d99e2a6874e4f387d8b916e7621fb7eb08abf70e`. Never force-move `main` to `dev`; future Production promotion must be a deliberate reconciliation after exact Development evidence is accepted.

## Application boundary

Rosie Dazzlers remains one secured, mobile-first platform with a static-first acquisition website and eight independently loadable modules:

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

## Retained platform authority

Do not regress:

- narrow server-authoritative role/module/action permissions;
- Complete = **Best value**;
- Exterior Detail remains differentiated from Premium Wash;
- current Small/Mid/Oversized + condition/quote pricing authority;
- current availability, conflict, deposit, checkout and payment mechanics;
- one meaningful H1 per indexable public page;
- persistent Finance tax-support/evidence/accountant-package authority;
- no fabricated accounting/tax facts, reviews, consent, proof or provider evidence;
- private/customer media never becomes public without consent/privacy review and explicit publication;
- Rosie brings standard detailing water and power; customers provide a safe/private/permitted work area;
- no background polling merely because a module exists.

## Completed customer/business work through Build 286

- Build 274 established Mobile Quick Book and the retained public/business foundation.
- Build 275 added next useful AM/PM openings, returning-customer acceleration and funnel-exit evidence.
- Build 276 hardened release mechanics.
- Builds 277–280 deepened add-on/local SEO and normalized the self-contained mobile operating model.
- Build 281 hardened exact Cloudflare SHA/deployment acceptance and mutable `dev` alias convergence.
- Build 282 added three high-intent acquisition → existing-booking paths.
- Build 283 separated proof/media pairing, public-use consent/privacy review and explicit publication.
- Build 284 added fail-closed **contextual proof** placement at relevant service/location/use-case decisions.
- Build 285 added authenticated customer history → current booking rebook handoff without carrying old price/deposit/payment authority.
- Build 286 made direct customer reviews completed-booking-only and removed caller authority over vehicle/source/Google URL fields.

Do not re-open these items because an older roadmap mentions them.

## Build 287 — active review follow-up + referral sharing mechanics

### Review/provider boundary

`functions/api/client/reviews_save.js` remains the authenticated completed-booking authority. Build 287 returns the server-owned Rosie Google destination from that endpoint so account code does not invent or trust a browser-supplied provider URL.

The account helper may offer **Review Rosie on Google**, but it must not:

- pre-fill praise or a rating;
- claim a Google review was returned or verified;
- auto-approve or auto-publish the first-party review;
- convert provider activity into public proof without a real later authority.

### Share boundary

The My Account helper offers **Share Rosie** only after the account has at least one completed booking eligible under the Build 286 rule.

The share target is same-origin `/book` with only:

`utm_source=customer_share&utm_campaign=customer_referral`

This is attribution evidence, not a referral reward. Native device sharing is preferred; clipboard copy is a fallback.

### Booking boundary

`assets/customer-share-entry-v287.js` recognizes only the exact Build 287 UTM pair. It may show a neutral “shared by a Rosie customer” notice and emit `customer_share_booking_entry`.

It must not alter package, vehicle, size, add-ons, slot, availability, price, deposit, checkout, Stripe, PayPal, payment state, promo codes or booking notes. Existing booking authority remains authoritative.

### Analytics boundary

Build 287 reuses `assets/public-analytics.js` and `/api/analytics/ingest`. Those authorities already capture `utm_source` and `utm_campaign`. No parallel analytics store or referral ledger is introduced.

Build 287 measures **referral-origin traffic**, not a successful/reward-eligible referral. A future commercial referral model still requires explicit business rules.

### Storage boundary

Build 287 requires **no schema migration**. It reuses current review, booking and analytics authorities and introduces no new customer/reward balance.

## Current validation authority

- cumulative: `scripts/release_check.py`;
- public H1/current customer guards: `scripts/seo_h1_check.py`;
- retained Builds 282–286 focused guards;
- focused Build 287 guard: `scripts/build287_release_check.py`;
- feature source workflow: `.github/workflows/build287-source-gate.yml`;
- Build 287 runtime smoke: `scripts/build287_http_smoke.sh`;
- Build 287 Development runtime workflow: `.github/workflows/build287-development-acceptance.yml`;
- Development source workflow: `.github/workflows/development-source-gate.yml`;
- retained exact/static + alias/full smoke: `scripts/development_http_smoke.sh`;
- full Development deployment workflow: `.github/workflows/cloudflare-development-acceptance.yml`.

A release is not Development-green merely because source exists. The exact feature SHA must pass its source gate and Cloudflare preview before `dev` moves; then exact Development source/runtime/Cloudflare evidence must agree.

## Next business/product work after Build 287

Proceed where work is not blocked by real business/provider evidence:

1. publish genuine consented Rosie proof through the retained Build 283/284 path;
2. verify Google Business Profile/Search Console ownership and provider evidence when account access is available;
3. maintenance-plan product/account/booking path after cadence, price/perks and pause/cancel rules are approved;
4. fleet/workplace acquisition after minimum-vehicle, discount/travel and recurring-service rules are approved;
5. authenticated/mobile/accessibility/weak-network acceptance;
6. Stripe/PayPal provider acceptance and Finance settlement/reconciliation closure;
7. continue modular/security/reliability work without waking dormant subsystems.

## Manual / external evidence that must not be fabricated

- real customer/public-use consent and real proof context;
- Google Business Profile ownership or Google-review return/verification;
- Search Console ownership/indexing evidence;
- maintenance-plan, fleet and referral/loyalty economics not yet approved;
- real email/SMS/Web Push delivery evidence;
- Stripe/PayPal provider acceptance;
- restore/rollback rehearsal evidence;
- accountant/tax judgment.

## Permanent runtime/cost guardrails

- no open Detailer job → no live job/media/message monitors;
- hidden/inactive refresh sleeps;
- completed jobs reject new live-message writes;
- no automatic replay of ambiguous non-idempotent writes;
- heavy aggregation belongs in Postgres rather than Worker loops;
- Functions remain under `/api/*`;
- secrets never belong in browser code or Git.

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Build summaries are release checkpoints; Git history is the archive.

<!-- Historical Build 284 retained-guard compatibility only; not the living build number.
**Build:** 284
Build 284 contextual proof placement remains retained.
-->

<!-- Historical Build 283 retained-guard compatibility only; not the living build number.
**Build:** 283
Build 283 proof/media publication authority remains retained; explicit publish/unpublish still governs public proof.
-->

<!-- Historical Build 274 retained-guard compatibility only.
**Build:** 274
Build 274 active implementation
-->
