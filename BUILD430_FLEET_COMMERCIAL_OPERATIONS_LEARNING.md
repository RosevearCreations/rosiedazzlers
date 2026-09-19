# Build 430 — Fleet & Commercial Operations Learning

## Purpose

Reconcile fleet inquiry, rulebook, capacity and completed-work evidence into a bounded operator workflow that helps us understand commercial demand and operational fit without automatically changing commercial terms.

## Evidence model

Build 430 may review existing evidence for:

- fleet/commercial inquiries and their current stage;
- approved vs unresolved fleet rulebook decisions;
- capacity constraints and scheduling evidence;
- completed fleet/commercial jobs where identifiable through existing durable data;
- service mix, vehicle count and recurrence evidence;
- unresolved pricing, discount, invoicing or service-area decisions.

## Operator workflow

The preferred result is a Fleet & Commercial Learning workbench that separates:

- inquiry demand;
- approved commercial rules;
- operational capacity;
- completed-work evidence;
- owner decisions still required.

Unresolved commercial terms stay `owner_action`; unsupported capacity remains `unavailable` rather than assumed.

## Mutation boundary

No automatic fleet discount, quote acceptance, invoice creation, booking creation, service-area expansion, credit term, payment/provider transaction, accounting posting, role change, schema migration unless separately approved, customer outreach or permanent polling is authorized.

## Acceptance

The exact candidate must pass focused Fleet & Commercial Learning authority, retained fleet rulebook/account operations/maintenance authorities, Current Source Gate, exact Development deployment/runtime acceptance, protected-main PR checks and exact Production deployment/runtime/business acceptance.

Build 430 must not convert inquiry volume into a claim of signed commercial business.
