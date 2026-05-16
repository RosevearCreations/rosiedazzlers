# Current Implementation State — Build 147

**Updated:** 2026-05-16

Rosie Dazzlers is currently a Cloudflare Pages + Pages Functions + Supabase platform with public booking, pricing, service, gear, consumables, gallery, review/proof, service-area, and admin workflows.

## Current pass state

- Admin App now includes a real dropdown option library panel.
- Admin App service-area hydration is guarded by `mergeServiceAreaRows()` so saved settings and bundled county/town fallback data can merge safely.
- Public mobile navigation now uses a compact expandable menu with outside-click and Escape close support.
- Public catalog fallback merging remains important: DB rows override bundled rows, but partial DB imports must not hide unedited gear/consumables.
- Root JS should remain limited to `service-worker.js`; API files belong under `functions/api/`.

## Active source-of-truth direction

- DB-first for editable business data.
- JSON as bundled fallback for public reliability and offline/static testing.
- Admin App for site/app settings and pricing controls.
- Admin Catalog for consumables, gear, Amazon match review, stock, vendors, and future cost history.
- Release checks must continue catching H1, link, catalog fallback, service-area, Amazon-match, and mobile-navigation regressions.

<!-- Build 147 sync 2026-05-16: Admin App mergeServiceAreaRows repair, dropdown option editor, compact mobile navigation, release-check guardrails, root API duplicate cleanup, local SEO/H1 discipline. -->
