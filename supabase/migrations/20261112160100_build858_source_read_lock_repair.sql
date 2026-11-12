-- Build 858 permission correction: preserve source transaction immutability.
-- Service-role has SELECT but intentionally no UPDATE on the original 855 ledger.
create or replace function public.rosie858_append_recovery_custody(
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
  -- Transaction-scoped advisory lock avoids UPDATE grants on the immutable 855 ledger.
  perform pg_advisory_xact_lock(hashtextextended(p_transaction_review_id::text,858));
  if not exists(
    select 1 from public.rosie_master_transaction_review_v855 t
    where t.id=p_transaction_review_id and t.project_id=p_project_id
      and t.booking_id=p_booking_id and t.post_id=p_post_id
      and t.case_reference=p_case_reference and t.incident_reference=p_incident_reference
      and t.transaction_reference=p_transaction_reference
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
