# CURRENT LIVING AUTHORITY 2 OF 2 — Build 264 Modular Runtime Roadmap

**Updated:** 2026-08-25

## P0 — Reliability + modular runtime

Build 264 begins the runtime migration while preserving Build 262 CPU acceptance as a go-live gate. The architectural objective is not merely fewer timers; it is that an entire subsystem should remain unloaded/asleep when operational state does not require it.

### Completed in Build 264

- Four canonical app entries exist under `/app/`.
- Staff module launcher performs auth/module choice only; it does not preload subsystem datasets.
- Detailer Mobile is the first active modular runtime.
- Detailer base workspace is bounded to 80 current/future rows with a small historical overlap.
- Crew/unread feed fan-out is deferred from base Detailer load until live work is actually opened.
- No Detailer `setInterval` or recurring live-job read is permitted.
- Arrived/Detailing/Paused state dynamically loads the separate live-job bundle.
- Job mutation responses update local state rather than forcing a follow-up workspace refresh.
- Signed media uploads send binary data browser → storage rather than through Cloudflare Functions.
- Detailer live/feed/media APIs have canonical `/api/detailer/*` facades while reusing existing authoritative handlers.
- Current PWA cache identity is Build 264; the heavy live-job bundle is intentionally not precached.

### Next — Build 265 Operations runtime

Migrate the first Operations group as a real shell runtime:

1. Today / needs-attention summary.
2. Schedule + blocked days.
3. Assignment.
4. Live-job oversight / progress.
5. Explicit operational state contract: blocked, open-idle, scheduled, active, wrap-up.
6. Blocked/no-active-job state must disable live monitoring and live-photo/watch behavior.
7. Same-browser refresh leadership may be enabled only for a genuinely necessary recurring read and never below the established safe interval floor.

### Still P0 before go-live

- Exceeded CPU Time Limits must remain 0 during representative usage.
- Persistent Cloudflare observability should be enabled safely after current Pages configuration is imported/verified.
- Booking/payment/refund/webhook, inventory posting/reversal, notification delivery, backup/rollback, permissions and mobile acceptance remain required.

---

# CURRENT LIVING AUTHORITY 2 OF 2 — Build 263 Architecture Foundation

**Updated:** 2026-08-21  
**Purpose:** Establish the four-shell Rosie architecture without weakening the Build 262 CPU-stabilization gate.

## Direction

The next architectural program is to convert the existing all-in-one interface into four independently loadable shells backed by the same secured platform: Customer, Detailer Mobile, Operations/Supervisor, and Business Administration. The public SEO website stays static-first and routes interactive work into the Customer shell.

## Build 263 foundation priorities

1. Keep Build 262 CPU acceptance as the deployment gate.
2. Adopt `data/build263_app_modules.json` as the initial shell registry.
3. Use `data/build263_route_migration_matrix.csv` to assign every current top-level interface to a future owner.
4. Keep customer and staff authentication separate while resolving module grants after sign-in.
5. Add a small shared app-core rather than a new framework rewrite.
6. Make module access distinct from action capabilities.
7. Formalize business-day/job runtime states and wake/sleep rules.
8. Default every recurring timer to OFF unless state and visibility require it.
9. Use one same-browser refresh leader so multiple tabs cannot multiply polling.
10. Migrate Detailer Mobile first and prove zero live-job monitoring when no eligible job is active.
11. Migrate Today/Schedule/Live into Operations and suppress live monitoring on blocked/no-active-job days.
12. Move back-office screens into lazy Business Administration groups.
13. Keep accounting, payments, inventory transactions, permissions and private media authoritative server-side.
14. Move bounded filtering/searching/drafts/image preprocessing to the browser where safe.
15. Move large aggregation/filtering to Postgres rather than Worker JavaScript.
16. Keep public SEO/service/town pages static/crawlable and one-H1 compliant.
17. Preserve existing routes as compatibility entries during staged migration.
18. Extend Runtime & CPU Diagnostics with active-module labels during runtime implementation.
19. Measure API call counts and Cloudflare CPU before/after each migrated workflow.
20. Split deployments/repositories only if later evidence shows a real operational/security need; do not create four codebases now.

## Permanent modular rule

Every new feature must identify: owning shell, allowed identity/capability, operational wake condition, and justification for any recurring server call.

---

# CURRENT LIVING AUTHORITY 2 OF 2 — Build 262

**Updated:** 2026-08-20  
**Purpose:** Current business/engineering direction. Read `AI_PROJECT_HANDOFF.md` first for exact implemented/deployment state.

## Priority shift — reliability before feature expansion

Rosie remains in controlled test mode, but Cloudflare recorded 2,244 exceeded-CPU terminations in the incident window. The business priority is therefore to stabilize the application before adding another major subsystem. Reliability work protects every later booking, payment, photo, accounting and DAIP workflow.

## Build 262 value delivered

- Removes the highest-volume browser-generated Worker traffic found in source: 30-second Admin Analytics fan-out, default 15-second Live Operations polling, 20-second Progress polling and analytics heartbeat/event fan-out.
- Batches public analytics and makes telemetry fail open instead of competing with customer/admin workflows.
- Moves heavy analytics rollup computation into Supabase/PostgreSQL rather than Cloudflare Worker JavaScript.
- Removes automatic Photo Studio replay after 5xx so a CPU termination cannot immediately amplify into another expensive invocation or accidental repeated write.
- Compacts routine API JSON responses and combines multi-key app-setting reads to reduce common-path CPU/payload overhead.
- Adds browser-local Runtime & CPU Diagnostics with route/status/wall-time/Ray evidence and no extra Worker storage request.
- Adds a source-risk inventory of actual request handlers so remaining optimization can be evidence-directed rather than random.
- Keeps static Pages traffic outside Functions and preserves the existing image/SEO/mobile/security boundaries.

## Current next 20

1. Apply `sql/2026-08-20_build262_cpu_safe_analytics_rollups.sql`.
2. Deploy Build 262 Pages + Functions together and prove Build 262 cache/script/service-worker parity.
3. Exercise representative admin workflows and export Runtime & CPU Diagnostics if any API returns 5xx/network failure.
4. Verify Admin Analytics no longer creates background requests while left open.
5. Verify Live Operations is manual by default and hidden-tab safe.
6. Verify customer Progress polling is no faster than 120 seconds.
7. Verify public analytics batching and circuit-breaker behavior with harmless browsing.
8. Safely enable persistent Cloudflare Workers Logs using the downloaded current Pages configuration; do not replace dashboard bindings with a hand-written partial config.
9. Observe a representative test window and target **Exceeded CPU Time Limits = 0**.
10. Group any remaining CPU/resource events by pathname and compare with the packaged source-risk audit.
11. Optimize only routes supported by measured evidence; move SQL aggregation/filtering into Postgres where practical.
12. Confirm no retry amplification or partial-write duplication on 5xx/1102-style failures.
13. Re-run booking/deposit/final-balance/refund/webhook acceptance after CPU stabilization.
14. Re-run vehicle-size correction and Quote Pipeline acceptance.
15. Re-run Photo Studio sync/multi-placement/reset and Media Health acceptance.
16. Complete inventory posting/reversal/idempotency acceptance.
17. Complete email/SMS provider delivery and failure evidence.
18. Resume real-device CSS/accessibility and public SEO/local-proof acceptance.
19. Resume private DAIP processor/derivative implementation only after ordinary Worker stability is proven.
20. Rehearse restore/rollback and then move toward a controlled invite-only soft launch.

## Permanent CPU/reliability guardrails

- No routine admin/customer API polling faster than 60 seconds; prefer initial load + manual refresh.
- Pause optional refresh while the page is hidden.
- Non-essential telemetry must fail open and must not aggressively retry.
- Do not aggregate very large datasets in Worker JavaScript when SQL can perform the work.
- No automatic retry of non-idempotent writes after 5xx/resource termination unless state is first checked.
- Keep routine response serialization compact.
- Keep Pages Functions scoped to `/api/*`; static assets must not depend on the Functions runtime.
- One public H1, concise titles, honest local relevance, responsive/mobile CSS and accessibility remain required during reliability work.

---

# CURRENT LIVING AUTHORITY 2 OF 2 — Build 261

**Updated:** 2026-08-19
**Purpose:** Current business/engineering direction. Read `AI_PROJECT_HANDOFF.md` first for exact implemented/deployment state.

## Build 261 value delivered

- Staff photo work no longer generates public engagement analytics, reducing avoidable Functions traffic and console noise.
- A transient 5xx cannot immediately strip cached static presentation assets when a safe service-worker copy exists.
- Photo assignment writes are lower-cost and retain explicit multi-placement/reset semantics.
- The owner can export the exact current list of known image-placement targets that have no deliberate Photo Studio override, making visual completion a printable operating task rather than a code audit.
- DAIP Test Lab keeps all internal-only protections while removing preventable input-format 400s.
- Startup/cache diagnostics stay build-coherent instead of introducing another expected/fetched mismatch.

## Current next 20

1. Deploy Build 261 and verify Startup/Cache Health reports Build 261 runtime assets.
2. Test one Photo Studio second placement, refresh, and confirm both placements remain listed.
3. Reset one of those placements and confirm only that location returns to its authored/default image.
4. Export the live unassigned-placement CSV and print checklist; prioritize public/customer-facing placements before optional admin visuals.
5. Fill the highest-value missing manual imagery: package cards, service/add-on detail pages, town/high-intent landing heroes, local/review proof, gift cards, maintenance, FAQ, gallery evidence/technique/efficiency, then secondary backgrounds/admin visuals.
6. Create one harmless DAIP test job through the generated safe reference workflow.
7. Capture Cloudflare Functions Metrics/Invocation Status evidence if another 503 affects APIs and static files together.
8. Continue booking/deposit/final-balance/refund/webhook production acceptance.
9. Verify external email/SMS delivery, retry and failure evidence.
10. Accept uncertain vehicle-size staff review and customer confirmation/cancellation flow.
11. Complete transactional inventory posting, shortage, idempotency and reversal acceptance.
12. Accept Quote Pipeline edit/follow-up/booking hand-off.
13. Finish catalog/supplier/image publish readiness.
14. Complete owner-editable service/add-on landing content and condition-dependent pricing explanations.
15. Populate Gallery with approved Before/After, Evidence, Technique and Efficiency proof.
16. Complete real-device CSS/mobile acceptance on booking, pricing, services, maintenance, fleet and admin photo workflows.
17. Complete keyboard/focus/label/contrast/reduced-motion accessibility review.
18. Verify Search Console, sitemap/canonicals/schema and Google Business Profile evidence.
19. Implement/accept the private DAIP processing consumer, retry/dead-letter and reviewed-derivative path.
20. Rehearse Supabase restore + Cloudflare rollback, then run a controlled invite-only soft launch.

## Permanent guardrails

- One public H1 per indexable page.
- Never silently replace an authored/default image; only explicit owner assignment can override it.
- Never expose private DAIP media through public Photo Studio/manifests.
- Keep public analytics off protected admin/client/detailer screens.
- Do not turn temporary network/runtime failure into destructive retries or duplicate non-idempotent writes.

---

# HISTORICAL LIVING AUTHORITY SNAPSHOT — Build 260

**Updated:** 2026-08-18
**Purpose:** Current business/engineering direction. Read `AI_PROJECT_HANDOFF.md` first for exact implemented/deployment state. Older Build sections below are retained history even where their original headings use “CURRENT”.

## Business and product direction

Rosie Dazzlers should continue differentiating on **simple mobile booking, transparent scope/vehicle sizing, strong real-work proof, detailed process explanations, owner-maintainable content, and reliable follow-up operations** rather than creating more disconnected admin screens.

A current Ontario competitor review on 2026-08-18 reinforces several useful patterns: local competitors prominently expose dedicated paint-correction/ceramic pages, clear mobile-service calls to action, package/service navigation, vehicle types, fleet/custom quote paths, gift cards or maintenance/subscription concepts, and strong visual proof. Rosie already covers most of those categories; our stronger opportunity is to connect them with clearer condition-dependent pricing, verified vehicle-size review, richer evidence/technique galleries, editable local proof, and a booking/quote workflow that explains uncertainty rather than hiding it.

Public comparison sources reviewed: `lvscardetail.com`, `rightcardetailing.ca`, `woodstockautospa.ca`, `detailingexperts.ca`, `rydenshine.ca`, `precisiondetailingco.ca`, and `blackstardetailing.ca`. Use these as market evidence, not copy templates.

## Build 260 value delivered

- Photo Studio sync is split into cursor-paged requests (one approved folder page per Worker invocation, up to 100 approved objects) with batched Supabase upserts so the growing R2 library does not consume one Worker invocation's subrequest budget.
- One photo can intentionally serve several website placements; any single placement can be reset to its authored/default image without affecting the others.
- Media Health now reports the managed public library rather than an old static requirements scanner, with only an explicit bounded public-delivery sample.
- Startup evidence is current/relevance-filtered; historical build migrations remain audit history instead of perpetual approval work.
- UI/cache health is version-aligned to Build 260 and the service-worker cache is current.
- DAIP page copy makes the operational path explicit: Creative Project → private raw-media intake → reviewed evidence/content package; Dry Run and Gate C retain their narrower validation/governance roles.
- Documentation is logically retired to two living planning authorities plus specialist references, without destructive deletion of historical release evidence.

## Current next 20

1. Deploy Build 260 and prove startup-script/UI-scanner/service-worker cache parity.
2. Apply outstanding Build 259 vehicle-size SQL and Build 260 startup/evidence/roadmap SQL in staging.
3. Accept bounded Photo Studio sync, multi-placement assignment and reset-to-default.
4. Accept database-first Media Health and the bounded delivery sample.
5. Run one harmless fresh Creative Project through the clarified private DAIP start flow.
6. Accept editable Quote Pipeline selection/edit/follow-up/booking hand-off.
7. Accept uncertain vehicle-size staff review and customer confirm/cancel correction flow.
8. Complete booking, deposit, final-balance, refund and webhook production acceptance.
9. Verify external email/SMS delivery, retry and failure evidence.
10. Complete transactional inventory posting, idempotency, shortage and reversal acceptance.
11. Finish catalog publish-readiness, supplier repair and sellable-item image review.
12. Finish deliberate public photo assignments, contextual alt text and local-proof review.
13. Complete owner-editable add-on landing content, pricing caveats and process explanations.
14. Populate Gallery with approved Before/After, Evidence, Technique and Efficiency proof.
15. Complete real-device CSS/mobile acceptance on booking, pricing, services, maintenance and fleet.
16. Complete keyboard/focus/label/contrast/reduced-motion accessibility review.
17. Verify Search Console, sitemap/canonicals/schema and Google Business Profile evidence.
18. Perform Supabase restore rehearsal and Cloudflare deployment rollback drill.
19. Implement and accept the private DAIP processing consumer, retry/dead-letter and reviewed-derivatives path.
20. Run a controlled invite-only soft launch with monitoring, incident and daily evidence review.

