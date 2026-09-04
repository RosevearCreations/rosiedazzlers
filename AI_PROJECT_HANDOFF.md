# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and archived release artifacts remain the historical implementation record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Last fully accepted/synchronized release: **Build 325 — Booking Wizard Responsive UX**.
- Exact accepted SHA: `7d8b5cb4b85986636a4a70c4bd298f6d7bc51de2`.
- At the active-work start boundary, both `dev` and `main` were exactly that SHA.
- Active work: **Build 326 — Booking Completion + Retention/Rebooking Lifecycle**.
- Active branch: `build326-booking-retention-rebooking`.
- The active scope is application/routing work and introduces no database migration.

## Why the active scope expanded

The planned retention/rebooking review found a higher-priority checkout boundary defect. Canonical Stripe and PayPal checkout success URLs returned customers to `/complete`, but `/complete` is the existing token-protected customer job completion/sign-off page backed by `/api/progress/*`. Those are different lifecycle stages and must not share an unverified browser-success contract.

The active work therefore repairs payment completion first, then exposes retention/rebooking only after provider evidence agrees with the stored booking.

## Active operating contract

- `/complete?token=...` remains customer job completion/sign-off only.
- Existing payment-provider returns from `/complete?provider=stripe|paypal...` are narrowly redirected to `/booking-confirmed` before the sign-off page handles them.
- Stripe confirmation is read/verify only. It cross-checks the stored Stripe Session ID, Stripe Checkout Session, booking metadata, CAD currency, expected payable deposit and `payment_status=paid` server-side.
- The signed Stripe webhook remains the only active authority that changes a Stripe booking into its settled/confirmed state.
- PayPal browser return is captured through the existing `/api/paypal/capture-order` endpoint, which matches the stored PayPal order, validates CAD/amount and is replay safe before persisting confirmation.
- Gift-covered deposits remain checkout-authoritative: only a successful `gift_only_confirm` response receives a local booking-confirmation URL.
- `/booking-confirmed` is `noindex` and never renders booking/customer/payment identifiers.
- Rebooking carries only previous package and vehicle-size hints. Date, slot, location, customer/contact/address details, policies and payment are fresh booking decisions.
- Established funnel events remain unchanged. The active scope adds `booking_confirmation_view`, `booking_rebook_prompt_view`, `booking_rebook_start`, and `booking_rebook_prefill_applied`.

## Current release procedure

A RosieDazzlers release is not GREEN merely because its feature code exists.

1. Start the feature branch from the exact prior synchronized GREEN SHA.
2. Require exact-SHA Current Source Gate success on the feature branch.
3. Require Cloudflare feature deployment/runtime evidence on that same SHA.
4. Fast-forward `dev` to that identical SHA; never force or synthesize history.
5. Require exact-SHA Current Source Gate plus Cloudflare Development Acceptance on `dev`.
6. Only after Development is GREEN, fast-forward `main` to the identical SHA.
7. Require exact-SHA Current Source Gate plus Cloudflare Production deployment on `main`.
8. Verify `dev == main`; only then call the release GREEN/closed and select the next scope.
9. Source promotion never authorizes a database migration. Schema work has its own migration/acceptance boundary.

## Durable release authorities

- `.github/workflows/development-source-gate.yml` — cumulative current-source authority.
- `scripts/booking_funnel_device_check.py` — aggregate funnel/device/privacy authority.
- `scripts/booking_wizard_responsive_ux_check.py` — responsive/touch/focus/route-parity authority.
- `scripts/booking_completion_retention_check.py` — active payment-completion boundary, provider verification, privacy and rebooking authority.
- `scripts/production_readiness_check.py` — I.T. Production-readiness authority.
- `scripts/release_rollback_recovery_check.py` — rollback/recovery safety authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. JSON-LD blocks, where present, must be valid JSON. `robots.txt` must advertise the canonical sitemap. Payment/confirmation utility pages that are deliberately excluded from the sitemap may use `noindex`.

## Help and responsive contracts

Authenticated work screens must include useful operating/contextual Help and must never expose server secrets. Public and active application shells retain a device-width viewport and usable narrow-screen layouts. New interaction workflows must have usable touch targets, loading/error/empty states, and fail-safe recovery. Static checks are the regression floor; exact Cloudflare deployment evidence remains part of release acceptance.

## Restart point

If interrupted during the active work, do not redo the two previously accepted booking-analysis/UX slices and do not trust old Production-freeze notes. Verify the current head of `build326-booking-retention-rebooking`, inspect the first failing Current Source Gate authority, and continue there. `dev` and `main` must remain on the accepted baseline until the feature SHA passes feature source and Cloudflare evidence.

After the active scope is fully synchronized GREEN, choose the next unfinished roadmap slice from current repository evidence rather than a stale build number. The broader agreed sequence remains retention/booking analytics follow-through, maintenance/fleet business rules, and then deeper payment/Production-readiness work unless a higher-priority defect is discovered.
