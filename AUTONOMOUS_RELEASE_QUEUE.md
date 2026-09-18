# Rosie Dazzlers — Autonomous Development Queue

This living queue records only the current bounded release path. Completed implementation history belongs in Git history and workflow evidence. Active forward authority: `FORWARD_BUILD_ROADMAP_405_415.md`.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding commit identities here.

## Current release

**Build 409 — Inventory & Job-Cost Operational Evidence** is the active bounded release.

Scope:

- retain `catalog_inventory_movements`, `catalog_inventory_items` and `catalog_purchase_orders` as the only canonical inventory/reorder authorities;
- accept only explicit negative `job_use` movements as job-consumption/material-cost evidence;
- expose booking-linked waste/adjustment depletion without inferring customer-job consumption;
- verify recorded previous/delta/new quantity continuity when available and fail closed when incomplete or inconsistent;
- use recorded inventory cost only; never estimate missing material cost;
- surface row-level approval and stable accounting-posting evidence only when already recorded; never infer either from movement type, actor, note or stock success;
- keep low-stock/reorder evidence read-only and never create purchasing activity;
- preserve retained inventory/job-cost compatibility while adding the stricter current operational evidence contract;
- introduce no schema migration, inventory mutation, purchasing, accounting posting, payment/provider mutation or Production business-data mutation.

Current contract: `BUILD409_INVENTORY_JOB_COST_OPERATIONAL_EVIDENCE.md`.

The candidate must pass focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass Development deployment/runtime acceptance.

Production promotion proceeds through `rd main protection` and a pull request to protected `main`. Production deployment/runtime/business acceptance is independent of source promotion. Missing required checks or exact Production runtime/deployment identity are blockers.

## Next release

**Build 410 — Maintenance / Fleet Commercial Acceptance** is next only after the current release is independently GREEN on protected `main`.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Source/Production release GREEN is distinct from provider, owner-action and unavailable evidence. Any post-acceptance source write requires exact-SHA revalidation. Database migrations and provider/business mutations remain separate explicit acceptance boundaries.
