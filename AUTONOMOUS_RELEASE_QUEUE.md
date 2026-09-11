# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The durable numbered sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and the approved continuation `FORWARD_BUILD_ROADMAP_378_385.md`.

## Accepted checkpoint

**Build 381 — Operations Daily Command Centre** is the accepted synchronized source and Production deployment boundary before the current release begins. Its protected daily Operations aggregation, fail-closed evidence treatment and durable exact-SHA Production authority remain retained release protections.

## Current release

**Build 382 — Customer Account & Retention UX Convergence** is the active bounded release.

Current scope:

- converge My Account around existing authenticated customer, booking and saved-vehicle authorities rather than creating a second customer ledger;
- retain completed-service history and verified per-vehicle timelines as the service-history authority already presented in My Account;
- present customer-owned quote/proposal status from the existing quote authority without exposing response tokens, hashes or staff-private fields;
- present maintenance-interest state truthfully as interest rather than automatic enrollment, appointment, subscription, fixed cadence or recurring billing;
- summarize the customer's existing communication preferences/consent without inventing consent evidence;
- report genuine review/request lifecycle state from existing review evidence and review-request authority without independently deciding eligibility or creating a request;
- provide a safe book/rebook handoff that reconfirms current availability, scope and pricing;
- keep the release schema-neutral, read-only with respect to retention lifecycles, event-driven and free of duplicate ledgers.

The exact candidate SHA must pass the focused customer account/retention authority and retained source/feature gates before Development promotion. Development must pass retained runtime gates on the same SHA before `main` may move. Production promotion remains a non-force fast-forward of that exact Development-GREEN SHA and is complete only after exact-SHA Production deployment/runtime authority passes.

## Next release

**Build 383 — Mobile Detailer Field Workflow Hardening** is next after the current release. Its durable scope and the subsequent approved sequence are preserved in `FORWARD_BUILD_ROADMAP_378_385.md`.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested SHA through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. Missing exact Production runtime/deployment identity is a blocker rather than permission to infer success.
