# Build 259 — Editable Media, Service Detail, Vehicle-Size Review & Quote Operations

**Build date:** 2026-08-13

## Purpose

Build 259 extends the owner-editable presentation/operations layer without changing existing Photo Studio assignments. It closes the remaining image-target gaps, makes every catalog add-on route to a detailed owner-editable page, repairs Pricing/Services/Maintenance/Fleet CSS, adds a staff/customer vehicle-size correction workflow, and turns the Quote Pipeline from a read-only dashboard into a selectable editor.

## Photo Studio — comprehensive public presentation targets

- Existing Photo Studio interface is preserved.
- The Build 253 target registry keeps its schema identity/revision while exposing Build 259 as the current target revision.
- Explicit targets now include site logo, banner, reviews, default site background, per-page optional backgrounds, known static website/chart/proof images, vehicle photo guides, Maintenance hero, package/add-on/service hub images, landing heroes/galleries/review proof, FAQ/gift cards, Gallery evidence/technique/efficiency, and Before/After pairs.
- Global overrides are explicit-only. No filename match can silently replace a working authored image.
- Build 257's resource boundary remains: normal public requests and ordinary Photo Studio load do not enumerate R2.
- No existing photo assignment is changed by Build 259.

## Add-on cards and detailed landing pages

- Services add-on cards no longer display internal codes such as `uv_protectant_applied_on_interior_panels`.
- Cards show customer-facing service name, price or Quote Required, estimated added time, and wrapped actions.
- Add-on cards link to process/details pages.
- All catalog add-ons now have an owner-editable landing-page record or override and a clean route shell.
- Paint Correction specifically documents inspection/test spots, one-stage versus multi-stage correction, clear-coat safety, panel-by-panel labour, and why cost can climb quickly with defect depth and required stages.
- The friendly landing-page editor now exposes hero/meta copy, reasons, process, equipment, highlights, things to know, FAQ, related products, official links, and enabled state.
- The public landing-page loader now reads `landing_pages_content` first, then legacy `landing_pages`, eliminating the previous editor/public-source mismatch.

## Pricing and Services CSS

- Package Service Details SVG headings wrap to the available column width instead of overlapping.
- Services decision cards use a stable responsive grid and wrapped buttons/content.
- Add-on price/time/action rows stay inside their cards at desktop/tablet/mobile widths.
- Pricing/Services shared modules and stylesheet references are cache-busted to Build 259.

## Maintenance and Fleet

- `/maintenance-plan` has an explicit Photo Studio hero target.
- Maintenance information boxes, waitlist explanation, self-serve content, and good-fit content are editable through the existing Membership/Maintenance settings area.
- Waitlist fields are width-constrained and responsive.
- Fleet quote-request inputs/selects/textareas are width-constrained and responsive.

## Vehicle-size review workflow — SQL required

Apply `sql/2026-08-13_build259_vehicle_size_review.sql` before using the new review controls.

- A catalog-matched vehicle/size remains verified.
- An uncertain or mismatched model/size is stored as `needs_review` and the customer is warned that the price is provisional.
- Staff can verify the booked size with no customer interruption.
- If staff proposes a different size and/or total, the application generates a cryptographically random one-time review token, stores only its SHA-256 hash, and sends a secure customer review link through the existing notification provider.
- The customer can confirm the revised size/price or cancel the booking.
- The token expires after seven days and is invalidated after a response.
- Cancellation does not automatically promise a deposit refund; existing policy/office review remains authoritative.

## Quote Pipeline

- `/admin-quotes` is now selectable/editable rather than a passive Build 206 summary.
- Staff can create/update quote number, status, customer/town/service, amounts, probability, source, follow-up stage/date, and lead/customer/booking linkage.
- Quote rows are selectable and the booking link is exposed when one exists.
- Uses the existing `quote_pipeline_items` table from Build 206; no new quote SQL is required.

## Database / schema

- New migration: `sql/2026-08-13_build259_vehicle_size_review.sql`.
- Root migration copy and `SUPABASE_SCHEMA.sql` are synchronized.
- `DATABASE_STRUCTURE_CURRENT.md` documents the new booking review fields.
- Build 253 Photo Studio SQL remains unchanged.

## SEO / routes

- Newly surfaced add-on detail routes have accurate service-specific static fallbacks, owner-editable dynamic content, canonical URLs, one H1, and are added to the sitemap.
- Public customer response page `/vehicle-size-review` is `noindex,nofollow`.

## Deployment order

1. Apply the Build 259 vehicle-size review migration in Supabase staging.
2. Deploy Pages + Functions together.
3. Hard-refresh public/admin pages because Build 259 changes shared cache tokens.
4. Verify Photo Studio existing assignments are unchanged; choose test overrides only deliberately.
5. Test one uncertain vehicle-size booking, staff verification, and one harmless corrected-price confirmation link.
6. Test Quote Pipeline row selection/save.
7. Verify Pricing, Services, Maintenance Plan, Fleet, and one add-on detail route at desktop and phone widths.

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->

## Historical release compatibility markers

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
