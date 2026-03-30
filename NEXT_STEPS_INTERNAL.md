> Last synchronized: March 29, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.
> Last synchronized: March 30, 2026. Reviewed during the guest-booking auth-noise cleanup, session-first endpoint tightening, private-page noindex pass, and docs/schema synchronization pass.

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

## March 30, 2026 gap-reduction pass
- Removed more legacy admin-fallback allowances from active blocks/live/jobsite/media/progress moderation paths so signed-in staff session access remains the preferred internal route.
- Book page now checks customer auth before requesting the client dashboard, reducing guest-session 401 noise during normal booking loads.
- Continued private-route SEO hardening by adding missing `noindex,nofollow` coverage to more internal/account completion pages while keeping exposed public pages on the one-H1 rule.
- Docs and schema snapshot were re-synchronized to this build after the latest endpoint and page cleanup pass.

