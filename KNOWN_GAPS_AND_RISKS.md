> Last synchronized: April 10, 2026. Reviewed during the session-first admin recovery/live/progress app-shell pass, recovery audit visibility pass, static stress-check pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the canonical add-on media recovery, crew assignment/senior detailer workflow, responsive app-shell tightening, stability checks, and docs/schema synchronization pass.

> Last synchronized: April 9, 2026. Reviewed during the add-on image restore, assignment identity normalization, month-end checklist, and docs/schema synchronization pass.

> Last synchronized: April 8, 2026. Reviewed during the accounting backend, payable/expense, month-end reporting, and docs/schema synchronization pass.

> Last synchronized: March 29, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

> Last synchronized: March 28, 2026. Reviewed during the pricing chart zoom/modal, manufacturer callout, local SEO metadata, and current-build synchronization pass.



> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.
# Rosie Dazzlers — Known Gaps and Risks

Use this file as the quick current list of the biggest gaps, architectural risks, and workflow risks on the `dev` branch.

---

## 1) Auth gap
### Risk
The backend is moving toward role-aware access, but real staff login/session is still not finished.

### Why it matters
Without real staff auth/session:
- field workflow remains awkward
- identity can be less reliable
- bridge access patterns may persist too long
- role-aware UI cannot fully mature

### Current bridge
- recovery/live/progress screens now prefer the signed-in session and only keep the legacy password as optional fallback in the UI
- `ADMIN_PASSWORD` still exists as a compatibility fallback
- newer catalog/recovery/progress/upload flows now accept the signed-in staff session first

### Needed
- real staff login
- session-aware admin/detailer pages
- backend trust in resolved current actor

---

## 2) Staff identity consistency gap
### Risk
Some flows are moving toward true staff identity, but full consistency across all jobsite actions is still important.

### Why it matters
If some records are tied to real `staff_user_id` and others are tied mostly to names:
- audit trails get weaker
- overrides become fuzzier
- reporting becomes messier
- cleanup later becomes harder

### Needed
Consistent staff identity across:
- intake
- progress
- time
- media
- signoff
- assignment

---

## 3) Gift redemption gap
### Current state
Booking checkout now validates gift codes, applies remaining balance to totals, reduces the deposit due immediately, and can auto-confirm a booking when the gift fully covers the deposit. Stripe and PayPal completion paths exist.

### Remaining edge cases
- broader UI messaging in customer account screens
- optional customer gift balance checker/history outside checkout
- final reconciliation review for uncommon payment edge cases

---

## 4) Add-on pricing drift risk
### Current state
The platform direction is now to read package and add-on pricing from `app_management_settings.pricing_catalog`, with `data/rosie_services_pricing_and_packages.json` kept as the bundled fallback.

### Remaining edge cases
- some code paths still need final convergence
- admin/report references may still assume legacy labels
- automated comparison tests are still missing

---

## 5) Upload workflow gap
### Risk
Media records and flows exist, but direct mobile upload is still not complete.

### Why it matters
Without a strong upload path:
- field use stays clumsy
- before/after photo workflow is weaker
- customer progress updates are less practical
- operators may rely on manual URL-style workarounds

### Needed
- production hardening for the new signed upload flow
- clear bucket/public-vs-private strategy for customer-visible media
- broader reuse of the upload pattern across remaining field screens

---

## 6) Old/new endpoint overlap risk
### Risk
As newer role-aware endpoints grow, some older or duplicate patterns still remain.

### Why it matters
This creates:
- confusion about which endpoint is canonical
- higher maintenance burden
- more room for drift
- inconsistent access behavior

### Needed
- identify legacy/duplicate endpoints
- keep newer role-aware versions as the preferred direction
- retire obsolete paths once replacements are stable

---

## 7) Shared-password bridge risk
### Risk
The shared admin password bridge is still part of the system.

### Needed
Move the bridge toward transitional compatibility only, not long-term operational identity.

---

## 8) Customer tier confusion risk
### Rule
Customer tiers are business/loyalty labels, not permissions or staff roles.

---

## 9) UI cohesion gap
### Risk
Backend/admin capability has grown faster than the internal UI shell.

