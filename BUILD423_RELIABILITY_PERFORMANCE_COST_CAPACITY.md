# Build 423 — Reliability, Performance & Cost Capacity

Build 423 adds a bounded operator view for reliability, request pressure and cost-capacity signals using evidence Rosie Dazzlers already owns. It does not claim access to Cloudflare billing, CPU-time or future-capacity measurements that are not directly observed.

## Evidence sources

The staff-only `/api/admin/reliability_performance_cost_capacity` endpoint combines:

- the retained authenticated Production diagnostics snapshot;
- a first-party count of analytics events observed during the most recent 24 hours;
- a first-party count of analytics events observed during the most recent 7 days.

The traffic reads are count-only and bounded. No event rows, visitor identifiers, IP addresses, user agents or customer records are returned by this endpoint.

## Capacity classification

The operator view classifies:

- diagnostic failures/degradation;
- bounded diagnostic duration;
- recent first-party traffic growth against the preceding six-day average;
- recommended investigation actions when observed pressure rises.

The thresholds are operational guardrails, not provider limits. A single snapshot is not a capacity forecast, and the release never infers Cloudflare billing cost, CPU consumption, subrequest quota usage or guaranteed future capacity.

## Tuning boundary

Build 423 may recommend:

- reducing dependency calls on hot paths;
- reviewing safe cache opportunities for non-authoritative reads;
- reviewing analytics batching;
- investigating degraded dependencies before adding runtime work.

It does **not** automatically change cache headers, retries, polling cadence, request routing, provider settings, database state or Cloudflare configuration.

The retained analytics ingest remains fail-open and bounded: at most 12 events per request, bounded payload size, one settings read and one event insert. The new capacity endpoint adds no public hot-path work because it is staff-only and manual-refresh.

## Reliability boundary

- No permanent polling.
- No cost-amplifying automatic retry expansion.
- No automatic capacity scaling.
- No automatic cache-policy mutation.
- No provider or business-data mutation.
- No schema migration.
- Missing traffic evidence remains partial/unavailable rather than being fabricated.

## Release acceptance

The focused Build 423 authority, Current Source Gate and exact feature-preview acceptance must pass before Development advances.

Development must independently pass exact-SHA deployment/runtime acceptance.

Production promotion remains a protected-`main` pull request. The resulting Production SHA must independently pass exact Cloudflare Production deployment/runtime/business acceptance.

Source/Production GREEN means the bounded capacity instrumentation is safe and deployed. It does not mean Cloudflare cost or capacity is unlimited.

## Next bounded release

Build 424 — Security, Privacy & Recovery Drill begins only after Build 423 is independently GREEN on protected `main`.
