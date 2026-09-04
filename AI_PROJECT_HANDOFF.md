# Rosie Dazzlers — Current Project Handoff

This file is a living operational authority, not a release diary. Git history and archived release artifacts are the source for historical implementation detail.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- `main` remains frozen at the last user-authorized Production release until the user explicitly asks for another Production promotion.
- `dev` is the accepted Development line and the base for ongoing sequential feature work.
- Accepted Development checkpoint: Build 320 at exact SHA `5a414276e1a2abcbe2d31ac1f24583599647df07`.
- Active work: Build 321 — Payment Reconciliation Evidence.
- Feature branch: `build321-payment-reconciliation`.
- The active build is source-only and introduces no database migration.

## Active operating contract

The active build closes the visibility gap between Stripe Checkout Session state, the tracked final-balance request, and the booking final-payment ledger.

- Reconciliation is read-only. It does not charge, create a checkout, write finance, notify a customer or alter payment state.
- The server queries the exact persisted Stripe Checkout Session by GET only when environment policy permits provider contact.
- Live Stripe credentials are blocked for Development reconciliation; unknown credential mode also fails closed.
- Provider amount, currency and Rosie Dazzlers request identity must match before provider-paid evidence is considered actionable.
- Provider-paid/local-unpaid and provider-paid/finance-missing states are surfaced as reconciliation-required, not silently repaired.
- Matched provider-paid + local-paid + finance-covered state is reported as reconciled with no action required.
- Identity mismatch, local/provider disagreement, complete-but-unpaid, provider errors and inconclusive states are blocked for manual review.
- Unpaid open provider sessions remain active; unpaid expired sessions route back to Payment Recovery.
- Webhook verification is not asserted and provider reference values are not exposed to the browser.
- The existing booking-finance writer appends events but has no database-enforced provider idempotency key. Automatic finance posting is therefore intentionally out of scope rather than risking a duplicate final-payment event.
- Mobile, tablet and desktop layouts remain part of the release contract.

## Current promotion rule

1. Implement on an isolated feature branch created from exact `dev`.
2. Require exact-SHA feature source validation and Cloudflare preview success.
3. Fast-forward `dev` to that identical SHA only after feature acceptance.
4. Require Current Source Gate plus Cloudflare Development Acceptance on exact `dev`.
5. Stop there. Do not move `main` unless the user explicitly asks for Production promotion.
6. A source promotion never authorizes a database migration.

## Durable release authorities

- `development-source-gate.yml` — cumulative source, SEO, hygiene, responsive, maintenance/retention, final-balance and payment authorities.
- `payment_reconciliation_check.py` — provider/local/finance comparison, read-only, credential-boundary and responsive regression authority.
- `payment_recovery_customer_handoff_check.py` — duplicate-checkout, recovery confirmation and customer-return authority.
- `cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. JSON-LD blocks, where present, must be valid JSON. `robots.txt` must advertise the canonical sitemap.

## Help and responsive contracts

Authenticated work screens must include useful operating/contextual Help and must never expose server secrets. Public and active application shells retain a device-width viewport and avoid oversized root-level minimum widths that block mobile rendering. New admin workflows must have usable touch targets, loading/error/empty states, and a deliberate narrow-screen layout. Static checks are the regression floor; exact Development deployment remains the acceptance boundary.

## Restart point

If interrupted, verify the active feature SHA and Current Source Gate first. Continue from the first failing authority. After the feature is accepted, promote only to `dev`, verify exact-SHA Development acceptance, and then continue to the next sequential Development build unless the user changes direction.
