# Rosie Dazzlers — Build 273 Summary

**Status: ACTIVE**  
**Started:** 2026-08-30  
**Source branch:** `build273-tax-support-accountant-readiness`  
**Promotion target:** `dev` only  
**Production rule:** `main` remains untouched.

## Current Build 273 increment

Build 273 is moving the Finance/accounting system from a ledger-only T2125 workpaper toward persistent accountant readiness. The system now has normalized factual records for mileage, business-use-of-home, capital assets/CCA and year-end inventory, plus a configurable masked tax profile. These records support calculations but do not manufacture tax facts or filing decisions.

## Implemented source/database scope

### Persistent tax-support authority

Supabase migration `supabase/migrations/20260830090000_build273_tax_support_authority.sql` adds:

- `accounting_business_vehicles`;
- `accounting_vehicle_tax_years`;
- `accounting_mileage_logs`;
- `accounting_home_office_workpapers`;
- `accounting_capital_assets`;
- `accounting_tax_year_support`.

All six tables use RLS and the existing Cloudflare/service-role accounting access pattern. Tax evidence continues to live in `accounting_documents` rather than a duplicate file store.

`app_management_settings.business_tax_profile` is the tax-profile setting authority. It defaults to Canada/Ontario/T2125 with entity type unconfirmed. Full CRA identifiers are not required; the workpaper stores only masked/display-safe values.

### Finance action authority

Build 273 adds `finance.tax.manage`.

- `finance.view` owns tax-support/T2125/accountant-package reads.
- `finance.tax.manage` owns tax-support writes.
- Accountant receives `finance.tax.manage` by default.
- Operations/Detailer roles receive no Finance action by default.
- Converted endpoints keep legacy admin-password fallback disabled.

### Tax-support calculations

`functions/api/_lib/accounting-tax-support.js` now supports:

- business-use vehicle masters;
- trip mileage with business purpose and optional booking/document reference;
- annual opening/closing odometer and total/business-kilometre reconciliation;
- business-use percentage calculation without commute guessing;
- home-office area/time/reasonable-other allocation;
- eligible home-cost buckets, prior carry-forward and positive-net-income limitation;
- capital-asset factual register and explicit current-year CCA claim candidate;
- year-end opening/closing inventory and valuation support;
- readiness flags instead of silently converting missing facts to zero.

No destructive delete workflow was added in this first slice. Vehicles can be deactivated and mileage can be excluded while preserving evidence history.

### T2125 integration

The T2125 workpaper now enriches ledger mappings with structured support when factual records are complete:

- line 9281 can use reconciled business-use percentage against recorded motor-vehicle expenses;
- line 9945 can use the calculated home-office current-year candidate subject to review;
- line 9936 can use explicitly entered CCA claim candidates;
- inventory/COGS support and tax-profile readiness are exposed in the structured workpaper context.

These remain review items. The application does not determine filing eligibility, CCA classes/rates or professional tax judgment.

### Accountant package

`/api/admin/accounting_accountant_package` now assembles a year-end JSON workpaper package containing:

- business tax profile;
- year-end report;
- balance sheet;
- enriched T2125 workpaper;
- mileage summary;
- home-office calculation;
- capital-asset summary;
- tax-year inventory support;
- inventory cost-completeness report;
- tax evidence manifest;
- readiness status and unresolved amounts.

Even `accountant_ready_candidate` remains `manual_review_required: true`.

### Finance UI

`admin-tax-support.html` provides a Finance workspace for:

- tax profile;
- business-use vehicles;
- mileage entry;
- annual odometer reconciliation;
- home-office workpaper;
- capital assets/CCA;
- year-end inventory/COGS support;
- tax evidence manifest;
- accountant JSON package download.

`admin-tax-review.html` now links to Tax Support and displays the structured vehicle/home-office/CCA context returned by the enriched T2125 endpoint.

## Current validation boundary

Build 273 is **not closed**. Before this increment is accepted on Development:

1. run the cumulative/Build271/Build272/Build273 source guards;
2. verify exact `dev` SHA deployment on Cloudflare Pages;
3. run anonymous module/function smoke;
4. verify the live Supabase tax-support schema exists;
5. keep manual tax facts and provider/device acceptance explicitly deferred.

## Still active in Build 273

Engineering work that can continue without human evidence includes:

- broader Finance permission extraction when touching journal/tax-close/payroll/export workflows;
- stronger tax-document linkage UX;
- further accountant export formats after the JSON authority is stable;
- broader application/module improvements and public/business priorities;
- selected pre-existing security-hardening findings that can be corrected without changing business behavior.

Manual/external evidence remains deferred: actual business/entity confirmation, real mileage/home-office/CCA/inventory facts, accountant review, Stripe/PayPal/provider tests, real-device acceptance, restore/rollback rehearsals and other current-release acceptance requiring external state.
