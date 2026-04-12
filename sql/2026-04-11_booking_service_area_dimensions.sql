-- April 11, 2026
-- Adds structured service-area reporting columns so booking, admin, and analytics views can filter by county, municipality, and booking zone without parsing a single free-text field.

alter table if exists public.bookings
  add column if not exists service_area_county text null,
  add column if not exists service_area_municipality text null,
  add column if not exists service_area_zone text null;

create index if not exists idx_bookings_service_area_zone_date
  on public.bookings (service_area_zone, service_date desc);

create index if not exists idx_bookings_service_area_municipality_date
  on public.bookings (service_area_municipality, service_date desc);

create index if not exists idx_bookings_service_area_county_date
  on public.bookings (service_area_county, service_date desc);
