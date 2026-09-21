# Build 464 — Reliability, Cost & Resilience Operational Guardrails

## Purpose
Re-run the retained read-only I.T. reassessment with explicit operational guardrails and evidence-age review after the 456–463 evidence cycle, without creating a parallel observability, billing, capacity or recovery system.

## Retained operator surface
Build 464 reuses the protected I.T. page `/admin-reliability-reassessment.html`, the read-only `/api/admin/reliability_security_cost_reassessment` endpoint, and the retained reliability/security/cost classification authority.

The same bounded evidence remains separated into retained GREEN controls, operational pressure, stale evidence, owner action, provider dependency and unavailable evidence.

## Evidence-age guardrail
Attributable retained evidence in the operator-review buckets is classified as:
- current when seven days old or newer;
- aging when older than seven days and not older than thirty days;
- stale when older than thirty days; or
- undated when no attributable observation time exists.

A stale item requires revalidation before it is treated as current. Aging or undated evidence requires operator review. Refreshing the page never changes the underlying observation date of retained readiness evidence.

## Provider cost and quota guardrail
Cloudflare billing, CPU consumption, quota state and dollar cost remain provider-owned evidence. First-party traffic, request counts, diagnostic duration and error state are not billing or quota proxies.

Build 464 does not infer provider cost, CPU use, quota exhaustion or a scaling requirement when provider-owned evidence is absent.

## Capacity guardrail
Operational pressure may justify bounded operator review of dependency calls, caching opportunities and hot paths. It does not establish future capacity or prove that scaling is required.

No automatic scaling, retry expansion or cache-policy mutation is authorized.

## Recovery and resilience guardrail
Retained backup/recovery source authority, artifact evidence and drill readiness remain resilience inputs only. Source/runtime GREEN, current metadata or a bounded drill record do not prove a real Production restore, secret rotation, DNS recovery, R2 recovery or provider recovery.

Real recovery outcomes remain separately authorized and independently observed.

## Privacy and authority boundary
The page remains protected by existing I.T. runtime-view authority, aggregate-only, manual-refresh-only and no-store. It does not expose provider credentials, secret values, customer records or message contents.

## Mutation boundary
No automatic scaling, retry expansion, cache-policy mutation, secret rotation, Production restore, DNS/R2/provider mutation, schema/storage mutation, customer/business/accounting/inventory mutation, outreach or permanent polling is authorized.

## HOLD boundary
Provider billing/CPU/quota evidence, real recovery evidence, independent device evidence and other unavailable owner/provider outcomes remain truthful HOLDs in `STARTUP_GO_LIVE_BLOCKERS.md`. Build 464 does not close them from source/runtime GREEN.

## Acceptance
The exact candidate must pass:
1. `scripts/reliability_cost_resilience_operational_guardrails_check.py`;
2. `scripts/reliability_cost_resilience_operational_guardrails_test.mjs`;
3. retained Build 454/444/434 reassessment authorities;
4. retained reliability/performance/cost-capacity, security/privacy/recovery, recovery-evidence/drill, observability/support-diagnostics and I.T. readiness authorities;
5. Current Source Gate and exact feature-preview deployment/runtime acceptance;
6. non-force promotion of the exact accepted candidate to `dev`;
7. independent exact-SHA Development deployment/runtime acceptance;
8. protected-main pull-request checks; and
9. independent exact resulting `main` Production deployment/runtime/business acceptance.

Source/runtime GREEN never becomes fabricated provider billing, CPU, quota, scaling-need or real recovery evidence.

## Next bounded release
**Build 465 — Production Learning & Roadmap Renewal** begins only after Build 464 is independently GREEN on protected `main`.
