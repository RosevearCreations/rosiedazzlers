# Rosie Dazzlers — Current Project Handoff

This file is a living operational authority, not a release diary. Git history and archived release artifacts are the source for historical implementation detail.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- `main` remains frozen at the last user-authorized Production release until the user explicitly asks for another Production promotion.
- `dev` is the accepted Development line and the base for ongoing sequential feature work.
- Accepted Development checkpoint: Build 321 at exact SHA `09d4ba2e1986e1857c31451915d164fd7694e2c0`.
- Active work: Build 322 — Release Rollback & Recovery Acceptance.
- Feature branch: `build322-release-rollback-recovery-acceptance`.
- The active build is source-only and introduces no database migration.

## Active operating contract

The active build closes the rollback/recovery roadmap item without opening a Production mutation path.

- Existing stuck-deployment recovery remains manual-only, `dev`-only, exact-current-SHA confirmed and restricted to non-terminal Development preview deployments.
- Recovery observe mode is non-mutating. Repair may mutate only the exact stuck Development preview after the canonical helper independently revalidates branch, SHA, preview environment and non-terminal status.
- A new Development rollback-readiness workflow is manual-only and read-only. It never moves Git refs and never mutates Cloudflare.
- A rollback candidate must be a full exact SHA, present in repository history, strictly older than current `dev`, and an ancestor of current `dev` rather than unrelated/divergent history.
- The exact candidate must already have a successful Cloudflare Pages deployment on branch `dev`.
- The immutable candidate deployment must report `environment=preview`, `uses_functions=true`, exact SHA/branch identity and must pass static plus contextual smoke checks.
- Production branch identity is resolved from the live Cloudflare project and both rollback verification and recovery reject Production targets.
- Rollback evidence is not authorization to move `dev`; any future Git rollback remains a separate explicit human-authorized action.
- The rollback verifier performs Cloudflare GET/read operations only and grants GitHub Actions `contents: read` permission only.

## Current promotion rule

1. Implement on an isolated feature branch created from exact `dev`.
2. Require exact-SHA feature source validation and Cloudflare preview success.
3. Fast-forward `dev` to that identical SHA only after feature acceptance.
4. Require Current Source Gate plus Cloudflare Development Acceptance on exact `dev`.
5. Stop there. Do not move `main` unless the user explicitly asks for Production promotion.
6. A source promotion never authorizes a database migration.

## Durable release authorities

- `development-source-gate.yml` — cumulative source, SEO, responsive, payment and rollback/recovery authorities.
- `release_rollback_recovery_check.py` — rollback read-only, prior-SHA ancestry, immutable preview and recovery safety regression authority.
- `development-rollback-readiness.yml` — manual read-only prior-SHA rollback candidate drill.
- `cloudflare-pages-recovery.yml` — manual observe/repair path for one exact stuck Development deployment.
- `cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. JSON-LD blocks, where present, must be valid JSON. `robots.txt` must advertise the canonical sitemap.

## Help and responsive contracts

Authenticated work screens must include useful operating/contextual Help and must never expose server secrets. Public and active application shells retain a device-width viewport and avoid oversized root-level minimum widths that block mobile rendering. New admin workflows must have usable touch targets, loading/error/empty states, and a deliberate narrow-screen layout. Static checks are the regression floor; exact Development deployment remains the acceptance boundary.

## Restart point

If interrupted, verify the active feature SHA and Current Source Gate first. Continue from the first failing authority. After the feature is accepted, promote only to `dev`, verify exact-SHA Development acceptance, and then continue to the next sequential Development build unless the user changes direction. The next remaining accepted roadmap item after rollback/recovery is the Production-readiness dashboard, but Production itself remains closed.
