-- Build 177 — conversion review queue, final price reconciliation, and local proof reporting
-- Apply after:
--   sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql
--   sql/2026-05-25_build176_conversion_to_booking_dashboard_privacy.sql
--
-- Adds optional final-price review fields to lead_conversion_drafts so staff can
-- preserve the catalog-backed price review used before creating a live booking.

alter table public.lead_conversion_drafts
  add column if not exists final_price_review jsonb not null default '{}'::jsonb,
  add column if not exists final_price_status text not null default 'needs_review',
  add column if not exists final_price_total_cents integer null,
  add column if not exists final_deposit_cents integer null,
  add column if not exists final_price_reviewed_at timestamptz null;

create index if not exists idx_lead_conversion_drafts_final_price_status
  on public.lead_conversion_drafts(final_price_status);

comment on column public.lead_conversion_drafts.final_price_review is
  'Build 177: optional saved catalog-backed price reconciliation payload used before creating a real booking.';
comment on column public.lead_conversion_drafts.final_price_status is
  'Build 177: staff review state for price reconciliation, for example needs_review, reviewed, override_needed, ready_to_book.';
comment on column public.lead_conversion_drafts.final_price_total_cents is
  'Build 177: final reviewed total in cents when staff preserves a reconciled quote value.';
comment on column public.lead_conversion_drafts.final_deposit_cents is
  'Build 177: final reviewed deposit in cents when staff preserves a reconciled quote value.';
comment on column public.lead_conversion_drafts.final_price_reviewed_at is
  'Build 177: timestamp when staff last reviewed final price reconciliation.';
