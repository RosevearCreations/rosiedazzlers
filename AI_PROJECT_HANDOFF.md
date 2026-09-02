# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 294  
**Updated:** 2026-09-02  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current release state

Build 294 is the active **customer maintenance / auto-schedule authority closure** Development-first slice. It follows the accepted Build 293 Production promotion at SHA `449edcfdea101fa9cbc6b0336ad2f17d04327b9a`.

Build 293 remains the accepted Production baseline until Build 294 is deliberately promoted. Build 290 remains the retained authorization/direct-URL/API + forward-restore authority, with Build 289 as its verified restore anchor.

Build 294 follows the normal boundary: exact feature source gate + Cloudflare feature preview first, then a non-force Development fast-forward, then Development source/runtime/Cloudflare acceptance. **Production remains closed** for Build 294 until deliberate promotion from accepted Development evidence.

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

## Retained Build 272/273 authority

**Build 273 is the retained Finance/tax-support baseline.** These retained authorities remain live while later customer/business releases advance:

- narrow Operations/Finance action permissions;
- server-authoritative role/module/action permissions;
- Finance tax-support writes retain `finance.tax.manage` while reads remain narrowly scoped;
- persistent Finance tax-support records, evidence links, T2125 workpaper and accountant-package workflow remain retained;
- Complete = **Best value**;
- Exterior Detail remains differentiated from Premium Wash;
- current Small/Mid/Oversized + condition/quote pricing authority;
- current availability, conflict, deposit, checkout and payment mechanics;
- one meaningful H1 per indexable public page;
- no fabricated accounting/tax facts, reviews, consent, proof or provider evidence;
- private/customer media never becomes public without consent/privacy review and explicit publication;
- Rosie brings standard detailing water and power; customers provide a safe/private/permitted work area;
- no background polling merely because a module exists.

## Completed customer/business work through Build 294

- Build 274 established Mobile Quick Book, I.T. Connections/help and the retained public/business foundation.
- Build 275 added next useful AM/PM openings, returning-customer acceleration and funnel-exit evidence.
- Build 276 hardened release mechanics.
- Builds 277–280 deepened add-on/local SEO and normalized the self-contained mobile operating model.
- Build 281 hardened exact Cloudflare SHA/deployment acceptance and mutable `dev` alias convergence.
- Build 282 added three high-intent acquisition → existing-booking paths.
- Build 283 separated proof/media pairing, public-use consent/privacy review and explicit publication.
- Build 284 added fail-closed **contextual proof** placement at relevant service/location/use-case decisions.
- Build 285 added authenticated customer history → current booking rebook handoff without carrying old price/deposit/payment authority.
- Build 286 made direct customer reviews completed-booking-only and removed caller authority over vehicle/source/Google URL fields.
- Build 287 added neutral Google/share follow-up and referral-origin attribution without referral economics.
- Build 288 closed the customer/staff privacy boundary with customer-safe response projections and no customer write authority over `admin_private_notes`.
- Build 289 added in-place signed-out account recovery, manual weak-network retry, ARIA live feedback and keyboard focus treatment without new polling or write replay.
- Build 290 deepened role/module/action acceptance, anonymous direct-API fail-closed behavior, staff-auth non-disclosure and non-force forward restore readiness.
- Build 291 added maintenance retention intake as a preference-only interest request with narrow public responses and no maintenance-plan economics.
- Build 292 added quote-first fleet/workplace assessment without inventing fleet thresholds, rates, discounts, cadence or contracts.
- Build 293 added one authenticated “What’s next?” customer action coordinating retained review, rebook, progress and current-booking authorities.
- Build 294 removes customer mutation/projection authority for staff-owned maintenance scheduling fields while retaining database history and staff planning authority.

Do not re-open these items because an older roadmap mentions them.

## Retained Build 290 reliability authority

Build 290 remains authoritative while later acquisition/retention work advances:

- existing role/module/action ceilings remain server-authoritative;
- executable matrix coverage verifies module narrowing, action grants/denials and cross-module ceiling protection;
- representative anonymous Operations/quote/Finance requests fail closed before mutation/action disclosure;
- protected admin direct URLs remain static noindex shells with business/customer records behind authenticated APIs;
- unexpected shared staff-auth failures return generic external text rather than raw configuration/exception details;
- exact Build 289 SHA/tree remain the restore anchor;
- restore uses a **forward restore commit**, never force/ref rewind, and never moves Production `main`.

