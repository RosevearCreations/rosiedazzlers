# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_396_405.md`; prior phases remain historical context only.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding historical release identities in living prose.

## Current release

**Build 399 — Customer Communication, Self-Service & Booking Funnel** is the active bounded release.

Current scope:

- improve confirmation, preparation, appointment/status, reschedule/cancellation, aftercare, review and rebooking guidance without creating a parallel booking or communication engine;
- keep self-service explicit: a navigation or contact path does not silently change a booking, promise a refund, send a message or claim staff acceptance;
- add a protected Customer Booking Funnel surface using separate anonymous-interaction and canonical booking-status evidence layers;
- disclose bounded windows, row limits, incomplete telemetry and unavailable evidence without joining anonymous sessions to customer identities or overstating person-level conversion;
- retain shared responsive phone/tablet/desktop acceptance, accessible touch targets and viewport-safe controls;
- remain schema-neutral and source-only: no database migration, Production business-data mutation, booking mutation, automatic outreach, provider/payment mutation, accounting posting, period-close mutation, inventory mutation, R2 write/delete, DNS/secret mutation or deployment mutation outside normal release promotion.

The candidate must pass the focused **Customer Communication, Self-Service & Booking Funnel Authority**, retained customer-journey/responsive/growth authorities, Current Source Gate and feature-preview acceptance before `dev` moves. `dev` then advances by non-force fast-forward to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance. Production promotion must proceed by pull request into protected `main`, satisfy `rd main protection` including `source checks`, and then receive exact-SHA Production deployment/runtime/business acceptance on the resulting `main` head. Missing required checks or exact Production runtime/deployment identity are blockers rather than permission to infer success.

## Next release

**Build 400 — Detailer Mobile App QoL & Retention Evidence** is next only after the current release is fully accepted on protected `main` and exact Production evidence is GREEN.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested candidate through a non-force fast-forward to Development, respect protected-main pull-request requirements, and treat the resulting `main` head as the exact Production identity to be independently accepted. Database migrations remain separate acceptance boundaries.
