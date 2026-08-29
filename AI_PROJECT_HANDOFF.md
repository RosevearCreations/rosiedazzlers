# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 265  
**Updated:** 2026-08-29  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## What Rosie is now

Rosie Dazzlers is one platform with four application boundaries sharing the same authentication/data authorities:

1. **Customer App** — `/app/customer/` bridge to public booking/account/progress/quote/gift workflows. Public discovery pages remain static-first for SEO.
2. **Detailer Mobile App** — `/app/detailer/` active modular runtime. Assigned-job workspace is bounded; the heavy live-job module loads only for an eligible open job. No recurring polling interval.
3. **Operations / Supervisor App** — `/app/operations/` **active modular runtime in Build 265**. Opening the shell loads no operational dataset. Today, Schedule, Blocked Days, Assignments and Live Snapshot are lazy/manual modules and contain no polling interval.
4. **Business Administration App** — `/app/admin/` protected bridge. Finance, inventory, media/content, analytics, readiness, integrations and DAIP stay on-demand.

Server-side authorization remains authoritative. Client module visibility is only a navigation/download decision.

## Build 265 public service convergence

The current bundled pricing catalog and public content now treat add-ons as real service businesses rather than inexpensive flat extras.

- All **24 current add-ons** have a canonical, detailed service page.
- Condition-sensitive work uses **starting prices + inspection/scope confirmation**, not a misleading flat final amount.
- Booking still allows quote-required work to be requested without blindly charging the displayed starting amount.
- Services and Booking show `From … · condition assessed`/condition-quote wording where appropriate.
- The landing-page fallback loader now applies the explicit detailed `pages` content after generated/default content so the richest owner-authored definition wins.
- Canonical duplicate intents are consolidated:
  - `/headlight-restoration-addon` → `/headlight-restoration`
  - `/odor-treatment` → `/odor-removal`
  - `/external-ceramic-coating` → `/ceramic-coating`
- Each canonical add-on route has substantial static HTML before JavaScript runs: one H1, unique title/description, canonical URL, Service/Breadcrumb/FAQ structured data, process, condition pricing, inclusions/exclusions, preparation, aftercare, quote triggers and FAQs.
- Missing proof media uses intentional service-photo placeholders and service-specific photo briefs so layouts remain complete until real Rosie-owned evidence is assigned.
- Build 265 CSS adds responsive condition-price, scope and visual-proof grids and mobile button/card overflow protection.

### Two examples of the new condition model

**Headlight restoration** starts by lens condition rather than one price: light haze from $99/pair, moderate yellowing from $129/pair, heavy oxidation from $169+/pair. Cracks, internal moisture or reflector failure are replacement/repair issues, not exterior polishing problems.

**Carpet / spill restoration** distinguishes routine carpet shampoo from repeated extraction and from liquid that has migrated beneath carpet/underlay. Severe wet-floor work can require safe trim/seat removal, carpet lifting, extraction and controlled drying; airbags/sensors/wiring mean seat removal is never assumed. Flood contamination, active mold, damaged modules/wiring or severe corrosion can require specialist remediation rather than normal mobile detailing.

## Pricing state — Build 265 starting values

These are **starting CAD prices before HST**, not guaranteed maximums. The catalog itself is the executable authority.

| Add-on | Current starting direction |
|---|---|
| Full clay treatment | $89 / $109 / $139 |
| Two-stage polish | $349 / $449 / $549, condition quote |
| Paint sealant | $79 / $99 / $119 |
| Interior UV protectant | $49 / $59 / $79 |
| Mineral/water-spot treatment | $99 / $129 / $159, condition quote |
| De-badging | from $79, condition quote |
| Engine cleaning | $79 / $99 / $119, condition quote |
| Ceramic coating | $599 / $749 / $899, correction/prep can raise scope |
| Graphene-style finish | $299 / $399 / $499, condition quote |
| Exterior wax | $79 / $99 / $119 |
| Vinyl wrapping | from $149, area/scope quote |
| Window tinting | $299 / $349 / $449, condition/scope quote |
| Pet hair removal | $59 / $89 / $119, severity quote |
| Odor treatment | $89 / $119 / $149, source-based quote |
| Seat shampoo/extraction | $89 / $119 / $149, condition quote |
| Carpet shampoo/extraction | $99 / $129 / $159; under-carpet restoration from $299+ |
| Salt stain treatment | $69 / $99 / $129, condition quote |
| Headlight restoration | $99 / $129 / $169+ by lens condition |
| Windshield ceramic coating | $89 / $99 / $109 |
| Ceramic spray protection | $69 / $89 / $109 |
| Trim restoration | $79 / $99 / $129, condition quote |
| Bug/tar removal | $49 / $69 / $89, condition quote |
| Truck-box wash | from $79, scope quote |
| Fleet add-on | custom fleet quote |

## Market evidence used for this pass

Reviewed 2026-08-29 as pricing/service-structure evidence, not as copy templates: Pure Form, MrShine, Pal Auto, FoggyToClear, Get My Shine On, AMP, Underdog, Ideal Honda, Parkway Honda, Brimell Toyota, DetailingExperts, Detailed AF, IMDetailing, TC Auto Spa and Wash Me Now. The recurring market pattern is `starting at` pricing, severity/vehicle-condition adjustments, dedicated high-intent service pages and higher restoration pricing than routine maintenance work.

