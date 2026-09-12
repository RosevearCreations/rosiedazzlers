# Rosie Dazzlers

Current source direction: **Build 391 — Photo Studio & R2 Media Reliability**.

Rosie Dazzlers is one platform with a static-first public website and eight independently authorized/sleeping application modules: Customer, Detailer, Operations, Administration, I.T., Finance, DAIP, and Socials & Promotion.

## Start here

For a new chat, AI, or developer, read only:

1. `AI_PROJECT_HANDOFF.md` — current implementation, deployment and release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_386_395.md` — active forward sequence and continuing release rules.
4. `STARTUP_GO_LIVE_BLOCKERS.md` — current acceptance gaps and go-live evidence still requiring proof.

Use `DOC_INDEX.md` only to locate specialist references. The completed prior forward-roadmap phase and `docs/BACKUP_RESTORE_RELEASE_RECOVERY.md` remain retained historical/specialist authorities, not the normal restart point.

## Canonical source locations

- Application module registry: `data/app_modules.json`
- Private navigation hierarchy: `data/internal_navigation.json`
- Route/module ownership: `data/route_module_ownership.json`
- Modular architecture: `docs/modular-app/README.md`
- Database migrations: **`sql/` only**
- Aggregate schema reference: `SUPABASE_SCHEMA.sql`
- Cloudflare Pages Functions: `functions/api/`

Build-numbered duplicate registries, root migration copies, root API shims, retired Markdown snapshots, generated reports, and comment-only “no DDL” migrations are intentionally not part of the current tree. Git history is the release archive.

## Current Photo Studio and R2 media authority

The existing managed photo library remains the single public image authority. Photo Studio listing and assignment accept only active image records whose R2 keys belong to the approved public prefix allow-list. Private DAIP, customer, job, intake and evidence media cannot be assigned into public website placements merely because a database row exists.

One approved public image may serve multiple independent targets. Before/After targets expose pair-group and side metadata while retaining the fail-closed rule that the same image cannot occupy both sides. Remove, reset and unassign operations deactivate the target without deleting the underlying asset.

Ordinary Photo Studio and public website-image reads are database-backed: they do not list, synchronize, delete or otherwise mutate R2. The explicit R2 sync path remains one approved prefix per request with cursor continuation and bounded list work. The explicit delete path remains guarded by active assignment and Gallery Before/After reference checks and fails safely when the public bucket binding is unavailable.

Run the focused authority with:

```bash
node --check functions/api/_lib/photo-studio-safety.js
node --check functions/api/_lib/public-website-images.js
node --check functions/api/admin/photo_assignment_save.js
node --check functions/api/admin/photo_library_list.js
node --experimental-default-type=module scripts/build391_photo_studio_r2_reliability_test.mjs
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
