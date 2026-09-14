# Rosie Dazzlers — Forward Build Roadmap 396–405

**Planning boundary:** Build 395 is the accepted whole-platform Production/growth-readiness boundary. Build 396 renews the living release authority from genuine observed evidence and establishes the next bounded sequence. Exact source/deployment identities remain resolved from live Git refs and exact-SHA workflow evidence rather than pinned into living prose.

## Sequence

### Build 396 — Growth Baseline & Forward Roadmap Renewal
Establish a privacy-respecting growth measurement baseline from existing first-party acquisition, conversion, booking, retention and commercial evidence. Record measurement capability and evidence state without fabricating live KPI values, exposing raw visitor/customer identifiers, or treating unavailable evidence as zero. Renew the living queue, handoff, README and release-convergence guard onto this 396–405 sequence. Remain schema-neutral, read-only and mutation-free.

### Build 397 — Growth Measurement Surface & Instrumentation Coverage
Create one bounded Admin growth measurement surface that composes existing aggregate authorities, identifies missing event coverage, reports truncation/evidence-unavailable states explicitly and avoids cross-layer identity joins. No persistent customer scoring or background polling.

### Build 398 — Acquisition & Source Quality Baseline
Measure truthful first-party acquisition/source evidence by landing page, source/campaign and device class using aggregate/suppressed reporting only. Distinguish direct/unknown traffic from genuinely attributed traffic and keep search ranking/advertising claims external-evidence gated.

### Build 399 — Booking Funnel & Conversion Baseline
Converge anonymous discovery → booking-start → booking completion evidence with the existing server-authoritative booking funnel. Report denominator coverage, row limits and incomplete telemetry rather than overstating conversion performance.

### Build 400 — Retention & Repeat-Service Baseline
Measure repeat-service and rebooking signals only from exact customer-profile booking history and explicit maintenance/customer planning evidence. Preserve consent boundaries, prohibit fuzzy/email identity merging and avoid persistent customer scores.

### Build 401 — Commercial Outcome & Margin Evidence
Compose booked/completed service value, recorded provider/payment evidence, job-cost evidence and Finance close/reconciliation authority into an aggregate commercial outcome view. Missing fee, tax, material-cost or reconciliation evidence remains review/unavailable rather than estimated.

### Build 402 — Growth Experiment Framework
Add a bounded experiment register for approved copy/offer/channel tests with explicit hypotheses, start/stop windows, measurement definitions and rollback criteria. Do not silently alter pricing, discounts, booking rules, consent, provider configuration or public claims.

### Build 403 — SEO & Content Growth Optimization
Use observed landing/funnel evidence to prioritize service/town content improvements while preserving one meaningful H1, unique metadata/canonical/structured data, truthful Oxford/Norfolk service-area claims and genuine review/media proof.

### Build 404 — Growth Operations & Reliability Hardening
Harden growth reporting for bounded queries, row-limit disclosure, small-cell privacy suppression, stale-data warnings, analytics ingest failure-open behavior, admin authorization, observability and no permanent polling.

### Build 405 — Production Growth Acceptance & Roadmap Renewal
Run end-to-end Production growth acceptance across aggregate acquisition, funnel, retention, commercial outcome, experiment governance, SEO/content and reliability evidence. Require exact protected-main Production deployment/runtime proof, then renew the next roadmap from measured evidence rather than assumptions.

## Baseline evidence rules

- Genuine observed evidence only; missing data is `unavailable` or `insufficient`, never zero by assumption.
- Growth reporting is aggregate-first. Do not expose IP addresses, User-Agent strings, visitor/session IDs, raw postal codes, customer emails or other unnecessary identifiers.
- Anonymous acquisition/session evidence and exact customer-profile history remain separate layers; no fuzzy or cross-layer identity join is authorized.
- Any denominator affected by disabled telemetry, failed storage, row limits or truncation must disclose that limitation.
- Provider/payment, tax, accounting, inventory/job-cost, consent, review and media evidence remains owned by its existing server-authoritative source.
- No persistent customer growth score, automatic outreach, automatic booking/payment action or permanent polling is introduced by this sequence unless a later bounded release explicitly authorizes it.

## Continuing release rules

- One bounded authority improvement per build.
- Start from the latest accepted `dev` boundary and latest accepted protected `main` Production boundary.
- Feature candidates must pass their focused authority, Current Source Gate and feature-preview acceptance before `dev` moves.
- Exact Development SHA must be GREEN before Production promotion.
- Advance `dev` only by non-force fast-forward to the accepted candidate SHA.
- Promote Development-GREEN source to `main` through the active `rd main protection` pull-request path; never weaken protection merely to make promotion pass.
- Prefer a merge commit so the accepted Development candidate remains explicit in Production ancestry.
- After merge, the resulting `main` head is the exact Production SHA and must receive independent Cloudflare deployment/runtime/business acceptance.
- Database migrations remain explicit acceptance boundaries, never incidental runtime side effects.
- Preserve customer/staff privacy, server-authoritative permissions and genuine provider/payment/consent/review/accounting/tax evidence.
- Preserve one meaningful H1 per indexable public page and truthful local/service content.
- Keep dormant modules event-driven and avoid permanent polling without demonstrated operational need.
- Never fabricate deployment, analytics, SEO-verification, provider or business evidence.
