# Build 491 — Maintenance & Fleet Pilot Outcome Evidence

## Purpose
Define attributable, read-only maintenance/fleet pilot outcome evidence only after explicit owner approval and bounded pilot authorization exist.

Build 491 reuses the retained owner-decision, controlled-pilot readiness and operational-pilot safety authorities. It does not create a second pilot engine, participant registry, booking flow, invoicing system or capacity ledger.

## Outcome evidence dimensions
Attributable execution evidence is kept explicit for participants and each observed pilot row:
- manually selected participant reference and participant type;
- observed start/end timestamps and bounded duration;
- per-booking current availability revalidation through /api/availability;
- per-booking final collision/revalidation through /api/checkout;
- observed invoicing outcome without creating or changing an invoice;
- observed travel distance without inventing a travel limit; and
- observed stop-condition state and reason without automatically executing a stop action.

Missing execution evidence remains owner_action. Source/runtime GREEN, commercial approval, an owner decision or an authorized duration never proves that a pilot actually ran.

## Authorization boundary
Outcome capture becomes attributable only when canonical commercial rulebooks are approved, an explicit owner pilot decision is recorded as approve, explicit positive participant and duration bounds are recorded, and bounded pilot authorization is therefore traceable.

Even then, authorization is not execution evidence.

## Review states
- owner_action_authorization_required — explicit bounded pilot authorization is absent.
- owner_action_execution_source_required — authorization exists but no approved execution-evidence source is available.
- owner_action_execution_evidence_required — execution source exists but no observed pilot rows are recorded.
- outcome_evidence_unattributable — rows exist but cannot be safely attributed to bounded participant/time evidence.
- outcome_evidence_incomplete — attributable rows exist but participant/duration/capacity/invoicing/travel/stop-condition evidence is incomplete.
- bounded_pilot_outcome_review_ready — all required evidence dimensions are observed and remain within authorized participant/duration bounds.

No state activates a customer, fleet account, booking, recurring commitment or capacity reservation.

## Privacy and mutation boundary
Participant identity is not exposed by this authority; only bounded non-identity participant references may be returned.

No customer activation, maintenance enrollment, fleet-account activation, booking mutation, capacity reservation, guaranteed-capacity inference, automatic invoice creation, price/discount change, recurring billing, outreach, provider mutation, accounting/inventory mutation, schema/storage mutation, canonical-HOLD mutation or permanent polling is authorized.

## Current truthful state
The retained maintenance/fleet rulebooks and owner decision record remain authoritative. If owner approval, pilot bounds or execution evidence are absent, Build 491 reports owner action rather than manufacturing an executed pilot.

## Acceptance
The exact candidate must pass the focused Build 491 authority and behavioral proof, retained Build 479/469/421 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting-main Cloudflare Production deployment/runtime/business acceptance.

## Next bounded release
**Build 492 — Booking & Quote Controlled Experiment Execution Evidence** begins only after Build 491 is independently GREEN on protected main.
