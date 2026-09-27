# Build 513 — Staff & Mobile Remediation Closure Readiness

## Purpose
Classify whether retained staff/mobile remediation evidence is ready for a bounded manual closure review without turning descriptive movement into an effectiveness, causation, staff-fault or device-fault conclusion.

Build 513 reuses Build 503 Staff & Mobile Remediation Outcome Interpretation & Follow-Up, Build 493 outcome evidence and Build 482 execution-evidence readiness. It does not create a second remediation system, staff telemetry store, device telemetry system, task engine or role-management path.

## Closure-readiness prerequisites
A row can become `bounded_closure_readiness_review_ready` only when:
- the retained Build 503 interpretation is already bounded and review-ready;
- the source row traces to attributable Build 493 remediation execution evidence;
- follow-up evidence explicitly references the retained interpretation evidence;
- measure definition, owning workflow scope, role scope, representative device/browser context and window/sample definition remain materially like-for-like;
- material confounders are explicitly recorded;
- no material confounder is present in the closure-ready evidence;
- Southern Ontario weather/site classification is preserved separately from staff/mobile friction; and
- any non-`not_applicable` weather/site classification retains an attributable evidence reference.

Missing or mismatched context never becomes closure readiness.

## Review states
- `interpretation_not_review_ready` — retained Build 503 interpretation is not ready.
- `closure_evidence_source_required` — no approved closure follow-up evidence source is available.
- `closure_follow_up_evidence_required` — source interpretation is ready but no matching follow-up row exists.
- `closure_follow_up_unattributable` — a follow-up row exists but lacks source trace, observation time or protocol attribution.
- `like_for_like_closure_evidence_required` — follow-up evidence does not preserve the required workflow/role/device/browser/measure/sample or weather/site context.
- `material_confounder_review_required` — material confounders are missing or present and require explicit review.
- `bounded_closure_readiness_review_ready` — the evidence package is ready for a bounded manual closure review only.

No state closes a remediation, changes a role, resolves an exception, or narrows a canonical HOLD automatically.

## Truth boundary
Even a closure-ready package keeps:
- remediation effectiveness undecided;
- causation undecided;
- staff fault undecided;
- device/browser fault undecided;
- business impact undecided; and
- weather/site restrictions separate from staff/mobile friction.

A repeat materially like-for-like observation is evidence for review readiness, not proof of causation.

## Southern Ontario weather/site boundary
Cold-snap capability, temperature-limited outdoor work and controlled-environment requirements remain operational classifications. Build 513 invents no service temperature threshold and makes no broad winter-availability claim.

## Privacy and mutation boundary
Customer identity, staff identity, raw booking identifiers and raw support-exception identifiers remain outside this release.

Build 513 performs no automatic remediation/closure, role or permission change, job/task/support-exception action, customer/provider outreach, provider/payment/accounting/inventory transaction, canonical HOLD mutation, schema/storage mutation, background telemetry or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 513 authority and behavioral proof, retained Build 503/493/482/472/462/452 staff/mobile authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-main Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness** begins only after Build 513 is independently GREEN on protected `main`.
