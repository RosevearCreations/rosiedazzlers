# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 289  
**Updated:** 2026-09-01  
**Read first:** `AI_PROJECT_HANDOFF.md`

## North star

Build a professional mobile-first detailing platform connecting:

`search / lead → service/use-case recommendation → quote / booking → assigned work → live customer/detailer interaction → proof → payment → accounting/tax workpaper → genuine review/public proof → referral/rebook → repeat maintenance`

while server work remains event-driven and dormant modules stay asleep.

## Retained baseline

Build 272 closed the retained permission/package-clarity/T2125 increment. Build 273 established the retained Finance/tax-support baseline. Builds 274–288 then added booking/retention, SEO/local-depth, exact-release, proof/publication, contextual-proof, authenticated rebook, completed-job review, neutral review/share attribution and the customer/staff privacy boundary without replacing those foundations.

**Production remains closed** for the active Build 289 Development slice. `main` changes only through deliberate promotion from accepted Development evidence. Build 288 itself is already accepted in Production through its deliberate reconciliation release.

Do not regress:

- server-authoritative role/module/action permissions;
- Complete = **Best value**;
- Exterior Detail differentiated from Premium Wash;
- current Small/Mid/Oversized + condition/quote pricing authority;
- booking/deposit/conflict/payment mechanics;
- one meaningful H1 per indexable public page;
- persistent tax-support/evidence/accountant-package authority;
- no fabricated accounting/tax facts, reviews, consent, proof or provider evidence;
- `main` / Production changes only through deliberate promotion from accepted Development evidence.

## Delivered customer/business foundation

### Booking and retention
Builds 274–275 and 285 provide problem-first Quick Book, Saved Garage assistance, true next useful openings, returning-customer shortcuts, authenticated rebook handoff, current-rule recalculation and booking-funnel analytics.

### Service/local acquisition
Builds 277–282 provide deep indexed service/add-on destinations, eight differentiated Oxford/Norfolk location destinations, self-contained mobile water/power positioning, one-H1/canonical/sitemap closure and three high-intent use-case booking paths.

### Proof/publication
Build 283 keeps pairing eligibility separate from consent/privacy approval and explicit publish/unpublish. Build 284 places only eligible real contextual proof; sample fallback never counts as real Rosie proof.

### Review/share authority
Build 286 requires a direct customer review to reference a genuinely completed booking belonging to the signed-in customer. Build 287 adds the server-owned Google destination and neutral Share Rosie UTM attribution without commercial referral economics.

### Customer privacy boundary
Build 288 projects customer profile/vehicle/review data through explicit customer-safe shapes and removes customer write authority over `admin_private_notes`. Legacy staff-private account controls remain suppressed while customer/team/detailer-visible fields remain available.

## Build 289 — account accessibility + weak-network/direct-URL resilience

Build 289 continues the authenticated/mobile/device acceptance track without claiming physical-device evidence that automation cannot prove.

Rules:

- signed-out direct visits to `/my-account` can recover in place through the existing `ClientAuth.signIn()` authority;
- no parallel password/session authority is introduced;
- account status and recovery feedback use polite atomic live-region semantics;
- explicit Rosie-token `:focus-visible` treatment protects keyboard navigation on the recovery surface;
- narrow-screen recovery actions remain touch-friendly;
- network/server-load failures expose a manual **Retry account load** action;
- retry is user-initiated only—no `setInterval`, background polling, automatic write replay or ambiguous non-idempotent retry;
- Build 288 customer/staff privacy suppression remains retained;
- no schema migration, pricing, booking, availability, deposit, checkout, Stripe, PayPal or payment authority changes.

## Ordered next value work

### 1. Authenticated/mobile/device acceptance
After Build 289, continue role/action/direct-URL/API testing, notification-provider evidence, restore/rollback rehearsal, and targeted phone/tablet/desktop checks where real device/browser evidence is available. Build 289 closes the first keyboard/focus + weak-network account-recovery slice but does not fabricate physical-device evidence.

### 2. Publish genuine proof
Use the retained Build 283/284 path only for real, consented Rosie work with accurate vehicle, condition and **problem → process → result** context. Never fabricate proof or consent.

