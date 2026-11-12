-- Rosie Dazzlers 858 — durable original-source fresh receipt review, conflict
-- handoff request and owner recovery export. Service-only, append-only, HOLD.
create table public.rosie_recovery_custody_v858 (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  post_id uuid not null references public.social_post_queue(id) on delete restrict,
  transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
  prior_857_readback_id uuid not null references public.rosie_custody_readback_v857(id) on delete restrict,
  case_reference text not null check(case_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'),
  incident_reference text not null check(incident_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'),
  transaction_reference text not null check(transaction_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$'),
  kind text not null check(kind in ('fresh_receipt_recheck','conflict_escalation_handoff','owner_recovery_acceptance_export')),
  plane text check(plane in ('ai-data-platform','rosevear-comms-hub')),
  source_revision text not null check(source_revision ~ '^[a-f0-9]{40}$'),
  receipt_sha256 text check(receipt_sha256 is null or receipt_sha256 ~ '^[a-f0-9]{64}$'),
  receipt_observed_at timestamptz,
  review_digest_sha256 text not null check(review_digest_sha256 ~ '^[a-f0-9]{64}$'),
  review_nonce text not null unique check(review_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
  conflict_aging_status text not null check(conflict_aging_status in
    ('NO_CONFLICTS_RECORDED','OPEN_WITHIN_TARGET','OPEN_ESCALATION_DUE')),
  open_conflict_count integer not null check(open_conflict_count between 0 and 80),
  owner_action text check(owner_action in
    ('maintain_external_hold','request_independent_master_recheck','escalate_unresolved_conflicts')),
  actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
  recorded_at timestamptz not null default clock_timestamp(),
  constraint rosie858_kind_scope check (
    (kind='fresh_receipt_recheck' and plane is not null and receipt_sha256 is not null
      and receipt_observed_at is not null and owner_action is null)
    or (kind='conflict_escalation_handoff' and plane is null and receipt_sha256 is null
      and receipt_observed_at is null and owner_action in
      ('request_independent_master_recheck','escalate_unresolved_conflicts') and open_conflict_count>0)
    or (kind='owner_recovery_acceptance_export' and plane is null and receipt_sha256 is null
      and receipt_observed_at is null and owner_action is not null)),
  constraint rosie858_conflict_truth check(
    (open_conflict_count=0 and conflict_aging_status='NO_CONFLICTS_RECORDED')
    or (open_conflict_count>0 and conflict_aging_status in ('OPEN_WITHIN_TARGET','OPEN_ESCALATION_DUE')))
);
create unique index rosie858_no_receipt_replay
 on public.rosie_recovery_custody_v858(transaction_review_id,plane,receipt_sha256)
 where kind='fresh_receipt_recheck';
create unique index rosie858_single_owner_handoff_or_export
 on public.rosie_recovery_custody_v858(transaction_review_id,kind)
 where kind in ('conflict_escalation_handoff','owner_recovery_acceptance_export');
create index rosie858_owner_custody_history
 on public.rosie_recovery_custody_v858(project_id,recorded_at desc);
create index rosie858_freshness_lookup
 on public.rosie_recovery_custody_v858(transaction_review_id,source_revision,recorded_at desc)
 where kind='fresh_receipt_recheck';
alter table public.rosie_recovery_custody_v858 enable row level security;
revoke all on public.rosie_recovery_custody_v858 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_recovery_custody_v858 to service_role;

create function public.rosie858_reject_rewrite()
returns trigger language plpgsql security invoker set search_path='' as $$
begin raise exception 'Rosie 858 immutable owner custody cannot be rewritten' using errcode='42501'; end;
$$;
revoke all on function public.rosie858_reject_rewrite() from public,anon,authenticated;
create trigger rosie858_immutable_custody
 before update or delete on public.rosie_recovery_custody_v858
 for each row execute function public.rosie858_reject_rewrite();

create function public.rosie858_append_recovery_custody(
 p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
 p_prior_857_readback_id uuid,p_case_reference text,p_incident_reference text,
 p_transaction_reference text,p_kind text,p_plane text,p_source_revision text,
 p_receipt_sha256 text,p_receipt_observed_at timestamptz,p_review_digest_sha256 text,
 p_review_nonce text,p_conflict_aging_status text,p_open_conflict_count integer,
 p_owner_action text,p_actor_staff_email text)
returns table(outcome text,review_id uuid,accepted_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare inserted uuid; stamped timestamptz; actual_conflicts integer; qualifying_planes integer;
begin
  -- Lock original transaction to serialize source-side handoff decisions.
  if not exists(
    select 1 from public.rosie_master_transaction_review_v855 t
    where t.id=p_transaction_review_id and t.project_id=p_project_id
      and t.booking_id=p_booking_id and t.post_id=p_post_id
      and t.case_reference=p_case_reference and t.incident_reference=p_incident_reference
      and t.transaction_reference=p_transaction_reference for update
  ) or not exists(
    select 1 from public.creative_projects p
    where p.id=p_project_id and p.source_booking_id=p_booking_id
      and (p.consent_status<>'approved_public' or p.public_publish_allowed is distinct from true)
  ) or not exists(
    select 1 from public.social_post_queue p
    where p.id=p_post_id and p.booking_id=p_booking_id
  ) or not exists(
    select 1 from public.rosie_custody_readback_v857 r
    where r.id=p_prior_857_readback_id and r.transaction_review_id=p_transaction_review_id
      and r.kind='owner_acceptance_readback'
  ) then raise exception 'Exact revoked original 855/857 booking, source and owner readback required'; end if;
  select count(*)::integer into actual_conflicts
   from public.rosie_delivery_conflict_evidence_v856 e
   where e.transaction_review_id=p_transaction_review_id and e.kind='replay_conflict_review';
  if actual_conflicts>80 or actual_conflicts<>p_open_conflict_count or
    (actual_conflicts=0 and p_conflict_aging_status<>'NO_CONFLICTS_RECORDED') or
    (actual_conflicts>0 and p_conflict_aging_status not in ('OPEN_WITHIN_TARGET','OPEN_ESCALATION_DUE'))
  then raise exception 'Original unresolved conflict source window drift; HOLD'; end if;
  if p_source_revision !~ '^[a-f0-9]{40}$' then
    raise exception 'Exact current source revision required'; end if;

  if p_kind='fresh_receipt_recheck' then
    -- Signature verification occurs in the protected server route; DB admits digest only.
    if p_plane not in ('ai-data-platform','rosevear-comms-hub')
      or p_receipt_sha256 !~ '^[a-f0-9]{64}$' or p_owner_action is not null
      or p_receipt_observed_at is null
      or p_receipt_observed_at < clock_timestamp()-interval '5 minutes'
      or p_receipt_observed_at > clock_timestamp()+interval '5 minutes'
    then raise exception 'Recent scoped independent signed observation required'; end if;
  elsif p_kind in ('conflict_escalation_handoff','owner_recovery_acceptance_export') then
    if p_plane is not null or p_receipt_sha256 is not null or p_receipt_observed_at is not null
      or p_owner_action not in
       ('maintain_external_hold','request_independent_master_recheck','escalate_unresolved_conflicts')
    then raise exception 'Non-authorizing source-only owner recovery review required'; end if;
    select count(distinct plane) into qualifying_planes from public.rosie_recovery_custody_v858 r
      where r.transaction_review_id=p_transaction_review_id
        and r.prior_857_readback_id=p_prior_857_readback_id
        and r.kind='fresh_receipt_recheck' and r.source_revision=p_source_revision
        and r.recorded_at >= clock_timestamp()-interval '5 minutes'
        and r.receipt_observed_at >= clock_timestamp()-interval '5 minutes'
        and r.recorded_at <= clock_timestamp()+interval '5 minutes'
        and r.receipt_observed_at <= clock_timestamp()+interval '5 minutes';
    if qualifying_planes<>2 then raise exception 'Two fresh independent source-bound plane rechecks required'; end if;
    if p_kind='conflict_escalation_handoff' then
      if actual_conflicts=0 or p_owner_action not in
       ('request_independent_master_recheck','escalate_unresolved_conflicts')
      then raise exception 'Open original conflict and bounded owner handoff action required'; end if;
    elsif not exists(select 1 from public.rosie_recovery_custody_v858 h
      where h.transaction_review_id=p_transaction_review_id
        and h.prior_857_readback_id=p_prior_857_readback_id
        and h.kind='conflict_escalation_handoff' and h.source_revision=p_source_revision)
    then raise exception 'Original immutable owner handoff missing; recovery export HOLD'; end if;
  else raise exception 'Unsupported recovery custody action'; end if;

  insert into public.rosie_recovery_custody_v858
    (project_id,booking_id,post_id,transaction_review_id,prior_857_readback_id,
     case_reference,incident_reference,transaction_reference,kind,plane,source_revision,
     receipt_sha256,receipt_observed_at,review_digest_sha256,review_nonce,
     conflict_aging_status,open_conflict_count,owner_action,actor_staff_email)
  values(p_project_id,p_booking_id,p_post_id,p_transaction_review_id,p_prior_857_readback_id,
     p_case_reference,p_incident_reference,p_transaction_reference,p_kind,p_plane,p_source_revision,
     p_receipt_sha256,p_receipt_observed_at,p_review_digest_sha256,p_review_nonce,
     p_conflict_aging_status,p_open_conflict_count,p_owner_action,p_actor_staff_email)
  on conflict do nothing returning id,recorded_at into inserted,stamped;
  if inserted is null then
    return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
  else return query select 'INSERTED'::text,inserted,stamped; end if;
end;
$$;
revoke all on function public.rosie858_append_recovery_custody(
 uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,text,text,timestamptz,
 text,text,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.rosie858_append_recovery_custody(
 uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,text,text,timestamptz,
 text,text,text,integer,text,text) to service_role;
comment on table public.rosie_recovery_custody_v858 is
 'Original source owner-only immutable fresh signed observations, local conflict handoff request and recovery export; external ACK, incident closure and Master CONNECTED are not certified.';
