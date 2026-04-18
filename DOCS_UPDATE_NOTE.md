> Last synchronized: April 16, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

## April 15, 2026 documentation sync
This refresh aligns the docs with the generated pricing-chart asset pass. `CarPrice2025.PNG` and `CarPriceDetails2025.PNG` are now created from the current bundled pricing catalog, served locally from `/assets/brand`, and supported by a repeatable regeneration script so the legacy chart-image dependency no longer requires hand-editing table screenshots.


# Docs Update Note

## April 14, 2026 documentation sync
This refresh aligns the docs to the App Management checkbox-alignment repair and package-count clarification pass. The pricing control center now explains package families separately from size-priced entries, add-on quote checkboxes keep their working alignment, and the current canonical pricing model still treats oversize and exotic as a shared column unless a later schema pass deliberately splits them.


## April 13, 2026 documentation sync
This pass synchronized the docs around build stability rather than new schema breadth. The repo now contains the missing public social-feed endpoint, the avoidable accounting GL duplicate-key warning was removed, booking remains locked/stable, `_redirects` remains complete, and no new SQL table shape was required.


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

> Pass update 2026-04-12: Re-synced the current uploaded build to the latest safe route structure. Removed duplicate clean-route folders that were reintroducing Cloudflare Pages redirect loops, preserved the newer booking experience already present in `book.html`, refreshed the deployed booking smoke check to recognize the shared `chrome.js` analytics bootstrap, and cleaned the login form autocomplete attributes. Immediate next step after deploy: verify `/`, `/services`, `/pricing`, `/book`, and `/admin` on the active branch before resuming larger feature work.

## April 12, 2026 documentation sync note
- Reflected the booking-stable decision across the docs.
- Marked `_redirects` working/complete in the current route model.
- Updated docs to point future pricing work toward the App Management pricing control center.
- Updated schema notes to show travel-pricing and shared price-control values as part of the canonical pricing catalog JSON.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

## Pass 14 documentation sync note
This pass synchronized code, schema notes, and Markdown around four themes: booking lock/stability, redirect completeness, office finance adjustments with customer document generation, and centralized social-feed management/rendering.

---

## Pass sync — 2026-04-14 (pass 16)

- Booking screen remains locked and stable.
- `_redirects` remains the working route layer and includes the admin-app trailing-slash compatibility line.
- App Management was repaired in this pass: the page now restores its missing helper functions, shows a proper internal menu mount, includes clearer feature descriptions, and exposes document/social defaults without crashing.
- Admin navigation now includes a visible path to App Management from the dashboard, shared admin menu, and return bar.
- No new database table or column changes were introduced in this pass; schema files were refreshed to reflect a no-DDL stability/documentation pass.
- Strongest next steps remain the single-entry pricing/accounting workflow, refund-credit memo document polish, and provider-tested email sending.

> Pass sync April 15, 2026: generated local price-chart PNG assets from the canonical bundled pricing catalog, rewired chart fallbacks to `/assets/brand`, added a regeneration script, and refreshed docs/schema notes for the legacy price-image carry-forward pass.

Update note — 2026-04-16 pass20: Added explicit admin route wrappers for social feed and vehicle catalog endpoints to stop Pages Function import-resolution failures on /api/admin routes. Booking remains stable; no schema DDL change in this pass.

- 2026-04-16 pass 21: synced docs and schema for crew time/payroll, staff availability blocks, payroll runs, accounting-post option, and service-time insights.
- Pass sync 2026-04-16 (pass 21): added crew time/payroll workflow, staff availability blocks, payroll runs + accounting-post option, staff pay/work-cap settings, and service-time insight reporting; booking screen remains stable.

- Pass 22 sync: fixed admin-accounting date/input layout, moved admin-staff to a left-side internal menu layout, normalized admin login redirects to .html, and added clean admin route rewrites for payroll/staff/accounting/app/login.

## April 16, 2026 admin-nav and growth-direction pass

- standardized the top admin navigation so pages that boot through the shared admin shell now overwrite incomplete page-level nav link lists with one consistent internal menu bar plus account/logout controls.
- added new App Management sections for:
  - stronger self-serve quote + booking emphasis
  - scheduled e-gift delivery settings
  - maintenance / membership plan settings
- extended app settings loading so those three new settings keys are part of the shared office configuration pull.
- moved the public direction forward with:
  - stronger quote-first CTA messaging on the home and pricing pages
  - richer gift checkout inputs for recipient name and preferred send date
  - gift checkout metadata capture for recipient name, preferred send date, and gift message
- no schema DDL change was required for this pass; this was a workflow/settings/UI pass.

Pass sync: April 16, 2026 — top admin navigation standardized, app-management growth settings added, booking-led self-serve direction restored, and gift checkout now collects recipient name plus preferred send date.

---

## Pass 24 Sync — 2026-04-17

This pass focused on three areas:
- normalized the shared top admin navigation and repaired the off-pattern `admin-assign` header so the top menu matches the other admin screens more closely
- shifted the public self-serve direction back to a booking-led planner on the pricing page by embedding the live booking experience so customers keep the exact service-area restrictions, 21-day availability windows, slot logic, and booking aesthetics instead of using a separate quote-builder path
- continued the scheduled e-gift direction by exposing public growth settings, improving the gift message/send-date experience, and adding live recipient/delivery preview boxes on the gifts page

Schema impact for this pass: no new tables or columns. Existing `app_management_settings` is reused for public quote, e-gift, and membership display settings.

Pass sync: April 17, 2026 — pricing now restores the booking page as the first self-serve step by embedding the live booking planner on /pricing so service-area restrictions, 21-day availability windows, add-on logic, and booking aesthetics stay in one source of truth.
