# Build 463 — Service Economics Completeness & Add-On Cost Readiness

## Purpose
Improve the completeness and visibility of retained service-economics evidence before any margin or pricing review, and make add-on cost-allocation readiness explicit without inventing an allocation method or creating a second finance/pricing system.

## Implemented evidence workflow
Build 463 enriches the existing protected `/admin-service-economics-commercial-capacity-review.html` surface and retained `/api/admin/service_economics_commercial_capacity_review` endpoint.

It reuses the retained authorities:
- Build 428 job-level profitability evidence;
- Build 443 service-economics/commercial-capacity review;
- Build 451 aggregate booking/quote pricing learning; and
- Build 453 service economics, capacity & pricing review.

No parallel ledger, inventory engine, staff-time system, add-on costing store, pricing engine or booking-capacity authority is introduced.

## Completeness model
For the bounded observed completed-job sample, Build 463 reports aggregate readiness for:
- recorded revenue;
- explicit job-use material cost;
- logged labour with a positive recorded hourly rate;
- collected cash, balance-due and refund evidence; and
- booking-linked posted COGS reconciliation.

A service/package margin review is ready only when every required retained layer is ready for every observed job in the bounded sample and the retained Build 428/453 contribution evidence is itself review-ready.

Missing or partial material, labour, cash/refund or COGS evidence remains `review` or `unavailable`. Build 463 never fills a gap with zero-cost labour, assumed material cost, inferred refund state, synthetic COGS or other estimated facts.

## Add-on allocation readiness
Add-on margin stays unavailable unless an owning recorded evidence source explicitly provides all of:
- recorded add-on revenue;
- material usage linked to the add-on;
- labour time linked to the add-on;
- cash/refund allocation linked to the add-on; and
- posted COGS linked to the add-on.

Current retained job-level profitability evidence does not provide that explicit recorded add-on allocation basis. Therefore equal split, price-weighted split, booking-cost division, percentage allocation and other inferred allocation methods remain prohibited.

This build may recognize a future explicit recorded add-on allocation evidence object, but it does not create that evidence, mutate schema, or authorize an allocation method by inference.

## Pricing boundary
Aggregate quote-value bands and booking-stage evidence remain contextual only. Complete economics evidence may make owner review better informed, but it does not prove price sensitivity, discount need, customer motive or price causation.

No pricing or discount decision is made automatically.

## Privacy and authority boundary
The Build 463 response remains aggregate-only. It exposes no customer identity, raw booking identifier, raw quote identifier or staff identity.

Existing Administration/Finance access remains authoritative. Missing or restricted retained sources are reported truthfully rather than bypassed.

## Mutation boundary
No automatic:
- price or discount change;
- quote acceptance, customer outreach or booking creation;
- add-on allocation write;
- invoice, journal, AR/AP, inventory or job-cost posting;
- staff compensation mutation;
- payment/refund/provider transaction;
- schema or destructive-storage mutation; or
- permanent polling/background telemetry.

## HOLD boundary
Build 463 does not close provider, recovery, real-device, owner-approval or unavailable-evidence HOLDs in `STARTUP_GO_LIVE_BLOCKERS.md`. Source/runtime GREEN never converts missing cost allocation into observed evidence.

## Acceptance
The exact candidate must pass:
1. `scripts/service_economics_completeness_addon_cost_readiness_check.py`;
2. `scripts/service_economics_completeness_addon_cost_readiness_test.mjs`;
3. retained Build 453 Service Economics, Capacity & Pricing Review authority;
4. retained Build 443/428 economics authorities;
5. retained Build 451 booking/quote pricing-learning authority;
6. Current Source Gate and exact feature-preview deployment/runtime acceptance;
7. non-force promotion of the exact accepted candidate to `dev`;
8. independent exact-SHA Development deployment/runtime acceptance;
9. protected-main pull-request checks; and
10. independent exact resulting `main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 464 — Reliability, Cost & Resilience Operational Guardrails** begins only after Build 463 is independently GREEN on protected `main`.
