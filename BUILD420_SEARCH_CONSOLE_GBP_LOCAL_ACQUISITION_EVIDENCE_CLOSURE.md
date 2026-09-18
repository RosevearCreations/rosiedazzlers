# Build 420 — Search Console, GBP & Local Acquisition Evidence Closure

Build 420 closes the local-acquisition evidence loop without converting source readiness into an invented Google outcome. It reuses the durable Build 414 local-search measurement authority and classifies the currently observed Search Console, Google Business Profile, first-party traffic and approved local proof into one read-only closure view.

## Closure contract

- Search Console evidence comes only from a dated operator-observed snapshot already retained by the Build 414 provider-evidence authority.
- Google Business Profile evidence comes only from a dated operator-observed snapshot already retained by the Build 414 provider-evidence authority.
- First-party acquisition evidence comes only from bounded Rosie Dazzlers analytics already exposed by the Build 414 report.
- Local proof comes only from approved, public, non-sample Rosie Dazzlers proof already exposed by the Build 414 report.
- Markup, canonical tags, structured data, target pages, Google referrals or source deployment do not prove indexing, rankings, Maps visibility or GBP performance.
- Missing provider snapshots remain `provider_dependent`.
- Stale provider snapshots remain `owner_action`.
- Unavailable first-party analytics or proof remain `unavailable`.
- Fresh dated provider snapshots may be classified as observed evidence, but source/runtime GREEN never upgrades their meaning beyond operator-observed provider evidence.
- The closure payload exposes only bounded metrics, dates, classifications and actions already returned by the durable measurement authority. It does not expose Google credentials, OAuth material, customer identity or provider secrets.

## Operator surface

`/admin-seo-tasks.html` adds a Build 420 local-acquisition closure panel above the retained Build 414 evidence cards.

The panel reports:

- overall closure state;
- Search Console state;
- Google Business Profile state;
- first-party acquisition state;
- approved local-proof state;
- provider evidence age/freshness through the retained provider classification;
- remaining evidence actions.

The view remains manual-refresh only and read-only.

## Safety boundary

Build 420 introduces no schema migration, Google OAuth flow, provider API call, ranking manipulation, profile mutation, content auto-publishing, customer outreach, analytics write, Production business-data mutation, destructive storage action or permanent polling.

Saving provider evidence remains the existing separately initiated Build 414 staff action. Release acceptance does not create or alter provider evidence.

## Release acceptance

The focused Build 420 authority, Current Source Gate and exact Cloudflare feature-preview acceptance must pass before Development advances.

Development must then independently pass exact-SHA deployment/runtime acceptance.

Production promotion remains a protected-`main` PR. The resulting Production merge SHA must independently pass exact Cloudflare Production deployment/runtime/business acceptance.

Source/Production GREEN may coexist with `provider_dependent`, `owner_action` or `unavailable` acquisition evidence.

## Next bounded release

Build 421 — Retention, Maintenance & Fleet Operational Pilot begins only after Build 420 is independently GREEN on protected `main`.
