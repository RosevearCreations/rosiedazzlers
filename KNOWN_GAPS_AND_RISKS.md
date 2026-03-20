# Rosie Dazzlers — Known Gaps and Risks

Use this file as the quick list of the biggest current gaps, architectural risks, and workflow risks on the `dev` branch.

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

### Risk
Gift certificates can be purchased, but booking-time redemption is not yet fully complete.

### Why it matters
This leaves an important customer-facing workflow unfinished.

### Needed
- validate gift code
- fetch remaining value
- apply to booking total
- update remaining balance
- mark fully redeemed when exhausted

---

## 4) Add-on pricing drift risk

### Risk
Add-ons still need one canonical source across frontend and backend.

### Why it matters
Split definitions can cause:
- wrong totals
- confusing UI
- checkout mismatches
- maintenance headaches

### Needed
One canonical add-on/pricing structure used by:
- frontend display
- frontend selection
- backend validation
- checkout/Stripe logic

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
- clean save into `job_media`

---

## 6) Old/new endpoint overlap risk

### Risk
As newer role-aware endpoints grow, some older or duplicate patterns may still remain in the repo.

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

### Why it matters
If it remains too central for too long:
- security design stays muddy
- future auth transition gets harder
- role-aware design benefits are reduced

### Needed
Move the bridge toward:
- transitional compatibility only
- not long-term operational identity

---

## 8) Customer tier confusion risk

### Risk
Customer tiers could be confused with staff permissions if docs/code drift.

### Why it matters
That would blur:
- business segmentation
- security rules
- admin/customer concepts

### Rule
Customer tiers are:
- business labels
- loyalty segmentation
- customer management context

Customer tiers are not:
- permissions
- admin roles
- staff access levels

---

## 9) UI cohesion gap

### Risk
Backend/admin capability has grown faster than the internal UI shell.

### Why it matters
Without a cleaner internal shell:
- staff workflow feels fragmented
- mobile field use is clumsier
- role-aware access is harder to present well
- training/use becomes less intuitive

### Needed
- role-aware internal shell
- better menus/navigation
- more unified detailer/admin experience

---

## 10) Route cleanup still pending

### Risk
Canonical route cleanup for services/pricing still needs to be fully settled.

### Why it matters
While it is no longer the biggest issue, it can still create:
- routing ambiguity
- inconsistent URLs
- long-term content confusion

### Needed
- finalize canonical structure
- remove long-term duplicate route patterns

---

## 11) Documentation drift risk

### Risk
The docs were refreshed together, but future changes could make them drift apart again.

### Why it matters
When high-level docs disagree:
- future sessions get confused
- priorities blur
- repo understanding gets slower

### Needed
Keep these docs aligned when major architecture changes:
- `README.md`
- `PROJECT_BRAIN.md`
- `DEVELOPMENT_ROADMAP.md`
- `REPO_GUIDE.md`
- `SANITY_CHECK.md`
- supporting docs

---

## 12) Main branch mismatch risk

### Risk
`main` may not reflect current active development.

### Why it matters
Looking at the wrong branch can cause:
- wrong architectural assumptions
- stale documentation decisions
- duplicated work
- missed newer backend patterns

### Rule
Use:
- `dev`

as the active source of truth during current development unless explicitly told otherwise.

---

## Highest-priority risk summary

The biggest current risks are:

1. no real staff auth/session yet
2. inconsistent staff identity across workflows
3. unfinished gift redemption
4. split add-on pricing/config
5. incomplete mobile upload flow
6. old/new endpoint overlap

---

## One-line summary

The main Rosie Dazzlers risk is no longer lack of features — it is keeping identity, access, workflow, and architecture consistent while the system transitions from a simple site into a role-aware operations platform.
