# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities must be resolved from live refs and exact-SHA evidence.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- **Build 402 — Admin & Operations Cockpit QoL + Growth Experiment Framework** is the active bounded release.
- **Build 403 — Customer Retention, Rebooking, Service Guidance & SEO Growth** is next only after protected `main` and exact Production evidence are GREEN.
- No database migration, Production business-data mutation, R2 destructive mutation, DNS/secret mutation, accounting/inventory posting, customer charge/refund, provider mutation or customer mutation is authorized by this source release.
- `main` remains governed by `rd main protection`; missing/unobservable protection is AMBER, never inferred GREEN.

## Current cockpit / growth contract

- `admin-today.html` remains a composition surface over `/api/admin/today_needs_attention_report` plus explicit owner-task actions.
- Urgent/high exceptions are separated from normal/low due work, and refresh remains manual.
- Cockpit drill-downs route into existing authoritative Bookings, Operations, Growth and Admin workstreams; navigation does not transfer mutation authority.
- `data/growth_experiment_framework.json` defines evidence-only planning for booking abandonment, reminder timing, rebooking, referrals and review timing.
- Growth experiments cannot silently mutate pricing, booking, availability, deposit/payment, consent, outreach, reviews, public claims, accounting, inventory, provider state, schema or customer identity.
- Missing evidence remains unavailable/review-required rather than fabricated, scored or inferred.

## Responsive / interaction contract

- Shared phone/tablet/desktop acceptance remains mandatory for materially changed surfaces.
- Cockpit cards and owner-task actions retain usable touch targets and responsive layouts.
- Truthful loading/error/empty states remain visible.
- Dormant modules remain event-driven; permanent polling requires a separately authorized demonstrated need.

## Accepted operating contract

- `dev` is Development; protected `main` is Production source.
- A feature candidate must pass its focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; do not bypass `rd main protection`. Prefer a merge commit so the accepted Development SHA remains explicit in Production ancestry.
- The resulting `main` head is the exact Production source SHA and must independently pass **Production deployment/runtime/business acceptance**.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Database migrations remain separate explicit acceptance boundaries.
- Public SEO remains one meaningful H1 per indexable page with unique metadata/canonical/structured data and truthful service-area/service claims.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_396_405.md`
- `BUILD402_ADMIN_OPERATIONS_COCKPIT_GROWTH_EXPERIMENTS.md`
- `.github/workflows/admin-operations-cockpit-growth-experiment-authority.yml`
- `scripts/build402_admin_operations_cockpit_growth_experiment_check.py`
- `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`
- `.github/workflows/job-handoff-commercial-evidence-authority.yml`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/cloudflare-development-acceptance.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Start from the latest accepted GitHub checkpoint, then read this file, the release queue, forward roadmap, current contract, release governance and go-live blockers. Preserve exact feature → Development → protected-main PR → exact Production acceptance discipline and require observed Production runtime proof before calling a release GREEN.
