# Production Business Acceptance

## Purpose

This document is the durable acceptance contract for the Production launch-readiness pass. It proves that the existing Rosie Dazzlers business authorities join into one coherent path without inventing customer, payment, consent, review, accounting, tax, deployment, or provider evidence.

## Acceptance path

| Stage | Required authority | Evidence rule |
| --- | --- | --- |
| Acquisition | SEO metadata, one-H1, local/use-case pages and contextual proof | Public discovery surfaces must remain indexable, truthful, and linked to current service/booking authority. |
| Booking | Booking funnel/device, responsive wizard, capacity/availability and quote-to-booking acceptance | A booking must remain server-authoritative and fail closed on unavailable capacity. |
| Payment | Provider readiness, acceptance evidence, recovery handoff and reconciliation | A provider result is evidence only when the server/provider authority proves it; source tests must never manufacture a payment. |
| Customer + vehicle | Checkout identity and authenticated account/service-history boundaries | Customer/vehicle identity must remain isolated to the authenticated owner or permitted staff role. |
| Staff work | Mobile job readiness and staff permission boundaries | Staff workflows must expose only permitted jobs/actions and remain usable on field/mobile surfaces. |
| Completion + proof | Booking completion/retention and contextual/publication proof | Completion and media proof must remain explicit, consent-aware, and never manufacture customer evidence. |
| Final finance | Final-balance readiness, reconciliation and month-end closure | Finance remains server-authoritative, evidence-driven and fail-closed when records disagree or evidence is missing. |
| Genuine review | Review eligibility, dispatch and local-proof authority | Review requests are allowed only from real eligible service outcomes; no synthetic reviews or proof. |
| Rebook + retention | Booking/rebooking funnel and maintenance retention | Rebook starts from prior context but revalidates current pricing, availability and service rules. |
| Maintenance + fleet | Maintenance rulebook/pilot plus fleet rulebook, account operations and planning | Recurring/fleet work remains explicit, capacity-aware and separately authorized. |
| Recovery | Rollback/recovery authority | Rollback evidence is read-only; Development repair remains manual and Production mutation remains forbidden. |
| Production release | Cloudflare Production exact-SHA acceptance | The exact `main` SHA must appear as a successful Cloudflare `production` deployment with Functions enabled, then pass immutable and canonical runtime smoke. |

## Release rules

- The feature candidate must pass its focused authority, the Current Source Gate and feature-preview acceptance before Development promotion.
- Development must prove the same exact SHA through the retained source/runtime gates before `main` may move.
- `main` must be a non-force fast-forward to that same exact SHA.
- Production acceptance is observation-only. It may read Cloudflare deployment metadata and smoke deployed HTTP surfaces, but it may not deploy, retry, delete, roll back, or mutate provider/business data.
- Missing Production identity, missing Functions metadata, mismatched branch/SHA, failed runtime smoke, or incomplete business-path authority is a blocker rather than an inferred success.
- Database migrations are outside this build and require their own explicit migration boundary.

## What this acceptance does not claim

Passing this authority does not fabricate a real customer journey, a real card charge, a real PayPal transaction, a real review, or a real month-end close. It proves that the production software, source contracts, deployment identity and fail-closed business authorities required to safely support those real events are present and coherent.
