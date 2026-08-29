# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 267  
**Updated:** 2026-08-29  
**Read first:** `AI_PROJECT_HANDOFF.md`

## Current direction

Build 267 converts the private application from a broad Admin surface into a **role-aware module operating system**. The next work should prove the new database/server boundaries in Development, then continue event-driven notifications/native packaging and service economics without reintroducing always-awake pages.

## Completed in Build 267

- [x] Added one hierarchical private navigation authority across the seven internal staff modules.
- [x] Converted module home pages into categorized clickable workflow cards instead of flat legacy admin links.
- [x] Replaced the protected-page flat Admin menu with a module-local menu plus All Apps / Module Home / Account navigation.
- [x] Added focused role ceilings: Operations Manager, Accountant, I.T. Specialist, Promoter and DAIP Manager while retaining Detailer, Senior Detailer and Administrator.
- [x] Made Administrator a forced all-internal-modules role in resolver, browser auth, staff-save API and migration.
- [x] Reused `staff_users.permissions_profile.module_access`; no parallel staff entitlement table.
- [x] Added fail-closed Build 267 SQL that grants every current Admin all modules **before** expanding `role_code` values.
- [x] Reused `app_management_settings` for auditable role/module defaults.
- [x] Added route-scoped server module fallback so focused roles can use legacy APIs in their own module without receiving the old broad capability everywhere.
- [x] Preserved booking scope/action checks and DAIP/private-media gates.
- [x] Preserved Build 264 Detailer idle sleep, Build 265 lazy Operations/service convergence, and Build 266 installable PWA/module-switch foundation.

## P0 — apply and prove Build 267 safely

1. Inspect current Development `staff_users` and confirm which active rows are `role_code='admin'`.
2. Apply `sql/2026-08-29_build267_role_module_hierarchy.sql` in Development. Its admin grant/assertion must complete before role constraint expansion.
3. Read the affected Admin rows back and verify all seven internal module grants are true.
4. Hard-refresh and verify Build/cache identity is 267.
5. Sign in as an Admin and confirm all internal module cards appear and cannot be unchecked away.
6. Create controlled test users for Operations Manager, Accountant, I.T. Specialist, Promoter and DAIP Manager.
7. For each role, verify launcher shows only its role ceiling and direct links to other modules fail closed.
8. Run actual API acceptance: Accountant Finance success + Staff/I.T./DAIP denial; Promoter Socials success + Finance/Admin denial; I.T. technical success + business mutation denial; DAIP success + Social/Finance denial; Operations scoped success + Finance/Admin denial.
9. Verify Detailer remains Detailer-only; Senior Detailer remains Detailer + Operations only.
10. Observe representative Cloudflare traffic and keep **Exceeded CPU Time Limits = 0**.

## P1 — finish module ownership cleanup

1. Retire duplicate legacy Today/Blocks/Assign cards only after their Operations lazy equivalents pass parity testing.
2. Move any remaining private page that appears outside the hierarchy into exactly one primary module or explicitly mark it special/compatibility-only.
3. Continue replacing old broad capability names inside endpoints with named action capabilities (`finance_read`, `finance_post`, `it_diagnostics`, `social_publish`, etc.) where evidence shows value; the Build 267 route fallback is a compatibility bridge, not the final permission vocabulary.
4. Add a protected role/module matrix viewer in I.T. that reports roles, global switches and route ownership without reading business datasets.
5. Add regression evidence for every route newly assigned to a module.

## P2 — event-driven notifications / two-way app communication

1. Keep one job-message authority; do not build a parallel chat store without a demonstrated need.
2. Store explicit push subscriptions/preferences with consent, quiet hours and revoke controls.
3. Push only meaningful events: assignment/change, new customer/detailer message, arrival/start/complete, quote/payment action, urgent I.T. failure.
4. Push wakes the user; it must not become an excuse to restore aggressive polling.
5. Keep queued/sent/delivered/failed notification evidence distinct.

## P3 — full mobile + desktop packaging

- Continue PWA real-device acceptance first.
- Use Capacitor for the iOS/Android wrapper around the same Rosie modules when bundle IDs/signing/native push decisions are ready.
- Use Tauri only when true Windows/macOS tray, minimize-to-tray, auto-start and native background integration are required.
- Do not fork business logic into separate mobile/desktop codebases.

## P4 — service-cost / minimum-price authority

Retain the Build 265 business direction: model labour minutes, consumables, overhead and target margin for every package/add-on; calculate minimum viable price and flag underpriced services. Continue replacing visual placeholders with approved Rosie work proof and keep severe condition work quote-based.

## P5 — inherited go-live evidence

- Stripe deposit/final balance/refund/webhook acceptance.
- PayPal sandbox parity if retained.
- Email/SMS/push delivery and failure evidence.
- Inventory posting/reversal/idempotency.
- Real-device mobile/accessibility testing.
- Search Console / Business Profile / local proof review.
- Supabase restore and Cloudflare rollback rehearsal.
- DAIP private processing/derivative evidence before production promotion.

## Permanent runtime/security rules

- Role ceiling is a hard maximum, never a suggested menu.
- Per-user grants can narrow lower roles; Administrator always retains every internal module.
- Module OFF means the runtime does not load; OFF does not create a new permission grant.
- Server action/scope checks remain authoritative even when module entitlement passes.
- No module home or menu performs business-data reads.
- No recurring read without an explicit wake condition and sleep condition.
- No open Detailer job = no live Detailer monitor.
- No active Customer job = no customer progress refresh timer.
- Public SEO pages stay static-first, responsive and one-H1 compliant.

## Next clean checkpoint

Build 267 becomes Development-proven only after the actual database migration and controlled role/API tests pass. **Build 268 should then implement event-driven push/subscription authority and stronger named server capabilities**, not another flat dashboard.

<!-- Historical Build 266 exact release tokens: **Build:** 266 | Completed in Build 266 | server-side module entitlement | Capacitor | Tauri -->
<!-- Historical release-check compatibility only: Build:** 265 | Completed in Build 265 | service-cost / minimum-price authority | Build 264 Modular Runtime Roadmap | Build 265 Operations runtime -->

---

# Retained Build 265 roadmap snapshot — historical below this boundary

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
