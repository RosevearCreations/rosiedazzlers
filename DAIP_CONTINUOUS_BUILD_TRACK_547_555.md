# DAIP — Continuous Rosie Dazzlers Media Intelligence Workstream (Builds 547–555)

The user has real detailing jobs with MP4/MOV/JPG footage from several camera angles and wants useful production outputs, not a new standalone app. Build 247/248 already supports private resumable R2 intake, Creative Projects, internal story-evidence review and processing job records. Our successive releases must improve this exact application, not rebuild or duplicate its media store.

## Milestones across the next release queue

| Rosie build | DAIP milestone | Acceptance/evidence before extending |
|---|---|---|
| **547** | Multi-camera private editorial storyboard; tag source angles, before/process/after selection, private downloadable edit brief for future workers | Actual selected Creative Project assets, private-only route, missing-evidence/consent flags, no media rendering/publishing |
| **548** | Intake verification: duplicate/media integrity, duration/camera identifiers, proxy generation planning, secure per-project processing worker interface and bounded job retries | Confirmed private R2 objects, MIME/duration and object key ownership, worker cost/CPU constraints; no fabricated transcodes |
| **549** | Video proxy/thumbnail/transcript job observability, audio licensing/source checks, human privacy review workflow for faces, plates, addresses and customer metadata | Redaction test artifacts and source-owned consent; approved derivatives only |
| **550** | Multi-camera scene alignment and shot quality review: timecodes, scene scores, shake/exposure focus, before-to-after correspondence, timeline assembly | Explicit camera clock offsets or editor-confirmed sync; reviewable edits and retryable failures |
| **551** | First operator video editing workspace: trims, reorder, format/crop safe regions, speed, captions, brands and audio choices; draft preview player | Manual save/revise, no raw public URL; rendering must be approved and worker-supported |
| **552** | Bounded server-side FFmpeg render/export pipeline with queued worker, private branded 16:9/9:16/4:5 derivatives, watermark/privacy review and budgets | Video files actually rendered, inspected, verified, and tracked under private destination; no social posting |
| **553** | Social content package: YouTube full story, three Facebook variations, five IG Reels and five TikTok cuts, thumbnail candidates, job-specific captions/hashtags, SEO and blog/GBP/website gallery drafts | Clip-specific footage, town/service claims source-owned, platform specs, reviewable copy, privacy approvals |
| **554** | Human edit/approve/schedule/export and external platform publishing authorization, per-platform dispatch ledger, rollback/withdrawal and consent refresh | Explicit operator approval per asset/channel, supported API credentials/scopes/limits and live private/public boundary |
| **555** | Quality, ROI and reliability review; compare processed projects, edit effort, watch engagement, funnel attribution, delivery cost, worker quotas and backlog; new DAIP roadmap | Empirical output/engagement/provider measurements only, explicit sampling and confounders, no invented performance |

## Work with the footage already on hand
Start with **one real detailing Creative Project**, then the other jobs. Batch upload multiple angles with existing authenticated resumable chunks, distinguish before/process/after, set private selected story evidence and exact camera angle, produce a private storyboard, then later process proxies and approved videos. Track lost/nonconsenting/damaged clips as explicit gaps. Human-reviewed publish/export only after proof of privacy and consent. Source IDs, job IDs, audio rights and client identity stay private.

## Non-negotiable limits
Private raw masters stay immutable in `DAIP_MEDIA_BUCKET`, not the public `rosie-assets` bucket. Customer names, faces, house numbers, plates, VINs, addresses, payment and evidence imagery are not exported/published without redaction, consent and explicit approval. Never present a draft plan as a rendered movie, a queued processor job as completed or a social-platform post as published. Preserve bookings, finance, R2 capacity and Cloudflare worker CPU budget, with no paid services required for unimplemented prototype steps. DAIP releases must pass a dedicated regression and protected-main/Cloudflare exact-SHA evidence before Production GREEN.

### Build 548 active work
Private metadata-only DAIP intake report compares Creative Project asset IDs, private R2 key ownership, MIME/size, candidate duplicates, multipart session identity, and recorded video duration. It does **not** perform an R2 HEAD, transcode a proxy or publish. Source-owned worker execution needs a later observed integration.
