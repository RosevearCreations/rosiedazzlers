-- Build 248 — supplier-link resilience, reviewed DAIP story evidence, and processing retry controls.
-- Apply after Build 247. This migration never makes raw media public and does not render/publish content.

begin;

alter table public.daip_project_media_assets
  add column if not exists story_review_status text not null default 'not_reviewed',
  add column if not exists story_sort_order integer null,
  add column if not exists story_note text null,
  add column if not exists story_reviewed_by_staff_email text null,
  add column if not exists story_reviewed_at timestamptz null;

alter table public.daip_project_media_assets
  drop constraint if exists daip_project_media_assets_story_review_status_check;
alter table public.daip_project_media_assets
  add constraint daip_project_media_assets_story_review_status_check
  check (story_review_status in ('not_reviewed','selected','excluded'));

alter table public.daip_project_media_assets
  drop constraint if exists daip_project_media_assets_story_sort_order_check;
alter table public.daip_project_media_assets
  add constraint daip_project_media_assets_story_sort_order_check
  check (story_sort_order is null or story_sort_order between 1 and 9999);

alter table public.daip_project_media_assets
  drop constraint if exists daip_project_media_assets_story_note_check;
alter table public.daip_project_media_assets
  add constraint daip_project_media_assets_story_note_check
  check (story_note is null or char_length(story_note) <= 1200);

create index if not exists daip_project_media_assets_story_idx
  on public.daip_project_media_assets(project_id, story_review_status, story_sort_order nulls last, created_at);

alter table public.daip_media_processing_jobs
  add column if not exists max_attempts integer not null default 3,
  add column if not exists next_retry_at timestamptz null,
  add column if not exists dead_lettered_at timestamptz null,
  add column if not exists review_note text null;

alter table public.daip_media_processing_jobs
  drop constraint if exists daip_media_processing_jobs_max_attempts_check;
alter table public.daip_media_processing_jobs
  add constraint daip_media_processing_jobs_max_attempts_check
  check (max_attempts between 1 and 20);

alter table public.daip_media_processing_jobs
  drop constraint if exists daip_media_processing_jobs_review_note_check;
alter table public.daip_media_processing_jobs
  add constraint daip_media_processing_jobs_review_note_check
  check (review_note is null or char_length(review_note) <= 1200);

create index if not exists daip_media_processing_jobs_retry_idx
  on public.daip_media_processing_jobs(status, next_retry_at, priority, created_at);

alter table public.creative_projects
  add column if not exists content_package_status text not null default 'not_ready',
  add column if not exists content_package_review_note text null,
  add column if not exists content_package_reviewed_by_staff_email text null,
  add column if not exists content_package_reviewed_at timestamptz null;

alter table public.creative_projects
  drop constraint if exists creative_projects_content_package_status_check;
alter table public.creative_projects
  add constraint creative_projects_content_package_status_check
  check (content_package_status in ('not_ready','ready_for_review','in_review','approved','changes_requested'));

alter table public.creative_projects
  drop constraint if exists creative_projects_content_package_review_note_check;
alter table public.creative_projects
  add constraint creative_projects_content_package_review_note_check
  check (content_package_review_note is null or char_length(content_package_review_note) <= 1600);

create index if not exists creative_projects_content_package_idx
  on public.creative_projects(content_package_status, updated_at desc);

alter table public.creative_project_audit drop constraint if exists creative_project_audit_event_type_check;
alter table public.creative_project_audit add constraint creative_project_audit_event_type_check check (event_type in (
  'created','updated','session_added','output_updated','archived','restored','booking_unlinked','cost_line_added','material_line_added','labour_line_added','draft_updated','batch_approval','daip_associated','line_updated','line_soft_deleted','inventory_reservation_updated','session_story_approval','shot_plan_updated','learning_updated','archive_export_prepared','template_updated','content_plan_generated','media_upload_started','media_upload_completed','media_upload_aborted','media_processing_updated','media_story_reviewed','media_job_retried','content_package_reviewed'
));

comment on column public.daip_project_media_assets.story_review_status is 'Build 248 human review state controlling whether private media metadata may be referenced by story/content planning. It never grants public access.';
comment on column public.daip_media_processing_jobs.dead_lettered_at is 'Build 248 operator-visible terminal retry state. It does not delete raw media.';
comment on column public.creative_projects.content_package_status is 'Build 248 human content-package review gate. Approval does not publish content.';

commit;
