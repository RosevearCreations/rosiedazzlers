# Build 841 — Customer/Detailer Job-Day Mobile Journey, Accessible Exception Recovery & Socials Creator

**Source status (November 10, 2026): implemented and locally tested.** Protected `dev`/`main` merge and production exact-SHA deployment remain separate release checks; this document does not claim a deployed GREEN result or original customer/provider acceptance.

## Customer and detailer experience

- Customer `progress` and authenticated Detailer Mobile routes receive four job-day guidance steps, 48px+ touch controls, keyboard focus, live connection announcements and accessible, manual refresh/resume shortcuts. Both customer progress routes stay identical.
- Offline/failure copy says the visible state can be stale, and explicitly requires a server refresh before a second signoff, approval, upload, payment, or job transition. There is **no offline mutation queue or automatic replay**. Detailer assignment checks, arrival setup, quality signoffs, operator review and customer consent stay authoritative in their existing endpoints.
- Staff launcher, customer app and internal workflow cards have local theme photos with meaningful illustrative alt text and responsive aspect ratios. New original images were generated for job-day detailing, Socials creation and the private DAIP media desk; other cards use already-approved Standard theme imagery. Public service visual-brief cards now show illustrative photos, explicitly **not** fabricated before/after proof.

## Source-tagged Socials creation

1. Open **Socials → Create from Job** or `/admin-social.html#jobMedia841` with staff permission.
2. Load a bounded list of recent active/completed jobs, choose a job and inspect upload **metadata only**. No customer names, progress tokens, private signed URLs, private object keys, or raw photo bytes are returned.
3. Explicitly create or reopen the existing booking-linked private DAIP Creative Project (same source booking). Select a source upload and **Tag selected upload in DAIP**. The private audit stores a job-media UUID; no media copy or publication occurs.
4. Draft a customer-safe caption for chosen platforms. The server requires a matching job, media source and DAIP project, and a previous tag. The social queue gets only a source ID and **text-only drafts** with `status=draft`, `review_status=needs_review`, `public_url=null`, no media URLs and privacy flags unconfirmed. Cross-booking media is denied.
5. For photos/video, an authorized operator must separately upload or approve a derivative through DAIP/Photo Studio, record actual public-use consent, remove plates/faces/addresses and explicitly supply a public asset to a reviewed Social Queue draft. The existing social `approve_ready` and `publish_api`/webhook actions remain human-triggered and provider-credential gated. This build makes **no automatic or live platform post** and does not assert that any social OAuth channel is currently connected.

## Original proof still needed

- Real customer/worker phone/tablet acceptance, signed owner and consent evidence, social provider credentials, authorized derivative review and publication receipt; all stay **HOLD** until independently verified.
- A private job-media source tag is **not** a DAIP raw-media import. Deliberate secure copy/import with verified consent and object provenance requires its own storage workflow if needed; this build does not open that trust boundary.
- No new Supabase table, RLS bypass, grants, sensitive environment values or cross-application network write. Existing `creative_project_audit` and `social_post_queue` records are used.

## Verification

Run `node scripts/build841_jobday_social_media_test.mjs` and `bash scripts/current_booking_wizard_regression.sh`.

The Build 841 test covers unauthorized access, sanitized recent-job/media reads, cross-booking rejection, mandatory source tagging, zero photo copy, review-only two-platform drafts, no private URLs/progress tokens, local image asset presence, both customer/detailer mobile routes and source card placement. The project-level Supabase/provider integration and real owner device checks remain external.

**Proposed next Build 842:** Job-Day Owner Device Acceptance & Consent-Safe DAIP Approved-Derivative Handoff, with original proof and human publishing decision preserved.
