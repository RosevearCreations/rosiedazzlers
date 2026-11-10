# Rosie Dazzlers 832 — Job Economics, Inventory, Payroll, Invoice & Tax Source Reconciliation

**Software release verified GREEN on November 9, 2026:** [Protected dev PR #898](https://github.com/RosevearCreations/rosiedazzlers/pull/898), [protected main PR #899](https://github.com/RosevearCreations/rosiedazzlers/pull/899) and [exact-SHA Cloudflare Production workflow #42734274173](https://github.com/RosevearCreations/rosiedazzlers/actions/runs/42734274173) succeeded. Independent original accountant/HST, issued-invoice, provider, payroll and owner business acceptance remains HOLD. This docs-only closure receives its own protected release checks.

**Release boundary:** Private source-only, authenticated finance/admin read. The implementation does **not** create an invoice, post inventory consumption, run payroll, remit HST, send a payment, publish Master Shell data or claim financial close. Source implementation and Cloudflare production promotion are separate from original accountant and owner signoff.

## Data lineage and what the source actually proves

`GET /api/admin/job_economics_reconciliation_v832` requires an original signed staff session with `admin` role, booking-management and staff-management capabilities and the existing action permissions. No public/legacy password bridge is accepted. The route reads server-side Supabase REST with a server-only key, returns `private, no-store`, and exposes booking UUID **suffixes** rather than customer, staff, receipt or vendor identity. The same privacy boundary applies to `assets/build832-job-economics.mjs` and the eleventh accessible section of `/admin-handoff-acceptance.html`.

| Persisted source | Scope | Real interpretation / remaining gap |
| --- | --- | --- |
| `bookings` | 40 newest UUID/state/date records | Sample only, not complete booking history |
| `accounting_records` | Up to 40 selected booking rows | Local total, tax, refunds/collections and balance can be cross-checked for arithmetic; not an issued invoice, provider receipt or signed accounting close |
| `catalog_inventory_movements` | Up to 200 booking-linked movements | `job_use` and reversals are traceable to the booking; quantity movement does not establish signed physical use or historic unit cost |
| `job_time_entries` | Up to 200 booking-linked entries | Time event count and positive minutes are **not** independently verified payable hours or wage allocations |
| `accounting_journal_entries` | Up to 200 booking-reference entries | Posted `inventory_usage_cogs` references can be counted, not assumed reconciled with bank/books or inventoried cost without original source |
| `staff_payroll_runs` | 40 recent company-wide runs | **No booking FK exists.** Posted payroll periods are never allocated to a job from mere time overlap; no staff names or wages returned |

The source projection flags missing finance rows, arithmetic/tax inconsistencies, incomplete inventory and COGS history, unverified labour/payroll allocations, unissued/unverified invoices and receipts, and outstanding tax workpapers. Missing or failed queries return 503 with no inferred financial result. All 8 handoff categories point to manual owning review screens. It does **not** display an approved job margin, HST return amount, accountant approval or owner acceptance. No change to canonical HOLD or Master Shell integration status is permitted.

## Original owner/accountant acceptance sequence

1. Obtain customer-consented real booking/worksite evidence from Build 831; do not create a synthetic job.
2. Have the relevant worker and separate supervisor check actual time entries, overtime and dated worksite records. Link to genuine payroll-run lines and pay rates from their original effective dates before accepting a labour expense.
3. Physically verify consumable quantities, reversals, supplier invoices, historical unit costs and the corresponding GL cost-of-sales entry. Do not substitute the current item price as historical cost.
4. Review the actual issued invoice, dated provider settlement/cash receipt, refunds, posted accounting record and independent bank/payment provider support.
5. Have an accountant independently verify Ontario HST treatment, sales-tax payable, input tax credits and the appropriate CRA workpapers/period. Reconcile period entries and any missing inventory/labour allocation. Only then collect explicit signed owner disposition in the owning finance process.
6. Master Shell fields (numerator, denominator, margin, acceptance, connection) remain UNKNOWN/HOLD until approved source and consumer authority; this release makes no outgoing event.

**Known data limits:** Six separately bounded query windows cannot prove completeness. In particular, historical rate changes and individual payroll-run linkage are not part of these source tables. A 200/40 record cap can omit prior reversals and journal entries. An application-generated invoice document template is not an independently issued invoice. Numeric `accounting_records` values are converted to integral CAD cents for local arithmetic tests; mismatch indicates review, not wrongdoing or a finalized financial statement.

**Verification:** `scripts/build832_job_economics_reconciliation_test.mjs` covers 401/403, signed admin capability, GET-only server reads, private failure/503, source windows, duplicate/out-of-scope IDs, missing accounting, inconsistent tax/collection amounts, journal and inventory links, non-attributed payroll, null owner/accountant/master completion fields, PII exclusion, route/UI parity and predecessor Build 831. The release regression (`scripts/current_booking_wizard_regression.sh`) and protected exact-SHA Cloudflare pipeline verify code, not business evidence.

**Next proposed Build 833:** Comms Hub Shell Boundary, Consent & Incident Route Contract Review; source and consumer trust/contract approval remain external HOLD.
