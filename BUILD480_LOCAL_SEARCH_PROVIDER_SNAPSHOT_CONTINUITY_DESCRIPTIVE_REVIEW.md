# Build 480 — Local Search Provider Snapshot Continuity & Descriptive Review

## Purpose
Reconcile successive manually observed Google Search Console / Google Business Profile snapshots for the correct property/location and materially comparable dated windows, with bounded first-party referral/funnel context, without turning overlap or change into ranking, causation or seasonal-service claims.

Build 480 extends the retained Build 440/450/460/470 local-search system in place. It does not create a second provider store, analytics identity, Google API integration, polling service or marketing-performance score.

## Retained authorities
- Build 440 remains provider evidence refresh authority.
- Build 450 remains anonymous same-session conversion-attribution authority.
- Build 460 remains provider/first-party evidence-quality authority.
- Build 470 remains provider-window closure authority.
- `/api/admin/local_search_measurement_conversion_attribution` remains the read-only operator endpoint.
- `/admin-seo-tasks.html` remains the operator workbench.
- `STARTUP_GO_LIVE_BLOCKERS.md` remains the canonical HOLD inventory.

## Bounded provider snapshot history
The existing explicit staff save path `/api/admin/local_search_provider_evidence_save` retains a bounded history of prior valid snapshots inside the existing `local_search_provider_evidence` setting.

Rules:
- history is updated only when staff explicitly saves a new provider snapshot;
- no provider API is contacted;
- no new schema/table is introduced;
- prior snapshots are validated and deduplicated;
- history is bounded to 12 prior snapshots per provider; and
- the current provider snapshot remains the same canonical current evidence used by retained authorities.

Existing deployments with only one saved snapshot remain truthful `insufficient_history` until a later valid snapshot is manually recorded.

## Continuity comparability
A provider may reach `descriptive_review_ready` only when:
1. current provider evidence is valid/current;
2. a prior valid snapshot exists;
3. current and prior snapshots use the same Search Console property or GBP location identity;
4. current and prior measurement windows are distinct; and
5. the two provider windows contain the same number of calendar days.

Otherwise continuity remains explicit as `provider_dependent`, `owner_action`, `insufficient_history`, `identity_mismatch`, `duplicate_window` or `window_mismatch`.

## Metric deltas
When continuity is review-ready, Build 480 exposes raw previous/current values, numeric delta and percent change where mathematically defined.

Those deltas are descriptive only. Build 480 does not:
- label a provider as winning, losing, improved or failed;
- calculate a provider performance score;
- infer ranking/indexing/Maps visibility from metric movement;
- divide provider metrics by first-party funnel rates;
- join provider metrics to sessions, bookings or customers; or
- claim provider activity caused bookings.

## First-party context
Current bounded anonymous same-session referral/funnel evidence may be displayed beside provider continuity.

This context is a separate population. It is not treated as a matched historical provider cohort and is not used to calculate causal provider conversion.

## Southern Ontario seasonal truth boundary
Rosie Dazzlers operates in Southern Ontario, Canada, where outdoor detailing capability can be constrained by cold weather, product instructions, water/ice conditions, equipment and site conditions.

Build 480 therefore makes these boundaries explicit:
- provider or funnel changes do not prove a weather effect;
- search demand does not prove a service can safely be delivered during a cold snap;
- a lower/high provider metric does not prove winter demand strength or weakness;
- no service temperature threshold is invented from analytics; and
- exact cold-weather capability must come from explicit service/product/equipment/site constraints.

This release does not decide which services are winter-capable. It prevents local-search evidence from being misrepresented as that decision.

## Mutation boundary
Build 480 introduces no:
- schema migration;
- automatic Google/provider contact;
- background polling;
- automatic provider snapshot write;
- customer/booking/profile mutation;
- content publishing;
- ranking manipulation;
- ad-spend mutation;
- DNS/storage mutation; or
- customer outreach.

The existing provider snapshot save remains an explicit staff action.

## Acceptance
The exact candidate must pass:
1. Local Search Provider Snapshot Continuity & Descriptive Review authority;
2. retained Build 470 provider-window closure authority;
3. retained Build 460 evidence-quality authority;
4. retained Build 450 conversion-attribution authority;
5. retained Build 440 provider-refresh authority;
6. retained Build 414 local-search measurement authority;
7. Current Source Gate;
8. exact feature-preview acceptance;
9. exact Development deployment/runtime acceptance;
10. protected-main PR checks; and
11. independent exact resulting-`main` Production deployment/runtime/business acceptance.

A GREEN Build 480 means the application can truthfully distinguish comparable provider continuity from incomplete history and can present raw descriptive changes without inventing performance, causation, weather effects or winter service availability.

## Next bounded release
**Build 481 — Booking & Quote Experiment Approval & Measurement Lock** begins only after Build 480 is independently GREEN on protected `main`.
