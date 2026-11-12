-- Rosie Dazzlers Build 857: immutable original-source historical witness revalidation
-- and independent Master owner-acceptance HOLD readback. No external closure grant.
create table public.rosie_custody_readback_v857 (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  post_id uuid not null references public.social_post_queue(id) on delete restrict,
  transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
  case_reference text not null check(case_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'),
  incident_reference text not null check(incident_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'),
  transaction_reference text not null check(transaction_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$'),
  kind text not null check(kind in ('historical_witness_revalidation','owner_acceptance_readback')),
  plane text check(plane in ('ai-data-platform','rosevear-comms-hub')),
  witness_856_id uuid references public.rosie_delivery_conflict_evidence_v856(id) on delete restrict,
  prior_witness_sha256 text check(prior_witness_sha256 is null or prior_witness_sha256 ~ '^[0-9a-f]{64}$'),
  review_digest_sha256 text not null check(review_digest_sha256 ~ '^[0-9a-f]{64}$'),
  review_nonce text not null unique check(review_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
  conflict_aging_status text not null check(conflict_aging_status in
    ('NO_CONFLICTS_RECORDED','OPEN_WITHIN_TARGET','OPEN_ESCALATION_DUE')),
  open_conflict_count integer not null check(open_conflict_count between 0 and 80),
  owner_action text check(owner_action in
    ('maintain_external_hold','request_independent_master_recheck','escalate_unresolved_conflicts')),
  actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
  recorded_at timestamptz not null default clock_timestamp(),
  constraint rosie857_kind_fields check (
    (kind='historical_witness_revalidation' and plane is not null and
      witness_856_id is not null and prior_witness_sha256 is not null and owner_action is null)
    or (kind='owner_acceptance_readback' and plane is null and
      witness_856_id is null and prior_witness_sha256 is null and owner_action is not null)),
  constraint rosie857_no_false_clear check(
    (open_conflict_count=0 and conflict_aging_status='NO_CONFLICTS_RECORDED') or
    (open_conflict_count>0 and conflict_aging_status in ('OPEN_WITHIN_TARGET','OPEN_ESCALATION_DUE')))
);
create unique index rosie857_one_witness_check_per_plane
  on public.rosie_custody_readback_v857(transaction_review_id,plane)
  where kind='historical_witness_revalidation';
create unique index rosie857_one_owner_readback
  on public.rosie_custody_readback_v857(transaction_review_id)
  where kind='owner_acceptance_readback';
create index rosie857_owner_history
  on public.rosie_custody_readback_v857(project_id,recorded_at desc);
alter table public.rosie_custody_readback_v857 enable row level security;
revoke all on public.rosie_custody_readback_v857 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_custody_readback_v857 to service_role;

create function public.rosie857_reject_rewrite()
returns trigger language plpgsql security invoker set search_path='' as $$
begin raise exception 'Rosie 857 original custody and owner readback immutable' using errcode='42501'; end;
$$;
revoke all on function public.rosie857_reject_rewrite() from public,anon,authenticated;
create trigger rosie857_immutable_custody
  before update or delete on public.rosie_custody_readback_v857
  for each row execute function public.rosie857_reject_rewrite();

create function public.rosie857_append_custody_readback(
  p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
  p_case_reference text,p_incident_reference text,p_transaction_reference text,
  p_kind text,p_plane text,p_witness_856_id uuid,p_prior_witness_sha256 text,
  p_review_digest_sha256 text,p_review_nonce text,
  p_conflict_aging_status text,p_open_conflict_count integer,
  p_owner_action text,p_actor_staff_email text)
returns table(outcome text,review_id uuid,accepted_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare inserted uuid; stamped timestamptz; actual_conflicts integer;
begin
  if not exists(select 1 from public.creative_projects p
      where p.id=p_project_id and p.source_booking_id=p_booking_id)
    or not exists(select 1 from public.social_post_queue p
      where p.id=p_post_id and p.booking_id=p_booking_id)
    or not exists(select 1 from public.rosie_master_transaction_review_v855 r
      where r.id=p_transaction_review_id and r.project_id=p_project_id
        and r.booking_id=p_booking_id and r.post_id=p_post_id
        and r.case_reference=p_case_reference and r.incident_reference=p_incident_reference
        and r.transaction_reference=p_transaction_reference)
  then raise exception 'Exact original 855 booking, post and transaction lineage required'; end if;

  select count(*)::integer into actual_conflicts
  from public.rosie_delivery_conflict_evidence_v856 e
  where e.transaction_review_id=p_transaction_review_id and e.kind='replay_conflict_review';
  if actual_conflicts>80 or actual_conflicts<>p_open_conflict_count
    or (actual_conflicts=0 and p_conflict_aging_status<>'NO_CONFLICTS_RECORDED')
    or (actual_conflicts>0 and p_conflict_aging_status not in ('OPEN_WITHIN_TARGET','OPEN_ESCALATION_DUE'))
  then raise exception 'Conflict count/status drift requires renewed source review'; end if;

  if p_kind='historical_witness_revalidation' then
    if p_owner_action is not null or p_plane not in ('ai-data-platform','rosevear-comms-hub')
      or not exists(select 1 from public.rosie_delivery_conflict_evidence_v856 w
        where w.id=p_witness_856_id and w.project_id=p_project_id
          and w.booking_id=p_booking_id and w.post_id=p_post_id
          and w.transaction_review_id=p_transaction_review_id
          and w.case_reference=p_case_reference and w.incident_reference=p_incident_reference
          and w.transaction_reference=p_transaction_reference
          and w.kind='signed_delivery_hold_witness' and w.plane=p_plane
          and w.evidence_sha256=p_prior_witness_sha256)
    then raise exception 'Exact historical independently signed 856 witness lineage required'; end if;
  elsif p_kind='owner_acceptance_readback' then
    if p_plane is not null or p_witness_856_id is not null or p_prior_witness_sha256 is not null
      or p_owner_action not in ('maintain_external_hold','request_independent_master_recheck','escalate_unresolved_conflicts')
      or (select count(distinct plane) from public.rosie_custody_readback_v857 r
          where r.transaction_review_id=p_transaction_review_id
          and r.kind='historical_witness_revalidation')<>2
    then raise exception 'Both local historic signatures and explicit owner HOLD are required'; end if;
  else raise exception 'Unsupported custody/readback action'; end if;

  insert into public.rosie_custody_readback_v857
    (project_id,booking_id,post_id,transaction_review_id,case_reference,incident_reference,
    transaction_reference,kind,plane,witness_856_id,prior_witness_sha256,review_digest_sha256,
    review_nonce,conflict_aging_status,open_conflict_count,owner_action,actor_staff_email)
  values
    (p_project_id,p_booking_id,p_post_id,p_transaction_review_id,p_case_reference,p_incident_reference,
    p_transaction_reference,p_kind,p_plane,p_witness_856_id,p_prior_witness_sha256,p_review_digest_sha256,
    p_review_nonce,p_conflict_aging_status,p_open_conflict_count,p_owner_action,p_actor_staff_email)
  on conflict do nothing returning id,recorded_at into inserted,stamped;
  if inserted is null then
    return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
  else return query select 'INSERTED'::text,inserted,stamped; end if;
end;
$$;
revoke all on function public.rosie857_append_custody_readback(
 uuid,uuid,uuid,uuid,text,text,text,text,text,uuid,text,text,text,text,integer,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie857_append_custody_readback(
 uuid,uuid,uuid,uuid,text,text,text,text,text,uuid,text,text,text,text,integer,text,text)
 to service_role;
comment on table public.rosie_custody_readback_v857 is
 'Historical source-bound independently signed receiver witness revalidation and original owner HOLD acceptance readback only; never an operational Master CONNECTED or incident-closed grant.';
