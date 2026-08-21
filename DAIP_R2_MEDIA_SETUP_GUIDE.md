> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# Build 248 follow-up — reviewed story evidence and retry controls

After the Build 247 private-ingestion migration, also apply `sql/2026-08-09_build248_supplier_daip_story_review.sql`. Build 248 does not change the R2 privacy boundary. It adds human story-evidence selection/order, processing retry/dead-letter metadata, Creative Project content-package readiness and a human review gate.

Acceptance after upload: open `/admin-daip-media.html`, mark harmless uploaded media selected/excluded for story use, exercise a harmless failed-job retry/dead-letter flow, then open `/admin-creative-projects.html` to verify the private evidence/readiness summary. Raw object keys remain private and approval does not publish.

---

# DAIP Private R2 Media Setup Guide — Build 247

**Purpose:** configure the private storage and application binding required for large raw Creative Project media such as MOV, MP4, JPG, JPEG, PNG, HEIC, HEIF, M4V and WebM files.

## Architecture

- `rosie-assets` stays the public/website bucket.
- Create a separate **private** bucket named `rosie-daip-media` for raw Creative Project masters.
- Bind that bucket to the Rosie Dazzlers Cloudflare Pages project as `DAIP_MEDIA_BUCKET`.
- Raw files upload through `/admin-daip-media.html` in resumable multipart chunks.
- Supabase stores metadata, part ETags, audit state and processing-job records only; it does not store the raw video bytes.
- Completed raw masters remain private. Approved derivatives may be copied to public storage only through a later reviewed workflow.

## Part A — Create the private R2 bucket

1. Sign in to Cloudflare.
2. In the left navigation, open **R2 Object Storage**.
3. Select **Create bucket**.
4. Enter bucket name: `rosie-daip-media`.
5. Use the normal/default jurisdiction unless you have a specific data-residency requirement.
6. Create the bucket.
7. Open the new bucket and select **Settings**.
8. Confirm **Public Development URL / r2.dev** is disabled.
9. Confirm there is **no Custom Domain** attached to this bucket.
10. Do not put raw customer/project masters into `rosie-assets`.

### Optional Wrangler equivalent

```bash
npx wrangler login
npx wrangler r2 bucket create rosie-daip-media
npx wrangler r2 bucket list
```

## Part B — Bind the bucket to Rosie Dazzlers Pages

1. Open Cloudflare **Workers & Pages**.
2. Select the Rosie Dazzlers Pages project that serves the application.
3. Open **Settings**.
4. Open **Bindings**.
5. Select **Add**.
6. Choose **R2 bucket**.
7. Under **Variable name**, enter exactly:

```text
DAIP_MEDIA_BUCKET
```

8. Under **R2 bucket**, choose:

```text
rosie-daip-media
```

9. Save the binding.
10. If Cloudflare shows separate Preview and Production binding sections, repeat the same binding for both.
11. Redeploy the Pages project. Binding changes are not available to an already-running deployment until redeployed.
12. Open `/admin-daip-media.html`.
13. Select **Refresh status**.
14. The Setup panel should report `Ready · DAIP_MEDIA_BUCKET`.

## Part C — Apply the Build 247 Supabase migration

1. Open Supabase Dashboard.
2. Open the Rosie Dazzlers project.
3. Open **SQL Editor**.
4. In the Build 247 ZIP, open:

```text
sql/2026-08-07_build247_daip_private_media_ingestion.sql
```

5. Copy the complete file into a new SQL query.
6. Run it in staging/preview first.
7. Confirm these tables exist in **Table Editor**:

```text
daip_project_media_assets
daip_media_upload_sessions
daip_media_upload_parts
daip_media_processing_jobs
```

8. Confirm Row Level Security is enabled on all four tables.
9. Confirm anonymous/authenticated users do not have direct table privileges.
10. Reload `/admin-daip-media.html`.

## Part D — Create the three historical detailing projects

Create one Creative Project per detailing job.

1. Open `/admin-creative-projects.html`.
2. Select **New creative project**.
3. Enter a descriptive internal title, for example `Black SUV Paint Correction — Historical Project 1`.
4. Keep project type `detailing`.
5. Use `Standalone creative project` unless the historical project maps to an existing Rosie booking.
6. Set consent status based on the actual permission you have. If uncertain, choose `Not reviewed` or `Internal only`.
7. Save the project.
8. Repeat for Project 2 and Project 3.
9. Open the saved project and select **Upload raw DAIP media**.

## Part E — Upload the raw photos and videos

