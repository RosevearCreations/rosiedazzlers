# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; prior phases remain historical context only.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding historical release identities in living prose.

## Current release

**Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance** is the active bounded release.

Current scope:

- preserve existing `booking_finance_*` events as the deposit, final-balance and refund authority;
- preserve posted accounting journals/reports as the accounting and HST authority rather than creating a second ledger;
- preserve saved cash reconciliation as the bank-reconciliation authority and require closed/zero-difference evidence for close readiness;
- preserve the existing month-end checklist and Build 375 closure surface as the month-end authority;
- identify provider fees only from explicit posted fee/processing/merchant/Stripe/PayPal accounting accounts; paid provider activity without explicit posted fee evidence fails closed to `review` instead of estimating fees;
- expose deterministic `ready`, `review`, or `unavailable` acceptance for deposit, final balance, refund, provider fees, HST, reconciliation, month-end and accountant export;
- preserve the existing CSV exports and accountant package as the export authorities, with manual accountant/operator review retained;
- keep the Build 394 acceptance endpoint staff-authorized and read-only;
- remain schema-neutral and avoid database migration, accounting posting, period-close mutation, customer charging/refunding, Stripe/PayPal/provider mutation, Production business-data mutation or R2 mutation.

The candidate must pass the focused **Finance Close, Reconciliation & Accountant Export Acceptance Authority**, Current Source Gate and feature-preview acceptance before `dev` moves. `dev` then advances by **non-force fast-forward** to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance. Production promotion must proceed by pull request into protected `main`, satisfy `rd main protection` including `source checks`, and then receive exact-SHA Production deployment/runtime/business acceptance on the resulting `main` head. Missing required checks or exact Production runtime/deployment identity are blockers rather than permission to infer success.

## Next release

**Build 395 — Production Business Acceptance & Growth Readiness** is next only after the current release is fully accepted on protected `main` and exact Production evidence is GREEN.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested candidate through a non-force fast-forward to Development, respect protected-main pull-request requirements, and treat the resulting `main` head as the exact Production identity to be independently accepted. Database migrations remain separate acceptance boundaries.
