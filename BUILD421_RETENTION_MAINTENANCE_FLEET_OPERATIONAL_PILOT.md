# Build 421 — Retention, Maintenance & Fleet Operational Pilot

Build 421 adds the bounded operational-pilot gate defined by the active Rosie Dazzlers roadmap. It reuses the retained maintenance-interest, commercial-activation, fleet-assessment, quote and capacity authorities without inventing commercial terms or activating customers automatically.

This release is schema-neutral and read-only. The current maintenance and fleet rulebooks still require explicit owner approval and remain `awaiting_business_approval`. Source release GREEN therefore truthfully coexists with an `owner_action` pilot HOLD until the real business terms are approved.

## Current pilot state

The current configured state is expected to classify as:

- source acceptance: `ready`;
- maintenance pilot: `owner_action`;
- fleet pilot: `owner_action`;
- participant selection: manual only;
- live capacity: not inferred;
- customer or fleet commitment: not inferred.

Build 421 does not change the commercial rulebooks. Pricing, cadence, inclusions, exclusions, priority, fleet minimums, service tiers, travel limits, volume pricing, invoicing and cancellation remain under the canonical owner-approved rulebooks.

## Operational pilot contract

The staff-only `/api/admin/retention_maintenance_fleet_operational_pilot` endpoint composes aggregate queue evidence from the retained maintenance-interest and fleet-assessment sources.

It returns:

- source-safe versus review classification;
- maintenance and fleet pilot readiness separately;
- aggregate maintenance-interest and fleet-pipeline counts;
- the retained operator next-action guidance;
- owner actions that still block a real pilot;
- the retained availability and checkout collision-revalidation authorities;
- locked automatic/commercial actions.

The endpoint exposes no customer identity and performs no mutation.

## Capacity and booking boundary

Every real pilot booking must still use current server-authoritative capacity.

- `/api/availability` remains the availability authority.
- `/api/checkout` remains the final collision/revalidation authority.
- A queue entry, interested customer, fleet lead, quote or source-safe release never reserves a slot.
- Current date/slot availability must be revalidated before any real booking.
- Closed slots are never opened by the pilot layer.

## Owner approval remains authoritative

A real maintenance pilot participant cannot be selected until the canonical maintenance commercial terms are explicitly approved.

A real fleet pilot account cannot be selected until the canonical fleet commercial terms are explicitly approved.

Even after approval, Build 421 only prepares manual operator selection. Approval does not itself create a booking, invoice, discount, recurring commitment or provider transaction.

## Safety boundary

- **No automatic outreach.** Staff-directed contact remains separately authorized.
- **No automatic customer selection.** Queue activity never becomes pilot enrolment.
- **No automatic booking.** Existing booking authority remains authoritative.
- **No automatic discount.** Pricing and discounts remain owner-approved and separately applied.
- **No automatic invoice.** Fleet invoicing remains separately authorized.
- **No recurring billing or renewal.** No subscription is created.
- **No provider mutation.** Stripe, PayPal or any other payment-provider state is untouched.
- **No schema migration.** The release reads existing sources only.
- **No permanent polling.** The overview is operator-requested and bounded.

## Release acceptance

The focused Build 421 authority, Current Source Gate and exact feature-preview acceptance must pass before Development advances.

Development must then independently pass exact-SHA deployment/runtime acceptance.

Production promotion remains a protected-`main` pull request. The resulting `main` SHA must independently pass exact Cloudflare Production deployment/runtime/business acceptance.

Source/Production GREEN is not pilot approval. The current expected operational state remains `owner_action` until explicit owner approval is recorded in the canonical rulebooks.

## Next bounded release

Build 422 — Media, Photo Studio & Proof Operations begins only after Build 421 is independently GREEN on protected `main`.
