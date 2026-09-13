# Rosie Dazzlers

Current source direction: **Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance**.

Rosie Dazzlers is one platform with a static-first public website and eight independently authorized/sleeping application modules: Customer, Detailer, Operations, Administration, I.T., Finance, DAIP, and Socials & Promotion.

## Start here

For a new chat, AI, or developer, read only:

1. `AI_PROJECT_HANDOFF.md` — current implementation, deployment and release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_386_395.md` — active forward sequence and continuing release rules.
4. `STARTUP_GO_LIVE_BLOCKERS.md` — current acceptance gaps and go-live evidence still requiring proof.

Use `DOC_INDEX.md` only to locate specialist references. Completed prior phases and `docs/BACKUP_RESTORE_RELEASE_RECOVERY.md` remain retained historical/specialist authorities, not the normal restart point.

## Canonical source locations

- Application module registry: `data/app_modules.json`
- Private navigation hierarchy: `data/internal_navigation.json`
- Route/module ownership: `data/route_module_ownership.json`
- Modular architecture: `docs/modular-app/README.md`
- Database migrations: **`sql/` only**
- Aggregate schema reference: `SUPABASE_SCHEMA.sql`
- Cloudflare Pages Functions: `functions/api/`

Build-numbered duplicate registries, root migration copies, root API shims, retired Markdown snapshots, generated reports, and comment-only “no DDL” migrations are intentionally not part of the current tree. Git history is the release archive.

## Current finance close, reconciliation and accountant-export authority

The existing Finance cockpit remains authoritative. Booking-finance events own deposit, final-balance and refund evidence; posted accounting reports own ledger and HST evidence; saved cash reconciliation owns bank-reconciliation evidence; and the existing month-end checklist/closure surface owns month-end readiness. The current release adds no second accounting ledger and no schema migration.

`GET /api/admin/accounting_finance_close_acceptance?month=<1-12>&year=<yyyy>` is a staff-authorized read-only acceptance projection. It exposes deterministic `ready`, `review`, or `unavailable` evidence for deposits, final balances, refunds, provider fees, HST, bank reconciliation, month-end close and accountant export readiness.

Provider fees are never estimated from payment totals. If paid provider activity exists but no explicit posted fee/processing/merchant/Stripe/PayPal accounting account evidence exists, Finance acceptance remains `review`. Missing HST, reconciliation or close evidence similarly fails closed rather than being treated as zero or success.

The existing `/api/admin/accounting_export` CSV family and `/api/admin/accounting_accountant_package` remain the export authorities. Build 394 does not post journals, close periods, charge/refund customers, mutate Stripe/PayPal/providers, write accountant approval, migrate schema, mutate R2 or alter Production business data.

Run the focused authority with:

```bash
node --check functions/api/_lib/accounting-finance-close-acceptance.js
node --check functions/api/admin/accounting_finance_close_acceptance.js
node scripts/build394_finance_close_reconciliation_accountant_export_test.mjs
python scripts/build394_finance_close_reconciliation_accountant_export_check.py
```

The retained commercial pricing authority remains available with:

```bash
python scripts/service_commercial_accuracy_check.py
node scripts/service_commercial_accuracy_test.mjs
```

## Release authority

Run the cumulative source check with:

```bash
python scripts/release_check.py
```

Run the living release/documentation convergence guard with:

```bash
python scripts/release_authority_documentation_convergence_check.py
```

Run the focused release-governance authority with:

```bash
python scripts/release_governance_audit.py
```

The Current Source Gate executes the durable cross-release authorities automatically. Feature candidates must pass source and feature-preview acceptance before `dev` moves. Development must prove the identical candidate SHA through retained source/runtime gates. `dev` advances only by non-force fast-forward.

Production promotion is governed by GitHub's active **`rd main protection`** ruleset. The accepted Development line is proposed to protected `main` through a pull request, the required `source checks` context must pass, and the ruleset must not be bypassed merely to make a release succeed. A merge commit is preferred so the accepted Development candidate remains explicit in Production ancestry. After merge, the resulting `main` head is the exact Production source SHA and must receive its own exact-SHA deployment/runtime/business acceptance.

The retained recovery drill remains observation-only and available as specialist authority. It cannot move Git refs, restore a database, migrate schema, write/delete R2 objects, mutate DNS, rotate secrets, charge/refund a customer or mutate provider/business state. Any real recovery mutation requires explicit operator authorization outside the drill, followed by normal exact-SHA re-acceptance.

Production is not considered GREEN from source promotion alone. `.github/workflows/production-business-acceptance-authority.yml` independently requires the exact resulting `main` SHA to match a successful Cloudflare Production deployment with Functions metadata, then smokes both the immutable deployment and `https://rosiedazzlers.ca`. Its acceptance helper is observation-only and does not deploy, retry, roll back, charge providers or mutate business data.

The cumulative release checks retain repository hygiene, Cloudflare Functions structure, module/role boundaries, lazy/no-poll runtime rules, service/pricing convergence, route-copy parity, public one-H1 SEO requirements, release-document convergence and stage-specific exact-SHA release discipline.
