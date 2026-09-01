# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 289  
**Updated:** 2026-09-01  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current release state

Build 289 is the active **account accessibility + weak-network/direct-URL resilience** Development slice. It follows the fully accepted Build 288 customer/staff privacy release.

Build 288 is now accepted in both Development and Production. The accepted Development SHA is `dd2c8826eef8ac9fa593c36a9c9238c192bbfab6`; Production `main` uses the deliberate reconciliation commit `4cf8d97bf522080e3146421e70fdf6726437faed` with the same accepted tree.

Build 289 must follow the normal boundary: exact feature source gate + Cloudflare feature preview first, then a non-force Development fast-forward, then Development source/runtime/Cloudflare acceptance. **Production remains closed** for Build 289 unless a later deliberate promotion is explicitly authorized.

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

## Completed customer/business work through Build 288

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

Do not re-open these items because an older roadmap mentions them.

## Build 289 — account accessibility + weak-network resilience

Build 289 improves the existing authenticated customer account without introducing a new authentication, booking, pricing or payment authority.

### Direct signed-out recovery

`/my-account` retains the existing `ClientAuth.signIn()` authority and gains an in-place recovery panel for direct signed-out visits. Customers can sign in from the account page rather than being stranded at a generic dashboard error.

The recovery layer does not duplicate password/session logic; `ClientAuth` continues to call the existing server `/api/client/auth_login` endpoint.

### Weak-network boundary

Network/server-load failures expose an explicit **Retry account load** action. Retry occurs only after customer input and reloads the page. Build 289 adds no timer loop, background polling, automatic write replay or ambiguous non-idempotent retry.

### Accessibility boundary

- account status becomes a polite atomic ARIA status region at runtime;
- recovery status is announced through its own polite live region;
- explicit `:focus-visible` treatment uses Rosie theme tokens;
- narrow-screen recovery actions stack for touch access;
- existing viewport and one-H1 source rules remain intact.

### Privacy/storage/business boundary

Build 288 staff-private field suppression remains loaded and server privacy remains authoritative. Build 289 requires **no schema migration** and changes no package price, availability rule, booking rule, deposit, checkout, Stripe, PayPal, payment state, referral economics, maintenance economics or fleet economics.

## Current validation authority

- cumulative: `scripts/release_check.py`;
- one-H1/current customer guards: `scripts/seo_h1_check.py`;
- retained Builds 271–288 focused guards;
- focused Build 289 guard: `scripts/build289_release_check.py`;
- feature source workflow: `.github/workflows/build289-source-gate.yml`;
- Build 289 runtime smoke: `scripts/build289_http_smoke.sh`;
- Build 289 Development runtime workflow: `.github/workflows/build289-development-acceptance.yml`;
- Development source workflow: `.github/workflows/development-source-gate.yml`;
- retained exact/static + alias/full smoke: `scripts/development_http_smoke.sh`;
- full Development deployment workflow: `.github/workflows/cloudflare-development-acceptance.yml`.

Never call Build 289 Development-green until exact `dev`, Development source/runtime gates and Cloudflare artifact agree.

## Next business/product work after Build 289

Proceed where real evidence/rules exist:

1. genuine consented proof through the retained Build 283/284 path;
2. Google Business Profile/Search Console verification when account access exists;
3. maintenance plan after cadence/economics/pause/cancel rules are approved;
4. fleet/workplace path after minimum-vehicle/discount/travel/commitment rules are approved;
5. further role/action/direct-URL/API, notification-provider and restore/rollback acceptance;
6. payment-provider/Finance settlement-reconciliation closure when that external work is reopened;
7. referral/loyalty economics only after explicit business approval.

## Manual / external evidence that must not be fabricated

- real customer/public-use consent and real proof context;
- Google Business Profile ownership or Google-review return/verification;
- Search Console ownership/indexing evidence;
- maintenance-plan, fleet and referral/loyalty economics not yet approved;
- real email/SMS/Web Push delivery evidence;
- payment-provider acceptance;
- restore/rollback rehearsal evidence;
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
