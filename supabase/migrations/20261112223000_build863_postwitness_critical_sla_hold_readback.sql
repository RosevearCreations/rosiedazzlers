-- Rosie Dazzlers 863. Original-owner-only source-bound evidence reviews, critical
-- SLA follow-up and *offline* independent cross-Master HOLD hash-reference claims.
-- No transport, Master receiver ACK, provider mutation or operational closure.
create table public.rosie_postwitness_hold_v863 (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete restrict,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 post_id uuid not null references public.social_post_queue(id) on delete restrict,
 transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
 owner_exception_860_id uuid not null references public.rosie_external_intake_custody_v860(id) on delete restrict,
 owner_escalation_861_id uuid not null references public.rosie_intake_discrepancy_v861(id) on delete restrict,
 latest_sla_862_id uuid not null references public.rosie_discrepancy_review_v862(id) on delete restrict,
 export_862_id uuid references public.rosie_discrepancy_review_v862(id) on delete restrict,
 witness_862_id uuid references public.rosie_discrepancy_review_v862(id) on delete restrict,
 reconciliation_863_id uuid references public.rosie_postwitness_hold_v863(id) on delete restrict,
 critical_followup_863_id uuid references public.rosie_postwitness_hold_v863(id) on delete restrict,
 kind text not null check (kind in ('owner_post_witness_reconciliation',
  'owner_critical_sla_follow_up','signed_master_hold_export_readback')),
 plane text check(plane in ('ai-data-platform','rosevear-comms-hub')),
 source_revision text not null check(source_revision ~ '^[a-f0-9]{40}$'),
 review_status text not null check(review_status in
  ('NO_SIGNED_WITNESS_HOLD','PARTIAL_WITNESS_REVIEW_HOLD',
   'BOTH_PLANES_WITNESS_REVIEW_HOLD','WITNESS_CONFLICT_HOLD',
   'CRITICAL_BREACH_HOLD','CROSS_MASTER_REFERENCE_ONLY_HOLD')),
 owner_action text check(owner_action in ('maintain_hold','escalate_critical_sla_to_original_owner',
   'request_fresh_external_custodian_evidence')),
 receipt_sha256 text check(receipt_sha256 is null or receipt_sha256 ~ '^[a-f0-9]{64}$'),
 signer_id text check(signer_id is null or signer_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$'),
 review_digest_sha256 text not null check(review_digest_sha256 ~ '^[a-f0-9]{64}$'),
 review_nonce text not null unique check(review_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
 age_hours integer not null check(age_hours between 0 and 1000000),
 export_snapshot_sha256 text check(export_snapshot_sha256 is null or export_snapshot_sha256 ~ '^[a-f0-9]{64}$'),
 previous_id uuid references public.rosie_postwitness_hold_v863(id) on delete restrict,
 previous_sha256 text check(previous_sha256 is null or previous_sha256 ~ '^[a-f0-9]{64}$'),
 review_day date,
 actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
 recorded_at timestamptz not null default clock_timestamp(),
 constraint rosie863_previous_pair check ((previous_id is null and previous_sha256 is null)
  or (previous_id is not null and previous_sha256 is not null)),
 constraint rosie863_kind_shape check(
  (kind='owner_post_witness_reconciliation' and plane is null and owner_action is null
    and export_862_id is null and witness_862_id is null and reconciliation_863_id is null
    and critical_followup_863_id is null and receipt_sha256 is null
    and signer_id is null and export_snapshot_sha256 is null and review_day is null
    and review_status in ('NO_SIGNED_WITNESS_HOLD','PARTIAL_WITNESS_REVIEW_HOLD',
      'BOTH_PLANES_WITNESS_REVIEW_HOLD','WITNESS_CONFLICT_HOLD'))
  or (kind='owner_critical_sla_follow_up' and plane is null and owner_action is not null
    and export_862_id is null and witness_862_id is null and reconciliation_863_id is null
    and critical_followup_863_id is null and receipt_sha256 is null
    and signer_id is null and export_snapshot_sha256 is null and review_day is not null
    and review_status='CRITICAL_BREACH_HOLD')
  or (kind='signed_master_hold_export_readback' and plane is not null and owner_action is null
    and export_862_id is not null and witness_862_id is not null
    and reconciliation_863_id is not null and critical_followup_863_id is not null
    and receipt_sha256 is not null and signer_id is not null
    and export_snapshot_sha256 is not null and previous_id is null
    and previous_sha256 is null and review_day is null
    and review_status='CROSS_MASTER_REFERENCE_ONLY_HOLD'))
);
create index rosie863_source_history
 on public.rosie_postwitness_hold_v863(transaction_review_id,kind,recorded_at desc);
create unique index rosie863_daily_critical_owner
 on public.rosie_postwitness_hold_v863(transaction_review_id,review_day)
 where kind='owner_critical_sla_follow_up';
create unique index rosie863_per_export_plane_readback
 on public.rosie_postwitness_hold_v863(export_862_id,plane)
 where kind='signed_master_hold_export_readback';
create unique index rosie863_signed_readback_replay
 on public.rosie_postwitness_hold_v863(receipt_sha256)
 where kind='signed_master_hold_export_readback';
alter table public.rosie_postwitness_hold_v863 enable row level security;
revoke all on public.rosie_postwitness_hold_v863 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_postwitness_hold_v863 to service_role;
create function public.rosie863_no_rewrite()
 returns trigger language plpgsql security invoker set search_path='' as $$
begin raise exception 'Immutable Rosie 863 owner and HOLD claims cannot be rewritten'
 using errcode='42501'; end $$;
revoke all on function public.rosie863_no_rewrite() from public,anon,authenticated;
create trigger rosie863_immutable before update or delete on public.rosie_postwitness_hold_v863
 for each row execute function public.rosie863_no_rewrite();

create function public.rosie863_append_hold_review(
 p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
 p_owner_exception_860_id uuid,p_owner_escalation_861_id uuid,p_latest_sla_862_id uuid,
 p_export_862_id uuid,p_witness_862_id uuid,p_reconciliation_863_id uuid,
 p_critical_followup_863_id uuid,p_kind text,p_plane text,p_source_revision text,
 p_review_status text,p_owner_action text,p_receipt_sha256 text,p_signer_id text,
 p_review_digest_sha256 text,p_review_nonce text,p_age_hours integer,
 p_export_snapshot_sha256 text,p_previous_id uuid,p_previous_sha256 text,
 p_actor_staff_email text)
 returns table(outcome text,review_id uuid,accepted_at timestamptz)
 language plpgsql security invoker set search_path='' as $$
declare inserted uuid;stamp timestamptz;owner_tip uuid;exception_tip uuid;sla_tip uuid;
 export_tip uuid;first_exception timestamptz;actual_age integer;
 prev_id uuid;prev_sha text;recon_tip uuid;critical_tip uuid;
 disputes int;valid_planes int;wrong_witnesses int;expected_status text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_transaction_review_id::text,863));
 if not exists(select 1 from public.rosie_master_transaction_review_v855 t
    where t.id=p_transaction_review_id and t.project_id=p_project_id
     and t.booking_id=p_booking_id and t.post_id=p_post_id)
 or not exists(select 1 from public.creative_projects c
    where c.id=p_project_id and c.source_booking_id=p_booking_id
     and (c.consent_status<>'approved_public' or c.public_publish_allowed is distinct from true))
 or not exists(select 1 from public.rosie_delivery_conflict_evidence_v856 x
    where x.transaction_review_id=p_transaction_review_id and x.kind='replay_conflict_review')
 or not exists(select 1 from public.rosie_external_intake_custody_v860 e
    where e.id=p_owner_exception_860_id and e.transaction_review_id=p_transaction_review_id
      and e.kind='owner_continuity_exception_review')
 or not exists(select 1 from public.rosie_intake_discrepancy_v861 o
    where o.id=p_owner_escalation_861_id and o.transaction_review_id=p_transaction_review_id
      and o.kind='owner_hold_escalation_review' and o.owner_exception_860_id=p_owner_exception_860_id)
 or not exists(select 1 from public.rosie_discrepancy_review_v862 s
    where s.id=p_latest_sla_862_id and s.transaction_review_id=p_transaction_review_id
      and s.kind='owner_aging_sla_recheck' and s.owner_escalation_861_id=p_owner_escalation_861_id)
 then raise exception 'Original revoked-consent, open conflict and 855-862 owner lineage required'; end if;
 select id into owner_tip from public.rosie_intake_discrepancy_v861
   where transaction_review_id=p_transaction_review_id and kind='owner_hold_escalation_review'
   order by recorded_at desc,id desc limit 1;
 select id into exception_tip from public.rosie_external_intake_custody_v860
   where transaction_review_id=p_transaction_review_id and kind='owner_continuity_exception_review'
   order by recorded_at desc,id desc limit 1;
 select id into sla_tip from public.rosie_discrepancy_review_v862
   where transaction_review_id=p_transaction_review_id and kind='owner_aging_sla_recheck'
   order by recorded_at desc,id desc limit 1;
 if owner_tip is distinct from p_owner_escalation_861_id or
  exception_tip is distinct from p_owner_exception_860_id or
  sla_tip is distinct from p_latest_sla_862_id
 then raise exception 'Original owner exception/escalation/SLA tip moved'; end if;
 if p_source_revision !~ '^[a-f0-9]{40}$' or
  p_review_status not in ('NO_SIGNED_WITNESS_HOLD','PARTIAL_WITNESS_REVIEW_HOLD',
  'BOTH_PLANES_WITNESS_REVIEW_HOLD','WITNESS_CONFLICT_HOLD',
  'CRITICAL_BREACH_HOLD','CROSS_MASTER_REFERENCE_ONLY_HOLD')
 then raise exception 'Only source-bound HOLD evidence permitted'; end if;
 select e.recorded_at into first_exception from public.rosie_external_intake_custody_v860 e
   where e.transaction_review_id=p_transaction_review_id
    and e.kind='owner_continuity_exception_review'
   order by e.recorded_at asc,e.id asc limit 1;
 if first_exception is null then raise exception 'First owner exception missing'; end if;
 actual_age:=greatest(0,floor(extract(epoch from (clock_timestamp()-first_exception))/3600)::integer);
 if p_age_hours is null or abs(p_age_hours-actual_age)>1
 then raise exception 'Original owner SLA recheck age drift'; end if;

 if p_kind='owner_post_witness_reconciliation' then
  if p_plane is not null or p_owner_action is not null or
    p_export_862_id is not null or p_witness_862_id is not null or
    p_reconciliation_863_id is not null or p_critical_followup_863_id is not null or
    p_receipt_sha256 is not null or p_signer_id is not null or
    p_export_snapshot_sha256 is not null
  then raise exception 'Only no-delivery reconciliation review permitted'; end if;
  select count(distinct d.plane) into disputes from public.rosie_intake_discrepancy_v861 d
   where d.transaction_review_id=p_transaction_review_id
    and d.kind='signed_external_custodian_discrepancy';
  select count(distinct w.plane) into valid_planes
   from public.rosie_discrepancy_review_v862 w
    join public.rosie_intake_discrepancy_v861 d on d.id=w.discrepancy_861_id
     and d.plane=w.plane and d.transaction_review_id=w.transaction_review_id
   where w.transaction_review_id=p_transaction_review_id
    and w.kind='signed_resolution_review_witness'
    and d.kind='signed_external_custodian_discrepancy';
  select count(*) into wrong_witnesses from public.rosie_discrepancy_review_v862 w
   where w.transaction_review_id=p_transaction_review_id
    and w.kind='signed_resolution_review_witness'
    and not exists(select 1 from public.rosie_intake_discrepancy_v861 d
      where d.id=w.discrepancy_861_id and d.transaction_review_id=w.transaction_review_id
       and d.kind='signed_external_custodian_discrepancy' and d.plane=w.plane);
  expected_status:=case when wrong_witnesses>0 then 'WITNESS_CONFLICT_HOLD'
   when valid_planes=2 and disputes=2 then 'BOTH_PLANES_WITNESS_REVIEW_HOLD'
   when valid_planes>0 then 'PARTIAL_WITNESS_REVIEW_HOLD'
   else 'NO_SIGNED_WITNESS_HOLD' end;
  if p_review_status<>expected_status then
    raise exception 'Fresh original independent witness coverage changed; recheck'; end if;
  select id,review_digest_sha256 into prev_id,prev_sha from public.rosie_postwitness_hold_v863
   where transaction_review_id=p_transaction_review_id and kind=p_kind
   order by recorded_at desc,id desc limit 1;
  if prev_id is distinct from p_previous_id or prev_sha is distinct from p_previous_sha256
  then raise exception 'Original post-witness reconciliation chain moved'; end if;

 elsif p_kind='owner_critical_sla_follow_up' then
  if p_review_status<>'CRITICAL_BREACH_HOLD' or actual_age<48 or
    p_plane is not null or p_export_862_id is not null or p_witness_862_id is not null or
    p_reconciliation_863_id is not null or p_critical_followup_863_id is not null or
    p_receipt_sha256 is not null or p_signer_id is not null or
    p_export_snapshot_sha256 is not null or
    p_owner_action not in ('maintain_hold','escalate_critical_sla_to_original_owner',
      'request_fresh_external_custodian_evidence') or
    not exists(select 1 from public.rosie_discrepancy_review_v862 s
      where s.id=p_latest_sla_862_id and s.sla_status='CRITICAL_HOLD')
  then raise exception 'Only critical original owner SLA breach HOLD escalation permitted'; end if;
  select id,review_digest_sha256 into prev_id,prev_sha from public.rosie_postwitness_hold_v863
    where transaction_review_id=p_transaction_review_id and kind=p_kind
    order by recorded_at desc,id desc limit 1;
  if prev_id is distinct from p_previous_id or prev_sha is distinct from p_previous_sha256
  then raise exception 'Original critical SLA owner history tip moved'; end if;

 elsif p_kind='signed_master_hold_export_readback' then
  if p_review_status<>'CROSS_MASTER_REFERENCE_ONLY_HOLD' or
    p_plane not in ('ai-data-platform','rosevear-comms-hub') or
    p_owner_action is not null or p_previous_id is not null or p_previous_sha256 is not null or
    p_receipt_sha256 !~ '^[a-f0-9]{64}$' or
    p_signer_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$' or
    p_export_snapshot_sha256 !~ '^[a-f0-9]{64}$'
  then raise exception 'Signed offline HOLD reference required, never ACK'; end if;
  select id into export_tip from public.rosie_discrepancy_review_v862
    where transaction_review_id=p_transaction_review_id and kind='master_hold_custody_export'
    order by recorded_at desc,id desc limit 1;
  select id into recon_tip from public.rosie_postwitness_hold_v863
    where transaction_review_id=p_transaction_review_id and kind='owner_post_witness_reconciliation'
    order by recorded_at desc,id desc limit 1;
  select id into critical_tip from public.rosie_postwitness_hold_v863
    where transaction_review_id=p_transaction_review_id and kind='owner_critical_sla_follow_up'
    order by recorded_at desc,id desc limit 1;
  if export_tip is distinct from p_export_862_id or recon_tip is distinct from p_reconciliation_863_id
    or critical_tip is distinct from p_critical_followup_863_id
    or p_export_862_id is null or p_reconciliation_863_id is null or p_critical_followup_863_id is null
    or not exists(select 1 from public.rosie_discrepancy_review_v862 e
      where e.id=p_export_862_id and e.kind='master_hold_custody_export'
       and e.transaction_review_id=p_transaction_review_id
       and e.snapshot_sha256 is not null)
  then raise exception 'Exact latest private export and owner reconciliation/critical review required'; end if;
  -- V862 export uses previous_id for latest owner SLA, not latest_sla_862_id.
  if not exists(select 1 from public.rosie_discrepancy_review_v862 e
      where e.id=p_export_862_id and e.kind='master_hold_custody_export'
       and e.transaction_review_id=p_transaction_review_id
       and e.previous_id=p_latest_sla_862_id
       and e.snapshot_sha256=p_export_snapshot_sha256)
   or not exists(select 1 from public.rosie_discrepancy_review_v862 w
      where w.id=p_witness_862_id and w.kind='signed_resolution_review_witness'
       and w.plane=p_plane and w.transaction_review_id=p_transaction_review_id)
   or not exists(select 1 from public.rosie_postwitness_hold_v863 r
      where r.id=p_reconciliation_863_id and r.kind='owner_post_witness_reconciliation'
       and r.transaction_review_id=p_transaction_review_id
       and r.review_status='BOTH_PLANES_WITNESS_REVIEW_HOLD')
   or not exists(select 1 from public.rosie_postwitness_hold_v863 r
      where r.id=p_critical_followup_863_id and r.kind='owner_critical_sla_follow_up'
       and r.transaction_review_id=p_transaction_review_id)
  then raise exception 'Independent two-plane witness, critical SLA and exact 862 export snapshot required'; end if;
 else raise exception 'Unsupported 863 original owner HOLD kind'; end if;

 insert into public.rosie_postwitness_hold_v863(
  project_id,booking_id,post_id,transaction_review_id,
  owner_exception_860_id,owner_escalation_861_id,latest_sla_862_id,
  export_862_id,witness_862_id,reconciliation_863_id,critical_followup_863_id,
  kind,plane,source_revision,review_status,owner_action,receipt_sha256,signer_id,
  review_digest_sha256,review_nonce,age_hours,export_snapshot_sha256,
  previous_id,previous_sha256,review_day,actor_staff_email)
 values(p_project_id,p_booking_id,p_post_id,p_transaction_review_id,
  p_owner_exception_860_id,p_owner_escalation_861_id,p_latest_sla_862_id,
  p_export_862_id,p_witness_862_id,p_reconciliation_863_id,p_critical_followup_863_id,
  p_kind,p_plane,p_source_revision,p_review_status,p_owner_action,p_receipt_sha256,p_signer_id,
  p_review_digest_sha256,p_review_nonce,p_age_hours,p_export_snapshot_sha256,
  p_previous_id,p_previous_sha256,
  case when p_kind='owner_critical_sla_follow_up'
   then (clock_timestamp() at time zone 'UTC')::date else null end,
  p_actor_staff_email)
 on conflict do nothing returning id,recorded_at into inserted,stamp;
 if inserted is null then return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
 else return query select 'INSERTED'::text,inserted,stamp; end if;
end $$;
revoke all on function public.rosie863_append_hold_review(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,
 text,text,text,text,integer,text,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie863_append_hold_review(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,
 text,text,text,text,integer,text,uuid,text,text)
 to service_role;
comment on table public.rosie_postwitness_hold_v863 is
 'Independent witness reconciliation, original-owner critical SLA and per-plane offline protected HOLD export hash references. Never receiver ACK, delivered or operational closure.';