## SEO/local guardrails every pass

- One meaningful H1 per public/indexable page.
- Concise descriptive title and useful meta description; avoid repetitive town/service stuffing.
- Local pages must add genuine local/service value and approved proof rather than merely swapping town names.
- Use contextual HTML image alt text for informative images; mark genuinely decorative imagery accordingly.
- Keep package/add-on pricing caveats, quote-required states and condition-dependent services truthful and visible.
- Preserve fast mobile rendering and avoid public R2 inventory scans or other expensive request-time media discovery.

## Documentation policy

Only `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md` are living planning authorities. `STARTUP_GO_LIVE_BLOCKERS.md` is the specialist acceptance runbook, `DOC_INDEX.md` is navigation, schema/migration documents are technical references, and all remaining Markdown is historical/specialist evidence unless one of the two living authorities explicitly promotes it.

---

## Historical roadmap record retained below

Everything below this boundary is historical/specialist context and does **not** override the Build 260 direction above.

# CURRENT LIVING AUTHORITY 2 OF 2 — Build 259

**Updated:** 2026-08-13

## Immediate direction

Build 259 moves Rosie from scattered hard-coded presentation/operations controls toward owner-managed content without weakening existing safety boundaries. Highest-value acceptance is now: apply the vehicle-size review migration; validate one uncertain-size booking end to end; deliberately refresh/assign public presentation images through Photo Studio; complete the strongest add-on landing-page copy and photos; verify Pricing/Services/Maintenance/Fleet mobile layouts; and use the now-editable Quote Pipeline for real follow-up work. Next work should connect quote rows more directly to lead/customer lookup, add reusable preview/where-used links for Photo Studio, continue editable-content coverage for remaining static public prose, and complete production booking/payment/refund/notification acceptance.

# CURRENT LIVING AUTHORITY 2 OF 2 — Build 258

**Updated:** 2026-08-13

## Immediate photo-system direction

Build 258 makes explicit Photo Studio assignments the reusable presentation layer across the main public discovery pages while preserving existing authored images. Highest-value acceptance is now operational rather than architectural: Sync once after direct R2 changes, verify same-filename replacements refresh, deliberately assign review/local/service/gift/FAQ/Gallery slots, and remove only genuinely unassigned duplicates. Next media work should add page-preview/where-used links, version rollback, bulk metadata editing, image dimensions/quality warnings, and incremental/cursor R2 synchronization before raising scan limits.

# CURRENT LIVING AUTHORITY 2 OF 2 — Build 257

**Updated:** 2026-08-13

## Immediate reliability direction

Build 257 moves public-photo discovery off the request hot path. The managed media library is the source used by ordinary public/admin reads; R2 remains the object store and is synchronized deliberately. Highest-value acceptance is to deploy, hard-refresh Photo Studio, verify normal page loads no longer trigger Error 1102, run one explicit R2 sync, and then continue the existing assignment/Before-After workflow. Future media growth should use pagination/incremental sync rather than increasing one-request scan limits.

# CURRENT LIVING AUTHORITY 2 OF 2 — Build 256

**Build 256 value delivered:** Photo maintenance is now easier to audit before changing anything: thumbnail cards expose placement names, occupied placement choices are checked, and before/after storytelling is managed as intentional paired slots instead of remembering unrelated gallery positions. Existing authored imagery remains protected unless staff explicitly saves an override.

**Next photo-management priorities:** add full “where used” dependency reporting with page preview links; image replacement/version rollback; bulk metadata/alt editing; optional pair captions/project/town metadata; and a safe delete workflow only after dependency checks.

# CURRENT LIVING AUTHORITY 2 OF 2 — Build 255

> **Build 255 editor repair (2026-08-12):** Photo Studio thumbnails now open an immediate click-to-edit drawer with a grouped “Where should this image be used?” selector. Existing photos and assignments are not changed by this build; a placement changes only after an explicit target choice, **Use this image here**, and confirmation. R2-only photos may be registered as managed metadata when needed without assigning them. No new SQL migration is required. See `BUILD255_SUMMARY.md`.

# CURRENT LIVING AUTHORITY 2 OF 2 — Build 254

> **Build 254 hotfix (2026-08-12):** Existing configured product/package/add-on/landing imagery is protected again. Photo Studio explicit assignments are deliberate overrides; automatic R2 filename matching is fallback-only. Photo Studio selection/filter rendering was also hardened to reduce forced-reflow warnings. No new SQL migration is required. See `BUILD254_SUMMARY.md`.

# CURRENT LIVING AUTHORITY 2 OF 2 — Build 253

**Updated:** 2026-08-12
**Purpose:** Current business/technical direction. Read `AI_PROJECT_HANDOFF.md` first for exact implemented/deployment state.

## Build 253 value delivered — Photo Management Studio makes photos a managed business asset

The website can now be refreshed visually without repeatedly changing source code. Each approved public photo can have a human-readable name, R2 location, accessibility/SEO metadata, focal point, provenance notes, and explicit placement. This supports regular seasonal refreshes, better local proof, easier non-technical administration, and safer future content automation.

### Why this matters to the business model

- Real detailing photos can replace generic artwork steadily instead of waiting for a developer pass.
- A specific package/card/page can keep a deliberate image until the owners intentionally change it.
- Alt text and captions are maintained beside the photo rather than being scattered across HTML templates.
- R2 remains the file store, the existing media library becomes the metadata source of truth, and assignments explain where each image belongs.
- Filename matching remains useful for newly uploaded photos but no longer decides the final public placement when an owner assignment exists.
- Public proof and private DAIP customer media stay separate, preserving the consent/privacy boundary.

## Highest-value next 20

1. Apply Build 253 migration in staging and run an approved-photo sync.
2. Assign deliberate images to Premium Wash, Basic Detail and Complete Detail default cards.
3. Add vehicle-size package variants where the photo library has good small/mid/oversize examples.
4. Assign deliberate Interior Detail and Exterior Detail card images.
5. Review the highest-traffic add-on cards and replace weak/generic imagery.
6. Assign a strong hero image to every current service landing page with suitable proof.
7. Assign town-specific imagery only where it truthfully represents that service area.
8. Complete alt text for all public non-decorative managed photos.
9. Add image dimension/aspect-ratio health extraction and warnings.
10. Add a “where is this photo used?” dependency report before archive/delete/move actions.
11. Add replacement/version history with rollback for regular site refreshes.
12. Add bulk metadata editing for a selected R2 folder or tag.
13. Add duplicate/near-duplicate detection across public R2 imagery.
14. Add optional crop/focal presets by placement while preserving the original R2 master.
15. Feed approved DAIP derivatives into Photo Studio only after consent/privacy review.
16. Continue the DAIP processing consumer/proxy/frame/transcript work.
17. Finish large-video resume and retry/dead-letter acceptance using harmless media.
18. Continue end-to-end booking/payment/refund/notification production acceptance.
19. Review Search Console + Google Business Profile evidence before changing local SEO copy.
20. Continue one-H1, concise titles, honest local relevance, mobile/CSS, accessibility and release regression checks every build.

## Documentation policy

`AI_PROJECT_HANDOFF.md` and this file remain the only living planning authorities. `STARTUP_GO_LIVE_BLOCKERS.md` is an operational acceptance runbook. Build summaries and specialist documents are retained for evidence/history and must not become competing roadmaps.

<!-- Historical release guard: # CURRENT LIVING AUTHORITY 2 OF 2 — Build 252 -->

---

# CURRENT LIVING AUTHORITY 2 OF 2 — Build 252

**Updated:** 2026-08-12
**Purpose:** Current business/technical direction. For exact implemented state and deployment boundaries, read `AI_PROJECT_HANDOFF.md` first.

## Build 252 value delivered

- Approved public R2 imagery is now treated as a reusable website asset library rather than a set of individually hard-coded URLs.
- `packages/` is the first choice for principal package and add-on cards.
- `landing_pages/` is the first choice for dedicated service/location landing-page heroes and supporting galleries.
- `CarPhotos/` remains the broad IRL proof/fallback library for customer-facing context.
- Home-page high-intent service and town cards can display filename-matched real imagery.
- The public manifest is prefix-limited and deliberately separated from private DAIP media.
- Location-page structured data is narrowed to the relevant local service area while service pages remain county-wide.
- No additional thin location pages were created; image enrichment supports the existing SEO architecture instead of adding duplicate content.

## Current next work

1. Deploy Build 252 and inspect `/api/public/website_images`; confirm the three public-prefix counts match the R2 folders.
2. Review the first automatic image assignment for every principal package and each high-intent landing page.
3. Rename ambiguous files such as `IMG_1234.png` to descriptive service/location names rather than adding one-off hard-coded mappings.
4. Use real before/after or process photos only where customer/public-use consent and privacy review permit.
5. Add explicit admin-side image assignment overrides only for rare cases where two descriptive files legitimately compete for the same target.
6. Continue inventory normalization from Build 249 so products/supplies and their images become trustworthy.
7. Complete outstanding Build 247/248 staging migrations and private DAIP acceptance separately from the public website-image system.
8. Prove the private >300 MB resume path, processing queue, and reviewed content-package workflow before expanding automatic content output.
9. Continue CSS/mobile regression and one-H1/title/meta checks on every public pass.
10. Measure whether enriched package/service pages improve Services → Booking progression before adding more public navigation complexity.

---

<!-- Historical release guard: # CURRENT LIVING AUTHORITY 2 OF 2 — Build 250 -->

**Updated:** 2026-08-10
**Purpose:** Current business/technical direction. For exact implemented state and handoff, read `AI_PROJECT_HANDOFF.md` first.

## Build 250 value delivered

- The Services page now leads with vehicle size and the five principal packages instead of sending unfamiliar visitors through secondary charts/hubs first.
- Vehicle size is larger, more obvious, and explains that final size can be confirmed before service.
- `Open price chart` and `Open details chart` were removed from Services; Pricing owns detailed comparison.
- The goal-based chooser is reduced to clear package outcomes with consistent CSS and direct booking links.
- Full Service Hub moved below the principal package cards.
- Public `rosie-assets/CarPhotos/` photos can now be discovered at runtime through a bounded read-only R2 manifest and used as real service-card imagery.
- Generic review-image fallback was removed from principal service cards in favour of approved Rosie photos and an intentional service-photo placeholder.
- No thin SEO pages were added; current one-H1, concise-title, accurate service-area and authentic-proof rules remain.

## Current next work

1. Deploy Build 250 and verify `/api/public/car_photos` sees the newly uploaded `CarPhotos/` objects.
2. Standardize important R2 filenames with service terms (`premium-wash`, `basic-detail`, `complete-detail`, `interior-detail`, `exterior-detail`) so automatic matching is deterministic.
3. Replace any remaining generic public fallbacks with approved Rosie project/service proof after consent/privacy review.
4. Test the Services → Book flow with people unfamiliar with detailing; measure whether they can choose a main package without opening Pricing.
5. Keep Pricing as the deep comparison page and Booking as the transaction path; avoid rebuilding duplicate comparison controls elsewhere.
6. Continue Build 249 Amazon inventory cleanup and reviewed duplicate merges.
7. Finish catalog image/publish-readiness cleanup as inventory becomes trustworthy.
8. Apply/accept Build 247 and Build 248 migrations in staging where outstanding.
9. Bind/verify private `DAIP_MEDIA_BUCKET` separately from public `rosie-assets`.
10. Prove one private photo and one >300 MB interrupted/resumed project video.
11. Import the three historical detailing Creative Projects and raw media one at a time.
12. Acceptance-test `DAIP_PROCESSING_QUEUE` if used.
13. Implement private proxy/frame/audio/transcript processing outside the request path.
14. Add scene/before-after scoring with human override.
15. Add privacy detection and reviewed redaction derivatives.
16. Add best-shot/duplicate scoring and storyboard editing.
17. Implement reviewed long/short render adapters.
18. Complete real-device booking/payment/refund/email/recovery acceptance.
19. Complete Search Console and Google Business Profile alignment using authentic Rosie proof.
20. Run an invite-only soft launch and simplify any public step that repeatedly causes hesitation.

---

<!-- Historical release guard: # CURRENT LIVING AUTHORITY 2 OF 2 — Build 249 -->
# Historical Build 249 roadmap snapshot


**Updated:** 2026-08-10
**Purpose:** Current business/technical direction. For exact implemented state and handoff, read `AI_PROJECT_HANDOFF.md` first.

## Build 249 value delivered

- Bad tools/supplies can now be repaired in place from a reviewed Amazon link instead of creating another duplicate row.
- Inventory identity/history is protected while supplier-derived descriptive fields are refreshed selectively.
- Workbench cleanup queues expose Amazon repair candidates and missing supplier links, with direct desktop/mobile repair actions.
- Supplier metadata and descriptions persist through the full editor rather than disappearing at save time.
- Missing inventory imagery uses an intentional visual placeholder instead of pretending a generic add-on photo is the product.
- Current SEO direction remains accurate service areas, concise titles, one clear H1, useful service/pricing/booking content and authentic local proof rather than thin keyword pages.

## Current next work

1. Deploy Build 249 and repair the highest-confidence existing supply/tool rows using accurate Amazon links.
2. Use `Amazon repair candidates`, then `Missing Amazon / supplier link`, to progressively normalize the inventory without destroying history.
3. Review duplicate rows only after supplier refresh; use the existing reviewed merge workflow instead of hard deletion.
4. Complete catalog featured/gallery image coverage and publishing-readiness cleanup as inventory data becomes trustworthy.
5. Apply/accept Build 247 and Build 248 migrations in staging where outstanding.
6. Bind and verify the private `DAIP_MEDIA_BUCKET` R2 bucket with no public exposure.
7. Prove one private project photo and one >300 MB interrupted/resumed video.
8. Import the three historical detailing Creative Projects and their private raw media one project at a time.
9. Acceptance-test `DAIP_PROCESSING_QUEUE` if used.
10. Implement the private processing consumer for proxies, frames, audio and transcript outside the request path.
11. Add scene analysis, before/during/after scoring and human override.
12. Add privacy detection and reviewed blur/redaction derivatives without modifying raw originals.
13. Add best-shot/near-duplicate scoring and storyboard editing from selected private evidence.
14. Implement reviewed long-form/short-form render adapters.
15. Add consent-approved reviewed copy-to-public workflows only after privacy acceptance.
16. Complete real-device DAIP/Creative Project acceptance on desktop and mobile.
17. Complete inventory/accounting close/export and product-image readiness.
18. Complete booking, payment, refund, webhook, email and recovery acceptance.
19. Complete Search Console and Google Business Profile alignment with real Rosie proof.
20. Run an invite-only soft launch with daily evidence review.

