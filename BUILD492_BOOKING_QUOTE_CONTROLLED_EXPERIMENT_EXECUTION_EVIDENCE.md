# Build 492 — Booking & Quote Controlled Experiment Execution Evidence

## Purpose
Define read-only, attributable execution evidence for the retained booking-and-quote controlled experiment only after a Build 481 measurement contract is locked and a separately authorized execution record exists.

Build 492 reuses the retained booking/quote learning workbench and Build 461/471/481 authorities. It does not create a second experiment system, booking flow, quote system, pricing authority or analytics store.

## Lock is not execution
A Build 481 measurement lock remains governance only. Build 492 requires a separate execution authorization that is traceable to the locked revision and contains:
- explicit authorization and authorizer/timestamp;
- a positive duration not exceeding the locked duration;
- explicit allocation arms;
- explicit weather-eligibility observation requirement;
- explicit outcome-capture authorization; and
- explicit acknowledgement of the locked stop conditions.

Without that separate authorization, status remains execution_authorization_required.

## Attributable execution evidence
Observed execution evidence remains non-identifying and explicit for:
- experiment key and bounded assignment reference;
- allocation arm and allocation timestamp;
- observation timestamp and bounded duration;
- Southern Ontario weather/service/site eligibility evidence;
- stop-condition observation and trigger state; and
- outcome metric observation.

Weather-ineligible sessions are excluded from the conversion denominator. A weather restriction is not a conversion failure.

## Review states
- measurement_lock_required — retained measurement contract is not locked.
- execution_authorization_required — lock exists but separate execution authorization is incomplete or absent.
- execution_source_required — authorization exists but no approved execution-evidence source is available.
- execution_evidence_required — source exists but no rows are observed.
- execution_evidence_unattributable — rows exist but cannot be attributed to authorized allocation/time evidence.
- execution_evidence_incomplete — attributable rows lack required weather, stop-condition, outcome, allocation-coverage or duration evidence.
- stop_condition_triggered_review_required — an observed locked stop condition has triggered.
- bounded_execution_evidence_review_ready — execution evidence is attributable and complete within the authorized bounds.

No state selects a winner or declares success.

## Weather and seasonal truth boundary
Southern Ontario weather/site restrictions remain eligibility evidence, separate from conversion performance. Build 492 does not invent temperature limits, infer seasonal demand, count weather-ineligible sessions as failures or override service capability evidence.

## Mutation and privacy boundary
Build 492 authorizes no automatic experiment activation, winner selection, price/discount mutation, booking-rule or availability change, booking creation/change, outreach, provider action, customer/session/quote identity join, schema/storage mutation or permanent polling.

## Current truthful state
The retained Build 481 locks remain authoritative. Until a separate execution authorization and execution-evidence source are recorded, the current state remains owner action. Source/runtime GREEN never proves an experiment ran.

## Acceptance
The exact candidate must pass the focused Build 492 authority and behavioral proof, retained Build 481/471/461 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting-main Cloudflare Production deployment/runtime/business acceptance.

## Next bounded release
**Build 493 — Staff & Mobile Remediation Outcome Evidence** begins only after Build 492 is independently GREEN on protected main.
