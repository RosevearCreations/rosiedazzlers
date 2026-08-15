-- 2026-04-10_recovery_audit_indexes.sql
-- Supports the newer recovery audit panel and template-key lookups.

create index if not exists idx_notification_events_event_type_created_at
  on public.notification_events (event_type, created_at desc);

create index if not exists idx_notification_events_template_key_created_at
  on public.notification_events ((payload->>'template_key'), created_at desc);