### Needed
- cleaner role-aware internal shell
- better menus/navigation
- stronger field/mobile usability

---

## 10) Route cleanup still pending
### Risk
Canonical route cleanup for services/pricing still needs to be fully settled.

---

## 11) Documentation drift risk
### Risk
The docs were refreshed together again, but future changes could make them drift apart.

### Rule
When major architecture changes happen, keep these in sync:
- `README.md`
- `PROJECT_BRAIN.md`
- `CURRENT_IMPLEMENTATION_STATE.md`
- `DEVELOPMENT_ROADMAP.md`
- `REPO_GUIDE.md`
- `SANITY_CHECK.md`
- schema docs

---

## 12) Main branch mismatch risk
### Rule
Use `dev` as the active source of truth unless explicitly told otherwise.

---

## 13) Recovery operations risk
### Current state
Recovery templates, rules persistence, provider preview/testing, and admin UI now exist.

### Remaining edge cases
- stronger provider-backed send history/audit visibility is partly mitigated because recent recovery audit rows are now visible from the recovery screen
- deeper production dispatch handling
- optional resend/manual escalation tools

---

## 14) Moderation workflow risk
### Current state
Storage/endpoints for comment, annotation, update, and media moderation exist, and jobsite/progress admin screens now expose moderation controls.

### Remaining edge cases
- richer escalation workflow
- filter views by hidden/removed/internal state
- clearer actor/session attribution after real auth is completed

---

## 15) Inventory purchasing workflow risk
### Current state
Public DB inventory, ratings, low-stock alerts, and reorder request foundations are in place.

### Remaining edge cases
- reminder lifecycle
- purchase-order receive/close workflow
- optional provider notifications for reorder reminders

---

## Highest-priority summary

Partially mitigated in this pass:
- older recovery/live/progress screens are less dependent on the shared-password bridge
- internal shell cohesion is stronger on tablet/laptop/mobile because these screens now use the shared app shell and shared internal menu
- recovery audit visibility is better for office-side review

The biggest current risks are:
1. no real staff auth/session yet
2. inconsistent staff identity across workflows
3. unfinished gift redemption polish
4. incomplete pricing/add-on convergence
5. incomplete mobile upload flow
6. endpoint overlap during transition

## One-line summary
The main Rosie Dazzlers risk is no longer lack of features — it is keeping identity, access, moderation, pricing, recovery, inventory, and documentation consistent while the system transitions into a role-aware operations platform.

## March 25, 2026 update
Partially mitigated in the newest pass:
- public login/account widget now exists in shared site chrome
- customer reset + verification flows now exist
- public analytics tracking now captures page views, heartbeats, and cart signals

Still remaining at the top:
- real staff auth/session completion
- full pricing/add-on convergence in every path
- broader gift redemption/account messaging polish
- direct mobile upload flow completion
- fuller reorder receive/close/reminder lifecycle
- route-by-route SEO cleanup beyond the pages touched so far


## March 25, 2026 late-pass update

Mitigations advanced in this pass:
- public login now accepts both client and staff credentials through UI fallback to staff auth
- public account widget now recognizes signed-in staff on public pages and links them back to Admin
- main admin dashboard now restores signed-in identity display and adds live analytics summary cards
- admin analytics now includes daily traffic, checkout-state mix, live online sessions, and faster refresh controls

Still important:
- real staff auth/session is improved in UI routing, but full staff-only internal shell consistency is still a live project risk
- gift redemption/account messaging and upload flow remain unfinished
- canonical pricing still needs final convergence across every remaining report and edge path
- reorder workflow still needs receive/close/reminder completion
- public SEO cleanup still needs a broader route-by-route pass


## March 25, 2026 update
Partially mitigated in the newest pass:
- pricing now has a DB-backed canonical setting source with bundled JSON fallback
- admin upload now has a signed-upload flow and session-aware mobile UI
- purchase-order lifecycle now includes ordered / received / cancelled state changes in admin
- several internal endpoints now trust the signed-in staff session before the legacy bridge

