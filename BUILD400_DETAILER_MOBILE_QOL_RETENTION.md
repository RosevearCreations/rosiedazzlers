# Build 400 — Detailer Mobile App QoL & Retention Evidence

## Scope

Build 400 extends the existing `/app/detailer/` field runtime rather than creating a second field application. It keeps the Build 383 server-authoritative job/evidence gates intact and adds an additive mobile convenience layer for the controls detailers already use.

### Mobile field QoL

- large touch-friendly quick shortcuts for before photo, checklist, approved add-ons, materials/product usage, completion evidence and after photo;
- shortcuts resolve only to controls already mounted by the canonical live-job module and are disabled while those controls are asleep;
- a local session timer is available as a device-only convenience aid;
- the local timer is explicitly **not** payroll, billing, job-state, completion or accounting evidence;
- the QoL layer performs no API request and does not introduce polling or automatic field mutations;
- the existing start/complete evidence gates, approved-scope rules, upload workflow and final-balance handoff remain authoritative.

### Retention / rebooking evidence

`GET /api/admin/detailer_retention_evidence?days=90` provides bounded aggregate repeat-service evidence from canonical booking rows.

- only exact non-empty `customer_id` values may establish repeat history;
- missing canonical IDs are excluded instead of guessed;
- names, email addresses, phone numbers, postal codes and anonymous/session identifiers are not matching keys;
- no fuzzy/email/name identity merge is permitted;
- no customer identifiers are returned in output;
- no persistent customer score is created;
- no outreach, booking, payment, inventory, accounting or customer-profile mutation is performed;
- row limits and unavailable/partial evidence fail closed and are disclosed.

The aggregate `repeat_customer_rate` means: exact canonical customer IDs with at least two eligible booking rows inside the bounded observation window divided by exact canonical customer IDs with at least one eligible booking row inside that same window. It is not a lifetime retention claim and must not be presented as one when the query window or row limit is incomplete.

## Release boundary

Build 400 is schema-neutral and source-only. It does not authorize database migration, Production business-data mutation, automatic outreach, payment/provider mutation, accounting posting, inventory posting, destructive R2 mutation, DNS/secret mutation or permanent polling.

## Acceptance

The focused Build 400 authority must prove the canonical Detailer surface loads the additive QoL layer, the layer does not perform network requests, the device-only timer is non-authoritative, quick controls map to existing Build 383 evidence controls, and retention evidence remains exact-ID/aggregate/fail-closed. Retained responsive, release-governance, Current Source Gate, Development exact-SHA and Production exact-SHA authorities remain mandatory.
