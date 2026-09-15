# Build 403 — Customer Retention, Rebooking, Service Guidance & SEO Growth

## Goal

Improve customer retention and public service education without creating a second booking authority, fuzzy customer identity, inferred consent, automatic outreach, hidden customer scoring, hard-coded pricing or unverified SEO proof.

## Exact customer-history authority

- Authenticated retention booking history is resolved by exact `customer_profile_id` only.
- Email may still support existing quote/maintenance-interest authorities where those historical tables are email-keyed, but it must not be used to join booking history for Build 403 guidance.
- Completed-service guidance requires observed `package_code`, `vehicle_size` and service/completion date on an exact-profile booking.
- Missing evidence is `unavailable` or `insufficient`; it is never guessed or filled from a fuzzy identity match.
- The prior completed service is advisory context only. The current booking flow revalidates the current catalog, condition, availability, scope and price.
- No automatic booking write, automatic customer outreach, inferred outreach consent, persistent customer scoring or automatic service substitution is authorized.

## Public specialty/add-on depth

The retained landing-page renderer and Build 389 local SEO/proof authority remain canonical. Build 403 composes a new condition-aware depth layer on top of them rather than replacing pricing, proof, image or route authority.

Every current public add-on/specialty landing route receives:

- a service-specific professional process breakdown;
- condition/severity factors that change scope;
- truthful timing language, including that severe conditions can require several hours;
- explicit language that products, equipment, labour and duration depend on actual condition;
- a customer approval path before materially expanding requested work;
- no fixed repair-time or guaranteed-result promise before inspection.

High-risk/depth examples are explicit:

- **Paint correction:** assessment/safe wash, decontamination, test spot and correction plan, correction/refinement and protection; deep defects or thin/failing paint may limit safe removal.
- **Odor remediation:** source inspection/removal, material-appropriate cleaning, extraction where appropriate, drying/reinspection and final neutralizing treatment; deodorizer is not a substitute for source work.
- **Water extraction / flooded-floor restoration:** extraction, seat/trim/carpet access where required, trapped-moisture inspection, drying, cleaning, mold/rust-risk mitigation and deodorization; detailing is not presented as mechanical leak repair, electrical repair or guaranteed environmental remediation.
- Headlight restoration distinguishes external oxidation from internal failure and ends with UV-resistant protection where appropriate.
- Seat/carpet shampoo, salt treatment, pet hair, engine bay, clay, polishing, sealants/coatings, tint/wrap and other published add-on pages explain their own material/process limitations rather than sharing generic marketing claims.

## SEO and proof boundaries

- Public indexable pages retain exactly one meaningful H1.
- Titles, meta descriptions, canonicals and structured data remain route-specific.
- Oxford/Norfolk service-area language must remain truthful.
- Genuine proof remains fail-closed through existing proof authorities; no fake reviews, ratings, customer identities or before/after claims are introduced.
- New water-extraction content contains no hard-coded public price; commercial scope is confirmed through the existing booking/quote path.

## Responsive / reliability boundaries

- New account and public content must remain usable on phone, tablet/small laptop and desktop.
- Account guidance remains manual/read-only and creates no permanent polling.
- Build 403 creates no schema migration, Production business-data mutation, payment/provider mutation, accounting/inventory posting, consent/outreach mutation, DNS/secret mutation or destructive R2 operation.

## Acceptance sequence

1. Focused Build 403 source authority, retained Build 402 authority, release-document convergence and feature-preview checks must pass on the exact candidate SHA.
2. `dev` advances only by non-force fast-forward to that exact candidate and must pass exact-SHA Development deployment/runtime acceptance.
3. Production promotion proceeds by PR to protected `main`; `rd main protection` and required `source checks` are not bypassed.
4. The resulting merge SHA is the exact Production source identity.
5. **Production deployment/runtime/business acceptance must independently prove that exact SHA** before Build 403 is GREEN.

## Explicit non-authorities

No schema change. No real customer/provider/payment/accounting/inventory mutation. No inferred consent. No fuzzy anonymous↔customer identity join. No hidden score. No automatic outreach. No automatic rebooking. No silent service substitution. No fabricated SEO, review, proof or pricing evidence.
