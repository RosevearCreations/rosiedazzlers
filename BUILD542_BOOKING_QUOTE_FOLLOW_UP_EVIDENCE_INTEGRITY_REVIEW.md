# Build 542 — Booking & Quote Follow-Up Evidence Integrity Review

## Purpose
Independently verify that current Build 532 booking/quote follow-up freshness still describes the exact retained Build 522 outcome and Build 512 owner decision, tied to the retained Build 481 measurement lock. This is a **GET-only, read-only, fail-closed** release. It does not activate experiments or change commercial state.

## Evidence identity requirements
- Recognize the exact Build 532 and Build 522 source authorities and complete, unique, identical row-key sets. The freshness snapshot must have been evaluated recently rather than reusing a prior current verdict.
- Require current comparable Build 502/492 evidence: exact measurement-lock revision, primary metric, allocation arms, authorized duration, weather-ineligible counts and stop-condition counts across source and freshness.
- Require accepted Build 512 owner decision, exact decision trace key, Build 522 attributable outcome, exact outcome reference, reviewed timestamp and retained outcome state. An owner HOLD or no-change review is a descriptive outcome, not permission to change business settings.
- For continued observation, require exact separately authorized and later observed timestamps, current bounded duration and comparable allocation, Southern Ontario weather eligibility and explicit exclusion of weather-ineligible sessions from the conversion denominator.
- Any missing, stale, future-dated, unmatched, stopped, incomparable or unrecognized evidence returns REVIEW/HOLD. Even when integrity is current, no winner or success is declared.

## Mutation and truth boundary
No winner, success, price/discount change, booking or availability rule, outreach, quote acceptance, customer-identity join, booking mutation, provider action, canonical HOLD narrowing, schema/storage change, persistent telemetry or permanent polling is authorized. An observed weather-ineligible session is not a failed conversion and no exact service temperature threshold is inferred.

## Acceptance
Focused Build 542 syntax, checker and regression tests; retained Build 532/522/512/502/492/481 tests; Current Source Gate; exact feature-preview and exact-SHA Development deployment/runtime acceptance; protected-main PR governance; independent exact resulting-main Production deployment/runtime/business acceptance. Source status alone is not Production GREEN.

## Next bounded release
**Build 543 — Staff & Mobile Closure Evidence Integrity Review**, only after independent Build 542 Production GREEN.
