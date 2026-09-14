# Build 396 — Growth Baseline & Forward Roadmap Renewal

Build 396 establishes the **measurement baseline**, not a fabricated performance report. Live growth values are valid only when generated from genuine observed evidence at runtime. Source control records which evidence is authoritative, how it may be aggregated, and when the result must fail closed to `unavailable` or `insufficient`.

## Baseline measurement authority

| Growth area | Existing evidence authority | Build 396 baseline state |
| --- | --- | --- |
| Acquisition | `site_activity_events` written by the bounded public analytics ingest path | Evidence-capable. Aggregate only; telemetry-disabled/storage-failure/truncation states must be disclosed. |
| Conversion | Existing booking/rebooking funnel analytics over anonymous site sessions | Evidence-capable. No visitor-to-customer identity join; incomplete telemetry cannot be treated as a complete denominator. |
| Booking | Existing server-authoritative `bookings` evidence and booking funnel authorities | Evidence-capable. Booking status/completion remains canonical; source checks do not synthesize bookings. |
| Retention | Exact `customer_profile_id` booking history plus existing customer retention/rebooking authorities | Evidence-capable. Exact profile linkage only; no fuzzy/email identity merge and no inferred consent. |
| Commercial | Existing booking-finance/payment, operations/job-cost and Finance close/reconciliation/export authorities | Evidence-capable with fail-closed gaps. Missing provider fee, HST, job-cost or reconciliation evidence remains `review`/`unavailable`. |

## Privacy and evidence boundary

Growth reporting must be aggregate-first. It must not expose IP addresses, User-Agent strings, visitor IDs, session IDs, raw postal codes, customer emails, customer names or other unnecessary identifiers. Small or identifying slices should be suppressed rather than surfaced merely because the raw event source contains them.

Anonymous acquisition/session evidence remains separate from exact customer-profile history. Build 396 does **not** authorize fuzzy identity resolution, email-based merging, device fingerprinting, persistent customer scoring, inferred outreach consent or any anonymous-session → customer identity join.

A missing observation is not a zero. If telemetry is disabled, analytics storage is unavailable, a query reaches a row limit, required finance/job-cost evidence is absent, or the observation window is incomplete, the result must be marked `unavailable`, `insufficient`, `review`, or explicitly truncated according to the owning authority.

## Baseline output rule

No live KPI number is embedded in this source document because that would become stale immediately and could be mistaken for current business truth. Build 396 instead fixes the canonical measurement sources and evidence states. Runtime/admin surfaces may display current aggregates only when they are derived from those sources and carry their observation window, coverage and truncation state.

## Release scope

Build 396 is schema-neutral and read-only. It does not migrate the database, mutate Production business data, change provider/payment state, post accounting entries, close a period, alter inventory, write/delete R2 objects, rotate secrets, mutate DNS or deploy outside the normal release workflow.

The new active roadmap is `FORWARD_BUILD_ROADMAP_396_405.md`. Build 397 is the next bounded release and will create the unified Admin growth measurement surface from this baseline contract.
