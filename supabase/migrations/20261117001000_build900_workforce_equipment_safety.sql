-- Rosie Dazzlers Build 900: source-linked, private, immutable staff and supervisor attestations.
-- Additive only; no stock, booking, payment, accounting, payroll or job lifecycle updates.
create table if not exists public.rosie_job_equipment_assignments_v900 (
 id uuid primary key default gen_random_uuid(),
 client_request_id uuid not null unique,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 inventory_item_id uuid not null references public.catalog_inventory_items(id) on delete restrict,
 assigned_to_staff_user_id uuid not null references public.staff_users(id) on delete restrict,
 assigned_by_staff_user_id uuid not null references public.staff_users(id) on delete restrict,
 assignment_action text not null check (assignment_action in ('assign','return')),
 note text not null check (char_length(note) between 12 and 350),
 recorded_at timestamptz not null default now()
);
create index if not exists rosie900_assignment_job_idx on public.rosie_job_equipment_assignments_v900(booking_id,recorded_at desc);
create table if not exists public.rosie_job_preparation_checks_v900 (
 id uuid primary key default gen_random_uuid(),
 client_request_id uuid not null unique,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 check_key text not null check (check_key in ('ppe','chemicals','power_water','worksite','weather','tool_condition')),
 inventory_item_id uuid references public.catalog_inventory_items(id) on delete restrict,
 outcome text not null check (outcome in ('pass','issue')),
 note text not null check (char_length(note) between 12 and 350),
 staff_user_id uuid not null references public.staff_users(id) on delete restrict,
 recorded_at timestamptz not null default now(),
 check ( (check_key='tool_condition' and inventory_item_id is not null) or (check_key<>'tool_condition' and inventory_item_id is null) )
);
create index if not exists rosie900_checks_job_idx on public.rosie_job_preparation_checks_v900(booking_id,recorded_at desc);
create table if not exists public.rosie_job_safety_signoffs_v900 (
 id uuid primary key default gen_random_uuid(),
 client_request_id uuid not null unique,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 decision text not null check (decision in ('ready','hold')),
 note text not null check (char_length(note) between 12 and 350),
 signed_by_staff_user_id uuid not null references public.staff_users(id) on delete restrict,
 recorded_at timestamptz not null default now(),
 independent_physical_certification boolean not null default false check (not independent_physical_certification)
);
create index if not exists rosie900_signoff_job_idx on public.rosie_job_safety_signoffs_v900(booking_id,recorded_at desc);
alter table public.rosie_job_equipment_assignments_v900 enable row level security;
alter table public.rosie_job_preparation_checks_v900 enable row level security;
alter table public.rosie_job_safety_signoffs_v900 enable row level security;
revoke all on public.rosie_job_equipment_assignments_v900,public.rosie_job_preparation_checks_v900,public.rosie_job_safety_signoffs_v900 from public,anon,authenticated;
grant select,insert on public.rosie_job_equipment_assignments_v900,public.rosie_job_preparation_checks_v900,public.rosie_job_safety_signoffs_v900 to service_role;
-- Reuse Build 899 immutable guard, including inherited service-role privileges.
create trigger rosie900_assignments_immutable before update or delete on public.rosie_job_equipment_assignments_v900 for each row execute function public.rosie899_reject_record_mutation();
create trigger rosie900_assignments_no_truncate before truncate on public.rosie_job_equipment_assignments_v900 for each statement execute function public.rosie899_reject_record_mutation();
create trigger rosie900_checks_immutable before update or delete on public.rosie_job_preparation_checks_v900 for each row execute function public.rosie899_reject_record_mutation();
create trigger rosie900_checks_no_truncate before truncate on public.rosie_job_preparation_checks_v900 for each statement execute function public.rosie899_reject_record_mutation();
create trigger rosie900_signoffs_immutable before update or delete on public.rosie_job_safety_signoffs_v900 for each row execute function public.rosie899_reject_record_mutation();
create trigger rosie900_signoffs_no_truncate before truncate on public.rosie_job_safety_signoffs_v900 for each statement execute function public.rosie899_reject_record_mutation();
comment on table public.rosie_job_safety_signoffs_v900 is 'Role-isolated signed original supervisor staff attestations only, not independent safety certification.';
