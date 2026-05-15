# Known Gaps and Risks — Build 141

**Updated:** 2026-05-14

## Active gaps after Build 141

1. **Water rules are JSON-first, not fully DB-first yet.** `/data/service_area_rules.json` is now the shared fallback source, but a Supabase table/admin endpoint should become canonical.
2. **Water restrictions can change.** Staff should verify official county pages before dispatch, especially in dry weather or active conservation periods.
3. **Typed service areas still need confirmation.** The booking flow now accepts typed towns, but unknown towns should be confirmed by county before final scheduling.
4. **Town landing-page coverage is not complete.** Major targets exist, but smaller Norfolk/Oxford communities still need dedicated SEO pages or grouped area pages.
5. **Option libraries are still partly JSON/app-setting based.** The full editor for towns, categories, colours, vendors, and tiers should be finished.
6. **Media library still needs a complete DB-backed editor.** R2 images, alt text, crop notes, page usage, and first-image scoring need one canonical admin workflow.
7. **Reviews are still sample/fallback proof until a real review API or approval workflow is connected.**
8. **Accounting remains operational bookkeeping support, not finished filing software.** Reconciliation, remittance review, lock/reopen, and export packaging still need completion.
9. **Search ranking is not guaranteed.** Keep improving relevance, distance/prominence signals, local proof, page speed, and Google Business Profile consistency.
10. **Schema migrations should be applied deliberately in dev before production.** Runtime fallbacks remain important until all DB changes are verified.

## Build 141 risk reduced

- Booking no longer depends only on a small fixed select list of service areas.
- County fallback rules reduce the chance of missing water-use reminders for a town not yet entered.
- Admin App now exposes service-area by-law/water-rule text boxes instead of hiding those values inside JSON.
- The expanded local area data supports future local SEO pages and dispatch rules.

<!-- Build 141 sync 2026-05-14: reviewed during Norfolk/Oxford service-area, water-rule fallback, typeable booking location, local SEO, and docs/schema pass. -->


## Build 141 cleanup note

Root-level duplicate API JavaScript files were removed again; valid API handlers remain under `functions/api/` and `functions/api/admin/`, while `service-worker.js` remains at the public root.
