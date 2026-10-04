# Build 533 — Staff & Mobile Closure Evidence Freshness Review

## Purpose
Revalidate retained Build 523 staff/mobile manual close or retain-open outcomes against current, materially like-for-like evidence rather than carrying an old closure outcome forward indefinitely.

Build 533 is read-only. It creates no Supabase table, migration, storage object, telemetry stream or persistent poller and performs no role, task, support, booking, outreach, provider/business or canonical-HOLD mutation.

## Freshness contract
A retained Build 523 outcome is current only when:
- the Build 523 closure outcome remains explicitly observed and attributable;
- the exact retained Build 513 readiness trace still matches;
- workflow, role, representative device/browser and measure context remain explicit;
- the retained window/sample definition remains explicit;
- at least one matching, attributable, materially like-for-like and unconfounded observation remains available;
- context, material-confounder and Southern Ontario weather/site separation reviews remain complete;
- the retained closure evidence remains within the bounded freshness window; and
- the explicit owner close/retain-open review remains within the bounded freshness window.

A historical close does not stay current merely because source/runtime is GREEN. A retain-open outcome also does not prove remediation failure.

## Freshness states
- `staff_mobile_closure_freshness_source_unavailable`
- `retained_closure_outcome_review_required`
- `closure_outcome_trace_conflict_review_required`
- `workflow_role_device_browser_context_review_required`
- `like_for_like_sample_window_review_required`
- `confounder_weather_site_review_required`
- `retained_closure_evidence_freshness_review_required`
- `owner_closure_outcome_freshness_review_required`
- `closure_outcome_current`
- `retain_open_outcome_current`

## Truth boundary
Build 533 does not infer remediation effectiveness, causation, staff fault, device fault, business impact, root cause, exact service temperature thresholds or broad winter operability. Like-for-like evidence remains bounded review evidence.

## Database/storage boundary
This release adds no schema migration, database table, persistent event stream, storage object or background telemetry. It reuses the existing read-only Build 513/523 evidence chain so it does not increase Supabase database growth through a new persistence path.

## Acceptance
The exact candidate must pass the focused Build 533 checker/test, retained Build 523/513/503/493/482/472/462/452 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review** begins only after Build 533 is independently GREEN on protected main.
