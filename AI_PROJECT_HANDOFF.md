# Rosie Dazzlers — Current Project Handoff

This file is a living operational authority, not a release diary. Git history and archived release artifacts are the source for historical implementation detail.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- `main` remains frozen at the last user-authorized Production release until the user explicitly asks for another Production promotion.
- `dev` is the accepted Development line and the base for ongoing sequential feature work.
- Accepted Development checkpoint: Build 323 at exact SHA `740d809eb069808bec2ccb411f694d5aa974f129`.
- Active work: Build 324 — Booking Funnel Analytics & Conversion.
- Feature branch: `build324-booking-funnel-analytics`.
- The active build is source-only and introduces no database migration.

## Active operating contract

The active build makes the real five-step booking funnel measurable by device without adding new customer tracking or recreating the previous high-CPU analytics pattern.

- Existing public analytics already records `booking_step_view`, checkout start/completion and a server-classified `device_type`; this build reuses that authority rather than adding a parallel event model.
- Funnel metrics count unique sessions that reached each stage at least once, so page refreshes and repeated clicks do not inflate conversion.
- The five stages are Date + Vehicle, Package, Add-ons, Customer Details, and Deposit / Payment, followed by Checkout Started and Checkout Completed.
- Mobile, tablet, desktop and unknown-device sessions are aggregated separately.
- Start-to-completion and checkout-completion rates are calculated per device; mobile-vs-desktop completion gaps over five percentage points are surfaced directionally.
- The endpoint is read-only and returns only aggregate counts/rates. Raw session IDs, visitor IDs, names, email, phone and IP details are not serialized to the browser.
- The raw-event evidence window is capped at 30 days and 2,500 rows. Reaching the cap is disclosed as bounded/truncated evidence rather than treated as exhaustive.
- There is no background polling. The cockpit loads once and refreshes only on explicit user action/window change.
- Desktop, tablet and mobile layouts remain part of acceptance with device-width viewport, 44px controls and narrow-screen device cards.

## Current promotion rule

1. Implement on an isolated feature branch created from exact `dev`.
2. Require exact-SHA feature source validation and Cloudflare preview success.
3. Fast-forward `dev` to that identical SHA only after feature acceptance.
4. Require Current Source Gate plus Cloudflare Development Acceptance on exact `dev`.
5. Stop there. Do not move `main` unless the user explicitly asks for Production promotion.
6. A source promotion never authorizes a database migration.

## Durable release authorities

- `development-source-gate.yml` — cumulative source, SEO, responsive, payment, release-safety, Production-readiness and booking-funnel authorities.
- `booking_funnel_device_check.py` — unique-session/device, privacy, CPU-bound and responsive regression authority.
- `production_readiness_check.py` — I.T. evidence-only Production-readiness authority.
- `release_rollback_recovery_check.py` — rollback/recovery safety authority.
- `cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. JSON-LD blocks, where present, must be valid JSON. `robots.txt` must advertise the canonical sitemap.

## Help and responsive contracts

Authenticated work screens must include useful operating/contextual Help and must never expose server secrets. Public and active application shells retain a device-width viewport and avoid oversized root-level minimum widths that block mobile rendering. New admin workflows must have usable touch targets, loading/error/empty states, and a deliberate narrow-screen layout. Static checks are the regression floor; exact Development deployment remains the acceptance boundary.

## Restart point

If interrupted, verify the active feature SHA and Current Source Gate first. Continue from the first failing authority. After the feature is accepted, promote only to `dev`, verify exact-SHA Development acceptance, and then continue to the next sequential Development build unless the user changes direction. The next natural roadmap slice is booking-wizard mobile/desktop UX refinement using this funnel evidence; Production remains closed.