---

# Historical Build 248 roadmap snapshot

**Updated:** 2026-08-09
**Purpose:** Current business/technical direction. For exact implemented state and handoff, read `AI_PROJECT_HANDOFF.md` first.

## Build 248 value delivered

- Supplier URLs can be imported into review without the `patterns is not iterable` crash, including common Amazon short/share URLs.
- Private project media can now be deliberately selected or excluded as story evidence without changing its private storage boundary.
- Processing failures have operator retry/dead-letter controls instead of becoming an opaque queue.
- Creative Projects now show explainable content-package readiness and have a human review gate before future publishing workflows.
- Local structured data is more geographically precise and the SEO strategy remains useful pages + real proof + accurate Business Profile data rather than keyword repetition.

## Current next work

1. Apply Build 247 then Build 248 migrations in staging where outstanding.
2. Prove Amazon.ca, Amazon.com and Amazon short/share-link import review with harmless products.
3. Bind the private `DAIP_MEDIA_BUCKET` R2 bucket and verify it has no public exposure.
4. Upload one harmless project photo and verify private metadata + processing jobs.
5. Prove a video larger than 300 MB can pause/interruption/resume without restarting from zero.
6. Import the first historical detailing Creative Project and raw media.
7. Import the second historical detailing Creative Project and raw media.
8. Import the third historical detailing Creative Project and raw media.
9. Configure and acceptance-test `DAIP_PROCESSING_QUEUE` if used.
10. Implement the private processing consumer for proxies, frames, audio and transcript outside the request path.
11. Add scene analysis and before/during/after candidate scoring with human override.
12. Add privacy detection and reviewed blur/redaction derivatives without modifying raw originals.
13. Add best-shot/near-duplicate scoring and a storyboard editor using selected evidence.
14. Implement a render adapter for reviewed long-form and short-form outputs.
15. Add reviewed copy-to-public workflow for consent-approved derivatives only.
16. Complete real-device DAIP and Creative Project acceptance on desktop/mobile.
17. Continue catalog readiness, inventory/accounting close/export and product-image completion.
18. Complete booking, payment, refund, webhook, email and recovery acceptance.
19. Complete Search Console and Google Business Profile alignment with real Rosie proof.
20. Run an invite-only soft launch with daily evidence review.

## Following value wave

- 1080p/720p proxy presets, scene/key-frame extraction, timestamped transcript storage and audio/silence metadata.
- License-plate/face/sensitive-document detection with reviewed derivative redaction.
- Before/during/after classification, sharpness/exposure/transformation scoring and duplicate clustering.
- Drag/drop storyboard, narration/soundtrack planning, YouTube chapter recipes and vertical hook/crop recipes.
- Thumbnail, website gallery, Business Profile and platform-copy derivative presets.
- Render cost/time estimates, queue observability, retry analytics, retention/storage-class policy and archive/recovery tests.
- Only after privacy/consent proof: reviewed public-copy and publishing integrations.

---

# Master Value Roadmap — Build 246 Current Direction

Build 246 closes a major product-data-quality gap by adding preview-first public publishing gates. The next value wave remains production acceptance, resumable media recovery, accounting close/export depth, local proof, Search Console/Business Profile alignment and a controlled soft launch.

## Next 20

1. Apply the Build 246 migration in staging and refresh the Supabase schema cache.
2. Preview one ready inventory row and compare browser results with the readiness endpoint.
3. Publish one ready row and confirm the public catalog includes it.
4. Attempt a mixed ready/blocked publish and confirm the full batch remains unchanged.
5. Review the catalog publish-readiness audit row and preserve safe evidence.
6. Correct suspicious names, missing categories, units and featured images.
7. Complete cost, description, gallery and service-tag warnings for priority inventory.
8. Retest Block Calendar full-day, AM and PM behaviour against public booking.
9. Complete one full booking and admin reconciliation test.
10. Complete and refund a controlled Stripe payment and verify webhook evidence.
11. Verify booking, payment, consent and staff emails in external inboxes.
12. Audit Cloudflare variables, bindings, domains and rollback access.
13. Perform Supabase restore and Cloudflare rollback rehearsals.
14. Complete legal, media-consent, staff-permission and accessibility review.
15. Test booking, catalog, Startup and Inventory Workbench on real mobile devices.
16. Complete Search Console sitemap, canonical and structured-data inspection.
17. Align Google Business Profile categories, services, areas, hours and photo cadence.
18. Complete upload interruption/retry and duplicate-media acceptance.
19. Complete payment application, HST, month-end close and accountant-package review.
20. Run an invite-only soft launch and review every early transaction daily.

---

# Rosie Dazzlers Master Value Roadmap — Build 245

**Updated:** 2026-08-06

## Completed in source

- Protected UI/SEO/CSS/asset/cache acceptance scanner and exported evidence.
- Startup Command Center cache/build diagnostics and safe cache recovery.
- Service-worker install and offline fallback hardening.
- Static one-H1 and service-specific metadata fallbacks for JavaScript add-on pages.
- Admin noindex and printable gift-certificate heading corrections.

## Current next 20

The current ordered queue is stored in `data/build245_next_steps.json`. The immediate sequence is preview deployment, cache/build confirmation, full UI scan, CSS/mobile acceptance, booking/calendar proof, payment/refund/webhook proof, notifications, infrastructure/recovery, policy/accessibility, inventory/catalog cleanup, Search Console/GBP alignment, local proof replacement and controlled soft launch.

---

# Rosie Dazzlers Master Value Roadmap — Build 241

**Updated:** 2026-08-05
**Build 241:** Startup Command Center initialization and cache hotfix; no roadmap item was removed and no database DDL is required.

## Completed in this hotfix

1. Removed the `evidenceRows` function/local-variable collision that stopped the Startup summary from rendering.
2. Added partial-load protection so catalog, evidence, production, test, roadmap, or automatic-check failures do not crash the complete interface.
3. Advanced the script and service-worker cache versions to force browsers off the faulty Build 239/240 asset.
4. Added a release regression guard for the exact error pattern.

The Build 240 next-20 cycle remains current. Resume launch evidence and production acceptance after deploying this hotfix and confirming the Startup Command Center refreshes without console errors.

---

# Rosie Dazzlers Master Value Roadmap — Build 240

**Updated:** 2026-08-05
**Build 240:** transactional booking/project inventory posting, authorized reversal, operational evidence and continued launch polish.

## Completed in source; staging acceptance required

1. Preview-first all-or-nothing inventory posting for bookings and reviewed Creative Project reservations.
2. Database stock locks, shortage/conflict validation, idempotent commits and per-row audit evidence.
3. Authorized compensating reversal that preserves original movements and restores project reservations for review.
4. Shared transaction history plus labelled read-only cached history fallback.
5. Admin/Menu/route integration across Inventory Workflow, Workbench, job progress and Creative Projects.
6. Startup Command Center expanded without removing prior blockers.
7. Build 240 schema, visual placeholder, CSS/mobile, one-H1 and documentation safeguards.

## Current highest-value direction

Complete Build 240 acceptance, then finish resumable media uploads/derivatives, product publishing gates, payment application/HST review, month-end close/accountant export, approved local visual proof and invite-only soft launch evidence. The complete current 20-step queue is in `data/build240_next_steps.json` and the Startup Command Center.

---

# Rosie Dazzlers Master Value Roadmap — Build 238

**Updated:** 2026-07-30
**Build 238 — Inventory transactions, reviewed duplicate merge, SEO/startup polish**

## Strategic direction

Rosie Dazzlers should now prioritize launch confidence and operator speed over adding another broad subsystem. The strongest business model remains mobile detailing with clear packages and specialty-service pages, direct booking, approved before/after proof, repeat-maintenance workflows, customer trust, job profitability and content reuse. Creative Projects and Content Automation remain differentiators, but must not destabilize ordinary bookings, payments or daily operations.

## Completed in source; staging acceptance required

1. Transactional bulk inventory preview/commit RPC and audit ledger.
2. Reviewed duplicate merge preview/commit RPC with reference transfer and soft archive.
3. Inventory Workbench merge controls, batch reason, preview, confirmation and read-only cached fallback.
4. Protected Cloudflare endpoints for both database workflows plus a read-only audit-history endpoint.
5. Inventory transaction/merge history dialog with CSV export for operator review.
5. Build 238 migration and full canonical schema mirror.
6. Startup Guide expansion to 25 ordered blockers.
7. Build 238 current-cycle Roadmap Execution fallback and migration seed.
8. Public title/description tightening on 19 pages.
9. One-H1, route-copy, CSS dependency and service-worker cache continuity.
10. New visual-placeholder types for safe merge, transactional batches and SEO preflight.

## Current next 20

1. Apply the Build 238 migration in staging.
2. Preview and execute one harmless same-type/same-unit duplicate merge.
3. Preview and execute one transactional bulk update, then prove rollback with an invalid row.
4. Verify Build 238 public titles/descriptions/canonicals/H1s in preview.
5. Complete Block Calendar full-day, AM and PM save/remove testing.
6. Complete an end-to-end booking and verify every admin/customer/calendar record.
7. Complete and refund a small authorized live Stripe transaction; verify webhook and accounting evidence.
8. Verify booking, payment, staff and consent messages in external inboxes.
9. Audit Cloudflare production variables, bindings, domains and branch settings.
10. Perform a documented Supabase backup-and-restore rehearsal.
11. Review and publish privacy, terms, cancellation, refund, media-consent and cookie wording.
12. Complete real-device iPhone-size and Android-size testing.
13. Complete keyboard, focus, contrast, labels and form-error accessibility testing.
14. Submit the sitemap and validate canonical URLs and structured data in Google tools.
15. Verify Google Business Profile categories, service area, services, hours, phone and approved photos.
16. Finish suspicious inventory-name, category, cost, vendor and duplicate cleanup.
17. Complete featured image and up-to-seven gallery image metadata for sellable items.
18. Replace high-value placeholders with approved Rosie-owned local proof.
19. Run an invite-only soft launch with daily incident and transaction review.
20. Modernize historical release guards, then archive redundant Markdown using a manifest instead of deletion.

## Work after the current 20

- Add a reviewed merge-reversal/compensation design; never attempt destructive automatic unmerge.
- Add transactional inventory reservation/consumption posting for real jobs with reversal authorization.
- Add image derivative generation and mobile-resumable uploads.
- Add product publish-readiness gates tied to role-aware gallery and consent/provenance.
- Finish payment application, tax review, month-end lock/reopen and accountant export.
- Finish consent-aware testimonial/trust blocks, custom-request intake and social analytics rollups.
- Promote Content Automation outputs through review queues only; keep publishing explicit until provider acceptance is proven.

---

# Build 237 active roadmap — 2026-07-28

The immediate strategy is launch confidence and daily-operating reliability, not another broad module. Work the current next 20 in `/admin-roadmap-execution.html`; use `STARTUP_GO_LIVE_BLOCKERS.md` for detailed instructions.

## Current next 20

1. **Deploy Build 237 CSS and admin-page dependency repair to preview** — Deploy the preview branch, hard-refresh /admin-roadmap-execution, and confirm site.css plus AdminShell load with no 404 or ReferenceError.
2. **Apply Build 237 roadmap-cycle and launch-evidence migration in staging** — Run sql/2026-07-28_build237_css_startup_evidence_roadmap.sql in Supabase SQL Editor, then refresh the schema cache and open both Roadmap Execution and Launch Readiness.
3. **Verify Block Calendar full-date, AM and PM save/remove behaviour** — Create and remove one future full-date block, one AM block and one PM block; verify the public booking wizard reflects each change immediately.
4. **Complete a production-like end-to-end booking and admin verification** — Use a test customer, select date/vehicle/package/add-ons, finish the booking, then verify booking, calendar, customer and staff records.
5. **Complete and refund a small live Stripe transaction** — Confirm live key mode, complete a small payment, verify webhook and receipt evidence, issue a refund, and reconcile the result.
6. **Verify booking, payment, staff and consent email delivery** — Send each notification type to an external inbox, inspect spam and mobile rendering, and record provider/message evidence without storing secrets.
7. **Audit Cloudflare production variables, bindings, domains and branch settings** — Compare production and preview environment names, verify Supabase/Stripe/R2 bindings, and document the exact location of each required variable.
8. **Conduct and document a Supabase backup-and-restore rehearsal** — Confirm backup coverage, restore a safe staging copy or selected records, validate row counts and permissions, and record the recovery steps.
9. **Review and publish customer policies and consent wording** — Review privacy, terms, cancellation, refund, media consent, cookie and service-condition wording; link them from booking, checkout and footer.
10. **Complete real-device mobile workflow testing** — Test home, services, booking, payment, customer progress, Block Calendar, inventory and uploads on at least one iPhone-size and one Android-size viewport/device.
11. **Complete accessibility keyboard, focus, contrast and form-error review** — Keyboard-test public and critical admin flows, verify visible focus, labels, error announcements, touch targets, heading order and contrast.
12. **Submit sitemap and validate canonical URLs and structured data** — Verify Search Console ownership, submit sitemap.xml, inspect index coverage, test home/local/service structured data, and correct canonical inconsistencies.
13. **Verify Google Business Profile service-area information and local proof** — Confirm business name, category, service area, hours, phone, website, services, photos and review link match the live site and real-world business.
14. **Clean suspicious inventory names, categories, costs and inactive duplicates** — Use Inventory Workbench filters, correct customer-facing names, complete costs/categories, archive true duplicates and preserve rows with operational history.
15. **Complete featured and gallery image metadata for sellable products** — For each sellable product set one featured image and up to seven ordered gallery images, then complete descriptive alt text, captions, role and consent/provenance notes.
16. **Replace high-value public visual placeholders with approved local proof** — Prioritize homepage, ceramic coating, paint correction, interior, local town pages, gallery and booking trust areas using Rosie-owned approved images.
17. **Add reviewed duplicate inventory merge and transfer workflow** — Design a preview-only merge that transfers references and stock history, records audit evidence and never hard-deletes an item with operational links.
18. **Replace sequential bulk inventory saves with a transactional RPC** — Create a validated all-or-nothing Supabase RPC with per-row errors, actor audit, rollback behaviour and a dry-run preview.
19. **Run invite-only soft launch and inspect every early transaction** — Accept a small known-customer group, watch bookings/payments/messages/media/inventory/logs daily, and stop expansion if any critical workflow fails.
20. **Modernize historical release guards and archive redundant Markdown safely** — Map every release-guard dependency, replace historical text-marker checks with current feature checks, then move obsolete docs to docs/archive without deleting evidence.

