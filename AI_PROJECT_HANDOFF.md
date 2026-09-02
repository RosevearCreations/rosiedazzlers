# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 292  
**Updated:** 2026-09-02  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current release state

Build 292 is the active **fleet / workplace acquisition intake authority** Development-first slice. It starts from accepted Production Build 291 at `e6ab73751864a12447657ff263a8787f4718d25c` and advances the existing public fleet path without inventing commercial fleet economics.

Build 292 follows the normal release boundary: exact feature source gate + Cloudflare feature preview, then a non-force Development fast-forward, then exact Development source/runtime/Cloudflare acceptance. **Production remains closed** for Build 292 until deliberate promotion from accepted Development evidence.

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

The following remain authoritative while Build 292 advances acquisition:

- server-authoritative role/module/action permissions and Build 290 executable authorization proof;
- Build 290 non-force forward restore mechanics and Build 289 restore anchor;
- Build 291 maintenance retention intake remains interest-only and migration-free;
- Complete = **Best value** and Exterior Detail remains differentiated from Premium Wash;
- current Small/Mid/Oversized + condition/quote pricing authority;
- current availability, conflict, deposit, checkout and payment mechanics;
- one meaningful H1 per indexable public page;
- persistent Finance tax-support/evidence/accountant-package authority;
- no fabricated accounting/tax facts, reviews, consent, proof or provider evidence;
- private/customer media never becomes public without consent/privacy review and explicit publication;
- Rosie brings standard detailing water and power; customers provide a safe/private/permitted work area;
- no background polling merely because a module exists.

## Build 292 — fleet / workplace acquisition intake

Build 292 converts the existing `/fleet` and `/fleet-pricing` paths into a quote-first assessment experience using the existing `public_inquiry_leads` authority.

### Public acquisition authority

- `/fleet` covers workplace groups, small-business fleets, contractor/work trucks, household multi-vehicle groups, dealership/overflow review and repeat-service interest;
- the form gathers contact/business identity, service area, approximate vehicle count, request type, timing preference, photo/media links and vehicle/site-condition notes;
- timing is a **preference only**;
- Rosie’s standard water/power authority is retained and unusual site restrictions are reviewed before dispatch;
- `/fleet-pricing` explains quote planning without publishing an automatic threshold, commercial rate, discount or recurring cycle;
- one-H1, canonical and existing route-copy parity remain required.

### Intake/API authority

- the existing `functions/api/public_lead_submit.js` and `public_inquiry_leads` remain the single public inquiry authority;
- fleet request type and timing tokens are server-allowlisted;
- fleet source is server-owned as `/fleet`;
- the browser cannot create a quote, appointment or recurring commitment by submitting the assessment;
- successful responses are narrow and do not return the stored database row;
- Supabase/storage failures stay server-side and public errors remain generic;
- GET on the write endpoint is 405;
- the UI blocks repeat clicks while a write is in flight;
- Build 292 runtime smoke uses only pre-persistence validation failures and must not create a Development lead row.

### Commercial/data boundary

Build 292 does **not** approve or promise:

- a fleet minimum or automatic vehicle threshold;
- a volume discount or commercial rate;
- fixed same-location economics or travel pricing;
- a fixed recurring cadence;
- priority booking or an SLA;
- contract or cancellation economics;
- recurring billing;
- a quote or appointment simply because an assessment is submitted.

There is **no schema migration**. Additional fleet context is normalized into the existing public inquiry record rather than creating a second lead/customer/quote authority.

## Retained Build 291 maintenance authority

Maintenance remains an interest request only. Timing options remain preferences and do not create an appointment, subscription, recurring billing authorization, fixed price, discount, perk or priority-booking promise. Current booking availability, vehicle/service review, scope, add-ons, deposits, payments and site-access rules remain authoritative.

The owner-confirmed Stripe, PayPal and other provider state remains **Development configuration-present / owner sign-off** only. It is not transaction acceptance and must not be rewritten as proof of a real charge, PayPal sandbox transaction, webhook settlement or provider-side acceptance.

## Current validation authority

- cumulative: `scripts/release_check.py`;
- one-H1/current customer guards: `scripts/seo_h1_check.py`;
- retained Builds 271–291 focused guards;
- retained Build 290 executable authorization/restore proofs;
- Build 292 focused guard: `scripts/build292_release_check.py`;
- feature source workflow: `.github/workflows/build292-source-gate.yml`;
- Build 292 non-mutating runtime smoke: `scripts/build292_http_smoke.sh`;
- Build 292 Development runtime workflow: `.github/workflows/build292-development-acceptance.yml`;
- cumulative Development source workflow: `.github/workflows/development-source-gate.yml` through Build 292;
- retained exact/static + alias/full smoke: `scripts/development_http_smoke.sh`;
- full Development deployment workflow: `.github/workflows/cloudflare-development-acceptance.yml`.

Never call Build 292 Development-green until exact feature SHA + feature preview, exact `dev`, Development source/runtime gates and Cloudflare artifact agree.

## Next value work after Build 292

Proceed where real evidence/rules exist:

1. genuine consented proof through the retained Build 283/284 path;
2. Google Business Profile/Search Console verification when account access exists;
3. maintenance commercial rules only after cadence/economics/included scope/pause/cancel/priority terms are approved;
4. fleet economics only after minimum count, same-location/travel, discount, commitment and cancellation rules are approved;
5. notification-provider and targeted real-device/browser evidence when available;
6. payment settlement/reconciliation evidence only when real transaction testing is deliberately reopened;
7. referral/loyalty economics only after explicit business approval.

## Manual / external evidence that must not be fabricated

- real customer/public-use consent and real proof context;
- Google Business Profile ownership or Google-review return/verification;
- Search Console ownership/indexing evidence;
- maintenance-plan, fleet and referral/loyalty economics not yet approved;
- real email/SMS/Web Push delivery evidence;
- provider transaction acceptance beyond Development configuration-present sign-off;
- accountant/tax judgment;
- physical-device acceptance beyond automated responsive/runtime checks.

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
