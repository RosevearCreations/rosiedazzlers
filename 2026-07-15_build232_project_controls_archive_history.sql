-- Build 232: accessible project controls, budgets, reminders, evidence and draft history
alter table if exists public.creative_projects add column if not exists project_budget_cad numeric(12,2) not null default 0 check (project_budget_cad >= 0);
alter table if exists public.creative_projects add column if not exists target_margin_percent numeric(5,2) not null default 30 check (target_margin_percent between 0 and 95);
alter table if exists public.creative_project_shot_plan_items add column if not exists owner_label text;
alter table if exists public.creative_project_shot_plan_items add column if not exists sort_order integer not null default 1 check (sort_order between 1 and 9999);
alter table if exists public.creative_project_shot_plan_items add column if not exists capture_evidence_note text;
create table if not exists public.creative_project_consent_reminders (id uuid primary key default gen_random_uuid(),project_id uuid not null references public.creative_projects(id) on delete cascade,due_at timestamptz not null,status text not null default 'queued_for_review' check(status in ('queued_for_review','approved','sent','cancelled','failed')),recipient_scope text not null default 'project_owner_review',safe_message text not null,created_by_staff_email text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.creative_project_output_draft_versions (id uuid primary key default gen_random_uuid(),project_id uuid not null references public.creative_projects(id) on delete cascade,output_type text not null,draft_kind text not null,version_payload jsonb not null default '{}'::jsonb,created_by_staff_email text,created_at timestamptz not null default now());
alter table public.creative_project_consent_reminders enable row level security;alter table public.creative_project_output_draft_versions enable row level security;
revoke all on public.creative_project_consent_reminders from public,anon,authenticated;revoke all on public.creative_project_output_draft_versions from public,anon,authenticated;
grant all on public.creative_project_consent_reminders to service_role;grant all on public.creative_project_output_draft_versions to service_role;
create index if not exists creative_project_consent_reminders_due_idx on public.creative_project_consent_reminders(status,due_at);
create index if not exists creative_project_draft_versions_project_idx on public.creative_project_output_draft_versions(project_id,output_type,draft_kind,created_at desc);