---

# Build 236 active roadmap — prove the platform, then soft launch

The immediate priority is operational proof rather than another large subsystem. Build 236 repairs the Block Calendar/CSS regression, restores shared admin/public shell capabilities, schedule-schema compatibility, mobile drift, launch-preflight evidence, Help/Content Center links, and visual-placeholder coverage. The active next sequence is the 30-step launch and reliability list in `docs/BUILD236_CALENDAR_SEO_CSS_STABILIZATION.md`, beginning with live schedule, booking, payment, email, environment, backup, policy, mobile, accessibility, search and inventory tests.

Only this file and `AI_PROJECT_HANDOFF.md` are living strategy documents. Current SEO direction is summarized in `docs/SEO_COMPETITIVE_REVIEW_BUILD236.md`; the Markdown retirement decision is in `docs/MARKDOWN_RETIREMENT_PLAN_BUILD236.md`.

---

# Rosie Dazzlers Master Value Roadmap — Build 225

**Updated:** 2026-07-07
**Purpose:** One active business/product roadmap. Read after `AI_PROJECT_HANDOFF.md`. Retained Markdown remains history/audit context.

## Build 225 — Social & Analytics Connections Centre, consent-first tags, and DAIP external-service boundary

**Completed in source; staging acceptance required:**
- Administrator-only `/admin-integrations.html` with server-side status checks that return presence/format only—never values or secrets.
- Cloudflare Secret variable map and detailed operational guide for Meta, GA4, Google Ads, TikTok, LinkedIn, Pinterest, Microsoft Advertising, Facebook/Instagram, X, YouTube, and Google Business Profile.
- Consent-first optional public marketing-tag loader, with an explicit public-page opt-in and protected/private route exclusions.
- Privacy notice update and mobile-safe Connections Centre layout.
- DAIP external-service boundary document and preflight test framing: marketing/social integration is not DAIP implementation.
- Baseline fixes for malformed Admin Menu and service-worker cache syntax so affected browser code can parse.

**Still hard-held:**
- No browser or database credential entry.
- No server conversion APIs, contact uploads, customer hash sharing, event payloads containing personal information, or automated social publishing expansion.
- DAIP Gate C and all DAIP technical/public capability remain held. No DAIP bucket, upload/download, signed link, worker, processing, AI, customer media, public export, Gallery/Social handoff, or publishing capability was introduced.

### Next 20 connected steps after Build 225

1. Deploy Build 225 to the **staging** Cloudflare Pages project.
2. Open `/admin-integrations.html` as an administrator and confirm it reports no values.
3. Add `MARKETING_TRACKING_ENABLED=true` and `MARKETING_TRACKING_MODE=test` to staging Secrets only.
4. Add `MARKETING_TRACKING_CONSENT_VERSION=1`.
5. Configure **one** first provider only—recommend GA4.
6. Redeploy staging.
7. Confirm GA4 shows Configured on the Connections Centre.
8. In a private browser, open a normal public marketing page, not booking/payment/client/admin/progress.
9. Confirm no third-party tag loads before the optional-measurement choice.
10. Choose optional measurement and verify only the approved tag loads.
11. Use the provider’s official diagnostic tool; record only Pass/Fail and safe notes.
12. Decline consent in a fresh private session and confirm the normal public site still works.
13. Check the privacy notice wording and consent-version behavior.
14. Set `MARKETING_TRACKING_ENABLED=false` to validate the rollback path, then redeploy.
15. Repeat only after the test result is understood; do not turn on all providers at once.
16. Configure Facebook/Instagram Page credentials in staging only if the Social Queue readiness test is planned.
17. Use reviewed Social Queue drafts; do not publish customer media without consent and privacy checks.
18. Do not configure a server conversion API, customer match list, or contact upload until a separate consent/event-design review is accepted.
19. Complete the DAIP Build 218–224 evidence chain and Gate C review; Build 225’s connections page is only boundary evidence.
20. Only after Gate C and a separate implementation proposal are accepted should a minimal private DAIP technical test be considered.

# Rosie Dazzlers Master Value Roadmap — Build 224

**Updated:** 2026-07-06
**Purpose:** This is the one active business/product roadmap. Read this after `AI_PROJECT_HANDOFF.md`; retained Markdown is historical/audit context.

## Build 224 — DAIP Gate C technical review and customer-profile quality (completed in source; staging acceptance required)

- **Completed:** protected Gate C technical-review and rollback workspace, independent review acknowledgement, prerequisite validation, append-only audit, RLS/service-role database boundary, guided tests, mobile/desktop layout, visual placeholder, schema mirror, route-copy/cache coverage, and release guard.
- **Customer controls:** safe history for contact/live-update preference changes and review-only duplicate candidate warnings for management. No automatic merge or consent change exists.
- **Still hard-held:** Gate C and all DAIP technical/public capability. No storage, upload/download, external service configuration, worker, processing, customer media, Gallery/Social/GBP/public destination, export, or publishing exists.

### Next 20 connected steps after Build 224

1. Apply both Build 224 migrations in staging only.
2. Verify RLS and browser-role revocations for both new tables.
3. Run the Gate C prerequisite-block test.
4. Save a harmless Gate C draft and confirm no capability changes.
5. Save a blocked review and confirm Gate C remains Held.
6. Complete the Build 218, 219, 222, and 223 evidence chain.
7. Review the build 223 blueprint with an independent reviewer.
8. Confirm the cost warning/hard-stop owner.
9. Confirm the rollback pause authority.
10. Confirm no customer media or public destination is in scope.
11. Complete the Gate C accepted-review test only with safe general text.
12. Confirm technical/public counters remain zero after acceptance.
13. Test that contact-preference history records an approved manager edit.
14. Test that matching profile contact details create a warning but never merge records.
15. Decide whether any duplicate candidate requires manual investigation.
16. Document manual-merge requirements before creating a merge tool.
17. Refresh public service proof only with approved, consented local media.
18. Continue quote-to-booking-to-proof-to-payment-to-review flow tests in staging.
19. Create a separate Gate C implementation proposal only after all above evidence is accepted.
20. Do not create storage/upload/processing code before that separate proposal is independently reviewed.


# Rosie Dazzlers Master Value Roadmap — Build 220

**Updated:** 2026-07-03
**Purpose:** This is the one active business/product roadmap. Historical build detail remains in `DEVELOPMENT_ROADMAP.md`; active decisions belong here.



## Build 223 — DAIP private-MVP design blueprint (completed in source; staging acceptance required)

Build 223 creates `/admin-daip-design.html`, an admin-only independent-review queue for a written private-MVP blueprint.

- **Completed:** safe design-scope, threat-model, upload-control, storage-separation, cost-stop, rollback/acceptance, owner/reviewer, due-date, acknowledgement, current-authorization, audit, RLS/service-role, route-copy, responsive layout, visual placeholder, Guided Test Centre, schema mirror, service-worker, and release-guard coverage.
- **Submission gate:** a blueprint can be submitted only when the Build 222 readiness authorization is currently valid; drafts and pauses remain available otherwise.
- **Still hard-held:** Gate C and every technical/public DAIP capability. No storage, upload/download, signed URLs, queues, workers, processing, AI, customer media, Gallery/Social/GBP handoff, export, or publishing exists in Build 223.

### Next 20 connected steps after Build 223

1. Apply the Build 223 migration in **staging only** after Builds 218, 219, and 222.
2. Confirm Build 223 tables have RLS enabled and browser-role grants revoked.
3. Run the missing/stale-authorization block test.
4. Save a harmless Draft and confirm no capability changes.
5. Save a Paused blueprint and confirm Gate C remains Held.
6. Complete/verify all twelve DAIP-0 owner decisions.
7. Record all three Build 218 internal-safety tests as Pass in staging.
8. Confirm the Build 222 readiness authorization remains Current.
9. Complete the private-MVP blueprint using safe general text only.
10. Name the independent design reviewer and a backup reviewer.
11. Confirm the explicit zero-public-destination scope.
12. Confirm the explicit no-customer-media/test-only scope.
13. Review the threat model for accidental leakage, misuse, cost, recovery, and mistaken publication.
14. Review server-issued authorization, checksum/MIME/size validation, resume, cancel, retry, and audit requirements.
15. Review private-original versus derivative separation and no public list/read policy.
16. Review retention, legal hold, secure deletion, recovery, and rollback.
17. Price the smallest proposed pilot against the owner-approved warning/hard-stop rule.
18. Accept or pause the written proposal through an independent review meeting—do not implement it yet.
19. Write a narrow Gate C implementation acceptance plan and rollback test plan.
20. Only then commission a separate, test-only Gate C technical review; do not merge storage/upload/worker code before that review.


## Build 222 — DAIP Phase 1 readiness review (completed in source; staging acceptance required)

Build 222 turns the DAIP readiness packet into a protected, auditable decision workspace at `/admin-daip-readiness.html`.

- **Completed:** a server-validated Gate A/B readiness readout; draft, paused, and exact-phrase `ready_for_design_review` records; budget-stop, consent, retention/legal-hold, owner, review-date, and safe audit fields; RLS/service-role-only tables; mobile/desktop layout; service-worker and route-copy coverage; visual placeholder; guided test cases; schema mirror; and release guard.
- **Meaning of “ready”:** only that the owners may request a **written private-MVP design review**. It is not an implementation or production authorization.
- **Still hard-held:** Gate C storage/upload design; Gate D processing; Gate E privacy/export; Gate F pilot. No customer media, storage, signed links, worker, AI, social/gallery/public handoff, or automatic publishing exists in Build 222.

### Next 20 connected steps after Build 222

1. Apply the Build 222 migration in **staging only**.
2. Confirm new readiness tables have RLS enabled and browser-role grants revoked.
3. Run the Build 222 blocked-gate test with Gate A or Gate B incomplete.
4. Run the harmless draft/paused readiness audit test.
5. Complete all 12 DAIP-0 owner decisions in the Governance workspace.
6. Record all three Build 218 internal safety tests as Pass in staging.
7. Run the Build 222 written-design-review-only test with safe general text.
8. Confirm Gate C remains Held after readiness authorization.
9. Record the owner-approved monthly warning and hard-stop threshold.
10. Record a primary and backup responsible person for pausing DAIP work.
11. Finalize purpose-separated consent wording with no implied marketing permission.
12. Finalize originals/proxies/rejected-output retention and legal-hold ownership.
13. Decide the sole source of truth for originals and the role, if any, of Drive.
14. Write a one-page private-MVP threat model: abuse, leakage, cost, recovery, and mistaken-publication risks.
15. Write a one-page upload design: server authorization, checksum, MIME/size controls, resumable recovery, and no public object URLs.
16. Write a one-page storage/derivative separation design with no public list/read policy.
17. Write a worker/queue proposal that is not implemented in Pages Functions.
18. Write the zero-public-destination acceptance criteria and rollback plan.
19. Price the smallest technical pilot against the approved cost stop rule.
20. Only then commission a separate Gate C build review; do not merge storage/upload code until that review is approved.

## North star

Build a professional, mobile-first detailing platform that gets found locally and connects every customer relationship from first lead through repeat maintenance.

`lead / quote → booking → live detail interaction → proof of work → invoice/payment → review/public proof → repeat maintenance`


## Build 220 — customer access management and DAIP readiness packet

### Completed connected work

1. Rebuilt `/admin-customers.html` as a responsive customer-management workspace instead of a read-only overview.
2. Added a searchable/filtered customer directory with current, active, suspended, and archived states.
3. Added role-aware profile editing for practical client/service information.
4. Let operational detailers update job-relevant information while keeping email, private notes, notification settings, recovery tools, and lifecycle controls restricted.
5. Added manager-only client profile creation.
6. Added explicit client sign-in email-change confirmation with verification and old-session revocation.
7. Added safe account-setup, password-reset, resend-verification, and revoke-session actions.
8. Kept passwords, hashes, reset links/tokens, session tokens, payment details, and private media out of the staff interface and audit log.
9. Added a privacy-neutral client password-reset request flow.
10. Added a privacy-neutral forgotten-sign-in-email help request flow.
11. Added an internal manager queue to review/resolve forgotten-email help without exposing account existence publicly.
12. Added single-use atomic token consumption and retirement of prior same-purpose recovery links.
13. Revoked prior sessions after a successful reset before issuing the fresh customer session.
14. Added archive-first lifecycle controls rather than permanent deletion.
15. Preserved booking/payment/tax/consent/audit relationships when an account is archived.
16. Added safe customer account-action audit records.
17. Added RLS/service-role boundaries for recovery, audit, session, and token tables.
18. Added a customer-account visual placeholder that is safe for desktop/mobile internal UI and never displays account information.
19. Added four Build 220 guided staging tests.
20. Added the DAIP Phase 1 readiness packet while retaining the hard hold on DAIP technical media capability.

### Next 20 highest-value steps

1. Apply the Build 220 migration and complete all four controlled staging tests.
2. Add customer identity/merge review guidance before staff merges duplicate profiles; do not auto-merge by name alone.
3. Add an explicit customer contact-preference history and consent/change audit.
4. Add secure staff notes categorization and expiry reminders for operational notes that should not live forever.
5. Add customer account invitation delivery/retry state to the Notifications health view.
6. Add a safe customer-profile duplicate warning using normalized email/phone, with no automatic merge.
7. Add vehicle-to-customer profile linking/reassignment review with an audit trail.
8. Add client self-service profile-change approval rules where changing service address/access needs staff review.
9. Add a customer account activity timeline using safe events only.
10. Add a two-person approval option before administrator-level archive/restore is used for non-test accounts.
11. Add an exported audit package for a customer account without credentials, raw reset links, tokens, payment instrument data, or private media.
12. Complete every DAIP-0 decision in Governance with true owner approval and review dates.
13. Record the Build 218, 219, and 220 DAIP evidence in the Guided Test Centre.
14. Decide DAIP source-of-truth, consent, retention/legal hold, budget ceiling, budget stop rule, and named reviewers.
15. Write a separate private-MVP DAIP design proposal only after Gates A/B are genuinely ready.
16. Require a data-protection, cost, and recovery review before the private-MVP proposal becomes a code build.
17. Keep public DAIP destinations, Gallery, Social, GBP, and publishing explicitly out of the first private-MVP.
18. Continue proof-of-work to customer history/gallery handoff only through existing consent and approval gates.
19. Run real mobile field tests for weak-network booking, proof upload, client access recovery, and payment completion using test data.
20. Before a production release, verify notification provider delivery, payment webhook handling, RLS posture, backup/recovery, and desktop/mobile route parity.

