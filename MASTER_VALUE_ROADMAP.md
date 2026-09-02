# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 292  
**Updated:** 2026-09-02  
**Read first:** `AI_PROJECT_HANDOFF.md`

## North star

Build a professional mobile-first detailing platform connecting:

`search / lead → service/use-case recommendation → quote / booking → assigned work → live customer/detailer interaction → proof → payment → accounting/tax workpaper → genuine review/public proof → referral/rebook → repeat maintenance`

while server work remains event-driven and dormant modules stay asleep.

## Retained baseline

Build 273 remains the retained Finance/tax-support baseline. Builds 274–291 added booking/retention, SEO/local depth, exact-release mechanics, proof/publication, contextual proof, authenticated rebook, completed-job review, neutral review/share attribution, customer/staff privacy, account resilience, deeper authorization acceptance, forward-restore readiness and maintenance interest intake without replacing those foundations.

Build 291 is the accepted Production baseline at `e6ab73751864a12447657ff263a8787f4718d25c`. Build 292 is the active Development-first fleet/workplace acquisition release. **Production remains closed** for Build 292 until deliberate promotion from accepted Development evidence.

Do not regress:

- server-authoritative role/module/action permissions;
- Complete = **Best value**;
- Exterior Detail differentiated from Premium Wash;
- current Small/Mid/Oversized + condition/quote pricing authority;
- booking/deposit/conflict/payment mechanics;
- one meaningful H1 per indexable public page;
- persistent tax-support/evidence/accountant-package authority;
- no fabricated accounting/tax facts, reviews, consent, proof or provider evidence;
- no fabricated maintenance/fleet/referral economics;
- Rosie-supplied standard detailing water and power plus safe/permitted work-area review;
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

### Customer privacy and resilience
Build 288 projects customer profile/vehicle/review data through explicit customer-safe shapes. Build 289 adds in-place signed-out account recovery, manual weak-network retry, ARIA live feedback and keyboard focus treatment without new polling or write replay.

### Authorization / recovery mechanics
Build 290 retains the role/module/action model, adds executable ceiling/narrowing/override acceptance, verifies representative anonymous admin APIs fail closed, makes unexpected staff-auth failures externally generic and defines a non-force forward restore.

### Maintenance retention intake
Build 291 provides a safe interest/demand path. Cadence remains a preference only; no fixed price, discount, perk, priority booking, included recurring scope, pause/cancel term, subscription or recurring billing is approved.

## Build 292 — fleet / workplace acquisition intake

Build 292 hardens the existing fleet/workplace lead and qualification path without inventing fleet economics.

Rules:

- `/fleet` is a quote-first assessment for workplace groups, small-business fleets, contractor/work trucks, household multi-vehicle groups and dealership/overflow review;
- `/fleet-pricing` explains what can affect a quote without publishing an automatic vehicle threshold, commercial rate, volume discount or recurring cycle;
- request type and timing preference tokens are server-allowlisted;
- fleet source attribution is server-owned as `/fleet`;
- the existing `public_inquiry_leads` table remains the lead authority;
- public lead success responses are narrow and do not return stored rows;
- public failures do not expose Supabase/storage details;
- GET on the write endpoint is 405;
- duplicate clicks are blocked while the browser write is in flight;
- runtime acceptance uses pre-persistence validation failures, so CI does not create fleet lead rows;
- Build 292 is migration-free.

No fleet minimum, automatic vehicle threshold, volume discount, commercial rate, same-location/travel economics, fixed cadence, priority/SLA, contract/cancellation economics, recurring billing, quote or appointment is approved by this release.

## Ordered next value work

### 1. Genuine proof + Google trust
Continue real consented proof through Builds 283/284 and verify Google Business Profile/Search Console only when real account evidence exists.

### 2. Maintenance-plan commercial model
Build 291 provides safe demand capture. Commercial behavior remains gated on approved cadence, price/discount or perk model, included/excluded work, pause/cancel policy and any priority-booking promise.

### 3. Fleet commercial model
Build 292 now provides safe fleet/workplace assessment. Minimum vehicle count, same-location economics, travel/discount rules, recurring commitment and cancellation terms remain approval-gated.

