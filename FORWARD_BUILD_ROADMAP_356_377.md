# Rosie Dazzlers — Forward Build Roadmap 356–377

**Planning baseline:** Production-GREEN Build 355 at `0df31eacb53ac76e98f4cce07989285b309ef8c8`.

This is a durable forward plan, not a statement that the listed work is already implemented. The current operational handoff and execution queue remain `AI_PROJECT_HANDOFF.md` and `AUTONOMOUS_RELEASE_QUEUE.md`.

## Sequence

### Build 356 — Safe Rebook From Service History
Add a customer-facing **Book this service again** action to canonical completed-service history. Reuse the existing authenticated rebook verification authority. Carry only historical package/date evidence; never carry stale price, appointment time, payment/deposit state, customer identity snapshots, add-ons or booking state.

### Build 357 — Rebook Catalog & Pricing Revalidation
Require every rebook to resolve the requested service against the current catalog and current booking rules before continuation. Current vehicle sizing, availability, add-ons, price and deposit remain authoritative.

### Build 358 — Per-Vehicle Service Timeline
Present completed services by canonical saved vehicle, including customer-safe service facts and approved evidence, without creating a second service-history ledger.

### Build 359 — Customer Retention Dashboard
Give Operations a customer-level view of last/first service, repeat-service activity, saved vehicles, open bookings, maintenance/fleet interest and other evidence-backed retention indicators.

### Build 360 — Retention CRM Work Queues
Create event/on-demand operational groups such as first-service complete, repeat customer, dormant customer, unconverted quote, maintenance interest and fleet interest. Do not introduce permanent polling merely because the queues exist.

### Build 361 — Booking & Rebooking Funnel Analytics
Measure service/pricing entry through booking, deposit, completion, history view, rebook and repeat completion using privacy-safe, evidence-backed funnel events.

### Build 362 — Quote-to-Booking Acceptance Hardening
Finish customer quote/proposal acceptance while revalidating price and availability immediately before booking creation. Expired or changed quotes must fail closed rather than silently carrying stale commercial terms.

### Build 363 — Review Request Eligibility Engine
Make genuine completed work eligible for controlled review requests with eligible/requested/completed/declined state. Never fabricate a review or imply delivery evidence that does not exist.

### Build 364 — Customer Communications & Consent Centre
Separate required transactional communication from optional marketing preferences across email, SMS and future notification channels. Real provider delivery remains evidence-gated.

### Build 365 — Review → Proof → Local SEO Loop
Connect genuine approved reviews and privacy-approved before/after evidence to the relevant service, vehicle context and town for credible local proof.

### Build 366 — Intelligent Service Recommendation
Use current vehicle size, condition answers and customer goals to explain which service is likely appropriate without simply pushing the most expensive package.

### Build 367 — Add-On Eligibility & Attach-Rate Optimization
Formalize compatible add-ons, condition-dependent guidance and conversion measurement while keeping current catalog/pricing authority intact.

### Build 368 — Capacity, Calendar & Travel Intelligence
Harden scheduling around the real operating model: one-car-per-day defaults, half-day exceptions, blocked dates, travel context, service duration expectations and collision prevention.

### Build 369 — Mobile Job Readiness & Site-Condition Workflow
Confirm safe/private/permitted work area, access, keys, weather/site concerns and special notes before the appointment. Rosie continues to supply normal detailing water/power under the current business rule while the customer supplies an appropriate work area.

### Build 370 — Maintenance Plan Business Rulebook
Create configurable authority for eligible services, cadence, price, inclusions, exclusions, cancellation and priority rules. Do not invent maintenance economics.

### Build 371 — Maintenance Plan Pilot Activation
After explicit business-rule approval, turn maintenance interest into real vehicle-specific plan enrollment and coordination. Keep recurring-payment automation separately evidence-gated.

### Build 372 — Fleet Business Rulebook
Create configurable authority for fleet minimums, service tiers, travel limits, volume pricing, invoicing and cancellation terms. Do not invent fleet economics.

### Build 373 — Fleet Account Operations
Advance the existing fleet pipeline into business contacts, vehicle rosters, per-vehicle service history, grouped requests/jobs, PO/reference support and invoice grouping.

### Build 374 — Final Balance Invoice & Payment Convergence
Reconcile quote, deposit, approved changes/add-ons, final amount, tips/refunds where applicable and remaining balance into one customer-visible financial record using existing Finance authority.

### Build 375 — Payment Reconciliation & Month-End Closure
Converge deposits, balances, refunds, provider fees/settlements, HST support and accountant exports into a controlled reconciliation and close workflow.

### Build 376 — Performance, Accessibility & Security Hardening
Run a whole-application pass for mobile performance, payload/image efficiency, accessibility, authentication/session boundaries, customer isolation, admin authorization, API abuse resistance and recovery while retaining public SEO rules.

### Build 377 — Production Business Acceptance / Launch Readiness
Prove the end-to-end business path from anonymous acquisition through booking, payment, customer account, vehicle, staff work, completion, proof, final finance, genuine review, rebook and maintenance/fleet paths, including rollback and exact-SHA Production evidence.

## Cross-build rules

- One bounded authority improvement per build.
- Exact Development SHA must be GREEN before Production promotion.
- Promote the same proven SHA to `main`; do not rebuild or cherry-pick a different release artifact.
- Database migrations are explicit acceptance boundaries, never incidental side effects.
- Preserve customer/staff privacy and server-authoritative permissions.
- Never fabricate provider, payment, consent, review, SEO-verification, accounting or tax evidence.
- Keep dormant modules event-driven; do not add background polling without a real operational need.
- Preserve one meaningful H1 per indexable public page.
- Historical service/quote data may provide context, but current catalog, pricing, availability, payment and booking rules remain authoritative.
