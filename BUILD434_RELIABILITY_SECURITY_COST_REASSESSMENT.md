# Build 434 — Reliability, Security & Cost Reassessment

## Purpose

Re-run bounded Production reliability, privacy, session, capacity, recovery and cost-awareness authorities using current traffic and current operating evidence before the roadmap-renewal checkpoint.

## Implemented operator outcome

The protected I.T. surface `/admin-reliability-reassessment.html` is manual-refresh only. It composes the retained reliability/performance/cost-capacity authority, security/privacy/recovery authority and go-live readiness evidence into one current read-only reassessment.

The result deliberately separates:

- GREEN retained controls;
- emerging operational pressure;
- stale evidence;
- owner action;
- provider dependency; and
- unavailable evidence.

Each item retains its evidence source, state, observation time and a bounded safe next action.

## Current evidence model

The reassessment may use:

- current Production diagnostic duration/failure/degradation evidence;
- current first-party traffic counts for the recent 24-hour and 7-day windows;
- aggregate security posture counts;
- staff/customer session and cookie control state without exposing secret values;
- explicit consent/privacy authority;
- recovery-source readiness while keeping real restore evidence separate;
- current provider-dependent and owner-action readiness items; and
- attributable provider outcome timestamps when available, so evidence older than 30 days is called stale rather than current.

The endpoint does not return customer records, secret values, message contents or provider credentials.

## Cost and capacity truth boundary

First-party traffic volume and bounded diagnostic duration are operational-pressure evidence only. They are not Cloudflare billing, CPU-consumption, quota or future-capacity measurements.

The reassessment therefore always keeps provider-owned Cloudflare billing/CPU evidence separate and unavailable unless it is independently supplied by an authorized provider-owned source. It does not infer a dollar amount, resource consumption or scaling need.

## Security and recovery truth boundary

Source checks do not establish attack likelihood. Security posture remains aggregate evidence only.

Recovery source authority does not prove a real Production restore, secret rotation, DNS recovery, R2 recovery or provider recovery occurred. Real restore/rotation/destructive recovery remains separately authorized and must be followed by exact Production re-acceptance.

## Mutation boundary

This release introduces:

- no automatic scaling;
- no retry expansion;
- no cache-policy change;
- no secret rotation;
- no Production restore;
- no DNS mutation;
- no destructive R2 action;
- no provider mutation;
- no schema migration;
- no customer, consent, booking, accounting or inventory mutation; and
- no permanent polling.

Refresh is explicit and bounded.

## Role boundary

The operator page remains inside the existing I.T. module ceiling. The server endpoint independently requires `it.runtime.view`. Existing Admin, I.T., Operations, Detailer, Finance, DAIP and Socials role ceilings are unchanged.

## Acceptance

The exact candidate must pass:

1. `scripts/reliability_security_cost_reassessment_check.py`;
2. executable reassessment classification tests;
3. retained reliability/performance/cost-capacity, security/privacy/recovery, Production diagnostics and I.T. readiness authorities;
4. Current Source Gate;
5. exact feature-preview and Development deployment/runtime acceptance;
6. protected-main pull-request checks; and
7. independent exact resulting `main` Production deployment/runtime/business acceptance.

Source/runtime GREEN never becomes fabricated Cloudflare cost, attack-likelihood or recovery-success evidence.

## Next bounded release

**Build 435 — Production Learning & Roadmap Renewal** begins only after the current release is independently GREEN on protected `main`.
