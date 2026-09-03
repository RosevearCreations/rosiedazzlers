# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 314  
**Updated:** 2026-09-03  
**Read next:** `MASTER_VALUE_ROADMAP.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## Current release state

Build 314 is the current **Media / Photo Studio reliability** Development candidate. Work began only after `main` and `dev` were independently verified at the same accepted Build 313 commit:

`813cf492841503ad972168cb630d28054d2774d0`

That exact Build 313 SHA is also the accepted Production `main` boundary. Production Acceptance run `33786314308` succeeded on that exact source, including exact-SHA Cloudflare deployment resolution, immutable Production smoke and public Production-alias smoke. Build 314 does **not** authorize a Production promotion; `main` remains on Build 313 while Build 314 is accepted on Development.

The Build 314 feature branch is `build314-media-photo-studio-reliability`. Build 314 Source Gate run `33790777028` is GREEN on feature SHA `5e018b905b7a5014d90c7e8f8089a1f521702e3d`: JavaScript/Python syntax, Build 314 reliability invariants, cumulative release checks, SEO/H1 checks, route-copy checks and source hygiene all passed.

## Build 314 authority

Build 314 is bounded reliability hardening. It introduces no schema migration, pricing/booking business-rule change, permission broadening, provider transaction, public-proof fabrication or Production mutation.

### R2 / Cloudflare resource safety

- ordinary Photo Studio loads stay database-first and do not scan R2;
- R2 is scanned only through the explicit **Sync approved R2 photos** action;
- each Worker sync invocation is one approved prefix, one R2 list page and at most 100 approved objects;
- the browser follows continuation cursors with separate bounded HTTP requests;
- reconciliation is page-local and database writes remain batched;
- the Studio reports how many bounded requests were used rather than hiding a monolithic scan.

### Exact assignment tracking

`functions/api/admin/photo_library_list.js` now projects active placement authority onto each managed photo:

- `assignment_count`;
- `assigned_targets`;
- `before_after_slots`.

The API also reports when the active-assignment safety cap is reached so an incomplete audit cannot be presented as complete.

### Before / After integrity

`functions/api/admin/photo_assignment_save.js` now resolves the `:before` / `:after` counterpart for `before_after_pair` targets and rejects use of the same managed photo on both sides with HTTP 409. Existing explicit-placement behavior remains unchanged: selecting a photo does nothing until staff deliberately saves a target.

### Deletion safety

`functions/api/admin/photo_library_delete.js` already failed closed on active `app_media_assignments`. Build 314 extends that boundary to Gallery proof stored separately in the `before_after_gallery` editable setting. A managed photo referenced by either `before_url` or `after_url` in a draft or published Gallery row cannot be deleted until the Gallery reference is replaced or removed.

The database FK remains the final race-condition guard, and existing compensation remains: if R2 deletion fails after database removal, the managed media row and inactive placement history are restored.

## Build 314 validation authority

- `scripts/build314_release_check.py` — bounded R2 sync, database-only ordinary loads, exact placement tracking, distinct Before/After pairing and Gallery-aware deletion guard.
- `.github/workflows/build314-source-gate.yml` — Build 314 syntax + focused reliability checks + cumulative source/SEO/route/hygiene authorities.
- `BUILD314_SUMMARY.md` — bounded implementation checkpoint.
- retained `scripts/release_check.py`, `scripts/seo_h1_check.py` and `scripts/sync_route_copies.py --check` remain cumulative authorities.

Do not call Build 314 Development-closed until the documentation-synchronized Build 314 head is fast-forwarded to `dev` and the resulting Development/Cloudflare acceptance for that exact SHA is green. Do not move `main` as part of that Development closeout.

## Next autonomous build

After Build 314 is Development-accepted, continue with **Build 315 — Content/Socials maintainability extraction**.

Build 315 may modularize the mature Content Studio / Socials administration runtime, but external publishing must remain disabled unless real provider authority already exists. It must not fabricate provider connection, posting, delivery or account-ownership evidence.

## Current application boundary

Rosie Dazzlers remains one secured, mobile-first platform with eight independently loadable modules:

1. Customer
2. Detailer
3. Operations / Supervisor
4. Business Administration
5. I.T. & Reliability
6. Finance
7. DAIP
8. Socials & Promotion

Permanent rule: **role defines the maximum module set; a staff profile may narrow non-admin access; a global module switch may make a module unavailable; workflow state decides whether an authorized module wakes.** Server authorization remains authoritative and dormant modules stay asleep.

## Retained current authority

- Build 310 proves the existing Admin full-access matrix without broadening role/action authority.
- Build 311 externalizes Inventory Operations runtime without changing stock/accounting rules.
- Build 312 hardens deterministic inventory integrity; stock overdraw rejects rather than clamps and purchase-order receipt remains replay-safe.
- Build 313 externalizes Product/Catalog administration into `assets/admin-app-v313.js` while preserving pricing, packages, add-ons, service areas, public requirements and app-settings authority.
- Build 313 is the accepted Production boundary at `813cf492841503ad972168cb630d28054d2774d0`.
- Build 308 remains the canonical exact-SHA Cloudflare Development acceptance/recovery authority through `scripts/cloudflare_pages_development.sh`; normal acceptance is read-only and recovery remains manual/fail-closed.
- Build 307 remains the GREEN/AMBER/RED I.T. readiness interpretation layer; GREEN requires direct evidence and configuration is not transaction acceptance.
- Build 306 remains the read-only six-family System Health observation authority.
- Build 305 retains the seven-action Finance authorization vocabulary and fail-closed role ceilings.
- Build 304 retains accountant-export privacy/integrity authority without tax judgment.
- Build 303 remains the historical Tax Support maintainability extraction; it is no longer the current Production boundary because Build 313 was deliberately promoted and accepted on 2026-09-03.

## Retained business/runtime authority

- current Small/Mid/Oversized + condition/quote pricing authority remains unchanged;
- Complete remains **Best value** and Exterior Detail remains differentiated from Premium Wash;
- current availability, conflict, deposit, checkout and payment mechanics remain authoritative;
- one meaningful H1 per indexable public page remains mandatory;
- no fabricated accounting/tax facts, reviews, consent, proof or provider evidence;
- private/customer media never becomes public without consent/privacy review and explicit publication;
- Rosie brings standard detailing water and power; customers provide a safe/private/permitted work area;
- no background polling merely because a module exists.

## Manual/external evidence that must not be fabricated

- genuine customer/public-use consent and proof context;
- Google Business Profile/Search Console ownership or verification;
- maintenance, fleet or referral economics not explicitly approved;
- real email/SMS/Web Push delivery;
- real payment-provider transaction, settlement, refund or webhook acceptance beyond configuration-present evidence;
- accountant/tax judgment;
- physical-device evidence not established by automated acceptance.

## Permanent runtime/cost guardrails

- no open Detailer job → no live job/media/message monitors;
- hidden/inactive refresh sleeps;
- completed jobs reject new live-message writes;
- no automatic replay of ambiguous non-idempotent writes;
- heavy aggregation belongs in Postgres rather than Worker loops;
- Functions remain under `/api/*`;
- secrets never belong in browser code or Git.

## Retained guard compatibility markers

These are historical focused-guard anchors, not the living build number.

- **Build:** 274 — I.T. Connections; Quick Book; Mobile Auto Detailing & Interior/Exterior Restoration.
- **Build:** 283 — proof/media publication authority remains retained; explicit publish/unpublish governs public proof.
- **Build:** 284 — contextual proof placement remains retained.
- **Build:** 287 — review/share attribution authority remains retained.
- **Build:** 288 — customer/staff privacy boundary remains retained.
- **Build:** 289 — account accessibility and weak-network resilience remains retained.
- **Build:** 290 — forward restore and authorization acceptance remain retained.
- **Build:** 291 — maintenance retention intake remains retained.
- **Build:** 292 — fleet/workplace acquisition intake remains retained.
- **Build:** 293 — customer retention next-action hub remains retained.
- **Build:** 294 — customer maintenance / auto-schedule authority closure remains retained.
- **Build:** 295 — customer account static source authority cleanup remains retained.
- **Build:** 296 — My Account maintainability extraction remains retained.
- **Build:** 297 — Operations customer support maintainability extraction remains retained.
- **Build:** 298 — Operations booking/quote support maintainability extraction remains retained.
- **Build:** 299 — Operations booking-dashboard support maintainability extraction remains retained.
- **Build:** 300 — Finance Payments maintainability extraction remains retained; duplicate-route cleanup belongs to Build 318.
- **Build:** 301 — Finance Reconciliation maintainability extraction remains retained.
- **Build:** 302 — retired Statement Import boundary remains retained.
- **Build:** 303 — Tax Support maintainability extraction remains retained as historical authority.
- **Build:** 304 — Accountant export integrity remains retained.
- **Build:** 305 — Finance authorization sweep remains retained.
- **Build:** 306 — I.T. Health dashboard extraction remains retained.
- **Build:** 307 — I.T. readiness diagnostics upgrade remains retained.
- **Build:** 308 — Cloudflare deployment/recovery consolidation remains retained.
- **Build:** 309 — Staff Administration maintainability extraction remains retained.
- **Build:** 310 — Admin full-access acceptance matrix remains retained.
- **Build:** 311 — Inventory Operations maintainability extraction remains retained.
- **Build:** 312 — Inventory data-integrity sweep remains retained.
- **Build:** 313 — Catalog/Product Administration extraction remains retained and is the current Production boundary.
- **Build:** 314 — Media/Photo Studio reliability is the current Development closeout.

## Documentation policy

This file and `MASTER_VALUE_ROADMAP.md` are the living implementation/planning authorities. `AUTONOMOUS_RELEASE_QUEUE.md` records the agreed execution sequence. Build summaries are release checkpoints; Git history is the archive.