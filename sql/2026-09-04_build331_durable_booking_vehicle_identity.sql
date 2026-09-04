-- Build 331: durable booking -> saved vehicle identity.
-- Additive and nullable: guest/legacy bookings remain valid.
-- No historical rows are auto-linked by this migration.

alter table public.bookings
  add column if not exists customer_vehicle_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_customer_vehicle_id_fkey'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_customer_vehicle_id_fkey
      foreign key (customer_vehicle_id)
      references public.customer_vehicles(id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_customer_vehicle_requires_profile_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_customer_vehicle_requires_profile_check
      check (customer_vehicle_id is null or customer_profile_id is not null);
  end if;
end $$;

create index if not exists bookings_customer_vehicle_id_idx
  on public.bookings(customer_vehicle_id)
  where customer_vehicle_id is not null;

comment on column public.bookings.customer_vehicle_id is
  'Optional durable link to the saved customer vehicle used for this booking. Staff/API linkage must verify the vehicle belongs to bookings.customer_profile_id. Guest and unresolved legacy bookings remain NULL.';
