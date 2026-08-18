> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# Build 254 — Photo Preservation & Photo Studio Performance Hotfix

**Build date:** 2026-08-12

## Why this hotfix exists
Build 252/253 allowed automatic R2 filename matching to outrank images that were already deliberately configured in package, add-on and landing-page data. That could make a correct existing card appear to have been reassigned even though the original URL still existed. Build 254 restores the intended safety boundary.

## Image precedence after Build 254
1. A deliberately saved Photo Studio assignment may override one exact target.
2. Otherwise the existing configured/catalog image stays authoritative.
3. Automatic R2 filename matching is fallback-only when that established image is absent or cannot load.
4. Generic placeholders remain last-resort fallbacks.

In short, automatic R2 filename matching is fallback-only.

This means **Sync approved R2 photos**, editing alt text, renaming metadata, or merely uploading another descriptively named R2 image does not reassign an existing package/product/service image.

## Public-page repairs
- Principal service package cards restore `images_by_size` ahead of automatic R2 matches.
- Add-on cards restore `addonPrimaryImage` / established package artwork ahead of automatic R2 matches.
- Dynamic landing pages restore `local_hero_image_url`, `hero_image_url`, add-on imagery and existing product imagery ahead of automatic R2 matches.
- Explicit Photo Studio hero/gallery assignments remain available when an owner intentionally wants to replace or add imagery.
- Existing home cards that had no image remain eligible for additive R2 hydration.

## Photo Management Studio performance
- Removed the synchronous `scrollIntoView()` after each image selection.
- Selecting a photo no longer rebuilds the entire thumbnail grid.
- Library reload renders the grid once rather than twice.
- Search/filter rerenders are coalesced with `requestAnimationFrame()`.
- Photo cards use CSS containment/content visibility and image `decoding="async"` to reduce layout work.
- The page now states clearly that R2 sync/metadata editing cannot replace established site images.

The Chrome `Forced reflow` messages are performance warnings rather than application errors; Build 254 removes the known synchronous layout churn in Photo Studio that was causing them to be much easier to trigger.

## Database
No new SQL migration is required. Build 253's existing `app_media_library` / `app_media_assignments` schema remains in use.

## Safety rule going forward
Automatic discovery may fill an empty/broken image slot, but it must never silently replace a working authored/catalog image. Explicit target assignment is the only admin-managed override path.
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images protected; explicit Photo Studio override only; automatic R2 matching fallback-only; Photo Studio reflow hotfix. -->
<!-- BUILD250_SYNC: compatibility marker retained for cumulative Markdown guard. -->
<!-- BUILD251_SYNC: compatibility marker retained for cumulative Markdown guard. -->
<!-- BUILD252_SYNC: compatibility marker retained for cumulative Markdown guard. -->
<!-- BUILD253_SYNC: compatibility marker retained for cumulative Markdown guard. -->


<!-- BUILD255_SYNC: 2026-08-12 | Photo Studio click-to-edit drawer + explicit grouped website target dropdown; no automatic image reassignment. -->

<!-- Build 210 documentation sync -->
<!-- Build 211 documentation sync -->
<!-- Build 212 documentation sync -->
<!-- Build 213 documentation sync -->
<!-- Build 214 documentation sync -->
> **Build 237 synchronization (2026-07-28):** Compatibility/history marker retained; current authority remains the living handoff and roadmap.
> **Build 238 synchronization (2026-07-30):** Compatibility/history marker retained; current authority remains the living handoff and roadmap.
<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->
<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->
<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->
<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->
<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->
<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Inventory recovery: reviewed existing-row Amazon refresh -->
<!-- BUILD256_SYNC: 2026-08-12 | Photo assignment labels + checked occupied targets + explicit Before/After pairs; no automatic image reassignment. -->

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->
