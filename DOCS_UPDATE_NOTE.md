> Last synchronized: April 11, 2026. Reviewed during the booking layout/date-picker repair, paged 21-day availability, structured service-area/bylaw logic, service-area filtering/reporting, analytics funnel/export expansion, deploy-smoke coverage pass, and docs/schema synchronization pass.

> Last synchronized: April 11, 2026. Reviewed during the live clean-route verification pass, remaining session-first internal-screen cleanup, operational profitability labor-estimate pass, route-collision cleanup, and docs/schema synchronization pass.

> Last synchronized: April 11, 2026. Reviewed during the route-safety hotfix carry-forward, crew-summary workflow pass, admin runtime timeout/text-fallback hardening pass, stress-check cleanup pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the session-first admin recovery/live/progress app-shell pass, recovery audit visibility pass, static stress-check pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the canonical add-on media recovery, crew assignment/senior detailer workflow, responsive app-shell tightening, stability checks, and docs/schema synchronization pass.

> Last synchronized: April 9, 2026. Reviewed during the add-on image restore, assignment identity normalization, month-end checklist, and docs/schema synchronization pass.

> Last synchronized: April 8, 2026. Reviewed during the accounting backend, payable/expense, month-end reporting, and docs/schema synchronization pass.

> Last synchronized: March 29, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

# Docs Update Note

## April 11, 2026 docs update note
This refresh aligns the docs to the booking layout/date-picker repair, paged 21-day booking calendar, structured service-area/bylaw model, admin service-area filtering, analytics funnel/export expansion, and deploy-smoke tooling.


> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.

Last synchronized: March 24, 2026.

This refresh aligned the main docs to the current `dev` branch after a pass focused on:
- recovery template admin UI
- progress/jobsite moderation UI
- protected-page SEO/noindex cleanup
- schema/doc synchronization

Primary docs refreshed together:
- `README.md`
- `PROJECT_BRAIN.md`
- `CURRENT_IMPLEMENTATION_STATE.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `DEVELOPMENT_ROADMAP.md`
- `REPO_GUIDE.md`
- `SANITY_CHECK.md`
- `DATABASE_STRUCTURE_CURRENT.md`
- handoff/next-step docs

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->

## April 9, 2026 docs update note
This refresh aligns the docs with the accounting reporting/remittance pass, the inventory cost-field persistence fix, the stronger export set, and the production-domain sitemap/robots cleanup.


## April 9, 2026 docs update note — second pass
This refresh aligns the docs to the accounting actor-normalization, receivables-aging, profitability, export expansion, and auth/session page-key convergence pass.


## April 9, 2026 docs/schema sync note
This pass refreshed the documentation set again around three concrete build changes: restored custom add-on imagery, stronger staff assignment identity handling, and a DB-backed accounting month-end checklist. `SUPABASE_SCHEMA.sql` and a new migration file were updated to match the checklist table.

## April 10, 2026 docs refresh
This refresh synchronized the repo around four concrete changes: canonical add-on image recovery, crew assignment support, responsive app-shell tightening, and local stability checks. The schema snapshot and migrations now include `booking_staff_assignments`, and the roadmap/gaps/handoff docs all point to crew-aware ops rollout as the next strongest pass.

- 2026-04-11 docs/schema sync: deployment hotfix pass for Pages route collisions and 404 behavior.


Route hotfix sync reviewed on 2026-04-11.

- April 11, 2026: synced docs during the route-safety carry-forward, crew-summary workflow pass, admin runtime error-handling hardening pass, and stress-check cleanup pass.

## 2026-04-11 pass 9 sync
- Booking flow now uses a clearer service-area selector with town-level choices across Oxford and Norfolk communities.
- Booking availability shows open, partial, and unavailable dates in the next 21-day snapshot, and the date picker contrast was tightened for dark mode.
- Year / Make / Model on booking is now typeable with datalist-assisted lookup and validation against the existing vehicle catalog.
- Public analytics was deepened with richer action tracking, viewport/session details, and location/device enrichment stored inside event payloads.
- Route-collision folders and temporary check artifacts were removed again to keep Pages routing stable.
### Pass 9 docs sync
- Markdown files were refreshed for booking UI, service-area precision, analytics deepening, and route-safety cleanup.

## 2026-04-11 pass 11 sync note
- Tightened the booking preferred-date control so it no longer stretches wider than needed and added a visible white picker button.
- Public booking, services, and pricing pages now read the canonical pricing catalog API first and only fall back to bundled JSON if the API is unavailable.
- App Management now includes a pricing catalog editor so package prices, included services, add-ons, service-area rules, and chart links can be maintained from one source of truth.
- No schema shape change landed in this pass; `SUPABASE_SCHEMA.sql` was refreshed to note the pricing-catalog consolidation and booking UI tightening work.
