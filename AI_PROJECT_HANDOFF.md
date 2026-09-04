# Rosie Dazzlers — Current Project Handoff

This file is a living operational authority, not a release diary. Git history and archived release artifacts are the source for historical implementation detail.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`
- Accepted source branches: `main` for accepted release source and `dev` for the verified Development candidate.
- Last accepted release: Build 316 at exact SHA `3bbd91f1ea4a4e9e285069b32ad7e38dc4edf87b` on both `main` and `dev` before Build 317 work began.
- Active work: Build 317 — Final Balance Readiness & Manual Payment Handoff.
- Feature branch: `build317-final-balance-readiness`.
- Build 317 is source-only. It adds no database migration and does not change Production data during source promotion.

## Build 317 operating contract

Build 317 reuses the existing booking finance, tracked final-balance request and hosted-checkout authorities. The readiness surface is fail-closed and read-only until an authorized operator deliberately chooses an action.

- No automatic charge.
- No automatic final-balance request.
- No recurring billing.
- Customer notification is not automatic from the readiness cockpit.
- An authorized operator must explicitly create a tracked request and explicitly create/refresh a hosted checkout when required.
- Readiness states are `ready`, `blocked`, `requested`, and `paid` (displayed as Paid / Closed).
- The calculated service balance uses booking total minus deposits, final payments, discounts and other service collections, plus refunds. Tips are excluded from the service-balance calculation.

## Release rules

1. Implement on the active build branch.
2. Validate the exact feature SHA with the current source gate.
3. Move that exact SHA to `dev` only after feature validation succeeds.
4. Complete Development/Cloudflare runtime acceptance on that exact SHA.
5. Move the same exact SHA to `main` only after Development is accepted.
6. Verify exact-main CI/deployment evidence before calling the release GREEN.
7. Do not infer deployment health from branch names, elapsed time or an older successful run.

## Durable release authorities

The active GitHub Actions surface is deliberately small and release-number independent:

- `development-source-gate.yml` — cumulative source, SEO, hygiene, responsive, maintenance/retention, final-balance readiness, parity and syntax authority.
- `cloudflare-development-acceptance.yml` — exact-SHA Development deployment and runtime acceptance.
- `cloudflare-pages-recovery.yml` — manual-only observe/repair path with exact-SHA confirmation and Production exclusion.

Historical numbered workflow launchers are not part of the current repository. Git history remains their archive. SQL migrations and current Cloudflare deployment/recovery mechanisms remain protected operational authorities and must not be removed merely to reduce file count.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. JSON-LD blocks, where present, must be valid JSON. `robots.txt` must advertise the canonical sitemap.

## Help contract

Authenticated work screens use operating or contextual Help that describes what the screen/field controls, what changes when it is edited, why the information matters, and the authoritative source for the value. Help must never expose or instruct users to paste server secrets into browser-managed settings.

## Responsive contract

Public and active application shells must retain a device-width viewport and must not impose oversized root-level inline minimum widths that block mobile rendering. Static checks are a regression floor; release acceptance still requires exact-deployment review across mobile, normal desktop web and wide business-app layouts.

## Restart point

If work is interrupted during Build 317, first verify the feature SHA and its Current Source Gate. After that passes, promote the identical SHA to `dev`, require Development/Cloudflare acceptance, then promote the identical SHA to `main` and require exact-main source/deployment evidence. Do not redo accepted Build 316 work and do not promote around a failed gate.
