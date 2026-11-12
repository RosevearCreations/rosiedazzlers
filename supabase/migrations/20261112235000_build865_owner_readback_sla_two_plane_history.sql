-- Rosie 865: immutable original-owner private continuity readback, 24h critical
-- follow-up freshness, and independent two-plane discrepancy HOLD escalation.
-- No receiver activation, external transport, operational ACK or incident closure.
create table public.rosie_owner_readback_v865(
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete restrict,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 post_id uuid not null references public.social_post_queue(id) on delete restrict,
 transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
 owner_exception_860_id uuid not null references public.rosie_external_intake_custody_v860(id) on delete restrict,
 owner_escalation_861_id uuid not null references public.rosie_intake_discrepancy_v861(id) on delete restrict,
 latest_sla_862_id uuid not null references public.rosie_discrepancy_review_v862(id) on delete restrict,
 latest_export_862_id uuid references public.rosie_discrepancy_review_v862(id) on delete restrict,
 latest_critical_863_id uuid references public.rosie_postwitness_hold_v863(id) on delete restrict,
 latest_reconciliation_863_id uuid references public.rosie_postwitness_hold_v863(id) on delete restrict,
 latest_recovery_864_id uuid not null references public.rosie_owner_continuity_v864(id) on delete restrict,
 latest_drift_864_id uuid references public.rosie_owner_continuity_v864(id) on delete restrict,
 latest_export_864_id uuid references public.rosie_owner_continuity_v864(id) on delete restrict,
 kind text not null check(kind in('owner_continuity_snapshot_readback',
   'owner_critical_followup_freshness','owner_two_plane_discrepancy_escalation')),
 review_status text not null check(review_status in(
   'PRIVATE_SNAPSHOT_MATCH_HOLD','MISSING_CRITICAL_FOLLOWUP_HOLD',
   'STALE_CRITICAL_FOLLOWUP_HOLD','CRITICAL_FOLLOWUP_FRESH_REFERENCE_HOLD',
   'MISSING_DISCREPANCY_CUSTODY_HOLD','TWO_PLANE_DISCREPANCY_REVIEW_ONLY_HOLD',
   'MISSING_INDEPENDENT_REFERENCE_HOLD','STALE_TWO_PLANE_REFERENCE_HOLD',
   'TWO_PLANE_REFERENCE_DRIFT_HOLD')),
 source_revision text not null check(source_revision ~ '^[a-f0-9]{40}$'),
 snapshot_sha256 text check(snapshot_sha256 is null or snapshot_sha256 ~ '^[a-f0-9]{64}$'),
 review_digest_sha256 text not null check(review_digest_sha256 ~ '^[a-f0-9]{64}$'),
 review_nonce text not null unique check(review_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
 original_exception_age_hours integer not null check(original_exception_age_hours between 48 and 1000000),
 owner_action text check(owner_action in('maintain_hold','request_fresh_original_owner_sla',
   'escalate_to_independent_custodians')),
 previous_id uuid references public.rosie_owner_readback_v865(id) on delete restrict,
 previous_sha256 text check(previous_sha256 is null or previous_sha256 ~ '^[a-f0-9]{64}$'),
 actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
 recorded_at timestamptz not null default clock_timestamp(),
 constraint rosie865_prior_pair check(
  (previous_id is null and previous_sha256 is null) or
  (previous_id is not null and previous_sha256 is not null)),
 constraint rosie865_kind_shape check(
  (kind='owner_continuity_snapshot_readback' and review_status='PRIVATE_SNAPSHOT_MATCH_HOLD'
   and snapshot_sha256 is not null and latest_export_864_id is not null
   and latest_export_862_id is not null and latest_drift_864_id is not null
   and owner_action is null)
  or (kind='owner_critical_followup_freshness' and snapshot_sha256 is null
   and latest_export_864_id is null and latest_drift_864_id is null
   and latest_export_862_id is null and latest_reconciliation_863_id is null
   and owner_action is not null and review_status in(
    'MISSING_CRITICAL_FOLLOWUP_HOLD','STALE_CRITICAL_FOLLOWUP_HOLD',
    'CRITICAL_FOLLOWUP_FRESH_REFERENCE_HOLD'))
  or (kind='owner_two_plane_discrepancy_escalation' and snapshot_sha256 is null
   and latest_export_864_id is null and latest_export_862_id is not null
   and latest_drift_864_id is not null and latest_reconciliation_863_id is not null
   and owner_action is not null and review_status in(
    'MISSING_DISCREPANCY_CUSTODY_HOLD','TWO_PLANE_DISCREPANCY_REVIEW_ONLY_HOLD',
    'MISSING_INDEPENDENT_REFERENCE_HOLD','STALE_TWO_PLANE_REFERENCE_HOLD',
    'TWO_PLANE_REFERENCE_DRIFT_HOLD'))
 ));
create index rosie865_owner_case_history on public.rosie_owner_readback_v865
 (transaction_review_id,kind,recorded_at desc,id desc);
create index rosie865_immutable_snapshot_index on public.rosie_owner_readback_v865
 (latest_export_864_id,snapshot_sha256)
 where kind='owner_continuity_snapshot_readback';
alter table public.rosie_owner_readback_v865 enable row level security;
revoke all on public.rosie_owner_readback_v865 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_owner_readback_v865 to service_role;
create function public.rosie865_block_rewrite() returns trigger
 language plpgsql security invoker set search_path='' as $$
begin raise exception 'Original Rosie 865 owner HOLD evidence is immutable' using errcode='42501';end $$;
revoke all on function public.rosie865_block_rewrite() from public,anon,authenticated;
create trigger rosie865_immutable before update or delete on public.rosie_owner_readback_v865
 for each row execute function public.rosie865_block_rewrite();

create function public.rosie865_append_owner_hold(
 p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
 p_owner_exception_860_id uuid,p_owner_escalation_861_id uuid,
 p_latest_sla_862_id uuid,p_latest_export_862_id uuid,
 p_latest_critical_863_id uuid,p_latest_reconciliation_863_id uuid,
 p_latest_recovery_864_id uuid,p_latest_drift_864_id uuid,p_latest_export_864_id uuid,
 p_kind text,p_review_status text,p_source_revision text,p_snapshot_sha256 text,
 p_review_digest_sha256 text,p_review_nonce text,p_original_exception_age_hours integer,
 p_owner_action text,p_previous_id uuid,p_previous_sha256 text,p_actor_staff_email text)
 returns table(outcome text,review_id uuid,accepted_at timestamptz)
 language plpgsql security invoker set search_path='' as $$
declare inserted uuid;stamped timestamptz;
 exception_tip uuid;escalation_tip uuid;sla_tip uuid;critical_tip uuid;
 latest_recovery_tip uuid;latest_drift_tip uuid;latest_export_tip uuid;
 latest_private_tip uuid;latest_recon_tip uuid;
 first_exception timestamptz;actual_age integer;expected_status text;
 sla_stamp timestamptz;recovery_stamp timestamptz;critical_stamp timestamptz;
 ai record;comms record;dispute_planes integer;
 drift_status text; drift_rec record;previous_tip uuid;previous_digest text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_transaction_review_id::text,865));
 if not exists(select 1 from public.rosie_master_transaction_review_v855 t
  where t.id=p_transaction_review_id and t.project_id=p_project_id
   and t.booking_id=p_booking_id and t.post_id=p_post_id)
 or not exists(select 1 from public.creative_projects c
  where c.id=p_project_id and c.source_booking_id=p_booking_id
   and (c.consent_status<>'approved_public' or c.public_publish_allowed is distinct from true))
 or not exists(select 1 from public.rosie_delivery_conflict_evidence_v856 c
   where c.transaction_review_id=p_transaction_review_id and c.kind='replay_conflict_review')
 or not exists(select 1 from public.rosie_external_intake_custody_v860 e
   where e.id=p_owner_exception_860_id and e.transaction_review_id=p_transaction_review_id
    and e.kind='owner_continuity_exception_review' and e.project_id=p_project_id)
 or not exists(select 1 from public.rosie_intake_discrepancy_v861 e
   where e.id=p_owner_escalation_861_id and e.transaction_review_id=p_transaction_review_id
    and e.kind='owner_hold_escalation_review' and e.owner_exception_860_id=p_owner_exception_860_id)
 or not exists(select 1 from public.rosie_discrepancy_review_v862 s
   where s.id=p_latest_sla_862_id and s.transaction_review_id=p_transaction_review_id
    and s.kind='owner_aging_sla_recheck' and s.sla_status='CRITICAL_HOLD'
    and s.owner_escalation_861_id=p_owner_escalation_861_id)
 or not exists(select 1 from public.rosie_owner_continuity_v864 r
   where r.id=p_latest_recovery_864_id and r.transaction_review_id=p_transaction_review_id
     and r.kind='owner_critical_recovery_recheck'
     and r.latest_sla_862_id=p_latest_sla_862_id)
 then raise exception 'Original 855–864 revoked consent, open conflict and critical owner HOLD lineage required';end if;
 select e.id into exception_tip from public.rosie_external_intake_custody_v860 e
  where e.transaction_review_id=p_transaction_review_id
   and e.kind='owner_continuity_exception_review'
  order by e.recorded_at desc,e.id desc limit 1;
 select e.recorded_at into first_exception from public.rosie_external_intake_custody_v860 e
  where e.transaction_review_id=p_transaction_review_id
   and e.kind='owner_continuity_exception_review'
  order by e.recorded_at,e.id limit 1;
 select o.id into escalation_tip from public.rosie_intake_discrepancy_v861 o
  where o.transaction_review_id=p_transaction_review_id and o.kind='owner_hold_escalation_review'
  order by o.recorded_at desc,o.id desc limit 1;
 select s.id,s.recorded_at into sla_tip,sla_stamp from public.rosie_discrepancy_review_v862 s
  where s.transaction_review_id=p_transaction_review_id and s.kind='owner_aging_sla_recheck'
  order by s.recorded_at desc,s.id desc limit 1;
 select c.id,c.recorded_at into critical_tip,critical_stamp from public.rosie_postwitness_hold_v863 c
  where c.transaction_review_id=p_transaction_review_id and c.kind='owner_critical_sla_follow_up'
  order by c.recorded_at desc,c.id desc limit 1;
 select r.id,r.recorded_at into latest_recovery_tip,recovery_stamp from public.rosie_owner_continuity_v864 r
  where r.transaction_review_id=p_transaction_review_id and r.kind='owner_critical_recovery_recheck'
  order by r.recorded_at desc,r.id desc limit 1;
 select d.id,d.review_status into latest_drift_tip,drift_status from public.rosie_owner_continuity_v864 d
  where d.transaction_review_id=p_transaction_review_id and d.kind='owner_two_plane_drift_review'
  order by d.recorded_at desc,d.id desc limit 1;
 select e.id into latest_export_tip from public.rosie_owner_continuity_v864 e
  where e.transaction_review_id=p_transaction_review_id and e.kind='owner_incident_continuity_export'
  order by e.recorded_at desc,e.id desc limit 1;
 if exception_tip is distinct from p_owner_exception_860_id or
   escalation_tip is distinct from p_owner_escalation_861_id or
   sla_tip is distinct from p_latest_sla_862_id or
   latest_recovery_tip is distinct from p_latest_recovery_864_id or
   first_exception is null or
   p_source_revision !~ '^[a-f0-9]{40}$' then
   raise exception 'Original 860→864 owner/SLA/recovery custody tip drifted';end if;
 actual_age:=greatest(0,floor(extract(epoch from(clock_timestamp()-first_exception))/3600)::integer);
 if actual_age<48 or p_original_exception_age_hours is null or
    abs(actual_age-p_original_exception_age_hours)>1 then
   raise exception 'Original first 860 exception critical age recheck failed';end if;
 if p_kind='owner_continuity_snapshot_readback' then
  if p_latest_export_864_id is null or p_latest_drift_864_id is null or
   p_latest_export_862_id is null or p_latest_reconciliation_863_id is null or
   p_latest_critical_863_id is null or p_owner_action is not null or
   p_snapshot_sha256 !~ '^[a-f0-9]{64}$' or
   p_review_status<>'PRIVATE_SNAPSHOT_MATCH_HOLD' or
   latest_export_tip is distinct from p_latest_export_864_id or
   latest_drift_tip is distinct from p_latest_drift_864_id or
   critical_tip is distinct from p_latest_critical_863_id or
   not exists(select 1 from public.rosie_owner_continuity_v864 x
    where x.id=p_latest_export_864_id and x.transaction_review_id=p_transaction_review_id
     and x.kind='owner_incident_continuity_export'
     and x.snapshot_sha256=p_snapshot_sha256
     and x.latest_recovery_864_id=p_latest_recovery_864_id
     and x.latest_drift_864_id=p_latest_drift_864_id
     and x.latest_export_862_id=p_latest_export_862_id
     and x.reconciliation_863_id=p_latest_reconciliation_863_id
     and x.critical_followup_863_id=p_latest_critical_863_id)
  then raise exception 'Only exact latest original 864 private snapshot digest and source custody readback';end if;
 elsif p_kind='owner_critical_followup_freshness' then
  if p_snapshot_sha256 is not null or p_latest_export_864_id is not null
   or p_latest_drift_864_id is not null or p_latest_export_862_id is not null
   or p_latest_reconciliation_863_id is not null
   or p_owner_action not in('maintain_hold','request_fresh_original_owner_sla',
     'escalate_to_independent_custodians') or
   critical_tip is distinct from p_latest_critical_863_id or
   (p_latest_critical_863_id is not null and not exists(
     select 1 from public.rosie_postwitness_hold_v863 c
      where c.id=p_latest_critical_863_id and c.kind='owner_critical_sla_follow_up'
       and c.transaction_review_id=p_transaction_review_id
       and c.latest_sla_862_id=p_latest_sla_862_id))
  then raise exception 'Only original owner non-authorizing critical SLA follow-up freshness review';end if;
  expected_status:=case when critical_tip is null then 'MISSING_CRITICAL_FOLLOWUP_HOLD'
   when clock_timestamp()-sla_stamp>=interval '24 hours'
    or clock_timestamp()-recovery_stamp>=interval '24 hours'
    or clock_timestamp()-critical_stamp>=interval '24 hours' then
       'STALE_CRITICAL_FOLLOWUP_HOLD'
   else 'CRITICAL_FOLLOWUP_FRESH_REFERENCE_HOLD' end;
  if p_review_status<>expected_status then
   raise exception 'Independent original 24-hour critical follow-up age changed';end if;
 elsif p_kind='owner_two_plane_discrepancy_escalation' then
  if p_snapshot_sha256 is not null or p_latest_export_864_id is not null
    or p_latest_drift_864_id is null or p_latest_export_862_id is null
    or p_latest_reconciliation_863_id is null or p_latest_critical_863_id is null
    or p_owner_action not in('maintain_hold','request_fresh_original_owner_sla',
       'escalate_to_independent_custodians')
    or latest_drift_tip is distinct from p_latest_drift_864_id
    or critical_tip is distinct from p_latest_critical_863_id
  then raise exception 'Original owner two-plane drift reference required, HOLD only';end if;
  select e.id into latest_private_tip from public.rosie_discrepancy_review_v862 e
   where e.transaction_review_id=p_transaction_review_id and e.kind='master_hold_custody_export'
   order by e.recorded_at desc,e.id desc limit 1;
  select r.id into latest_recon_tip from public.rosie_postwitness_hold_v863 r
   where r.transaction_review_id=p_transaction_review_id and r.kind='owner_post_witness_reconciliation'
   order by r.recorded_at desc,r.id desc limit 1;
  if latest_private_tip is distinct from p_latest_export_862_id or
   latest_recon_tip is distinct from p_latest_reconciliation_863_id or
   not exists(select 1 from public.rosie_owner_continuity_v864 d
    where d.id=p_latest_drift_864_id and d.transaction_review_id=p_transaction_review_id
      and d.kind='owner_two_plane_drift_review'
      and d.latest_export_862_id=p_latest_export_862_id
      and d.reconciliation_863_id=p_latest_reconciliation_863_id
      and d.critical_followup_863_id=p_latest_critical_863_id)
  then raise exception 'Original latest 862/863/864 independent reference pointers changed';end if;
  select count(distinct d.plane) into dispute_planes
   from public.rosie_intake_discrepancy_v861 d
   where d.transaction_review_id=p_transaction_review_id
    and d.kind='signed_external_custodian_discrepancy';
  select r.* into ai from public.rosie_postwitness_hold_v863 r
   where r.transaction_review_id=p_transaction_review_id and
     r.kind='signed_master_hold_export_readback' and r.plane='ai-data-platform'
   order by r.recorded_at desc,r.id desc limit 1;
  select r.* into comms from public.rosie_postwitness_hold_v863 r
   where r.transaction_review_id=p_transaction_review_id and
     r.kind='signed_master_hold_export_readback' and r.plane='rosevear-comms-hub'
   order by r.recorded_at desc,r.id desc limit 1;
  select e.* into drift_rec from public.rosie_discrepancy_review_v862 e
   where e.id=p_latest_export_862_id;
  if ai.id is not null and (ai.export_862_id<>p_latest_export_862_id or
    ai.reconciliation_863_id<>p_latest_reconciliation_863_id or
    ai.critical_followup_863_id<>p_latest_critical_863_id or
    ai.export_snapshot_sha256 is distinct from drift_rec.snapshot_sha256)
   or comms.id is not null and (comms.export_862_id<>p_latest_export_862_id or
    comms.reconciliation_863_id<>p_latest_reconciliation_863_id or
    comms.critical_followup_863_id<>p_latest_critical_863_id or
    comms.export_snapshot_sha256 is distinct from drift_rec.snapshot_sha256)
  then drift_status:='CROSS_MASTER_HASH_DRIFT_HOLD';
  elsif ai.id is null or comms.id is null then
   drift_status:='MISSING_SIGNED_PLANE_HOLD';
  elsif clock_timestamp()-ai.recorded_at>=interval '24 hours' or
    clock_timestamp()-comms.recorded_at>=interval '24 hours' then
   drift_status:='STALE_SIGNED_REFERENCE_HOLD';
  else drift_status:='BOTH_PLANES_HASH_MATCH_HOLD';end if;
  expected_status:=case when dispute_planes<2 then 'MISSING_DISCREPANCY_CUSTODY_HOLD'
    when drift_status='BOTH_PLANES_HASH_MATCH_HOLD'
      then 'TWO_PLANE_DISCREPANCY_REVIEW_ONLY_HOLD'
    when drift_status='MISSING_SIGNED_PLANE_HOLD'
      then 'MISSING_INDEPENDENT_REFERENCE_HOLD'
    when drift_status='STALE_SIGNED_REFERENCE_HOLD'
      then 'STALE_TWO_PLANE_REFERENCE_HOLD'
    else 'TWO_PLANE_REFERENCE_DRIFT_HOLD' end;
  if p_review_status<>expected_status then
   raise exception 'Original independent per-plane discrepancy/HOLD state changed';end if;
 else raise exception 'Unsupported original owner 865 HOLD review kind';end if;
 select r.id,r.review_digest_sha256 into previous_tip,previous_digest
  from public.rosie_owner_readback_v865 r
  where r.transaction_review_id=p_transaction_review_id and r.kind=p_kind
  order by r.recorded_at desc,r.id desc limit 1;
 if previous_tip is distinct from p_previous_id or
  previous_digest is distinct from p_previous_sha256 then
   raise exception 'Original 865 immutable previous owner review tip changed';end if;
 insert into public.rosie_owner_readback_v865(
  project_id,booking_id,post_id,transaction_review_id,owner_exception_860_id,
  owner_escalation_861_id,latest_sla_862_id,latest_export_862_id,
  latest_critical_863_id,latest_reconciliation_863_id,
  latest_recovery_864_id,latest_drift_864_id,latest_export_864_id,
  kind,review_status,source_revision,snapshot_sha256,review_digest_sha256,
  review_nonce,original_exception_age_hours,owner_action,
  previous_id,previous_sha256,actor_staff_email)
 values(p_project_id,p_booking_id,p_post_id,p_transaction_review_id,
  p_owner_exception_860_id,p_owner_escalation_861_id,p_latest_sla_862_id,
  p_latest_export_862_id,p_latest_critical_863_id,p_latest_reconciliation_863_id,
  p_latest_recovery_864_id,p_latest_drift_864_id,p_latest_export_864_id,
  p_kind,p_review_status,p_source_revision,p_snapshot_sha256,p_review_digest_sha256,
  p_review_nonce,p_original_exception_age_hours,p_owner_action,
  p_previous_id,p_previous_sha256,p_actor_staff_email)
 on conflict do nothing returning id,recorded_at into inserted,stamped;
 if inserted is null then return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
 else return query select 'INSERTED'::text,inserted,stamped;end if;
end $$;
revoke all on function public.rosie865_append_owner_hold(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,
 text,text,text,text,text,text,integer,text,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie865_append_owner_hold(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,
 text,text,text,text,text,text,integer,text,uuid,text,text)
 to service_role;
comment on table public.rosie_owner_readback_v865 is
 'Original-owner-only immutable private v864 snapshot hash readback, 24h SLA freshness and 861/863/864 two-plane discrepancy escalation history. NEVER a delivered Master ACK or closed incident.';