## March 25, 2026 update
- Real staff auth/session is further improved on progress enable/moderation flows, but some legacy admin screens still expose fallback password fields in the UI.
- Vehicle data duplication risk is reduced by moving year/make/model selection toward a shared live catalog path plus DB cache instead of free-typed fields alone.
- Pricing/gift polish and reorder lifecycle still remain live risks outside this pass.
- Public SEO cleanup continues; protected screens remain non-indexed and exposed pages should keep a single H1.


## 2026-03-26 risk refresh
- Legacy admin password fallback is now intentionally gated behind ALLOW_LEGACY_ADMIN_FALLBACK=true. Leave it unset in normal operation.
- Catalog inventory is closer to a single source of truth, but older JSON fallback content still exists on some public pages and should continue to be reduced over time.
- Vehicle size/category data is now captured in both booking and customer garage flows, but reporting screens should be checked for any remaining old field assumptions.


## March 26, 2026 inventory/review/layout pass
- Added DB-backed inventory movement logging for adjustments, receive events, and detail-product usage.
- Added after-detail checklist persistence for keys/water/power/debrief and suggested next-service cadence.
- Extended customer garage vehicles with next-cleaning due date, interval days, and auto-schedule preference.
- Added in-app customer review capture plus a Google review handoff link.
- Hardened Gear/Consumables search inputs against browser email autofill and expanded sorting/filter controls.
- Updated logo references to use brand/untitled.png.
- Continue removing legacy admin-password fallback and continue route-by-route SEO cleanup with one H1 per exposed page.


## March 26, 2026 search/inventory/admin UX refresh
- Search autofill/browser-credential interference on public catalog pages is being actively hardened because it hurts UX and can suppress product discovery.
- Inventory movement history and per-booking product usage now have stronger UI coverage, but the workflow still needs final polish across the full admin/detailer shell.
- Public catalog content is closer to DB-first inventory, but JSON fallback still exists and should continue to be reduced over time.
- Local SEO work is improving, especially for Norfolk County and Oxford County targeting, but route-by-route metadata and structured-data coverage should continue.

## March 26, 2026 booking/catalog/local SEO pass
- Search-box autofill/credential interference on Gear and Consumables was hardened again because it directly hurts product discovery and user trust.
- Booking add-on image drift risk was reduced by moving add-on image URLs into the canonical pricing/add-on JSON.
- Inventory workflow risk is reduced further because low-stock and reorder candidate visibility is now clearer in Admin Catalog, but reminder lifecycle and vendor notification polish still remain.


## March 26, 2026 customer-flow and advanced inventory pass
- fixed booking add-on image sizing so package assets no longer blow out the add-ons grid.
- continued customer journey coverage by surfacing account/feed/signoff entry points more clearly and exposing checklist + products-used data on customer-facing progress/completion pages.
- extended inventory admin for purchase date and estimated jobs-per-unit so the team can track longevity of bulk supplies and hardware.
- continued DB-first inventory direction while keeping one-H1 public pages and local SEO focus on Oxford County and Norfolk County.


## March 27, 2026 workflow/customer-journey refresh
- Customer journey risk is reduced because booking now follows a clearer visible step sequence instead of one long undifferentiated page.
- Add-on media drift risk is reduced because the missing add-on cards now use packaged local assets.
- Detailer workflow risk is reduced because assigned staff now have a dedicated job screen for accept/decline and live workflow-state transitions.
- Staff/session risk still remains until the final legacy bridge is removed from every remaining older admin screen.

## March 27, 2026 mobile wizard / account-widget refresh
- Mobile UX risk is reduced because booking no longer relies on one long page and no longer jumps the user back to the very top between steps.
- Public account-entry risk is reduced because the shared site chrome now exposes login/create-account for guests and garage/admin shortcuts for signed-in users.
- Customer/privacy risk is reduced because public progress now suppresses internal-only updates, keeping admin/detailer private notes off the customer-facing feed.
- Still remaining: full notification delivery wiring, final legacy fallback removal, broader DB-first content replacement, and full inventory lifecycle polish.


