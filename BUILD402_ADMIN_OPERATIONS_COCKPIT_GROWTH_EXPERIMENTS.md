# Build 402 — Admin & Operations Cockpit QoL + Growth Experiment Framework

Build 402 is a bounded source-only release. It reduces owner/admin screen switching while defining an evidence-only framework for future growth experiments. It does **not** create new booking, payment, accounting, inventory, consent, outreach or customer-state authority.

## Operations cockpit

`admin-today.html` remains backed by the existing `/api/admin/today_needs_attention_report` and explicit `/api/admin/attention_task_action` owner-task workflow.

The cockpit now:

- separates urgent/high exceptions from normal/low due work;
- keeps manual refresh and truthful loading/error/empty states;
- provides responsive drill-downs to existing Bookings, Operations, Growth and Admin surfaces;
- preserves the existing explicit owner task controls instead of creating hidden automation;
- treats missing source evidence as unavailable/review-required rather than zero or inferred;
- creates no permanent polling or background timer.

The cockpit may surface bookings, arrivals, active jobs, exceptions, incomplete evidence, deposit/payment concerns, inventory shortages, callbacks/reschedules and close-ready work only when existing authoritative sources report those facts. Navigation does not transfer authority from the destination workstream into the cockpit.

## Growth experiment framework

`data/growth_experiment_framework.json` defines five bounded experiment families:

1. Booking abandonment.
2. Reminder timing.
3. Rebooking.
4. Referral.
5. Review request timing.

These are planning/evidence definitions only. They do not execute experiments and do not authorize automatic customer contact or state changes.

Every experiment remains fail-closed around genuine observed evidence. The framework cannot silently change pricing, package/add-on scope, booking/deposit/payment rules, availability, consent, review eligibility, public claims, customer identity, accounting, inventory, provider state or schema.

No customer score, fuzzy anonymous-to-customer join, fabricated attribution, incentivized review, automatic booking or automatic outreach is introduced.

## Responsive and reliability contract

- Phone, tablet/small laptop and desktop remain required acceptance sizes for materially changed surfaces.
- Touch targets and drill-down actions remain usable without horizontal overflow.
- Urgent work remains visually distinct from normal work.
- Refresh is explicit and manual; no `setInterval` or permanent polling is authorized.
- Existing destination modules continue to own their mutations and validation.

## Release boundary

This build is schema-neutral and source-only. It performs no database migration, Production business-data mutation, destructive R2 mutation, DNS/secret mutation, booking/payment/provider mutation, customer charge/refund, accounting posting, inventory posting or customer mutation.

The candidate must pass the focused **Admin & Operations Cockpit + Growth Experiment Authority**, retained Build 401 authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. `dev` advances only by non-force fast-forward to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance.

Production promotion must proceed by pull request into protected `main`, satisfy active `rd main protection` including required `source checks`, and then receive independent exact-SHA Production deployment/runtime/business acceptance on the resulting `main` head. Missing required checks, deployment identity, Functions metadata or runtime smoke are blockers rather than permission to infer success.
