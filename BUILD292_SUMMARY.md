# Build 292 — Fleet / Workplace Acquisition Intake Authority

**Status: ACTIVE — Development-first**  
**Date:** 2026-09-01

## Purpose

Build 292 converts the existing fleet/commercial public path into a quote-first fleet and workplace assessment flow. It gathers useful B2B and multi-vehicle planning evidence without inventing pricing, thresholds, discounts, service cadence, priority, contract terms or recurring billing.

## What changed

- `/fleet` now serves fleet, workplace, contractor, household multi-vehicle and dealership/overflow assessment use cases.
- The form captures business/organization, request type, vehicle count, service area, timing preference, representative condition/site notes and optional photo links.
- Request type and timing values are allowlisted by the server.
- Fleet `source_path` is server-owned as `/fleet`.
- The existing `public_inquiry_leads` table remains the persistence authority; no second lead store is introduced.
- Extra fleet context is stored through the existing message field, so Build 292 needs no schema migration.
- Public success responses are narrow and do not return the stored database row.
- Persistence/configuration failures are generic and do not return Supabase response details.
- GET on the write endpoint is 405.
- `/fleet-pricing` now explains quote planning rather than implying a fixed fleet threshold, automatic commercial rate, discount or recurring cycle.

## Business-rule boundary

Build 292 does **not** approve or promise an automatic vehicle threshold, fleet minimum, volume discount, commercial rate, fixed recurring cadence, priority booking, SLA, contract/cancellation terms, recurring billing, quote, or appointment simply because an assessment is submitted.

## Data boundary

There is **no schema migration**. Build 292 reuses `public_inquiry_leads` and its existing columns. Business/request context is normalized into the existing lead record without creating duplicate customer, quote or lead authorities.

## Runtime acceptance

`scripts/build292_http_smoke.sh` is deliberately non-mutating. It verifies the public pages and uses only validation failures plus GET 405, so it must not create a Development lead row.

## Release boundary

Feature branch: `build292-fleet-workplace-acquisition-intake`.

Build 292 requires exact feature Source Gate + Cloudflare preview, then non-force Development promotion, exact Development source/runtime/Cloudflare acceptance, and only then deliberate Production promotion.
