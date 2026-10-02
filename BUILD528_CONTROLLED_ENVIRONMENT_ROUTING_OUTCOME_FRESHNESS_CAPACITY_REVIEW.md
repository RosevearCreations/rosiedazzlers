# Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review

## Purpose
Revalidate retained Build 518 route and safe-reschedule outcomes against current service/site/workflow evidence and current site-confirmation practice, while reviewing only bounded observed capacity that is dated, attributable and tied to the same retained site.

This release is read-only. Route freshness and capacity evidence are separate. A route can remain current while capacity is unknown, and an observed capacity sample remains historical evidence only.

## Routing freshness contract
- `route_outcome_current` requires current service classification, current site/workflow/equipment/product evidence, current routing/site-confirmation/safe-reschedule practice, a matching retained site reference, a fresh attributable route observation and fresh attributable site confirmation.
- `safe_reschedule_outcome_current` requires the same current service/site/workflow practice evidence plus a fresh attributable safe-reschedule outcome.
- `stale_routing_outcome_review_required`, `site_confirmation_freshness_review_required`, `safe_reschedule_freshness_review_required`, `service_site_workflow_drift_review_required`, `routing_outcome_drift_review_required`, `predecessor_outcome_review_required` and `freshness_source_unavailable` remain manual review states.

## Bounded capacity contract
- `bounded_observed_capacity_current` requires an explicit integer observed-job count, dated observation, attributable reference, bounded observation window of 1–90 days and a site reference matching the retained qualified site.
- `capacity_not_observed` means no capacity claim is supported; it does not invalidate a separately current historical route outcome.
- `stale_observed_capacity_review_required`, `capacity_site_mismatch_review_required` and `capacity_evidence_invalid_review_required` remain review/HOLD for any capacity interpretation.
- A successful route never establishes universal indoor capability or future capacity. A bounded observed-capacity sample never establishes future availability or reserves capacity.

## Mutation boundary
Build 528 performs no appointment movement, automatic routing, reschedule, booking/availability change, quote-rule change, customer message, public indoor/winter claim, capacity reservation, price/discount change, provider action, accounting/inventory mutation, canonical-HOLD mutation, schema/storage mutation, outreach or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 528 checker/test, retained Build 518 routing-outcome authority, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-`main` Production deployment/runtime/business acceptance.

## Next bounded release
**Build 529 — Provider & Local Search Closure Evidence Freshness Review** begins only after Build 528 is independently GREEN on protected `main`.
