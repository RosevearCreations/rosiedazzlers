# Rosie Dazzlers — Current Project Handoff

This file is a living operational authority, not a release diary. Git history and archived release artifacts are the source for historical implementation detail.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- `main` remains frozen at the last user-authorized Production release until the user explicitly asks for another Production promotion.
- `dev` is the accepted Development line and the base for ongoing sequential feature work.
- Accepted Development checkpoint: Build 322 at exact SHA `bee75b7201ca5510b48a3bc2c0f07d487dcfb4ba`.
- Active work: Build 323 — Production Readiness Dashboard.
- Feature branch: `build323-production-readiness-dashboard`.
- The active build is source-only and introduces no database migration.

## Active operating contract

The active build provides one I.T.-authorized evidence-only view of Production readiness without creating a Production control plane.

- Access requires authenticated staff plus the existing `it.runtime.view` action permission; administrators retain full authorized access through the canonical role authority.
- The readiness endpoint is GET/read-only. It performs no Git, Cloudflare, database, payment-provider or Production mutation.
- The dashboard separates source policy from runtime evidence. Source workflow presence is not represented as a live CI run result.
- Cloudflare Pages runtime branch/SHA/URL metadata is used only when actually present. Missing or partial runtime metadata becomes incomplete evidence rather than inferred deployment state.
- A Production-like runtime is a blocker for Development readiness review.
- A live Stripe credential on a Development-like runtime is a blocker. Unknown Stripe credential mode also fails closed; an unconfigured provider remains incomplete evidence.
- The dashboard may report `ready_for_human_review`, `evidence_incomplete` or `blocked`. Ready for human review is explicitly not promotion authorization.
- `main` remains frozen. Production promotion still requires explicit user authorization and the normal exact-SHA release process.
- Desktop, tablet and mobile layouts are part of the acceptance contract, including device-width viewport, 44px touch controls, loading/error states and narrow-screen evidence cards.

## Current promotion rule

1. Implement on an isolated feature branch created from exact `dev`.
2. Require exact-SHA feature source validation and Cloudflare preview success.
3. Fast-forward `dev` to that identical SHA only after feature acceptance.
4. Require Current Source Gate plus Cloudflare Development Acceptance on exact `dev`.
5. Stop there. Do not move `main` unless the user explicitly asks for Production promotion.
6. A source promotion never authorizes a database migration.

## Durable release authorities

- `development-source-gate.yml` — cumulative source, SEO, responsive, payment, rollback/recovery and Production-readiness authorities.
- `production_readiness_check.py` — I.T. permission, evidence-only, fail-closed runtime/provider and responsive regression authority.
- `release_rollback_recovery_check.py` — rollback/recovery safety authority.
- `development-rollback-readiness.yml` — manual read-only prior-SHA rollback candidate drill.
- `cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. JSON-LD blocks, where present, must be valid JSON. `robots.txt` must advertise the canonical sitemap.

## Help and responsive contracts

Authenticated work screens must include useful operating/contextual Help and must never expose server secrets. Public and active application shells retain a device-width viewport and avoid oversized root-level minimum widths that block mobile rendering. New admin workflows must have usable touch targets, loading/error/empty states, and a deliberate narrow-screen layout. Static checks are the regression floor; exact Development deployment remains the acceptance boundary.

## Restart point

If interrupted, verify the active feature SHA and Current Source Gate first. Continue from the first failing authority. After the feature is accepted, promote only to `dev`, verify exact-SHA Development acceptance, and then continue to the next sequential Development build unless the user changes direction. Production remains closed until explicitly authorized.
