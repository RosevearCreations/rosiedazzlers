# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_396_405.md`; prior phases remain historical context only.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding historical release identities in living prose.

## Current release

**Build 400 — Detailer Mobile App QoL & Retention Evidence** is the active bounded release.

Current scope:

- extend the canonical `/app/detailer/` field runtime instead of creating a parallel Detailer application;
- add large touch-friendly shortcuts to the existing before-photo, checklist, approved add-on, product/material, completion and after-photo controls;
- add a device-only session timer that is explicitly not payroll, billing, accounting, completion or canonical job-state evidence;
- preserve the existing Build 383 start/complete field-evidence gates and server-authoritative job transitions;
- add bounded aggregate repeat-service/rebooking evidence from exact canonical `customer_id` booking history only;
- exclude missing canonical IDs instead of guessing and prohibit fuzzy/email/name identity matching, identifier output, persistent customer scoring and automatic outreach;
- disclose bounded windows, row limits, partial/unavailable evidence and avoid lifetime-retention claims from a bounded observation window;
- remain schema-neutral and source-only: no database migration, Production business-data mutation, booking/payment/provider mutation, accounting posting, inventory posting, destructive R2 mutation, DNS/secret mutation or permanent polling.

The candidate must pass the focused **Detailer Mobile QoL & Retention Evidence Authority**, retained field/responsive/growth authorities, Current Source Gate and feature-preview acceptance before `dev` moves. `dev` then advances by non-force fast-forward to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance. Production promotion must proceed by pull request into protected `main`, satisfy `rd main protection` including `source checks`, and then receive exact-SHA Production deployment/runtime/business acceptance on the resulting `main` head. Missing required checks or exact Production runtime/deployment identity are blockers rather than permission to infer success.

## Next release

**Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence** is next only after the current release is fully accepted on protected `main` and exact Production evidence is GREEN.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested candidate through a non-force fast-forward to Development, respect protected-main pull-request requirements, and treat the resulting `main` head as the exact Production identity to be independently accepted. Database migrations remain separate acceptance boundaries.