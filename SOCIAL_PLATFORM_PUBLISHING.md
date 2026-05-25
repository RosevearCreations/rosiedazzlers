> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 171 documentation sync note

**Updated:** 2026-05-24

This Markdown file was reviewed during the Build 171 pass. Current source of truth remains `DEVELOPMENT_ROADMAP.md`. Build 171 adds the Admin Leads quote-starter workflow and no new DDL.

---
# Social Platform Publishing — Build 159

**Updated:** 2026-05-20

Build 159 keeps Rosie Dazzlers social publishing review-first. Job/crafting photos and summaries can become internal drafts, but API publishing still requires the Build 158 review gate: customer/public-use consent, plate/privacy review, and no private customer information in the caption.

## Current workflow

1. Admin Progress can create draft social posts from job/crafting updates.
2. Admin Social Queue can create manual drafts.
3. Staff can choose a caption template and hashtag preset.
4. Staff can add a planned publish time.
5. The queue shows planned-time badges and duplicate warnings.
6. Staff must approve the review checklist before API publishing.
7. Staff can use API publishing, webhook publishing, manual copy/paste, or mark-posted URL capture.

## Platform status

- X: direct text publish path exists when credentials are configured.
- Facebook Page: direct text/photo path exists when Meta Page credentials are configured.
- Instagram Business: direct media container + publish path exists when Meta credentials and public media URLs are configured.
- TikTok, Google Business Profile, LinkedIn, and YouTube Shorts: keep on webhook/manual fallback until app approvals and OAuth flows are finalized.

## Build 159 additions

- `social_templates_list` endpoint for caption and hashtag options.
- Caption template picker.
- Hashtag preset picker.
- Planned publish time.
- Duplicate warnings using `duplicate_signature`.
- Posted URL and optional platform ID capture for manual posts.
- SQL support for social metrics snapshots.

# Build 158 update — Social review gates and local caption templates

**Updated:** 2026-05-20  
**Current build:** Build 158

Build 158 continues the Build 156/157 social publishing workflow and makes it safer before any job/crafting-progress photo or summary is pushed to X, Facebook, Instagram, TikTok, Google Business Profile, or manual/webhook channels.

## Completed in Build 158

1. Added `functions/api/_lib/social-compliance.js`.
2. Added customer/public-use consent checks for social drafts.
3. Added license plate, face, address, and private-identifier review checks.
4. Added no-private-customer-info caption review.
5. Added platform warning generation for X length, Instagram media requirements, TikTok media requirements, Facebook media recommendations, and Google Business Profile local wording hints.
6. Added `Approve & ready` review action in Admin Social Queue.
7. Blocked direct `Publish/API` unless a draft is marked ready and the review gate passes.
8. Added fallback-safe inserts if the Build 158 SQL migration has not been applied yet.
9. Added fallback-safe social queue reads when new review columns do not exist yet.
10. Added review checklist controls to Admin Social Queue manual draft creation.
11. Added review checklist controls to Admin Progress social draft creation.
12. Updated immediate push workflow to approve-ready first, then publish only if the review gate passes.
13. Added review badges and platform warning display to Admin Social Queue cards.
14. Added `social_caption_templates` table.
15. Added `social_hashtag_presets` table.
16. Seeded local caption templates for Southern Ontario, Oxford County, Norfolk County, and Tillsonburg-style posts.
17. Seeded local hashtag presets for Rosie Dazzlers local discovery.
18. Added `duplicate_signature` on queued posts to support future duplicate-content warnings.
19. Updated social workflow release checks for Build 158 markers.
20. Updated Markdown and schema notes for the new social review gate.

## Next 20 value-added steps after Build 158

