-- Build 163 — booking intake admin review and media privacy workflow fields
-- Date: 2026-05-21
--
-- Build 162 captured public condition-helper details, photo-estimate intent, and
-- media-use preference. Build 163 lets staff review those details as discrete
-- workflow statuses instead of leaving everything buried in booking notes.

alter table if exists public.bookings
  add column if not exists photo_estimate_status text not null default 'not_requested',
  add column if not exists condition_review_status text not null default 'not_reviewed',
  add column if not exists media_privacy_status text not null default 'not_reviewed',
  add column if not exists plate_privacy_reviewed boolean not null default false,
  add column if not exists face_privacy_reviewed boolean not null default false,
  add column if not exists address_privacy_reviewed boolean not null default false,
  add column if not exists blur_crop_needed boolean not null default false,
  add column if not exists blur_crop_complete boolean not null default false;

create index if not exists idx_bookings_photo_estimate_status
  on public.bookings(photo_estimate_status);

create index if not exists idx_bookings_condition_review_status
  on public.bookings(condition_review_status);

create index if not exists idx_bookings_media_privacy_status
  on public.bookings(media_privacy_status);

comment on column public.bookings.photo_estimate_status is
  'Build 163 staff workflow status for photo-estimate bookings: not_requested, requested, received, quoted, closed.';
comment on column public.bookings.condition_review_status is
  'Build 163 staff review status for the public condition-helper recommendation.';
comment on column public.bookings.media_privacy_status is
  'Build 163 staff review status before any customer media is used publicly or socially.';
comment on column public.bookings.plate_privacy_reviewed is
  'True when staff has checked customer media for visible license plates.';
comment on column public.bookings.face_privacy_reviewed is
  'True when staff has checked customer media for visible faces.';
comment on column public.bookings.address_privacy_reviewed is
  'True when staff has checked customer media for visible addresses or private location details.';
comment on column public.bookings.blur_crop_needed is
  'True when media needs blurring or cropping before public/social use.';
comment on column public.bookings.blur_crop_complete is
  'True when required blur/crop privacy work is complete.';
