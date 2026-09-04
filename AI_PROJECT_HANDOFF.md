# Rosie Dazzlers — Current Project Handoff

This file is a living operational authority, not a release diary. Git history and archived release artifacts are the source for historical implementation detail.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- `main` remains frozen at the last user-authorized Production release until the user explicitly asks for another Production promotion.
- `dev` is the accepted Development line and the base for ongoing sequential feature work.
- Accepted Development checkpoint: Build 319 at exact SHA `498c7cb83910f09df67a51b444278733d825b0f2`.
- Active work: Build 320 — Payment Recovery & Customer Handoff.
- Feature branch: `build320-payment-recovery-customer-handoff`.
- The active build is source-only and introduces no database migration.

## Active operating contract

The active build closes duplicate-payment risk around failed, expired and interrupted final-balance checkout handoffs.

- Recovery readiness is read-only and groups tracked requests into recovery-required, existing-checkout-guarded, checkout-needed/manual, and paid/closed states.
- The hosted-checkout mutation verifies an existing Stripe Checkout Session before any replacement is considered.
- Stripe sessions that remain open are reused rather than duplicated.
- A replacement Stripe session is permitted only after the provider reports the persisted prior session as expired.
- Provider-paid, complete-but-unreconciled, or unknown states fail closed and require reconciliation instead of creating another payment path.
- Expired/cancelled request recovery requires explicit operator confirmation, a recovery reason, and a new future expiry.
- The recovery cockpit never automatically charges or notifies a customer and always submits `notify_customer: false`.
- A customer returning from checkout is treated as unconfirmed until Rosie Dazzlers data records the payment. While confirmation is unresolved, the public page hides pay-again actions.
- A customer who cancels checkout may return to the same persisted checkout URL; cancellation does not create another provider session.
- Mobile, tablet and desktop layouts remain part of the acceptance contract with touch-friendly actions and stacked narrow-screen recovery cards.

## Current promotion rule

1. Implement on an isolated feature branch created from exact `dev`.
2. Require exact-SHA feature source validation and Cloudflare preview success.
3. Fast-forward `dev` to that identical SHA only after feature acceptance.
4. Require Current Source Gate plus Cloudflare Development Acceptance on exact `dev`.
5. Stop there. Do not move `main` unless the user explicitly asks for Production promotion.
6. A source promotion never authorizes a database migration.

## Durable release authorities

- `development-source-gate.yml` — cumulative source, SEO, hygiene, responsive, maintenance/retention, final-balance and payment authorities.
- `payment_recovery_customer_handoff_check.py` — duplicate-checkout, recovery confirmation, customer-return and mobile regression authority.
- `cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `cloudflare-pages-recovery.yml` — manual-only observe/repair path with exact-SHA confirmation and Production exclusion.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. JSON-LD blocks, where present, must be valid JSON. `robots.txt` must advertise the canonical sitemap.

## Help and responsive contracts

Authenticated work screens must include useful operating/contextual Help and must never expose server secrets. Public and active application shells retain a device-width viewport and avoid oversized root-level minimum widths that block mobile rendering. New admin workflows must have usable touch targets, loading/error/empty states, and a deliberate narrow-screen layout. Static checks are the regression floor; exact Development deployment remains the acceptance boundary.

## Restart point

If interrupted, verify the active feature SHA and Current Source Gate first. Continue from the first failing authority. After the feature is accepted, promote only to `dev`, verify exact-SHA Development acceptance, and then continue to the next sequential Development build unless the user changes direction.