1. Open `/admin-daip-media.html`.
2. Choose the correct Creative Project.
3. Choose the closest capture stage: Before, During process, After, Interior, Exterior, Engine, Damage/Evidence, or Mixed/Other.
4. Select the current consent state. This does **not** publish anything.
5. Drag files into the upload box or use the file picker.
6. Select **Upload queued files**.
7. Rosie uploads sequential 32 MB multipart chunks.
8. Leave the browser open while an individual chunk is being sent. You may pause after the current chunk.
9. If Wi-Fi or the browser fails, reopen the page, choose the same Creative Project, reselect the same local file, and upload again. The server recognizes the filename/size/fingerprint, reloads recorded part ETags and skips the completed chunks.
10. When finished, the project media library should show `uploaded`.
11. The raw R2 object key should resemble:

```text
projects/<project-uuid>/raw/video/<asset-uuid>/<filename>.MOV
```

or:

```text
projects/<project-uuid>/raw/photos/<asset-uuid>/<filename>.JPG
```

## Part F — Verify privacy and audit state

In Supabase Table Editor:

1. Open `daip_project_media_assets`.
2. Confirm `privacy_status = private_internal`.
3. Confirm `public_destination_enabled = false`.
4. Confirm `is_raw_original = true`.
5. Open `daip_media_upload_sessions` and confirm the completed upload is `uploaded`.
6. Open `daip_media_upload_parts` and confirm the multipart ETags exist.
7. Open `daip_media_processing_jobs` and confirm downstream jobs were queued.
8. Do not paste raw customer media URLs, credentials, or private information into Startup evidence notes.

## Part G — Interruption/resume acceptance test

Before importing all three projects, prove recovery with a harmless large video.

1. Start an upload larger than 300 MB.
2. Wait until several chunks complete.
3. Disconnect Wi-Fi or close the tab.
4. Reconnect/reopen Rosie Dazzlers.
5. Choose the same Creative Project.
6. Reselect the exact same local file.
7. Select Upload.
8. Confirm the progress begins from already-recorded chunks rather than zero.
9. Complete the upload.
10. Confirm there is only one uploaded raw master for that filename/size in the project.

## Optional Part H — Processing Queue binding

Build 247 records processing jobs in Supabase whether or not a Cloudflare Queue is configured. A future DAIP processor can consume them.

If a processing Queue is created later, bind it to Pages as:

```text
DAIP_PROCESSING_QUEUE
```

Once present, completed media uploads attempt to dispatch processing-job messages to the queue. The database remains the durable record if queue dispatch is unavailable.

## What Build 247 does now

- private multipart upload
- >300 MB raw video support through chunks
- retry/resume from recorded parts
- duplicate-master protection
- immutable raw-master policy at the intake UI
- Creative Project linkage
- metadata/audit tables
- queued proxy/frame/audio/transcript/scene-analysis work
- no automatic public publishing

## What still needs the processor build

A separate processing runtime is still required to actually run FFmpeg/transcoding, frame extraction, audio extraction, transcription, scene analysis and final MP4 rendering. Build 247 creates the secure ingestion layer and durable processing queue required for that processor. The next implementation wave should deploy the processing consumer and rendering adapter without changing the raw-master design.

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- Build 210 documentation sync -->
<!-- Build 211 documentation sync -->
<!-- Build 212 documentation sync -->
<!-- Build 213 documentation sync -->
<!-- Build 214 documentation sync -->

> **Build 237 synchronization (2026-07-28):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->

<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Specialist runbook: STARTUP_GO_LIVE_BLOCKERS.md | Inventory recovery: reviewed existing-row Amazon refresh -->

<!-- BUILD250_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public services clarity + rosie-assets/CarPhotos runtime manifest -->

<!-- BUILD251_SYNC: 2026-08-11 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Gate C dark-theme readability + approved rosie-assets/CarPhotos context -->

<!-- BUILD252_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public packages/landing_pages/CarPhotos R2 assignment -->

<!-- BUILD253_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Photo Studio: /admin-photo-studio.html | Public manifest: /api/public_website_images | Migration: sql/2026-08-12_build253_photo_management_studio.sql -->
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images protected; explicit Photo Studio override only; automatic R2 matching fallback-only; Photo Studio reflow hotfix. -->

<!-- BUILD255_SYNC: 2026-08-12 | Photo Studio click-to-edit drawer + explicit grouped website target dropdown; no automatic image reassignment. -->
<!-- BUILD256_SYNC: 2026-08-12 | Photo assignment labels + checked occupied targets + explicit Before/After pairs; no automatic image reassignment. -->

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
