# Build 484 — Reliability, Cost & Recovery Evidence Continuity

## Purpose
Extend the retained reliability trend workbench only where comparable attributable evidence exists. Build 484 keeps first-party technical activity, provider-owned cost/quota evidence, recovery observations and Southern Ontario field operability as separate evidence classes.

## Provider cost and quota continuity
Cloudflare billing, CPU, quota or dollar-cost continuity may be described only from **provider-owned comparable evidence** with dated source references, a common metric and common unit. First-party traffic is never used as a billing, CPU, quota, scaling or future-capacity proxy.

## Recovery continuity
Recovery continuity requires at least two attributable observations for the same observation kind and environment. Source/runtime GREEN is not recovery-outcome evidence. A non-Production drill is not proof of a Production restore. Build 484 performs no restore, rollback or drill.

## Southern Ontario field operability
Technical availability and field operability are independent. A service may be technically bookable while outdoor execution is temperature-limited, or it may be cold-snap-capable because its actual process/equipment/site evidence supports that classification.

Allowed explicit classifications are `cold-snap-capable`, `temperature-limited-outdoor`, and `controlled-environment-required`. Exact temperature thresholds are carried only when an explicit service/product/equipment/site source records them. A cold-weather field limitation is not an application reliability failure.

## Mutation boundary
Read-only and manual refresh only. No automatic scaling, retry/cache mutation, provider action, restore, booking availability change, public winter claim, schema/storage mutation, business mutation or permanent polling is authorized.

## Acceptance
The exact candidate must pass the focused Build 484 checker/test, retained Build 474/464/454/444 reliability authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 485 — Production Learning & Roadmap Renewal** begins only after Build 484 is independently GREEN on protected `main`.
