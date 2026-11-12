-- Rosie Dazzlers Build 854 — independent, review-only incident ledger pilot.
-- A unique index, not a prior SELECT, arbitrates concurrent evidence submissions.
-- No provider action, Master transport or global CONNECTED state is granted.
create table public.rosie_incident_atomic_ledger_v854 (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  post_id uuid not null references public.social_post_queue(id) on delete restrict,
  case_reference text not null check(case_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'),
  kind text not null check(kind in ('ledger_snapshot','master_incident_response')),
  receipt_nonce text not null check(receipt_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
  evidence_sha256 text not null check(evidence_sha256 ~ '^[0-9a-f]{64}$'),
  source_revision text not null check(source_revision ~ '^[0-9a-f]{40}$'),
  incident_reference text check(incident_reference is null or incident_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'),
  prior_ledger_sha256 text check(prior_ledger_sha256 is null or prior_ledger_sha256 ~ '^[0-9a-f]{64}$'),
  ledger_sequence bigint not null check(ledger_sequence between 1 and 1000000000000),
  disposition text not null check(disposition in ('signed_snapshot_hold','hold_response_acknowledged','hold_response_recheck_required')),
  sla_target_hours smallint check(sla_target_hours is null or sla_target_hours in (4,12,24,72)),
  sla_due_at timestamptz,
  response_observed_at timestamptz,
  actor_staff_email text not null check(length(actor_staff_email) between 3 and 140),
  recorded_at timestamptz not null default clock_timestamp(),
  constraint rosie854_kind_fields check (
    (kind='ledger_snapshot' and incident_reference is null and prior_ledger_sha256 is null
      and disposition='signed_snapshot_hold' and sla_target_hours is null
      and sla_due_at is null and response_observed_at is null)
    or
    (kind='master_incident_response' and incident_reference is not null
      and prior_ledger_sha256 is not null and disposition in ('hold_response_acknowledged','hold_response_recheck_required')
      and sla_target_hours is not null and sla_due_at is not null and response_observed_at is not null)
  ),
  constraint rosie854_global_nonce_unique unique(kind,receipt_nonce)
);
create unique index rosie854_snapshot_episode_unique
  on public.rosie_incident_atomic_ledger_v854(project_id,case_reference,post_id,ledger_sequence)
  where kind='ledger_snapshot';
create unique index rosie854_master_incident_unique
  on public.rosie_incident_atomic_ledger_v854(project_id,incident_reference)
  where kind='master_incident_response';
create index rosie854_project_read
  on public.rosie_incident_atomic_ledger_v854(project_id,recorded_at desc);

alter table public.rosie_incident_atomic_ledger_v854 enable row level security;
revoke all on public.rosie_incident_atomic_ledger_v854 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_incident_atomic_ledger_v854 to service_role;

create function public.rosie854_deny_ledger_rewrite()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Build 854 incident evidence is append-only' using errcode='42501';
end;
$$;
revoke all on function public.rosie854_deny_ledger_rewrite() from public,anon,authenticated;
create trigger rosie854_immutable_record
before update or delete on public.rosie_incident_atomic_ledger_v854
for each row execute function public.rosie854_deny_ledger_rewrite();

-- PostgREST /rpc invokes this once per database transaction.
-- ON CONFLICT arbitrates simultaneous nonce/episode submissions.
create function public.rosie854_append_evidence(
  p_project_id uuid, p_booking_id uuid, p_post_id uuid, p_case_reference text,
  p_kind text, p_receipt_nonce text, p_evidence_sha256 text, p_source_revision text,
  p_ledger_sequence bigint, p_disposition text, p_actor_staff_email text,
  p_incident_reference text default null, p_prior_ledger_sha256 text default null,
  p_sla_target_hours integer default null, p_sla_due_at timestamptz default null,
  p_response_observed_at timestamptz default null
) returns table(outcome text, ledger_id uuid, accepted_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
declare claimed uuid; claimed_at timestamptz;
begin
  if not exists (select 1 from public.creative_projects p
                  where p.id=p_project_id and p.source_booking_id=p_booking_id)
     or not exists (select 1 from public.social_post_queue s
                  where s.id=p_post_id and s.booking_id=p_booking_id)
  then raise exception 'Build 854 original project/post/booking scope mismatch'; end if;
  if p_actor_staff_email is null or length(p_actor_staff_email) not between 3 and 140
     or p_source_revision !~ '^[0-9a-f]{40}$'
     or p_receipt_nonce !~ '^[A-Za-z0-9_-]{20,100}$'
     or p_evidence_sha256 !~ '^[0-9a-f]{64}$'
     or p_case_reference !~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'
     or p_ledger_sequence not between 1 and 1000000000000
  then raise exception 'Build 854 malformed evidence'; end if;
  insert into public.rosie_incident_atomic_ledger_v854
    (project_id,booking_id,post_id,case_reference,kind,receipt_nonce,evidence_sha256,
     source_revision,ledger_sequence,disposition,actor_staff_email,incident_reference,
     prior_ledger_sha256,sla_target_hours,sla_due_at,response_observed_at)
  values
    (p_project_id,p_booking_id,p_post_id,p_case_reference,p_kind,p_receipt_nonce,p_evidence_sha256,
     p_source_revision,p_ledger_sequence,p_disposition,p_actor_staff_email,p_incident_reference,
     p_prior_ledger_sha256,p_sla_target_hours,p_sla_due_at,p_response_observed_at)
  on conflict do nothing returning id,recorded_at into claimed,claimed_at;
  if claimed is null then
    return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
  else
    return query select 'INSERTED'::text,claimed,claimed_at;
  end if;
end;
$$;
revoke all on function public.rosie854_append_evidence(
 uuid,uuid,uuid,text,text,text,text,text,bigint,text,text,text,text,integer,timestamptz,timestamptz
) from public,anon,authenticated;
grant execute on function public.rosie854_append_evidence(
 uuid,uuid,uuid,text,text,text,text,text,bigint,text,text,text,text,integer,timestamptz,timestamptz
) to service_role;

comment on table public.rosie_incident_atomic_ledger_v854 is
'Rosie Build 854 atomic append-only review pilot; successful INSERT is local database proof only, not verified external Master replay or notification.';