### 4. Notification/device evidence
Collect real email/SMS/Web Push and physical phone/tablet/browser evidence when available; do not fabricate it.

### 5. Customer account refinement
Continue completed-job → review/share → rebook → maintenance handoff while preserving current availability/conflict/deposit/payment authority.

### 6. Referral/loyalty commercial model
Build economics only after explicit business approval for qualification, reward value/type, timing, caps, refund handling, abuse controls, tax/accounting and expiry.

### 7. Payments / Finance / accounting
Retain Build 273 authority. Development payment-provider configuration is owner-signed-off as present. Real transaction/settlement/reconciliation acceptance remains evidence-driven and should resume only when deliberately tested; no fabricated provider transaction evidence. Retain evidence links into `accounting_documents` and accountant-friendly export surfaces.

### 8. Continue modular extraction only when it creates value
Preferred high-use order: Operations customer/booking/quote support; Finance payments/reconciliation/tax; I.T. health; Administration Staff/Inventory/Catalog; Socials Content/Photo/SEO/Integrations; DAIP only as privacy/cost/processing gates permit.

## Business input checkpoints

Ask only when needed for a real rule: material pricing/restoration labour, seat-removal/water-intrusion constraints, warranty, maintenance economics, fleet economics, referral economics, insurance/certification/equipment/environmental rules, or real GBP/Search Console account selections. The standard water/power model is resolved and must not be asked again.

## Provider configuration status

The owner confirmed that Stripe, PayPal and other configured providers are present in Cloudflare Development. This remains **Development configuration-present / owner sign-off** only. It does not fabricate a successful Stripe charge, PayPal sandbox transaction, webhook settlement or other provider-side transaction acceptance.

## Validation authority

- `scripts/release_check.py` — cumulative retained platform guard;
- `scripts/seo_h1_check.py` — one-H1 + retained current public/customer guards;
- retained Builds 271–291 focused guards;
- retained Build 290 action matrix + forward-restore checks;
- `scripts/build292_release_check.py` — current fleet/workplace intake guard;
- `.github/workflows/build292-source-gate.yml` — Build 292 feature source gate;
- `scripts/build292_http_smoke.sh` — non-mutating fleet/workplace runtime guard;
- `.github/workflows/build292-development-acceptance.yml` — Build 292 `dev` runtime acceptance;
- `.github/workflows/development-source-gate.yml` — cumulative Development source gate through Build 292;
- `scripts/development_http_smoke.sh` — retained exact/static + alias/full smoke;
- `.github/workflows/cloudflare-development-acceptance.yml` — exact Development deployment acceptance.

Never call a release Development-green merely because source exists. Exact feature SHA, feature Cloudflare preview, exact `dev`, Development source/runtime gates and Cloudflare artifact must agree.

## Documentation policy

Only `AI_PROJECT_HANDOFF.md` and this file are living planning authorities. Build summaries are checkpoints; Git history is the archive.

<!-- Historical Build 291 retained-guard compatibility only; not the living build number.
**Build:** 291
Build 291 maintenance retention intake remains retained.
accounting_documents
accountant-friendly export surfaces
Development configuration-present / owner sign-off remains retained.
Production remains closed
-->

<!-- Historical Build 290 retained-guard compatibility only; not the living build number.
**Build:** 290
Build 290 forward restore authorization authority remains retained.
Development configuration-present / owner sign-off remains retained.
Production remains closed
-->

<!-- Historical Build 289 retained-guard compatibility only; not the living build number.
**Build:** 289
Build 289 accessibility and weak-network account resilience remains retained.
Production remains closed
-->

<!-- Historical Build 288 retained-guard compatibility only; not the living build number.
**Build:** 288
Build 288 customer/staff privacy boundary remains retained.
Production remains closed
-->

<!-- Historical Build 287 retained-guard compatibility only; not the living build number.
**Build:** 287
Build 287 review/share attribution authority remains retained; no referral/loyalty economics are implied.
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

<!-- Historical Build 273 roadmap guard compatibility only.
### 9. Payments / Finance / accounting
accounting_documents
accountant-friendly export surfaces
-->
