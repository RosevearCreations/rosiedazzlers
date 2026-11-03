# Build 752 — Owner Economic Evidence Acceptance, Pricing Exceptions & Margin Source Repair

Admin workbench: `/admin-economic-acceptance-v752.html` (and `/admin-economic-acceptance-v752/`). Linked from the Build 751 margin page and Build 750 inventory trail.

## What is verified

- Retrieves the same protected, session-only Build 751 month and job evidence through its existing GET handler. Any missing, truncated, inconsistent or unauthorized Build 751 source fails closed.
- Independently GETs the raw managed App Management pricing record. A missing managed record or absent package/size tier cannot be silently rescued by bundled fallback. The owner-retained Basic Detail starting guides are CAD 229/269/309 (small/mid/oversize); a managed/effective conflict is a pricing **exception**, not permission to fix or publish prices.
- Shows per-booking unverified source reasons, source-owning domain, relevant management screen and concrete manual repair action. Unreconciled Build 750 cost, incomplete Build 748 travel, booking/accounting mismatch or COGS hold prevent a qualified contribution or owner-ready claim.
- Lower recognized revenue than a **Starting at** guide is *not* treated as an error: refunds, addons, legitimate discounts, taxes or paid amounts can affect it. Recorded revenue does not prove which public price the customer saw at booking time.
- Provides a snapshot SHA-256 to compare two exact private evidence snapshots; it is neither an externally witnessed receipt nor a digital signature.
- Provides a **local-only, unsigned** owner-review draft with evidence reference, rationale and proposed disposition. The JSON explicitly says `UNSIGNED_NOT_SUBMITTED`, `recorded_owner_approval:false` and `source_correction_applied:false`. No draft is sent to the backend or stored as evidence of approval.

## Invariants

The API accepts GET and OPTIONS only; POST, PUT, PATCH and DELETE return 405. No pricing, catalog, accounting, COGS, stock, payroll, travel, booking, seasonal rule or external provider write is performed. No owner acceptance, source correction, investor-grade profit or full net margin is asserted by this build. Independent source correction and signed owner acceptance must be performed in separately authorized owning workflows, with a fresh GET afterward. Winter availability and public claims remain on their preexisting HOLDs.

## Acceptance test

1. Sign in as a manager with `manage_staff`; choose a period and refresh. Compare known bookings in the Build 751 margin page to the Build 752 queue and validate the managed pricing source is present.
2. Introduce a test-only source mismatch: mismatched posting cost, missing travel punches, booking size difference or missing raw managed catalog size. The related source owner and repair route must be shown; `owner_review_candidate` must become `source_repair_required` without making any write.
3. Confirm Basic Detail 229/269/309 stays untouched. Lower recognized revenue alone must not assert mispricing.
4. Prepare a draft containing a reference and reason; verify unsigned/not-submitted flags. Change a field and ensure the download is invalidated. No customer details or credentials should appear in the draft.
5. Attempt unauthenticated GET and each mutation method: no private source read for anonymous requests; 405 on every mutation.
6. Run `node scripts/build752_economic_acceptance_test.mjs`, full current booking regression, release check, protected `dev` and `main` CI, exact Production deployment and release health verification.

Next build should come from measured owner acceptance findings; there is no automatically authorized Build 753.
