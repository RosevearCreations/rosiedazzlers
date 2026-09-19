# Build 440 — Local Search Provider Evidence Refresh

## Purpose

Refresh the operator view of dated Search Console / Google Business Profile evidence and reconcile it with first-party Rosie Dazzlers traffic and genuine approved local proof without fabricating a Google outcome.

## Implemented workflow

Build 440 extends the existing protected `/admin-seo-tasks.html` surface with a **manual Refresh provider evidence** panel backed by the GET-only endpoint:

- `/api/admin/local_search_provider_evidence_refresh`

The endpoint reuses the retained Build 414 local-search measurement authority. It does not create a second provider-evidence store.

For Search Console and Google Business Profile it reports:

- explicit property/location label presence;
- measurement start and end dates;
- observation timestamp;
- bounded provider metrics already retained by the existing snapshot authority;
- evidence age/freshness;
- whether an operator refresh is required; and
- whether the provider measurement window overlaps the current first-party analytics window.

The same response carries bounded first-party Google-referral/local-service-page traffic and genuine approved public local-proof counts for side-by-side reconciliation.

## Evidence classification

Provider evidence is classified fail-closed:

- `provider_dependent` — no usable provider snapshot or explicit property/location/window identity is available;
- `owner_action` — a dated provider snapshot exists but is stale and needs an explicit operator refresh;
- `observed` — a fresh dated operator-observed provider snapshot is available.

First-party traffic and approved local proof are classified independently as `observed` or `unavailable`.

A fresh provider snapshot is still only dated operator-observed evidence. It is not a live Google API assertion and does not guarantee future results.

## Truth boundary

Markup, canonical tags, structured data, page copy, Google referrals, first-party traffic, approved local proof, source deployment and runtime GREEN never prove:

- ranking position;
- indexing state;
- Maps visibility;
- Google Business Profile placement; or
- future provider performance.

Provider window overlap is descriptive only. It does not establish causation between local proof/content and Google metrics.

## Mutation boundary

Build 440 itself is read-only and manual-refresh only.

It performs no:

- Google OAuth/API call;
- provider snapshot write;
- third-party publishing;
- fabricated review/location creation;
- ad-spend mutation;
- DNS mutation;
- customer outreach;
- schema migration;
- destructive storage action; or
- permanent polling.

The pre-existing Build 414 provider snapshot forms remain a separately initiated explicit staff action. Release acceptance never submits those forms or changes provider evidence.

## Acceptance

The exact candidate must pass:

1. `scripts/local_search_provider_evidence_refresh_check.py`;
2. `scripts/local_search_provider_evidence_refresh_test.mjs`;
3. retained Build 414 local-search measurement authority;
4. retained Build 420 acquisition closure authority;
5. retained Build 431 local acquisition/content proof authority;
6. Current Source Gate;
7. exact feature-preview acceptance;
8. exact Development deployment/runtime acceptance after non-force promotion to `dev`;
9. protected-main pull-request checks; and
10. independent exact resulting `main` Production deployment/runtime/business acceptance.

Missing provider/owner/first-party/proof evidence remains `provider_dependent`, `owner_action` or `unavailable` rather than being guessed.

## Next bounded release

**Build 441 — Booking, Quote & Retention Production Learning** begins only after Build 440 is independently GREEN on protected `main`.
