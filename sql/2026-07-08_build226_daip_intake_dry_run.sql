-- Build 226 — DAIP metadata-only intake dry run.
-- This migration stores fictional validation manifests only. It creates no storage, upload/download
-- authorization, object path, worker, queue, customer-media route, public destination, or publishing control.
begin;
create table if not exists public.daip_intake_dry_runs (
  id uuid primary key default gen_random_uuid(),
  run_code text not null unique check (run_code ~ '^RD-DRYRUN-[0-9]{8}-[0-9]{3}$'),
  run_status text not null default 'draft' check (run_status in ('draft','validated','rejected','archived')),
  owner_label text not null check (char_length(owner_label) between 2 and 120),
  scenario_summary text not null check (char_length(scenario_summary) between 12 and 1200),
  item_count integer not null default 0 check (item_count between 0 and 100),
  total_declared_bytes bigint not null default 0 check (total_declared_bytes between 0 and 107374182400),
  accepted_item_count integer not null default 0 check (accepted_item_count between 0 and 100),
  rejected_item_count integer not null default 0 check (rejected_item_count between 0 and 100),
  estimated_monthly_storage_cad numeric(12,4) not null default 0 check (estimated_monthly_storage_cad >= 0),
  gate_c_held boolean not null default true check (gate_c_held is true),
  media_bytes_received boolean not null default false check (media_bytes_received is false),
  storage_authorization_created boolean not null default false check (storage_authorization_created is false),
  worker_execution_requested boolean not null default false check (worker_execution_requested is false),
  public_destination_enabled boolean not null default false check (public_destination_enabled is false),
  recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  recorded_by_staff_email text null check (recorded_by_staff_email is null or char_length(recorded_by_staff_email) <= 320),
  created_at timestamptz not null default now(),
  archived_at timestamptz null
);
create table if not exists public.daip_intake_dry_run_items (
  id uuid primary key default gen_random_uuid(),
  dry_run_id uuid not null references public.daip_intake_dry_runs(id) on delete restrict,
  fictional_filename text not null check (char_length(fictional_filename) between 5 and 180),
  declared_mime_type text not null check (declared_mime_type in ('image/jpeg','image/png','image/webp','video/mp4','video/quicktime')),
  declared_size_bytes bigint not null check (declared_size_bytes between 1 and 2147483648),
  fictional_sha256 text not null check (fictional_sha256 ~ '^[a-f0-9]{64}$'),
  validation_status text not null check (validation_status in ('accepted','rejected')),
  validation_reasons text[] not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.daip_intake_dry_run_audit_events (
  id uuid primary key default gen_random_uuid(),
  dry_run_id uuid not null references public.daip_intake_dry_runs(id) on delete restrict,
  event_type text not null check (event_type in ('dry_run_created','dry_run_validated','dry_run_rejected','dry_run_archived')),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_note text not null check (char_length(safe_note) between 3 and 600),
  created_at timestamptz not null default now()
);
create index if not exists daip_intake_dry_runs_created_idx on public.daip_intake_dry_runs(created_at desc);
create index if not exists daip_intake_dry_run_items_run_idx on public.daip_intake_dry_run_items(dry_run_id,created_at);
create index if not exists daip_intake_dry_run_audit_idx on public.daip_intake_dry_run_audit_events(dry_run_id,created_at desc);
alter table public.daip_intake_dry_runs enable row level security;
alter table public.daip_intake_dry_run_items enable row level security;
alter table public.daip_intake_dry_run_audit_events enable row level security;
revoke all privileges on table public.daip_intake_dry_runs from public, anon, authenticated;
revoke all privileges on table public.daip_intake_dry_run_items from public, anon, authenticated;
revoke all privileges on table public.daip_intake_dry_run_audit_events from public, anon, authenticated;
grant all privileges on table public.daip_intake_dry_runs to service_role;
grant all privileges on table public.daip_intake_dry_run_items to service_role;
grant all privileges on table public.daip_intake_dry_run_audit_events to service_role;
comment on table public.daip_intake_dry_runs is 'Build 226 fictional metadata-only intake validation dry runs. No media bytes, storage authorization, worker execution, customer data, public destination, or publishing.';
commit;
