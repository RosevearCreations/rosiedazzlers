# Build 249 — Existing-row Amazon repair workflow

Build 249 fixes the remaining usability/data-integrity gap after the Build 248 parser repair. The old lower **Fill from Amazon link** button only derived text from the URL slug, while the upper supplier panel called the real metadata endpoint. Both paths now use the same review-first supplier parser.

## Repair an existing supply/tool

1. Open Inventory Workbench and choose `Amazon repair candidates` or search for the row.
2. Choose **Amazon refresh** (or Edit in Inventory Workflow). The existing `item_key` becomes the protected repair target and is locked in the editor.
3. Paste the correct Amazon.ca, Amazon.com, a.co or amzn.to link.
4. Choose the overwrite groups we actually trust: identity, classification, description, CAD price, featured image.
5. Run **Review Amazon update** and inspect the before/after list.
6. Save only after verifying the product/variation/package is correct.

Always preserved during supplier refresh: item key, quantity, reorder settings, purchase date, receipt, assigned station, service tags, gallery, ratings, visibility, active state and existing operational references/history. Amazon metadata (`amazon_asin`, source title/brand/category) and description now persist through the normal save endpoint.

A non-CAD observed Amazon price never overwrites `cost_cad`; staff must confirm the actual Canadian landed/invoice cost. Nothing saves merely because a supplier preview succeeded.

---

# Build 248 repair — Amazon supplier-link resilience

Build 248 fixes the `TypeError: patterns is not iterable` failure in `/api/admin/catalog_supplier_link_preview`. The parser now accepts both regular-expression arrays and individual patterns, resolves common `a.co`/`amzn.to` share links, validates the final Amazon host, limits the amount of remote HTML read into Worker memory, and keeps imports review-only.

Price handling is deliberately conservative: an observed Amazon.com/non-CAD price is returned as `source_price` + `source_currency`; it is not silently written into `cost_cad`. Staff must enter/confirm CAD cost after conversion or invoice review. A partial Amazon response may still create a reviewable draft instead of failing the entire workflow.

Supported review inputs: Amazon.ca, Amazon.com, `a.co`, `amzn.to`, or pasted share text containing one of those HTTPS URLs.

---

# Supplier Link Inventory Import — Build 233

The admin catalog accepts Amazon.ca and Amazon.com product links and creates a reviewable inventory draft. The endpoint normalizes the URL, extracts the ASIN and available public metadata, checks exact duplicates, suggests classification, and writes an audit event.

## Safety boundaries

- HTTPS and an allowlisted supplier host are required.
- The preview never saves inventory automatically.
- Administrators must review name, classification, image, price, quantity and notes.
- Amazon page markup can change or block automated reads; partial drafts remain supported.
- Images remain external URLs until separately reviewed and moved through the existing media process.
- No order placement, credential storage or customer-facing publication is enabled.

## Next supplier adapters

Canadian Tire, Home Depot, Princess Auto, Uline, Costco and Walmart should implement the same normalized preview response rather than create separate inventory schemas.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

Build 210 documentation sync
Build 211 documentation sync
Build 212 documentation sync
Build 213 documentation sync
Build 214 documentation sync
<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

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
