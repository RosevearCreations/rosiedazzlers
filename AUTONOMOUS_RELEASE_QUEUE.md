# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_396_405.md`; prior phases remain historical context only.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding historical release identities in living prose.

## Current release

**Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence** is the active bounded release.

Current scope:

- converge field-to-office interpretation into one responsive Operations handoff workstream without creating another booking, payment, accounting, inventory, customer or job-state ledger;
- preserve the canonical Detailer evidence-creation flow and server-authoritative booking/payment truth;
- compose booking state, before/after evidence, checklist, add-on record presence, product/material usage, completion evidence, final authorization, customer-action/review state and recorded time into a manual read-only handoff;
- show commercial outcome evidence only where compatible authoritative booking/job-cost cents fields exist, with source fields disclosed and missing evidence left unavailable;
- refuse to infer add-on sales from free-form Detailer notes and prohibit inferred busy time, payouts, hidden debt, forecasts or automatic customer scores;
- preserve negative/no-result outcomes, explicit manual refresh, sleep/suspend behavior and no permanent polling;
- remain schema-neutral and source-only: no database migration, Production business-data mutation, booking/payment/provider mutation, accounting posting, inventory posting, customer mutation, destructive R2 mutation or DNS/secret mutation.

The candidate must pass the focused **Job Handoff & Commercial Evidence Authority**, retained field/responsive/growth authorities, Current Source Gate and feature-preview acceptance before `dev` moves. `dev` then advances by non-force fast-forward to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance. Production promotion must proceed by pull request into protected `main`, satisfy `rd main protection` including `source checks`, and then receive exact-SHA Production deployment/runtime/business acceptance on the resulting `main` head. Missing required checks or exact Production runtime/deployment identity are blockers rather than permission to infer success.

## Next release

**Build 402 — Admin & Operations Cockpit QoL + Growth Experiment Framework** is next only after the current release is fully accepted on protected `main` and exact Production evidence is GREEN.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested candidate through a non-force fast-forward to Development, respect protected-main pull-request requirements, and treat the resulting `main` head as the exact Production identity to be independently accepted. Database migrations remain separate acceptance boundaries.
