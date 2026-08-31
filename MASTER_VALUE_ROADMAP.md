# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 274  
**Updated:** 2026-08-30  
**Read first:** `AI_PROJECT_HANDOFF.md`

## North star

Build a professional **mobile-first detailing application** connecting:

`search / lead → recommendation / quote → booking → assigned work → live customer/detailer interaction → proof → payment → accounting/tax workpaper → review/public proof → repeat maintenance`

while dormant modules stay asleep and server work is driven by real business events rather than background polling.

The public website is the crawlable acquisition layer. Booking and all authenticated Customer/Detailer/Operations/Admin/I.T./Finance/DAIP/Socials experiences are application workflows optimized for phone/touch use first, then tablet/desktop.

## Retained baseline

Build 272 closed the permission/package-clarity/T2125 increment. Build 273 established the retained Finance/tax-support baseline. Build 274 is the only active release.

Do not regress:

- server-authoritative role/module/action permissions;
- Complete = **Best value**;
- Exterior Detail differentiated from Premium Wash;
- current Small/Mid/Oversized + condition/quote pricing authority;
- booking/deposit/conflict mechanics;
- one meaningful H1 per indexable public page;
- persistent tax-support/evidence/accountant-package authority;
- no fabricated accounting/tax facts, reviews or provider evidence.

## Current architecture

Eight independently loadable modules remain authoritative:

1. Customer
2. Detailer
3. Operations / Supervisor
4. Business Administration
5. I.T. & Reliability
6. Finance
7. DAIP
8. Socials & Promotion

Authorization layers remain:

1. role/module ceiling;
2. per-user module narrowing;
3. global module runtime availability;
4. explicit action permission;
5. workflow/business-state checks.

Admin is all-modules/all-actions by design. Server authorization is authoritative. Dormant modules do not wake merely because they exist or a user could access them.

## Build 274 — active

### 1. I.T. Connections / contextual help

I.T. Connections is the authoritative catalogue for external/runtime dependencies actually used or deliberately prepared by Rosie.

Required behavior:

- exact variable/secret/binding name;
- configured/missing presence only;
- safe storage type/location;
- why Rosie needs it and what changing it affects;
- step-by-step acquisition/configuration behind a circular `i`;
- prerequisites, roles/scopes and callback/redirect setup;
- bounded test procedure and troubleshooting;
- official provider resources;
- no raw secret display or browser credential editor.

Shared contextual help is an application-level system. `AdminPageInit`, `AdminMenu` and the Build 274 legacy `AdminShell` compatibility bridge load help fail-open so help failure never blocks authentication or protected-page startup.

### 2. Google trust and measurable local SEO

Priority order:

1. **Real review authority** — source is now guarded against invented/sample homepage testimonials. Verified review content may render only from a genuine connected source. Google Business Profile ownership/review connection remains external acceptance.
2. **Search Console authority** — verify ownership/property/sitemap and use query/page/impression/click/CTR/position data to prioritize future SEO work.
3. **Service authority pages** — every major service/add-on page should explain condition range, process, expected result/limits, time/price drivers, FAQ, proof and booking path.
4. **Proof at point of decision** — before/after evidence belongs on the exact service/local page it proves, not only in a generic Gallery.
5. **Distinct local pages** — Oxford/Norfolk town pages must earn their existence through useful local facts, jobs/proof, access/service conditions, seasonal concerns, FAQs and direct booking paths. Do not mass-produce city-swapped doorway pages.
6. **Business identity** — keep LocalBusiness/Organization/Breadcrumb structured data coherent from a single authority.
7. **Technical SEO** — one H1, canonical URLs, sitemap, crawlable static-first copy, strong internal links, useful titles/descriptions and no public R2 enumeration.
8. **SEO cockpit** — surface high-impression/low-CTR, page-two and non-branded opportunities inside I.T./SEO when Search Console is connected.

Public positioning is:

> **Mobile Auto Detailing & Interior/Exterior Restoration**

while preserving “mobile auto detailing” as the high-intent primary category.

### 3. Condition-based specialist services

The market gap is not more generic wash SKUs; it is **specialization, condition-aware pricing, convenience and proof**.

#### Interior Carpet / Spill / Floor Restoration

Current catalog authority is not the older stale $79/$99/$119 model. Build 274 follows the current branch catalog:

- routine carpet shampoo: **Small $99 / Mid $129 / Oversize $159**;
- heavy salt / beverage / repeated extraction: **From $129–$159+**;
- saturated floor / under-carpet restoration: **From $299+ / inspection quote**.

