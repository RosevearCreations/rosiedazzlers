# Build 473 — Service Economics Allocation & Margin Review Readiness

## Purpose
Make service/package and add-on margin review defensible only where the retained economics authorities contain explicit recorded allocation linkage. Build 473 reuses the existing read-only Service Economics review and does not create a second ledger, costing engine, pricing system or allocation store.

## Retained authority
Build 473 layers on the existing job-profitability, service-economics, quote/pricing-learning and completeness authorities. The owning endpoint remains `/api/admin/service_economics_commercial_capacity_review`, and the protected Admin surface remains `/admin-service-economics-commercial-capacity-review.html`.

## Service/package allocation readiness
A service/package cohort is review-ready only when every included completed-job row has a recorded package/service code, ready recorded revenue, explicit job-use material cost, logged labour with a positive recorded rate, collected-cash/balance-due/refund evidence, booking-linked posted COGS reconciliation, and a recorded contribution value supported by those same complete components.

The allocation basis is the already-recorded booking-to-package linkage. Build 473 does not redistribute a booking total among services, add-ons, periods or staff. A cohort with complete linkage may be reviewed even when another cohort remains blocked.

## Add-on allocation readiness
Add-on margin requires explicit per-add-on allocation rows from an owning evidence source. Each row must identify the add-on and explicitly record/link add-on revenue, material usage, labour time, cash/refund allocation and posted COGS.

Aggregate booleans, a booking total, package price, add-on count or percentage assumption do not prove add-on allocation. Equal split, price-weighted split, percentage allocation and booking-cost division remain prohibited.

## Overhead boundary
Retained overhead allocation is an estimate. It is excluded from Build 473 margin-readiness decisions and never turns missing direct linkage into a defensible margin claim.

## Read-only and privacy boundary
The response remains aggregate-only and does not expose raw booking IDs, customer identity or staff identity. No automatic price/discount, booking, accounting, inventory, provider, schema, storage or background-polling mutation is authorized.

## Acceptance
The exact candidate must pass the focused Build 473 checker/test, retained service-economics authorities, Current Source Gate and exact feature-preview acceptance, exact-SHA Development acceptance, protected-main PR governance, and independent exact resulting `main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 474 — Reliability, Cost & Resilience Trend Review** begins only after Build 473 is independently GREEN on protected `main`.
