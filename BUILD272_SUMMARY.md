# Rosie Dazzlers — Build 272 Summary

**Status: CLOSED**  
**Closure date:** 2026-08-29  
**Source branch:** `build272-permissions-package-clarity`  
**Promoted source commit:** `d1e314411b878c6e270ef3e208c9d2b6fbd2cebd`  
**Promotion target:** `dev` only  
**Production rule:** `main` remains untouched.

## Build 272 closure

Build 272 is closed as the release that finishes the current permission/package-clarity increment and establishes the first Finance T2125 workpaper. Work that requires real credentials, real provider interaction, human tax facts, real devices, rollback/restore rehearsal, or a larger new engineering subsystem is not left attached to Build 272. It is explicitly carried forward to Build 273.

Closure means the implemented source scope is complete and guarded. It does **not** mean the application has fabricated manual acceptance evidence. The Development workflow remains the authority for exact-SHA deployment/source smoke on the final `dev` head.

## Implemented in Build 272

### Operations and Finance action authority

- Customer profile/tier/customer mutation routes are centrally gated by `operations.customer.manage`.
- Staff quote/proposal/deposit-request/final-balance management routes are gated by `operations.quote.manage`.
- Refund mutation routes are gated by `finance.refund.manage`.
- Settlement mutation routes are gated by `finance.settlement.manage`.
- Accountant defaults include Finance post/reconcile/period-close/refund/settlement actions.
- Operations roles do not receive Finance actions by default.
- Legacy admin fallback remains disabled on converted high-risk paths.

### Public package and booking clarity

- Existing Rosie prices are preserved.
- Exterior Detail is explicitly differentiated from the Premium Wash maintenance refresh.
- Complete Detail is described as the broadest inside/out base scope and uses **Best value** rather than an unsupported popularity claim.
- Small / Mid-sized / Oversized pricing context is explained before price.
- Condition/contamination/risk/extra-labour quote triggers are explicit.
- Rosie’s mobile-service promise states that standard detailing brings its own water and power.
- Existing booking/deposit mechanics remain in place.
- No additional public H1 is injected; one-H1 public SEO rules remain authoritative.

### Finance — T2125 workpaper

- `functions/api/_lib/t2125-workpaper.js` maps posted year-end expense categories to T2125 workpaper lines.
- Ordinary mapped expenses can produce a candidate amount.
- Meals/entertainment remain review-first because exceptions can apply.
- Vehicle expenses require business/total kilometre support before allocation.
- CCA requires an asset/class schedule.
- Business-use-of-home requires allocation, income-limit and carry-forward support.
- COGS/direct-cost lines remain review-first until inventory/direct-cost facts are complete.
- Unknown mappings fail into a visible review queue rather than being silently deducted.
- GST/HST collected, debit/ITC activity and net activity are displayed separately.
- T2125 access is read-only and requires `finance.view` rather than broad staff-management authority.
- Tax Review supports aligned CSV and JSON workpaper exports.
- The workpaper is explicitly an accounting-preparation aid, not filing eligibility or tax advice.

## Build 272 release guard

`scripts/build272_release_check.py` now protects:

- Build 272 action registry/defaults and central route mappings;
- package-price invariants;
- public scope/vehicle/condition/mobile-service copy;
- booking/deposit continuity;
- public one-H1 invariants;
- T2125 review-first rules;
- Finance-scoped T2125 access;
- aligned T2125 CSV/JSON export markers;
- Build 272 closure documentation and Build 273 carry-forward authority;
- Node syntax for Build 272 JavaScript authority surfaces.

The Development GitHub workflow runs the cumulative release guard, Build 271 focused guard and Build 272 focused guard before exact Development deployment acceptance.

## Intentionally carried forward to Build 273

### Engineering work

- persistent tax/business profile;
- mileage/vehicle log with annual business-use ratio;
- business-use-of-home evidence/calculation records;
- capital-asset/CCA register and schedule support;
- year-end inventory/COGS support records;
- receipt/document/evidence linkage for tax review;
- accountant package combining financial statements, GST/HST, T2125, mileage, CCA, home-office support and unresolved review queue;
- remaining explicit high-risk action extraction such as booking cancellation/reschedule/override, incident/customer-visible publication, sensitive journals/tax close/payroll/export as those workflows are touched;
- continued lazy module extraction and broader application improvements.

### Manual / external evidence

These are accepted as deferred evidence, not Build 272 blockers:

- authenticated role/action/direct-URL/API matrix;
- real customer ↔ Detailer messaging/deep-link acceptance;
- completed-job closed-messaging UX acceptance;
- real email/SMS/Web Push provider delivery/retry/failure evidence;
- Stripe deposit/final-balance/refund/webhook acceptance;
- PayPal sandbox decision/acceptance if retained;
- live inventory posting/reversal/idempotency/shortage evidence;
- representative Cloudflare CPU/script/memory evidence;
- Supabase restore rehearsal and Cloudflare rollback rehearsal;
- DAIP private-media processing/retry/cancel/dead-letter/usage evidence;
- real-device PWA/mobile/accessibility/weak-network evidence;
- Search Console / canonical / sitemap / schema / Google Business Profile evidence;
- human tax facts and accountant review needed to finalize T2125 allocations.

## Permanent release boundary

Do not reopen Build 272 to attach later manual evidence. Record later evidence against the **current active release**. If a true regression is discovered, fix it in the current release and preserve Build 272 as historical closure.

**Next active release: Build 273.**
