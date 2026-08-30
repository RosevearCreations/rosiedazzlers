# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 273  
**Updated:** 2026-08-30  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current release state

Build 272 is closed and historically summarized in `BUILD272_SUMMARY.md`. **Build 273 is the only active release** and is summarized as it evolves in `BUILD273_SUMMARY.md`.

Current Development rule:

- work from accepted `dev` through a focused feature branch;
- promote back to `dev` only after source coherence/gates;
- exact-SHA Cloudflare Development acceptance is required after promotion;
- `main` / live Production remains untouched unless deliberate Production promotion is explicitly requested.

Do not reopen old build numbers for later manual evidence.

## Current platform boundary

Rosie Dazzlers remains one secured, mobile-first platform with a static-first public website and eight independently loadable modules:

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

`/app/` is the Staff App Launcher. `/app/admin/` is Administration.

## Role / module / action authority

Role ceilings remain:

| Role | Maximum modules |
|---|---|
| `detailer` | Detailer |
| `senior_detailer` | Detailer + Operations |
| `operations_manager` | Detailer + Operations |
| `accountant` | Finance |
| `it_specialist` | I.T. |
| `promoter` | Socials & Promotion |
| `daip_manager` | DAIP |
| `admin` | all internal modules |

Authorities:

- module grants: `staff_users.permissions_profile.module_access`;
- per-user action overrides: `staff_users.permissions_profile.action_access`;
- action vocabulary/defaults: `data/action_permissions.json`;
- global module availability: `app_management_settings.module_runtime_flags`;
- server authorization is authoritative; hidden navigation is not security.

Build 273 adds `finance.tax.manage`. Accountant receives it by default; Operations/Detailer roles do not receive Finance actions. Tax-support/accountant-package reads require `finance.view`; tax-support writes require `finance.tax.manage`; legacy admin-password fallback remains disabled on these converted Finance routes.

Historical Development schema tolerance remains important: `permissions_profile` may be TEXT or object JSON and must continue to use the shared parser rather than being blindly converted.

## Build 272 retained authority

Build 272 remains the closed permission/package-clarity/T2125 baseline:

- `operations.customer.manage` — customer/profile/tier mutation;
- `operations.quote.manage` — staff quote/proposal/deposit/final-balance management;
- `finance.refund.manage` — refund mutation;
- `finance.settlement.manage` — settlement mutation;
- public package clarity without price changes;
- Complete = **Best value**;
- Exterior Detail differentiated from Premium Wash;
- Small/Mid/Oversized + condition/quote rules shown before price;
- Rosie brings standard detailing water and power;
- one-H1/SEO and existing booking/deposit mechanics retained;
- first review-first Finance T2125 workpaper.

## Build 273 active implementation

### Persistent tax-support authority

The live Rosie Supabase accounting schema now includes additive Build 273 authorities:

- `accounting_business_vehicles`;
- `accounting_vehicle_tax_years`;
- `accounting_mileage_logs`;
- `accounting_home_office_workpapers`;
- `accounting_capital_assets`;
- `accounting_tax_year_support`.

All use RLS and the existing service-role Cloudflare Functions pattern. Existing `accounting_documents` remains the receipt/evidence authority; tax support links to evidence rather than duplicating files.

`app_management_settings.business_tax_profile` is the tax-profile configuration authority. It is Canada/Ontario/T2125-aware, keeps entity type configurable/unconfirmed until real facts are supplied, and stores only masked/display-safe business/GST identifiers.

### Tax-support calculations

Build 273 now records and calculates:

- business-use vehicles and trip purpose;
- business/total kilometres and annual odometer reconciliation;
- vehicle business-use percentage without guessing commute/personal use;
- business-use-of-home area/time/reasonable-other allocation;
- eligible home costs, prior carry-forward and positive-net-income limitation;
- capital asset facts and explicit CCA claim candidate without inventing a class/rate;
- year-end opening/closing inventory, valuation method and direct-cost adjustment;
- readiness state showing missing facts instead of treating missing values as zero.

No destructive delete workflow is included in this slice: records are deactivated, excluded or retained for audit history.

### T2125 structured support

The Build 272 ledger workpaper is now enriched by Build 273 factual support:

