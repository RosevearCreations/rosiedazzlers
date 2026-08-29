# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 266  
**Updated:** 2026-08-29  
**Read first:** `AI_PROJECT_HANDOFF.md`

## Current direction

The next value is **not more always-loaded screens**. Rosie should become one application platform whose modules are permission-scoped, conditionally awake and installable across phone/desktop/web while preserving the static-first public site.

## Completed in Build 266

- [x] Expanded the four-shell foundation to eight modules: Customer, Detailer, Operations, Administration, I.T., Finance, DAIP, Socials & Integrations.
- [x] Added a hard role ceiling: Detailer → Detailer only; Senior Detailer → Detailer + Operations; Admin → explicitly granted internal modules.
- [x] Reused `staff_users.permissions_profile.module_access` for per-user module grants; no new staff-access DDL.
- [x] Added global module on/off switches in existing `app_management_settings.module_runtime_flags`.
- [x] Locked I.T. on as the recovery/control plane.
- [x] Added 15-minute browser caching of the one-row module switch snapshot with no timer.
- [x] Added I.T., Finance, DAIP and Socials/Integrations entry shells that load no subsystem dataset merely by opening.
- [x] Re-scoped Administration away from Finance/I.T./DAIP/Socials.
- [x] Preserved Detailer open-job-only live bundle and Operations explicit/manual workstream loading.
- [x] Converted Customer Progress from perpetual interval polling to active-job-only one-shot refresh; inactive/hidden state sleeps.
- [x] Exposed existing customer/detailer job updates as the two-way job messaging path.
- [x] Added PWA icons, shortcuts, install controls, local device-notification permission/test and event-driven service-worker push handlers.
- [x] Reduced service-worker precache to the shared launcher layer so optional modules are not eagerly downloaded.
- [x] Restored Build 265 pricing/landing-page function mirrors found drifted in the newly supplied package.

## Priority 0 — deploy and prove the module boundary

1. Deploy Build 266 Pages + Functions together and confirm cache/build identity `rosie-app-v20260829build266` / resolver Build 266.
2. Confirm `_routes.json` still invokes Functions only under `/api/*`.
3. Sign in as a **Detailer** and prove `/app/` shows only Detailer; direct Finance/I.T./DAIP/Socials/Admin/Operations routes must deny/return to Apps.
4. Sign in as a **Senior Detailer** and prove only Detailer + Operations can be granted.
5. Sign in as **Admin**, remove one module grant in Staff & Access, and prove it disappears/blocks without altering legacy action capabilities.
6. In I.T., turn Finance off globally and prove Finance disappears/blocks for otherwise authorized staff; turn it back on.
7. Leave I.T./Finance/DAIP/Socials/Admin shells open for five minutes and confirm they create no subsystem API traffic.
8. Repeat Detailer no-open-job test: no live bundle/feed/media/messaging traffic.
9. Open Customer Progress for a completed/inactive job and prove no refresh timer/API loop remains.
10. Observe representative Cloudflare traffic and retain **Exceeded CPU Time Limits = 0** as the reliability gate.

## Priority 1 — finish module ownership rather than duplicating screens

Migrate existing legacy pages behind the new module boundaries without copying business logic.

1. **Operations:** Quotes/customer operational support, then mutations for Today/Schedule/Blocks/Assignments using scoped responses and local patching.
2. **Administration:** staff/access, inventory/catalog, public content/media, business/site controls.
3. **I.T.:** move all preflight/test/cache/runtime/security/launch/recovery navigation here; remove duplicate technical links from business dashboards.
4. **Finance:** accounting, payments, payroll, tax, close/reconciliation and accountant export.
5. **DAIP:** governance/readiness/private media/evidence/creative-content workflow, retaining all current hold gates.
6. **Socials & Integrations:** connection state, explicit provider tests, content/social handoff; never wake external APIs from app/module load.
7. Keep route aliases during migration; retire only after permission/runtime acceptance proves parity.

