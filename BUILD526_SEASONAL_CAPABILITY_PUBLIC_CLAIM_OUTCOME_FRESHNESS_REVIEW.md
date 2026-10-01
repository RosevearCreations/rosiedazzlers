# Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review

## Purpose
Revalidate retained Build 516 publication, retain-HOLD and no-action outcomes against current service-specific owning evidence without treating prior release acceptance as proof that an outcome is still current.

This release is read-only. It detects stale outcome evidence, current capability drift, explicit source-owned working-temperature threshold changes and observed public-wording drift. It does not publish, widen, activate or narrow anything automatically.

## Freshness contract
A retained row may be classified as:
- \`publication_current\` when the retained publication outcome remains dated within the bounded freshness window, current owning capability evidence remains true and no explicit classification, source-owned threshold or observed published-wording drift is detected;
- \`retain_hold_current\` when an explicit retain-HOLD outcome remains dated and current against the same service-specific owning evidence;
- \`no_action_current\` when an explicit no-action outcome remains dated and current against the same service-specific owning evidence;
- \`stale_outcome_review_required\` when the dated outcome or manual-publication observation is older than the bounded freshness window;
- \`source_owned_threshold_change_review_required\` when an explicit outcome-time threshold snapshot differs from the current source-owned working-temperature limit;
- \`public_wording_drift_review_required\` when an explicit outcome-time published-wording snapshot differs from the currently observed wording;
- \`capability_evidence_drift_review_required\` when current owning capability evidence is no longer current or an explicit outcome-time capability classification differs;
- \`outcome_evidence_drift_review_required\` when the current explicit outcome differs from the retained observed outcome;
- \`predecessor_outcome_review_required\` or \`freshness_source_unavailable\` when the retained/current evidence is not sufficient to establish freshness.

Missing evidence remains review/HOLD. Freshness is never inferred from source, Development or Production GREEN.

## Southern Ontario seasonal-service truth boundary
Cold-snap-capable, temperature-limited outdoor and controlled-environment-required classifications remain service-specific. Source-owned product/equipment/site/process working-temperature limits cannot be widened from a prior claim, weather, booking demand, margin, uptime or release status. A current service-specific publication does not establish broad winter availability.

## Mutation boundary
Build 526 performs no public-content publication, booking or availability change, quote-rule activation, customer messaging, pricing/discount change, provider action, capacity reservation, accounting/inventory mutation, canonical-HOLD narrowing, schema/storage mutation, outreach or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 526 checker/test, retained Build 516 outcome-continuity authority, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-\`main\` Production deployment/runtime/business acceptance.

## Next bounded release
**Build 527 — Winter Booking & Quote Rule Outcome Freshness Review** begins only after Build 526 is independently GREEN on protected \`main\`.
