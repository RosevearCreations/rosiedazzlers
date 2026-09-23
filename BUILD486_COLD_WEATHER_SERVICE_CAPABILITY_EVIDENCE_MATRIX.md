# Build 486 — Cold-Weather Service Capability Evidence Matrix

## Purpose
Create one read-only matrix for Rosie Dazzlers packages, add-ons and explicitly identified services using attributable Southern Ontario cold-weather capability evidence. This release reuses the retained Service & Add-On seasonal-operability authority rather than creating a second service catalogue or weather rules engine.

## Evidence requirement
A matrix row is valid only when it has attributable service/product/equipment/site/process evidence and:
- a package, add-on or explicit service identity;
- one allowed classification: `cold-snap-capable`, `temperature-limited-outdoor` or `controlled-environment-required`;
- an explicit evidence source type: service, product, equipment, site or process; and
- an attributable evidence reference.

No invented threshold is allowed. A numeric working-temperature value is exposed only when the owning evidence explicitly marks the exact temperature claim as supported.

## Southern Ontario truth boundary
The matrix describes capability evidence; it does not make a broad winter-availability claim. Weather forecasts, booking demand, margin evidence, application uptime and operator assumption do not prove field capability.

A service may remain unavailable in the matrix when its evidence is missing even if the website is technically available. A cold-weather field limitation is not an application reliability failure.

## Mutation boundary
Read-only and manual refresh only. No automatic booking/availability change, customer-facing winter claim, price/discount change, accounting/inventory mutation, provider action, schema/storage mutation, outreach or permanent polling is authorized.

## Deployment identity boundary
A stale or still-building Cloudflare preview is not acceptance. Feature promotion requires the exact current candidate SHA to become visible as a successful Cloudflare Pages preview; retrying or replacing a stalled external deployment never changes the evidence rules above.

## Acceptance
The exact candidate must pass the focused Build 486 checker/test, retained seasonal/service-economics authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 487 — Winter Booking Eligibility & Customer Transparency** begins only after Build 486 is independently GREEN on protected `main`.
