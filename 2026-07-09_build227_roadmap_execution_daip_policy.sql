-- Build 227 — DB-backed roadmap execution and DAIP dry-run policy controls.
begin;
create table if not exists public.app_roadmap_execution_items (
 id uuid primary key default gen_random_uuid(),
 item_key text not null unique check (item_key ~ '^[a-z0-9_:-]{4,120}$'),
 title text not null check (char_length(title) between 5 and 220),
 workstream text not null check (workstream in ('customer','booking','payments','seo','media','daip','operations','reliability','documentation')),
 priority text not null default 'high' check (priority in ('critical','high','medium','low')),
 status text not null default 'planned' check (status in ('planned','in_progress','blocked','done','deferred')),
 owner_label text null check (owner_label is null or char_length(owner_label)<=120),
 evidence_note text null check (evidence_note is null or char_length(evidence_note)<=1200),
 target_build integer null check (target_build is null or target_build between 227 and 999),
 sort_order integer not null default 100 check (sort_order between 1 and 10000),
 source_document text not null default 'MASTER_VALUE_ROADMAP.md',
 updated_by_staff_email text null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.app_roadmap_execution_audit (
 id uuid primary key default gen_random_uuid(), roadmap_item_id uuid not null references public.app_roadmap_execution_items(id) on delete restrict,
 event_type text not null check (event_type in ('created','updated','status_changed','evidence_added')),
 actor_staff_email text null, safe_note text not null check (char_length(safe_note) between 3 and 800), created_at timestamptz not null default now()
);
create table if not exists public.daip_intake_validation_policy (
 id uuid primary key default gen_random_uuid(), policy_key text not null unique default 'active',
 max_manifest_items integer not null default 25 check (max_manifest_items between 1 and 100),
 max_image_bytes bigint not null default 52428800 check (max_image_bytes between 1048576 and 524288000),
 max_video_bytes bigint not null default 2147483648 check (max_video_bytes between 10485760 and 10737418240),
 storage_rate_cad_per_gb_month numeric(12,6) not null default 0.025 check (storage_rate_cad_per_gb_month between 0 and 100),
 monthly_warning_cad numeric(12,2) not null default 25 check (monthly_warning_cad between 0 and 100000),
 monthly_hard_stop_cad numeric(12,2) not null default 50 check (monthly_hard_stop_cad >= monthly_warning_cad and monthly_hard_stop_cad <= 100000),
 gate_c_held boolean not null default true check (gate_c_held is true),
 technical_capability_enabled boolean not null default false check (technical_capability_enabled is false),
 updated_by_staff_email text null, updated_at timestamptz not null default now()
);
insert into public.daip_intake_validation_policy(policy_key) values('active') on conflict(policy_key) do nothing;
insert into public.app_roadmap_execution_items(item_key,title,workstream,priority,status,target_build,sort_order,source_document) values
('b227_01','Deploy and validate Build 226 metadata-only DAIP dry runs','daip','critical','planned',227,10,'MASTER_VALUE_ROADMAP.md'),
('b227_02','Move DAIP validation limits and cost assumptions from code into protected DB policy','daip','critical','done',227,20,'DEVELOPMENT_ROADMAP.md'),
('b227_03','Add protected roadmap execution queue and evidence tracking','operations','high','done',227,30,'DEVELOPMENT_ROADMAP.md'),
('b227_04','Complete DAIP owner decisions and Gate A evidence','daip','critical','planned',228,40,'MASTER_VALUE_ROADMAP.md'),
('b227_05','Complete DAIP internal safety tests and Gate B evidence','daip','critical','planned',228,50,'MASTER_VALUE_ROADMAP.md'),
('b227_06','Perform independent Gate C rollback review','daip','critical','planned',229,60,'MASTER_VALUE_ROADMAP.md'),
('b227_07','Run customer account recovery and archive/restore staging tests','customer','high','planned',228,70,'KNOWN_GAPS_AND_RISKS.md'),
('b227_08','Add manual duplicate-customer merge dry-run workflow','customer','high','planned',229,80,'MASTER_VALUE_ROADMAP.md'),
('b227_09','Verify final-balance Stripe test-mode settlement and replay','payments','critical','planned',228,90,'KNOWN_GAPS_AND_RISKS.md'),
('b227_10','Verify notification provider delivery in controlled inbox','reliability','high','planned',228,100,'KNOWN_GAPS_AND_RISKS.md'),
('b227_11','Run mobile weak-network upload retry tests','media','high','planned',229,110,'KNOWN_GAPS_AND_RISKS.md'),
('b227_12','Pair approved final proof into gallery candidates with consent review','media','high','planned',230,120,'MASTER_VALUE_ROADMAP.md'),
('b227_13','Create vehicle-history cards from approved final proof only','customer','high','planned',230,130,'MASTER_VALUE_ROADMAP.md'),
('b227_14','Gate review requests on payment, acknowledgement, and incident status','customer','high','planned',230,140,'MASTER_VALUE_ROADMAP.md'),
('b227_15','Add local SEO evidence review from Search Console and Business Profile','seo','high','planned',229,150,'MASTER_VALUE_ROADMAP.md'),
('b227_16','Replace public placeholders only with approved Rosie-owned proof','seo','medium','planned',230,160,'IMAGES.md'),
('b227_17','Add live screenshot/mobile smoke evidence for core routes','reliability','high','planned',228,170,'DEVELOPMENT_ROADMAP.md'),
('b227_18','Archive redundant Markdown safely after guard dependency scan','documentation','medium','planned',229,180,'DEVELOPMENT_ROADMAP.md'),
('b227_19','Continue one-H1, title/meta, local wording, and CSS drift checks','seo','high','in_progress',227,190,'DEVELOPMENT_ROADMAP.md'),
('b227_20','Keep DAIP storage, workers, AI, and publishing disabled until Gate C approval','daip','critical','in_progress',227,200,'KNOWN_GAPS_AND_RISKS.md')
on conflict(item_key) do nothing;
create index if not exists app_roadmap_execution_status_idx on public.app_roadmap_execution_items(status,priority,sort_order);
create index if not exists app_roadmap_execution_audit_idx on public.app_roadmap_execution_audit(roadmap_item_id,created_at desc);
alter table public.app_roadmap_execution_items enable row level security;
alter table public.app_roadmap_execution_audit enable row level security;
alter table public.daip_intake_validation_policy enable row level security;
revoke all privileges on table public.app_roadmap_execution_items, public.app_roadmap_execution_audit, public.daip_intake_validation_policy from public,anon,authenticated;
grant all privileges on table public.app_roadmap_execution_items, public.app_roadmap_execution_audit, public.daip_intake_validation_policy to service_role;
comment on table public.daip_intake_validation_policy is 'Build 227 planning-only DAIP metadata validation policy. Gate C is held and technical capability is forced false.';
commit;
