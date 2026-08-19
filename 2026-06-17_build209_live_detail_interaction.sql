-- Build 209: Live detail interaction backbone.
-- Adds review/audience metadata and private-storage references to the existing
-- job_updates/job_media sources of truth. This intentionally extends the
-- current tables rather than creating a second duplicate feed table.

alter table if exists public.job_updates
  add column if not exists stage text not null default 'general',
  add column if not exists source_channel text not null default 'admin',
  add column if not exists review_status text not null default 'not_required',
  add column if not exists requires_admin_review boolean not null default false,
  add column if not exists customer_action_required boolean not null default false,
  add column if not exists customer_visible_at timestamptz null,
  add column if not exists approved_by_staff_user_id uuid null,
  add column if not exists approved_by_staff_name text null;

alter table if exists public.job_media
  add column if not exists stage text not null default 'general',
  add column if not exists source_channel text not null default 'admin',
  add column if not exists review_status text not null default 'not_required',
  add column if not exists requires_admin_review boolean not null default false,
  add column if not exists customer_action_required boolean not null default false,
  add column if not exists customer_visible_at timestamptz null,
  add column if not exists approved_by_staff_user_id uuid null,
  add column if not exists approved_by_staff_name text null,
  add column if not exists storage_bucket text null,
  add column if not exists storage_path text null,
  add column if not exists content_type text null,
  add column if not exists file_size_bytes bigint null;

alter table if exists public.bookings
  add column if not exists progress_last_viewed_at timestamptz null,
  add column if not exists progress_last_customer_message_at timestamptz null,
  add column if not exists progress_last_staff_update_at timestamptz null;

create index if not exists job_updates_booking_review_idx
  on public.job_updates (booking_id, review_status, created_at desc);
create index if not exists job_media_booking_review_idx
  on public.job_media (booking_id, review_status, created_at desc);
create index if not exists job_media_storage_idx
  on public.job_media (storage_bucket, storage_path)
  where storage_bucket is not null and storage_path is not null;

update public.job_updates
set review_status = case when visibility = 'customer' then 'approved' else 'not_required' end,
    customer_visible_at = case when visibility = 'customer' then coalesce(customer_visible_at, created_at) else null end
where review_status = 'not_required' and customer_visible_at is null;

update public.job_media
set review_status = case when visibility = 'customer' then 'approved' else 'not_required' end,
    customer_visible_at = case when visibility = 'customer' then coalesce(customer_visible_at, created_at) else null end
where review_status = 'not_required' and customer_visible_at is null;

comment on column public.job_updates.review_status is 'not_required, pending, approved, or rejected; pending rows remain internal until admin approval.';
comment on column public.job_media.storage_path is 'Supabase Storage object path used for short-lived signed preview URLs; avoids exposing private uploads as public URLs.';
