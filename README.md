# Rosie Dazzlers

Current source direction: **Build 268 — repository hygiene + current modular runtime baseline**.

Rosie Dazzlers is one platform with a static-first public website and eight independently authorized/sleeping application modules: Customer, Detailer, Operations, Administration, I.T., Finance, DAIP, and Socials & Promotion.

## Start here

For a new chat, AI, or developer, read only:

1. `AI_PROJECT_HANDOFF.md` — exact current implementation/deployment truth.
2. `MASTER_VALUE_ROADMAP.md` — ordered next work and unresolved gates.

Use `DOC_INDEX.md` only to locate specialist references and `STARTUP_GO_LIVE_BLOCKERS.md` for Development/go-live acceptance.

## Canonical source locations

- Application module registry: `data/app_modules.json`
- Private navigation hierarchy: `data/internal_navigation.json`
- Route/module ownership: `data/route_module_ownership.json`
- Modular architecture: `docs/modular-app/README.md`
- Database migrations: **`sql/` only**
- Aggregate schema reference: `SUPABASE_SCHEMA.sql`
- Cloudflare Pages Functions: `functions/api/`

Build-numbered duplicate registries, root migration copies, root API shims, retired Markdown snapshots, generated reports, and comment-only “no DDL” migrations are intentionally not part of the current tree. Git history is the release archive.

## Release check

Run:

```bash
python scripts/release_check.py
```

The current check validates repository hygiene, Cloudflare Functions structure, module/role boundaries, lazy/no-poll runtime rules, PWA/push-event foundations, service/pricing convergence, route-copy parity, and public one-H1 SEO requirements.
