# Build 284 — Contextual Proof Placement

Build 284 turns the Build 283 proof/publication authority into a customer-facing decision aid without creating a second Gallery, database, consent system, review system, or pricing authority.

## Scope

- add one shared public renderer: `assets/contextual-proof-v284.js`;
- load it only on eligible service/add-on, location, and Build 282 high-intent use-case pages through the existing first-party visual bootstrap;
- read only `/api/before_after_gallery_public`;
- independently re-check the Build 283 real-proof boundary before rendering;
- show at most three context-matched before/after records;
- include vehicle, service, town/location, condition and **problem → process → result** context;
- keep booking/pricing/availability/deposit/conflict authority in the existing application.

## Fail-closed proof rules

A row is not customer proof merely because the public Gallery API returned it. Build 284 also requires:

- explicit `published` state;
- public-use consent approval;
- public media-privacy approval;
- non-sample proof;
- paired before/after media;
- service and town/location context;
- vehicle label and condition summary;
- problem, process and result text.

Sample fallback is always rejected as real proof. When there is no real context-matched proof, the contextual proof section stays hidden. Existing public-facing proof-placeholder plans are hidden rather than being presented as customer evidence.

## Context placement

- service/add-on pages require a matching Gallery service slug;
- location pages require a matching Gallery town slug from the towns genuinely represented by that page;
- Build 282 use-case pages require a matching starting/relevant service and describe the evidence as relevant work, not proof that every vehicle has the same condition or result.

Build 284 does not invent a customer, vehicle, location, testimonial, consent record, condition, process or result to fill an empty proof slot.

## Architecture boundary

The Build 283 Gallery publication controls remain authoritative. Build 284 is presentation-only and introduces no database migration, no direct R2 enumeration, no private/admin API dependency, and no payment/review authority.

## Acceptance

Build 284 is complete only when:

1. the exact feature SHA passes the Build 284 source gate and retained Builds 271–283;
2. Cloudflare feature preview succeeds on that exact SHA;
3. only then does `dev` fast-forward to the accepted SHA;
4. Development Source Gate passes through Build 284;
5. the exact Cloudflare Development deployment succeeds with Functions attached;
6. immutable static smoke and mutable `dev` alias full runtime smoke pass;
7. `main` remains unchanged.

**Production remains closed.**
