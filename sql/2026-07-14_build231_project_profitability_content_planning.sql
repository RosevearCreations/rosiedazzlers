-- Build 231 — project profitability, reviewed consumption, content planning, learning, and reversible line controls.
begin;

alter table public.creative_projects
  add column if not exists project_classification text not null default 'commercial'
    check (project_classification in ('commercial','therapeutic','educational','internal','non_commercial')),
  add column if not exists expected_revenue_cad numeric(12,2) not null default 0 check (expected_revenue_cad >= 0),
  add column if not exists actual_revenue_cad numeric(12,2) not null default 0 check (actual_revenue_cad >= 0),
  add column if not exists consent_expires_at timestamptz null,
  add column if not exists consent_reminder_days integer not null default 30 check (consent_reminder_days between 1 and 365),
  add column if not exists profitability_note text null check (profitability_note is null or char_length(profitability_note) <= 2000);

alter table public.creative_project_material_lines
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz null,
  add column if not exists deleted_by_staff_email text null;
alter table public.creative_project_labour_lines
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz null,
  add column if not exists deleted_by_staff_email text null;
alter table public.creative_project_cost_lines
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz null,
  add column if not exists deleted_by_staff_email text null;
alter table public.creative_project_sessions
  add column if not exists approved_for_story boolean not null default false,
  add column if not exists story_approved_at timestamptz null,
  add column if not exists story_approved_by_staff_email text null;
alter table public.creative_project_output_drafts
  add column if not exists planning_data jsonb not null default '{}'::jsonb,
  add column if not exists safety_review_status text not null default 'not_reviewed'
    check (safety_review_status in ('not_reviewed','required','review','approved','rejected'));
alter table public.creative_project_templates
  add column if not exists safe_instructions text null check (safe_instructions is null or char_length(safe_instructions) <= 4000),
  add column if not exists updated_by_staff_email text null;

create table if not exists public.creative_project_inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  material_line_id uuid null references public.creative_project_material_lines(id) on delete set null,
  inventory_item_id uuid not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null default 'item' check (char_length(unit) between 1 and 40),
  status text not null default 'draft' check (status in ('draft','reserved','reviewed','posted','cancelled')),
  review_note text null check (review_note is null or char_length(review_note) <= 1200),
  reviewed_by_staff_email text null,
  reviewed_at timestamptz null,
  posted_by_staff_email text null,
  posted_at timestamptz null,
  inventory_mutated boolean not null default false check (inventory_mutated = false),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_shot_plan_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  shot_type text not null check (shot_type in ('before','during','after','detail','tool','material','safety','thumbnail','other')),
  description text not null check (char_length(description) between 3 and 500),
  required boolean not null default true,
  status text not null default 'planned' check (status in ('planned','captured','approved','not_applicable')),
  consent_required boolean not null default false,
  safe_note text null check (safe_note is null or char_length(safe_note) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_learning_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  item_type text not null check (item_type in ('lesson','future_recommendation')),
  title text not null check (char_length(title) between 3 and 180),
  detail text not null check (char_length(detail) between 3 and 4000),
  status text not null default 'draft' check (status in ('draft','review','approved','rejected','archived')),
  score integer null check (score is null or score between 0 and 100),
  rationale text null check (rationale is null or char_length(rationale) <= 2000),
  approved_by_staff_email text null,
  approved_at timestamptz null,
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_archive_exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  export_status text not null default 'prepared' check (export_status in ('prepared','downloaded','superseded')),
  manifest jsonb not null default '{}'::jsonb,
  contains_media_bytes boolean not null default false check (contains_media_bytes = false),
  public_destination_enabled boolean not null default false check (public_destination_enabled = false),
  created_by_staff_email text null,
  created_at timestamptz not null default now()
);

create index if not exists creative_project_inventory_reservations_idx on public.creative_project_inventory_reservations(project_id,status,created_at desc);
create index if not exists creative_project_shot_plan_items_idx on public.creative_project_shot_plan_items(project_id,status,created_at);
create index if not exists creative_project_learning_items_idx on public.creative_project_learning_items(project_id,item_type,status,score desc nulls last);
create index if not exists creative_project_archive_exports_idx on public.creative_project_archive_exports(project_id,created_at desc);

alter table public.creative_project_inventory_reservations enable row level security;
alter table public.creative_project_shot_plan_items enable row level security;
alter table public.creative_project_learning_items enable row level security;
alter table public.creative_project_archive_exports enable row level security;
revoke all privileges on table public.creative_project_inventory_reservations,public.creative_project_shot_plan_items,public.creative_project_learning_items,public.creative_project_archive_exports from public,anon,authenticated;
grant all privileges on table public.creative_project_inventory_reservations,public.creative_project_shot_plan_items,public.creative_project_learning_items,public.creative_project_archive_exports to service_role;

alter table public.creative_project_audit drop constraint if exists creative_project_audit_event_type_check;
alter table public.creative_project_audit add constraint creative_project_audit_event_type_check check (event_type in ('created','updated','session_added','output_updated','archived','restored','booking_unlinked','cost_line_added','material_line_added','labour_line_added','draft_updated','batch_approval','daip_associated','line_updated','line_soft_deleted','inventory_reservation_updated','session_story_approval','shot_plan_updated','learning_updated','archive_export_prepared','template_updated','content_plan_generated'));

comment on table public.creative_project_inventory_reservations is 'Build 231 reviewed project-consumption ledger. inventory_mutated is forcibly false; ordinary booking inventory remains unchanged.';
comment on table public.creative_project_archive_exports is 'Build 231 metadata-only archive manifests. No media bytes and no public destination.';
commit;
