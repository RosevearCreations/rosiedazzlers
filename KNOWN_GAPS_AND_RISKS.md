# Known Gaps and Risks — Build 142

**Updated:** 2026-05-15

## Active gaps

1. `service_area_rules` is optional until the Supabase migration is run and seeded.
2. Water restrictions can change; staff should verify county pages before dispatch during dry weather or active restriction windows.
3. Typed towns still need confirmation when the town does not exactly match the known Oxford/Norfolk service-area list.
4. The Admin App editor still needs a full connected load/save/import/export UI for `service_area_rules`.
5. Town pages have static crawlable shells, but they still need more real local proof, photos, and approved reviews.
6. Reviews are still sample/fallback proof until the review approval workflow is connected.
7. Media library management is not fully DB-backed yet.
8. Inventory usage is not fully tied to completed jobs and accounting profitability yet.
9. Accounting remains operational bookkeeping support, not finished filing software.
10. Search ranking is not guaranteed; local relevance, distance, prominence, page quality, proof, and Google Business Profile consistency still matter.

## Risk reduced in Build 142

- The service-area dropdown no longer depends only on native datalist behavior.
- Booking can carry county/water-rule/travel-tier metadata into checkout.
- New DB/API foundations allow service-area rules to move out of fragile static JSON later.
- More town pages are crawlable with one clear H1 and local wording.
