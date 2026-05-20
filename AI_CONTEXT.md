# AI Context — Rosie Dazzlers Build 157


**Build 157 update — 2026-05-19:** Social progress publishing bridge added. Admin Progress can automatically create social drafts and optionally attempt approved API/webhook posting. Admin Social Queue now supports Publish/API, Send webhook, Copy text/media, Ready, Mark posted, and Skip. No DDL is required beyond Build 156; Build 157 adds `sql/2026-05-19_build157_social_api_publish_bridge_no_ddl_note.sql`.


**Updated:** 2026-05-18

Current branch baseline is Build 155.

Key context for future AI/code work:

- Admin Catalog inventory uses DB-first rows from `catalog_inventory_items` with bundled JSON fallback.
- Build 150 fixed blank DB images masking bundled fallback images.
- Build 151 added `/api/admin/media_library_list`, media-library picker support, selected-row image repair, duplicate-image diagnostics, and browser image health scan.
- Build 155 repaired the Cloudflare Pages Functions deploy blocker in `media_library_list.js`, removed duplicate landing-page normalization keys, and added deploy-safety release checks.
- Keep `admin-catalog.html` and `admin-catalog/index.html` synchronized.
- Keep `SUPABASE_SCHEMA.sql` and `sql/*.sql` synchronized with every schema-related update.
- Keep `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `SANITY_CHECK.md`, and handoff docs updated every pass.
- Continue one-H1-per-exposed-page checks, local SEO wording, CSS layout checks, and redirect-loop avoidance.

Important release command:

```bash
python scripts/release_check.py
```

<!-- Build 155 sync 2026-05-18 -->

## Build 155 synchronization note

Build 155 repairs Cloudflare Pages Functions deploy packaging after Build 152: root `/functions/api/*.js` imports now resolve through `./_lib/...`, helper libraries are mirrored where legacy flat route files expect them, and the deploy-safety check now verifies relative import resolution in addition to syntax, esbuild-sensitive regexes, and duplicate landing-page keys.


## Build 155 Cloudflare root import release-check hotfix - 2026-05-18

Build 155 repairs the remaining root Cloudflare Pages Function import paths that could still break deployment after Build 154. Four root `/functions/api/*.js` files still used `../_lib/...`; root routes must use `./_lib/...`. Build 155 fixes those files, keeps the stale-route shims, wires the stale-root import guard into the release checklist, and updates the release runner so the full check can complete in this sandbox.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.


## Next 20 value-added steps after Build 156

1. Run the Build 156 social queue SQL migration in Supabase.
2. Add a Social Queue card to staff role training notes so detailers know drafts are not public posts yet.
3. Decide the first direct-post platform: recommended order is Facebook/Instagram, Google Business Profile, X, TikTok, then YouTube Shorts.
4. Add per-platform caption length warnings and media-count warnings.
5. Add a privacy checklist before any customer vehicle/photo can be marked ready.
6. Add license-plate blur/cover reminder fields to the media workflow.
7. Add customer consent flags for public before/after use.
8. Add a reusable caption template library for job type, vehicle size, service area, and upsell language.
9. Add platform-specific hashtag presets for local SEO and discovery.
10. Add OAuth setup notes and token rotation guidance for each social platform.
11. Add a direct Meta/Facebook Page adapter after the app permissions are approved.
12. Add an Instagram Business publishing adapter after Meta media-container requirements are confirmed.
13. Add a Google Business Profile recent-work publishing path after the Google account scope is finalized.
14. Add a TikTok direct-post adapter only after app review and creator authorization are confirmed.
15. Add a queue calendar so posts can be scheduled by day/time.
16. Add duplicate-content warnings when the same photo/caption is queued twice.
17. Add analytics fields for clicked progress links and posted platform URLs.
18. Add customer-friendly public gallery promotion rules from approved job media.
19. Add fallback export buttons: copy caption, download media list, and open platform composer.
20. Add social performance notes back into the booking/customer history for future marketing decisions.