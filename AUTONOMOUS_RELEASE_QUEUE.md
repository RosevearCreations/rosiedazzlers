# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_396_405.md`; prior phases remain historical context only.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding historical release identities in living prose.

## Current release

**Build 402 — Admin & Operations Cockpit QoL + Growth Experiment Framework** is the active bounded release.

Current scope:

- reduce owner/admin screen switching with a responsive Today/Operations cockpit;
- separate urgent/high exceptions from normal/low due work while retaining explicit owner-task actions;
- expose fast drill-downs into existing authoritative Bookings, Operations, Growth and Admin workstreams;
- define evidence-only experiment families for booking abandonment, reminder timing, rebooking, referrals and review timing;
- preserve genuine observed evidence and leave missing evidence unavailable/review-required rather than inferred;
- prohibit silent pricing, booking, availability, deposit/payment, consent, outreach, customer-scoring, public-claim, accounting, inventory, provider or schema mutation;
- preserve manual refresh and no permanent polling;
- remain schema-neutral and source-only with no Production business-data or destructive R2 mutation.

The candidate must pass the focused Admin/Operations Cockpit + Growth Experiment authority, retained authorities, Current Source Gate and feature-preview acceptance before `dev` moves. `dev` then advances by non-force fast-forward to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance. Production promotion must proceed by pull request into protected `main`, satisfy `rd main protection` including `source checks`, and then receive exact-SHA Production deployment/runtime/business acceptance on the resulting `main` head. Missing required checks or exact Production runtime/deployment identity are blockers rather than permission to infer success.

## Next release

**Build 403 — Customer Retention, Rebooking, Service Guidance & SEO Growth** is next only after the current release is fully accepted on protected `main` and exact Production evidence is GREEN.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested candidate through a non-force fast-forward to Development, respect protected-main pull-request requirements, and treat the resulting `main` head as the exact Production identity to be independently accepted. Database migrations remain separate acceptance boundaries.
