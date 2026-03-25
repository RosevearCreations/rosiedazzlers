
> Last synchronized: March 24, 2026. This file was reviewed during the recovery/moderation/docs/schema refresh pass.
# Current Implementation State

## Completed / strengthened in this pass
- Added a real admin recovery screen for persisted recovery templates, preview rendering, and safe test sending.
- Added moderation controls directly into `admin-progress.html` for updates and media.
- Added moderation controls directly into `admin-jobsite.html` for threaded comments and observation annotations.
- Tightened protected-page SEO behavior by adding `noindex,nofollow` to admin/protected progress screens touched in this pass.
- Fixed a moderation CORS gap on `observation_annotation_moderate` so browser requests can send admin/staff headers cleanly.
- Refreshed repo docs and schema snapshot docs to align with the current `dev` branch direction.

## Already present before this pass and still active
- PayPal deposit path foundation
- persisted recovery template table + endpoints
- provider-specific recovery rules/settings
- catalog inventory table + public DB feed
- rating fields for tools/consumables
- low-stock alert and reorder request foundations
- two-sided progress comments/annotation foundations

## Still partial / still open
- real staff auth/session across all internal screens
- broader gift redemption messaging across customer account screens
- full add-on/pricing canonicalization in every code path
- mobile upload flow completion
- reorder purchasing workflow close/receive/remind lifecycle
- final route cleanup for services/pricing duplicates

## Completed / strengthened in this pass
- Added a shared public account widget through `assets/chrome.js` so public pages can show current client session state, login/logout, settings, forgot password, and forgot email verification flows.
- Added token-based customer auth support for password reset and email verification.
- Added lightweight public website tracking through `assets/public-analytics.js` using the existing `site_activity_events` pipeline.
- Expanded admin analytics toward live online sessions, cart signals, and engagement-time visibility.
- Refreshed login UX, key docs, and schema notes to match the current implementation.

