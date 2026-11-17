-- Rosie 902: private append-only exception triage, supervisor SLA, crew handoff offers and receipts.
-- No customer contact, autonomous dispatch, physical safety approval or canonical job mutation.
create table if not exists public.rosie_jobday_exception_receipts_v902 (
 id uuid primary key default gen_random_uuid(),
 client_request_id uuid not null unique,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 exception_id uuid not null references public.rosie_jobday_events_v901(id) on delete restrict,
 event_kind text not null check (event_kind in ('offer','acknowledge','triage','escalate')),
 offer_id uuid references public.rosie_jobday_exception_receipts_v902(id) on delete restrict,
 recipient_staff_user_id uuid references public.staff_users(id) on delete restrict,
 priority text check (priority in ('critical','high','normal')),
 decision text check (decision in ('accepted','rejected')),
 note text not null check (char_length(note) between 12 and 350),
 staff_user_id uuid not null references public.staff_users(id) on delete restrict,
 recorded_at timestamptz not null default now(),
 independent_physical_certification boolean not null default false check(not independent_physical_certification),
 customer_message_sent boolean not null default false check(not customer_message_sent),
 automatic_dispatch boolean not null default false check(not automatic_dispatch),
 check (
  (event_kind='offer' and offer_id is null and recipient_staff_user_id is not null and priority is null and decision is null) or
  (event_kind='acknowledge' and offer_id is not null and recipient_staff_user_id is null and priority is null and decision is not null) or
  (event_kind='triage' and offer_id is null and recipient_staff_user_id is null and priority is not null and decision is null) or
  (event_kind='escalate' and offer_id is null and recipient_staff_user_id is null and priority is null and decision is null)
 )
);
create index if not exists rosie902_booking_exception_idx on public.rosie_jobday_exception_receipts_v902(booking_id,exception_id,recorded_at desc);
create unique index if not exists rosie902_one_ack_per_offer_idx on public.rosie_jobday_exception_receipts_v902(offer_id)
 where event_kind='acknowledge';
alter table public.rosie_jobday_exception_receipts_v902 enable row level security;
revoke all on table public.rosie_jobday_exception_receipts_v902 from public,anon,authenticated;
grant select,insert on table public.rosie_jobday_exception_receipts_v902 to service_role;
create trigger rosie902_immutable before update or delete on public.rosie_jobday_exception_receipts_v902
 for each row execute function public.rosie899_reject_record_mutation();
create trigger rosie902_no_truncate before truncate on public.rosie_jobday_exception_receipts_v902
 for each statement execute function public.rosie899_reject_record_mutation();
comment on table public.rosie_jobday_exception_receipts_v902 is 'Immutable, strictly private signed event receipts; deterministic original 901 SLA and crew handoff only. No independent site safety certification or autonomous operations.';
