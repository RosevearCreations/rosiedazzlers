-- Rosie Dazzlers Build 855: original-owner cross-plane transaction replay PILOT.
-- One local Postgres transaction records the two signed review digests and owner HOLD.
-- This never proves an independent remote Master COMMIT, message delivery or closure.
create table public.rosie_master_transaction_review_v855 (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  post_id uuid not null references public.social_post_queue(id) on delete restrict,
  original_owner_audit_id uuid not null references public.creative_project_audit(id) on delete restrict,
  source_854_response_id uuid not null references public.rosie_incident_atomic_ledger_v854(id) on delete restrict,
  source_854_response_sha256 text not null check (source_854_response_sha256 ~ '^[0-9a-f]{64}$'),
  case_reference text not null check (case_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'),
  incident_reference text not null check (incident_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'),
  transaction_reference text not null unique check (transaction_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$'),
  source_revision text not null check (source_revision ~ '^[0-9a-f]{40}$'),
  ai_data_nonce text not null unique check (ai_data_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
  comms_nonce text not null unique check (comms_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
  ai_data_sha256 text not null check (ai_data_sha256 ~ '^[0-9a-f]{64}$'),
  comms_sha256 text not null check (comms_sha256 ~ '^[0-9a-f]{64}$'),
  ai_data_observed_at timestamptz not null,
  comms_observed_at timestamptz not null,
  source_sla_due_at timestamptz not null,
  sla_review_status text not null check(sla_review_status in ('SIGNED_OBSERVATIONS_WITHIN_TARGET','SIGNED_OBSERVATION_AFTER_TARGET')),
  owner_review_decision text not null check(owner_review_decision in ('accept_cross_plane_review_only','maintain_external_hold')),
  actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
  recorded_at timestamptz not null default clock_timestamp(),
  constraint rosie855_unique_incident_review unique(project_id,incident_reference),
  constraint rosie855_distinct_plane_nonce check(ai_data_nonce<>comms_nonce),
  constraint rosie855_distinct_plane_digest check(ai_data_sha256<>comms_sha256)
);
create index rosie855_history on public.rosie_master_transaction_review_v855(project_id,recorded_at desc);
alter table public.rosie_master_transaction_review_v855 enable row level security;
revoke all on public.rosie_master_transaction_review_v855 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_master_transaction_review_v855 to service_role;

create function public.rosie855_deny_rewrite()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  raise exception 'Build 855 owner transaction review is immutable' using errcode='42501';
end;
$$;
revoke all on function public.rosie855_deny_rewrite() from public,anon,authenticated;
create trigger rosie855_immutable_review
before update or delete on public.rosie_master_transaction_review_v855
for each row execute function public.rosie855_deny_rewrite();

-- Atomic insert: constraint violation/replay returns one rejection, not an overwrite.
-- Database enforces lineage to original Rosie booking/project/post and 854 receipt.
create function public.rosie855_record_transaction_review(
  p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_owner_audit_id uuid,
  p_source_854_response_id uuid,p_source_854_response_sha256 text,
  p_case_reference text,p_incident_reference text,p_transaction_reference text,
  p_source_revision text,p_ai_data_nonce text,p_comms_nonce text,
  p_ai_data_sha256 text,p_comms_sha256 text,
  p_ai_data_observed_at timestamptz,p_comms_observed_at timestamptz,
  p_source_sla_due_at timestamptz,p_sla_review_status text,
  p_owner_review_decision text,p_actor_staff_email text
) returns table(outcome text,review_id uuid,accepted_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare inserted uuid; stamped timestamptz;
begin
  if not exists(select 1 from public.creative_projects p
    where p.id=p_project_id and p.source_booking_id=p_booking_id)
    or not exists(select 1 from public.social_post_queue s
    where s.id=p_post_id and s.booking_id=p_booking_id)
    or not exists(select 1 from public.creative_project_audit a
    where a.id=p_owner_audit_id and a.project_id=p_project_id
      and a.safe_note like 'Build 853 original owner incident decision:%')
  then raise exception 'Original booking, post and owner incident audit lineage required'; end if;
  if not exists(select 1 from public.rosie_incident_atomic_ledger_v854 l
    where l.id=p_source_854_response_id and l.project_id=p_project_id
      and l.booking_id=p_booking_id and l.post_id=p_post_id
      and l.case_reference=p_case_reference and l.incident_reference=p_incident_reference
      and l.kind='master_incident_response'
      and l.evidence_sha256=p_source_854_response_sha256
      and l.sla_due_at=p_source_sla_due_at
      and l.disposition in ('hold_response_acknowledged','hold_response_recheck_required'))
  then raise exception 'Exact previous 854 atomic Master HOLD response required'; end if;
  if p_source_revision !~ '^[0-9a-f]{40}$'
     or p_actor_staff_email is null or char_length(p_actor_staff_email) not between 3 and 140
  then raise exception 'Malformed 855 review'; end if;
  insert into public.rosie_master_transaction_review_v855
    (project_id,booking_id,post_id,original_owner_audit_id,source_854_response_id,
    source_854_response_sha256,case_reference,incident_reference,transaction_reference,
    source_revision,ai_data_nonce,comms_nonce,ai_data_sha256,comms_sha256,
    ai_data_observed_at,comms_observed_at,source_sla_due_at,sla_review_status,
    owner_review_decision,actor_staff_email)
  values
    (p_project_id,p_booking_id,p_post_id,p_owner_audit_id,p_source_854_response_id,
    p_source_854_response_sha256,p_case_reference,p_incident_reference,p_transaction_reference,
    p_source_revision,p_ai_data_nonce,p_comms_nonce,p_ai_data_sha256,p_comms_sha256,
    p_ai_data_observed_at,p_comms_observed_at,p_source_sla_due_at,p_sla_review_status,
    p_owner_review_decision,p_actor_staff_email)
  on conflict do nothing returning id,recorded_at into inserted,stamped;
  if inserted is null then
    return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
  else
    return query select 'INSERTED'::text,inserted,stamped;
  end if;
end;
$$;
revoke all on function public.rosie855_record_transaction_review(
 uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,text,text,text,text,
 timestamptz,timestamptz,timestamptz,text,text,text
) from public,anon,authenticated;
grant execute on function public.rosie855_record_transaction_review(
 uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,text,text,text,text,
 timestamptz,timestamptz,timestamptz,text,text,text
) to service_role;
comment on table public.rosie_master_transaction_review_v855 is
  'Build 855 one-database atomic signed review of AI Data and Comms observations; external distributed transaction, delivery and owner operational closure not independently verified.';