- line 9281 can use a reconciled vehicle business-use percentage;
- line 9945 can use the calculated current-year home-office candidate;
- line 9936 can use explicitly entered CCA claim candidates;
- tax profile and inventory/COGS readiness are carried alongside the workpaper.

All judgment-heavy items remain reviewable. The system does not decide filing eligibility or replace accountant review.

### Accountant package

`/api/admin/accounting_accountant_package` assembles a year-end JSON workpaper package with:

- tax profile;
- year-end report;
- balance sheet;
- enriched T2125;
- mileage summary;
- home-office calculation;
- capital-asset summary;
- inventory/COGS support;
- inventory cost completeness;
- tax evidence manifest;
- readiness/unresolved flags.

Even an `accountant_ready_candidate` package remains marked `manual_review_required: true`.

### Finance UI

- `admin-tax-support.html` is the factual-input/readiness workspace.
- `admin-tax-review.html` remains the GST/HST + T2125 review/export workspace and links to Tax Support.
- Tax Support can download the accountant JSON package.

## Current validation authority

- cumulative guard: `scripts/release_check.py`;
- retained focused guards: `scripts/build271_release_check.py`, `scripts/build272_release_check.py`;
- current focused guard: `scripts/build273_release_check.py` once added;
- Development workflow: `.github/workflows/cloudflare-development-acceptance.yml`.

Build 273 must not be called accepted on Development until the focused guard is in the workflow and the exact Development SHA passes Cloudflare/source/anonymous smoke acceptance.

## Wake/sleep and cost rules

- no open Detailer job → no live job bundle/feed/media/message monitor;
- Operations and Finance datasets load only when selected;
- Customer progress refreshes only when useful and sleeps while hidden/inactive;
- completed jobs stop accepting new live-message writes;
- push/deep-link behavior is event-driven and one-shot;
- module/runtime flags are timer-free;
- no automatic replay of ambiguous non-idempotent writes;
- Functions remain under `/api/*`;
- heavy filtering/aggregation belongs in Postgres rather than Worker loops.

## Build 273 current queue

### Engineering still available without manual evidence

1. Complete Build 273 source guard/workflow/Development acceptance for the tax-support slice.
2. Improve tax-document/evidence linking UX around `accounting_documents`.
3. Continue Finance action extraction when journal/tax-close/payroll/sensitive export workflows are touched.
4. Continue broader module/application improvements without waking dormant modules.
5. Continue public/business improvements: proof, margin/cost authority, detailed condition-aware landing pages, local SEO and conversion measurement.
6. Triage pre-existing Supabase security-advisor findings separately from Build 273 tax schema; do not silently change public business behavior while hardening.

### Manual / external evidence queue

Do not fabricate these; complete when credentials, devices, tax facts or human review are available:

- business legal/entity/tax profile confirmation;
- actual business/total kilometres and trip classification;
- home-office allocation/cost facts;
- capital-asset/CCA class/UCC facts;
- year-end inventory/direct-cost facts;
- accountant review of judgment-heavy T2125 items;
- authenticated role/action/direct-URL/API matrix;
- customer ↔ Detailer real-session messaging/deep links and closed-job UX;
- real provider email/SMS/Web Push delivery/retry/failure evidence;
- Stripe deposit/final-balance/refund/webhook settlement acceptance;
- PayPal sandbox decision/acceptance if retained;
- live inventory posting/reversal/idempotency/shortage evidence;
- representative Cloudflare CPU/script/memory evidence;
- Supabase restore rehearsal;
- Cloudflare deployment rollback rehearsal;
- DAIP private-media processing/retry/cancel/dead-letter/usage evidence;
- real-device PWA/mobile/accessibility/weak-network evidence;
- Search Console/sitemap/canonical/schema/Google Business Profile evidence.

## Permanent guardrails

- one meaningful H1 per public/indexable page;
- crawlable static-first service/local pages;
- no public R2 enumeration on normal requests;
- no subsystem polling merely because a module is installed/authorized;
- server authorization is authoritative;
- customer/private DAIP media never becomes public without consent/review;
- secrets never belong in browser code or Git;
- accounting workpapers automate preparation but do not fabricate tax facts or professional judgment;
- `main` is promoted only deliberately from an accepted Development release.

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Build summaries are historical/current-release checkpoints. Git history is the archive.