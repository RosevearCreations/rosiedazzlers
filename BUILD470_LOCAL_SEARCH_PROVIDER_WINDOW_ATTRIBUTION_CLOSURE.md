# Build 470 — Local Search Provider Window & Attribution Closure

## Purpose
Close the retained local-search comparison-window decision package without creating a second analytics system, provider store, tracking identity or causal attribution model.

Build 470 reuses:
- Build 440 provider-evidence refresh;
- Build 450 local-search measurement and anonymous same-session funnel attribution;
- Build 460 provider/attribution evidence-quality reconciliation;
- the existing `/api/admin/local_search_measurement_conversion_attribution` endpoint; and
- the existing `/admin-seo-tasks.html` operator surface.

## Closure requirements
Each Search Console / Google Business Profile source may reach `closure_ready` only when:
1. provider property/location identity is explicit;
2. provider period start/end and observed-at evidence are explicit;
3. the provider snapshot is current rather than missing/stale;
4. the retained first-party observation window is explicit and available;
5. provider and first-party dated windows overlap; and
6. bounded anonymous same-session funnel evidence is available without row-limit truncation.

Missing evidence stays explicit as `provider_dependent`, `owner_action`, `unavailable`, `bounded_partial`, `window_mismatch` or `window_unknown`.

## Attribution boundary
`closure_ready` means only that source-attributed provider windows and bounded first-party referral/funnel observations are sufficiently explicit and aligned for dated descriptive review.

Build 470 does not:
- join Search Console clicks or GBP actions to sessions, customers or persisted bookings;
- divide provider metrics by funnel conversion rates;
- calculate provider-to-funnel correlation or performance scores;
- infer ranking, indexing or Maps visibility;
- claim that Google caused a booking, checkout or customer conversion; or
- treat date-window overlap as causal evidence.

## Operator surface
The retained Build 450/460 local-search panel is enriched in place with a Build 470 **Provider window & attribution closure** block. It exposes property/location label, provider dates, first-party dates, overlap state, bounded same-session availability and a safe next action per provider.

No background poller or replacement endpoint is introduced.

## Mutation boundary
Build 470 is read-only and introduces no schema, provider, analytics, publishing, outreach, DNS, ad-spend, customer, booking, accounting, inventory or storage mutation and no permanent polling.

The separately initiated staff provider-snapshot save workflow remains unchanged and is not invoked by release acceptance.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains authoritative. Source/runtime GREEN cannot fabricate Search Console/GBP evidence or close a provider-dependent HOLD.

## Acceptance
The exact candidate must pass:
1. Local Search Provider Window & Attribution Closure authority;
2. retained Build 460 evidence-quality authority;
3. retained Build 450 conversion-attribution authority;
4. retained Build 440 provider-evidence refresh authority;
5. retained local-search measurement/acquisition/content-proof authorities;
6. Current Source Gate;
7. exact feature-preview acceptance;
8. exact accepted-`dev` Development deployment/runtime acceptance;
9. protected-`main` promotion; and
10. independent exact resulting-`main` Production deployment/runtime/business acceptance.

A GREEN Build 470 means the application truthfully communicates whether the provider and first-party observation windows are closure-ready for descriptive review. It does not prove provider performance or causation.

## Next bounded release
**Build 471 — Booking & Quote Controlled Experiment Framework** begins only after Build 470 is independently GREEN on protected `main`.
