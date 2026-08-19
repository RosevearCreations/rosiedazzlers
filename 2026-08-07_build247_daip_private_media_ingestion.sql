-- Build 247 — DAIP private large-media ingestion, multipart upload state, and processing queue metadata.
-- Apply after Build 246. Raw bytes live only in private R2; Supabase stores metadata and audit state.

begin;

create table if not exists public.daip_project_media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  original_filename text not null check (char_length(original_filename) between 1 and 220),
  content_type text not null check (char_length(content_type) between 3 and 120),
  file_size_bytes bigint not null check (file_size_bytes > 0),
  media_kind text not null check (media_kind in ('photo','video','file')),
  capture_stage text not null default 'other' check (capture_stage in ('before','process','after','damage','interior','exterior','engine','other')),
  privacy_status text not null default 'private_internal' check (privacy_status in ('private_internal')),
  consent_status text not null default 'not_reviewed' check (consent_status in ('not_reviewed','internal_only','approved_public','declined','expired')),
  storage_binding text not null default 'DAIP_MEDIA_BUCKET',
  object_key text not null unique check (object_key like 'projects/%/raw/%'),
  upload_status text not null default 'created' check (upload_status in ('created','uploading','uploaded','aborted','failed')),
  r2_etag text null,
  sha256_hex text null check (sha256_hex is null or sha256_hex ~ '^[a-fA-F0-9]{64}$'),
  is_raw_original boolean not null default true check (is_raw_original = true),
  public_destination_enabled boolean not null default false check (public_destination_enabled = false),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  uploaded_at timestamptz null
);

create table if not exists public.daip_media_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.daip_project_media_assets(id) on delete cascade,
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  client_fingerprint text not null check (char_length(client_fingerprint) between 3 and 300),
  multipart_upload_id text not null check (char_length(multipart_upload_id) between 3 and 500),
  object_key text not null,
  part_size_bytes integer not null default 33554432 check (part_size_bytes between 5242880 and 104857600),
  total_parts integer not null check (total_parts between 1 and 10000),
  file_size_bytes bigint not null check (file_size_bytes > 0),
  status text not null default 'created' check (status in ('created','uploading','paused','uploaded','aborted','failed')),
  last_part_number integer null check (last_part_number is null or last_part_number between 1 and 10000),
  last_modified_ms bigint null,
  last_error text null check (last_error is null or char_length(last_error)<=1000),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,
  aborted_at timestamptz null
);

create table if not exists public.daip_media_upload_parts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.daip_media_upload_sessions(id) on delete cascade,
  part_number integer not null check (part_number between 1 and 10000),
  etag text not null check (char_length(etag) between 3 and 300),
  size_bytes integer not null default 0 check (size_bytes >= 0),
  uploaded_at timestamptz not null default now(),
  unique(session_id,part_number)
);

create table if not exists public.daip_media_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  asset_id uuid not null references public.daip_project_media_assets(id) on delete cascade,
  job_type text not null check (job_type in ('metadata_extract','privacy_review','content_candidate_index','proxy_video','frame_extract','audio_extract','transcript','scene_analysis','image_derivative','visual_analysis')),
  status text not null default 'queued' check (status in ('queued','dispatched','processing','review','completed','blocked','failed','cancelled')),
  priority integer not null default 100 check (priority between 1 and 999),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  output_manifest jsonb not null default '{}'::jsonb,
  last_error text null check (last_error is null or char_length(last_error)<=1000),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null,
  unique(asset_id,job_type)
);

create index if not exists daip_project_media_assets_project_idx on public.daip_project_media_assets(project_id,created_at desc);
create index if not exists daip_project_media_assets_status_idx on public.daip_project_media_assets(upload_status,media_kind,created_at desc);
create index if not exists daip_media_upload_sessions_project_idx on public.daip_media_upload_sessions(project_id,status,updated_at desc);
create unique index if not exists daip_media_upload_sessions_active_fingerprint_uidx
  on public.daip_media_upload_sessions(project_id,client_fingerprint)
  where status in ('created','uploading','paused');
create index if not exists daip_media_parts_session_idx on public.daip_media_upload_parts(session_id,part_number);
create index if not exists daip_media_processing_jobs_queue_idx on public.daip_media_processing_jobs(status,priority,created_at);

