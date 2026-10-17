# Build 571 — Service architecture / read-only catalog mapping

**Status:** implementation of a preview-only design slice; owner pricing-display policy NOT approved. Public catalog entries are already available from GET `/api/pricing_catalog_public`. That endpoint reads the centrally managed pricing catalog when available but may fall back to bundled catalog. This build changes none of it.

## Delivered
- `/preview/services/`: unindexed service-guide prototype using real read-only public-catalog response, without accepting addresses, photo uploads, contacts, deposits, prices or booking input.
- Service options rendered in canonical package order; optional treatments and existing `quote_required` flags are presented as condition/scope guidance. All values sanitized and inserted with `textContent`.
- No monetary values displayed, even when provided by the public catalog. Final prices, offer, applicability and appointments are never inferred.
- Explicit ambiguous data-source status: the public API responds `db_or_fallback` when Supabase is configured, which does NOT prove which source was read. The preview cannot assert live price authority.
- `/book` retained as real booking. `/pricing`, `/services`, and their `.html` counterparts retain canonical/redirect behavior; existing SEO and all public routes remain untouched.
- Browser accessibility basics: readable cards, focus outlines on links, status changes with aria-live, mobile single column, no motion requirement.
- Regression: `node scripts/service_guide_571_test.mjs` validates route parity and model fails closed, including zero prices, money, or mutation.

## Explicit owner decisions still required
1. Compare real App Management pricing/catalog vs bundled fallback, especially Basic Detail discrepancy, before choosing any actual from-price.
2. Approve which packages show starting-from prices and which require custom quote. Never convert a current quote-required add-on into fixed checkout without explicit review.
3. Approve public `/pricing`, `/services`, homepage CTA and `/book` routing changes, and service copy/SEO canonical URLs.
4. Approve images/consent/licensing and accessible design; verify on representative devices.
5. Plan implementation, staging, rollback and communications. No automatic public promotion beyond unindexed preview.

## Safety
Build 571 never changes published price/tax/deposit/travel controls, gift cards, maintenance plans, customer lead details, inventory, booking, Stripe, consent, Supabase, R2, providers or production environment variables. Any new published product/service-page launch requires separately approved future release.

**Release:** feature PR → exact Cloudflare feature preview & source/business checks → `dev` merge, exact CI and Development deployment → protected `dev` to `main` promotion PR and required checks → exact main Cloudflare Production/runtime/source/business verification. Code Production GREEN is distinct from the unapproved public pricing policy.