1. Apply the Build 156 social queue migration if it has not already been run.
2. Apply `sql/2026-05-20_build158_social_review_gates_and_templates.sql`.
3. Test Admin Progress with one internal job update and one media URL.
4. Confirm a draft is created with platform warnings in Admin Social Queue.
5. Confirm `Publish/API` is blocked until `Approve & ready` is clicked.
6. Add a duplicate-content warning in the Admin Social Queue UI using `duplicate_signature`.
7. Add a template picker that loads `social_caption_templates` from the DB.
8. Add a hashtag preset picker that loads `social_hashtag_presets` from the DB.
9. Add a scheduler calendar for planned posting times.
10. Add a posted URL capture form for manual posts.
11. Add customer-facing consent capture on the booking/progress flow.
12. Add media-crop/blur status fields for license plates and private identifiers.
13. Add staff training notes explaining that drafts are not public until approved/published.
14. Add platform-specific preview cards for Facebook, Instagram, X, TikTok, Google Business Profile, and manual.
15. Add basic post analytics fields: clicks, views, likes, comments, shares, and last checked time.
16. Add webhook payload signing/verification documentation for Make/Zapier/n8n bridges.
17. Add scheduled retry rules for failed webhook/API attempts.
18. Add a public gallery promotion workflow that only uses approved social media rows.
19. Add Google Business Profile post/manual workflow notes once the account flow is finalized.
20. After deploy is stable, consider a clean-branch/orphan upload to remove stale GitHub files that web upload does not delete.

---

# Social Platform Publishing Plan

## Build 157 status

Build 157 extends the Build 156 review queue into a safer publishing bridge. When staff post job or crafting-process photos and summaries in Admin Progress, they can now create social drafts automatically and optionally try approved API/webhook publishing right away.

Admin Social Queue now supports:

- `Publish/API` for configured direct API attempts.
- `Send webhook` for Make, Zapier, Buffer, Metricool, or another automation bridge.
- `Copy text/media` for manual posting anywhere.
- `Mark posted`, `Ready`, and `Skip` for audit-friendly review.

## Direct/API support added

Build 157 can attempt direct publishing for:

- X text posts through the X API.
- Facebook Page text/photo posts through the Meta Graph API.
- Instagram Business image/video media publishing through the Meta Graph API.

The code intentionally keeps TikTok, Google Business Profile, LinkedIn, YouTube Shorts, and any unsupported platform on webhook/manual fallback until their app review, OAuth, and posting requirements are fully approved.

## Cloudflare Pages environment variables

Recommended variables:

```text
X_ACCESS_TOKEN
FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN
INSTAGRAM_BUSINESS_ACCOUNT_ID
INSTAGRAM_ACCESS_TOKEN
META_PAGE_ACCESS_TOKEN
META_GRAPH_VERSION
SOCIAL_DISPATCH_WEBHOOK_URL
SOCIAL_DISPATCH_WEBHOOK_SECRET
```

Only configure the variables for platforms that are approved and ready. The readiness panel shows whether each connection appears configured without exposing secret values.

## Safe workflow

1. Staff posts a progress update or media URL in Admin Progress.
2. If social drafts are enabled, the system creates one draft per selected platform.
3. If immediate push is enabled, the system attempts API/webhook dispatch.
4. If dispatch fails or a platform is not wired, the draft remains visible in Admin Social Queue.
5. Staff can copy, webhook, mark posted, or skip the draft.

## Why this approach

This avoids accidental public posting while still making it possible to push progress content outward when credentials and approvals are ready. It also keeps a database audit trail in `social_post_queue` and `social_dispatch_attempts`.

## Next improvements

- Per-platform templates and length warnings.
- Batch publish selected drafts.
- Scheduled publishing windows.
- Privacy checklist for license plates, faces, and addresses.
- Webhook recipe guide for TikTok, Google Business Profile, LinkedIn, and YouTube Shorts.

---

## Build 161 sync note

Build 161 keeps `DEVELOPMENT_ROADMAP.md` as the source of truth and advances the competitor-aligned conversion path with Booking service chooser guidance, package aliases, and photo-estimate CTAs.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.
