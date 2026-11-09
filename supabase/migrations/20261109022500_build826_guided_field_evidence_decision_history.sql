-- Build 826: immutable operator-reported role/device evidence and manual decision timeline.
-- This is not QL-365D original source owner signing, and not production trust enrollment.
create table public.rosie_field_acceptance_events_v826 (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  event_kind text not null check (event_kind in ('observation','signoff','module_review')),
  actor_staff_user_id uuid not null references public.staff_users(id) on delete restrict,
  target_event_id uuid references public.rosie_field_acceptance_events_v826(id) on delete restrict,
  module_id text,
  role_id text,
  device_class text,
  browser_class text,
  route_path text,
  viewport_width integer,
  observed_outcome text,
  observed_at timestamptz,
  evidence_ref text,
  review_state text,
  recorded_at timestamptz not null default now(),
  constraint build826_event_shape check (
    (event_kind='observation'
      and target_event_id is null and module_id is null and review_state is null
      and role_id in ('customer','detailer','operations','admin')
      and device_class in ('phone','tablet','desktop')
      and browser_class in ('chrome','safari','firefox','edge')
      and route_path is not null and route_path ~ '^/(app|admin|book|account|detailer)([./-][A-Za-z0-9_./-]*)?$'
      and char_length(route_path) between 5 and 90
      and viewport_width between 320 and 3840
      and observed_outcome in ('pass','fail','blocked')
      and observed_at is not null
      and evidence_ref is not null and char_length(evidence_ref) between 6 and 80)
    or
    (event_kind='signoff'
      and target_event_id is not null and module_id is null
      and role_id is null and device_class is null and browser_class is null
      and route_path is null and viewport_width is null and observed_outcome is null
      and observed_at is null
      and review_state in ('accepted_for_review','returned','rejected')
      and evidence_ref is not null and char_length(evidence_ref) between 6 and 80)
    or
    (event_kind='module_review'
      and module_id is not null and char_length(module_id) between 3 and 90
      and role_id is null and device_class is null and browser_class is null
      and route_path is null and viewport_width is null and observed_outcome is null
      and observed_at is null
      and review_state in ('hold','needs_evidence','owner_review_candidate')
      and evidence_ref is not null and char_length(evidence_ref) between 6 and 80)
  ),
  constraint build826_no_control_chars check (evidence_ref !~ '[[:cntrl:]]'),
  unique (actor_staff_user_id,request_id)
);
create index build826_events_history on public.rosie_field_acceptance_events_v826
  (recorded_at desc,id desc);
create index build826_events_module_history on public.rosie_field_acceptance_events_v826
  (module_id,recorded_at desc,id desc);
create index build826_events_target on public.rosie_field_acceptance_events_v826 (target_event_id);
alter table public.rosie_field_acceptance_events_v826 enable row level security;
revoke all on public.rosie_field_acceptance_events_v826 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_field_acceptance_events_v826 to service_role;
comment on table public.rosie_field_acceptance_events_v826 is
  'Private append-only source-reported field observation, separate supervisor decision, and module-review history. Never a production approval, source connection, or auto scoring feed.';
