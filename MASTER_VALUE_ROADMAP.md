# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 272  
**Updated:** 2026-08-29

## North star

Build a professional mobile-first detailing platform connecting:

`lead / quote → booking → assigned work → live customer/detailer interaction → proof → payment → accounting/tax workpaper → review/public proof → repeat maintenance`

while dormant modules stay asleep and server work is driven by real business events rather than polling.

## Build 272 — closed

Build 272 closes the current permission/package-clarity/T2125 increment. Its historical detail is `BUILD272_SUMMARY.md`.

Closed source scope:

- customer/profile/tier writes behind `operations.customer.manage`;
- quote/proposal/deposit-request/final-balance management behind `operations.quote.manage`;
- refunds behind `finance.refund.manage`;
- settlements behind `finance.settlement.manage`;
- existing package prices preserved;
- Exterior vs Premium Wash scope clarified;
- Complete positioned as **Best value** with broadest inside/out base scope;
- vehicle-size pricing and condition/quote triggers clarified before price;
- fully mobile water/power promise made explicit;
- booking/deposit mechanics retained;
- public one-H1 rule retained;
- first Finance-scoped T2125 workpaper added with review-first handling for meals, vehicle, CCA, home office, COGS and unknown mappings;
- aligned CSV/JSON tax workpaper export added;
- Build 272 focused guard added to Development acceptance workflow.

Anything not objectively finishable without new scope, credentials, real devices, provider interaction, human tax facts or rehearsals is carried into Build 273. Do not keep Build 271 or 272 open for those items.

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

## Build 273 — active engineering queue

### Finance / accounting / tax support

Priority order:

1. Add a persistent business/tax profile with configurable entity/tax mode rather than hard-coding a legal structure.
2. Add mileage/vehicle records: vehicle identity, tax year, odometer/total km, business trips/km, purpose, linked booking/job where available, parking/tolls and evidence.
3. Feed complete business/total-kilometre facts into T2125 line 9281 support while leaving uncertain trips reviewable.
4. Add business-use-of-home support: allocation basis, workspace/home area or reasonable shared-use basis, eligible costs, prior carry-forward, income limitation and claimed amount.
5. Add capital asset/CCA support: acquisition/disposition dates, capital cost, class, prior UCC, business-use percentage, available-for-use facts and review notes.
6. Add year-end inventory/COGS support: opening inventory, purchases/direct costs, closing inventory and valuation evidence.
7. Link receipts/documents/evidence to ledger and tax-review items.
8. Produce an accountant package combining P&L, trial balance, balance sheet, GST/HST, T2125, mileage, CCA, home-office support, evidence index and unresolved review queue.
9. Preserve period locks, posted-ledger immutability, double-entry rules and evidence links.

### Permissions / workflow extraction

Continue explicit high-risk action extraction when those areas are changed:

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

Do not broaden roles merely to make a page work. Add the narrow action authority the workflow actually needs.

### Module extraction

Continue moving high-use compatibility pages into lazy module surfaces in this order:

1. Operations customer/booking/quote support;
2. Finance accounting/payments/reconciliation/tax support;
3. I.T. Startup/Test/Runtime health;
4. Administration Staff/Inventory/Catalog;
5. Socials Content/Photo/SEO/Integrations;
6. DAIP only as privacy/cost/processing gates permit.

## Build 273 — manual / external acceptance queue

These are intentionally deferred until the required human input, credentials, devices or provider state are available. They are not stale Build 271/272 blockers.

### Authenticated runtime

- Admin and focused-role launcher/direct-URL/API matrix.
- Detailer/Senior Detailer/Operations Manager/Accountant/I.T./Promoter/DAIP role/action acceptance.
- Real customer ↔ Detailer message/deep-link flow.
- Completed/inactive job message rejection with readable history.

### Providers / payments

- real email/SMS/Web Push delivery/retry/failure evidence;
- Stripe test deposit;
- Stripe final balance;
- Stripe refund;
- Stripe webhook settlement/replay/idempotency;
- PayPal sandbox parity decision/acceptance if retained.

### Inventory / reliability

- live inventory posting/reversal/idempotency/shortage evidence;
- representative Cloudflare exceeded-CPU/script-exception/memory evidence;
- Supabase restore rehearsal;
- Cloudflare deployment rollback rehearsal.

### DAIP / devices / launch

- private-media processing/retry/cancel/dead-letter/usage evidence;
- consent/privacy acceptance;
- approved-only Gallery/Social handoff;
- phone/tablet/desktop/PWA acceptance;
- Wi-Fi/cellular/weak-network behavior;
- keyboard/focus/contrast/reduced-motion/accessibility acceptance;
- Search Console, sitemap/canonical/schema and Google Business Profile evidence;
- controlled invite-only soft launch with monitoring.

### Human tax facts

- business legal/entity/tax profile confirmation;
- actual business and total kilometres;
- home-office allocation facts and eligible costs;
- capital asset/CCA class/UCC facts;
- inventory/direct-cost facts;
- accountant review of judgment-heavy T2125 items.

The system should do the bookkeeping leg work, surface missing facts and produce accountant-ready workpapers, but must not invent those facts.

## Public/business priorities

- replace remaining placeholders with approved Rosie-owned proof;
- strengthen Gallery Evidence / Technique / Efficiency proof;
- continue service-cost/minimum-price authority so labour/consumables/overhead protect margins;
- measure quote-to-booking and repeat-maintenance conversion;
- keep Oxford/Norfolk local pages genuinely useful and distinct;
- maintain detailed condition-aware service/add-on landing pages;
- maintain one meaningful H1 per public/indexable page.

## Native packaging after the web event model is proven

Use one codebase with Capacitor rather than forking business logic. Priorities remain native push, camera/photo/video capture, weak-network awareness and deep links. Tauri tray packaging stays optional/later and must not keep dormant business modules awake.

## Permanent guardrails

- one meaningful H1 per public/indexable page;
- crawlable static-first service/local pages;
- no public R2 bucket enumeration on normal requests;
- no subsystem polling just because a module is installed or authorized;
- optional refresh pauses while hidden and should be event/manual first;
- heavy aggregation/filtering belongs in Postgres, not Worker JavaScript;
- no automatic replay of ambiguous non-idempotent writes;
- server authorization is authoritative;
- customer/private DAIP media never becomes public without explicit consent/review;
- secrets never belong in browser code or Git;
- tax/accounting automation proposes and documents; judgment-heavy claims remain reviewable;
- `main` / live Production is promoted only deliberately from an accepted Development release.
