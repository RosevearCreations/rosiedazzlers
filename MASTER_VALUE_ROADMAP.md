# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 274  
**Updated:** 2026-08-30

## North star

Build a professional **mobile-first detailing application** connecting:

`search / lead → recommendation / quote → booking → assigned work → live customer/detailer interaction → proof → payment → accounting/tax workpaper → review/public proof → repeat maintenance`

while dormant modules stay asleep and server work is driven by real business events rather than polling.

The public website is the crawlable acquisition layer. Booking and all authenticated Customer/Detailer/Operations/Admin/I.T./Finance/DAIP/Socials experiences remain application workflows optimized for phone/touch use first.

## Retained closed/current baseline

Build 272 closed the permission/package-clarity/T2125 increment. Build 273 established the retained Finance/tax-support baseline. Historical implementation detail remains in the matching Build summaries and Git history.

Do not regress:

- customer/profile/tier writes behind `operations.customer.manage`;
- quote/proposal/deposit/final-balance management behind `operations.quote.manage`;
- refunds behind `finance.refund.manage`;
- settlements behind `finance.settlement.manage`;
- Finance reads behind `finance.view` and tax-support writes behind `finance.tax.manage`;
- Complete = **Best value**;
- Exterior Detail differentiated from Premium Wash;
- Small/Mid/Oversized + condition/quote rules before final price;
- booking/deposit/conflict mechanics;
- one-H1/SEO rules;
- persistent tax-support/evidence/accountant-package authority;
- no fabricated accounting/tax facts.

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

Layered authorization remains:

1. role/module ceiling;
2. per-user module narrowing;
3. global module runtime availability;
4. explicit action permission;
5. workflow/business-state checks.

Admin is all-modules/all-actions by design. Server authorization is authoritative.

## Build 274 — active

Build 274 is the broader closure/product-value release. `BUILD274_SUMMARY.md` records release checkpoints; `AI_PROJECT_HANDOFF.md` and this file remain the living authority.

### 1. I.T. Connections / contextual help

The I.T. module becomes the authoritative catalogue for every external/runtime dependency actually used or deliberately prepared by Rosie.

Required behavior:

- exact variable/secret/binding name;
- configured/missing presence only;
- safe storage type/location;
- what the value does and why Rosie needs it;
- **step-by-step external acquisition instructions** behind a circular `i` for every external field/box;
- prerequisites, scopes/roles, callback/redirect setup and environment separation;
- bounded test procedure and troubleshooting;
- official provider resources;
- no raw secret display or browser credential editor.

Shared contextual help remains an application-level system across protected screens and dynamically inserted fields, with accessible page/field controls and safe fallback wording.

### 2. Google trust and measurable local SEO

Priority order:

1. **Real review authority** — remove temporary/sample customer-style review proof as genuine reviews become available; connect Google Business Profile/review workflows and place verified review/proof where it supports the service being sold.
2. **Search Console authority** — verify ownership/property/sitemap and use query/page/impression/click/CTR/position data to decide future SEO work.
3. **Service authority pages** — every major service/add-on page must explain condition range, process, expected result/limits, time/price drivers, FAQs, proof and booking path.
4. **Proof at point of decision** — before/after evidence belongs on the service/local page it proves, not only in a generic Gallery.
5. **Distinct local pages** — Oxford/Norfolk town pages must earn their existence through actual local jobs/proof, access/service conditions, seasonal/local concerns, useful FAQs and direct booking paths. Do not mass-produce thin city-swapped doorway pages.
6. **Business-identity authority** — keep Organization/LocalBusiness/Breadcrumb structured data coherent from one business-profile source.
7. **Technical SEO** — one meaningful H1, canonical, sitemap, crawlable static-first text, strong internal links, useful titles/descriptions and no public R2 enumeration.
8. **SEO cockpit** — surface high-impression/low-CTR, page-two and non-branded opportunities inside I.T./SEO so SEO becomes a measured work queue rather than a periodic guess.

### 3. Competitive service position

Rosie should be marketed as:

> **Mobile Auto Detailing & Interior/Exterior Restoration**

while preserving “mobile auto detailing” as the high-intent primary category.

The market gap is not primarily more ordinary wash/detail SKUs; it is **deeper specialization, condition-aware pricing, convenience and proof**.

#### Priority service opportunities

1. **Interior Carpet & Upholstery Restoration**
   - Maintenance Cleaning — routine soil/light shampoo.
   - Deep Extraction — salt, staining, embedded soil, repeated extraction/labour.
   - Spill / Water-Intrusion Recovery — quote/review path; may include seat removal, carpet lifting, extraction/drying and inspection where Rosie operationally supports it.
   - Never promise mould/rust remediation outcomes without inspection and an approved operating scope.

2. **Headlight Restoration**
   - light oxidation;
   - moderate restoration;
   - severe oxidation/failed clear-coat review;
   - explain sanding/polishing/protection stages, result limits and price/time drivers;
   - warranty language only after business approval.

3. **Ontario seasonal services**
   - Spring Salt Recovery;
   - Post-Winter Interior Reset;
   - Fall/Winter Protection;
   - connect to salt extraction, mats/carpets, paint protection and maintenance-plan conversion.

4. **Pre-Sale / Lease-Return Detail**
   - high-intent use-case page and booking recommendation;
   - combine appropriate interior/exterior reset, headlight, engine-bay and paint-enhancement review without forcing every item into a fixed bundle.

5. **Maintenance plans**
   - Initial Reset;
   - recurring 4/6/8-week maintenance options;
   - seasonal deep reset;
   - priority booking/convenience and controlled perks rather than unlimited margin-eroding service.

6. **Fleet / Workplace Detail Days**
   - contractors, HVAC/plumbing/electrical/service firms, real-estate teams, delivery/home-care/small fleets;
   - multiple vehicles at one location should reduce travel overhead and support recurring contracts;
   - minimum vehicle count/discount rules require business approval.

7. **Later build-vs-buy/partner decisions**
   - PPF;
   - rustproofing/undercoating;
   - other equipment/certification/insurance-heavy services.

Do not add these merely to match a competitor. Add only when margin, equipment, insurance, training, environmental and workflow requirements are understood.

### 4. Condition-based pricing / margin protection

Every service/add-on whose labour varies materially must stop pretending every vehicle is the same job.

Required landing/booking architecture:

- show **starting/range/quote-required** pricing appropriately;
- define visible condition tiers or examples;
- explain what pushes the job from light → moderate → severe;
- request photos where severity cannot be priced safely in advance;
- preserve staff review before a variable-scope promise becomes final;
- connect supplier/consumable/labour/overhead cost authority so public prices protect minimum margin;
- do not convert severe restoration into a cheap add-on simply because the old catalogue had a flat price.

### 5. Mobile Quick Book

Preserve the current booking engine's availability, service-area, pricing, size, quote, deposit, conflict and payment authorities. Simplify what the customer sees.

#### Target flow

**A. What does your vehicle need?**

Large touch choices:

- Just needs a clean
- Interior needs attention
- Pet hair / stains / road salt
- Full inside/outside reset
- Paint / scratches / shine / protection
- Cloudy headlights
- Something spilled / got wet / odour
- Pre-sale / lease return
- Work truck / fleet
- Not sure — recommend one

These map into the existing condition-helper/package rules rather than creating a second pricing engine.

**B. What do you drive?**

- Year
- Make
- Model
- Rosie auto-suggests size/body metadata from the current vehicle catalogue.
- Vehicle size remains reviewable because it affects price.
- Colour, mileage, category, body style and plate move behind **Optional vehicle details** unless a later business rule actually requires them.
- Saved Garage vehicles appear before manual entry for signed-in customers.

**C. Where and when?**

- Service area/town;
- show the **next three useful openings** as the primary choice when practical;
- full calendar remains available for people who want another day;
- only offer slots that current availability rules actually allow.

**D. Rosie recommends**