### 3. Google trust and measurable SEO
When account access is available, verify Google Business Profile ownership/review source and Search Console/sitemap evidence. Do not fabricate provider evidence.

### 4. Maintenance-plan product and retention
Build only after cadence, price/discount or perk model, included/excluded work, pause/cancel policy and any priority-booking promise are approved.

### 5. Fleet / workplace acquisition
Create a separate business lead/quote path after minimum vehicle count, same-location economics, travel/discount rules, recurring commitment and cancellation terms are approved.

### 6. Customer account refinement
Continue completed-job → review/share → rebook → maintenance handoff while preserving current availability/conflict/deposit/payment authority.

### 7. Genuine review/public proof connection
When real provider/account authority exists, record provider review status only when genuinely returned/verified and publish only through explicit approval/publication.

### 8. Referral/loyalty commercial model
Build economics only after explicit business approval for qualification, reward value/type, timing, caps, refund handling, abuse controls, tax/accounting and expiry. Builds 287–289 do not pre-decide these rules.

### 9. Payments / Finance / accounting
Retain Build 273 authority. Payment-provider acceptance is currently deferred while the external Stripe work is being handled separately. When that scope is reopened, continue test deposit/final balance/refund/webhook/idempotency acceptance; PayPal sandbox parity if retained; settlement/reconciliation; evidence links into `accounting_documents`; accountant-friendly export surfaces; narrow journal/refund/tax/payroll actions; no fabricated tax judgment.

### 10. Continue modular extraction only when it creates value
Preferred high-use order: Operations customer/booking/quote support; Finance payments/reconciliation/tax; I.T. health; Administration Staff/Inventory/Catalog; Socials Content/Photo/SEO/Integrations; DAIP only as privacy/cost/processing gates permit.

## Business input checkpoints

Ask only when needed for a real rule: material pricing/restoration labour, seat-removal/water-intrusion constraints, warranty, maintenance economics, fleet economics, referral economics, insurance/certification/equipment/environmental rules, or real GBP/Search Console account selections. The standard water/power model is resolved and must not be asked again.

## Validation authority

- `scripts/release_check.py` — cumulative retained platform guard;
- `scripts/seo_h1_check.py` — one-H1 + retained current public/customer guards;
- retained Builds 282–288 focused guards;
- `scripts/build289_release_check.py` — current accessibility/weak-network account guard;
- `.github/workflows/build289-source-gate.yml` — feature source gate;
- `scripts/build289_http_smoke.sh` — Build 289 non-mutating HTTP runtime guard;
- `.github/workflows/build289-development-acceptance.yml` — Build 289 `dev` runtime acceptance;
- `.github/workflows/development-source-gate.yml` — cumulative Development source gate through Build 289;
- `scripts/development_http_smoke.sh` — retained exact/static + alias/full smoke;
- `.github/workflows/cloudflare-development-acceptance.yml` — exact Development deployment acceptance.

Never call a release Development-green merely because source exists. Exact feature SHA, feature Cloudflare preview, exact `dev`, Development source/runtime gates and Cloudflare artifact must agree.

## Documentation policy

Only `AI_PROJECT_HANDOFF.md` and this file are living planning authorities. Build summaries are checkpoints; Git history is the archive.

<!-- Historical Build 288 retained-guard compatibility only; not the living build number.
**Build:** 288
Build 288 customer/staff privacy boundary remains retained.
Production remains closed
-->

<!-- Historical Build 284 retained-guard compatibility only; not the living build number.
**Build:** 284
Build 284 contextual proof placement remains retained.
-->

<!-- Historical Build 283 retained-guard compatibility only; not the living build number.
**Build:** 283
Build 283 publication authority remains retained; explicit publish/unpublish governs public proof.
-->

<!-- Historical Build 274 retained-guard compatibility only.
**Build:** 274
Build 274 — active
contextual help
Mobile Quick Book
Google trust and measurable local SEO
-->

<!-- Historical Build 287 retained-guard compatibility only; not the living build number.
**Build:** 287
Build 287 review/share attribution authority remains retained; no referral/loyalty economics are implied.
-->