### Build 220 boundary

This build does not start DAIP production. It advances customer service and DAIP decision readiness only. No DAIP bucket, upload, signed URL, worker, processing, AI, public/costly export, customer asset route, Gallery/Social handoff, or publishing control exists because of Build 220.

## Build 209 completed priorities

1. Added a mobile-first live detailer workspace with direct photo/video upload.
2. Added three explicit audiences: customer now, admin review first, and staff only.
3. Added job-stage tagging for arrival, pre-existing condition, during work, final, recommendation, issue, and general updates.
4. Added customer-action-required flags.
5. Added enhanced DB metadata for review status, visibility, approval, stages, and source channel.
6. Added private storage bucket/path support with signed staff/customer-safe media reads.
7. Added adaptive legacy-schema fallback so older databases fail safely instead of losing the workflow.
8. Added admin moderation actions for approve, reject/hide, staff-only, visible, and pinned updates.
9. Added live-feed health statistics for customer-visible, review-pending, private, and action-needed items.
10. Added a public customer timeline combining approved notes, photos, and videos.
11. Added 20-second customer timeline refresh plus manual refresh and visibility-change refresh.
12. Added customer comments with private-safe booking event logging.
13. Filtered internal booking events and payloads from the public progress API.
14. Removed private detailer response reasons from customer payloads.
15. Added progress last-viewed, last-customer-message, and last-staff-update timestamps.
16. Added live interaction diagnostics to the Admin Dashboard.
17. Added responsive live-feed/media CSS and mobile sticky actions.
18. Added visual placeholders for live customer updates, private staff notes, and progress video.
19. Added route-copy synchronization for detailer jobs and admin progress.
20. Retired twenty redundant planning/handoff Markdown files into `docs/archive/` while preserving required release-history files.

## Next 20 value-added steps

1. Add customer and admin notifications when a new live update or customer reply is posted.
2. Add unread/read indicators per booking for customer messages and staff updates.
3. Add video duration/file-size limits, pre-upload warnings, and optional client-side compression guidance.
4. Add media retention/archive rules after job completion while preserving incident/legal evidence.
5. Add upload progress, retry, cancellation, and offline queue recovery for weak mobile connections.
6. Connect proof-of-work checklist steps directly to required arrival/during/final media.
7. Add pre-existing-condition walkaround templates by vehicle area.
8. Add one-click conversion of an issue-stage update into a private incident report with linked evidence.
9. Add customer approval/decision buttons for recommended add-on work during a live job.
10. Add price-change approval and payment-request handoff from a customer-approved recommendation.
11. Add a completed-job customer summary that combines checklist, approved media, invoice, and care recommendations.
12. Trigger review requests only after payment/completion and no unresolved incident.
13. Offer approved final media for Gallery Approval without duplicating uploads.
14. Add approved live media into the vehicle history timeline.
15. Create repeat-maintenance suggestions from service type, season, vehicle condition, and completed date.
16. Add owner “Today needs attention” grouping for unread customer replies, pending media approvals, incidents, quotes, and payments.
17. Add storage usage, orphaned upload, broken signed-path, and retention diagnostics.
18. Add audit exports showing who posted, approved, hid, or published every live item.
19. Add accessibility testing for video controls, captions/transcripts, keyboard moderation, and screen-reader timeline labels.
20. Run live Cloudflare/Supabase/R2 mobile testing and capture issues in the two canonical docs.

## Value sequencing after the next 20

### Revenue and conversion

- Real quote CRUD connected to leads, deposits, booking conversion, follow-up age, and close rate.
- Customer approval for in-job recommendations and price changes.
- Meta ad attribution from campaign/UTM through quote, booking, revenue, and repeat work.

### Trust and documentation

- Required proof-of-work checklists with start/finish evidence and customer sign-off.
- Vehicle history timeline with services, invoices, approved photos/videos, recommendations, and incidents.
- Approved media reuse across gallery, review proof, town/service landing pages, and social drafts.

### Repeat revenue

- Maintenance plan/reminder engine driven by completed work and season.
- Fleet account vehicles, intervals, terms, recurring quotes, and proof packages.
- Seasonal campaigns for salt removal, spring reset, pet hair, odor, protection, gift cards, and fleets.

### Owner simplicity

- One “today needs attention” command center.
- Fewer separate screens for routine work.
- Friendly forms by default; raw JSON only for emergency recovery.
- Independent diagnostics and safe fallback-backed reads.

## SEO and local visibility guardrails

- One clear H1 per public page.
- Unique, concise titles and useful descriptions aligned with visible content.
- Real search language in titles, H1s, body copy, alt text, and internal links.
- Complete, accurate, non-duplicated town/service content supported by actual service coverage and proof.
- Descriptive image filenames/alt text, nearby captions, and customer consent.
- Crawlable internal links, canonical URLs, sitemap/robots health, and complete structured data.
- Mobile and desktop content parity; do not hide important SEO copy or media from the mobile version.
- Strong page experience, touch targets, resilient layouts, and reduced-motion support.
- Google Business Profile completeness, current hours, service details, photos, posts, reviews, and responses.
- No first-page guarantee: relevance, distance, prominence/popularity, competition, reviews, and indexing are outside the codebase alone.

## Competitive research applied

Official/current source themes reviewed for this direction:

- Google Search Essentials: prominent, people-used wording in titles/main headings and descriptive locations.
- Google title-link guidance: avoid multiple equally prominent page titles/headings.
- Google image guidance: descriptive filenames, titles, alt text, relevant nearby copy, and structured data where appropriate.
- Google Business Profile: local results mainly depend on relevance, distance, and prominence/popularity.
- Jobber: scheduling, route optimization, progress tracking, on-my-way messaging, job photos/checklists, CRM/client portal, quotes, invoices, payments, and follow-up.
- Urable: automotive-detailing CRM, mobile workflow, automated messaging, route optimization, project line items, and customer portal.
- Mobile Tech RX: damage documentation, photos/notes, scheduling, CRM, and reminders.
- OctopusPro: required photos, before/after, findings, approvals, signatures, and proof of work.
- QuoteIQ: route-aware scheduling, photo documentation, quoting/invoicing, reviews, and recurring/fleet work.

Sources:

- https://developers.google.com/search/docs/essentials
- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/appearance/google-images
- https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing
- https://support.google.com/business/answer/7091
- https://www.getjobber.com/industries/auto-detailing-software/
- https://urable.com/
- https://www.mobiletechrx.com/
- https://octopuspro.com/field-service-management/car-wash-auto-detailing-software/
- https://myquoteiq.com/crm-for-mobile-detailing/

## Documentation rule

Active strategy goes only into:

- `AI_PROJECT_HANDOFF.md`
- `MASTER_VALUE_ROADMAP.md`

Append short build/audit summaries to required historical files. Put retired duplicate planning files in `docs/archive/`; do not delete history that may still explain an old migration or release guard.


## Build 210 — connected live workflow completed (2026-06-17)

### Completed 20 steps

1. Added customer notification events for customer-visible live updates, media, approvals, workflow changes, and completed-job summaries.
2. Added staff notification events for customer replies, review-pending updates/media, private notes, and recommendation decisions.
3. Added customer unread update counts based on the previous secure-progress view.
4. Added staff unread customer-reply counts per booking.
5. Added mobile upload progress with a visible progress bar.
6. Added upload cancellation, retry, online/offline messaging, and persisted upload-session diagnostics.
7. Added video duration and file-size enforcement plus compression guidance.
8. Added media retention policy and expiry metadata.
9. Connected arrival, during, and final media to proof-of-work readiness.
10. Blocked job completion when required proof media is missing, with an audited admin override path.
11. Added one-click conversion of issue updates/media into linked private incident reports.
12. Added customer approval, decline, and discussion controls for live recommendations.
13. Added draft payment-request creation when a priced recommendation is approved.
14. Added customer-safe completed-job summaries with proof, payment state, care advice, and maintenance recommendations.
15. Added final-media reuse into Gallery candidate and vehicle-history queues without re-uploading.
16. Added review-request safety gates for completion, payment, summary, and unresolved incidents.
17. Added `/admin-today.html` as a single prioritized owner action queue.
18. Added Today Needs Attention diagnostics to the main Admin Dashboard.
19. Added Gallery Approvals final-media candidate visibility and new connected-workflow visual placeholders.
20. Updated schema, canonical docs, route copies, service worker cache, responsive CSS, and release checks for Build 210.

### Next 20 value-added steps

1. Connect notification events to production email/SMS delivery providers and delivery receipts.
2. Add per-user/per-device read receipts rather than booking-level timestamps.
3. Add true resumable/chunked uploads for weak LTE connections.
4. Add optional client-side photo compression while retaining original incident evidence.
5. Add server video transcoding, poster frames, captions, and accessibility transcripts.
6. Add storage usage, orphan upload, broken signed-path, and retention cleanup diagnostics.
7. Add vehicle-area walkaround templates and required pre-existing-condition capture.
8. Add customer signature and terms acknowledgment to price-change approvals.
9. Automatically create and send hosted payment links from approved in-job recommendations.
10. Add invoice PDF generation/download to completed-job summaries.
11. Add completed-summary revision history and customer acknowledgment.
12. Pair before/final media directly in Gallery Approvals without copying URLs.
13. Render approved vehicle-history photos/videos directly in My Account.
14. Convert maintenance recommendations into scheduled customer plans/reminders.
15. Add preview/send controls for notification and review queues.
16. Add owner task assignment, snooze, due date, notes, and resolved state in Today Needs Attention.
17. Add live-interaction and moderation audit export.
18. Complete keyboard, screen-reader, caption, and reduced-motion acceptance testing.
19. Run real Cloudflare/Supabase/R2 mobile tests on weak Wi-Fi/LTE and record evidence.
20. Measure quote-to-booking, recommendation approval, payment, review, and repeat-maintenance conversion improvements.


---

### Build 210 documentation sync — 2026-06-17

Active strategy is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This file is retained for historical, audit, specialist, or release-check context. Build 210 connects live job interaction to proof, customer decisions, payment handoff, closeout summaries, approved-media reuse, safe review requests, and the owner attention queue.

## Build 211 — production reliability completed (2026-06-18)

### Completed 20 steps

1. Added a production reliability registry for notifications, hosted payment links, mobile uploads, retention, Cloudflare/Supabase/R2 checks, and owner simplification.
2. Added `/admin-production.html` as a single production-readiness screen.
3. Added `/api/admin/production_reliability_report` for environment/table/workflow diagnostics without exposing secrets.
4. Added notification provider readiness checks for email/SMS webhook configuration and queued/failed events.
5. Added `/api/admin/notification_provider_test` for controlled provider test sends or configuration-only checks.
6. Added hosted final-balance checkout creation through `/api/admin/final_balance_checkout_create`.
7. Added Stripe Checkout Session support for final balance requests when `STRIPE_SECRET_KEY` is configured.
8. Kept manual-payment fallback when hosted payment providers are not configured.
9. Added final-balance payment-link readiness warnings to the production report.
10. Added upload reliability reporting for failed/cancelled/uploading live upload sessions.
11. Added storage retention reporting for due/expired job media that is not permanent proof or legal hold.
12. Added `/api/admin/storage_retention_sweep` with dry-run default and review-before-archive behavior.
13. Added migration support for provider test logs, retention audit rows, final balance checkout metadata, and production reliability audit snapshots.
14. Added Admin Dashboard production reliability diagnostics card.
15. Added Admin Dashboard shortcut card to the production readiness screen.
16. Added production reliability tasks into Today Needs Attention when provider, payment, upload, or retention issues need owner action.
17. Added visual placeholder category for production reliability / end-to-end testing.
18. Updated the two canonical Markdown files with current production-risk status and the next 20 reliability steps.
19. Updated historical root Markdown, schema docs, service worker cache, route-copy sync, and release guards.
20. Added Build 211 release guard covering new screens, APIs, migration, docs, routes, and registry markers.

### Next 20 value-added steps

1. Configure the real email provider webhook and send one test notification from `/admin-production.html`.
2. Configure SMS only if customer consent, quiet hours, and cost controls are ready.
3. Configure Stripe final-balance checkout and test a low-value internal final-balance request in test mode.
4. Add PayPal hosted final-balance checkout parity if PayPal will be used for final balances.
5. Add Stripe webhook reconciliation from final-balance checkout back into `final_balance_payment_requests`.
6. Add notification delivery templates for each live-workflow event type.
7. Add customer/staff notification preference controls and quiet-hour rules.
8. Add true multipart/resumable upload for large videos using R2 multipart or Supabase TUS where practical.
9. Run live mobile upload testing on weak Wi-Fi and cellular and record pass/fail notes in production audits.
10. Add a scheduled storage-retention worker that produces a review queue before deleting any customer/job media.
11. Add a storage orphan detector for objects with no linked `job_media` or `live_upload_sessions` row.
12. Add payment-link expiry and resend controls.
13. Add customer-safe payment status updates to the secure progress page.
14. Add one-click owner actions from Today Needs Attention for retry notification, create checkout, archive media, and generate summary.
15. Add a full end-to-end smoke-test checklist screen for quote → booking → live proof → payment → summary → review.
16. Add route/network diagnostics for Cloudflare Pages Functions, Supabase REST, Supabase Storage, and R2 bindings.
17. Add production audit exports for evidence, approvals, provider test sends, and payment-link creation.
18. Add alert thresholds for failed notifications, upload failures, open payment requests, and overdue retention review.
19. Add accessibility checks for production-critical owner screens.
20. Run a real deployment acceptance test and update the two canonical docs with confirmed production results.

Build 211 documentation sync: active roadmap updated for production reliability rather than additional disconnected screens.

## Build 212 — guided production testing completed (2026-06-20)

### Completed 20 steps

