# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The durable numbered sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and the approved continuation `FORWARD_BUILD_ROADMAP_378_385.md`.

## Accepted checkpoint

**Build 383 — Mobile Detailer Field Workflow Hardening** is the accepted synchronized source and Production deployment boundary before the current release begins. Its field evidence gates, server-authoritative readiness, bounded staff permissions and exact-SHA Production authority remain retained release protections.

## Current release

**Build 384 — Finance Cockpit & Month-End UX** is the active bounded release.

Current scope:

- converge the existing invoice, payment-reconciliation and month-end Finance authorities into one operator-facing Finance cockpit instead of creating a second ledger or parallel payment record;
- present the financial workflow from quote/commercial terms through deposit evidence, approved changes/final balance, refunds/tips, settlement reconciliation, HST support, month-end close and accountant handoff;
- keep the Finance module lazy: opening the cockpit performs authentication/module checks only and does not load accounting datasets automatically;
- load the retained read-only month-end closure snapshot only after an explicit operator action for a selected month/year;
- display genuine booking-finance, provider-payment, bank-reconciliation, HST, receivables, payables and checklist evidence without fabricating provider/accounting state;
- fail closed as review-required whenever required evidence is missing, unavailable or unresolved;
- preserve existing explicit posting, reconciliation, close, remittance and provider/payment workflows as the only mutation authorities;
- never auto-post accounting entries, auto-close a month, mutate a booking, charge/refund a customer, or mutate payment-provider state from the cockpit;
- preserve operator approval even when the computed state is `close_ready_candidate`;
- keep the current release schema-neutral: no database migration is part of this release.

The exact candidate SHA must pass the focused Finance cockpit authority and retained source/feature gates before Development promotion. Development must pass retained runtime/deployment gates on the same SHA before `main` may move. Production promotion remains a non-force fast-forward of that exact Development-GREEN SHA and is complete only after exact-SHA Production deployment/runtime authority passes.

## Next release

**Build 385 — Backup, Restore & Release Recovery Drill** is next after the current release. Its durable scope remains preserved in `FORWARD_BUILD_ROADMAP_378_385.md`.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested SHA through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. Missing exact Production runtime/deployment identity is a blocker rather than permission to infer success.