-- Build 168 — Admin Leads and Photo Estimate Review
-- Extends Build 167 lead/upload capture with review fields used by /admin-leads.
-- Safe to run after sql/2026-05-23_build167_competetive_matrix_leads_upload_schema.sql.

alter table if exists public.photo_estimate_uploads
  add column if not exists staff_note text,
  add column if not exists privacy_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by_staff_user_id uuid;

create index if not exists photo_estimate_uploads_privacy_status_idx
  on public.photo_estimate_uploads(privacy_status, created_at desc);

create index if not exists photo_estimate_uploads_booking_id_idx
  on public.photo_estimate_uploads(booking_id);

create index if not exists photo_estimate_uploads_lead_id_idx
  on public.photo_estimate_uploads(lead_id);

comment on column public.photo_estimate_uploads.staff_note is
  'Build 168 internal staff review note from Admin Leads & Photo Estimates.';

comment on column public.photo_estimate_uploads.privacy_note is
  'Build 168 privacy review note describing blur/crop/private/public handling before media can be reused.';

comment on column public.photo_estimate_uploads.reviewed_at is
  'Build 168 timestamp for the most recent staff review action.';

comment on column public.photo_estimate_uploads.reviewed_by_staff_user_id is
  'Build 168 staff_users.id for the reviewer when available.';