alter table public.daip_project_media_assets enable row level security;
alter table public.daip_media_upload_sessions enable row level security;
alter table public.daip_media_upload_parts enable row level security;
alter table public.daip_media_processing_jobs enable row level security;
revoke all privileges on table public.daip_project_media_assets,public.daip_media_upload_sessions,public.daip_media_upload_parts,public.daip_media_processing_jobs from public,anon,authenticated;
grant all privileges on table public.daip_project_media_assets,public.daip_media_upload_sessions,public.daip_media_upload_parts,public.daip_media_processing_jobs to service_role;

comment on table public.daip_project_media_assets is 'Build 247 private DAIP raw-media metadata. Raw bytes live in private R2 only; public destination is structurally false.';
comment on table public.daip_media_upload_sessions is 'Build 247 resumable multipart-upload state for private DAIP project media.';
comment on table public.daip_media_upload_parts is 'Build 247 uploaded multipart ETags needed to safely resume and complete R2 uploads.';
comment on table public.daip_media_processing_jobs is 'Build 247 private downstream processing queue metadata for proxies, frames, transcript, scene analysis, and content candidates.';

alter table public.creative_project_audit drop constraint if exists creative_project_audit_event_type_check;
alter table public.creative_project_audit add constraint creative_project_audit_event_type_check check (event_type in (
  'created','updated','session_added','output_updated','archived','restored','booking_unlinked','cost_line_added','material_line_added','labour_line_added','draft_updated','batch_approval','daip_associated','line_updated','line_soft_deleted','inventory_reservation_updated','session_story_approval','shot_plan_updated','learning_updated','archive_export_prepared','template_updated','content_plan_generated','media_upload_started','media_upload_completed','media_upload_aborted','media_processing_updated'
));

insert into public.app_startup_process_items(process_key,sort_order,category,severity,title,why_text,locations,instructions,done_when,action_route,evidence_key,source_build,is_active)
values
('daip-private-r2-setup',38,'DAIP and media','blocker','Create and bind the private DAIP R2 bucket','Raw MOV, MP4 and photo masters must not be stored in the public rosie-assets bucket. Build 247 expects one private R2 bucket bound to Pages Functions as DAIP_MEDIA_BUCKET.','["Cloudflare Dashboard → R2 Object Storage", "Cloudflare Dashboard → Workers & Pages → Rosie Dazzlers project → Settings → Bindings", "/admin-daip-media.html#setup"]'::jsonb,'["Create an R2 bucket named rosie-daip-media (or another private name).", "Leave r2.dev and custom-domain public access disabled.", "Open Workers & Pages and select the Rosie Dazzlers Pages project.", "Open Settings → Bindings → Add → R2 bucket.", "Set Variable name to DAIP_MEDIA_BUCKET.", "Select the private DAIP bucket and save.", "Repeat the binding for Preview and Production environments if Cloudflare separates them.", "Redeploy the Pages project.", "Open /admin-daip-media.html and confirm Private R2 binding says Ready."]'::jsonb,'The private bucket exists, has no public domain, DAIP_MEDIA_BUCKET is bound to the Pages project, the project was redeployed, and the DAIP Media Intake screen reports the binding as ready.','/admin-daip-media.html#setup','daip_private_r2_setup',247,true),
('daip-large-media-acceptance',39,'DAIP and media','blocker','Complete DAIP large-media upload and recovery acceptance','Before the three historical detailing projects are ingested, one harmless test photo and one large test video should prove multipart upload, resume, immutable raw storage, DB metadata, and processing queue creation.','["/admin-daip-media.html", "Supabase Dashboard → daip_project_media_assets", "Supabase Dashboard → daip_media_upload_sessions", "Supabase Dashboard → daip_media_processing_jobs"]'::jsonb,'["Apply the Build 247 migration in staging.", "Create or select a Creative Project.", "Upload one photo and confirm it completes and queues image processing jobs.", "Begin one video larger than 300 MB, interrupt the connection after several parts, then reselect the same file and choose Resume.", "Confirm previously uploaded parts are skipped and the upload continues.", "Complete the video and confirm raw object_key begins projects/{project_uuid}/raw/video/.", "Confirm the raw bucket remains private and public_destination_enabled is false.", "Confirm proxy/frame/audio/transcript/scene-analysis jobs were queued.", "Record safe evidence in Startup Command Center; do not paste customer media URLs or credentials."]'::jsonb,'A >300 MB test video survives interruption/resume without restarting from zero, the immutable raw object is private, metadata is shared in Supabase, and the correct processing jobs exist.','/admin-daip-media.html','daip_large_media_acceptance',247,true)
on conflict (process_key) do update set sort_order=excluded.sort_order,category=excluded.category,severity=excluded.severity,title=excluded.title,why_text=excluded.why_text,locations=excluded.locations,instructions=excluded.instructions,done_when=excluded.done_when,action_route=excluded.action_route,evidence_key=excluded.evidence_key,source_build=excluded.source_build,is_active=true,updated_at=now();

