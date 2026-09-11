# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The durable numbered sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and the approved continuation `FORWARD_BUILD_ROADMAP_378_385.md`.

## Accepted checkpoint

**Build 380 — Booking Recovery & Failure Handling** is the accepted synchronized source and Production deployment boundary before the current release begins. Its customer-safe recovery wrapper, same-tab draft recovery, stale-availability handling and durable exact-SHA Production authority remain retained release protections.

## Current release

**Build 381 — Operations Daily Command Centre** is the active bounded release.

Current scope:

- present the current service day's appointments in one protected Operations work surface;
- aggregate customer/vehicle context, existing staff assignment, booking/job completion state, site/geofence evidence and booking-finance balance evidence without creating a second ledger;
- expose package code as the service-requirement anchor while failing closed when exact equipment/product evidence is not available from the booking summary;
- show live travel/traffic conditions as Unknown when no canonical live-travel authority exists rather than fabricating readiness evidence;
- route operational changes to the existing Bookings, Assignment, Job Site, Progress, Payments, Inventory and Today Needs Attention authorities;
- keep the command centre operator-driven with no recurring polling, browser-side operations ledger, direct operational mutation or incidental schema change.

The exact candidate SHA must pass the focused Operations authority and retained source/feature gates before Development promotion. Development must pass retained runtime gates on the same SHA before `main` may move. Production promotion remains a non-force fast-forward of that exact Development-GREEN SHA and is complete only after exact-SHA Production deployment/runtime authority passes.

## Next release

**Build 382 — Customer Account & Retention UX Convergence** is next after the current release. Its durable scope and the subsequent approved sequence are preserved in `FORWARD_BUILD_ROADMAP_378_385.md`.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested SHA through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. Missing exact Production runtime/deployment identity is a blocker rather than permission to infer success.
