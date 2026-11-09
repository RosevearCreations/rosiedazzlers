-- Build 824: private append-only supervisor handoff notes. No public/customer read path.
create table public.customer_worksite_supervisor_notes_v824 (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null references public.customer_worksite_followups_v814(id) on delete restrict,
  request_id uuid not null,
  actor_staff_user_id uuid not null references public.staff_users(id) on delete restrict,
  exception_key text not null check (exception_key in ('all','older48h','unknownAge','unowned','openEscalations','reviewPast')),
  note_text text not null check (char_length(note_text) between 12 and 500),
  followup_revision integer not null check (followup_revision >= 0),
  recorded_at timestamptz not null default now(),
  unique (actor_staff_user_id,request_id)
);
create index build824_supervisor_notes_followup_history
  on public.customer_worksite_supervisor_notes_v824 (followup_id, recorded_at desc, id desc);
alter table public.customer_worksite_supervisor_notes_v824 enable row level security;
revoke all on public.customer_worksite_supervisor_notes_v824 from public,anon,authenticated,service_role;
grant select,insert on public.customer_worksite_supervisor_notes_v824 to service_role;
comment on table public.customer_worksite_supervisor_notes_v824 is
  'Internal supervisor-only notes from the authenticated Cloudflare operations API. Append-only, no customer access, no outreach or issue closure.';
