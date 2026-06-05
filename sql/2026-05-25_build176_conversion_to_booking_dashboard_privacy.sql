-- Build 176 — reviewed conversion draft to real booking, dashboard cards, and media privacy warnings.
-- Apply after Build 175.

alter table public.lead_conversion_drafts
  add column if not exists converted_booking_id uuid null references public.bookings(id) on delete set null,
  add column if not exists converted_at timestamptz null;

create index if not exists idx_lead_conversion_drafts_converted_booking on public.lead_conversion_drafts (converted_booking_id);
create index if not exists idx_lead_conversion_drafts_converted_at on public.lead_conversion_drafts (converted_at desc);

-- No new table is required for Build 176.
-- /api/admin/lead_conversion_create_booking inserts into public.bookings only after staff confirms:
-- service_date, start_slot, address_line1, package_code, vehicle_size, customer_name, and customer_email.
-- /api/admin/media_privacy_review_summary reads app_management_settings.before_after_gallery
-- and photo_estimate_uploads to warn about non-public-ready media before gallery/social reuse.
