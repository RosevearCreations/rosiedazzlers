# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 272  
**Updated:** 2026-08-29  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current release state

Build 272 is the closed source release for the current permission/package-clarity/T2125 increment. Its canonical summary is `BUILD272_SUMMARY.md`.

Development promotion is `dev` only. `main` / live Production remains outside ordinary Development work and must not be changed unless promotion is explicitly requested.

Do not reopen old build numbers to attach later manual evidence. Later acceptance, fixes and enhancements belong to the current active release, now **Build 273**.

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

Historical Development schema tolerance remains important: `permissions_profile` may be TEXT or object JSON and must continue to use the shared parser rather than being blindly converted.

## Build 272 closure

### Explicit Operations / Finance actions

Build 272 adds/extends:

- `operations.customer.manage` for customer/profile/tier mutation;
- `operations.quote.manage` for staff quote/proposal/deposit-request/final-balance management;
- `finance.refund.manage` for refund mutation;
- `finance.settlement.manage` for settlement mutation.

Converted high-risk routes do not use legacy admin-password fallback. Accountant receives Finance actions; Operations roles do not receive Finance actions by default.

### Public package clarity

Build 272 preserves existing Rosie pricing and booking/deposit mechanics while making the service decision clearer:

- Premium Wash is positioned as maintenance exterior refresh;
- Exterior Detail is a full exterior-focused detail/protection-prep service;
- Complete Detail is the broadest inside/out base scope and is labeled **Best value**;
- Small / Mid-sized / Oversized base pricing is explained before price;
- condition/contamination/risk/extra-labour quote triggers are explicit;
- Rosie’s standard mobile detailing states that Rosie brings its own water and power;
- public one-H1 rules remain intact.

### Finance / T2125

Build 272 establishes a review-first T2125 workpaper generated from the posted accounting year-end report.

It maps ledger expense categories to CRA workpaper categories but deliberately does not silently decide judgment-heavy items:

- meals/entertainment → candidate with review;
- vehicle → business/total-kilometre support required;
- CCA → asset/class schedule required;
- business-use-of-home → allocation/limit/carry-forward support required;
- COGS/direct costs → inventory/direct-cost review required;
- unknown accounts → visible review queue.

The T2125 API is read-only and requires `finance.view`. Tax Review provides CSV and JSON exports and separately displays GST/HST collected, ITC/debit activity and net activity.

## Current validation authority

- cumulative guard: `scripts/release_check.py`;
- retained focused guard: `scripts/build271_release_check.py`;
- current focused guard: `scripts/build272_release_check.py`;
- Development workflow: `.github/workflows/cloudflare-development-acceptance.yml`.

The Development workflow now runs the cumulative guard plus Build 271 and Build 272 focused guards before exact-SHA Development Pages acceptance and anonymous HTTP/module-load smoke.

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

## Build 273 — active carry-forward

Build 273 is the only active queue. It absorbs anything previously described as “remaining Build 271/272 acceptance” so stale builds do not remain open.

### Engineering queue

1. Persistent tax/business profile with configurable legal/entity/tax mode.
2. Mileage/vehicle log and annual business-use ratio feeding T2125 vehicle support.
3. Business-use-of-home evidence and calculation records.
4. Capital-asset/CCA register and schedule support.
5. Year-end inventory/COGS support records.
6. Receipt/document/evidence links from ledger/tax-review items.
7. Accountant year-end package combining statements, GST/HST, T2125, mileage, CCA, home-office and unresolved review queue.
8. Continue high-risk action extraction when touching booking overrides, incidents/customer-visible publishing, journal/tax-close/payroll/export workflows.
9. Continue lazy module extraction and broader app improvements without waking dormant modules.

### Manual / external evidence queue

Do not fabricate these; complete them when credentials, devices, tax facts or human review are available:

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
- Search Console/sitemap/canonical/schema/Google Business Profile evidence;
- actual business kilometre, home-office, CCA, inventory and accountant-reviewed tax facts.

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

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Build summaries are historical closure records. Git history is the archive.
