# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 265  
**Updated:** 2026-08-29  
**Read first:** `AI_PROJECT_HANDOFF.md`

## Current business direction

Rosie should compete on **clear mobile service, truthful condition-based scope, strong proof, easy booking/quote decisions, reliable operations and owner-editable content** rather than competing primarily on low add-on prices.

Build 265 closes the major source-side gap around add-on service depth: all current add-ons now have detailed canonical landing content and market-aware starting prices, with severe/restoration conditions explicitly allowed to expand into a larger quote.

## Completed in Build 265

- [x] Repriced all 24 current add-ons using Ontario/GTA competitor ranges as a sanity benchmark.
- [x] Added condition pricing and pricing-basis metadata for restoration/variable-labour services.
- [x] Made quote-required add-ons requestable without treating starting price as final checkout price.
- [x] Added detailed content to every canonical add-on page: purpose, process, equipment, scope, exclusions, prep, aftercare, quote triggers, limitations and FAQ.
- [x] Added headlight severity tiers and replacement/referral boundaries.
- [x] Added carpet spill/extraction escalation through under-carpet restoration, safe disassembly and drying concerns.
- [x] Fixed landing-page fallback precedence so explicit rich content is authoritative.
- [x] Consolidated duplicate ceramic/odor/headlight intents with 301 canonical redirects.
- [x] Added static-first SEO fallback content to all 24 add-on routes.
- [x] Preserved one-H1/canonical/metadata/structured-data rules.
- [x] Added visual proof placeholders and service-specific photo briefs.
- [x] Added responsive CSS for new detail/pricing/scope blocks.
- [x] Converted `/app/operations/` from a protected bridge into a lazy/manual modular runtime for Today, Schedule, Blocks, Assignments and Live Snapshot.
- [x] Kept Operations auto-monitoring OFF; no workstream dataset loads merely by opening the shell.
- [x] Consolidated Markdown governance back to two living authorities.

## Priority 0 — prove the deployment is healthy

These gates depend on the deployed Development environment and cannot be truthfully closed from a source ZIP alone.

1. Deploy Build 265 source + Functions together and confirm cache/service-worker identity is Build 265.
2. Confirm Cloudflare representative runtime evidence: **0 exceeded CPU**, 0 script exceptions, 0 memory-exceeded terminations.
3. Verify the corrected Build 262 analytics rollup migration is present before applying anything; never reapply by assumption.
4. Authenticated Detailer acceptance: idle/standby/open-job transitions, lazy live module, event-driven notes/media and no recurring API loop.
5. Authenticated Operations acceptance: opening `/app/operations/` causes no operational dataset reads; each selected workstream performs one explicit read; Live Snapshot never begins polling.
6. Run current release/SEO/mobile checks against the deployed artifact and compare with local source results.

## Priority 1 — prove the new public revenue path

1. Review the 24 add-on starting prices as owners and adjust any price that does not match actual Rosie labour/product cost.
2. Photograph real examples for the service-specific placeholder briefs, beginning with:
   - headlight: light haze / moderate yellow / heavy oxidation / restored pair;
   - carpet: routine soil / salt or spill / extraction / dry finished result;
   - pet hair severity;
   - odor-source cleaning rather than ozone-only proof;
   - paint correction test spot;
   - ceramic preparation + finished paint;
   - engine bay before/after;
   - trim restoration before/after.
3. Assign approved R2 images through Photo Management Studio; do not silently replace authored images from filename matching alone.
4. Test Small/Mid/Oversize and quote-required wording on Services, Pricing and Booking at desktop, tablet and ~390px phone widths.
5. Verify all condition-quote requests reach the staff quote/booking workflow without charging a blind add-on amount.

## Priority 2 — owner-friendly service economics

Next source-side business feature should be a **service-cost / minimum-price authority**, not another disconnected page.

For every add-on store:

- estimated labour minutes by condition tier;
- chemical/consumable allowance;
- equipment/overhead allowance;
- target gross margin;
- minimum viable price;
- current public starting price;
- warning when public starting price is below the configured minimum.

Use this to make pricing adjustments evidence-based as Rosie learns actual job times.

## Priority 3 — finish Operations modular migration

Build 265 establishes manual lazy reads. Continue migration in this order:

1. Move safe Today task actions into the Operations module with authoritative mutation responses and no automatic reload loops.
2. Add date-scoped Schedule reads so the server no longer has to return the entire booking table for a 14-day view.
3. Add Block create/remove actions with explicit confirmation and local response patching.
4. Add Assignment mutation controls using scoped booking IDs and staff capability checks.
5. Add Live detail lazy child module only after an owner selects an active job; keep auto-refresh disabled by default.
6. Migrate Quotes and Customer operational support only after the first five workstreams are accepted.

## Priority 4 — external commercial acceptance