1. Added a protected Guided Production Test Centre with plain-language instructions.
2. Added a strict internal-test-data warning and no-secret/no-private-evidence guidance.
3. Added environment preflight test instructions.
4. Added controlled email provider configuration/send-test instructions.
5. Added Stripe test-mode hosted final-balance checkout instructions.
6. Added customer-now/review-first/staff-only privacy acceptance instructions.
7. Added mobile Wi-Fi/cellular upload and retry/cancel acceptance instructions.
8. Added arrival/during/final proof-gate acceptance instructions.
9. Added issue-to-private-incident and review-blocker acceptance instructions.
10. Added retention dry-run protection instructions.
11. Added full lifecycle smoke-test instructions.
12. Added DB-backed production test result history.
13. Added safe browser-only fallback when the migration is missing.
14. Added protected list/save APIs for test history.
15. Added production-readiness test status counts.
16. Added Today Needs Attention coverage for failed/blocked or absent acceptance tests.
17. Added detailed external guide in `docs/PRODUCTION_TEST_GUIDE.md`.
18. Added mobile-responsive test cards and visual placeholder enrichment.
19. Updated migration, schema documentation, canonical handoff, and Markdown governance.
20. Added a Build 212 release guard and route/service-worker synchronization.

### Next 20 value-added steps

1. Configure and verify the real email notification provider with a controlled mailbox.
2. Configure SMS only after consent, sender identity, quiet hours, and cost controls are approved.
3. Verify Stripe test checkout and webhook settlement with actual Stripe test events.
4. Decide whether PayPal final-balance parity is still required.
5. Implement verified final-balance Stripe webhook reconciliation.
6. Upgrade large videos to true resumable/multipart uploads after field testing proves the need.
7. Consider client-side video compression only after real-device evidence supports it.
8. Add thresholds/alerts for failed notifications, uploads, payment links, and retention reviews.
9. Add scheduled retention review with archive approval before deletion.
10. Add orphaned-storage object diagnostics.
11. Add one-click audited recovery actions from Today Needs Attention.
12. Add non-secret preview-deployment smoke checks.
13. Capture keyboard, focus, caption, and screen-reader acceptance results.
14. Add customer notification preferences and quiet hours.
15. Add payment-link expiry and resend workflows.
16. Add customer-safe payment status updates to the secure progress timeline.
17. Add an optional closeout PDF after privacy/retention testing passes.
18. Run a full internal mobile job simulation on Wi-Fi and cellular.
19. Update canonical docs with only verified production results.
20. Retire/simplify owner screens that do not feed the connected lifecycle or Today queue.

Build 212 documentation sync: detailed testing instructions now live in the app and in `docs/PRODUCTION_TEST_GUIDE.md`; static checks remain necessary but are not a substitute for real provider, payment, storage, and mobile-network testing.

## Build 213 — owner action control and customer-trust records completed (2026-06-22)

### Completed 20-step reliability/conversion pass

1. Added DB-backed owner task state for generated attention rows.
2. Added owner assignment actions from Today Needs Attention.
3. Added one-day and one-week task snooze actions.
4. Added resolution notes and 24-hour generated-row suppression after resolution.
5. Added reopen support for owner tasks.
6. Added manual-task data support for future owner-created work.
7. Added owner-task audit events.
8. Added a booking-scoped live interaction audit export endpoint.
9. Added CSV export from Admin Progress.
10. Added customer typed-name acknowledgement for priced recommendation approval.
11. Added explicit price acknowledgement confirmation before a priced approval is accepted.
12. Added recommendation acknowledgement audit records.
13. Added automatic Stripe Checkout attempt after an approved paid recommendation.
14. Preserved draft payment requests when a hosted checkout cannot be created.
15. Returned only booking-scoped unpaid payment links to the secure progress token.
16. Added customer completed-summary acknowledgement capture.
17. Added completed-summary revision number and revision archive support.
18. Added customer acknowledgement status to the completed-summary card.
19. Added new visual placeholder categories for owner attention and customer acknowledgement.
20. Added migration, data record, production-test guidance, schema/documentation sync, and Build 213 release guard.

### Next 20 value-added steps

1. Add a form for owners to create manual Today Needs Attention tasks from the UI.
2. Add task ownership filters and a “my assigned work” mode.
3. Add due dates and escalation rules for owner tasks.
4. Add notification delivery for assignment, resolution, and overdue task changes.
5. Record verified Stripe webhook settlement against final-balance requests.
6. Add PayPal hosted-link parity only if the business elects to support it.
7. Add payment-link expiry, resend, and cancellation controls.
8. Add customer-safe payment receipt/status timeline updates.
9. Add a full vehicle walkaround template with area, condition, severity, and media anchors.
10. Add vehicle area/condition badges to detailer media capture.
11. Add final-media before/after pairing directly in Gallery Approvals.
12. Add automatic vehicle-history cards for approved final proof.
13. Add review-request scheduling after closeout acknowledgement and settled payment.
14. Add customer communication preferences and quiet hours.
15. Add notification delivery attempt timeline and provider-message IDs.
16. Upgrade large-video uploads to resumable/multipart transfer after field evidence supports it.
17. Add retention archive approval and orphaned-object reconciliation.
18. Add one-click deep links from Today Needs Attention into the exact affected record.
19. Add end-to-end role/permission tests for detailer, senior detailer, admin, and customer token views.
20. Run the full acceptance guide on Wi-Fi and cellular, then update the handoff only with observed results.

Build 213 documentation sync: owner task controls, acknowledgement records, payment-link handoff, summary revision history, and safe audit export now sit in the connected workflow. Static code checks are not proof of real provider/webhook/storage behavior.

---

### Build 214 documentation sync — 2026-06-23

Build 214 prioritizes Supabase containment and owner-task reliability. The active security action is to run `sql/2026-06-23_build214_security_task_orchestration.sql`, refresh Supabase Security Advisor, and test the application through Cloudflare Functions rather than restoring direct browser access to tables. Canonical planning remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.


## Build 214 — security containment and owner-task orchestration completed (2026-06-23)

### Completed 20 steps

1. Added public-schema RLS containment migration.
2. Removed direct `anon`, `authenticated`, and `PUBLIC` table privileges.
3. Preserved server-side `service_role` table/sequence access.
4. Added safe future-table default privileges.
5. Added protected Supabase security posture RPC.
6. Added protected Cloudflare security posture API.
7. Added `/admin-security.html` with table-name-only risk indicators.
8. Added Admin Dashboard Security Posture entry point.
9. Added security placeholder guidance that excludes secrets and customer data.
10. Added manual owner task creation.
11. Added My assigned work filter.
12. Added unassigned-work filter.
13. Added overdue/today/no-due-date filters.
14. Added due-date metadata to owner tasks.
15. Added escalation metadata to owner tasks.
16. Added Set Due Date owner action.
17. Raised overdue manual tasks to urgent in Today Needs Attention.
18. Added task-audit notification queue records without claiming provider delivery.
19. Updated schema, canonical docs, route copies, service worker, and visual registry.
20. Added Build 214 release guard and detailed security acceptance steps.

### Next 20 value-added steps

1. Run Build 214 migration and verify Security Advisor findings clear.
2. Review any named sensitive table and invalidate exposed sessions/tokens as appropriate.
3. Verify Stripe final-balance webhook settlement in test mode.
4. Add payment-link expiry, resend, and cancellation controls.
5. Add customer-safe payment receipt/status timeline updates.
6. Add manual-task editing and specific-staff assignment.
7. Add due-date reminder delivery once the provider is verified.
8. Add approved final-media before/after pairing in Gallery Approvals.
9. Add automatic vehicle-history cards for approved final proof.
10. Add vehicle walkaround templates with media anchors.
11. Add customer communication preferences and quiet hours.
12. Add provider message IDs and delivery-attempt timeline.
13. Add retention archive approval plus orphan-object reconciliation.
14. Add payable/refund webhook settlement regression tests.
15. Add role/permission regression tests for detailer, senior detailer, admin, and customer token views.
16. Run real Wi-Fi/cellular upload tests and record actual evidence.
17. Add payment request deep links from Today Needs Attention.
18. Add application health checks for Cloudflare Function publish/binding readiness.
19. Simplify or retire any owner screen that does not feed Today Needs Attention.
20. Replace visual placeholders with approved local proof photos/video stills.

## Build 215 — verified media rendering and DAIP integration planning (2026-06-30)

### Completed 20 steps

1. Traced public service-hub/local-hero fallback behavior to extension-specific legacy media references.
2. Added a shared client media-source resolver for known Rosie asset URLs.
3. Preserved the original requested URL as the first image attempt.
4. Added compatible same-key JPG lookup.
5. Added compatible same-key JPEG lookup.
6. Added compatible same-key WebP lookup.
7. Added compatible same-key PNG lookup.
8. Added uppercase extension candidates for case-sensitive R2 extension uploads.
9. Updated landing-page hero rendering to prefer `local_hero_image_url`.
10. Updated landing-page gallery/related-media rendering to use the resolver before fallback.
11. Updated service hub package/add-on images to use the resolver before fallback.
12. Updated booking add-on thumbnails to use the resolver before fallback.
13. Prevented the visual-placeholder listener from interrupting a still-running format-resolution chain.
14. Updated Admin Media Health scan to test compatible image extensions.
15. Updated Admin Media Health cards to display the resolved URL and compatible-format result.
16. Changed canonical Local Hero static data to JPG keys and URLs.
17. Updated regional media requirement files to accept JPG/JPEG/WebP/PNG while documenting JPG as canonical.
18. Added a safe legacy media-task JPG alignment migration.
19. Reviewed all DAIP documentation and added a Rosie-specific integration-plan document.
20. Added Build 215 schema, handoff, known-gap, image-guide, documentation-index, release-check, and cache-version synchronization.

### DAIP status and value sequencing

DAIP is valuable because one approved completed job could create reusable proof for the customer summary, vehicle history, before/after gallery, service/town pages, Google Business Profile, marketing drafts, and future social packages. It is also a high-cost/privacy-sensitive subsystem.

**Build 215 status: planning only.** Do not begin a worker, AI model, processing queue, `daip_*` table, Drive sync, public export, or auto-publication until the DAIP-0 decisions in `docs/digital-asset-intelligence-platform/10_Rosie_Dazzlers_Integration_Plan.md` are accepted.

### Next 20 value-added steps

1. Deploy Build 215 and confirm Cloudflare Functions publish successfully.
2. Run `sql/2026-06-30_build215_media_asset_format_alignment.sql` in Supabase after Build 214 security/RLS containment is confirmed.
3. Open `/admin-media-health.html` while signed in and run the image-health scan.
4. Confirm the eight Local Hero rows show a public JPG resolved URL and acceptable dimensions.
5. Open each Local Hero page in a private/incognito browser and confirm no blank/default image appears.
6. Open `/services` and confirm Service Hub images render before any placeholder fallback.
7. Record any still-failing exact R2 key, resolved URL, HTTP status, and image dimensions; do not guess by replacing filenames.
8. Ensure Cloudflare R2 custom-domain public access allows only intended approved public asset prefixes.
9. Keep originals, private incidents, and staff-only job media out of the public `assets.rosiedazzlers.ca` namespace.
10. Decide DAIP worker hosting and monthly cost ceiling.
11. Decide DAIP original/proxy/public-derivative storage boundaries.
12. Decide whether Google Drive is backup-only, operator-viewable, or deferred.
13. Define DAIP consent wording and public-marketing approval rule.
14. Define DAIP privacy-review roles and legal-hold behavior.
15. Choose one controlled internal test detail for future DAIP acceptance testing.
16. Draft, review, and approve a separate Phase 1 DAIP schema migration before executing it.
17. Build only selected manual media-job intake after the migration is reviewed.
18. Add real alerting for persistent missing public image URLs after verified R2 uploads.
19. Replace any remaining generic visual placeholders with approved Rosie-owned media through Gallery/Media Health review.
20. Re-run the Guided Production Test Centre after each deployed reliability/security/media change.

## Build 216 — public media reliability and DAIP governance (2026-07-01)

### Completed 20 steps

1. Reviewed the Build 215 Local Hero JPG compatibility work and retained JPG as the valid canonical format.
2. Kept the original public image URL as the first candidate before any extension fallback.
3. Added bounded candidate timeouts to the browser image resolver so a stalled public asset does not remain blank indefinitely.
4. Preserved JPG, JPEG, WebP, PNG, and upper-case extension compatibility for the same approved R2 object key.
5. Added explicit resolved/exhausted resolver events for safe UI fallback handling.
6. Reworked the server-side Media Health scan to use bounded fetches instead of unbounded public-image loads.
7. Added concurrent scan processing so a large asset list is less likely to time out a Pages Function.
8. Added HTTP/failure classification for not found, not public, timeout, origin error, unreachable, wrong content type, and undersized assets.
9. Kept exact expected R2 key, resolved URL, dimensions, and compatible-format information available to staff.
10. Added optional persistent public-asset health observations after the Build 216 SQL migration is applied.
11. Added recurring alert state that starts as monitoring on the first failed scan.
12. Added activation after a second consecutive failed scan so a one-time transient response does not create a persistent owner alarm.
13. Added automatic alert resolution after one verified passing scan.
14. Added a staff-only persistent alert list with acknowledge/reopen controls and safe CSV export.
15. Connected active/acknowledged public-media alerts to Today Needs Attention so they do not remain isolated in Media Health.
16. Ensured public-media alert records never store customer media, signed URLs, private evidence, or customer-identifying content.
17. Added RLS, revoked direct browser grants, and server-only alert recording through a protected Supabase function.
18. Added a public-media recovery visual placeholder category without using customer media as fallback artwork.
19. Added a DAIP-0 owner decision register with no assumed decisions and no production implementation.
20. Added a DAIP Phase 1 security/acceptance template and synchronized canonical docs, schema notes, visual registry, media guide, tests, documentation index, and release checks.

### Next 20 value-added steps

1. Deploy Build 216 and confirm both Cloudflare assets and Functions publish successfully.
2. Confirm the Build 214 RLS/security migration is applied and Supabase Security Advisor is clear before applying new tables.
3. Run `sql/2026-07-01_build216_media_reliability_daip_governance.sql` in Supabase.
4. Run Admin Media Health twice using a harmless intentionally missing internal test asset key and confirm the first scan is monitoring while the second becomes active.
5. Restore the harmless test asset or use a known public image and confirm a passing scan resolves the alert automatically.
6. Test the eight Local Hero pages and `/services` in an incognito browser after a cache refresh; record the exact expected key and resolved URL for any failure.
7. Verify active public-media alerts appear correctly in Today Needs Attention without exposing a public URL to unauthenticated users.
8. Add narrowly scoped notification delivery for persistent public-media alerts after provider test delivery passes.
9. Replace remaining generic public visual placeholders with approved Rosie-owned local proof photos through Gallery/Media Health review.
10. Complete every DAIP-0 decision in `11_DAIP_Decision_Register.md`; do not infer decisions from this roadmap.
11. Choose one harmless internal job/media set for future DAIP acceptance tests.
12. Review the DAIP Phase 1 security acceptance template with the chosen storage/worker model before writing a migration.
13. Configure and test notification-provider webhooks with a controlled mailbox.
14. Verify Stripe test-mode checkout, webhook settlement, receipt status, cancellation, and resend paths.
15. Complete guided mobile upload testing on real Wi-Fi and cellular networks, including retry and failed video behavior.
16. Confirm R2 private/public prefix separation and retention dry-run behavior with no customer media exposed.
17. Pair approved final media into before/after Gallery candidates with consent and provenance review.
18. Create automatic vehicle-history cards from approved final proof only after privacy/consent review.
19. Schedule review requests only after settled payment, customer summary acknowledgement, and no unresolved incident.
20. Conduct a quarterly competitor/local SEO review based on real quotes, reviews, service areas, customer proof, and Search Console/Business Profile evidence.

