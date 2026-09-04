# Rosie Dazzlers — Current Project Handoff

This file is a living operational authority, not a release diary. Git history and archived release artifacts are the source for historical implementation detail.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`
- Accepted source branches: `main` for accepted release source and `dev` for the verified Development candidate.
- Active work: Build 315 — release hygiene, public SEO authority and current in-app contextual help.
- Feature branch: `build315-release-hygiene-seo-help`.
- Production data is not changed by this build. Any future database migration requires its own explicit migration and acceptance sequence.

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

- `development-source-gate.yml` — cumulative source, SEO, hygiene, responsive, parity and syntax authority.
- `cloudflare-development-acceptance.yml` — exact-SHA Development deployment and runtime acceptance.
- `cloudflare-pages-recovery.yml` — manual-only observe/repair path with exact-SHA confirmation and Production exclusion.

Historical numbered workflow launchers are not part of the current repository. Git history remains their archive. SQL migrations and current Cloudflare deployment/recovery mechanisms remain protected operational authorities and must not be removed merely to reduce file count.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. JSON-LD blocks, where present, must be valid JSON. `robots.txt` must advertise the canonical sitemap.

## Help contract

Authenticated work screens use the central contextual-help catalogue. Help must describe what the screen/field controls, what changes when it is edited, why the information matters, and the authoritative source for the value. Help must never expose or instruct users to paste server secrets into browser-managed settings.

## Responsive contract

Public and active application shells must retain a device-width viewport and must not impose oversized root-level inline minimum widths that block mobile rendering. Static checks are a regression floor; release acceptance still requires exact-deployment review across mobile, normal desktop web and wide business-app layouts.

## Restart point

If work is interrupted, first verify the active feature/dev SHA and the latest exact-SHA workflow results. Continue from the first failing durable authority. Do not redo accepted work and do not promote around a failed gate.
