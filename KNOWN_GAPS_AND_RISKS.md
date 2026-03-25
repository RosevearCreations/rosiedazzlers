
> Last synchronized: March 24, 2026. This file was reviewed during the recovery/moderation/docs/schema refresh pass.
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
- `ADMIN_PASSWORD`
- transitional staff identity resolution

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
The platform direction is to read package and add-on pricing from `data/rosie_services_pricing_and_packages.json`.

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
- signed upload URL flow or direct storage integration
- mobile-friendly upload UX
- clean save into job/progress media tables

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

## March 24, 2026 update
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

