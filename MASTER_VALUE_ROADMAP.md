# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 273  
**Updated:** 2026-08-30

## North star

Build a professional mobile-first detailing platform connecting:

`lead / quote → booking → assigned work → live customer/detailer interaction → proof → payment → accounting/tax workpaper → review/public proof → repeat maintenance`

while dormant modules stay asleep and server work is driven by real business events rather than polling.

## Build 272 — closed baseline

Build 272 closed the permission/package-clarity/T2125 increment and is documented in `BUILD272_SUMMARY.md`. Do not attach new manual evidence to Build 271/272.

Retained Build 272 authority includes:

- customer/profile/tier writes behind `operations.customer.manage`;
- quote/proposal/deposit/final-balance management behind `operations.quote.manage`;
- refunds behind `finance.refund.manage`;
- settlements behind `finance.settlement.manage`;
- package prices preserved;
- Exterior vs Premium Wash scope clarified;
- Complete = **Best value**;
- vehicle-size/condition rules before price;
- Rosie brings standard detailing water and power;
- booking/deposit mechanics and one-H1 SEO rules retained;
- first Finance-scoped review-first T2125 workpaper.

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

## Build 273 — active

Historical/current implementation detail is in `BUILD273_SUMMARY.md`.

### Finance / accounting / tax support — implemented this increment

The first Build 273 Finance slice now includes:

1. **Persistent configurable tax profile** in `app_management_settings.business_tax_profile`; entity type remains unconfirmed/configurable until real facts are supplied; identifiers are masked-only.
2. **Business-use vehicle master** separate from customer vehicle mileage.
3. **Mileage log** with trip date, purpose, total/business km, optional booking/document reference, parking/tolls and review status.
4. **Annual vehicle reconciliation** with opening/closing odometer, total/business km and business-use percentage.
5. **Business-use-of-home workpaper** with area/time/reasonable-other basis, eligible costs, prior carry-forward and positive-net-income limitation.
6. **Capital asset/CCA factual register** with acquisition/availability/disposition facts, cost, class, prior UCC, business-use percentage and explicit current-year claim candidate.
7. **Year-end inventory/COGS support** with opening/closing inventory, valuation method and direct-cost adjustment.
8. **Existing Accounting Documents reused as evidence authority** rather than creating a duplicate receipt store.
9. **T2125 enrichment** so complete structured facts can support lines 9281, 9945 and 9936 while remaining review-marked.
10. **Accountant year-end package API** combining year-end statements, balance sheet, enriched T2125, tax support, inventory cost completeness and evidence manifest.
11. **Tax Support Finance workspace** for factual entry/readiness and accountant JSON download.
12. **`finance.tax.manage`** as the narrow write authority; `finance.view` remains read authority.
13. **Year-end report permission hardening** from broad staff-management capability to `finance.view`.

### Finance / accounting / tax support — next engineering moves

Continue without waiting for manual tax facts where possible:

1. Improve direct receipt/evidence linking from tax-support records to `accounting_documents`.
2. Add accountant-friendly CSV/PDF/export surfaces after JSON package shape stabilizes; preserve one data authority.
3. Continue explicit permission extraction when touching manual journals, adjusting entries, tax close/lock, payroll finalization and sensitive exports.
4. Keep posted-ledger immutability, double-entry, period locks and evidence links authoritative.
5. Improve accounting readiness dashboards to surface missing source facts before year end instead of only at filing time.

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

These are intentionally deferred until required human input, credentials, devices or provider state are available. They are not stale Build 271/272 blockers.

### Human tax facts

- business legal/entity/tax profile confirmation;
- actual business and total kilometres and trip classifications;
- home-office allocation facts and eligible costs;
- capital asset/CCA class/UCC/rate review;
- inventory/direct-cost facts;
- accountant review of judgment-heavy T2125 items.

The system should do the bookkeeping leg work, surface missing facts and produce accountant-ready workpapers, but must not invent those facts.

### Authenticated runtime

- Admin and focused-role launcher/direct-URL/API matrix;
- Detailer/Senior Detailer/Operations Manager/Accountant/I.T./Promoter/DAIP role/action acceptance;
- real customer ↔ Detailer message/deep-link flow;
- completed/inactive job message rejection with readable history.

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

## Security / reliability queue

Build 273 Supabase schema work was followed by the security advisor. The new tax tables match the existing service-role/RLS accounting pattern and did not introduce a new WARN-level finding. Pre-existing project findings still deserve separate hardening work, including SECURITY DEFINER exposure review, function search-path warnings and leaked-password protection configuration. Treat these as current security work, not tax-schema defects, and avoid behavior-changing fixes without verifying the affected workflow.

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