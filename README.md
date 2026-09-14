# Rosie Dazzlers

Current source direction: **Build 398 — Customer Journey, Booking QoL & Acquisition Quality**.

Rosie Dazzlers is one platform with a static-first public website and eight independently authorized/sleeping application modules: Customer, Detailer, Operations, Administration, I.T., Finance, DAIP, and Socials & Promotion.

## Start here

For a new chat, AI, or developer, read only:

1. `AI_PROJECT_HANDOFF.md` — current implementation, deployment and release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_396_405.md` — active forward sequence and continuing release rules.
4. `BUILD398_CUSTOMER_JOURNEY_ACQUISITION.md` — current booking QoL, acquisition evidence and mutation boundary.
5. `STARTUP_GO_LIVE_BLOCKERS.md` — current acceptance gaps and go-live evidence still requiring proof.

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

## Build 398 customer journey and acquisition quality

Build 398 is schema-neutral and source-only. It keeps the proven `/book` live-pricing and canonical booking-planner path, then adds a browser-only convenience draft containing only vehicle-size, package-code and add-on-code selections for up to 48 hours. The draft is explicitly resumable/clearable and does not contain contact, appointment, customer-profile or payment/card information.

`/admin-acquisition-quality.html` and `/api/admin/marketing_acquisition_quality` provide aggregate observed source/campaign/referrer-host/device evidence from existing `site_activity_events`. Missing attribution stays unavailable/insufficient/unattributed, the 2,000-row bound is disclosed, and no IP, User-Agent, visitor/session IDs, postal code, customer email/name or anonymous-to-customer identity join is exposed.

Build 397’s shared responsive phone/tablet/desktop authority remains mandatory. Build 398 adds phone-first touch/layout handling on the booking convenience layer and responsive evidence cards/controls on the new Admin surface.

Run the focused current authority with:

```bash
python scripts/build398_customer_journey_acquisition_quality_check.py
python scripts/build397_responsive_ux_authority_check.py
python scripts/release_authority_documentation_convergence_check.py
```

The retained Build 396 growth baseline remains independently available with:

```bash
python scripts/build396_growth_baseline_forward_roadmap_check.py
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
