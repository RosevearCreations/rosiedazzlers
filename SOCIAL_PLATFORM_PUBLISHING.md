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
