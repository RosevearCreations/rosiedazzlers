> Last synchronized: April 12, 2026. Reviewed during the canonical pricing-catalog completion pass, booking/service-area contract repair, clean-route collision removal, static stress-check verification, and docs/schema synchronization pass.

> Last synchronized: April 11, 2026. Reviewed during the booking layout/date-picker repair, paged 21-day availability, structured service-area/bylaw logic, service-area filtering/reporting, analytics funnel/export expansion, deploy-smoke coverage pass, and docs/schema synchronization pass.

> Last synchronized: April 11, 2026. Reviewed during the live clean-route verification pass, remaining session-first internal-screen cleanup, operational profitability labor-estimate pass, route-collision cleanup, and docs/schema synchronization pass.

> Last synchronized: April 11, 2026. Reviewed during the route-safety hotfix carry-forward, crew-summary workflow pass, admin runtime timeout/text-fallback hardening pass, stress-check cleanup pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the session-first admin recovery/live/progress app-shell pass, recovery audit visibility pass, static stress-check pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the canonical add-on media recovery, crew assignment/senior detailer workflow, responsive app-shell tightening, stability checks, and docs/schema synchronization pass.

> Last synchronized: April 9, 2026. Reviewed during the add-on image restore, assignment identity normalization, month-end checklist, and docs/schema synchronization pass.

> Last synchronized: April 8, 2026. Reviewed during the accounting backend, payable/expense, month-end reporting, and docs/schema synchronization pass.

> Last synchronized: March 29, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.
# Rosie Dazzlers — Next Steps Internal


Use this when you want the fastest answer to:
**“What should we do next?”**

---

## Immediate next priorities

### 1) Add real staff login / session handling
Current admin/detailer access still relies on a bridge model.

Need:
- real staff authentication
- session-aware admin/detailer pages
- backend trust in resolved staff identity
- less dependence on manual headers or typed names

Why first:
- role-aware backend patterns now exist
- the missing piece is real identity/session flow

---

### 2) Make all jobsite actions consistently use real staff identity
A lot of jobsite/admin flows now support staff-aware logic, but consistency still matters.

Need:
- consistent use of `staff_user_id`
- cleaner linkage for:
  - intake
  - progress
  - time
  - media
  - signoff
- less fallback reliance on typed names

Why next:
- better audit trail
- cleaner overrides
- fewer ambiguous records

---

### 3) Complete gift certificate redemption during booking
Gift purchase works, but booking-time gift redemption still needs the full loop.

Need:
- gift code validation
- remaining value lookup
- total reduction during booking
- remaining balance update
- mark fully redeemed when exhausted

Why next:
- closes a major customer-facing workflow gap

---

### 4) Unify add-on pricing/config
Add-ons still need a single canonical source.

Need:
- one structured source for add-ons
- frontend and backend reading the same values
- no pricing drift between display and checkout

Why next:
- prevents silent pricing mismatches

---

### 5) Add direct phone-friendly upload flow
Media records exist, but direct field upload still needs a proper path.

Need:
- signed upload URLs or direct storage integration
- mobile-friendly upload UX
- clean save into `job_media`

Why next:
- makes field use much more realistic
- removes friction for before/after uploads

---

### 6) Build a cleaner internal admin/detailer shell
There are now enough admin/detailer pages that navigation needs to mature.

Need:
- shared internal shell
- role-aware menu visibility
- better mobile workflow
- smoother movement between booking, progress, jobsite, live, staff, and customers

Why next:
- current pieces are strong enough to benefit from better structure

---

## Cleanup phase after that

### 7) Review older endpoints and duplicate patterns
Need:
- identify legacy shared-password-only paths
- reduce duplicate old/new patterns
- remove clearly obsolete routes once replacements are stable

### 8) Expand override logging consistency
Need:
- confirm all sensitive overwrite/delete actions write to `staff_override_log`
- make reason capture consistent

### 9) Grow customer + vehicle history
Need:
- deeper customer booking history
- future vehicle profile/history direction
- stronger repeat-customer context

### 10) Finish route cleanup
Need:
- settle canonical structure for services/pricing
- remove long-term route ambiguity

---

## What not to do next

Avoid spending the next phase on:
- adding lots of new isolated endpoints
- renaming live asset files casually
- mixing customer tiers with staff permissions
- building fancy admin UI before auth/session basics are ready
- keeping old/new admin flows in parallel longer than necessary

---

## If only one task is chosen

Pick:

**real staff login/session handling**

That is the most important next step because the backend is now strong enough to benefit from real identity and role-aware internal use.

---

## One-sentence summary

The next Rosie Dazzlers phase should focus on **real staff auth, consistent staff identity, gift redemption, upload flow, and internal workflow polish** rather than simply adding more disconnected backend pieces.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


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
