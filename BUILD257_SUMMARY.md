# Build 257 — Cloudflare 1102 Photo Resource Hotfix

**Build date:** 2026-08-13

## Why this hotfix exists

The expanded public photo library made ordinary page loads and Photo Management Studio loads perform an R2 inventory scan. As the approved image library grew, those requests could normalize, sort and serialize thousands of objects and duplicate them in the manifest, creating a credible Cloudflare Worker CPU/memory pressure path and Error 1102.

## Resource-limit repairs

- Opening Photo Management Studio is now **database-first** and does not scan R2.
- R2 inventory is scanned only when staff explicitly press **Sync approved R2 photos**.
- The explicit R2 scan is bounded per approved prefix and omits unused HTTP/custom metadata.
- New managed-library rows are inserted into Supabase in batches of 100 instead of one large payload.
- Sync responses return only counts/warnings rather than echoing the complete R2 object inventory.
- `/api/public_website_images` now reads the synchronized managed photo library + active assignment rows; it never enumerates the R2 bucket during a public page request.
- The public manifest no longer duplicates every image under both `images` and `prefixes`. `prefixes` remains as an empty compatibility shell while consumers use `images` plus `prefix`.
- Public manifest JSON is compact and carries a short edge-cache window.
- Gate C falls back to filtering `images` for `CarPhotos/` instead of requiring a duplicated prefix array.

## Photo behavior preserved

Build 257 does not alter any image file, package/product image URL, explicit assignment, Before/After pairing, or assignment destination. Build 254 preservation rules and Build 255/256 editor behavior remain authoritative.

## Operating workflow

1. Upload or add approved public images in R2.
2. Open Photo Management Studio.
3. Press **Sync approved R2 photos** once after direct R2 changes.
4. Ordinary editor refreshes now load the managed database library only.
5. Assign or edit photos normally.

No SQL migration is required for Build 257.

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->

<!-- BUILD252_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD253_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD254_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD255_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD256_SYNC: retained for cumulative release compatibility. -->

<!-- BUILD247_SYNC: 2026-08-12 | Historical compatibility marker retained. -->
<!-- BUILD248_SYNC: 2026-08-12 | Historical compatibility marker retained. -->
<!-- BUILD250_SYNC: 2026-08-12 | Historical compatibility marker retained. -->
<!-- BUILD251_SYNC: 2026-08-12 | Historical compatibility marker retained. -->
<!-- BUILD252_SYNC: 2026-08-12 | Historical compatibility marker retained. -->
<!-- BUILD253_SYNC: 2026-08-12 | Photo Studio schema retained. -->
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images remain protected. -->
<!-- BUILD255_SYNC: 2026-08-12 | Click-to-edit editor retained. -->
<!-- BUILD256_SYNC: 2026-08-12 | Assignment labels + checked destinations + explicit Before/After pairs. -->
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
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->
