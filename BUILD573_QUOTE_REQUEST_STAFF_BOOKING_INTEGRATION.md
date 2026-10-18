# Build 573 — Quote Request Intake, Staff Review & Booking Integration

## Implementation
Build 573 connects the existing **Build 570 guided preferences** to the existing `public.public_inquiry_leads` and staff quote conversion system, without creating a second CRM or bypassing the current booking/payment authority.

- `GET /api/quote_first_request` exposes *only* whether inquiry intake is operationally enabled and, if so, the public Turnstile site key.
- `POST /api/quote_first_request` is disabled unless **all** of `QUOTE_FIRST_INTAKE_ENABLED=true`, `QUOTE_FIRST_TURNSTILE_SITE_KEY`, `QUOTE_FIRST_TURNSTILE_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` are configured. Enable **only** after owner-reviewed production intake, privacy and staff acceptance.
- Checks same-origin JSON, bounded request size, field enumeration, contact permission, valid contact details, hidden bot field, Cloudflare Turnstile token and exact hostname before database access.
- Inserts a new row into EXISTING `public_inquiry_leads` with `topic=general`, `status=new`, `source_path=/preview/quote-first/` and an explicit *not a quote or booking* summary. Does not insert or mutate a confirmed booking, payments, quote proposal, customer profile, media or price catalog.
- Deduplication uses the existing lead table **UUID primary key** with randomly generated client request ID v4, reused for retries. On DB conflict HTTP 409, compare an existing matching row server-side and return replay acknowledgement; different payloads return conflict without disclosing private row data.
- The Build 570 preview review dispatches a local non-identifying event that activates the optional contact form only once the server indicates operational enablement. The form uses memory-only input (no local storage or cookies), explicit single-inquiry response consent, a honeypot, Turnstile, and a non-booking acknowledgement.
- Existing staff review workflows: `/admin-leads.html` → `/api/admin/lead_quote_preview` (staff authorized) → `/api/admin/quote_proposal_drafts_save` and `/api/admin/lead_conversion_draft_save` → staff-reviewed quote acceptance and latest price/slot validation → `/api/admin/lead_conversion_create_booking` only under its separate strict authorization. The public endpoint never calls them.
- No new database migration is introduced; if the older Build 167 lead table is absent, the server returns a safe availability error rather than writing elsewhere.

## Independent activation decisions
Before setting `QUOTE_FIRST_INTAKE_ENABLED=true`, owner verifies allowed public intake terms and privacy notice/retention, Turnstile configuration, production Supabase lead table, rate limiting, staff lead access and response workload, current prices, any quote-required services, booking 409 conflicts, and rollback. Prefer an isolated internal rehearsal. No provider accounts, paid plan, credentials or migrations are created automatically.

## Test and safety gates
Unit/endpoint contract tests run `node scripts/quote_first_intake_573_test.mjs`. Require exact-feature CI+Cloudflare preview, exact-development acceptance, protected main PR checks, then exact Production Cloudflare deployment/runtime before code GREEN. Production code deployment is **not** authorization to collect real customer contact information if operational flag is off. All public booking/pricing/checkout remain unchanged; existing public photo permissions and private provider/migrations are still HOLD.