`/carpet-shampoo` now crawlably distinguishes routine shampoo from deeper extraction and water-intrusion recovery, explains safe seat/trim access, carpet lifting where appropriate, drying/follow-up, hidden moisture, odour, biological-growth and corrosion risks, and routes severe work into photo/inspection review. It must not claim mould/mold remediation.

#### Headlight Restoration

`/headlight-restoration` now crawlably explains current condition tiers:

- light haze / early coating failure: **From $99 per pair**;
- moderate oxidation: **From $129 per pair**;
- heavy oxidation / rough lens: **From $169+ per pair**.

It explains inspection, sanding/refining, polishing, UV protection, price drivers and realistic limits. Cracks, internal haze/moisture, reflector/electrical failure and severe material damage may require repair/replacement. No warranty is promised until explicitly approved as a business rule.

#### Next service opportunities

1. Ontario seasonal services: Spring Salt Recovery, Post-Winter Interior Reset, Fall/Winter Protection.
2. Pre-Sale / Lease-Return Detail.
3. Maintenance plans: Initial Reset → 4/6/8-week recurring maintenance → seasonal deep reset.
4. Fleet/workplace detail days for contractors, service businesses and small fleets.
5. PPF, rustproofing/undercoating and other certification/equipment-heavy services remain later build-vs-buy/partner decisions.

### 4. Resolved mobile operating authority

This is **not** an open business question:

> **Rosie brings standard detailing water and power. The customer provides a safe/private work area. Unusual parking, apartment/condo access, site rules, weather or local runoff constraints are reviewed before dispatch.**

Browser/server pricing normalization, the homepage and the first guarded specialist pages now use this authority. Do not reintroduce “customer provides water/power” as the normal rule.

Fleet/business intake may still ask about site/access constraints and unusual utility/runoff restrictions, but that does not change the default Rosie-supplied model.

### 5. Mobile Quick Book

Preserve the current booking engine's availability, service-area, pricing, size, quote, deposit, conflict and payment authorities. Simplify what the customer sees.

The first Build 274 **Mobile Quick Book** presentation layer is implemented over the existing booking engine:

- problem-first “What does your vehicle need?” choices;
- year/make/model essentials with existing vehicle-size suggestion;
- Saved Garage path for returning customers;
- optional vehicle fields behind disclosure;
- existing authoritative package/add-on controls, not a second pricing engine;
- quote/photo branch for severe/variable conditions;
- existing calendar with first useful days surfaced;
- preserved quote, deposit, service-area, capacity and 409 conflict behavior;
- `booking_quick_need_pick` instrumentation.

Next booking refinements:

1. evolve day shortcuts into true next-three useful appointment choices;
2. shorten returning-user rebook to `saved vehicle → repeat/maintenance service → next opening → deposit`;
3. complete funnel measurement through recommendation, slot, quote/photo, checkout, payment and repeat maintenance;
4. validate touch/mobile/keyboard/weak-network behavior in Development.

### 6. Proof / reviews / content engine

Public proof must follow **problem → process → result**.

For each accepted proof item retain:

- service/condition;
- before evidence;
- process/technique evidence where useful;
- after result;
- town/service area;
- vehicle type;
- customer publication-consent state;
- relevant public page(s);
- legitimate review/testimonial source where associated.

DAIP/Photo Studio can prepare proof, but private/customer evidence never becomes public without consent/review. Sample/fabricated testimonials are permanently prohibited from public review presentation.

### 7. Maintenance and retention

Target behavior:

- completion suggests the next approved maintenance interval;
- customer can accept a reminder/plan without re-entering vehicle data;
- account shows next recommended service and a short rebook path;
- Operations sees recurring demand/capacity;
- Finance can measure discounts/perks and margin;
- customers can pause/cancel according to approved rules;
- no polling merely because a plan exists.

Exact plan price/cadence/perks/cancellation rules remain a business-input checkpoint.

### 8. Fleet / workplace acquisition

Create a business lead/quote path capturing business/contact, location, vehicle count/type/use, frequency, service priorities, site/access constraints, preferred windows, photos/fleet list and recurring-contract interest.

Rosie brings normal mobile detailing utilities; fleet intake should ask only about unusual site/utility/runoff constraints. Do not force a fleet prospect through the one-vehicle consumer booking flow.

Minimum vehicle count, discounts and travel rules remain business-input checkpoints.

### 9. Payments / Finance / accounting

Retain Build 273 authority and continue the Build 274 closure queue through:

