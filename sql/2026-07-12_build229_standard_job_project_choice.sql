-- Build 229 — Preserve the standard booking workflow while allowing an explicit opt-in creative project link.
begin;

alter table public.creative_projects
  add column if not exists source_mode text not null default 'standalone_project'
    check (source_mode in ('standalone_project','booking_opt_in')),
  add column if not exists source_booking_id uuid null references public.bookings(id) on delete set null,
  add column if not exists source_customer_initiated boolean not null default false;

create unique index if not exists creative_projects_source_booking_unique
  on public.creative_projects(source_booking_id)
  where source_booking_id is not null;

create table if not exists public.creative_project_booking_audit (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  project_id uuid not null references public.creative_projects(id) on delete restrict,
  event_type text not null check (event_type in ('project_opted_in','project_opened','link_removed')),
  actor_staff_email text null,
  safe_note text not null check (char_length(safe_note) between 3 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists creative_project_booking_audit_booking_idx
  on public.creative_project_booking_audit(booking_id,created_at desc);

alter table public.creative_project_booking_audit enable row level security;
revoke all privileges on table public.creative_project_booking_audit from public,anon,authenticated;
grant all privileges on table public.creative_project_booking_audit to service_role;

comment on column public.creative_projects.source_mode is
  'Build 229: standalone projects are created directly; booking_opt_in projects are explicitly promoted from a normal booking. A booking without a linked project remains a standard job.';
comment on column public.creative_projects.source_booking_id is
  'Optional booking link. Null means the project is independent. No booking is automatically converted into a project.';

commit;
