-- Build 162 — booking condition recommender and customer media-consent planning fields
-- Date: 2026-05-21
--
-- The Build 162 public booking flow sends the condition helper, photo-estimate
-- intent, and media-consent preference through checkout notes so checkout remains
-- safe even before this migration is applied. These optional columns are added
-- now so a later admin/reporting pass can store and query the fields directly.

alter table if exists public.bookings
  add column if not exists condition_flags jsonb not null default '[]'::jsonb,
  add column if not exists condition_recommendation text null,
  add column if not exists photo_estimate_requested boolean not null default false,
  add column if not exists media_consent_preference text not null default 'estimate_only',
  add column if not exists media_consent_reviewed_at timestamptz null,
  add column if not exists media_consent_reviewed_by uuid null references public.staff_users(id) on delete set null;

create index if not exists idx_bookings_photo_estimate_requested
  on public.bookings(photo_estimate_requested)
  where photo_estimate_requested = true;

create index if not exists idx_bookings_media_consent_preference
  on public.bookings(media_consent_preference);

comment on column public.bookings.condition_flags is
  'Build 162 optional JSON list of condition-helper flags selected in public booking.';
comment on column public.bookings.condition_recommendation is
  'Build 162 optional text summary of the package/add-on recommendation shown to the customer.';
comment on column public.bookings.photo_estimate_requested is
  'True when the public booking flow asks staff to review photos/condition before final package or add-on confirmation.';
comment on column public.bookings.media_consent_preference is
  'Customer preference for estimate-only media use, ask-first use, or possible public use after privacy review.';
