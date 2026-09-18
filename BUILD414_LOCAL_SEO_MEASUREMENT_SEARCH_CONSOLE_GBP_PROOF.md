# Build 414 — Local SEO Measurement, Search Console & GBP Proof

Build 414 connects Rosie Dazzlers' existing one-H1, metadata, local-service and approved-proof authorities to measurable local-search evidence without inventing Google provider outcomes.

## Evidence model

Four evidence classes remain separate:

- **first-party observed evidence** — bounded Rosie Dazzlers analytics rollups such as Google referrer events and observed page views on current town/service routes;
- **approved local proof** — published, public-approved, non-sample before/after evidence;
- **Search Console evidence** — a dated operator-observed snapshot copied from the verified Rosie Dazzlers Search Console property;
- **Google Business Profile evidence** — a dated operator-observed snapshot copied from the Rosie Dazzlers business profile.

First-party traffic and local proof do not prove rankings, impressions, indexing, Maps visibility or GBP performance.

## Provider evidence boundary

Build 414 does not add Google OAuth, API credentials, scraping or automatic provider calls.

An authorized operator may explicitly record a bounded provider snapshot in the existing `app_management_settings` authority under `local_search_provider_evidence`. Search Console retains only clicks, impressions, CTR and average position. Google Business Profile retains only profile views, website clicks, calls and direction requests.

Every saved snapshot requires a property/location label, measurement start/end dates and an observation timestamp. Provider snapshots older than 45 days are treated as stale owner-action evidence.

Missing provider evidence remains **provider-dependent**. An observed snapshot remains **owner-action** evidence because it was manually observed, not independently fetched by the Rosie runtime.

## Admin workflow

`/admin-seo-tasks.html` becomes the operator-facing local-search measurement surface.

It displays:

- bounded first-party Google referral and local/service target-page traffic;
- genuine approved local proof counts;
- Search Console evidence state and metrics when explicitly recorded;
- Google Business Profile evidence state and metrics when explicitly recorded;
- existing local SEO task cards;
- source-attributed recommendations and evidence rules.

The UI is manual refresh only. There is no permanent polling.

## Safety and release boundary

This source release introduces no schema migration, no Google credentials, no automatic provider call, no provider mutation, no ranking manipulation, no content auto-publishing, no customer outreach and no Production business-data mutation during acceptance.

Recording a provider snapshot is an explicit staff action in the running application; release acceptance does not perform that action.

Exact-SHA Development and Production Cloudflare deployment/runtime acceptance remain independent from Search Console/GBP provider evidence. Production source/runtime GREEN must not be interpreted as Google ranking, indexing or GBP success.
