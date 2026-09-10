# Maintenance Plan Pilot Activation — Build 371

## Purpose

Build 371 prepares the vehicle-specific pilot activation path for the future Rosie Dazzlers Maintenance Plan. It does not approve or invent the seven unresolved business decisions from Build 370, and it does not enrol anyone today.

The canonical business authority remains `config/maintenance-plan-business-rulebook.json`. The Build 371 pilot authority is `config/maintenance-plan-pilot-activation.json`, and the decision engine is `functions/api/_lib/maintenance-plan-pilot.js`.

## Activation requirements

A pilot can only become mechanically eligible when all seven Build 370 business domains are explicitly approved: eligibility, cadence, price, inclusions, exclusions, cancellation, and priority. Empty draft values never count as approval.

Build 371 additionally requires a canonical customer identity, canonical vehicle identity, confirmation that the vehicle belongs to that customer, and explicit staff activation intent. Automatic enrolment is not permitted.

The evaluator returns human-readable pending reasons when any requirement is missing. This gives staff and later UI work one canonical explanation of why a vehicle-specific pilot cannot advance.

## Fail-closed boundary

The current Build 370 rulebook remains unapproved, so Build 371 evaluates every real pilot as blocked. The public Maintenance Plan surface remains a waitlist/interest surface and `enabled` remains false.

Build 371 provides **no recurring billing**, automatic renewal, automatic enrolment, guaranteed booking priority, capacity reservation, provider mutation, booking creation, customer mutation, vehicle mutation, or membership persistence authority. Stripe and PayPal are not contacted by this build.

Even a synthetic fully approved rulebook used by the source test only proves that the decision mechanics can recognize a mechanically eligible vehicle-specific pilot. The evaluator still reports `mutation_authority: false` and `provider_mutation_authority: false`.

## Existing authorities remain in force

Maintenance status does not bypass the live booking flow, service-area limits, capacity/travel rules, safe-work-area/site-access rules, weather/safety decisions, vehicle-condition review, add-on pricing, deposits, cancellations, or staff authority. Rosie Dazzlers' normal mobile-detailing operating model remains unchanged.

## Build 372 boundary

Build 372 may consume the Build 371 decision result only within its explicitly authorized roadmap scope. It must not infer approval of any unresolved business term or treat Build 371 as authority for recurring billing, automatic renewal, guaranteed priority, or persistence.
