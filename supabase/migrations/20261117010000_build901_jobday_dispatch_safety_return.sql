-- Build 901: append-only source-linked dispatch decision, stop-work, resolution, and equipment return receipts.
-- No mutations to bookings, inventory, customer messages, payroll, accounting, payment or Master peers.
create table if not exists public.rosie_jobday_events_v901 (
  id uuid primary key default gen_random_uuid(),
  client_request_id uuid not null unique,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  event_kind text not null check (event_kind in ('escalation','resolution','dispatch','return','reconcile')),
  inventory_item_id uuid references public.catalog_inventory_items(id) on delete restrict,
  escalation_id uuid references public.rosie_jobday_events_v901(id) on delete restrict,
  safety_signoff_id uuid references public.rosie_job_safety_signoffs_v900(id) on delete restrict,
  subject text check (subject in ('ppe','chemicals','power_water','worksite','weather','equipment','other')),
  severity text check (severity in ('stop_work','review')),
  decision text check (decision in ('resolved','hold','authorize','good','issue','reconciled')),
  note text not null check (char_length(note) between 12 and 350),
  staff_user_id uuid not null references public.staff_users(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  independently_certified boolean not null default false check (not independently_certified),
  automatic_dispatch boolean not null default false check (not automatic_dispatch),
  check (
   (event_kind='escalation' and subject is not null and severity is not null and
     decision is null and escalation_id is null and safety_signoff_id is null and
     ((subject='equipment' and inventory_item_id is not null) or (subject<>'equipment' and inventory_item_id is null))) or
   (event_kind='resolution' and escalation_id is not null and decision in ('resolved','hold') and
     subject is null and severity is null and inventory_item_id is null and safety_signoff_id is null) or
   (event_kind='dispatch' and decision in ('authorize','hold') and subject is null and severity is null and
     escalation_id is null and inventory_item_id is null and
     (decision='hold' or safety_signoff_id is not null)) or
   (event_kind='return' and inventory_item_id is not null and decision in ('good','issue') and
     subject is null and severity is null and escalation_id is null and safety_signoff_id is null) or
   (event_kind='reconcile' and decision in ('reconciled','hold') and subject is null and severity is null and
     inventory_item_id is null and escalation_id is null and safety_signoff_id is null)
  )
);
create index if not exists rosie901_booking_events_idx on public.rosie_jobday_events_v901(booking_id,recorded_at desc);
create index if not exists rosie901_escalation_idx on public.rosie_jobday_events_v901(escalation_id,recorded_at desc);
alter table public.rosie_jobday_events_v901 enable row level security;
revoke all on table public.rosie_jobday_events_v901 from public,anon,authenticated;
grant select,insert on table public.rosie_jobday_events_v901 to service_role;
create trigger rosie901_immutable before update or delete on public.rosie_jobday_events_v901
 for each row execute function public.rosie899_reject_record_mutation();
create trigger rosie901_no_truncate before truncate on public.rosie_jobday_events_v901
 for each statement execute function public.rosie899_reject_record_mutation();
comment on table public.rosie_jobday_events_v901 is 'Staff-reported, source-linked, immutable safety/dispatch/equipment return evidence. Never independent physical certification, stock movement or automatic dispatch.';
