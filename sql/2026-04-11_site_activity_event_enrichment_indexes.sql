-- 2026-04-11_site_activity_event_enrichment_indexes.sql
-- Adds indexes to support deeper analytics rollups from JSON payload fields.

create index if not exists idx_site_activity_events_created_at on public.site_activity_events (created_at desc);
create index if not exists idx_site_activity_events_event_type_created_at on public.site_activity_events (event_type, created_at desc);
create index if not exists idx_site_activity_events_page_path_created_at on public.site_activity_events (page_path, created_at desc);
create index if not exists idx_site_activity_events_payload_city_created_at on public.site_activity_events ((payload->>'city'), created_at desc);
create index if not exists idx_site_activity_events_payload_region_created_at on public.site_activity_events ((payload->>'region'), created_at desc);
create index if not exists idx_site_activity_events_payload_device_created_at on public.site_activity_events ((payload->>'device_type'), created_at desc);
