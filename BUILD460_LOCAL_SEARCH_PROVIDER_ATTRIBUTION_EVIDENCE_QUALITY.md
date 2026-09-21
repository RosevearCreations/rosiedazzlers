# Build 460 — Local Search Provider & Attribution Evidence Quality

## Purpose
Improve reconciliation between dated Google Search Console / Google Business Profile evidence and anonymous first-party referral/funnel measurement while preserving the strict separation between provider outcomes and causal conversion claims.

Build 460 enriches the retained Build 440 provider-evidence refresh and Build 450 conversion-attribution workbench. It does not create a second analytics system, provider store, tracking identity, causal model or marketing-performance score.

## Evidence-quality dimensions
The retained `/api/admin/local_search_measurement_conversion_attribution` endpoint now exposes a Build 460 evidence-quality block over each provider source.

Evidence quality explicitly records:
- provider property/location/window identity completeness;
- provider freshness/current versus stale/missing state;
- whether the dated provider measurement window overlaps the retained first-party analytics window;
- first-party rollup availability;
- anonymous same-session attribution availability; and
- whether the bounded analytics row limit may have truncated same-session evidence.

These dimensions describe **comparability**, not performance.

## Comparison states
Per-provider evidence quality is classified as:
- `provider_dependent` — provider snapshot/identity is missing or incomplete;
- `owner_action` — provider evidence exists but is stale;
- `unavailable` — first-party or same-session evidence is unavailable;
- `bounded_partial` — same-session analytics may be truncated;
- `window_mismatch` — provider and first-party windows are dated but do not overlap;
- `window_unknown` — dated alignment cannot be established; or
- `comparable_observed` — current provider evidence and complete bounded first-party evidence have overlapping observation windows.

`comparable_observed` means only that an operator may review the sources side by side as dated descriptive evidence.

## Causation and identity boundary
Build 460 never:
- joins a Search Console click to an anonymous session;
- joins a Google Business Profile action to an anonymous session;
- joins an anonymous session to a customer or persisted booking;
- divides provider metrics by funnel conversion rates as if they were one population;
- calculates a provider-to-funnel correlation score;
- claims a provider outcome caused a booking, checkout or customer conversion; or
- treats overlapping date windows as causal evidence.

Same-session attribution remains observed first-party path evidence only.

## Operator surface
The retained `/admin-seo-tasks.html` Build 450 panel is enriched in place with an **Evidence quality reconciliation** section.

The existing manual refresh remains authoritative. No second endpoint, dashboard or background poller is introduced.

## Provider and first-party authority
- Search Console / Google Business Profile remain dated operator-observed provider snapshots.
- First-party referral/landing rollups remain Rosie Dazzlers analytics observations.
- Anonymous booking-funnel attribution remains same-session only.
- Provider metrics remain source-attributed and are never converted into session identity.

## Mutation boundary
Build 460 is read-only and introduces no:
- schema migration;
- analytics write;
- Google OAuth/API call;
- provider snapshot write;
- ad-spend or ranking manipulation;
- content publishing;
- customer outreach;
- DNS/storage mutation;
- booking/customer/profile mutation; or
- permanent polling.

The existing explicit provider snapshot save workflow remains separately initiated staff action and is not invoked by release acceptance.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains authoritative.

Evidence-quality GREEN cannot fabricate missing Search Console/GBP evidence, refresh stale evidence, close a provider-dependent HOLD or prove rankings, indexing, Maps visibility or marketing causation.

## Acceptance
The exact candidate must pass:
1. Local Search Provider & Attribution Evidence Quality authority;
2. retained Build 450 conversion-attribution authority;
3. retained Build 440 provider-evidence refresh authority;
4. retained Build 414 local-search measurement authority;
5. retained Build 420 local-acquisition evidence closure;
6. retained Build 431 local acquisition/content proof;
7. Current Source Gate;
8. exact feature-preview acceptance;
9. exact Development deployment/runtime acceptance;
10. protected-main PR checks; and
11. independent exact resulting-`main` Production deployment/runtime/business acceptance.

A GREEN Build 460 means the application truthfully communicates whether provider and first-party evidence are current, available and window-comparable. It does not prove provider performance or causation.

## Next bounded release
**Build 461 — Booking & Quote Experiment Readiness** begins only after Build 460 is independently GREEN on protected `main`.
