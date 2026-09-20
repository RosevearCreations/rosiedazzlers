# Build 450 — Local Search Measurement & Conversion Attribution

## Purpose
Reconcile dated Search Console / Google Business Profile evidence with first-party local landing-page, referral and booking-funnel evidence without inventing a Google outcome or creating a second acquisition analytics system.

Build 450 reuses the retained Build 414 measurement authority and Build 440 provider-evidence refresh. It adds a privacy-safe conversion-attribution view over the existing anonymous analytics stream.

## Retained evidence authorities
Provider evidence remains sourced only from the existing dated operator-observed snapshots for:
- Google Search Console; and
- Google Business Profile.

First-party landing/referral rollups remain sourced from the retained local-search measurement authority.

Anonymous booking-funnel evidence remains sourced from the existing `site_activity_events` analytics stream.

No new provider store, analytics schema or tracking identity is introduced.

## Same-session attribution
Build 450 may classify an anonymous session when its observed event sequence contains:
- a Google referrer/source signal;
- a local/service landing page;
- booking Step 1;
- checkout started; and/or
- checkout completed.

The attribution rule is **same-session only**.

The Build 450 endpoint reads only bounded anonymous analytics fields:
- `session_id`;
- event type;
- page path;
- referrer/source/campaign;
- checkout state;
- event timestamp; and
- bounded event payload.

It does not read visitor ID, IP address, user agent, customer profile ID or other customer identity.

## Attribution meaning
Same-session attribution is first-party observed path evidence. It may describe that an anonymous session:
- arrived with a Google referral;
- landed on a local/service page; and
- later reached a booking-funnel stage in that same analytics session.

It is **not causal attribution**.

Build 450 never claims that:
- a Search Console click maps to an individual session;
- a Google Business Profile action maps to an individual session;
- a provider metric caused a booking;
- a Google referral caused a checkout;
- an anonymous session maps to a persisted booking/customer;
- a persisted booking originated from an anonymous analytics session; or
- provider-window overlap proves marketing causation.

## Provider reconciliation
The Build 450 workbench shows provider evidence beside the anonymous first-party conversion cohorts.

Search Console / Google Business Profile evidence retains:
- explicit property/location identity;
- measurement start/end dates;
- observation timestamp;
- freshness classification; and
- provider/first-party window overlap.

Provider window overlap is correlation context only.

Missing provider evidence remains `provider_dependent`. Stale provider evidence remains `owner_action`. First-party analytics unavailability remains `unavailable`.

## Operator surface
The existing `/admin-seo-tasks.html` surface adds a Build 450 panel backed by:

`/api/admin/local_search_measurement_conversion_attribution`

The panel reports:
- provider evidence state;
- bounded anonymous event coverage;
- all observed sessions;
- Google-referral sessions;
- local/service landing sessions;
- combined Google-referral + local/service landing sessions;
- booking starts, checkout starts and checkout completions within each cohort;
- observed same-session conversion percentages; and
- local/service landing-page cohort counts.

This is manual refresh only.

## Truth boundary
No ranking, indexing, Maps or Google Business Profile success is inferred from:
- markup;
- canonical tags;
- structured data;
- first-party page traffic;
- Google referrals;
- booking-funnel events;
- same-session conversion rates;
- provider-window overlap; or
- source/runtime GREEN.

Provider metrics remain source-attributed evidence, not session identity.

## Privacy boundary
Build 450 performs no anonymous-to-customer identity join.

It does not expose or use:
- visitor ID;
- IP address;
- user agent;
- customer profile identity;
- email;
- phone;
- persisted booking identity; or
- fuzzy identity matching.

## Mutation boundary
Build 450 is read-only and introduces no:
- schema migration;
- analytics write;
- provider API/OAuth call;
- provider snapshot write;
- ranking manipulation;
- content publishing;
- customer outreach;
- ad-spend mutation;
- DNS mutation;
- booking creation;
- customer/profile mutation;
- destructive storage action; or
- permanent polling.

The existing provider snapshot save workflow remains a separately initiated explicit staff action and is not invoked by Build 450 release acceptance.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains authoritative.

Observed same-session conversion evidence does not close the **Local-search provider evidence** HOLD. That HOLD still requires dated provider-observed evidence for the correct property/location and measurement window.

## Acceptance
The exact candidate must pass:
1. Local Search Measurement & Conversion Attribution authority;
2. retained Build 440 provider-evidence refresh authority;
3. retained Build 414 local-search measurement authority;
4. retained Build 420 local-acquisition evidence closure;
5. retained Build 431 local acquisition/content proof authority;
6. retained booking/rebooking funnel authority;
7. Current Source Gate;
8. exact feature-preview acceptance;
9. exact Development deployment/runtime acceptance;
10. protected-main PR checks; and
11. independent exact resulting-`main` Production deployment/runtime/business acceptance.

Source/runtime GREEN may coexist with `provider_dependent`, `owner_action`, `unavailable` or bounded-partial acquisition evidence.

## Next bounded release
**Build 451 — Booking Funnel, Quote & Pricing Learning** begins only after Build 450 is independently GREEN on protected `main`.