- automatically apply the nearest package/add-ons/quote path from the customer's selected need/condition;
- show one recommended choice first, with editable alternatives;
- never hide that a severe condition can require staff/photo review.

**E. Photo/condition branch**

Pet hair, heavy salt/stains, spill/water, odour source, severe headlight oxidation, paint defects, fleet/heavy-use and other variable work should move naturally into photo review instead of forcing a false instant price.

**F. Contact, requirements and payment**

- ask for customer/contact/service-address details only after service/slot value is clear;
- consolidate acknowledgements where legally/operationally safe;
- preserve driveway/access/bylaw/weather/deposit rules;
- preserve 409 conflict handling and exact booking authority;
- make quote-only vs deposit-ready state unmistakable.

**G. Returning customers**

Target: `saved vehicle → repeat last/maintenance service → next opening → confirm deposit`, with minimal taps.

#### Funnel measurement

Track at minimum:

- booking start;
- need/problem choice;
- vehicle essentials complete;
- size suggestion/override;
- recommendation displayed/accepted/changed;
- photo-review branch;
- slot displayed/selected;
- checkout start;
- deposit success/failure;
- abandoned step;
- repeat-maintenance conversion.

Use these events to remove friction rather than guessing what users find difficult.

### 6. Proof / reviews / content engine

The strongest competitive asset should become **problem → process → result** evidence.

For each accepted proof item capture:

- service/condition;
- before evidence;
- process/technique evidence where useful;
- after result;
- town/service area;
- vehicle type;
- customer publication consent state;
- page(s) where the proof is relevant;
- review/testimonial link where legitimately associated.

DAIP/Photo Studio can help prepare proof, but customer/private evidence never becomes public without consent/review.

### 7. Maintenance and retention

Build a real repeat-service product rather than treating repeat business as an afterthought.

Target application behavior:

- completion suggests the correct next maintenance interval;
- customer can accept a reminder/plan without re-entering vehicle information;
- account shows next recommended service and one-tap rebook;
- Operations sees recurring-plan demand/capacity;
- Finance sees plan discounts/perks separately enough to measure margin;
- customers can pause/cancel according to approved rules;
- no background polling merely because a customer has a plan.

### 8. Fleet/workplace acquisition

Create a business lead/quote path that captures:

- business/contact;
- service location(s);
- number/type/use of vehicles;
- frequency;
- interior/exterior priorities;
- workplace access/water/power constraints;
- preferred service windows;
- photo/fleet list evidence;
- recurring contract interest.

Do not force a fleet prospect through a consumer one-vehicle booking flow.

### 9. Finance / accounting / tax support — retained next moves

Continue without waiting for manual tax facts where possible:

1. Improve receipt/evidence linking from tax-support records to `accounting_documents`.
2. Add accountant-friendly CSV/PDF/export surfaces after JSON package shape stabilizes; preserve one data authority.
3. Continue explicit permission extraction when touching manual journals, adjusting entries, tax close/lock, payroll finalization and sensitive exports.
4. Keep posted-ledger immutability, double-entry, period locks and evidence links authoritative.
5. Improve readiness dashboards to surface missing source facts before year end.

### 10. Permissions / module extraction / reliability

Continue explicit high-risk action extraction when affected workflows are changed:

- booking cancellation/reschedule/override;
- incident/report approval and customer-visible publication;
- review-request queue mutation;
- manual journal/adjusting entries;
- tax close/lock;
- payroll finalization;
- sensitive accountant export generation;
- I.T. diagnostics/test/runtime/module settings;
- Administration staff/catalog/inventory configuration;
- Socials review/edit/publish/provider actions;
- DAIP intake/review/promote behind consent/private-media gates.

Continue moving high-use compatibility pages into lazy module surfaces in this order:

1. Operations customer/booking/quote support;
2. Finance accounting/payments/reconciliation/tax support;
3. I.T. Startup/Test/Runtime health;
4. Administration Staff/Inventory/Catalog;
5. Socials Content/Photo/SEO/Integrations;
6. DAIP only as privacy/cost/processing gates permit.

