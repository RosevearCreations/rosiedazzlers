# Build 502 — Booking & Quote Experiment Outcome Interpretation

## Purpose
Interpret only attributable outcomes from separately authorized booking/quote experiment executions tied to the retained measurement lock.

Build 502 reuses the existing booking/quote learning workbench, the retained measurement-lock authority and Build 492 execution evidence. It does not create a second experiment engine, analytics store, pricing authority, booking flow or availability engine.

## Interpretation prerequisites
Outcome interpretation remains fail-closed unless the retained execution evidence is review-ready and preserves:
- the exact locked experiment key/revision and primary metric;
- separately authorized allocation arms and bounded duration;
- attributable allocation and observation timestamps;
- explicit Southern Ontario weather/service/site eligibility evidence;
- exclusion of weather-ineligible sessions from the conversion denominator;
- observed locked stop-condition state; and
- comparable numeric observations of the locked primary metric for every authorized allocation arm.

Missing, mismatched or incomplete outcome values are not converted into a result. A triggered stop condition overrides interpretation readiness and requires explicit owner review.

## Descriptive interpretation only
When evidence is complete, Build 502 may show per-arm observed count, mean, minimum and maximum values for the locked primary metric. These summaries are descriptive evidence only.

The owner-defined success threshold, target direction and winner rule remain retained governance text. Build 502 does not mechanically parse free-text thresholds or rules into a success decision.

Therefore every interpretation retains:
- `threshold_evaluation: owner_review_required`;
- `success: null`; and
- `winner: null`.

## Review states
- `measurement_lock_required` — no locked measurement contract is available.
- `execution_evidence_not_ready` — separately authorized Build 492 evidence is absent, incomplete, unattributable or otherwise not review-ready.
- `stop_condition_review_required` — an observed locked stop condition has triggered.
- `outcome_measurement_required` — no attributable weather-eligible denominator rows contain the locked outcome measurement.
- `outcome_measurement_incomplete` — outcome values are missing or metric keys do not match the locked primary metric.
- `allocation_comparison_incomplete` — one or more authorized allocation arms lacks a comparable metric observation.
- `descriptive_outcome_interpretation_ready` — complete comparable evidence may be summarized descriptively for owner review.

No state selects a winner, declares experiment success, proves price causation or recommends a business mutation.

## Seasonal truth boundary
Weather-ineligible sessions in Southern Ontario remain eligibility evidence, not conversion failures. Exact service temperature limits remain source-owned and are never inferred from experiment outcomes.

## Mutation and privacy boundary
Build 502 authorizes no automatic price/discount change, booking-rule change, availability mutation, booking creation/change, outreach, provider action, customer identity join, schema/storage mutation or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 502 authority and behavioral proof, retained Build 492/481/471/461 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up** begins only after Build 502 is independently GREEN on protected main.