1. Stripe deposit/payment/final-balance/refund/webhook state transitions and idempotency;
2. PayPal sandbox/order/capture/webhook parity where retained;
3. settlement/reconciliation links into Finance;
4. receipt/evidence linking into `accounting_documents`;
5. accountant-friendly export surfaces while preserving one data authority;
6. narrow permissions for journals, adjustments, tax close/lock, payroll finalization, refunds/settlements and sensitive exports.

Provider credentials and real settlement evidence remain external acceptance, not source-green substitutes.

### 10. Permissions / module extraction / reliability

Continue explicit high-risk action extraction when affected workflows are changed. Do not broaden roles merely to make a page work.

Continue moving high-use compatibility pages into lazy module surfaces in this order:

1. Operations customer/booking/quote support;
2. Finance accounting/payments/reconciliation/tax support;
3. I.T. Startup/Test/Runtime health;
4. Administration Staff/Inventory/Catalog;
5. Socials Content/Photo/SEO/Integrations;
6. DAIP only as privacy/cost/processing gates permit.

Reliability rules:

- no open Detailer job → no live job/media/message monitors;
- hidden/inactive refresh sleeps;
- completed jobs reject new live-message writes;
- no automatic replay of ambiguous non-idempotent writes;
- heavy filtering/aggregation belongs in Postgres rather than Worker loops;
- Functions remain under `/api/*`.

## Business input checkpoints

Engineering should continue where rules are safe and inferable. Ask only before public/business rules that cannot be inferred:

- material changes to current condition-tier pricing or maximum restoration scope;
- whether seat removal/carpet lifting/water-intrusion recovery can be offered under every site/weather condition;
- headlight/protection warranty, if any;
- maintenance-plan pricing/cadence/perks/pause/cancel rules;
- fleet minimum vehicle count/discount/travel rules;
- real GBP/Search Console property/account selections and review source;
- any new insurance/certification/equipment/environmental requirement.

The standard water/power model is resolved and must not be asked again.

## Build 274 validation authority

Source validation:

- cumulative guard: `scripts/release_check.py`;
- retained focused guards: Build 271/272/273 where present;
- Build 274 focused guard: `scripts/build274_release_check.py`;
- feature-only source workflow: `.github/workflows/build274-source-gate.yml`.

Development validation:

- `.github/workflows/cloudflare-development-acceptance.yml` runs only on `dev`/manual dispatch;
- exact `dev` SHA must reach Cloudflare Development;
- anonymous protected-endpoint smoke checks must be non-5xx;
- authenticated/browser/mobile/provider evidence stays separate.

Do not move `dev` merely because source was committed. Promote only after the **latest feature SHA** has a green source gate.

## Manual / external acceptance queue

These require credentials, provider state, live services/devices or human/business evidence:

- Google Business Profile ownership/review connection and genuine review proof;
- Search Console ownership/property/sitemap/indexing evidence;
- authenticated role/action/direct-URL/API matrix;
- customer ↔ Detailer real-session messaging/deep links and closed-job UX;
- real email/SMS/Web Push delivery/retry/failure evidence;
- Stripe test deposit/final-balance/refund/webhook settlement/replay/idempotency;
- PayPal sandbox acceptance if retained;
- live inventory posting/reversal/idempotency/shortage evidence;
- representative Cloudflare CPU/script/memory evidence;
- Supabase restore rehearsal;
- Cloudflare rollback rehearsal;
- DAIP private-media processing/retry/cancel/dead-letter/usage/consent evidence;
- phone/tablet/desktop/PWA/accessibility/weak-network acceptance;
- accountant/tax facts and judgment-heavy review retained from Build 273.

## Permanent guardrails

- mobile/touch behavior is first-class;
- one meaningful H1 per public/indexable page;
- crawlable static-first service/local pages;
- no thin/duplicated doorway-location pages;
- no public R2 bucket enumeration on normal requests;
- no fabricated/sample customer reviews;
- resolved standard mobile utilities remain Rosie-supplied water/power plus a safe/private work area;
- no subsystem polling merely because a module is authorized;
- server authorization is authoritative;
- private/customer DAIP media never becomes public without consent/review;
- secrets never belong in browser code or Git;
- accounting/tax automation proposes/documents but does not fabricate facts or professional judgment;
- booking simplicity never bypasses availability, quote, pricing, conflict, payment, consent or audit authority;
- `main` / live Production is promoted only deliberately from an accepted Development release.

## Documentation policy

Only `AI_PROJECT_HANDOFF.md` and this file are living planning authorities. `BUILD274_SUMMARY.md` is the active release checkpoint. Older build summaries and Git history are archive/evidence, not planning authority.
