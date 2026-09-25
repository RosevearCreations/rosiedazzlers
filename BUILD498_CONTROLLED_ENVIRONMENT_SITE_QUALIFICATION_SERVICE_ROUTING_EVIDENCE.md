# Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence

## Purpose
Prepare service-specific controlled-environment site qualification and routing evidence without moving appointments or claiming universal indoor capability.

## Qualification contract
A controlled-environment option is qualified only when the specific service has current attributable evidence for all four required domains:
- site suitability;
- workflow support;
- equipment compatibility; and
- product compatibility.

Each domain requires an attributable reference, a current-evidence marker and an explicit supported/compatible marker. Missing evidence is never inferred from another service, from weather, from application uptime or from a general controlled-environment classification.

## Routing contract
A fully qualified service may become `controlled_environment_route_review_ready`, but that state is evidence for manual operator review only. Current site confirmation is still required before execution.

When qualification evidence is incomplete:
- temperature-limited outdoor work keeps a manual safe-reschedule path; and
- controlled-environment-required work keeps a specific site-confirmation path.

No appointment is moved automatically.

## Southern Ontario truth boundary
One qualified service/site does not prove that every service can move indoors. Exact temperature limits remain source-owned. Broad winter or universal indoor availability remains HOLD.

## Mutation boundary
Read-only only. No automatic appointment move, routing, reschedule, booking/availability change, quote change, customer message, public indoor/winter claim, price/discount change, provider action, accounting/inventory mutation, schema/storage mutation, outreach or permanent polling is authorized.

## Acceptance
The exact candidate must pass the focused Build 498 checker/test, retained Build 497/488/487/486 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 499 — Provider & Local Search Outcome Evidence Refresh** begins only after Build 498 is independently GREEN on protected `main`.
