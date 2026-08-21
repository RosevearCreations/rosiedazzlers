> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# Build 256 — Photo Assignment Visibility & Before/After Pairing

**Build date:** 2026-08-12

## What changed

- Assigned Photo Studio thumbnails now show the human-readable website destinations using that photo, such as `Ceramic coating — gallery image 1` or `Complete Detail — Mid-size vehicle`. Reused photos show the first two destinations plus a `+N more` indicator.
- The website-location dropdown marks occupied slots with `✓`. It distinguishes `— this photo` from `— assigned` so staff can see whether the selected image already owns the slot or another image does.
- Search/filter text now includes assignment labels, so searching for `gallery image 1`, `Complete Detail`, or a landing-page name can find photos by where they are used.
- Photo Studio adds explicit Before & After targets for Set 1, Set 2, and Set 3 on every managed service/location landing page.
- To make a pair: assign the first photo to `Before & After — Set N — Before`, select the second photo, then assign it to the same page/set `— After` slot.
- A public Before & After block renders only when both halves of the same set are explicitly assigned. A half-finished pair remains invisible.
- Existing package/product/add-on/landing images remain protected by the Build 254 precedence rule. Build 256 changes no existing assignment automatically.

## Database

No new SQL migration is required. The generic Build 253 `app_media_assignments` table already supports the new target keys.

## Safety

- Syncing R2 still changes no public placement.
- Selecting a thumbnail still changes no public placement.
- Checked dropdown items are informational only.
- Saving a target changes only that one target after explicit confirmation.
- Before/After pairs are additive and publish only when both sides are assigned.

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

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