Do not broaden roles merely to make a page work. Do not wake modules/timers merely because a user is authorized.

## Build 274 — business input checkpoints

Engineering should continue wherever rules are safe and inferable. Request input before finalizing only genuinely business-specific decisions:

- interior-restoration labour tiers/starting ranges and maximum scope;
- whether seat removal/carpet lifting/water-intrusion recovery is offered and under what site/weather constraints;
- headlight-restoration warranty, if any;
- maintenance-plan 4/6/8-week pricing, perks, pause/cancel and eligibility rules;
- fleet minimum vehicle count/discount/travel rules;
- current water/power operating model — Rosie-supplied vs customer-supplied/default/exception;
- real GBP/Search Console property/account selections and review source;
- any new insurance/certification/equipment/environmental requirement.

Do not invent these values to complete a UI.

## Build 274 — manual / external acceptance queue

These require human input, credentials, provider state, live services or devices and must remain explicit:

### Google / public proof

- Google Business Profile ownership, review connection and genuine review evidence;
- Search Console property ownership, sitemap, canonical/schema/indexing evidence;
- real service/local proof and customer publication consent;
- final condition-tier pricing/warranty/maintenance/fleet decisions.

### Authenticated runtime

- Admin and focused-role launcher/direct-URL/API matrix;
- Detailer/Senior Detailer/Operations Manager/Accountant/I.T./Promoter/DAIP role/action acceptance;
- real customer ↔ Detailer message/deep-link flow;
- completed/inactive job message rejection with readable history;
- authenticated I.T. contextual-help placement/keyboard/mobile acceptance.

### Providers / payments

- real email/SMS/Web Push delivery/retry/failure evidence;
- Stripe test deposit/final balance/refund/webhook settlement/replay/idempotency;
- PayPal sandbox parity decision/acceptance if retained;
- Google/Meta/social OAuth/publishing acceptance.

### Inventory / reliability / DAIP / devices

- live inventory posting/reversal/idempotency/shortage evidence;
- representative Cloudflare exceeded-CPU/script-exception/memory evidence;
- Supabase restore rehearsal;
- Cloudflare deployment rollback rehearsal;
- DAIP private-media processing/retry/cancel/dead-letter/usage/consent evidence;
- phone/tablet/desktop/PWA, Wi-Fi/cellular/weak-network and accessibility acceptance.

### Finance/tax facts retained from Build 273

- business legal/entity/tax profile confirmation;
- actual business/total kilometres/trip classifications;
- home-office allocation facts/costs;
- capital asset/CCA class/UCC/rate review;
- inventory/direct-cost facts;
- accountant review of judgment-heavy T2125 items.

## Security / reliability queue

Pre-existing Supabase/project security findings remain separate hardening work. Review SECURITY DEFINER exposure, function search-path warnings, leaked-password protection and other advisor findings without silently changing business behavior. Preserve service-role/RLS boundaries and test affected workflows after hardening.

## Native packaging after the web event model is proven

Use one codebase with Capacitor rather than forking business logic. Priorities remain native push, camera/photo/video capture, weak-network awareness and deep links. Tauri tray packaging stays optional/later and must not keep dormant business modules awake.

## Permanent guardrails

- mobile/touch application behavior is first-class, not a desktop website afterthought;
- one meaningful H1 per public/indexable page;
- crawlable static-first service/local pages;
- no thin/duplicated doorway-location pages;
- no public R2 bucket enumeration on normal requests;
- no subsystem polling just because a module is installed or authorized;
- optional refresh pauses while hidden and should be event/manual first;
- heavy aggregation/filtering belongs in Postgres, not Worker JavaScript;
- no automatic replay of ambiguous non-idempotent writes;
- server authorization is authoritative;
- customer/private DAIP media never becomes public without explicit consent/review;
- secrets never belong in browser code or Git;
- tax/accounting automation proposes and documents; judgment-heavy claims remain reviewable;
- booking simplicity never bypasses availability, quote, pricing, conflict, payment, consent or audit authority;
- `main` / live Production is promoted only deliberately from an accepted Development release.