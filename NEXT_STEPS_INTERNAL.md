> Last synchronized: April 10, 2026. Reviewed during the session-first admin recovery/live/progress app-shell pass, recovery audit visibility pass, static stress-check pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the canonical add-on media recovery, crew assignment/senior detailer workflow, responsive app-shell tightening, stability checks, and docs/schema synchronization pass.

> Last synchronized: April 9, 2026. Reviewed during the add-on image restore, assignment identity normalization, month-end checklist, and docs/schema synchronization pass.

> Last synchronized: April 8, 2026. Reviewed during the accounting backend, payable/expense, month-end reporting, and docs/schema synchronization pass.

> Last synchronized: March 29, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.
# Next Steps Internal

## Highest-value next build targets
1. **Staff auth/session**
   - finish real staff login/session
   - reduce reliance on shared password bridge
   - make actor resolution the trusted backend source

2. **Identity consistency**
   - unify actor linkage across intake, progress, media, time, signoff, and assignment

3. **Pricing/gift cleanup**
   - finish pricing/add-on convergence on pricing JSON
   - improve gift messaging in customer-facing screens
   - review rare reconciliation edges

4. **Upload / field UX**
   - extend the new signed-upload/session-aware pattern to other field screens
   - harden storage/public/private media strategy
   - improve mobile field workflow around media and progress

5. **Inventory / purchasing**
   - reminders
   - order receive/close states
   - optional notification-backed reorder nudges

6. **Recovery operations**
   - stronger provider dispatch history
   - manual resend/escalation options
   - richer rule validation and testing traces

7. **SEO + security on every pass**
   - continue page-by-page title/H1/meta review
   - keep admin/token/protected pages noindex
   - keep error handling and access controls moving forward each pass

## Newly moved forward
- site-wide public account widget
- client password reset + email verification token flow
- public analytics tracking and live-session visibility foundation

## Move up next
1. complete real staff auth/session across internal screens
2. finish canonical pricing/add-on convergence across every path
3. polish gift messaging across checkout and customer account surfaces
4. finish direct mobile upload flow
5. deepen reorder lifecycle from request to ordered/received/reminded
6. continue page-by-page SEO audit and structured-data cleanup



## March 25, 2026 moved forward
- DB-backed canonical pricing setting added for checkout
- session-aware signed mobile upload page added
- purchase-order lifecycle status actions added in admin catalog


### March 25, 2026 pass note
This doc was refreshed during the vehicle catalog, progress-session, layout, and public catalog filter pass. The repo now includes NHTSA-backed vehicle make/model endpoints, a DB cache table for vehicle catalog rows, progress moderation/enable session upgrades, and public search/filter cleanup on Gear and Consumables.


## April 7, 2026 membership / mobile / deploy hardening pass
- Standardized the four missing Services add-on images onto local bundled asset paths and added real PNG copies so the service cards stop depending on fragile external image URLs.
- Added route-safe admin folder entry points and stronger Pages Functions helper shims so Cloudflare deploys are less sensitive to mixed helper import paths.
- Moved customer segmentation toward a scalable membership model by seeding Bronze, Silver, and Gold tiers and making new customer creation default to Bronze instead of a legacy placeholder tier.
- Continued mobile-fit and CSS hardening by tightening service-card/select sizing, overlap handling, and installable-app support through a shared install prompt + service worker path.


## April 8, 2026 admin route stabilization pass
- Repaired the current build by standardizing active admin navigation back to direct `.html` routes instead of mixed pretty-route/admin-folder assumptions.
- Restored the shared admin shell from the richer canonical copy so pages that call `window.AdminShell.boot(...)` load again.
- Kept compatibility folder `index.html` files for `/admin/`, `/admin-catalog/`, `/admin-accounting/`, `/services/`, and `/pricing/` while leaving direct `.html` links as the stable path for this build.

## April 8, 2026 accounting access and admin workflow pass
- Accounting access is now surfaced directly in the Admin dashboard, shared admin menu, and shared return toolbar so office-side accounting work is no longer hidden behind direct URL knowledge alone.
- This pass moves the roadmap and known gaps forward again by improving internal shell cohesion and operational discoverability without changing the underlying accounting schema.
- Suggested next mobile/operations features: quick expense entry from phone with receipt photo attachment, vendor quick-add during payable entry, and a month-end checklist panel for settlement, remittance, and report export.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->

## April 9, 2026 next practical targets after this pass
1. **Auth/session convergence**
   - remove remaining route-by-route drift in actor/session behavior
   - make all internal screens resolve staff identity the same way
2. **Accounting polish**
   - add A/R-oriented customer statement views and better month-end checklist UX
   - improve reconciliation confidence for remittance, owner equity, and retained earnings review
3. **Inventory costing**
   - finish backfilling missing `cost_cents` on active stocked items
   - add optional mobile quick-edit for vendor + cost during receiving/reorder work
4. **Operations UX**
   - quick expense entry from phone with receipt photo attachment
   - vendor quick-add during payable entry
   - stronger export presets for accountant handoff and month-end archive


## Push next
- complete actor-id normalization on remaining progress/jobsite/annotation/signoff/time-entry tables and endpoints
- test admin vs detailer route gating live against deployed Pages/Supabase
- tighten profitability inputs with labor burden and fuller overhead allocation rules


## Newly moved up after the April 9, 2026 add-on / checklist / assignment pass
- remove more visible legacy password prompts from the remaining internal compatibility screens now that session-first handling is deeper
- extend resolved staff-user-id assignment into every remaining live/jobsite/progress route and export that still leans on names
- add vendor quick-add during payable entry
- add receipt-photo attachment for quick phone expense entry
- expand month-end checklist from one saved note into guided task links / export shortcuts / reconciliation reminders

## April 10, 2026 moved forward
- every add-on card now has a canonical primary/fallback image path again
- multi-detailer booking assignment now exists with one lead / senior-on-job plus supporting crew
- detailer job visibility now respects crew membership instead of only the single lead stored on the booking record
- assignment UI was tightened for more app-like tablet/phone use

## Move up next after this pass
1. extend crew-aware summaries into admin live/jobsite/progress/time/media list screens
2. keep converting remaining internal pages to the shared auth/session shell and reduce lingering bridge-only behavior
3. finish deeper A/R, reconciliation, and profitability polish
4. run live end-to-end verification against deployed Pages + Supabase after the new SQL migration
5. continue route-by-route local SEO cleanup, title clarity, and content relevance work

- 2026-04-11 hotfix first: verify deployed clean routes after removing duplicate static outputs, then continue the session-first migration work.


Route hotfix sync reviewed on 2026-04-11.
