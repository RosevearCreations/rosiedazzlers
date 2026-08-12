-- Build 228 — Creative Project Intelligence foundation.
begin;
create table if not exists public.creative_projects (
 id uuid primary key default gen_random_uuid(),
 project_code text not null unique check (project_code ~ '^CP-[A-Z0-9-]{6,40}$'),
 title text not null check (char_length(title) between 3 and 180),
 project_type text not null default 'detailing' check (project_type in ('detailing','jewelry','restoration','maker','education','other')),
 lifecycle_status text not null default 'idea' check (lifecycle_status in ('idea','planning','active','paused','complete','content_review','published','archived')),
 purpose text null check (purpose is null or char_length(purpose)<=2000),
 audience text null check (audience is null or char_length(audience)<=800),
 outcome_summary text null check (outcome_summary is null or char_length(outcome_summary)<=4000),
 lessons_learned text null check (lessons_learned is null or char_length(lessons_learned)<=6000),
 future_recommendations text null check (future_recommendations is null or char_length(future_recommendations)<=4000),
 estimated_cost_cad numeric(12,2) not null default 0 check (estimated_cost_cad>=0),
 actual_cost_cad numeric(12,2) not null default 0 check (actual_cost_cad>=0),
 labour_minutes integer not null default 0 check (labour_minutes>=0),
 public_publish_allowed boolean not null default false,
 consent_reviewed boolean not null default false,
 created_by_staff_email text null,
 updated_by_staff_email text null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.creative_project_sessions (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete cascade,
 session_type text not null default 'work' check (session_type in ('planning','work','media','review','publishing')),
 started_at timestamptz not null default now(),
 ended_at timestamptz null,
 minutes_spent integer not null default 0 check (minutes_spent>=0),
 summary text not null check (char_length(summary) between 3 and 3000),
 materials_used text null check (materials_used is null or char_length(materials_used)<=3000),
 mistakes_and_fixes text null check (mistakes_and_fixes is null or char_length(mistakes_and_fixes)<=3000),
 next_action text null check (next_action is null or char_length(next_action)<=1200),
 created_by_staff_email text null,
 created_at timestamptz not null default now()
);
create table if not exists public.creative_project_outputs (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete cascade,
 output_type text not null check (output_type in ('youtube_video','youtube_shorts','instagram_reels','tiktok','facebook_video','pinterest_pins','etsy_draft','website_product_page','blog_article','photo_gallery','before_after','educational_article','project_archive','material_usage_report','cost_analysis','lessons_learned','future_recommendations')),
 status text not null default 'planned' check (status in ('planned','drafting','review','approved','scheduled','published','not_applicable')),
 draft_title text null check (draft_title is null or char_length(draft_title)<=220),
 safe_notes text null check (safe_notes is null or char_length(safe_notes)<=3000),
 destination_url text null check (destination_url is null or char_length(destination_url)<=1000),
 generated_automatically boolean not null default false,
 approved_by_staff_email text null,
 updated_at timestamptz not null default now(),
 unique(project_id,output_type)
);
create table if not exists public.creative_project_audit (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete restrict,
 event_type text not null check (event_type in ('created','updated','session_added','output_updated','archived')),
 actor_staff_email text null,
 safe_note text not null check (char_length(safe_note) between 3 and 1000),
 created_at timestamptz not null default now()
);
create index if not exists creative_projects_status_idx on public.creative_projects(lifecycle_status,updated_at desc);
create index if not exists creative_project_sessions_idx on public.creative_project_sessions(project_id,started_at desc);
create index if not exists creative_project_outputs_idx on public.creative_project_outputs(project_id,status,output_type);
create index if not exists creative_project_audit_idx on public.creative_project_audit(project_id,created_at desc);
alter table public.creative_projects enable row level security;
alter table public.creative_project_sessions enable row level security;
alter table public.creative_project_outputs enable row level security;
alter table public.creative_project_audit enable row level security;
revoke all privileges on table public.creative_projects, public.creative_project_sessions, public.creative_project_outputs, public.creative_project_audit from public,anon,authenticated;
grant all privileges on table public.creative_projects, public.creative_project_sessions, public.creative_project_outputs, public.creative_project_audit to service_role;
comment on table public.creative_projects is 'Build 228 project-centric source record. Projects document process first; products and content are optional governed outputs.';
commit;
