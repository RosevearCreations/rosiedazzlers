# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The durable numbered sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and the approved continuation `FORWARD_BUILD_ROADMAP_378_385.md`.

## Accepted checkpoint

**Build 382 — Customer Account & Retention UX Convergence** is the accepted synchronized source and Production deployment boundary before the current release begins. Its authenticated customer projection, truthful retention lifecycle presentation, safe rebooking handoff and exact-SHA Production authority remain retained release protections.

## Current release

**Build 383 — Mobile Detailer Field Workflow Hardening** is the active bounded release.

Current scope:

- retain the existing server-authoritative arrival/readiness and keys/access checks rather than creating a second field-readiness ledger;
- require booking-scoped before-service photo evidence plus a saved field checklist before the Detailer App enables **Start job**;
- record the field checklist, approved-scope/add-on record, product-use record and completion evidence through the existing staff-authorized booking note authority;
- keep approved add-ons truthful: a detailer record may document already-approved scope or “None”, but it does not approve, price or charge work;
- keep product usage operational: the field record documents meaningful usage but does not independently post inventory/accounting transactions;
- require approved-scope, product-use, completion-evidence and after-photo records before the Detailer App enables **Complete**;
- retain the existing booking-scoped signed media-upload and media-post authorities for before/during/after evidence;
- expose the customer final-balance page as a handoff only; the Detailer App cannot mark a balance paid or mutate Square/provider/payment state;
- preserve bounded staff authorization, customer privacy, event-driven runtime behaviour and zero recurring live-job polling;
- keep the current release schema-neutral: no database migration is part of this release.

The exact candidate SHA must pass the focused mobile Detailer field-workflow authority and retained source/feature gates before Development promotion. Development must pass retained runtime/deployment gates on the same SHA before `main` may move. Production promotion remains a non-force fast-forward of that exact Development-GREEN SHA and is complete only after exact-SHA Production deployment/runtime authority passes.

## Next release

**Build 384 — Finance Cockpit & Month-End UX** is next after the current release. Its durable scope and the subsequent approved sequence are preserved in `FORWARD_BUILD_ROADMAP_378_385.md`.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested SHA through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. Missing exact Production runtime/deployment identity is a blocker rather than permission to infer success.