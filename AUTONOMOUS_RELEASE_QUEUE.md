# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; prior phases remain historical context only.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding historical release identities in living prose.

## Current release

**Build 393 — Operations, Inventory & Job-Cost Evidence** is the active bounded release.

Current scope:

- keep `catalog_inventory_movements` as the single canonical inventory-movement authority and do not create a parallel stock ledger;
- project booking-scoped consumable/product usage and depletion from existing canonical movement evidence;
- net reversal/adjustment evidence against depletion and deduplicate replay evidence without writing new stock state;
- calculate per-job material cost only from recorded inventory `cost_cents`; missing recorded cost fails closed to `review` rather than being estimated or coerced to zero;
- surface current low-stock thresholds and active `catalog_purchase_orders` reorder evidence without auto-creating a purchase order;
- expose substitution evidence only when substitution provenance is already recorded; incomplete provenance fails closed;
- return deterministic `ready`, `review`, or `unavailable` evidence states;
- keep the current evidence endpoint staff-authorized and read-only;
- remain schema-neutral and avoid database migration, Production business-data mutation, R2 mutation, accounting posting, customer charging/refunding, Stripe/PayPal/provider mutation or any second inventory authority.

The candidate must pass the focused **Operations, Inventory & Job-Cost Evidence Authority**, Current Source Gate and feature-preview acceptance before `dev` moves. `dev` then advances by **non-force fast-forward** to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance. Production promotion must proceed by pull request into protected `main`, satisfy `rd main protection` including `source checks`, and then receive exact-SHA Production deployment/runtime/business acceptance on the resulting `main` head. Missing required checks or exact Production runtime/deployment identity are blockers rather than permission to infer success.

## Next release

**Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance** is next only after the current release is fully accepted on protected `main` and exact Production evidence is GREEN.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested candidate through a non-force fast-forward to Development, respect protected-main pull-request requirements, and treat the resulting `main` head as the exact Production identity to be independently accepted. Database migrations remain separate acceptance boundaries.
