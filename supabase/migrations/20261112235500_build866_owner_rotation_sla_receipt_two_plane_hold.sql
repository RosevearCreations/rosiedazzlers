-- Rosie Dazzlers 866: original-owner-only immutable private snapshot reference
-- rotation, 863 offline signed receipt correlation and two-plane HOLD recheck.
-- No key material, raw bundle, external transmission, ACK or incident closure.
create table public.rosie_owner_rotation_v866(
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete restrict,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 post_id uuid not null references public.social_post_queue(id) on delete restrict,
 transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
 latest_export_864_id uuid references public.rosie_owner_continuity_v864(id) on delete restrict,
 latest_snapshot_865_id uuid references public.rosie_owner_readback_v865(id) on delete restrict,
 latest_freshness_865_id uuid references public.rosie_owner_readback_v865(id) on delete restrict,
 latest_escalation_865_id uuid references public.rosie_owner_readback_v865(id) on delete restrict,
 latest_drift_864_id uuid references public.rosie_owner_continuity_v864(id) on delete restrict,
 ai_receipt_863_id uuid references public.rosie_postwitness_hold_v863(id) on delete restrict,
 comms_receipt_863_id uuid references public.rosie_postwitness_hold_v863(id) on delete restrict,
 kind text not null check(kind in('owner_private_snapshot_custody_rotation',
  'owner_sla_offline_receipt_correlation','owner_signed_two_plane_exception_recheck')),
 review_status text not null check(review_status in(
  'PRIVATE_CUSTODY_REFERENCE_ROTATED_HOLD',
  'MISSING_OWNER_ESCALATION_RECEIPT_HOLD','MISSING_OFFLINE_SLA_REFERENCE_HOLD',
  'STALE_OFFLINE_SLA_REFERENCE_HOLD','SLA_ESCALATION_REFERENCE_MISMATCH_HOLD',
  'OFFLINE_SLA_REFERENCE_CORRELATED_HOLD',
  'MISSING_SIGNED_TWO_PLANE_REFERENCE_HOLD','STALE_SIGNED_TWO_PLANE_REFERENCE_HOLD',
  'INCONSISTENT_TWO_PLANE_HOLD','SIGNED_TWO_PLANE_REFERENCE_RECHECK_HOLD')),
 review_nonce text not null unique check(review_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
 verified_snapshot_sha256 text check(verified_snapshot_sha256 is null or
  verified_snapshot_sha256 ~ '^[a-f0-9]{64}$'),
 review_digest_sha256 text not null check(review_digest_sha256 ~ '^[a-f0-9]{64}$'),
 source_revision text not null check(source_revision ~ '^[a-f0-9]{40}$'),
 owner_action text not null check(owner_action in(
  'maintain_hold','request_independent_sla_receipt',
  'escalate_independent_two_plane_exception')),
 previous_id uuid references public.rosie_owner_rotation_v866(id) on delete restrict,
 previous_sha256 text check(previous_sha256 is null or previous_sha256 ~ '^[a-f0-9]{64}$'),
 actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
 recorded_at timestamptz not null default clock_timestamp(),
 constraint rosie866_previous_pair check(
  (previous_id is null and previous_sha256 is null) or
  (previous_id is not null and previous_sha256 is not null)),
 constraint rosie866_shape check(
  (kind='owner_private_snapshot_custody_rotation'
   and review_status='PRIVATE_CUSTODY_REFERENCE_ROTATED_HOLD'
   and verified_snapshot_sha256 is not null
   and latest_export_864_id is not null and latest_snapshot_865_id is not null)
  or (kind='owner_sla_offline_receipt_correlation'
   and verified_snapshot_sha256 is null and latest_freshness_865_id is not null)
  or (kind='owner_signed_two_plane_exception_recheck'
   and verified_snapshot_sha256 is null and latest_escalation_865_id is not null
   and latest_drift_864_id is not null))
);
create index rosie866_owner_history on public.rosie_owner_rotation_v866
 (transaction_review_id,kind,recorded_at desc,id desc);
alter table public.rosie_owner_rotation_v866 enable row level security;
revoke all on public.rosie_owner_rotation_v866 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_owner_rotation_v866 to service_role;
create function public.rosie866_immutable() returns trigger
 language plpgsql security invoker set search_path='' as $$
begin raise exception 'Rosie 866 private HOLD history cannot be rewritten' using errcode='42501';end $$;
revoke all on function public.rosie866_immutable() from public,anon,authenticated;
create trigger rosie866_no_rewrite before update or delete on public.rosie_owner_rotation_v866
 for each row execute function public.rosie866_immutable();

create function public.rosie866_append_owner_rotation_hold(
 p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
 p_latest_export_864_id uuid,p_latest_snapshot_865_id uuid,
 p_latest_freshness_865_id uuid,p_latest_escalation_865_id uuid,
 p_latest_drift_864_id uuid,p_ai_receipt_863_id uuid,p_comms_receipt_863_id uuid,
 p_kind text,p_review_status text,p_review_nonce text,p_verified_snapshot_sha256 text,
 p_review_digest_sha256 text,p_source_revision text,p_owner_action text,
 p_previous_id uuid,p_previous_sha256 text,p_actor_staff_email text)
 returns table(outcome text,review_id uuid,accepted_at timestamptz)
 language plpgsql security invoker set search_path='' as $$
declare inserted uuid;stamped timestamptz;
 tip864 uuid;tipSnapshot uuid;tipFresh uuid;tipEsc uuid;tipDrift uuid;
 tipAi uuid;tipComms uuid;oldId uuid;oldSha text;
 source864 record;sourceSnapshot record;sourceFresh record;sourceEsc record;
 sourceDrift record;sourceAi record;sourceComms record;sourceExport862 record;
 expected_status text;inconsistent boolean:=false;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_transaction_review_id::text,866));
 if not exists(select 1 from public.rosie_master_transaction_review_v855 t
  where t.id=p_transaction_review_id and t.project_id=p_project_id
   and t.booking_id=p_booking_id and t.post_id=p_post_id)
 or not exists(select 1 from public.creative_projects c
  where c.id=p_project_id and c.source_booking_id=p_booking_id
   and (c.consent_status<>'approved_public' or
    c.public_publish_allowed is distinct from true))
 or not exists(select 1 from public.rosie_delivery_conflict_evidence_v856 c
  where c.transaction_review_id=p_transaction_review_id
   and c.kind='replay_conflict_review')
 then raise exception 'Original revoked-consent source/open incident not verified';end if;
 select e.* into source864 from public.rosie_owner_continuity_v864 e
  where e.transaction_review_id=p_transaction_review_id
   and e.kind='owner_incident_continuity_export'
  order by e.recorded_at desc,e.id desc limit 1;
 select s.* into sourceSnapshot from public.rosie_owner_readback_v865 s
  where s.transaction_review_id=p_transaction_review_id
   and s.kind='owner_continuity_snapshot_readback'
  order by s.recorded_at desc,s.id desc limit 1;
 select f.* into sourceFresh from public.rosie_owner_readback_v865 f
  where f.transaction_review_id=p_transaction_review_id
   and f.kind='owner_critical_followup_freshness'
  order by f.recorded_at desc,f.id desc limit 1;
 select e.* into sourceEsc from public.rosie_owner_readback_v865 e
  where e.transaction_review_id=p_transaction_review_id
   and e.kind='owner_two_plane_discrepancy_escalation'
  order by e.recorded_at desc,e.id desc limit 1;
 select d.* into sourceDrift from public.rosie_owner_continuity_v864 d
  where d.transaction_review_id=p_transaction_review_id
   and d.kind='owner_two_plane_drift_review'
  order by d.recorded_at desc,d.id desc limit 1;
 select a.* into sourceAi from public.rosie_postwitness_hold_v863 a
  where a.transaction_review_id=p_transaction_review_id
   and a.kind='signed_master_hold_export_readback' and a.plane='ai-data-platform'
  order by a.recorded_at desc,a.id desc limit 1;
 select c.* into sourceComms from public.rosie_postwitness_hold_v863 c
  where c.transaction_review_id=p_transaction_review_id
   and c.kind='signed_master_hold_export_readback' and c.plane='rosevear-comms-hub'
  order by c.recorded_at desc,c.id desc limit 1;
 tip864:=source864.id;tipSnapshot:=sourceSnapshot.id;tipFresh:=sourceFresh.id;
 tipEsc:=sourceEsc.id;tipDrift:=sourceDrift.id;
 tipAi:=sourceAi.id;tipComms:=sourceComms.id;
 if tip864 is distinct from p_latest_export_864_id
 or tipSnapshot is distinct from p_latest_snapshot_865_id
 or tipFresh is distinct from p_latest_freshness_865_id
 or tipEsc is distinct from p_latest_escalation_865_id
 or tipDrift is distinct from p_latest_drift_864_id
 or tipAi is distinct from p_ai_receipt_863_id
 or tipComms is distinct from p_comms_receipt_863_id
 or p_source_revision !~ '^[a-f0-9]{40}$'
 or p_owner_action not in('maintain_hold','request_independent_sla_receipt',
  'escalate_independent_two_plane_exception')
 then raise exception 'Immutable original 863–865 private source moved';end if;
 if p_kind='owner_private_snapshot_custody_rotation' then
  if tip864 is null or tipSnapshot is null or
    sourceSnapshot.review_status<>'PRIVATE_SNAPSHOT_MATCH_HOLD' or
    sourceSnapshot.latest_export_864_id is distinct from tip864 or
    sourceSnapshot.snapshot_sha256 is distinct from source864.snapshot_sha256 or
    p_verified_snapshot_sha256 is distinct from source864.snapshot_sha256
  then raise exception 'Only originally verified 864/865 owner private digest may rotate';end if;
  expected_status:='PRIVATE_CUSTODY_REFERENCE_ROTATED_HOLD';
 elsif p_kind='owner_sla_offline_receipt_correlation' then
  if p_verified_snapshot_sha256 is not null or tipFresh is null or
    sourceFresh.review_status not in('MISSING_CRITICAL_FOLLOWUP_HOLD',
      'STALE_CRITICAL_FOLLOWUP_HOLD','CRITICAL_FOLLOWUP_FRESH_REFERENCE_HOLD')
  then raise exception 'Original current 865 critical owner SLA source required';end if;
  expected_status:=case when tipEsc is null then
    'MISSING_OWNER_ESCALATION_RECEIPT_HOLD'
   when tipAi is null or tipComms is null then
    'MISSING_OFFLINE_SLA_REFERENCE_HOLD'
   when clock_timestamp()-sourceAi.recorded_at>=interval '24 hours'
     or clock_timestamp()-sourceComms.recorded_at>=interval '24 hours'
    then 'STALE_OFFLINE_SLA_REFERENCE_HOLD'
   when sourceFresh.review_status<>'CRITICAL_FOLLOWUP_FRESH_REFERENCE_HOLD'
    then 'SLA_ESCALATION_REFERENCE_MISMATCH_HOLD'
   else 'OFFLINE_SLA_REFERENCE_CORRELATED_HOLD' end;
 elsif p_kind='owner_signed_two_plane_exception_recheck' then
  if p_verified_snapshot_sha256 is not null or tipEsc is null or tipDrift is null
  then raise exception 'Original signed two-plane 864/865 HOLD evidence required';end if;
  if tipAi is not null or tipComms is not null then
   select s.* into sourceExport862 from public.rosie_discrepancy_review_v862 s
    where s.id=sourceDrift.latest_export_862_id;
   inconsistent:=sourceExport862.id is null or
    (tipAi is not null and (
      sourceAi.export_862_id is distinct from sourceDrift.latest_export_862_id
      or sourceAi.reconciliation_863_id is distinct from sourceDrift.reconciliation_863_id
      or sourceAi.critical_followup_863_id is distinct from sourceDrift.critical_followup_863_id
      or sourceAi.export_snapshot_sha256 is distinct from sourceExport862.snapshot_sha256))
    or (tipComms is not null and (
      sourceComms.export_862_id is distinct from sourceDrift.latest_export_862_id
      or sourceComms.reconciliation_863_id is distinct from sourceDrift.reconciliation_863_id
      or sourceComms.critical_followup_863_id is distinct from sourceDrift.critical_followup_863_id
      or sourceComms.export_snapshot_sha256 is distinct from sourceExport862.snapshot_sha256));
  end if;
  expected_status:=case when tipAi is null or tipComms is null then
    'MISSING_SIGNED_TWO_PLANE_REFERENCE_HOLD'
   when inconsistent then 'INCONSISTENT_TWO_PLANE_HOLD'
   when clock_timestamp()-sourceAi.recorded_at>=interval '24 hours'
     or clock_timestamp()-sourceComms.recorded_at>=interval '24 hours'
    then 'STALE_SIGNED_TWO_PLANE_REFERENCE_HOLD'
   when sourceEsc.review_status<>'TWO_PLANE_DISCREPANCY_REVIEW_ONLY_HOLD'
    then 'INCONSISTENT_TWO_PLANE_HOLD'
   else 'SIGNED_TWO_PLANE_REFERENCE_RECHECK_HOLD' end;
 else raise exception 'Unsupported original owner rotation kind';end if;
 if expected_status is distinct from p_review_status then
  raise exception 'Independent 866 original source status changed';end if;
 select r.id,r.review_digest_sha256 into oldId,oldSha
  from public.rosie_owner_rotation_v866 r
  where r.transaction_review_id=p_transaction_review_id and r.kind=p_kind
  order by r.recorded_at desc,r.id desc limit 1;
 if oldId is distinct from p_previous_id or
  oldSha is distinct from p_previous_sha256 then
  raise exception 'Immutable owner custody rotation predecessor drift';end if;
 insert into public.rosie_owner_rotation_v866(
  project_id,booking_id,post_id,transaction_review_id,
  latest_export_864_id,latest_snapshot_865_id,latest_freshness_865_id,
  latest_escalation_865_id,latest_drift_864_id,ai_receipt_863_id,
  comms_receipt_863_id,kind,review_status,review_nonce,
  verified_snapshot_sha256,review_digest_sha256,source_revision,
  owner_action,previous_id,previous_sha256,actor_staff_email)
 values(p_project_id,p_booking_id,p_post_id,p_transaction_review_id,
  p_latest_export_864_id,p_latest_snapshot_865_id,p_latest_freshness_865_id,
  p_latest_escalation_865_id,p_latest_drift_864_id,p_ai_receipt_863_id,
  p_comms_receipt_863_id,p_kind,p_review_status,p_review_nonce,
  p_verified_snapshot_sha256,p_review_digest_sha256,p_source_revision,
  p_owner_action,p_previous_id,p_previous_sha256,p_actor_staff_email)
 on conflict do nothing returning id,recorded_at into inserted,stamped;
 if inserted is null then
  return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
 else
  return query select 'INSERTED'::text,inserted,stamped;
 end if;
end $$;
revoke all on function public.rosie866_append_owner_rotation_hold(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,
 text,text,text,text,text,text,text,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie866_append_owner_rotation_hold(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,
 text,text,text,text,text,text,text,uuid,text,text)
 to service_role;
comment on table public.rosie_owner_rotation_v866 is
 'Original Rosie owner immutable private snapshot reference rotation / offline signed HOLD receipt recheck. No key rotation, live receiver ACK or incident closure.';
