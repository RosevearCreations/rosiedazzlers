# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; prior phases remain historical context only.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding historical release identities in living prose.

## Current release

**Build 390 — Booking, Quote & Condition-Based Estimate Hardening** is the active bounded release.

Current scope:

- preserve current catalog pricing and package/add-on compatibility as server-authoritative commercial inputs;
- distinguish a fixed catalog quote from condition-sensitive inspection-led estimate work instead of presenting both as equally bookable prices;
- keep quote acceptance separate from slot availability, slot holding, deposit/payment evidence and final booking confirmation;
- mark a successful availability check as available-but-unheld rather than implying an appointment exists;
- carry explicit inspection/revised-quote next steps for condition-sensitive add-ons that cannot be safely auto-priced;
- expose deposit state and booking-confirmation evidence separately so paid or returned payment flows do not silently become confirmed appointments;
- retain existing provider and booking confirmation authorities rather than weakening Stripe/PayPal settlement or server-side confirmation rules;
- remain schema-neutral and avoid database migration, R2 mutation, DNS/secrets changes, customer charging/refunding, provider mutation or Production business-data mutation.

The candidate must pass the focused Booking Quote Estimate Hardening Authority, Current Source Gate and feature-preview acceptance before `dev` moves. `dev` then advances by **non-force fast-forward** to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance. Production promotion must proceed by pull request into protected `main`, satisfy `rd main protection` including `source checks`, and then receive exact-SHA Production deployment/runtime/business acceptance on the resulting `main` head.

## Next release

**Build 391 — Photo Studio & R2 Media Reliability** is next only after current-release acceptance is complete. It will converge assignment visibility, before/after sets, multi-placement, unassign/reset and delete-unassigned safeguards while bounding R2 synchronization and keeping private DAIP media isolated.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested candidate through a non-force fast-forward to Development, respect protected-main pull-request requirements, and treat the resulting `main` head as the exact Production identity to be independently accepted. Database migrations remain separate acceptance boundaries. Missing required checks or exact Production runtime/deployment identity are blockers rather than permission to infer success.
