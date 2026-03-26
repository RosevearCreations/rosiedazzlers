
> Last synchronized: March 25, 2026. This file was reviewed during the recovery/moderation/docs/schema refresh pass.
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
- stronger provider-backed send history/audit visibility
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
