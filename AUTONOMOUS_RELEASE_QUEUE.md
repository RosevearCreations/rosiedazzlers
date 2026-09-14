# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_396_405.md`; prior phases remain historical context only.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding historical release identities in living prose.

## Current release

**Build 398 — Customer Journey, Booking QoL & Acquisition Quality** is the active bounded release.

Current scope:

- improve the public booking journey without replacing the proven live-pricing and canonical booking-planner engine;
- preserve only vehicle-size, package-code and add-on-code selections in a browser-local draft for up to 48 hours, with explicit Resume service choices / Start fresh behavior and no contact, appointment or payment fields in that draft;
- clarify what happens next, unavailable-slot handling and deposit progression while retaining truthful server-authoritative booking/checkout boundaries;
- add a protected aggregate Acquisition Quality surface using existing `site_activity_events` source/campaign/referrer/device evidence;
- keep missing attribution explicit as unavailable/insufficient/unattributed, disclose bounded row limits/truncation, and prohibit anonymous-to-customer identity joins or inferred attribution;
- retain Build 397 responsive phone/tablet/desktop acceptance, accessible touch targets and viewport-safe controls;
- remain schema-neutral and source-only: no database migration, Production business-data mutation, provider/payment mutation, accounting posting, period-close mutation, inventory mutation, R2 write/delete, DNS/secret mutation or deployment mutation outside normal release promotion.

The candidate must pass the focused **Customer Journey, Booking QoL & Acquisition Quality Authority**, retained responsive/growth authorities, Current Source Gate and feature-preview acceptance before `dev` moves. `dev` then advances by non-force fast-forward to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance. Production promotion must proceed by pull request into protected `main`, satisfy `rd main protection` including `source checks`, and then receive exact-SHA Production deployment/runtime/business acceptance on the resulting `main` head. Missing required checks or exact Production runtime/deployment identity are blockers rather than permission to infer success.

## Next release

**Build 399 — Customer Communication, Self-Service & Booking Funnel** is next only after Build 398 is fully accepted on protected `main` and exact Production evidence is GREEN.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested candidate through a non-force fast-forward to Development, respect protected-main pull-request requirements, and treat the resulting `main` head as the exact Production identity to be independently accepted. Database migrations remain separate acceptance boundaries.