## SEO/public-page guardrails

- Exactly one meaningful H1 per indexable public route.
- Unique, concise title and useful description; do not generate doorway pages by swapping town/service keywords.
- Canonicalize duplicate service intent instead of allowing two indexable URLs to compete.
- Static-first public content: useful copy exists without JavaScript hydration.
- Service-specific details must explain limits and uncertainty honestly; do not present a lower condition tier as a guaranteed final price.
- Informative images require contextual alt text. Missing real evidence uses an intentional placeholder until owner-approved proof replaces it.
- Never expose private DAIP media through public image manifests or Photo Studio.

## Reliability / runtime guardrails

- **No eligible Detailer open job = no live-job module and no recurring live-job network activity.**
- **Opening Operations = no operational dataset.** A workstream must be selected explicitly.
- Operations workstreams do not use `setInterval`; refresh is owner/manual.
- Public analytics remains batched/circuit-broken; protected screens must not create unnecessary public telemetry.
- Do not auto-retry ambiguous non-idempotent writes after a network/5xx failure.
- Direct media binaries should use signed object-storage upload paths rather than proxying large payloads through Functions.

## Database / deployment truth

Build 265 service-content and Operations-runtime source changes require **no new Build 265 DDL**.

Do **not** blindly reapply historical SQL. Build 262 analytics rollup SQL remains a prerequisite only where the target environment has not already received the corrected migration. Verify schema state first.

The attached/source package cannot prove Cloudflare/Supabase/payment/email production state. Treat the following as external acceptance, not source-code TODOs:

- representative Cloudflare window with zero exceeded-CPU terminations;
- staging/prod schema/migration verification;
- authenticated real-runtime Detailer + Operations acceptance;
- Stripe deposit/final balance/refund/webhook evidence;
- PayPal sandbox/production-path acceptance if enabled;
- external email/SMS provider delivery/retry evidence;
- Search Console / sitemap/canonical/schema validation;
- real-device mobile/desktop/accessibility acceptance;
- backup restore + deployment rollback rehearsal;
- private DAIP processor/retry/dead-letter/reviewed-derivative evidence before production promotion.

## Current source acceptance rule

A feature is not “done” merely because code exists. Local source checks prove syntax/structure. Environment-dependent workflows remain open until tested in the actual Development deployment with safe evidence.

### Build 265 local convergence evidence

- `python scripts/release_check.py` passes through the newly registered Build 265 guard.
- Cloudflare Pages Functions static validation passes across 600 JS files, including syntax checks on the critical changed set.
- SEO/H1 validation passes with no HTML route containing more than one H1.
- Route-copy synchronization passes.
- All 24 canonical add-on pages retain approved-public R2 hydration hooks plus explicit Photo Studio proof targets, while keeping static-first fallback content.
- The corrected Build 262 analytics-rollup SQL is synchronized in both the root compatibility copy and `sql/` copy; the mismatched-parenthesis version is no longer present in either.
- Missing Build 263/264 historical module inventories were reconstructed as evidence snapshots so old release guards and the current modular runtime can both be verified without rolling the live Build 265 constants backward.

## Documentation policy

Only these files are current planning authority:

1. `AI_PROJECT_HANDOFF.md` — exact implementation/current-state handoff.
2. `MASTER_VALUE_ROADMAP.md` — ordered direction and remaining gates.

`STARTUP_GO_LIVE_BLOCKERS.md` is a specialist acceptance runbook. `DOC_INDEX.md` explains the rest. Older Build summaries, old roadmaps and competitor notes are retained evidence/history and must not override these two files.

<!-- HISTORICAL RELEASE-CHECK COMPATIBILITY — not a living authority.
These markers preserve older automated release assertions after Build 265 documentation consolidation.
Build 209
Build 210
connected live-job closeout
Build 211 central capability
production reliability
Build 212 central capability: guided production testing
PRODUCTION_TEST_GUIDE.md
Build 213 central capability
owner_attention_tasks
customer acknowledgement
Build 214 central capability
admin-security.html
Build 215
adds no DAIP production code
Build 216
Build 217
Build 218 — DAIP internal test foundation
DAIP Test Lab
Build 219 central capability: DAIP governance and promotion gates
Gates C–F remain hard-held
Build 220 central capability: controlled customer access management and DAIP readiness
Build 221 hotfix — customer-admin route 405 repair
No Supabase migration is required
Build 222 central capability
DAIP Phase 1 readiness review
Build 223 central capability
DAIP private-MVP design blueprint
Build 225 central capability
social/analytics Connections Centre
Build 231
Build 236 current handoff
Build 238 operational release
Build 239 — Unified Startup Command Center
Build 248
Amazon supplier-link
reviewed private story evidence
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 249
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 250
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 251
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 252
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 253
Photo Management Studio
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 254
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 255
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 256
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 258
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 259
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 260
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 261
unassigned-placement
# CURRENT LIVING AUTHORITY 1 OF 2 — Build 262
2,244
Runtime & CPU Diagnostics
CPU stabilization
Build 263 Architecture Foundation
Build 264 Detailer Modular Runtime
No eligible open Detailer job

Build 210 documentation sync
Build 211 documentation sync
Build 212 documentation sync
Build 214 documentation sync
Gates C–F remain held
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
