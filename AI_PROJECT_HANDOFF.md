# Rosie Dazzlers — Current Project Handoff

This file is a living operational authority, not a release diary. Git history and archived release artifacts are the source for historical implementation detail.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- `main` remains frozen at the last user-authorized Production release until the user explicitly asks for another Production promotion.
- `dev` is the accepted Development line and the base for ongoing sequential feature work.
- Accepted Development checkpoint: Build 318 at exact SHA `9d206c7c0a78894e337894dd3b796c64b52559c6`.
- Active work: Build 319 — Payment Acceptance Evidence & Sandbox Verification.
- Feature branch: `build319-payment-acceptance-evidence`.
- The active build is source-only and introduces no database migration.

## Active operating contract

The active build extends provider readiness with a read-only Development evidence cockpit and ledger based on existing final-balance payment records.

- Stripe secret mode is classified server-side as test/live/unknown/not-configured; no secret value is returned.
- A live or unclassifiable Stripe credential blocks Development provider acceptance.
- Persisted Stripe checkout ID plus checkout-created time counts only as checkout-creation evidence, never payment-completion proof.
- Persisted paid state is reported conservatively as application evidence. It is not labelled webhook verified because current source does not establish that assurance.
- Existing provider event/payment-intent references may be recognized as present without returning their values.
- PayPal remains explicitly not integrated; no sandbox acceptance is fabricated.
- Manual payment remains an operational fallback and is excluded from Stripe provider acceptance.
- No automatic charge, provider mutation, checkout creation, customer notification, or recurring billing is permitted by the evidence surface.
- Mobile, tablet and desktop layouts are part of the acceptance contract; narrow screens use stacked evidence cards instead of clipped desktop tables.

## Current promotion rule

1. Implement on an isolated feature branch created from exact `dev`.
2. Require exact-SHA feature source validation and Cloudflare preview success.
3. Fast-forward `dev` to that identical SHA only after feature acceptance.
4. Require Current Source Gate plus Cloudflare Development Acceptance on exact `dev`.
5. Stop there. Do not move `main` unless the user explicitly asks for Production promotion.
6. A source promotion never authorizes a database migration.

## Durable release authorities

- `development-source-gate.yml` — cumulative source, SEO, hygiene, responsive, maintenance/retention, final-balance, provider-readiness, payment-evidence, parity and syntax authority.
- `payment_acceptance_evidence_check.py` — fail-closed payment evidence plus mobile/tablet/desktop regression authority.
- `cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `cloudflare-pages-recovery.yml` — manual-only observe/repair path with exact-SHA confirmation and Production exclusion.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. JSON-LD blocks, where present, must be valid JSON. `robots.txt` must advertise the canonical sitemap.

## Help and responsive contracts

Authenticated work screens must include useful operating/contextual Help and must never expose server secrets. Public and active application shells retain a device-width viewport and avoid oversized root-level minimum widths that block mobile rendering. New admin workflows must have usable touch targets, loading/error/empty states, and a deliberate narrow-screen layout. Static checks are the regression floor; exact Development deployment remains the acceptance boundary.

## Restart point

If interrupted, verify the active feature SHA and Current Source Gate first. Continue from the first failing authority. After the feature is accepted, promote only to `dev`, verify exact-SHA Development acceptance, and then continue to the next sequential Development build unless the user changes direction.
