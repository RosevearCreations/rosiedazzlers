# Rosie Dazzlers — Autonomous Development Queue

This living queue records only the current bounded release path. Completed implementation history belongs in Git history and workflow evidence. Active forward authority: `FORWARD_BUILD_ROADMAP_405_415.md`.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding commit identities here.

## Current release

**Build 411 — Customer Communication, Consent & Delivery Evidence** is the active bounded release.

Scope:

- revalidate current explicit customer consent immediately before provider dispatch;
- cancel stale queued customer communication when opt-in, channel or canonical recipient changed;
- keep staff-owned push under staff ownership rather than customer consent;
- require canonical customer ownership and explicit current consent before abandoned-checkout recovery is queued;
- preserve authenticated customer ownership of communication preferences and unsubscribe paths;
- distinguish provider-accepted/sent evidence from definitive provider delivery;
- keep failed/cancelled/suppressed/retry states truthful;
- prohibit inferred consent and automatic outreach enablement;
- introduce no schema migration or Production business-data mutation.

Current contract: `BUILD411_CUSTOMER_COMMUNICATION_CONSENT_DELIVERY_EVIDENCE.md`.

The candidate must pass focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass Development deployment/runtime acceptance.

Production promotion proceeds through `rd main protection` and a pull request to protected `main`. Production deployment/runtime/business acceptance is independent of source promotion. Missing required checks or exact Production runtime/deployment identity are blockers.

## Next release

**Build 412 — Production Observability, Alerting & Support Diagnostics** is next only after the current release is independently GREEN on protected `main`.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Source/Production release GREEN is distinct from provider, owner-action and unavailable evidence. Any post-acceptance source write requires exact-SHA revalidation. Database migrations and provider/business mutations remain separate explicit acceptance boundaries.