## March 27, 2026 wizard + communication update
- mitigated: booking wizard top panel is no longer sticky over the working step content on phones or desktop.
- moved forward: customer-to-team live messaging now has a public progress-page message path, while signed-in detailers can post either customer-visible updates or internal-only notes.
- moved forward: booking step navigation now scrolls to the active step instead of snapping the user back to the wizard header.
- move up next: finish notification delivery for comment/update events and keep removing the last legacy fallback screens.


## 2026-03-28 late pass status
- Deploy blocker from `requireStaffSessionOrThrow` import mismatch: repaired.
- Pricing/services missing image path regressions: repaired for the size chart and key add-on assets.
- Admin page loading overlays persisting after data load: mitigated in shared AdminShell and shared CSS.
- UI contrast regression on dark buttons: repaired in shared CSS.

## 2026-03-28 contrast, image-fit, and slot-readability pass
- Catalog image cards now fit within their frames more cleanly instead of appearing over-zoomed.
- Booking slot buttons and related dark-surface controls now force light readable text.
- Shared dark-button contrast was tightened again to avoid black-on-dark regressions.
- This pass improves UI readability and cohesion, but does not honestly eliminate every remaining structural gap; auth/session completion, pricing convergence, upload hardening, and final endpoint cleanup still remain active work.

## March 29, 2026 auth / identity / endpoint pass
- real staff-session coverage was extended into booking management, block listing, job time entry/list/summary, jobsite intake get/save, progress media posting, and staff list/save endpoints so these flows no longer rely only on the shared admin password bridge.
- actor attribution improved in time, intake, media, booking-status, and assignment paths by preferring the resolved signed-in staff actor for created_by, detailer_name, and booking-event logging.
- older password-gated endpoint overlap is reduced, but not fully gone yet; remaining legacy-only endpoints still need conversion or retirement.
- admin Bookings, Blocks, and Staff pages now prefer the signed-in staff session in the UI, with optional legacy fallback retained only as a temporary bridge where needed.
- no new tables were required in this pass; this was an auth/session, UI cohesion, and endpoint-cleanup pass rather than a schema-expansion pass.


## March 29, 2026 gift / upload / endpoint pass
- moved more admin endpoints off direct shared-password checks and onto session-aware `requireStaffAccess`, including customer-profile tooling, booking customer linking, and unblock date/slot actions.
- improved customer gift/account polish by adding dashboard gift summary totals and a signed-in gift balance checker on My Account.
- hardened the signed upload endpoint with media-type and file-size validation plus customer-visible/public-url handling guidance.
- continued DB-first cleanup and doc/schema synchronization for the current dev build.


## March 29, 2026 promo / blocks / purchase reminder pass
- promo list/create/disable and block date/slot actions now prefer signed-in staff session access through the shared role-aware auth helper instead of direct shared-password checks.
- booking_update and assign now log actor-attributed booking events while using the resolved current staff actor.
- purchase-order reminder lifecycle moved forward with reminder logging fields, a reminder action endpoint, and overdue reminder reporting in the purchase-order list endpoint.
- this reduced more of the old/new endpoint overlap and shared-password bridge risk, but did not fully eliminate every remaining legacy-only admin path yet.


## April 7, 2026 membership / mobile / deploy hardening pass
- Standardized the four missing Services add-on images onto local bundled asset paths and added real PNG copies so the service cards stop depending on fragile external image URLs.
- Added route-safe admin folder entry points and stronger Pages Functions helper shims so Cloudflare deploys are less sensitive to mixed helper import paths.
- Moved customer segmentation toward a scalable membership model by seeding Bronze, Silver, and Gold tiers and making new customer creation default to Bronze instead of a legacy placeholder tier.
- Continued mobile-fit and CSS hardening by tightening service-card/select sizing, overlap handling, and installable-app support through a shared install prompt + service worker path.


## April 8, 2026 admin route stabilization pass
- Repaired the current build by standardizing active admin navigation back to direct `.html` routes instead of mixed pretty-route/admin-folder assumptions.
- Restored the shared admin shell from the richer canonical copy so pages that call `window.AdminShell.boot(...)` load again.
- Kept compatibility folder `index.html` files for `/admin/`, `/admin-catalog/`, `/admin-accounting/`, `/services/`, and `/pricing/` while leaving direct `.html` links as the stable path for this build.


