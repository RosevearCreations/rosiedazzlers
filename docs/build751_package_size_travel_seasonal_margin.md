# Build 751 — Package, Vehicle Size, Travel & Seasonal Margin Review

Private owner review: `/admin-margin-review-v751.html`, linked from the Inventory/Consumable Job Cost screen. Source code is read-only. No pricing, accounting, inventory, booking, travel surcharge, tax or winter-rule writes are performed.

## Source reconciliation

1. **Current guide prices:** Loaded through the canonical App Management pricing-catalog loader, with clearly disclosed bundled fallback. All three unchanged, previously approved Basic Detail `Starting at` tiers remain CAD 229/269/309. They are reference prices, not realized revenue or owner permission to alter prices.
2. **Recorded revenue and labour:** Existing Build 428 operational profitability authority, already linked to accounting records, staff logged time and rates, and COGS reconciliation. “Estimated direct labour” is not payroll or all-in cost.
3. **Recorded consumables:** Exact Build 750 posting batch and original unit-cost rows. Net cost accounts for reversals. Missing original rows, unknown cost, posting/COGS mismatch and accounting exceptions block a review-ready contribution.
4. **Vehicle size, travel zone and date:** Cross-check booking with accounting snapshots. Different size/package/date or missing zone requires review; no default vehicle class/zone is invented.
5. **Travel minutes:** Build 748 independent job clock-punch source; incomplete or open shifts are review. Even a closed clock interval is not independent approval or a wage ledger. The optional browser-only CAD/hour scenario is labelled *what-if* and never saved.
6. **Season:** December–February winter calendar, March–April/October–November shoulder calendar, remaining months warm calendar. This is not weather, indoor-site capability or booking eligibility. All winter public-claim and booking HOLDs remain intact.

The interface shows job-level owner exceptions and three transparent cohorts: package × size, calendar season and travel zone. Cohort contribution is suppressed until **every** row is evidence-ready. **Pre-travel contribution** is not net profit: actual travel labour, tax, allocated overhead, provider fees and other costs are deliberately not invented.

## Safe acceptance

- Select a completed-jobs month in the protected admin page and manually refresh. Verify actual source counts and exception reasons.
- Compare a known booking's original posting-time unit cost against its Build 750 trail, and its vehicle size and package against accounting. If either differs, the report must say Review without a cohort margin claim.
- Try a month with no jobs and an unrecorded travel period: no fabricated zero-dollar net margin appears.
- Enter a hypothetical travel wage and confirm only a visibly labelled local scenario changes. It must not edit settings, payroll or historical economics.
- Confirm `dev` and protected `main` full CI, exact Production deployment and release health GREEN on the same SHA.

**Next planned Build 752**: Owner Economic Evidence Acceptance, Pricing Exceptions & Margin Source Repair (proposed; confirm owner priority before work). 