### Build 216 planning boundary

DAIP remains planning only. Build 216 adds no DAIP worker, queue, AI model, `daip_*` table, bucket, Drive synchronization, public export, or automatic publishing. The decision register is a required gate, not an invitation to start implementation.

### Build 216 synchronization — 2026-07-01

Build 216 synchronized this retained document with the active `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`: public media recovery now uses bounded JPG/JPEG/WebP/PNG health checks and protected recurring alerts after its migration; DAIP remains planning-only behind the documented decision/security gates.

## Build 217 — secure final-balance collection path (2026-06-30)

### Completed value steps

1. Replaced predictable/public final-balance URLs with random opaque token links stored only as SHA-256 hashes.
2. Added a secure, noindex, no-cache customer payment-status page with one H1 and no customer PII.
3. Added default expiry, controlled maximum expiry, link rotation, cancellation, and reopen controls.
4. Added an Admin Payments final-balance queue with customer-safe operational actions.
5. Added hosted Stripe Checkout handoff that returns the customer to the token-gated payment page.
6. Added Stripe webhook settlement and idempotent duplicate-event handling for final balances.
7. Added progress-page payment states for open, paid, expired, and cancelled requests.
8. Prevented final-balance token hashes and staff-entered notes from being sent to browser clients.
9. Added a generic secure-payment visual placeholder rule that prohibits real invoices, payment links, QR codes, card data, or customer details.
10. Added a Build 217 SQL migration, app-readable implementation record, route-copy sync, service-worker cache entries, and release guard.

### Next 20 value steps

1. Apply the Build 217 SQL migration and verify RLS/direct-browser containment remains intact.
2. Use Stripe test mode to create, pay, return, and replay a final-balance checkout event.
3. Confirm invalid, expired, rotated, and cancelled secure links reveal no customer information.
4. Test the configured notification provider with a controlled inbox; record queued versus actually delivered outcomes.
5. Add staff-visible final-balance status to the existing payment/reconciliation work queue only after a real test transaction passes.
6. Verify tax/HST records and processor-fee handling with the accountant workflow before using live collection.
7. Pair approved final media into Gallery candidates only with recorded media consent and provenance.
8. Create a vehicle-history card only from approved final proof and never from private incident media.
9. Schedule review requests only when final payment is settled, customer acknowledgement is present, and no unresolved incident remains.
10. Complete real mobile Wi-Fi and cellular upload retry tests with harmless media.
11. Verify public/private R2 prefixes and retention dry-run results.
12. Replace only appropriate public placeholder slots with approved Rosie-owned local proof.
13. Continue local page improvements using distinct people-first copy, verified service-area proof, and descriptive approved images.
14. Review quote-to-booking conversion data before adding more marketing integrations.
15. Validate payment/refund/receipt workflows with the accountant export in test records.
16. Run the Guided Production Test Centre after deployment.
17. Complete DAIP-0 decisions; keep DAIP planning-only until the security template is approved.
18. Build a small consent-aware gallery pairing shortcut only after production media reliability passes.
19. Review real Search Console and Google Business Profile evidence before altering SEO titles or town-page scope.
20. Repeat the competitor/local SEO review quarterly using actual client feedback, visibility, and booked-job outcomes.

### Build 217 boundary

This build does **not** process card details, prove a live Stripe/Cloudflare/Supabase deployment, or assert notification delivery. Those require the controlled release tests above.

### Current SEO and competitive recheck — 2026-06-30

Google’s current guidance supports the existing safeguards: one clear page purpose, people-first content, search-language in the title/main heading, crawlable internal links, and descriptive approved image names/alt text. Structured data must describe visible, current page content and can improve eligibility, not guarantee appearance.

Current service-software competitors reinforce the same customer experience target: Jobber’s client portal emphasizes self-serve work requests, approvals, appointment details, payments, and receipts; Urable’s detailing CRM emphasizes connected quoting, scheduling, job tracking, customer communication, payments, and vehicle history. Rosie Dazzlers should differentiate by keeping this journey simple for a one-car-per-day mobile detailer, with consent-aware proof and local Oxford/Norfolk trust—not by copying every enterprise feature.



## Build 218 — next 20 DAIP and customer-proof steps (2026-07-02)

This sequence starts the Digital Asset Intelligence Platform without risking customer media or turning a media system into a premature publishing system.

1. Apply the Build 218 DAIP test-mode migration only in development/staging.
2. Confirm Build 214 Security Posture has no browser access risk for the new DAIP tables.
3. Open `/admin-daip.html` and verify internal-test/no-storage/no-worker/no-public-export/no-auto-publish controls.
4. Choose one opaque `RD-TEST-BOOKING-...` reference for DAIP testing; it is not a booking record and never uses a customer job.
5. Pass the DAIP Test Lab safety-preflight test.
6. Create one `RD-TEST` job with the mandatory internal-test acknowledgement.
7. Register one fictional photo metadata record and one fictional video metadata record without uploading files.
8. Pass the metadata-registry test and verify no URL/bucket/key/path is saved or shown.
9. Record one `internal_only_cleared` and one `blocked_private` privacy outcome.
10. Pass the privacy/export-block test by verifying no DAIP record appears in gallery, social, customer progress, or public pages.
11. Archive the harmless test job and confirm its audit history remains while new asset intake is blocked.
12. Complete and owner-approve all DAIP-0 decision-register rows.
13. Approve the customer media-consent wording that separates service proof, customer visibility, gallery reuse, marketing reuse, and publication.
14. Set a hard monthly cost ceiling and automatic pause/alert threshold before buying or enabling processing infrastructure.
15. Decide the single source of truth for originals and whether Google Drive is backup-only or deferred.
16. Approve a retention/legal-hold/dispute policy for originals, proxies, rejected candidates, and approved derivatives.
17. Choose a worker host capable of private FFmpeg/proxy work outside Cloudflare Pages requests and document the cost/recovery model.
18. Review a private upload/storage migration that uses temporary server-issued authorization, checksums, resumable recovery, and immutable provenance; do not deploy it yet.
19. Implement only the private technical processing MVP: metadata validation, proxy/thumbnail/contact sheet, retry/cancel, usage recording, and audit—no AI/public export.
20. After private processing passes, build manual privacy masking/review and then a separate approved-only gallery/content handoff with no automatic publishing.

### Why this sequencing is commercially useful

The practical advantage is not “AI for its own sake.” It is a repeatable system that turns approved job proof into accurate gallery/service/town material while preserving privacy. That strengthens the existing lead → booking → proof → payment → review → repeat-maintenance workflow and keeps the customer self-service experience competitive without exposing work-in-progress media.

## Build 219 — DAIP governance workspace and held promotion gates (2026-07-02)

Build 219 moves the DAIP decision register from static planning into an internal governance workflow. It is intentionally a **decision and evidence build**, not a media-storage or processing build.

### Completed value steps

1. Added `/admin-daip-governance.html` with responsive desktop/mobile decision and gate views.
2. Added a safe visual placeholder for the DAIP decision-to-gates flow.
3. Added DAIP-0 draft and owner-approval controls for all twelve required decisions.
4. Required an accountable owner, decision summary, business/cost impact, privacy/safety impact, review date, and revision number for every saved decision.
5. Required an exact per-decision approval phrase before a decision can be marked approved.
6. Added a protected audit event for every draft, approval, or reopened decision.
7. Added a decision status summary so owners can see approved, drafted, and open work at a glance.
8. Added Gate A readiness logic driven only by all twelve approved DAIP-0 decisions.
9. Added Gate B readiness logic driven only by the three existing Build 218 internal-test results plus safe test-control state.
10. Kept Gates C–F visibly held and unable to be changed by this build.
11. Added static anti-sensitive-input validation for URLs, keys, signed links, storage identifiers, and obvious credential patterns.
12. Added RLS and direct-browser grant revocation for the governance tables.
13. Kept Cloudflare Functions as the only browser-to-database boundary.
14. Added three Guided Production Test Centre cases for draft boundary, owner approval, and held-gate verification.
15. Added an app-readable Build 219 record and schema mirror.
16. Added an admin-menu link and matching permission guard.
17. Added root/folder route-copy synchronization for the Governance screen.
18. Added service-worker cache coverage for the new page and Build 218/219 records.
19. Updated the two active strategy documents and DAIP operational documents.
20. Added a Build 219 release guard to prevent a later build from silently enabling a production DAIP path.

### Next 20 value steps

1. Apply Build 219 only to development/staging after Build 214 and Build 218 are applied.
2. Run the three Build 218 DAIP Test Lab acceptance tests with fictional metadata only.
3. Record the three Build 219 governance acceptance tests.
4. Draft every DAIP-0 decision using the in-app prompt and no sensitive information.
5. Review the decisions together against actual budget, workload, privacy, and recovery limits.
6. Owner-approve DAIP-0-01 worker hosting only after choosing a private background-processing model.
7. Owner-approve DAIP-0-02 and DAIP-0-12 with a hard dollar ceiling and automatic pause/alert rule.
8. Owner-approve DAIP-0-03 and DAIP-0-04 with one source-of-truth and controlled backup policy.
9. Owner-approve DAIP-0-05 with consent wording that separates service proof, customer view, gallery reuse, marketing reuse, and publication.
10. Owner-approve DAIP-0-06 with named internal review/approval responsibilities.
11. Owner-approve DAIP-0-07 and DAIP-0-08 with retention, legal-hold, incident, and dispute handling rules.
12. Owner-approve DAIP-0-09 using only a harmless staff-owned test set.
13. Owner-approve DAIP-0-10 with a realistic human review SLA and blocked-job escalation owner.
14. Owner-approve DAIP-0-11 confirming that the first private technical phase has no public destination.
15. Review Gate A and Gate B evidence, then freeze the decisions as a baseline for technical design.
16. Draft a separate private-storage/upload architecture that adds no public bucket, no direct browser DB access, and no automatic publishing.
17. Perform a cost and recovery review before writing the next migration.
18. Build only a private upload authorization and immutable provenance MVP after its separate security acceptance is signed off.
19. Then add non-public proxy/thumbnail/contact-sheet processing, retry/cancel controls, usage accounting, and audit trails outside Pages requests.
20. Only after privacy/export proof passes, consider a separate explicit-approved gallery/content handoff; retain zero automatic publishing.

### Build 219 boundary

Build 219 does not create a bucket, storage prefix, upload endpoint, original-media intake, signed URL, worker, queue execution, AI/vision/transcription, customer media view, Gallery/Social/GBP handoff, public derivative, or automatic publishing. It makes the prerequisite owner decisions and test evidence visible so the future technical build can be deliberately small and reviewable.

## Build 221 hotfix — customer-admin route 405 repair

Build 221 is a no-schema hotfix for the `/admin-customers.html` page after staging showed `api/admin/customer_admin_list` returning HTTP 405 while the page displayed the Customer account access visual placeholder.

What changed:
- Added generic Cloudflare Pages `onRequest` dispatchers to the Build 220 customer-admin endpoints so GET, POST, and OPTIONS are accepted through a single route entrypoint as well as the method-specific handlers.
- Added a safe page-side fallback so list-style customer-admin requests retry with GET if a deployment returns 405 on POST.
- Updated the service-worker cache to `rosie-app-v20260703build221` so old admin page code is less likely to stay cached.
- Added `data/build221_customer_admin_route_hotfix.json` and a Build 221 guard script.

No Supabase migration is required. Deploy the Pages site and Functions together, then hard-refresh `/admin-customers.html`. A correct result is a normal JSON response, authentication response, or permission response from `/api/admin/customer_admin_list`; it should not be 405.

DAIP boundary remains unchanged: no production storage, uploads, workers, AI, customer media access, public gallery export, social publishing, Google Business Profile export, or automatic publishing was added.


## Build 226 — DAIP metadata-only intake dry run (2026-07-08)

Build 226 adds a protected fictional-manifest validator at `/admin-daip-intake-dry-run.html`. It validates filename, MIME type, declared size, fictional SHA-256 shape, rejection reasons, aggregate size, and a planning-only cost estimate. It accepts no file bytes and creates no storage authorization, object path, worker execution, customer-media route, public destination, or publishing path. Gate C remains held.

Apply `sql/2026-07-08_build226_daip_intake_dry_run.sql` in staging only, then run one accepted and one rejected fictional manifest. The two living strategy documents remain this file and `MASTER_VALUE_ROADMAP.md`; older Markdown remains retained audit and release evidence.

## Build 227 — roadmap execution and DAIP validation policy (2026-07-09)

### Completed next 20 steps

1. Added a DB-backed active roadmap execution queue.
2. Seeded the current next 20 cross-workstream priorities.
3. Added roadmap status values: planned, in progress, blocked, done, and deferred.
4. Added priority, workstream, owner, target build, source document, and sort order.
5. Added safe evidence notes for deployment/test proof.
6. Added an append-only roadmap audit table.
7. Added protected admin dashboard and save APIs.
8. Added `/admin-roadmap-execution.html` with responsive desktop/mobile controls.
9. Added status KPI counts for the active next 20.
10. Added a visual placeholder for the internal execution workflow.
11. Moved DAIP manifest-count limits into a protected DB policy.
12. Moved image/video declared-size limits into the protected DB policy.
13. Moved storage-rate planning assumptions into the protected DB policy.
14. Added monthly warning and hard-stop planning values.
15. Forced Gate C to remain held at the database constraint level.
16. Forced technical capability to remain disabled at the database constraint level.
17. Updated Build 226 validation to read policy with safe code defaults.
18. Updated admin navigation, route copies, service worker, and access rules.
19. Updated canonical schema, active Markdown, test guidance, and release evidence.
20. Re-ran one-H1, route parity, JavaScript, CSS/responsive, and release checks.

### Next 20 steps after Build 227