## April 8, 2026 accounting settlement / tax / export pass
- Accounting backend risk is reduced because payable settlement, tax-payable reporting, owner draw/equity reporting, general-ledger CSV export, and first-pass inventory-to-COGS posting are now in place.
- Remaining accounting gaps are now less about basic capability and more about polish/completeness: payable settlement history UX, tax remittance posting workflow, balance-sheet and cash-flow style reporting, and making sure stocked items consistently carry cost data for COGS posting.

## April 8, 2026 accounting access and admin workflow pass
- Accounting access is now surfaced directly in the Admin dashboard, shared admin menu, and shared return toolbar so office-side accounting work is no longer hidden behind direct URL knowledge alone.
- This pass moves the roadmap and known gaps forward again by improving internal shell cohesion and operational discoverability without changing the underlying accounting schema.
- Suggested next mobile/operations features: quick expense entry from phone with receipt photo attachment, vendor quick-add during payable entry, and a month-end checklist panel for settlement, remittance, and report export.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


## April 9, 2026 accounting screen syntax fix
- Fixed a JavaScript syntax error in `admin-accounting.html` that prevented the Accounting screen from booting past the “Loading Accounting Records” state.
- Continued docs/schema synchronization for the current build.

## April 9, 2026 accounting reporting / remittance / cost coverage pass
- Accounting risk is reduced again because office-side staff can now work from one page for remittance posting, payable settlement review, monthly statement viewing, and CSV export without relying on scattered endpoints.
- Inventory cost-completeness risk is reduced because the admin inventory form now saves the fields needed to close missing-cost gaps; however, existing uncosted rows still need manual cleanup.
- Remaining accounting risk is now concentrated in reconciliation quality rather than raw feature absence: A/R polish, overhead allocation accuracy, retained earnings confidence over time, and session/actor consistency on every internal route.
- SEO/local-search risk improved slightly with production sitemap and robots cleanup, but ranking still depends heavily on Business Profile completeness, reviews, and ongoing location-page/service-content quality.


## April 9, 2026 pass note
- Reduced one auth/session gap by fixing page-key drift between the frontend shell/menu and protected internal routes.
- Reduced one accounting gap by adding receivables-aging visibility and CSV export for office follow-up work.
- Reduced one profitability gap by adding an estimated booking-profitability surface that allocates overhead across selected-month revenue.
- Remaining risk: this profitability view is still operational/estimated, not full accountant-grade job costing, because labor burden, full overhead allocation rules, and every inventory/direct-cost path are not yet complete.


## April 9, 2026 add-on image / assignment / checklist update
Partially mitigated again in this pass:
- add-on imagery drift risk was reduced by restoring the custom service cards to the Rosie packages R2 path first, while keeping bundled local fallbacks in place
- assignment identity drift was reduced by preferring real assignable staff records in the booking/admin assignment screens
- month-end operational follow-through is improved because Accounting now has a persistent month-end checklist instead of relying only on memory or exported CSV files
- progress media now records `staff_user_id`, reducing one more actor-attribution gap

Still important:
- several older compatibility screens still expose visible manual/password fallback patterns and need the same session-first cleanup
- assignment normalization still needs to reach every remaining legacy workflow and report path
- local search still depends on ongoing Business Profile completeness, reviews, and locally relevant service content in addition to clean technical SEO foundations

## April 10, 2026 update
### Mitigations advanced
- Add-on image drift risk is reduced because the bundled pricing/add-on JSON now carries primary/fallback image fields for every add-on instead of relying on separate page-only maps.
- Single-detailer scheduling risk is reduced because the repo now supports `booking_staff_assignments` and a lead / crew assignment model.
- Work-scope identity is slightly safer because crew members can now pass booking-scope checks, not just the lead detailer stored on the booking row.

### New/remaining edge cases
- Some older internal list/report pages still summarize only the lead assignment even though crew access now exists underneath.
- The new crew table must be deployed before multi-detailer assignment is fully live; until then the lead assignment still saves, but crew persistence gracefully falls back.
- End-to-end runtime validation is still needed against the live Pages/Supabase environment after the new migration.
