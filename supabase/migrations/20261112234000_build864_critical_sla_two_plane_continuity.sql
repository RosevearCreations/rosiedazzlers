-- Rosie 864: original owner critical-recovery recheck, per-plane *signed claim*
-- drift monitor and private chained continuity snapshot. No external delivery.
create table public.rosie_owner_continuity_v864(
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete restrict,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 post_id uuid not null references public.social_post_queue(id) on delete restrict,
 transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
 owner_exception_860_id uuid not null references public.rosie_external_intake_custody_v860(id) on delete restrict,
 owner_escalation_861_id uuid not null references public.rosie_intake_discrepancy_v861(id) on delete restrict,
 latest_sla_862_id uuid not null references public.rosie_discrepancy_review_v862(id) on delete restrict,
 latest_export_862_id uuid references public.rosie_discrepancy_review_v862(id) on delete restrict,
 reconciliation_863_id uuid references public.rosie_postwitness_hold_v863(id) on delete restrict,
 critical_followup_863_id uuid references public.rosie_postwitness_hold_v863(id) on delete restrict,
 latest_recovery_864_id uuid references public.rosie_owner_continuity_v864(id) on delete restrict,
 latest_drift_864_id uuid references public.rosie_owner_continuity_v864(id) on delete restrict,
 kind text not null check(kind in('owner_critical_recovery_recheck',
   'owner_two_plane_drift_review','owner_incident_continuity_export')),
 review_status text not null check(review_status in(
   'MISSING_FOLLOWUP_HOLD','STALE_CRITICAL_RECHECK_HOLD','CRITICAL_RECOVERY_RECHECK_HOLD',
   'CROSS_MASTER_HASH_DRIFT_HOLD','MISSING_SIGNED_PLANE_HOLD',
   'STALE_SIGNED_REFERENCE_HOLD','BOTH_PLANES_HASH_MATCH_HOLD',
   'PRIVATE_ORIGINAL_OWNER_CONTINUITY_HOLD')),
 source_revision text not null check(source_revision ~ '^[a-f0-9]{40}$'),
 review_digest_sha256 text not null check(review_digest_sha256 ~ '^[a-f0-9]{64}$'),
 review_nonce text not null unique check(review_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
 snapshot_sha256 text check(snapshot_sha256 is null or snapshot_sha256 ~ '^[a-f0-9]{64}$'),
 original_exception_age_hours integer not null check(original_exception_age_hours between 48 and 1000000),
 owner_action text check(owner_action in('maintain_hold',
   'request_fresh_independent_master_references','escalate_owner_critical_sla_breach')),
 previous_id uuid references public.rosie_owner_continuity_v864(id) on delete restrict,
 previous_sha256 text check(previous_sha256 is null or previous_sha256 ~ '^[a-f0-9]{64}$'),
 previous_export_id uuid references public.rosie_owner_continuity_v864(id) on delete restrict,
 previous_export_sha256 text check(previous_export_sha256 is null or previous_export_sha256 ~ '^[a-f0-9]{64}$'),
 actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
 recorded_at timestamptz not null default clock_timestamp(),
 constraint rosie864_previous_pair check(
   (previous_id is null and previous_sha256 is null) or
   (previous_id is not null and previous_sha256 is not null)),
 constraint rosie864_previous_export_pair check(
   (previous_export_id is null and previous_export_sha256 is null) or
   (previous_export_id is not null and previous_export_sha256 is not null)),
 constraint rosie864_kind_shape check(
   (kind='owner_critical_recovery_recheck' and owner_action is not null
    and snapshot_sha256 is null and latest_export_862_id is null
    and reconciliation_863_id is null and latest_recovery_864_id is null
    and latest_drift_864_id is null and previous_export_id is null
    and previous_export_sha256 is null
    and review_status in('MISSING_FOLLOWUP_HOLD','STALE_CRITICAL_RECHECK_HOLD',
      'CRITICAL_RECOVERY_RECHECK_HOLD'))
   or (kind='owner_two_plane_drift_review' and owner_action is null
    and snapshot_sha256 is null and latest_export_862_id is not null
    and reconciliation_863_id is not null and critical_followup_863_id is not null
    and latest_recovery_864_id is null and latest_drift_864_id is null
    and previous_export_id is null and previous_export_sha256 is null
    and review_status in('CROSS_MASTER_HASH_DRIFT_HOLD','MISSING_SIGNED_PLANE_HOLD',
     'STALE_SIGNED_REFERENCE_HOLD','BOTH_PLANES_HASH_MATCH_HOLD'))
   or (kind='owner_incident_continuity_export' and owner_action is null
    and snapshot_sha256 is not null and latest_export_862_id is not null
    and reconciliation_863_id is not null and critical_followup_863_id is not null
    and latest_recovery_864_id is not null and latest_drift_864_id is not null
    and previous_id is not null and previous_sha256 is not null
    and review_status='PRIVATE_ORIGINAL_OWNER_CONTINUITY_HOLD'))
);
create index rosie864_immutable_case_history on public.rosie_owner_continuity_v864
 (transaction_review_id,kind,recorded_at desc);
create unique index rosie864_continuity_snapshot_replay on public.rosie_owner_continuity_v864
 (transaction_review_id,snapshot_sha256) where kind='owner_incident_continuity_export';
alter table public.rosie_owner_continuity_v864 enable row level security;
revoke all on public.rosie_owner_continuity_v864 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_owner_continuity_v864 to service_role;
create function public.rosie864_immutable() returns trigger
 language plpgsql security invoker set search_path='' as $$
begin raise exception 'Original owner 864 continuity evidence is immutable'
 using errcode='42501'; end $$;
revoke all on function public.rosie864_immutable() from public,anon,authenticated;
create trigger rosie864_no_rewrite before update or delete on public.rosie_owner_continuity_v864
 for each row execute function public.rosie864_immutable();

create function public.rosie864_append_owner_continuity(
 p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
 p_owner_exception_860_id uuid,p_owner_escalation_861_id uuid,
 p_latest_sla_862_id uuid,p_latest_export_862_id uuid,
 p_reconciliation_863_id uuid,p_critical_followup_863_id uuid,
 p_latest_recovery_864_id uuid,p_latest_drift_864_id uuid,
 p_kind text,p_review_status text,p_source_revision text,p_review_digest_sha256 text,
 p_review_nonce text,p_snapshot_sha256 text,p_original_exception_age_hours integer,
 p_owner_action text,p_previous_id uuid,p_previous_sha256 text,
 p_previous_export_id uuid,p_previous_export_sha256 text,p_actor_staff_email text)
 returns table(outcome text,review_id uuid,accepted_at timestamptz)
 language plpgsql security invoker set search_path='' as $$
declare inserted uuid; stamped timestamptz; actual_age integer;
  first_exception timestamptz; exception_tip uuid; escalation_tip uuid; sla_tip uuid;
  export_tip uuid; recon_tip uuid; critical_tip uuid;
  previous_tip uuid; previous_digest text; previous_export_tip uuid; previous_export_digest text;
  recovery_tip uuid; drift_tip uuid; ai_readback record; comms_readback record;
  computed_status text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_transaction_review_id::text,864));
 if not exists(select 1 from public.rosie_master_transaction_review_v855 t
     where t.id=p_transaction_review_id and t.project_id=p_project_id
       and t.booking_id=p_booking_id and t.post_id=p_post_id)
 or not exists(select 1 from public.creative_projects c
     where c.id=p_project_id and c.source_booking_id=p_booking_id
       and (c.consent_status<>'approved_public' or c.public_publish_allowed is distinct from true))
 or not exists(select 1 from public.rosie_delivery_conflict_evidence_v856 c
     where c.transaction_review_id=p_transaction_review_id and c.kind='replay_conflict_review')
 or not exists(select 1 from public.rosie_external_intake_custody_v860 e
     where e.id=p_owner_exception_860_id and e.kind='owner_continuity_exception_review'
       and e.transaction_review_id=p_transaction_review_id and e.project_id=p_project_id)
 or not exists(select 1 from public.rosie_intake_discrepancy_v861 o
     where o.id=p_owner_escalation_861_id and o.kind='owner_hold_escalation_review'
       and o.transaction_review_id=p_transaction_review_id
       and o.owner_exception_860_id=p_owner_exception_860_id)
 or not exists(select 1 from public.rosie_discrepancy_review_v862 s
     where s.id=p_latest_sla_862_id and s.kind='owner_aging_sla_recheck'
       and s.transaction_review_id=p_transaction_review_id
       and s.owner_escalation_861_id=p_owner_escalation_861_id
       and s.sla_status='CRITICAL_HOLD')
 then raise exception 'Exact original Rosie revoked-consent critical 855–862 HOLD lineage required'; end if;
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
 select s.id into sla_tip from public.rosie_discrepancy_review_v862 s
  where s.transaction_review_id=p_transaction_review_id and s.kind='owner_aging_sla_recheck'
  order by s.recorded_at desc,s.id desc limit 1;
 if exception_tip is distinct from p_owner_exception_860_id or
    escalation_tip is distinct from p_owner_escalation_861_id or
    sla_tip is distinct from p_latest_sla_862_id or first_exception is null then
    raise exception 'Original owner HOLD tip drifted before 864 atomic append'; end if;
 actual_age:=greatest(0,floor(extract(epoch from(clock_timestamp()-first_exception))/3600)::integer);
 if actual_age<48 or p_original_exception_age_hours is null or
   abs(actual_age-p_original_exception_age_hours)>1 or
   p_source_revision !~ '^[a-f0-9]{40}$'
 then raise exception 'Critical owner SLA age or exact source revision invalid'; end if;
 if p_kind='owner_critical_recovery_recheck' then
  if p_latest_export_862_id is not null or p_reconciliation_863_id is not null
    or p_latest_recovery_864_id is not null or p_latest_drift_864_id is not null
    or p_snapshot_sha256 is not null or p_previous_export_id is not null
    or p_critical_followup_863_id is not null and not exists(
      select 1 from public.rosie_postwitness_hold_v863 c
       where c.id=p_critical_followup_863_id and c.kind='owner_critical_sla_follow_up'
         and c.transaction_review_id=p_transaction_review_id)
    or p_owner_action not in('maintain_hold','request_fresh_independent_master_references',
         'escalate_owner_critical_sla_breach')
  then raise exception 'Only original-owner non-closing critical recovery recheck allowed'; end if;
  select c.id into critical_tip from public.rosie_postwitness_hold_v863 c
    where c.transaction_review_id=p_transaction_review_id
      and c.kind='owner_critical_sla_follow_up'
    order by c.recorded_at desc,c.id desc limit 1;
  if critical_tip is distinct from p_critical_followup_863_id then
     raise exception 'Latest owner 863 critical follow-up tip changed'; end if;
 elsif p_kind='owner_two_plane_drift_review' or p_kind='owner_incident_continuity_export' then
  if p_latest_export_862_id is null or p_reconciliation_863_id is null or
    p_critical_followup_863_id is null or
    p_owner_action is not null or
    not exists(select 1 from public.rosie_discrepancy_review_v862 e
      where e.id=p_latest_export_862_id and e.transaction_review_id=p_transaction_review_id
      and e.kind='master_hold_custody_export' and e.previous_id=p_latest_sla_862_id)
  then raise exception 'Exact latest original owner private export and review custody required'; end if;
  select id into export_tip from public.rosie_discrepancy_review_v862
    where transaction_review_id=p_transaction_review_id and kind='master_hold_custody_export'
    order by recorded_at desc,id desc limit 1;
  select id into recon_tip from public.rosie_postwitness_hold_v863
    where transaction_review_id=p_transaction_review_id and kind='owner_post_witness_reconciliation'
    order by recorded_at desc,id desc limit 1;
  select id into critical_tip from public.rosie_postwitness_hold_v863
    where transaction_review_id=p_transaction_review_id and kind='owner_critical_sla_follow_up'
    order by recorded_at desc,id desc limit 1;
  if export_tip is distinct from p_latest_export_862_id or
    recon_tip is distinct from p_reconciliation_863_id or
    critical_tip is distinct from p_critical_followup_863_id then
    raise exception 'Current two-plane reconciliation, critical owner or export tip drifted'; end if;
  select r.* into ai_readback from public.rosie_postwitness_hold_v863 r
    where r.transaction_review_id=p_transaction_review_id and
      r.kind='signed_master_hold_export_readback' and r.plane='ai-data-platform'
    order by r.recorded_at desc,r.id desc limit 1;
  select r.* into comms_readback from public.rosie_postwitness_hold_v863 r
    where r.transaction_review_id=p_transaction_review_id and
      r.kind='signed_master_hold_export_readback' and r.plane='rosevear-comms-hub'
    order by r.recorded_at desc,r.id desc limit 1;
  if ai_readback.id is not null and (
      ai_readback.kind<>'signed_master_hold_export_readback' or
      ai_readback.export_862_id<>p_latest_export_862_id or
      ai_readback.reconciliation_863_id<>p_reconciliation_863_id or
      ai_readback.critical_followup_863_id<>p_critical_followup_863_id or
      ai_readback.export_snapshot_sha256 is distinct from (select snapshot_sha256
        from public.rosie_discrepancy_review_v862 where id=p_latest_export_862_id))
   or comms_readback.id is not null and (
      comms_readback.kind<>'signed_master_hold_export_readback' or
      comms_readback.export_862_id<>p_latest_export_862_id or
      comms_readback.reconciliation_863_id<>p_reconciliation_863_id or
      comms_readback.critical_followup_863_id<>p_critical_followup_863_id or
      comms_readback.export_snapshot_sha256 is distinct from (select snapshot_sha256
        from public.rosie_discrepancy_review_v862 where id=p_latest_export_862_id))
  then computed_status:='CROSS_MASTER_HASH_DRIFT_HOLD';
  elsif ai_readback.id is null or comms_readback.id is null then
    computed_status:='MISSING_SIGNED_PLANE_HOLD';
  elsif clock_timestamp()-ai_readback.recorded_at >= interval '24 hours' or
    clock_timestamp()-comms_readback.recorded_at >= interval '24 hours' then
    computed_status:='STALE_SIGNED_REFERENCE_HOLD';
  else computed_status:='BOTH_PLANES_HASH_MATCH_HOLD'; end if;
  if p_kind='owner_two_plane_drift_review' and computed_status<>p_review_status then
     raise exception 'Independent DB two-plane signed HOLD reference status drifted'; end if;
  if p_kind='owner_incident_continuity_export' then
    if p_review_status<>'PRIVATE_ORIGINAL_OWNER_CONTINUITY_HOLD'
       or p_snapshot_sha256 !~ '^[a-f0-9]{64}$'
       or p_latest_recovery_864_id is null or p_latest_drift_864_id is null
    then raise exception 'Private original owner continuity-only snapshot required'; end if;
    select r.id into recovery_tip from public.rosie_owner_continuity_v864 r
      where r.transaction_review_id=p_transaction_review_id
        and r.kind='owner_critical_recovery_recheck'
      order by r.recorded_at desc,r.id desc limit 1;
    select r.id into drift_tip from public.rosie_owner_continuity_v864 r
      where r.transaction_review_id=p_transaction_review_id
        and r.kind='owner_two_plane_drift_review'
      order by r.recorded_at desc,r.id desc limit 1;
    if recovery_tip is distinct from p_latest_recovery_864_id or
       drift_tip is distinct from p_latest_drift_864_id then
       raise exception 'Owner recovery/drift witness tips moved before export'; end if;
    if not exists(select 1 from public.rosie_owner_continuity_v864 d
      where d.id=p_latest_drift_864_id and d.kind='owner_two_plane_drift_review'
        and d.transaction_review_id=p_transaction_review_id
        and d.review_status=computed_status) then
       raise exception 'Latest independent drift classification changed before snapshot'; end if;
  end if;
 else raise exception 'Unsupported 864 original owner evidence kind'; end if;
 if p_kind<>'owner_incident_continuity_export' then
   if p_latest_recovery_864_id is not null or p_latest_drift_864_id is not null
      or p_snapshot_sha256 is not null then
      raise exception 'Non-export 864 review cannot carry external continuity artifact'; end if;
 end if;
 -- Preserve per-kind append-only original-owner history; export points at latest drift.
 if p_kind='owner_incident_continuity_export' then
   select id,review_digest_sha256 into previous_tip,previous_digest
     from public.rosie_owner_continuity_v864
     where transaction_review_id=p_transaction_review_id
       and kind='owner_two_plane_drift_review'
     order by recorded_at desc,id desc limit 1;
   select id,review_digest_sha256 into previous_export_tip,previous_export_digest
     from public.rosie_owner_continuity_v864
     where transaction_review_id=p_transaction_review_id
       and kind='owner_incident_continuity_export'
     order by recorded_at desc,id desc limit 1;
   if previous_export_tip is distinct from p_previous_export_id or
      previous_export_digest is distinct from p_previous_export_sha256 then
      raise exception 'Private prior owner continuity export hash chain changed'; end if;
 else
   select id,review_digest_sha256 into previous_tip,previous_digest
     from public.rosie_owner_continuity_v864
     where transaction_review_id=p_transaction_review_id and kind=p_kind
     order by recorded_at desc,id desc limit 1;
 end if;
 if previous_tip is distinct from p_previous_id or
   previous_digest is distinct from p_previous_sha256 then
   raise exception 'Original owner immutable 864 review predecessor drifted'; end if;
 insert into public.rosie_owner_continuity_v864(
   project_id,booking_id,post_id,transaction_review_id,owner_exception_860_id,
   owner_escalation_861_id,latest_sla_862_id,latest_export_862_id,reconciliation_863_id,
   critical_followup_863_id,latest_recovery_864_id,latest_drift_864_id,kind,
   review_status,source_revision,review_digest_sha256,review_nonce,snapshot_sha256,
   original_exception_age_hours,owner_action,previous_id,previous_sha256,
   previous_export_id,previous_export_sha256,actor_staff_email)
 values(p_project_id,p_booking_id,p_post_id,p_transaction_review_id,p_owner_exception_860_id,
   p_owner_escalation_861_id,p_latest_sla_862_id,p_latest_export_862_id,
   p_reconciliation_863_id,p_critical_followup_863_id,p_latest_recovery_864_id,
   p_latest_drift_864_id,p_kind,p_review_status,p_source_revision,p_review_digest_sha256,
   p_review_nonce,p_snapshot_sha256,p_original_exception_age_hours,p_owner_action,
   p_previous_id,p_previous_sha256,p_previous_export_id,p_previous_export_sha256,
   p_actor_staff_email)
 on conflict do nothing returning id,recorded_at into inserted,stamped;
 if inserted is null then return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
 else return query select 'INSERTED'::text,inserted,stamped; end if;
end $$;
revoke all on function public.rosie864_append_owner_continuity(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,
 text,text,text,text,text,text,integer,text,uuid,text,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie864_append_owner_continuity(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,
 text,text,text,text,text,text,integer,text,uuid,text,uuid,text,text)
 to service_role;
comment on table public.rosie_owner_continuity_v864 is
 'Append-only original owner critical SLA revalidation, source-bound two-plane signed HOLD reference drift and private continuity exports; no Master transport, receiver ACK or operational closure.';
