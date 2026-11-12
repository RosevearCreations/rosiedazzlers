-- Rosie 867: private source-only audit; never an operational Master receipt.
create table public.rosie_owner_history_v867(
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete restrict,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 post_id uuid not null references public.social_post_queue(id) on delete restrict,
 transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
 latest_rotation_866_id uuid references public.rosie_owner_rotation_v866(id) on delete restrict,
 latest_correlation_866_id uuid references public.rosie_owner_rotation_v866(id) on delete restrict,
 latest_recheck_866_id uuid references public.rosie_owner_rotation_v866(id) on delete restrict,
 ai_reference_863_id uuid references public.rosie_postwitness_hold_v863(id) on delete restrict,
 comms_reference_863_id uuid references public.rosie_postwitness_hold_v863(id) on delete restrict,
 kind text not null check(kind in('owner_signed_custody_renewal_aging',
  'owner_independent_plane_receipt_exception_route','owner_hold_history_retention_audit')),
 plane text check(plane in('ai-data-platform','rosevear-comms-hub')),
 review_status text not null check(review_status in(
  'MISSING_OWNER_CUSTODY_RENEWAL_HOLD','MISSING_OR_STALE_SIGNED_REFERENCE_HOLD',
  'OVERDUE_OWNER_CUSTODY_RENEWAL_HOLD','OWNER_CUSTODY_RENEWAL_DUE_HOLD',
  'CURRENT_OWNER_CUSTODY_REFERENCE_HOLD','MISSING_PLANE_RECEIPT_REFERENCE_HOLD',
  'STALE_PLANE_RECEIPT_REFERENCE_HOLD','DISPUTED_PLANE_RECEIPT_REFERENCE_HOLD',
  'OFFLINE_PLANE_EXCEPTION_REVIEW_ONLY_HOLD',
  'BROKEN_OWNER_HOLD_RETENTION_CHAIN_HOLD','MISSING_OWNER_HOLD_HISTORY_HOLD',
  'COMPLETE_LOCAL_OWNER_HOLD_HISTORY_REFERENCE_HOLD')),
 review_nonce text not null unique check(review_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
 review_digest_sha256 text not null check(review_digest_sha256 ~ '^[a-f0-9]{64}$'),
 source_revision text not null check(source_revision ~ '^[a-f0-9]{40}$'),
 owner_action text not null check(owner_action in('maintain_hold',
  'request_fresh_custody_witness','route_offline_exception_for_independent_review')),
 previous_id uuid references public.rosie_owner_history_v867(id) on delete restrict,
 previous_sha256 text check(previous_sha256 is null or previous_sha256 ~ '^[a-f0-9]{64}$'),
 actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
 recorded_at timestamptz not null default clock_timestamp(),
 constraint rosie867_prior_pair check((previous_id is null and previous_sha256 is null)
  or(previous_id is not null and previous_sha256 is not null)),
 constraint rosie867_shape check(
  (kind='owner_independent_plane_receipt_exception_route' and plane is not null
   and latest_correlation_866_id is not null and latest_recheck_866_id is not null
   and review_status in('MISSING_PLANE_RECEIPT_REFERENCE_HOLD',
    'STALE_PLANE_RECEIPT_REFERENCE_HOLD','DISPUTED_PLANE_RECEIPT_REFERENCE_HOLD',
    'OFFLINE_PLANE_EXCEPTION_REVIEW_ONLY_HOLD'))
  or (kind='owner_signed_custody_renewal_aging' and plane is null
   and review_status in('MISSING_OWNER_CUSTODY_RENEWAL_HOLD',
    'MISSING_OR_STALE_SIGNED_REFERENCE_HOLD','OVERDUE_OWNER_CUSTODY_RENEWAL_HOLD',
    'OWNER_CUSTODY_RENEWAL_DUE_HOLD','CURRENT_OWNER_CUSTODY_REFERENCE_HOLD'))
  or (kind='owner_hold_history_retention_audit' and plane is null
   and review_status in('BROKEN_OWNER_HOLD_RETENTION_CHAIN_HOLD',
    'MISSING_OWNER_HOLD_HISTORY_HOLD','COMPLETE_LOCAL_OWNER_HOLD_HISTORY_REFERENCE_HOLD')))
);
create index rosie867_owner_audit_history on public.rosie_owner_history_v867
 (transaction_review_id,kind,plane,recorded_at desc,id desc);
alter table public.rosie_owner_history_v867 enable row level security;
revoke all on public.rosie_owner_history_v867 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_owner_history_v867 to service_role;
create function public.rosie867_no_rewrite() returns trigger
 language plpgsql security invoker set search_path='' as $$
begin raise exception 'Original Rosie 867 HOLD custody audit immutable' using errcode='42501';end $$;
revoke all on function public.rosie867_no_rewrite() from public,anon,authenticated;
create trigger rosie867_immutable before update or delete on public.rosie_owner_history_v867
 for each row execute function public.rosie867_no_rewrite();

create function public.rosie867_append_private_hold(
 p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
 p_latest_rotation_866_id uuid,p_latest_correlation_866_id uuid,
 p_latest_recheck_866_id uuid,p_ai_reference_863_id uuid,
 p_comms_reference_863_id uuid,p_kind text,p_plane text,p_review_status text,
 p_review_nonce text,p_review_digest_sha256 text,p_source_revision text,
 p_owner_action text,p_previous_id uuid,p_previous_sha256 text,
 p_actor_staff_email text)
 returns table(outcome text,review_id uuid,accepted_at timestamptz)
 language plpgsql security invoker set search_path='' as $$
declare tipRotation record;tipCorrelation record;tipRecheck record;
 refAi record;refComms record;chosen record;
 previousTip uuid;previousDigest text;resultId uuid;resultAt timestamptz;
 expected_status text;ageHours integer;missingCount integer;brokenCount integer;
 historyMax integer;firstStatus text;oldKind text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_transaction_review_id::text,867));
 if not exists(select 1 from public.rosie_master_transaction_review_v855 t
  where t.id=p_transaction_review_id and t.project_id=p_project_id
   and t.booking_id=p_booking_id and t.post_id=p_post_id)
 or not exists(select 1 from public.creative_projects c
  where c.id=p_project_id and c.source_booking_id=p_booking_id
   and (c.consent_status<>'approved_public' or
     c.public_publish_allowed is distinct from true))
 or not exists(select 1 from public.rosie_delivery_conflict_evidence_v856 c
  where c.transaction_review_id=p_transaction_review_id and c.kind='replay_conflict_review')
 then raise exception 'Protected original Rosie incident and revoked consent required';end if;
 select r.* into tipRotation from public.rosie_owner_rotation_v866 r
  where r.transaction_review_id=p_transaction_review_id
   and r.kind='owner_private_snapshot_custody_rotation'
  order by r.recorded_at desc,r.id desc limit 1;
 select r.* into tipCorrelation from public.rosie_owner_rotation_v866 r
  where r.transaction_review_id=p_transaction_review_id
   and r.kind='owner_sla_offline_receipt_correlation'
  order by r.recorded_at desc,r.id desc limit 1;
 select r.* into tipRecheck from public.rosie_owner_rotation_v866 r
  where r.transaction_review_id=p_transaction_review_id
   and r.kind='owner_signed_two_plane_exception_recheck'
  order by r.recorded_at desc,r.id desc limit 1;
 select r.* into refAi from public.rosie_postwitness_hold_v863 r
  where r.transaction_review_id=p_transaction_review_id
    and r.kind='signed_master_hold_export_readback' and r.plane='ai-data-platform'
  order by r.recorded_at desc,r.id desc limit 1;
 select r.* into refComms from public.rosie_postwitness_hold_v863 r
  where r.transaction_review_id=p_transaction_review_id
    and r.kind='signed_master_hold_export_readback' and r.plane='rosevear-comms-hub'
  order by r.recorded_at desc,r.id desc limit 1;
 if tipRotation.id is distinct from p_latest_rotation_866_id
  or tipCorrelation.id is distinct from p_latest_correlation_866_id
  or tipRecheck.id is distinct from p_latest_recheck_866_id
  or refAi.id is distinct from p_ai_reference_863_id
  or refComms.id is distinct from p_comms_reference_863_id
  or p_source_revision !~ '^[a-f0-9]{40}$'
  or p_owner_action not in('maintain_hold','request_fresh_custody_witness',
   'route_offline_exception_for_independent_review')
 then raise exception 'Original protected independent 863/866 source moved';end if;
 if p_kind='owner_signed_custody_renewal_aging' then
  if p_plane is not null then raise exception 'Renewal aging is not per-plane dispatch';end if;
  expected_status:=case when tipRotation.id is null then 'MISSING_OWNER_CUSTODY_RENEWAL_HOLD'
    when refAi.id is null or refComms.id is null
      or refAi.signer_id is null or refComms.signer_id is null
      or clock_timestamp()-refAi.recorded_at>=interval '24 hours'
      or clock_timestamp()-refComms.recorded_at>=interval '24 hours'
      then 'MISSING_OR_STALE_SIGNED_REFERENCE_HOLD'
    when clock_timestamp()-tipRotation.recorded_at>=interval '48 hours'
      then 'OVERDUE_OWNER_CUSTODY_RENEWAL_HOLD'
    when clock_timestamp()-tipRotation.recorded_at>=interval '24 hours'
      then 'OWNER_CUSTODY_RENEWAL_DUE_HOLD'
    else 'CURRENT_OWNER_CUSTODY_REFERENCE_HOLD' end;
 elsif p_kind='owner_independent_plane_receipt_exception_route' then
  if p_plane not in('ai-data-platform','rosevear-comms-hub') or
    tipCorrelation.id is null or tipRecheck.id is null then
    raise exception 'Original distinct plane and independent 866 HOLD reviews required';end if;
  if p_plane='ai-data-platform' then chosen:=refAi;else chosen:=refComms;end if;
  expected_status:=case when chosen.id is null then
     'MISSING_PLANE_RECEIPT_REFERENCE_HOLD'
   when clock_timestamp()-chosen.recorded_at>=interval '24 hours'
     then 'STALE_PLANE_RECEIPT_REFERENCE_HOLD'
   when tipCorrelation.review_status<>'OFFLINE_SLA_REFERENCE_CORRELATED_HOLD'
    or tipRecheck.review_status<>'SIGNED_TWO_PLANE_REFERENCE_RECHECK_HOLD'
     then 'DISPUTED_PLANE_RECEIPT_REFERENCE_HOLD'
   else 'OFFLINE_PLANE_EXCEPTION_REVIEW_ONLY_HOLD' end;
 elsif p_kind='owner_hold_history_retention_audit' then
  if p_plane is not null then raise exception 'Retention audit is local, not transmitted';end if;
  select count(*) filter(where cnt=0),
    count(*) filter(where broken>0),
    coalesce(max(cnt),0)
   into missingCount,brokenCount,historyMax
   from (
    select kind,count(*) as cnt,coalesce(sum(
      case when previous_id is distinct from next_id or
                previous_sha256 is distinct from next_digest then 1 else 0 end),0) as broken
    from (
      select kind,previous_id,previous_sha256,
        lead(id) over(partition by kind order by recorded_at desc,id desc) as next_id,
        lead(review_digest_sha256) over(partition by kind order by recorded_at desc,id desc) as next_digest
      from public.rosie_owner_rotation_v866
      where transaction_review_id=p_transaction_review_id
        and kind in('owner_private_snapshot_custody_rotation',
         'owner_sla_offline_receipt_correlation','owner_signed_two_plane_exception_recheck')
    ) s group by kind
   ) summary;
  select count(*) into missingCount from (values
   ('owner_private_snapshot_custody_rotation'),
   ('owner_sla_offline_receipt_correlation'),
   ('owner_signed_two_plane_exception_recheck')) as k(kind)
   where not exists(select 1 from public.rosie_owner_rotation_v866 r
    where r.transaction_review_id=p_transaction_review_id and r.kind=k.kind);
  expected_status:=case when historyMax>=25 or brokenCount>0
     then 'BROKEN_OWNER_HOLD_RETENTION_CHAIN_HOLD'
    when missingCount>0 then 'MISSING_OWNER_HOLD_HISTORY_HOLD'
    else 'COMPLETE_LOCAL_OWNER_HOLD_HISTORY_REFERENCE_HOLD' end;
 else raise exception 'Unsupported original 867 audit kind';end if;
 if p_review_status is distinct from expected_status then
   raise exception 'Original independent 867 source age/retention audit changed';end if;
 select r.id,r.review_digest_sha256 into previousTip,previousDigest
 from public.rosie_owner_history_v867 r
 where r.transaction_review_id=p_transaction_review_id
   and r.kind=p_kind and r.plane is not distinct from p_plane
 order by r.recorded_at desc,r.id desc limit 1;
 if previousTip is distinct from p_previous_id or
   previousDigest is distinct from p_previous_sha256
 then raise exception 'Original owner previous audit digest changed';end if;
 insert into public.rosie_owner_history_v867(
 project_id,booking_id,post_id,transaction_review_id,
 latest_rotation_866_id,latest_correlation_866_id,latest_recheck_866_id,
 ai_reference_863_id,comms_reference_863_id,
 kind,plane,review_status,review_nonce,review_digest_sha256,source_revision,
 owner_action,previous_id,previous_sha256,actor_staff_email)
 values(p_project_id,p_booking_id,p_post_id,p_transaction_review_id,
 p_latest_rotation_866_id,p_latest_correlation_866_id,p_latest_recheck_866_id,
 p_ai_reference_863_id,p_comms_reference_863_id,
 p_kind,p_plane,p_review_status,p_review_nonce,p_review_digest_sha256,p_source_revision,
 p_owner_action,p_previous_id,p_previous_sha256,p_actor_staff_email)
 on conflict do nothing returning id,recorded_at into resultId,resultAt;
 if resultId is null then
  return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
 else return query select 'INSERTED'::text,resultId,resultAt;end if;
end $$;
revoke all on function public.rosie867_append_private_hold(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,text,
 text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.rosie867_append_private_hold(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,text,
 text,uuid,text,text) to service_role;
comment on table public.rosie_owner_history_v867 is
 'Immutable original owner HOLD only renewal age, offline independent exception route and historical metadata audit; no signed renewal claim, independent ACK or deletion.';
