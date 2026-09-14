# Production Business Acceptance

## Purpose

This document is the durable acceptance contract for Production launch and growth readiness. It proves that the existing Rosie Dazzlers business authorities join into one coherent path without inventing customer, payment, consent, review, accounting, tax, deployment, provider, operational, inventory, media, SEO or observability evidence.

## Acceptance path

| Stage | Required authority | Evidence rule |
| --- | --- | --- |
| Acquisition | SEO metadata, one-H1, local/use-case pages and contextual proof | Public discovery surfaces must remain indexable, truthful, unique and linked to current service/booking authority. |
| Commercial + local proof | Current package/add-on commercial accuracy, service landing pages, town coverage and genuine proof | Pricing/scope language must reflect current business rules; inspection-dependent work must not be presented as falsely fixed and local proof must remain genuine. |
| Booking | Booking funnel/device, responsive wizard, capacity/availability and quote-to-booking acceptance | A booking must remain server-authoritative and fail closed on unavailable capacity. |
| Condition-aware quote + media | Condition-based estimate escalation plus public/admin media assignment and R2 reliability | Condition-sensitive work must preserve inspection/approval boundaries; media must preserve provenance, assignment and privacy rather than manufacturing proof. |
| Payment | Provider readiness, acceptance evidence, recovery handoff and reconciliation | A provider result is evidence only when the server/provider authority proves it; source tests must never manufacture a payment. |
| Customer + vehicle | Checkout identity and authenticated account/service-history boundaries | Customer/vehicle identity must remain isolated to the authenticated owner or permitted staff role. |
| Staff work | Mobile job readiness and staff permission boundaries | Staff workflows must expose only permitted jobs/actions and remain usable on field/mobile surfaces. |
| Operations + job cost | Recorded inventory movement, depletion/reversal, reorder/substitution provenance and recorded-cost projection | Existing inventory movement/item/purchase-order authorities remain canonical; missing or incomplete evidence must fail closed rather than creating a second ledger. |
| Completion + proof | Booking completion/retention and contextual/publication proof | Completion and media proof must remain explicit, consent-aware, and never manufacture customer evidence. |
| Final finance | Final-balance readiness, recorded provider-fee evidence, reconciliation, HST, month-end closure and accountant export | Finance remains server-authoritative, evidence-driven and fail-closed when records disagree or evidence is missing. |
| Genuine review | Review eligibility, dispatch and local-proof authority | Review requests are allowed only from real eligible service outcomes; no synthetic reviews or proof. |
| Rebook + retention | Booking/rebooking funnel and maintenance retention | Rebook starts from prior context but revalidates current pricing, availability and service rules. |
| Maintenance + fleet | Maintenance rulebook/pilot plus fleet rulebook, account operations and planning | Recurring/fleet work remains explicit, capacity-aware and separately authorized. |
| Admin/I.T. + observability | I.T. readiness/release control and Production observability/self-diagnostics | Missing diagnostics, release identity or observable readiness remains a blocker; source acceptance must not claim live evidence it did not observe. |
| Recovery | Rollback/recovery, performance, accessibility, security and repository hygiene | Recovery evidence is read-only; Development repair remains manual and Production mutation remains forbidden. |
| Growth readiness | Whole-platform retained authority convergence | Growth readiness means the software authorities coherently support acquisition through retention and operations; it does not mean real-world demand, conversion, revenue or provider evidence was synthesized. |
| Production release | Cloudflare Production exact-SHA acceptance | The exact resulting `main` SHA must appear as a successful Cloudflare `production` deployment with Functions enabled, then pass immutable and canonical runtime smoke. |

## Release rules

- The feature candidate must pass its focused authority, the Current Source Gate and feature-preview acceptance before Development promotion.
- `dev` advances only by non-force fast-forward to the exact accepted candidate SHA and must then prove that SHA through retained Development source/runtime gates.
- Production promotion must use a pull request into protected `main` and satisfy the active required checks without bypass. A merge commit is preferred so the accepted Development SHA remains explicit in Production ancestry.
- After merge, the resulting `main` head becomes the exact Production source SHA and must receive independent Production deployment/runtime/business acceptance.
- Production acceptance is observation-only. It may read Cloudflare deployment metadata and smoke deployed HTTP surfaces, but it may not deploy, retry, delete, roll back, or mutate provider/business data.
- Missing Production identity, missing Functions metadata, mismatched branch/SHA, failed runtime smoke, incomplete retained business authority, or failed diagnostics is a blocker rather than an inferred success.
- Database migrations are outside this build and require their own explicit migration boundary.

## What this acceptance does not claim

Passing this authority does not fabricate a real customer journey, a real card charge, a real PayPal transaction, a real review, a real month-end close, real inventory consumption, real media consent, real search-engine ranking, real conversion, real revenue, or real operator/provider diagnostics. It proves that the production software, source contracts, deployment identity and fail-closed business authorities required to safely support and observe those real events are present and coherent.
