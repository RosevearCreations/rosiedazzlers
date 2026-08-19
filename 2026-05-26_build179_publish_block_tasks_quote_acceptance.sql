-- Build 179 — hard publish blocking, assignable local proof tasks, and quote delivery/acceptance tracking.
-- Apply after Build 174 quote_proposal_drafts SQL and Builds 175-177 conversion SQL.

create table if not exists public.local_seo_proof_tasks (
  id uuid primary key default gen_random_uuid(),
  town text,
  service text,
  priority text not null default 'high',
  status text not null default 'needs_media',
  task_type text not null default 'gallery_proof',
  title text not null,
  description text,
  source_recommendation jsonb,
  assigned_to_email text,
  due_at timestamptz,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint local_seo_proof_tasks_priority_check check (priority in ('high','medium','low','maintenance')),
  constraint local_seo_proof_tasks_status_check check (status in ('needs_media','assigned','in_progress','ready_for_review','approved_public','closed','archived'))
);

create index if not exists idx_local_seo_proof_tasks_status on public.local_seo_proof_tasks(status);
create index if not exists idx_local_seo_proof_tasks_town_service on public.local_seo_proof_tasks(town, service);
create index if not exists idx_local_seo_proof_tasks_updated_at on public.local_seo_proof_tasks(updated_at desc);

alter table public.quote_proposal_drafts add column if not exists delivery_status text default 'not_prepared';
alter table public.quote_proposal_drafts add column if not exists delivery_to_email text;
alter table public.quote_proposal_drafts add column if not exists delivery_subject text;
alter table public.quote_proposal_drafts add column if not exists delivery_message text;
alter table public.quote_proposal_drafts add column if not exists delivered_at timestamptz;
alter table public.quote_proposal_drafts add column if not exists acceptance_token_hash text;
alter table public.quote_proposal_drafts add column if not exists acceptance_status text default 'not_sent';
alter table public.quote_proposal_drafts add column if not exists accepted_at timestamptz;
alter table public.quote_proposal_drafts add column if not exists declined_at timestamptz;
alter table public.quote_proposal_drafts add column if not exists responded_at timestamptz;
alter table public.quote_proposal_drafts add column if not exists customer_response_note text;

create index if not exists idx_quote_proposal_drafts_acceptance_status on public.quote_proposal_drafts(acceptance_status);
create index if not exists idx_quote_proposal_drafts_delivery_status on public.quote_proposal_drafts(delivery_status);
