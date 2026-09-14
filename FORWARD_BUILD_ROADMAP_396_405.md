# Rosie Dazzlers — Forward Build Roadmap 396–405

**Planning boundary:** Build 395 is the accepted whole-platform Production/growth-readiness boundary. Build 396 renews the living release authority from genuine observed evidence and establishes the next bounded sequence. Exact source/deployment identities remain resolved from live Git refs and exact-SHA workflow evidence rather than pinned into living prose.

## Product-direction rule for Builds 397–405

Builds 397–405 must improve the application for the people actually using it while preserving the growth/evidence authorities established by Build 396. Quality of life, customer interaction, detailer interaction, admin/operations interaction, and responsive behavior are first-class acceptance requirements rather than deferred polish.

Every new or materially changed surface must be designed and accepted across:

- phone/mobile layouts first, including one-thumb/touch use where appropriate;
- tablet and small-laptop layouts;
- normal desktop/PC layouts;
- the public website and customer booking/self-service experience;
- the Detailer mobile workflow;
- Operations/Supervisor workflows; and
- Business Administration workflows.

A build is not complete merely because the desktop path works. Material horizontal scrolling, clipped or overlapping controls, unreadable text, off-screen dialogs, inaccessible actions, tiny touch targets, broken responsive tables, lost form state, or desktop-only navigation are release defects for any changed surface.

## Sequence

### Build 396 — Growth Baseline & Forward Roadmap Renewal
Establish a privacy-respecting growth measurement baseline from existing first-party acquisition, conversion, booking, retention and commercial evidence. Record measurement capability and evidence state without fabricating live KPI values, exposing raw visitor/customer identifiers, or treating unavailable evidence as zero. Renew the living queue, handoff, README and release-convergence guard onto this 396–405 sequence. Remain schema-neutral, read-only and mutation-free.

### Build 397 — Responsive UX & Growth Measurement Foundation
Create the bounded Admin growth measurement surface from existing aggregate authorities while beginning the whole-platform responsive quality-of-life baseline. Identify missing event coverage, truncation and evidence-unavailable states explicitly, and audit the principal public/customer, Detailer, Operations and Admin surfaces for phone, tablet/small-laptop and desktop behavior. Correct material overflow, clipped controls, unreadable cards, modal/dialog sizing, touch-target, navigation and responsive-table defects encountered within the bounded scope. No persistent customer scoring, cross-layer identity joins or background polling.

### Build 398 — Customer Journey, Booking QoL & Acquisition Quality
Improve the customer path from landing page through booking while measuring truthful first-party acquisition/source evidence by landing page, source/campaign and device class using aggregate/suppressed reporting only. Make vehicle size, package selection, add-ons, inclusions, price context, unavailable dates, deposits and next-step messaging easier to understand on a phone as well as desktop. Preserve partially entered state where safely supported and distinguish direct/unknown traffic from genuinely attributed traffic. Search-ranking and advertising claims remain external-evidence gated.

### Build 399 — Customer Communication, Self-Service & Booking Funnel
Improve booking confirmation, preparation guidance, appointment/status visibility, reschedule/cancellation guidance, completion/aftercare, review and rebooking pathways while converging anonymous discovery → booking-start → booking-completion evidence with the existing server-authoritative booking funnel. Customer communications must remain permission-aware and must not become automatic spam. Report denominator coverage, row limits and incomplete telemetry rather than overstating conversion performance. All customer-facing communication/self-service surfaces must be responsive and phone-usable.

### Build 400 — Detailer Mobile App QoL & Retention Evidence
Make the field workflow genuinely mobile-first: large touch targets, clear job start/pause/complete actions, one-thumb navigation, rapid condition notes, before/after photo capture into the correct evidence category, checklist progress, timers, material/product usage shortcuts, add-on recommendation capture and clear next-action guidance. Minimize typing where a safe preset, tap, checkbox, photo or concise note can do the job. In parallel, retain repeat-service/rebooking measurement only from exact customer-profile booking history and explicit maintenance/customer planning evidence. Preserve consent boundaries, prohibit fuzzy/email identity merging and avoid persistent customer scores.

### Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence
Improve the handoff between field work and office operations. Admin/Operations should be able to understand what the detailer found, what changed from the original booking, added work requested, customer approvals/evidence, photos, time spent, materials used, unresolved issues and closeout readiness without hunting through unrelated screens. Detailers should see the information necessary to perform the job safely and efficiently without unnecessary accounting/admin clutter. Compose booked/completed service value, provider/payment evidence, job-cost evidence and Finance close/reconciliation authority into aggregate commercial outcome evidence. Missing fee, tax, material-cost or reconciliation evidence remains review/unavailable rather than estimated.