## Retained Build 291 maintenance authority

Build 291 remains the maintenance retention intake authority.

### Public maintenance authority

- static `/maintenance-plan` source must match the safe public growth-settings authority before JavaScript hydration;
- timing options are **preferences only**, not promised cadence;
- the page explicitly states that an interest request does not create an appointment, subscription, recurring billing authorization, fixed price, discount, perk or priority-booking promise;
- current availability, vehicle condition/review, service scope, add-ons, deposits, payments, site access and booking rules remain authoritative;
- Rosie’s standard water/power model and safe work-area requirement remain unchanged.

### Maintenance intake/API authority

- the public endpoint allowlists timing preference tokens;
- browser-controlled `source_url` is removed; the server records `/maintenance-plan`;
- successful responses are narrow and do not return the persisted database row;
- Supabase/storage failure details stay server-side and public errors remain generic;
- the UI blocks repeat clicks while a write is in flight;
- runtime acceptance uses only pre-persistence validation failures, so smoke tests do not create waitlist rows.

### Maintenance commercial boundary

Build 291 does **not** approve maintenance price, discount, perk, fixed frequency, priority booking, recurring billing, included/excluded recurring scope, pause/cancel policy or an appointment. There is **no schema migration**.

### Provider configuration sign-off

On 2026-09-01 the owner confirmed PayPal, Stripe and the other configured providers are already present in Cloudflare Development. Record this as **Development configuration-present / owner sign-off**. It is not transaction acceptance and must not be rewritten as proof of a real Stripe charge, PayPal sandbox transaction, webhook settlement or provider-side acceptance result.

## Retained Build 292 fleet / workplace acquisition authority

Build 292 hardens the existing fleet/workplace acquisition path without inventing commercial fleet rules.

- `/fleet` is a quote-first assessment for workplace groups, small-business fleets, contractor/work trucks, household multi-vehicle groups, dealership/overflow review and repeat-service interest;
- `/fleet-pricing` explains scope-first quote planning without an automatic threshold, commercial rate, volume discount or recurring cycle;
- fleet request type and timing tokens are server-allowlisted;
- `functions/api/public_lead_submit.js` and `public_inquiry_leads` remain the single public inquiry authority;
- fleet source is server-owned as `/fleet`;
- successful responses are narrow and do not return stored database rows;
- runtime acceptance does not create a Development fleet lead row;
- Build 292 does not approve a fleet minimum, automatic threshold, volume discount, commercial rate, fixed cadence, priority/SLA, contract/cancellation economics, recurring billing, quote or appointment;
- there is no Build 292 schema migration.

## Retained Build 293 customer next-action authority

Build 293 coordinates existing authenticated customer authorities instead of creating another customer service.

- `/api/client/dashboard` remains the read authority for booking history, vehicles and customer-safe reviews;
- the hub may direct the customer to completed-service review, retained Build 285 rebook handoff, existing progress or current booking;
- customer-safe review projection retains `booking_id` so an already-reviewed completed booking is not re-prompted;
- current vehicle size, availability, add-ons, price, deposit and payment rules are recalculated by the current booking authority;
- Build 289 remains manual recovery and Build 293 does not poll, auto-retry or replay writes;
- Build 293 introduced no schema migration or new customer write authority.

## Build 294 — customer maintenance / auto-schedule authority closure

Build 294 closes the stale customer recurrence controls beneath the Build 291/293 presentation boundary.

### Customer scheduling boundary

The signed-in customer vehicle API no longer accepts or persists customer-supplied values for:

- `next_cleaning_due_at`;
- `next_service_mileage_km`;
- `service_interval_days`;
- `auto_schedule_opt_in`.

The customer-safe vehicle projection no longer returns those fields. Existing database values are not deleted and staff-owned historical/planning authority is not migrated away.

### Account presentation boundary