1. Stripe test/development: deposit, final balance, refund and webhook idempotency.
2. PayPal sandbox: equivalent happy/failure/replay cases if PayPal remains enabled.
3. Notification provider: real email/SMS delivery, retries and safe failure evidence.
4. Gift cards: verify public inventory/display/purchase path.
5. Maintenance plan + fleet quote conversion flow.
6. Quote Pipeline edit/follow-up/booking handoff.

## Priority 5 — inventory/accounting reliability

1. Transactional inventory posting, idempotency, shortage handling and compensating reversal acceptance.
2. Cost-template selection/application.
3. Marketplace fees as percentage of revenue.
4. Allocate shared project costs across linked products/projects where needed.
5. Month-end accounting close/lock and accountant export acceptance.
6. Keep financial writes server-authoritative and reversible/auditable.

## Priority 6 — public proof, local SEO and accessibility

1. Replace visual placeholders with approved real work, never privacy-sensitive DAIP media.
2. Gallery should deliberately include Before/After, Evidence, Technique and Efficiency proof—not just a generic photo stream.
3. Search Console: sitemap discovery, index coverage, canonical selection and structured-data review.
4. Google Business Profile: service/category/photo/review consistency with the site.
5. Keyboard/focus/labels/contrast/reduced-motion pass.
6. Real-device Safari/Chrome/Android/iOS layout acceptance.
7. Keep one H1, descriptive page-specific titles and genuinely useful local text; no town-keyword doorway cloning.

## Priority 7 — DAIP only after operational/commercial gates

Private DAIP remains a controlled evidence/content system, not a public raw-media library. Before promotion:

- accept private intake/storage boundaries;
- implement processor retry/dead-letter handling;
- verify artifacts exist before processing jobs can become complete;
- review temporal evidence/lesson recommendations before publishing derivatives;
- maintain explicit privacy/consent and public/private separation;
- generate Creative Project → Content Studio packages only from reviewed evidence.

## Do not regress

- Do not return to bargain flat pricing for labour-variable restoration work.
- Do not charge quote-required starting prices as final without condition confirmation.
- Do not create duplicate indexable service URLs for the same intent.
- Do not add recurring polling simply because a module is visible or authorized.
- Do not scan R2 on ordinary public requests.
- Do not auto-retry ambiguous writes.
- Do not let old Markdown “CURRENT” headings override the two living authorities.

## Definition of the next clean checkpoint

Build 265 becomes a clean Development checkpoint when local release checks are green **and** the deployed Development environment proves cache identity, authenticated Detailer/Operations behaviour, condition-quote booking flow, representative mobile/desktop rendering and Cloudflare CPU stability. After that, start Priority 2 service economics and the next Operations mutation migration rather than reopening already-converged landing-page architecture.

<!-- HISTORICAL RELEASE-CHECK COMPATIBILITY — not a living authority.
Build 209
Next 20 value-added steps
Build 210
Completed 20 steps
Build 211
Build 212 — guided production testing completed
Build 213 — owner action control
Completed 20-step
Build 214 — security containment and owner-task orchestration
Build 215
Build 216
Build 217
Build 218 — next 20 DAIP and customer-proof steps
DAIP Test Lab safety-preflight
Build 219 — DAIP governance workspace and held promotion gates
Build 219 boundary
Build 220 — customer access management and DAIP readiness packet
Build 220 boundary
Build 221 hotfix — customer-admin route 405 repair
Build 222 — DAIP Phase 1 readiness review
Next 20 connected steps after Build 222
Build 223 — DAIP private-MVP design blueprint
Next 20 connected steps after Build 223
Build 225 — Social & Analytics Connections Centre
Next 20 connected steps after Build 225
Next 20 project priorities
Build 236 active roadmap
Build 238 — Inventory transactions
Build 239 value direction
Build 248
Current next work
processing consumer
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 249
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 250
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 251
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 252
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 253
Photo Management Studio
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 254
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 255
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 256
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 258
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 259
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 260
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 261
public analytics off protected
# CURRENT LIVING AUTHORITY 2 OF 2 — Build 262
CPU stabilization
Exceeded CPU
Build 263 Architecture Foundation
Build 264 Modular Runtime Roadmap
Build 265 Operations runtime

Build 210 documentation sync
Build 211 documentation sync
Build 212 documentation sync
Build 214 documentation sync
-->


<!-- Build 265 historical automation compatibility: Build 238 synchronization (2026-07-30) -->
<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->
<!-- Build 246 synchronization: historical compatibility -->
<!--
BUILD240_SYNC:
BUILD247_SYNC:
BUILD248_SYNC:
BUILD250_SYNC
BUILD251_SYNC
BUILD252_SYNC
BUILD253_SYNC
BUILD254_SYNC
BUILD255_SYNC
BUILD256_SYNC
BUILD257_SYNC:
BUILD258_SYNC:
BUILD259_SYNC:
BUILD260_SYNC:
DOCUMENT STATUS — Build 260
-->
