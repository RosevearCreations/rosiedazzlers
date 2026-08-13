-- 2026-04-13_booking_documents_discounts_and_social_feed.sql
-- Adds discount coverage to accounting records and documents/settings notes for this pass.

alter table if exists public.accounting_records
  add column if not exists discount_cad numeric(12,2) not null default 0;

comment on column public.accounting_records.discount_cad is 'Office-entered discounts and scope/weather/detailing-error adjustments applied against the booking total.';

-- App management settings keys used by this pass:
-- pricing_catalog
-- document_templates
-- social_feeds
