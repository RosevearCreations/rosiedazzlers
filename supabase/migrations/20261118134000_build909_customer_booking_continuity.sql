-- Rosie 909: one non-sensitive, explicitly saved choice set per customer and booking mode.
create table if not exists public.customer_booking_plans_909 (
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  booking_mode text not null check (booking_mode in ('smart','manual')),
  choices jsonb not null check (jsonb_typeof(choices)='object' and pg_column_size(choices)<=2048),
  updated_at timestamptz not null default now(),
  primary key (customer_profile_id,booking_mode)
);
alter table public.customer_booking_plans_909 enable row level security;
revoke all on public.customer_booking_plans_909 from public,anon,authenticated;
grant select,insert,update on public.customer_booking_plans_909 to service_role;
comment on table public.customer_booking_plans_909 is 'Customer-owned non-sensitive Smart/Manual choices only. Never contact, vehicle identity, photo, date, hold, quote price, payment or consent.';