## Priority 2 — harden server namespaces to match the UI modules

The Build 266 role ceiling protects what users see/load, but UI hiding is never the final security boundary.

1. Add module ownership metadata to protected API groups.
2. Require server-side module entitlement in addition to existing action capabilities on sensitive Finance/I.T./DAIP/Socials/Admin APIs.
3. Keep Detailer job APIs booking-scoped even when the Detailer module is granted.
4. Keep financial/private-media/settings writes server-authoritative.
5. Add automated regression cases proving a Detailer cannot call Finance/I.T./DAIP/Admin endpoints even if an old legacy capability flag was mistakenly left true.

## Priority 3 — notifications and two-way communication without polling

1. Keep the current job feed as the single two-way job message authority; do not create a parallel chat database until evidence requires it.
2. Add unread/message state to Customer and Detailer app surfaces from bounded current-job reads.
3. Configure a real remote push strategy (Web Push and/or native provider) with consent, quiet hours, unsubscribe/revoke and cost controls.
4. Save push subscriptions only after user action; never subscribe automatically.
5. Trigger push from meaningful events (new customer message, detailer reply, schedule change, payment/quote action) rather than periodic checks.
6. Keep notification delivery/retry auditable and separate queued-versus-delivered status.
7. Add offline/weak-network compose protection only after field tests define required behaviour; avoid automatic duplicate message replay.

## Priority 4 — mobile + desktop packaging

### Shared PWA first

- Accept install/add-to-home-screen on current Android/iOS/desktop browsers.
- Test camera/file capture, weak Wi-Fi/cellular, offline fallback, resume and standalone display.
- Verify app icons/shortcuts and local device notifications.

### Native mobile wrapper next

Use Capacitor around the same hosted/bundled web modules when we are ready to choose bundle IDs, signing, app-store accounts and native push provider. Do not fork business logic.

### Native desktop wrapper only when needed

Use Tauri around the same modules if we need true Windows/macOS tray, minimize-to-tray, auto-start, background native notifications or stronger OS integration. An installed PWA already covers standalone window/taskbar/pinning without adding a second native maintenance burden.

## Priority 5 — retain Build 265 service economics direction

1. Review the 24 add-on starting prices against actual Rosie labour/product cost.
2. Build the planned **service-cost / minimum-price authority**: labour minutes by tier, consumables, overhead, target gross margin, minimum viable price and under-price warning.
3. Continue approved real-work image replacement for service placeholders.
4. Keep condition-assessed/quote-required services from being charged as blind flat extras.

## Priority 6 — external commercial/go-live evidence

- Stripe deposit/final balance/refund/webhook acceptance.
- PayPal sandbox parity if retained.
- Email/SMS delivery/retry/failure evidence.
- Inventory posting/reversal/idempotency.
- Search Console/Business Profile/local SEO/accessibility/real-device acceptance.
- Supabase restore + Cloudflare rollback rehearsal.
- DAIP processor/derivative evidence before any production promotion.

## Permanent runtime rules

- Authorization to a module does not mean the module is awake.
- No recurring server read is added without an explicit operational need and documented sleep condition.
- No open Detailer job = no live Detailer messaging/media monitor.
- No active customer job = no Customer Progress refresh timer.
- Hidden tabs suspend optional refresh.
- Opening Finance/I.T./DAIP/Socials/Admin/Operations shells loads no subsystem dataset.
- Global on/off switch is not a security grant; server authorization remains authoritative.
- Do not make eight codebases or eight databases.
- Public SEO pages stay static-first, crawlable, responsive and one-H1 compliant.

## Next clean checkpoint

Build 266 becomes a clean Development checkpoint when source guards are green **and** deployed acceptance proves role ceilings, per-user grants, global on/off switches, idle network behaviour, PWA install/device notifications and Cloudflare CPU stability. Then begin server-side module entitlement hardening and remote-push/native-wrapper work instead of adding another broad admin screen.

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
