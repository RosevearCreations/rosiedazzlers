# Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence

## Purpose

Build 401 converges field-to-office interpretation into one responsive Operations workstream without creating another booking, payment, accounting, inventory, customer, or job-state ledger. The canonical Detailer workflow and its server-authoritative field evidence remain unchanged; Operations receives a bounded read-only composition of that evidence.

## Handoff contract

The Operations **Field → office handoff** workstream is manual/event-driven. Opening Operations still loads no dataset. Selecting Handoff performs one bounded read; refresh is explicit and no polling interval is created.

The handoff may display genuine facts from `bookings`, `job_updates`, `job_media`, `job_signoffs` and `job_time_entries`: booking/job state, before/after evidence, field checklist evidence, approved-add-on record presence, product/material-use record presence, completion evidence, final authorization evidence, pending review/customer-action counts and recorded time. Free-form Detailer notes improve communication but never become payment, pricing, add-on approval, accounting, inventory or customer-consent authority.

The existing Build 383 field gates remain the canonical evidence-creation path. Build 401 does not create a second complete/start/approve/pay path.

## Commercial evidence contract

Commercial outcome evidence is evidence-first and read-only. Exact `*_cents` fields already present on authoritative booking records may be observed with their source field named. Job-cost/margin evidence is available only when the authoritative `job_costs` source and compatible cents fields are present. Missing ticket, fee, tax, cost, payment, balance or reconciliation evidence remains `unavailable`; it is never converted to zero or estimated.

Build 401 deliberately refuses to derive add-on attachment from Detailer free-form notes. If no separate authoritative add-on ledger is available to this bounded endpoint, add-on attachment remains unavailable. Negative/no-result states remain visible.

The endpoint never infers busy time, payouts, hidden debt, customer value, future revenue, lifetime value or customer scores. It does not forecast, rank customers, trigger outreach, create bookings, mark payments, close accounting, post inventory, or mutate providers.

## Responsive and operational behavior

The Operations workstream retains the shared responsive shell, 50px-class touch targets, phone card layout, clear loading/error/empty states, manual refresh and sleep/suspend behavior. A failed read does not auto-retry and is not described as persisted success.

## Mutation and release boundary

This release is schema-neutral and source-only. It authorizes no database migration, Production business-data mutation, booking/payment/provider mutation, accounting posting, inventory posting, customer mutation, destructive R2 mutation, DNS/secret mutation or permanent polling.

Acceptance requires the focused Build 401 authority, retained authorities, Current Source Gate and exact feature-preview proof before `dev` moves. Development must accept the identical SHA. Production promotion remains protected-main pull-request only, followed by independent exact resulting `main` Cloudflare deployment/runtime/business acceptance.
