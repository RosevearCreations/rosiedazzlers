> Last synchronized: April 12, 2026. Reviewed during the booking-lock, redirects-complete, pricing-control-center, accounting-pricing-window, canonical-pricing-helper resync, and docs/schema synchronization pass.

> Last synchronized: April 12, 2026. Reviewed during the canonical pricing-catalog completion pass, booking/service-area contract repair, clean-route collision removal, static stress-check verification, and docs/schema synchronization pass.

> Last synchronized: April 11, 2026. Reviewed during the booking layout/date-picker repair, paged 21-day availability, structured service-area/bylaw logic, service-area filtering/reporting, analytics funnel/export expansion, deploy-smoke coverage pass, and docs/schema synchronization pass.

> Last synchronized: April 11, 2026. Reviewed during the live clean-route verification pass, remaining session-first internal-screen cleanup, operational profitability labor-estimate pass, route-collision cleanup, and docs/schema synchronization pass.

> Last synchronized: April 11, 2026. Reviewed during the route-safety hotfix carry-forward, crew-summary workflow pass, admin runtime timeout/text-fallback hardening pass, stress-check cleanup pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the session-first admin recovery/live/progress app-shell pass, recovery audit visibility pass, static stress-check pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the canonical add-on media recovery, crew assignment/senior detailer workflow, responsive app-shell tightening, stability checks, and docs/schema synchronization pass.

> Last synchronized: April 9, 2026. Reviewed during the add-on image restore, assignment identity normalization, month-end checklist, and docs/schema synchronization pass.

> Last synchronized: April 8, 2026. Reviewed during the accounting backend, payable/expense, month-end reporting, and docs/schema synchronization pass.

> Last synchronized: March 29, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

# Rosie Dazzlers — Documentation Index

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.

Use this file as the quick map to the main Markdown documents for the `dev` branch.
Last synchronized: March 24, 2026.

## Read first
- `README.md` — project overview and current direction
- `PROJECT_BRAIN.md` — mental model
- `CURRENT_IMPLEMENTATION_STATE.md` — what changed recently
- `KNOWN_GAPS_AND_RISKS.md` — current risks and remaining gaps
- `DEVELOPMENT_ROADMAP.md` — next implementation order
- `REPO_GUIDE.md` — repo structure and path map
- `SUPABASE_SCHEMA.sql` + `DATABASE_STRUCTURE_CURRENT.md` — schema truth

## Workflow docs
- `HANDOFF_NEXT_CHAT.md` — quick continuation note for a new chat
- `NEXT_STEPS_INTERNAL.md` — short operational next-move list
- `SANITY_CHECK.md` — high-level project health snapshot
- `BRANCH_WORKFLOW_NOTE.md` — `dev` branch rule reminder

## Important rule
When architecture changes, refresh the docs above together so the handoff stays reliable.

### March 25, 2026 pass note
This doc was refreshed during the vehicle catalog, progress-session, layout, and public catalog filter pass. The repo now includes NHTSA-backed vehicle make/model endpoints, a DB cache table for vehicle catalog rows, progress moderation/enable session upgrades, and public search/filter cleanup on Gear and Consumables.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->

## April 9, 2026 focus refresh
- The most current pass centers on Admin Accounting, inventory cost completeness, export expansion, and local-search housekeeping.


## April 9, 2026 focus refresh — second pass
- The most current pass centers on auth/session convergence for protected internal routes plus receivables-aging and profitability reporting in Accounting.


Route hotfix sync reviewed on 2026-04-11.

## 2026-04-11 pass 9 sync
- Booking flow now uses a clearer service-area selector with town-level choices across Oxford and Norfolk communities.
- Booking availability shows open, partial, and unavailable dates in the next 21-day snapshot, and the date picker contrast was tightened for dark mode.
- Year / Make / Model on booking is now typeable with datalist-assisted lookup and validation against the existing vehicle catalog.
- Public analytics was deepened with richer action tracking, viewport/session details, and location/device enrichment stored inside event payloads.
- Route-collision folders and temporary check artifacts were removed again to keep Pages routing stable.

## 2026-04-11 pass 11 sync note
- Tightened the booking preferred-date control so it no longer stretches wider than needed and added a visible white picker button.
- Public booking, services, and pricing pages now read the canonical pricing catalog API first and only fall back to bundled JSON if the API is unavailable.
- App Management now includes a pricing catalog editor so package prices, included services, add-ons, service-area rules, and chart links can be maintained from one source of truth.
- No schema shape change landed in this pass; `SUPABASE_SCHEMA.sql` was refreshed to note the pricing-catalog consolidation and booking UI tightening work.

> Pass update 2026-04-12: Re-synced the current uploaded build to the latest safe route structure. Removed duplicate clean-route folders that were reintroducing Cloudflare Pages redirect loops, preserved the newer booking experience already present in `book.html`, refreshed the deployed booking smoke check to recognize the shared `chrome.js` analytics bootstrap, and cleaned the login form autocomplete attributes. Immediate next step after deploy: verify `/`, `/services`, `/pricing`, `/book`, and `/admin` on the active branch before resuming larger feature work.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.
