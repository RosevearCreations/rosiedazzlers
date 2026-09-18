# Rosie Dazzlers — Autonomous Development Queue

This living queue records only the current bounded release path. Completed implementation history belongs in Git history and workflow evidence. Active forward authority: `FORWARD_BUILD_ROADMAP_405_415.md`.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding commit identities here.

## Current release

**Build 410 — Maintenance / Fleet Commercial Acceptance** is the active bounded release.

Scope:

- consume the actual configured maintenance and fleet rulebooks rather than inventing replacement economics;
- keep unresolved maintenance and fleet decisions explicitly `owner_action`;
- distinguish source release GREEN from explicit business approval;
- preserve `/api/availability` and `/api/checkout` as capacity/collision authorities;
- require accepted fleet quote status, timestamp and recorded positive amounts before treating a quote as explicit acceptance evidence;
- keep draft/sent quotes non-committal;
- prohibit inferred pricing, customer commitment and capacity reservation;
- prohibit automatic outreach, enrolment, booking, discounts, invoice creation, recurring billing, renewal and provider mutation;
- introduce no schema migration or Production business-data mutation.

Current contract: `BUILD410_MAINTENANCE_FLEET_COMMERCIAL_ACCEPTANCE.md`.

The candidate must pass focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass Development deployment/runtime acceptance.

Production promotion proceeds through `rd main protection` and a pull request to protected `main`. Production deployment/runtime/business acceptance is independent of source promotion. Missing required checks or exact Production runtime/deployment identity are blockers.

## Next release

**Build 411 — Customer Communication, Consent & Delivery Evidence** is next only after the current release is independently GREEN on protected `main`.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Source/Production release GREEN is distinct from provider, owner-action and unavailable evidence. Any post-acceptance source write requires exact-SHA revalidation. Database migrations and provider/business mutations remain separate explicit acceptance boundaries.