A bounded Build 294 account adapter keeps the legacy control IDs DOM-compatible but hidden and disabled, so the older inline account renderer does not break. The customer sees the Build 291 interest-only maintenance path instead of recurrence controls. The adapter is event-driven through account-status changes and does not poll, submit maintenance interest, replay writes or auto-schedule anything.

### Commercial/data boundary

Build 294 does **not** define or approve a due date, service-mileage target, cadence, price, discount, perk, priority, appointment, subscription, recurring billing, included/excluded recurring scope or pause/cancel policy.

There is **no schema migration**. `/maintenance-plan` remains the dedicated preference/follow-up path.

## Current validation authority

- cumulative: `scripts/release_check.py`;
- one-H1/current customer guards: `scripts/seo_h1_check.py`;
- retained Builds 271–293 focused guards;
- retained Build 290 executable authorization/restore proofs;
- focused Build 294 guard: `scripts/build294_release_check.py`;
- feature source workflow: `.github/workflows/build294-source-gate.yml`;
- Build 294 runtime smoke: `scripts/build294_http_smoke.sh`;
- Build 294 Development runtime workflow: `.github/workflows/build294-development-acceptance.yml`;
- Development source workflow: `.github/workflows/development-source-gate.yml` through Build 294;
- retained exact/static + alias/full smoke: `scripts/development_http_smoke.sh`;
- full Development deployment workflow: `.github/workflows/cloudflare-development-acceptance.yml`.

Never call Build 294 Development-green until exact feature SHA + feature preview, exact `dev`, Development source/runtime gates and Cloudflare artifact agree.

## Next business/product work after Build 294

Proceed where real evidence/rules exist:

1. inspect remaining customer account legacy controls/copy for stale commercial or staff-owned authority and close only objectively unsafe remnants;
2. genuine consented proof through the retained Build 283/284 path;
3. Google Business Profile/Search Console verification when account access exists;
4. maintenance commercial rules only after cadence/economics/included scope/pause/cancel/priority terms are approved;
5. fleet commercial rules only after minimum count, same-location/travel, discount, commitment and cancellation terms are approved;
6. notification-provider and targeted real-device/browser evidence when available;
7. payment settlement/reconciliation evidence only when real transaction testing is deliberately reopened;
8. referral/loyalty economics only after explicit business approval.

## Manual / external evidence that must not be fabricated

- real customer/public-use consent and real proof context;
- Google Business Profile ownership or Google-review return/verification;
- Search Console ownership/indexing evidence;
- maintenance-plan, fleet and referral/loyalty economics not yet approved;
- real email/SMS/Web Push delivery evidence;
- provider transaction acceptance beyond the current Development configuration-present sign-off;
- accountant/tax judgment;
- physical-device acceptance beyond what automated responsive/runtime checks can prove.

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

<!-- Historical Build 293 retained-guard compatibility only; not the living build number.
**Build:** 293
Build 293 — customer retention next-action hub
customer-safe review projection retaining `booking_id`
Customer maintenance/auto-schedule authority closure
Production remains closed
-->

<!-- Historical Build 292 retained-guard compatibility only; not the living build number.
**Build:** 292
Build 292 fleet / workplace acquisition intake remains retained.
Production remains closed
-->

<!-- Historical Build 291 retained-guard compatibility only; not the living build number.
**Build:** 291
Build 291 maintenance retention intake remains retained.
Development configuration-present / owner sign-off remains retained.
Production remains closed
-->

<!-- Historical Build 290 retained-guard compatibility only; not the living build number.
**Build:** 290
Build 290 forward restore and authorization acceptance remain retained.
Development configuration-present / owner sign-off remains retained.
Production remains closed
-->

<!-- Historical Build 289 retained-guard compatibility only; not the living build number.
**Build:** 289
Build 289 account accessibility and weak-network resilience remains retained.
Production remains closed
-->

<!-- Historical Build 288 retained-guard compatibility only; not the living build number.
**Build:** 288
Build 288 customer/staff privacy boundary remains retained.
Production remains closed
-->

<!-- Historical Build 287 retained-guard compatibility only; not the living build number.
**Build:** 287
Build 287 review/share attribution authority remains retained.
Production remains closed
-->

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
I.T. Connections
Quick Book
Mobile Auto Detailing & Interior/Exterior Restoration
-->
