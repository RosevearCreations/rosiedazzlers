> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# Build 258 — Public Photo Consistency, Gallery Expansion & Safe Cleanup

**Build date:** 2026-08-13

## Why this build exists

The Photo Management Studio could store explicit assignments, but several public surfaces still rendered through older independent image paths. Refreshed R2 objects could also keep the same URL while the managed library retained an older ETag, allowing an old browser/CDN copy to remain visible. Build 258 connects those consumers without changing existing assignments automatically.

## Public photo consistency

- Pricing **Town-focused detailing pages** now consume the same explicit landing-hero assignments as their actual town pages.
- Pricing **High-intent service pages** now consume the same explicit landing-hero assignments as the matching service pages.
- Services **Special detailing landing pages** and **Town-focused detailing pages** use explicit Photo Studio assignments.
- Services **Full service hub** has its own explicit image targets; managed cards no longer receive a generic visual placeholder beside a real managed photo.
- FAQ **Where these pages are accessed** cards have explicit image targets.
- Gift Cards now shows three visual gift-card choices even before custom photos are assigned, and each choice can receive an explicit Photo Studio image.
- Home, Pricing, Services, and managed landing pages expose editable review-proof targets.
- The dynamic landing-page script is cache-busted to Build 258 across the service/town routes.

## Same-filename R2 replacement refresh

Explicit **Sync approved R2 photos** now compares R2 ETag, object size, upload timestamp, and URL against the existing managed row. When an existing R2 key has been replaced, only its storage identity fields are refreshed; alt text, title, caption, tags, focal point, and assignments are preserved.

Public image URLs now carry a sanitized R2 ETag/update version token. Replacing a photo under the same R2 filename can therefore invalidate the old public image URL after Sync without requiring a new assignment.

Build 257's resource-limit boundary remains intact: ordinary public requests and ordinary Photo Studio loads do not enumerate R2. R2 scanning still happens only through the explicit Sync action and stays bounded.

## Gallery expansion

The public Gallery now combines the existing privacy-reviewed legacy Before/After feed with Photo Studio-managed content:

- all completed landing-page Before/After sets;
- up to eight dedicated Gallery Before/After sets;
- twelve **Evidence** slots;
- twelve **Technique** slots;
- twelve **Efficiency** slots.

A Before/After pair is public only when both halves of the same set are explicitly assigned. Evidence/Technique/Efficiency are independent single-image placements.

## Photo Studio cleanup

Photo cards continue to show their assignment names and checked/occupied targets. Build 258 adds permanent deletion for duplicate/old public images only when there is no active assignment. The server re-checks active usage immediately before deleting, clears inactive placement history tied to that deleted file, deletes the managed row, then deletes the approved R2 object. If the R2 delete fails, the managed record/history is restored where possible.

## Services CSS repair

The **Which service should we choose?** decision cards now use three columns on large desktop screens, two columns on tablet/smaller desktop, and one column on phones. Modified public pages also use a Build 258 stylesheet cache token so the repaired CSS is actually requested after deployment.

## Safety boundaries

- No existing photo assignment is changed by deploying Build 258.
- Existing authored/catalog imagery remains protected under the Build 254 precedence rule.
- Automatic filename matching remains fallback-only.
- Private `DAIP_MEDIA_BUCKET` content remains outside the public Photo Studio.
- Build 257's no-R2-scan-on-public-load rule remains active.
- No new SQL migration is required for Build 258; Build 253's media/assignment schema remains authoritative.

## Recommended acceptance

1. Deploy Pages + Functions together and hard-refresh.
2. Open Photo Studio normally and confirm it loads without an R2 scan/1102.
3. Press **Sync approved R2 photos** once and note both **new** and **refreshed** counts.
4. Replace one harmless R2 object under the same filename, Sync, and verify the thumbnail/public card receives the new versioned URL.
5. Check Pricing town/service cards, Services special/town/hub cards, FAQ access cards, Gift Cards, and review-proof slots.
6. Assign Gallery Evidence/Technique/Efficiency photos and more than one completed Before/After pair; verify all appropriate items appear.
7. Choose an unassigned duplicate in Photo Studio, delete it, and verify an actively assigned photo is refused.

No SQL migration is required for Build 258.

<!-- BUILD258_SYNC: 2026-08-13 | Public photo-consistency consumers, same-key R2 refresh/versioning, mixed Gallery, safe unassigned delete, Services CSS repair; Build 257 resource boundary retained. -->

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix retained: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->
<!-- BUILD252_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD253_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD254_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD255_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD256_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD247_SYNC: 2026-08-12 | Historical compatibility marker retained. -->
<!-- BUILD248_SYNC: 2026-08-12 | Historical compatibility marker retained. -->
<!-- BUILD250_SYNC: 2026-08-12 | Historical compatibility marker retained. -->
<!-- BUILD251_SYNC: 2026-08-12 | Historical compatibility marker retained. -->
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
<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Inventory recovery: reviewed existing-row Amazon refresh -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->
