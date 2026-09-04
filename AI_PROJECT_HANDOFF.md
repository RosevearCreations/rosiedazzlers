# Rosie Dazzlers — Current Project Handoff

This file is a living operational authority, not a release diary. Git history and archived release artifacts are the source for historical implementation detail.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- `main` is frozen at the last user-authorized Production release until the user explicitly asks for another Production promotion.
- `dev` is the accepted Development line and the base for ongoing sequential feature work.
- Last accepted Development/Production checkpoint: Build 317 at exact SHA `512ae93a7867b897a26c532cf25282997858e82f`.
- Active work: Build 318 — Payment Provider Readiness & Test Acceptance.
- Feature branch: `build318-payment-provider-readiness`.
- The active build is source-only and introduces no database migration.

## Active operating contract

The active build adds a read-only payment-provider readiness surface for Development. It reports safe derived state only and never returns payment credentials.

- Stripe integration availability is real and is derived from the existing hosted-checkout source.
- Stripe credential mode is classified only as test/live/unknown/not-configured; the secret value never leaves the server.
- A live Stripe credential blocks Development provider acceptance.
- PayPal is reported as not integrated because no current PayPal checkout integration exists in source.
- Manual payment remains the fail-closed operational fallback.
- No automatic charge, checkout creation, customer notification, or recurring billing is permitted.
- Any payment mutation remains an explicit operator action in an existing payment workflow.

## Current promotion rule

1. Implement on an isolated feature branch created from exact `dev`.
2. Require exact-SHA feature source validation and Cloudflare preview success.
3. Fast-forward `dev` to that identical SHA only after feature acceptance.
4. Require Current Source Gate plus Cloudflare Development Acceptance on exact `dev`.
5. Stop there. Do not move `main` unless the user explicitly asks for Production promotion.
6. A source promotion never authorizes a database migration.

## Durable release authorities

- `development-source-gate.yml` — cumulative source, SEO, hygiene, responsive, maintenance/retention, final-balance, payment-provider, parity and syntax authority.
- `cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `cloudflare-pages-recovery.yml` — manual-only observe/repair path with exact-SHA confirmation and Production exclusion.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. JSON-LD blocks, where present, must be valid JSON. `robots.txt` must advertise the canonical sitemap.

## Help and responsive contracts

Authenticated work screens must include useful operating/contextual Help and must never expose server secrets. Public and active application shells retain a device-width viewport and avoid oversized root-level minimum widths that block mobile rendering. Static checks are the regression floor; exact Development deployment remains the acceptance boundary.

## Restart point

If interrupted, verify the active feature SHA and Current Source Gate first. Continue from the first failing authority. After the feature is accepted, promote only to `dev`, verify exact-SHA Development acceptance, and then continue to the next sequential Development build unless the user changes direction.