insert into public.app_launch_readiness_evidence(evidence_key,title,detail,severity,status,sort_order) values
('daip_private_r2_setup','Private DAIP R2 setup','Private bucket exists, is not publicly exposed, and is bound as DAIP_MEDIA_BUCKET.','block','pending',43),
('daip_large_media_acceptance','DAIP large-media acceptance','Verify >300 MB multipart upload, interruption/resume, immutable raw storage, and processing job creation.','block','pending',44)
on conflict (evidence_key) do update set title=excluded.title,detail=excluded.detail,severity=excluded.severity,sort_order=excluded.sort_order,updated_at=now();

-- Build 247 expands the roadmap workstream taxonomy for the DAIP/content pipeline.
-- Build 227 originally allowed only customer, booking, payments, seo, media,
-- daip, operations, reliability and documentation. Build 247 adds content and
-- security as first-class roadmap workstreams, so expand the existing CHECK
-- constraint before seeding the Build 247 roadmap cycle.
alter table public.app_roadmap_execution_items
  drop constraint if exists app_roadmap_execution_items_workstream_check;

alter table public.app_roadmap_execution_items
  add constraint app_roadmap_execution_items_workstream_check
  check (
    workstream in (
      'customer',
      'booking',
      'payments',
      'seo',
      'media',
      'daip',
      'operations',
      'reliability',
      'documentation',
      'content',
      'security'
    )
  );

update public.app_roadmap_execution_items set is_current_cycle=false where coalesce(is_current_cycle,false)=true;
insert into public.app_roadmap_execution_items(item_key,title,workstream,priority,status,target_build,sort_order,source_document,cycle_key,is_current_cycle,action_path) values
('b247_01','Create and bind private DAIP R2 bucket','media','critical','planned',247,10,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html#setup'),
('b247_02','Apply Build 247 DAIP media migration in staging','reliability','critical','planned',247,20,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html'),
('b247_03','Upload and verify one private DAIP photo','media','critical','planned',247,30,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html'),
('b247_04','Prove >300 MB video multipart upload','media','critical','planned',247,40,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html'),
('b247_05','Prove interrupted video resume','media','critical','planned',247,50,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html'),
('b247_06','Import the first historical detailing project','media','high','planned',247,60,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_07','Import the second historical detailing project','media','high','planned',247,70,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_08','Import the third historical detailing project','media','high','planned',247,80,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_09','Configure optional DAIP processing queue','media','high','planned',247,90,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_10','Implement processing consumer for proxies frames audio and transcript','media','critical','planned',248,100,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_11','Implement scene analysis and before-after candidate scoring','media','high','planned',248,110,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_12','Implement reviewed content-story assembly','content','high','planned',248,120,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-creative-projects.html'),
('b247_13','Implement render adapter for long and short video outputs','content','critical','planned',249,130,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-creative-projects.html'),
('b247_14','Keep generated media private until review','security','critical','planned',248,140,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-startup-guide.html'),
('b247_15','Add reviewed copy-to-public workflow for approved derivatives','media','high','planned',249,150,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-gallery.html'),
('b247_16','Complete real-device DAIP uploader acceptance','reliability','high','planned',247,160,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html'),
('b247_17','Continue catalog publish-readiness cleanup','operations','high','planned',247,170,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-catalog.html'),
('b247_18','Complete booking payment notification acceptance','reliability','critical','planned',247,180,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-startup-guide.html'),
('b247_19','Complete Search Console and Google Business Profile alignment','seo','high','planned',247,190,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-seo-tasks.html'),
('b247_20','Run invite-only soft launch and evidence review','operations','critical','planned',247,200,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-startup-guide.html')
on conflict (item_key) do update set title=excluded.title,workstream=excluded.workstream,priority=excluded.priority,status=excluded.status,target_build=excluded.target_build,sort_order=excluded.sort_order,source_document=excluded.source_document,cycle_key=excluded.cycle_key,is_current_cycle=true,action_path=excluded.action_path,updated_at=now();

commit;
