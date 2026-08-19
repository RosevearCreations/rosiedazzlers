-- Build 230 — structured creative-project costing, templates, output drafts, reversible links, and gated DAIP association.
begin;

alter table public.creative_projects
  add column if not exists template_key text null check (template_key is null or char_length(template_key) <= 80),
  add column if not exists before_after_applicability text not null default 'not_reviewed'
    check (before_after_applicability in ('not_reviewed','applicable','not_applicable')),
  add column if not exists consent_summary text null check (consent_summary is null or char_length(consent_summary) <= 3000),
  add column if not exists consent_status text not null default 'not_reviewed'
    check (consent_status in ('not_reviewed','internal_only','approved_public','declined','expired')),
  add column if not exists archived_reason text null check (archived_reason is null or char_length(archived_reason) <= 1200),
  add column if not exists archived_at timestamptz null;

create table if not exists public.creative_project_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique check (template_key ~ '^[a-z0-9_]{3,80}$'),
  name text not null check (char_length(name) between 3 and 120),
  project_type text not null check (project_type in ('detailing','jewelry','restoration','maker','education','other')),
  purpose_prompt text null check (purpose_prompt is null or char_length(purpose_prompt) <= 2000),
  audience_prompt text null check (audience_prompt is null or char_length(audience_prompt) <= 800),
  default_before_after_applicability text not null default 'not_reviewed'
    check (default_before_after_applicability in ('not_reviewed','applicable','not_applicable')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.creative_project_templates(template_key,name,project_type,purpose_prompt,audience_prompt,default_before_after_applicability)
values
 ('detailing_story','Detailing transformation story','detailing','Document the condition, process, decisions, results, and lessons from a selected detailing job.','Local vehicle owners and detailing learners','applicable'),
 ('maker_process','Maker process documentary','maker','Document the complete creative process from idea and setup through mistakes, corrections, final result, and recommendations.','Makers, customers, and learners','not_reviewed'),
 ('education_walkthrough','Educational walkthrough','education','Teach a repeatable process with safety notes, tools, materials, troubleshooting, and verified results.','Beginners and practical learners','not_applicable'),
 ('restoration_story','Restoration before-and-after','restoration','Document assessment, preservation choices, restoration work, final condition, and care guidance.','Collectors, owners, and restoration learners','applicable')
on conflict (template_key) do update set name=excluded.name,project_type=excluded.project_type,purpose_prompt=excluded.purpose_prompt,audience_prompt=excluded.audience_prompt,default_before_after_applicability=excluded.default_before_after_applicability,updated_at=now();

create table if not exists public.creative_project_material_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  material_name text not null check (char_length(material_name) between 2 and 180),
  inventory_item_id uuid null,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit text not null default 'item' check (char_length(unit) between 1 and 40),
  unit_cost_cad numeric(12,4) not null default 0 check (unit_cost_cad >= 0),
  waste_quantity numeric(12,3) not null default 0 check (waste_quantity >= 0),
  source_mode text not null default 'project_only' check (source_mode in ('project_only','inventory_reference')),
  safe_note text null check (safe_note is null or char_length(safe_note) <= 1200),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_labour_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  labour_type text not null default 'creative_work' check (labour_type in ('planning','creative_work','detailing','media','editing','review','administration','other')),
  minutes integer not null check (minutes > 0),
  hourly_rate_cad numeric(12,2) not null default 0 check (hourly_rate_cad >= 0),
  safe_note text null check (safe_note is null or char_length(safe_note) <= 1200),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_cost_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  cost_type text not null check (cost_type in ('overhead','equipment','travel','platform_fee','shipping','packaging','other')),
  description text not null check (char_length(description) between 2 and 240),
  amount_cad numeric(12,2) not null check (amount_cad >= 0),
  safe_note text null check (safe_note is null or char_length(safe_note) <= 1200),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_output_drafts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  output_type text not null check (output_type in ('youtube_video','youtube_shorts','instagram_reels','tiktok','facebook_video','pinterest_pins','etsy_draft','website_product_page','blog_article','photo_gallery','before_after','educational_article','project_archive','material_usage_report','cost_analysis','lessons_learned','future_recommendations')),
  draft_kind text not null default 'platform_copy' check (draft_kind in ('story_outline','platform_copy','commerce_copy','report_outline')),
  hook text null check (hook is null or char_length(hook) <= 500),
  outline text null check (outline is null or char_length(outline) <= 12000),
  caption text null check (caption is null or char_length(caption) <= 5000),
  call_to_action text null check (call_to_action is null or char_length(call_to_action) <= 800),
  seo_title text null check (seo_title is null or char_length(seo_title) <= 180),
  seo_description text null check (seo_description is null or char_length(seo_description) <= 500),
  aspect_ratio text null check (aspect_ratio is null or aspect_ratio in ('16:9','9:16','1:1','2:3','mixed','not_applicable')),
  review_status text not null default 'draft' check (review_status in ('draft','review','approved','rejected')),
  approved_by_staff_email text null,
  updated_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id,output_type,draft_kind)
);

create table if not exists public.creative_project_daip_associations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  daip_reference text not null check (daip_reference ~ '^DAIP-[A-Z0-9-]{6,80}$'),
  association_status text not null default 'requested' check (association_status in ('requested','approved','revoked')),
  gate_c_verified boolean not null default false check (gate_c_verified = true),
  technical_capability_verified boolean not null default false check (technical_capability_verified = true),
  contains_media_bytes boolean not null default false check (contains_media_bytes = false),
  public_destination_enabled boolean not null default false check (public_destination_enabled = false),
  safe_note text not null check (char_length(safe_note) between 3 and 1200),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  unique(project_id,daip_reference)
);

alter table public.creative_project_audit drop constraint if exists creative_project_audit_event_type_check;
alter table public.creative_project_audit add constraint creative_project_audit_event_type_check check (event_type in ('created','updated','session_added','output_updated','archived','restored','booking_unlinked','cost_line_added','material_line_added','labour_line_added','draft_updated','batch_approval','daip_associated'));

create index if not exists creative_project_material_lines_idx on public.creative_project_material_lines(project_id,created_at desc);
create index if not exists creative_project_labour_lines_idx on public.creative_project_labour_lines(project_id,created_at desc);
create index if not exists creative_project_cost_lines_idx on public.creative_project_cost_lines(project_id,created_at desc);
create index if not exists creative_project_output_drafts_idx on public.creative_project_output_drafts(project_id,output_type,review_status);
create index if not exists creative_project_daip_associations_idx on public.creative_project_daip_associations(project_id,created_at desc);

alter table public.creative_project_templates enable row level security;
alter table public.creative_project_material_lines enable row level security;
alter table public.creative_project_labour_lines enable row level security;
alter table public.creative_project_cost_lines enable row level security;
alter table public.creative_project_output_drafts enable row level security;
alter table public.creative_project_daip_associations enable row level security;
revoke all privileges on table public.creative_project_templates,public.creative_project_material_lines,public.creative_project_labour_lines,public.creative_project_cost_lines,public.creative_project_output_drafts,public.creative_project_daip_associations from public,anon,authenticated;
grant all privileges on table public.creative_project_templates,public.creative_project_material_lines,public.creative_project_labour_lines,public.creative_project_cost_lines,public.creative_project_output_drafts,public.creative_project_daip_associations to service_role;

comment on table public.creative_project_material_lines is 'Build 230 project-only material accounting. It does not mutate ordinary booking inventory or job costing.';
comment on table public.creative_project_daip_associations is 'Build 230 gated project-to-DAIP metadata association. Database constraints prohibit media bytes and public destinations.';
commit;
