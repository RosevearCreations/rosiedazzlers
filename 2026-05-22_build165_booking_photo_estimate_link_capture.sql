-- Build 165 — booking photo-estimate link capture
-- Date: 2026-05-22
--
-- Build 165 adds a customer-facing photo-estimate link field before checkout.
-- Checkout still stores the links in booking notes when this optional column is
-- not present, so deploys remain safe before this migration is applied.

alter table if exists public.bookings
  add column if not exists photo_estimate_links jsonb not null default '[]'::jsonb;

comment on column public.bookings.photo_estimate_links is
  'Customer-provided photo/media share links for quote-first or photo-estimate review. Stored as JSON array of strings.';

create index if not exists idx_bookings_photo_estimate_links_gin
  on public.bookings using gin (photo_estimate_links);
