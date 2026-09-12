# Rosie Dazzlers

Current source direction: **Build 393 — Operations, Inventory & Job-Cost Evidence**.

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

## Current operations, inventory and job-cost authority

The existing inventory model remains authoritative. `catalog_inventory_movements` is the single movement ledger, `catalog_inventory_items` owns item/on-hand/reorder/recorded-cost evidence, and `catalog_purchase_orders` owns reorder evidence. The current release adds no second inventory ledger and no schema migration.

`GET /api/admin/operations_job_cost_evidence?booking_id=<uuid>` is a staff-authorized read-only projection. It exposes booking-scoped usage/depletion, reversal-aware net quantities, recorded material cost evidence, low-stock/reorder evidence, substitution provenance when already recorded, and fail-closed `ready`, `review`, or `unavailable` status.

Missing recorded cost is never estimated or converted to zero. Duplicate replay evidence is ignored; reversal/adjustment movement evidence nets against depletion. Low stock without active reorder evidence, missing inventory authority, or incomplete substitution provenance is surfaced for review rather than silently accepted.

Run the focused authority with:

```bash
node --check functions/api/_lib/operations-job-cost-evidence.js
node --check functions/api/admin/operations_job_cost_evidence.js
node scripts/build393_operations_inventory_job_cost_evidence_test.mjs
python scripts/build393_operations_inventory_job_cost_evidence_check.py
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