1. Apply the Build 227 migration in staging and verify RLS/service-role containment.
2. Assign owners and statuses to all 20 seeded roadmap items.
3. Record Build 226 accepted and rejected fictional-manifest evidence.
4. Confirm warning and hard-stop amounts with the owners.
5. Complete all DAIP Gate A owner decisions.
6. Complete all DAIP Gate B safety-test evidence.
7. Conduct the independent Gate C rollback review.
8. Keep real uploads, storage, workers, AI, and publishing disabled until Gate C is separately approved.
9. Run customer recovery, archive, and restore staging tests.
10. Build a manual duplicate-customer merge dry run with no automatic transfer.
11. Verify Stripe final-balance settlement, cancellation, and webhook replay in test mode.
12. Verify notification delivery with a controlled inbox.
13. Run mobile weak-network upload retry tests using harmless test media.
14. Add approved final proof to gallery candidates only with consent/provenance.
15. Add approved final proof to vehicle history only after privacy review.
16. Gate review requests on settled payment, acknowledgement, and no unresolved incident.
17. Review Search Console and Business Profile evidence before changing local titles.
18. Replace public placeholders only with approved Rosie-owned local proof.
19. Archive redundant Markdown only after release-guard dependency scanning.
20. Continue one-H1, title/meta, local wording, error fallback, and CSS drift checks every pass.


## Build 228 — Creative Project Intelligence foundation (2026-07-12)

Build 228 changes the operational centre from product-first to **project/process-first**. `/admin-creative-projects.html` records a project idea, purpose, audience, lifecycle, work sessions, materials, mistakes/fixes, time, costs, outcomes, lessons, and future recommendations. Each new project receives governed output records for YouTube, Shorts, Reels, TikTok, Facebook video, Pinterest, Etsy draft, website page, blog, gallery, before/after, educational article, archive, material report, cost analysis, lessons learned, and future recommendations.

Publishing is never automatic: public publishing defaults off, consent review is separate, and every output follows planned → drafting → review → approved → scheduled → published or not applicable. Product pages and Etsy drafts are optional outputs; they are not the primary project record.

Primary migration: `sql/2026-07-12_build228_creative_project_intelligence_foundation.sql`. Primary UI: `/admin-creative-projects.html`. Canonical schema: `SUPABASE_SCHEMA.sql`.

### Next 20 steps after Build 228

1. Apply the Build 228 migration in staging and verify RLS/service-role containment.
2. Create one fictional project and verify all seventeen output records are seeded.
3. Test mobile project creation and session logging.
4. Add controlled project-to-booking association without making bookings the project source of truth.
5. Add media-manifest references after DAIP Gate C approval; keep file bytes disabled until then.
6. Add structured material-line usage tied to inventory transactions.
7. Add session time rollups and estimated-versus-actual labour.
8. Add project cost breakdown with material, labour, overhead, fees, and waste.
9. Add before/after applicability and consent gating.
10. Add a project story outline generated from approved session notes.
11. Add YouTube long-form outline drafts.
12. Add short-form hook and clip-plan drafts for Shorts, Reels, TikTok, and Facebook.
13. Add Pinterest title/description/image-plan drafts.
14. Add Etsy and website listing drafts without automatic publication.
15. Add blog and educational article drafts with source-note citations.
16. Add project archive export and recovery package.
17. Add lessons-learned extraction with human approval.
18. Add future-project recommendation ranking using completed project history.
19. Add output approval dashboard and destination readiness checks.
20. Keep one-H1, title/meta, local wording, responsive CSS, fallback, and privacy checks in every release.


## Build 229 completed — dual-path operations
- Preserved the normal client booking → detail → payment → completion path without project overhead.
- Added explicit staff opt-in from a selected booking to a linked creative project.
- Added source-mode and booking-link audit evidence.
- Kept consent review and public publishing disabled by default.

### Next priorities
1. Add structured material lines to creative projects without changing normal booking inventory use.
2. Add optional project templates for detailing, restoration, jewelry and education.
3. Add a project-output approval command centre.
4. Add manual unlink/archive controls with audit and no booking deletion.
5. Continue DAIP Gate C evidence before real media storage.


## Build 230 — Creative project costs, templates, drafts and controls (2026-07-13)

Build 230 extends only the opt-in Creative Project Intelligence path. Ordinary customer bookings remain standard jobs and retain their existing inventory, service, payment and completion workflow.

Added: structured project-only material, labour and other-cost lines; optional project templates; before/after applicability; consent status and summary; story/platform/commerce/report drafts; unified batch output review; reversible booking unlink, archive and restore; and a project-to-DAIP metadata association that is denied until Gate C is accepted and technical capability is explicitly enabled. Nothing publishes automatically.

Primary workspace: `/admin-creative-projects.html`. Migration: `sql/2026-07-13_build230_project_costs_templates_outputs.sql`.

## Build 231 completed

The project interface now supports editable/soft-deleted cost lines, profitability, non-commercial classifications, reviewed consumption records, booking comparison, templates, consent reminders, shot plans, approved-session story/platform planning, archive manifests, lessons approval and recommendation scoring. No normal booking inventory is mutated and no DAIP media capability is enabled.

## Next 20 project priorities

1. Replace JSON prompt editing for cost-line changes with dedicated accessible edit forms.
2. Connect reviewed project consumption to a transactional inventory RPC after owner approval.
3. Add reservation availability checks and conflict warnings.
4. Add revenue sources and sales-channel fee breakdowns.
5. Add break-even and target-margin guidance.
6. Add project budget variance alerts.
7. Add consent reminder delivery through the reviewed notification queue.
8. Add shot-plan ordering, ownership and capture evidence.
9. Add draft version history and comparisons.
10. Add human-reviewed AI provider adapters behind explicit cost limits.
11. Add YouTube chapter timecode editing.
12. Add clip evidence selection after DAIP Gate C.
13. Add Pinterest board administration.
14. Add Etsy taxonomy and shipping-profile lookup.
15. Add website schema validation and internal-link checks.
16. Add educational safety reviewer assignment.
17. Add downloadable project archive JSON/CSV packaging.
18. Add lessons-to-knowledge-base promotion.
19. Add recommendation scoring based on cost, audience and reusable skills.
20. Keep social publishing and DAIP media actions approval-only.


## Build 232 — accessible project controls and archive history (2026-07-15)

Build 232 replaces the remaining JSON prompt used to edit project material, labour and cost rows with an accessible dialog form. It adds project budget and target-margin guidance, budget variance and break-even calculations, assignable/evidence-aware shot plans, reviewed consent-reminder queue records, draft revision history, and authenticated metadata-only archive downloads. Ordinary bookings remain unchanged; inventory posting still does not mutate stock; DAIP Gate C and all media/publication controls remain held.

Migration: `sql/2026-07-15_build232_project_controls_archive_history.sql`. Workspace: `/admin-creative-projects.html`.

### Next 20 connected steps
1. Apply and test Build 232 in staging.
2. Add reservation availability checks against live inventory.
3. Define the transactional stock-posting and reversal RPC.
4. Add sales-channel revenue-source and fee lines.
5. Add budget-warning tasks to Today Needs Attention.
6. Connect approved consent reminders to the notification review queue.
7. Add shot-plan drag ordering and mobile capture evidence selection after Gate C.
8. Display draft version comparisons and restore controls.
9. Add provider-neutral AI draft adapter contracts with hard cost limits, disabled by default.
10. Add editable YouTube chapter timecodes.
11. Add clip evidence selection after Gate C.
12. Add Pinterest board administration.
13. Add Etsy taxonomy and shipping-profile lookup.
14. Add website schema validation and internal-link checks.
15. Add educational safety reviewer assignment.
16. Add CSV archive exports alongside JSON.
17. Add lessons-to-knowledge-base promotion with human approval.
18. Improve recommendation scoring with cost, audience and reusable-skill factors.
19. Add destination-readiness checks before social or commerce handoff.
20. Keep standard bookings, DAIP media and publishing approval-only.


## Build 233 — Supplier-link inventory intake
- Added a provider-neutral supplier-link preview contract, with Amazon.ca and Amazon.com enabled first.
- Staff paste a product URL, review extracted public metadata and suggested tool/consumable classification, then save through the existing authoritative inventory endpoint.
- Exact duplicate checks use normalized Amazon URL and ASIN. Imported images, prices and descriptions are drafts only and require human review.
- Import attempts are audited in `catalog_supplier_import_audit`; no browser credentials, scraping tokens or automatic purchases are introduced.
- Ordinary booking inventory, project reservation ledgers and DAIP Gate C remain unchanged.


## Build 234 — Separate Inventory Manager

Build 234 preserves the existing `admin-catalog.html` Inventory Workflow and adds `admin-inventory-manager.html` as an optional spreadsheet-style management surface. It supports row-level edits, suspicious-name review, filtering, sorting, soft archive, restore, desktop tables, and mobile cards. The authoritative save path remains `/api/admin/catalog_inventory_save`; no hard delete was added.


## Build 235 launch-polish milestone
Build 235 shifts effort toward operating the business safely: faster inventory data correction, seven-image product storytelling, readiness scoring, and a controlled go-live command center. Major new modules should remain secondary to payment, notification, backup, mobile, accessibility, security, and first-week operational proof.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.
## Build 239 value direction — one launch operating system

The highest-value simplification is now implemented: one Startup Command Center connects instructions, evidence, live production health, guided tests, and the current execution queue. Next value should come from completing evidence and controlled soft-launch work, not creating more standalone readiness dashboards.

The current next-20 cycle prioritizes deployment/migrations, scheduling, booking, payments, notifications, recovery, legal, mobile/accessibility, field uploads, incidents, retention, inventory/products, Search Console/Business Profile, soft launch, and documentation retirement.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->


## Build 242 update

- Repaired `/admin-daip-intake-dry-run` contrast and card styling.
- Replaced many SVG-only visual placeholders with reusable local raster photo-style placeholders.
- Advanced Startup Command Center cache-busting and service-worker references to Build 242.
- No new database migration was introduced in this build.

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->
# Build 247 value roadmap — raw projects become the content source

Build 247 establishes the private source-of-truth media layer needed for the DAIP business model: each real detailing project can retain immutable raw masters, generate lower-cost processing copies, identify strong before/during/after evidence, and eventually create governed website/social/video outputs without exposing raw customer footage.

### Completed in source
- Private Creative Project media ledger and R2 multipart session/part tables.
- Resumable 32 MiB upload workflow for large MOV/MP4 files.
- Duplicate-master protection, incomplete-upload abort, immutable-completed-master rule and private-only constraints.
- Processing-job queue metadata and optional Cloudflare Queue dispatch.
- Mobile/desktop DAIP Media Intake UI, Creative Project linking, Startup/Production/UI-health integration.
- Detailed private-R2 setup/acceptance instructions for the three historical detailing projects.

### Current next 20
1. Create and bind the private DAIP R2 bucket as DAIP_MEDIA_BUCKET.
2. Apply the Build 247 DAIP media migration in staging.
3. Upload and verify one private DAIP photo.
4. Prove a video larger than 300 MB uploads through multipart chunks.
5. Interrupt and resume a large video without restarting from zero.
6. Create/import the first historical detailing Creative Project and its raw media.
7. Create/import the second historical detailing Creative Project and its raw media.
8. Create/import the third historical detailing Creative Project and its raw media.
9. Configure the optional DAIP_PROCESSING_QUEUE binding.
10. Implement the processing consumer for proxy video, frames, audio and transcript.
11. Implement scene analysis and before/after candidate scoring.
12. Implement reviewed story assembly from selected evidence.
13. Implement a rendering adapter for long-form and short-form MP4 outputs.
14. Keep every generated derivative private until human consent/privacy review.
15. Add reviewed copy-to-public workflow for approved gallery/social derivatives.
16. Complete real-device DAIP uploader acceptance on desktop and mobile.
17. Continue catalog publish-readiness cleanup and product-image completion.
18. Complete booking, payment, refund and notification production acceptance.
19. Complete Search Console and Google Business Profile alignment.
20. Run an invite-only soft launch with daily evidence review.

### Next 20 after that
1. Add automatic proxy generation presets for 1080p and 720p editing copies.
2. Add key-frame extraction at scene boundaries and configurable intervals.
3. Add audio waveform and silence detection for narration/edit decisions.
4. Add speech-to-text transcript storage with timestamp segments.
5. Add privacy detection for license plates, faces and sensitive documents.
6. Add reviewed blur/redaction derivatives rather than modifying raw originals.
7. Add before/during/after auto-classification suggestions with manual override.
8. Add duplicate and near-duplicate visual detection across each project.
9. Add best-shot scoring for sharpness, exposure, framing and transformation evidence.
10. Add timeline storyboard editor with drag-and-drop selected evidence.
11. Add soundtrack/narration planning without embedding unlicensed music.
12. Add long-form YouTube edit recipe generation from the approved storyboard.
13. Add Shorts/Reels/TikTok vertical crop and hook recipe generation.
14. Add thumbnail candidate generation and review.
15. Add website-gallery and Google Business Profile derivative presets.
16. Add per-platform caption, title, description, hashtag and CTA drafts.
17. Add rendering cost/time estimates before starting expensive media jobs.
18. Add retry/dead-letter handling for failed processing jobs.
19. Add retention/storage-class policy for old proxies while preserving raw masters.
20. Add project-level “Content package ready for review” gate and one-click review queue.

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->

<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Specialist runbook: STARTUP_GO_LIVE_BLOCKERS.md | Inventory recovery: reviewed existing-row Amazon refresh -->

<!-- BUILD250_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public services clarity + rosie-assets/CarPhotos runtime manifest -->

<!-- BUILD251_SYNC: 2026-08-11 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Gate C dark-theme readability + approved rosie-assets/CarPhotos context -->
<!-- BUILD252_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public packages/landing_pages/CarPhotos R2 assignment -->


<!-- Historical release guard: # CURRENT LIVING AUTHORITY 2 OF 2 — Build 251 -->

<!-- BUILD253_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Photo Studio: /admin-photo-studio.html | Public manifest: /api/public_website_images | Migration: sql/2026-08-12_build253_photo_management_studio.sql -->
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images protected; explicit Photo Studio override only; automatic R2 matching fallback-only; Photo Studio reflow hotfix. -->

<!-- BUILD255_SYNC: 2026-08-12 | Photo Studio click-to-edit drawer + explicit grouped website target dropdown; no automatic image reassignment. -->
<!-- BUILD256_SYNC: 2026-08-12 | Photo assignment labels + checked occupied targets + explicit Before/After pairs; no automatic image reassignment. -->

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->

<!-- Historical release compatibility: # CURRENT LIVING AUTHORITY 2 OF 2 — Build 260 -->

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