### Build 402 — Admin & Operations Cockpit QoL + Growth Experiment Framework
Reduce administrative clicking, hunting and screen switching. Establish a responsive Today/Operations view for bookings, arrivals, active jobs, exceptions, incomplete evidence, deposit/payment issues, inventory shortages, callbacks/reschedules and jobs ready to close. Improve search, filters, saved views where justified, breadcrumbs/back-navigation, consistent actions, bulk actions and mobile card alternatives for wide tables. Add a bounded experiment register for approved copy/offer/channel tests with explicit hypotheses, windows, measurement definitions and rollback criteria. Do not silently alter pricing, discounts, booking rules, consent, provider configuration or public claims.

### Build 403 — Customer Retention, Rebooking, Service Guidance & SEO Growth
Use exact service history and approved customer evidence to make repeat interaction more useful: last service, maintenance interval, coating/maintenance status, prior approved/declined work where appropriate, vehicle-specific service history and sensible rebooking/service guidance. Recommendations must be explainable from genuine evidence and remain consent-aware. Use observed landing/funnel evidence to prioritize service/town content improvements while preserving one meaningful H1, unique metadata/canonical/structured data, truthful Oxford/Norfolk service-area claims and genuine review/media proof. Customer and public surfaces must remain phone-first and responsive.

### Build 404 — Error Recovery, Weak-Connection UX & Reliability Hardening
Harden customer, field and admin interaction against real-world failures. Preserve drafts where appropriate, prevent duplicate submissions, make save/upload state visible, provide safe retry/recovery behavior, surface failed photo/evidence uploads, protect unsaved work during navigation and replace opaque 500/503-style experiences with actionable states where safe. Support weak/intermittent field connectivity without fabricating persistence or success. Harden growth reporting for bounded queries, row-limit disclosure, small-cell privacy suppression, stale-data warnings, analytics-ingest failure-open behavior, admin authorization, observability and no permanent polling.

### Build 405 — Full Responsive Production Acceptance & Roadmap Renewal
Run end-to-end Production acceptance across the complete human workflow: visitor → responsive public page → booking → confirmation/self-service → admin scheduling → detailer mobile job → photos/evidence → changed scope/customer approval → completion → payment/accounting evidence → aftercare/review/rebooking. Include aggregate acquisition, funnel, retention, commercial outcome, experiment governance, SEO/content and reliability evidence. Require acceptance at representative phone, tablet/small-laptop and desktop widths; material pinch-zoom dependence, horizontal scrolling, hidden actions, overlapping text, clipped dialogs or desktop-only navigation fail the changed workflow. Require exact protected-main Production deployment/runtime proof, then renew the next roadmap from measured evidence and observed user/operational friction rather than assumptions.

## Cross-build quality-of-life requirements

Starting with Build 397, each bounded build should improve or preserve the following wherever its changed surfaces are involved:

- consistent navigation and terminology across Customer, Detailer, Operations and Admin modules;
- clear loading, saving, saved, success, warning and error states;
- autosave/draft indication where autosave exists, without claiming persistence before the server confirms it;
- large, accessible touch targets and readable text on phones;
- dialogs, drawers and menus that remain usable inside the viewport;
- responsive tables that reflow, prioritize columns or become cards instead of forcing unusable horizontal layouts;
- preservation of user context and safe unsaved-work handling during navigation;
- search/filter capability for large operational datasets where it materially reduces work;
- meaningful empty states and clear next actions;
- camera/photo workflows optimized for field use where photographic evidence is required;
- confirmation for destructive actions, with undo/recovery where practical and safe; and
- accessibility, contrast and keyboard/touch usability appropriate to the surface.

## Baseline evidence rules

- Genuine observed evidence only; missing data is `unavailable` or `insufficient`, never zero by assumption.
- Growth reporting is aggregate-first. Do not expose IP addresses, User-Agent strings, visitor/session IDs, raw postal codes, customer emails or other unnecessary identifiers.
- Anonymous acquisition/session evidence and exact customer-profile history remain separate layers; no fuzzy or cross-layer identity join is authorized.
- Any denominator affected by disabled telemetry, failed storage, row limits or truncation must disclose that limitation.
- Provider/payment, tax, accounting, inventory/job-cost, consent, review and media evidence remains owned by its existing server-authoritative source.
- No persistent customer growth score, automatic outreach, automatic booking/payment action or permanent polling is introduced by this sequence unless a later bounded release explicitly authorizes it.

## Continuing release rules

- One bounded authority improvement per build.
- Responsive acceptance is part of the bounded feature acceptance for every new or materially changed UI; it is not deferred to a later cleanup release.
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
