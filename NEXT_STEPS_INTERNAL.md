> Last synchronized: March 29, 2026. Reviewed during the session-only admin cleanup, private-page noindex pass, and docs/schema refresh.

> Last synchronized: March 29, 2026. Reviewed during the known-gaps reduction, session-first admin-screen cleanup, and docs/schema synchronization pass.

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

## Newly moved forward in the known-gaps reduction pass
- Admin Promos, Admin Assign, and Admin Recovery now follow session-first browser behavior.
- `progress_post` and `observation_annotation_post` no longer allow the legacy fallback bridge.
- Public H1 compliance was rechecked across exposed pages.

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

## March 29, 2026 follow-up after session-only cleanup
- test signed-in staff flows on Live, Jobsite, Progress, Recovery, customer management, and booking management without any fallback password supplied
- remove or soften any remaining bridge-era UI copy that still implies password-first admin access
- continue upload reuse across field-facing flows so staff can attach media without manual URL workarounds
- continue gift/account history polish and notification fan-out wiring

