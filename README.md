# Rosie Dazzlers

Current source direction: **Build 385 — Backup, Restore & Release Recovery Drill**.

Rosie Dazzlers is one platform with a static-first public website and eight independently authorized/sleeping application modules: Customer, Detailer, Operations, Administration, I.T., Finance, DAIP, and Socials & Promotion.

## Start here

For a new chat, AI, or developer, read only:

1. `AI_PROJECT_HANDOFF.md` — current implementation, deployment and release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_378_385.md` — approved forward sequence and continuing release rules.
4. `docs/BACKUP_RESTORE_RELEASE_RECOVERY.md` — current recovery evidence matrix, drill and authorization boundaries.

Use `DOC_INDEX.md` only to locate specialist references and `STARTUP_GO_LIVE_BLOCKERS.md` for Development/go-live acceptance details.

## Canonical source locations

- Application module registry: `data/app_modules.json`
- Private navigation hierarchy: `data/internal_navigation.json`
- Route/module ownership: `data/route_module_ownership.json`
- Modular architecture: `docs/modular-app/README.md`
- Database migrations: **`sql/` only**
- Aggregate schema reference: `SUPABASE_SCHEMA.sql`
- Cloudflare Pages Functions: `functions/api/`

Build-numbered duplicate registries, root migration copies, root API shims, retired Markdown snapshots, generated reports, and comment-only “no DDL” migrations are intentionally not part of the current tree. Git history is the release archive.

## Release authority

Run the cumulative source check with:

```bash
python scripts/release_check.py
```

Run the living release/documentation convergence guard with:

```bash
python scripts/release_authority_documentation_convergence_check.py
```

Run the focused recovery drill source authority with:

```bash
python scripts/backup_restore_release_recovery_drill_check.py
```

The Current Source Gate executes the durable cross-release authorities automatically. Feature candidates must pass source and feature-preview acceptance before `dev` moves. Development must prove the identical SHA through retained source/runtime gates. When Production promotion is authorized, `main` is fast-forwarded without force to that same Development-GREEN SHA.

The current recovery release is observation-only. It retains the existing Development rollback-candidate and narrowly guarded Cloudflare recovery mechanics, and adds an operator recovery matrix for Git/source, Cloudflare Pages, Supabase/PostgreSQL, R2/media, configuration/secrets, DNS/domain and provider dependencies. Missing recovery evidence fails closed as `NOT VERIFIED`.

The drill cannot move Git refs, restore a database, migrate schema, write/delete R2 objects, mutate DNS, rotate secrets, charge/refund a customer or mutate provider/business state. Any real recovery mutation requires explicit operator authorization outside the drill, followed by normal exact-SHA re-acceptance.

Production is not considered GREEN from source promotion alone. `.github/workflows/production-business-acceptance-authority.yml` independently requires the exact `main` SHA to match a successful Cloudflare Production deployment with Functions metadata, then smokes both the immutable deployment and `https://rosiedazzlers.ca`. Its acceptance helper is observation-only and does not deploy, retry, roll back, charge providers or mutate business data.

The cumulative release checks retain repository hygiene, Cloudflare Functions structure, module/role boundaries, lazy/no-poll runtime rules, service/pricing convergence, route-copy parity, public one-H1 SEO requirements, release-document convergence and exact-SHA release discipline.