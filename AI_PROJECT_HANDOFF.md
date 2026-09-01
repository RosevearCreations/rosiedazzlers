# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 288  
**Updated:** 2026-09-01  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current release state

Development entered Build 288 from the accepted Build 287 checkpoint `8e188489674da3a1f727ea410e202e62216f8880`. Build 287 closed the migration-free completed-service review/share attribution loop while keeping referral economics unapproved.

Build 288 is the active **customer/staff privacy boundary + authenticated/mobile/device acceptance** slice. It removes customer authority over staff-private note fields, narrows customer-facing API shapes, restores safe account-preference reload behavior, and brings the cumulative Development source gate current through Build 288.

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

## Completed customer/business work through Build 287

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
- Build 287 added neutral Google review follow-up, Share Rosie and analytics-only referral-origin booking entry without referral economics.

Do not re-open these items because an older roadmap mentions them.

## Build 288 — active customer/staff privacy boundary

### Staff-private field boundary

Customer-facing profile and vehicle APIs may read broad service-role rows internally, but responses must pass through explicit customer-safe projections before leaving the Worker. `admin_private_notes` is staff-only and must never be customer-readable or customer-writable authority.

The existing customer-owned fields remain valid: general notes, client-private preferences, notes for team and detailer-visible notes. Build 288 does not convert those into staff-only fields.

### My Account boundary

`assets/customer-privacy-v288.js` hides and disables the two legacy admin-only controls on `/my-account`. This is presentation hardening only; server omission of `admin_private_notes` from profile/vehicle writes is the actual authorization boundary.

The dashboard reloads the authenticated profile and returns only the customer-safe projection so legitimate profile preferences saved by the customer remain available after reload.

### Review boundary

Build 286/287 completed-booking review authority remains unchanged. Build 288 only projects the returned review row through the customer-safe shape so future staff-only review metadata cannot leak through a broad service-role response.

### Auth/device/runtime boundary

Anonymous customer mutation endpoints remain fail-closed. Build 288 runtime smoke verifies profile, vehicle and review denial without a session; signed-out dashboard behavior; the responsive My Account bootstrap; and the deployed privacy helper.

Build 288 does not add a service worker or claim a full PWA implementation. Existing mobile-first viewport/layout behavior is retained while broader real-device/accessibility/weak-network acceptance continues as evidence work.

### Release mechanics

The cumulative Development Source Gate now runs focused Builds 271–288, including Builds 286 and 287 that previously depended on their separate workflows. Exact feature preview and exact Development evidence remain mandatory before any release is called green.

Build 288 requires **no schema migration** and changes no pricing, booking, deposit or payment authority.

## Current validation authority

- cumulative: `scripts/release_check.py`;
- public H1/current customer guards: `scripts/seo_h1_check.py`;
- retained Builds 282–287 focused guards;
- focused Build 288 guard: `scripts/build288_release_check.py`;
- feature source workflow: `.github/workflows/build288-source-gate.yml`;
- Build 288 runtime smoke: `scripts/build288_http_smoke.sh`;
- Build 288 Development runtime workflow: `.github/workflows/build288-development-acceptance.yml`;
- Development source workflow: `.github/workflows/development-source-gate.yml`;
- retained exact/static + alias/full smoke: `scripts/development_http_smoke.sh`;
- full Development deployment workflow: `.github/workflows/cloudflare-development-acceptance.yml`.

A release is not Development-green merely because source exists. The exact feature SHA must pass its source gate and Cloudflare preview before `dev` moves; then exact Development source/runtime/Cloudflare evidence must agree.

## Next business/product work after Build 288

Proceed where work is not blocked by real business/provider evidence:

1. continue authenticated role/action/direct-URL/API and real-device/accessibility/weak-network acceptance;
2. publish genuine consented Rosie proof through the retained Build 283/284 path;
3. verify Google Business Profile/Search Console ownership and provider evidence when account access is available;
4. maintenance-plan product/account/booking path after cadence, price/perks and pause/cancel rules are approved;
5. fleet/workplace acquisition after minimum-vehicle, discount/travel and recurring-service rules are approved;
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
I.T. Connections
Quick Book
Mobile Auto Detailing & Interior/Exterior Restoration
-->

<!-- Historical Build 287 retained-guard compatibility only; not the living build number.
**Build:** 287
Build 287 review follow-up + referral sharing mechanics remain retained.
-->
