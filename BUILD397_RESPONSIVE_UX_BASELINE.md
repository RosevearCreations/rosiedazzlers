# Build 397 — Responsive UX & Interaction Baseline

Build 397 turns the roadmap refocus into an implemented, release-gated responsive foundation.

## Implemented

- Preserves the accepted Build 396 shared stylesheet as `assets/site-base-build396.css`.
- Keeps `assets/site.css` as the stable compatibility URL already used by public, customer and admin surfaces.
- Layers `assets/build397-responsive-baseline.css` after the accepted base.
- Adds responsive contracts for min-width containment, media sizing, touch targets, mobile form font sizing, dialog containment, table scrolling, single-column application shells, mobile navigation wrapping, focus visibility and reduced-motion preference.
- Adds a fail-closed Build 397 authority check and GitHub Actions workflow.
- Validates viewport metadata and the shared stylesheet route on the homepage, booking surface, admin application and I.T. surface.

## Release boundary

This build is source/UI/release-authority only. It does not require a schema migration and does not mutate Production business data, accounting records, inventory, payments/providers, secrets, DNS or R2 objects.
