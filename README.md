# Rosie Dazzlers

Current source direction: **Build 396 — Growth Baseline & Forward Roadmap Renewal**.

Rosie Dazzlers is one platform with a static-first public website and eight independently authorized/sleeping application modules: Customer, Detailer, Operations, Administration, I.T., Finance, DAIP, and Socials & Promotion.

## Start here

For a new chat, AI, or developer, read only:

1. `AI_PROJECT_HANDOFF.md` — current implementation, deployment and release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_396_405.md` — active forward sequence and continuing release rules.
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

## Build 396 growth baseline

The current release is schema-neutral and read-only. It establishes which existing first-party sources are authoritative for acquisition, conversion, booking, retention and commercial measurement, and moves the living release documents onto `FORWARD_BUILD_ROADMAP_396_405.md`.

`docs/GROWTH_BASELINE_FORWARD_ROADMAP.md` is the current measurement/evidence contract. It is aggregate-first: anonymous session evidence stays separate from exact customer-profile history, unnecessary raw identifiers are excluded from growth outputs, and disabled telemetry, storage failure, row-limit/truncation or missing finance/job-cost evidence remains unavailable/insufficient/review rather than becoming a fabricated zero or KPI.

Run the focused current authority with:

```bash
python scripts/build396_growth_baseline_forward_roadmap_check.py
python scripts/release_authority_documentation_convergence_check.py
```

The retained commercial pricing authority remains independently available with:

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
