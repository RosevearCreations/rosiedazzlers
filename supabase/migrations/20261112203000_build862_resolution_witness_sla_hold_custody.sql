-- Rosie 862: original-owner signed review witness, periodic SLA recheck and
-- private durable HOLD custody manifests. Claims never prove external ACK/closure.
create table public.rosie_discrepancy_review_v862(
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete restrict,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 post_id uuid not null references public.social_post_queue(id) on delete restrict,
 transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
 handoff_858_id uuid not null references public.rosie_recovery_custody_v858(id) on delete restrict,
 owner_decision_859_id uuid not null references public.rosie_incident_continuity_v859(id) on delete restrict,
 owner_exception_860_id uuid not null references public.rosie_external_intake_custody_v860(id) on delete restrict,
 owner_escalation_861_id uuid not null references public.rosie_intake_discrepancy_v861(id) on delete restrict,
 discrepancy_861_id uuid references public.rosie_intake_discrepancy_v861(id) on delete restrict,
 kind text not null check(kind in (
  'signed_resolution_review_witness','owner_aging_sla_recheck','master_hold_custody_export')),
 plane text check(plane in ('ai-data-platform','rosevear-comms-hub')),
 source_revision text not null check(source_revision ~ '^[a-f0-9]{40}$'),
 receipt_sha256 text check(receipt_sha256 is null or receipt_sha256 ~ '^[a-f0-9]{64}$'),
 signer_id text check(signer_id is null or signer_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$'),
 review_digest_sha256 text not null check(review_digest_sha256 ~ '^[a-f0-9]{64}$'),
 review_nonce text not null unique check(review_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
 sla_status text not null check(sla_status in ('OPEN_HOLD','ESCALATION_DUE_HOLD','CRITICAL_HOLD')),
 age_hours integer not null check(age_hours between 0 and 1000000),
 owner_action text check(owner_action in ('maintain_hold','request_fresh_independent_witness','escalate_to_external_custodians')),
 snapshot_sha256 text check(snapshot_sha256 is null or snapshot_sha256 ~ '^[a-f0-9]{64}$'),
 previous_id uuid references public.rosie_discrepancy_review_v862(id) on delete restrict,
 previous_sha256 text check(previous_sha256 is null or previous_sha256 ~ '^[a-f0-9]{64}$'),
 previous_export_id uuid references public.rosie_discrepancy_review_v862(id) on delete restrict,
 previous_export_sha256 text check(previous_export_sha256 is null or previous_export_sha256 ~ '^[a-f0-9]{64}$'),
 review_day date,
 actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
 recorded_at timestamptz not null default clock_timestamp(),
 constraint rosie862_kind_shape check(
  (kind='signed_resolution_review_witness' and plane is not null and
   discrepancy_861_id is not null and receipt_sha256 is not null and signer_id is not null
   and owner_action is null and snapshot_sha256 is null and previous_id is null and
   previous_sha256 is null and previous_export_id is null and previous_export_sha256 is null
   and review_day is null)
  or (kind='owner_aging_sla_recheck' and plane is null and discrepancy_861_id is null
   and receipt_sha256 is null and signer_id is null and owner_action is not null
   and snapshot_sha256 is null and previous_export_id is null and
   previous_export_sha256 is null and review_day is not null)
  or (kind='master_hold_custody_export' and plane is null and discrepancy_861_id is null
   and receipt_sha256 is null and signer_id is null and owner_action is null
   and snapshot_sha256 is not null and previous_id is not null and previous_sha256 is not null
   and review_day is null)),
 constraint rosie862_previous_pair check(
  (previous_id is null and previous_sha256 is null) or
  (previous_id is not null and previous_sha256 is not null)),
 constraint rosie862_export_previous_pair check(
  (previous_export_id is null and previous_export_sha256 is null) or
  (previous_export_id is not null and previous_export_sha256 is not null))
);
create unique index rosie862_unique_signed_witness
 on public.rosie_discrepancy_review_v862(discrepancy_861_id,receipt_sha256)
 where kind='signed_resolution_review_witness';
create unique index rosie862_one_daily_owner_sla
 on public.rosie_discrepancy_review_v862(transaction_review_id,review_day)
 where kind='owner_aging_sla_recheck';
create unique index rosie862_export_snapshot_replay
 on public.rosie_discrepancy_review_v862(transaction_review_id,snapshot_sha256)
 where kind='master_hold_custody_export';
create index rosie862_source_history
 on public.rosie_discrepancy_review_v862(transaction_review_id,kind,recorded_at desc);
alter table public.rosie_discrepancy_review_v862 enable row level security;
revoke all on public.rosie_discrepancy_review_v862 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_discrepancy_review_v862 to service_role;
create function public.rosie862_no_rewrite()
 returns trigger language plpgsql security invoker set search_path='' as $$
begin raise exception 'Immutable Rosie 862 HOLD evidence cannot be rewritten' using errcode='42501'; end $$;
revoke all on function public.rosie862_no_rewrite() from public,anon,authenticated;
create trigger rosie862_immutable before update or delete on public.rosie_discrepancy_review_v862
 for each row execute function public.rosie862_no_rewrite();

create function public.rosie862_append_hold_custody(
 p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
 p_handoff_858_id uuid,p_owner_decision_859_id uuid,p_owner_exception_860_id uuid,
 p_owner_escalation_861_id uuid,p_kind text,p_plane text,p_discrepancy_861_id uuid,
 p_source_revision text,p_receipt_sha256 text,p_signer_id text,p_review_digest_sha256 text,
 p_review_nonce text,p_sla_status text,p_age_hours integer,p_owner_action text,
 p_snapshot_sha256 text,p_previous_id uuid,p_previous_sha256 text,
 p_previous_export_id uuid,p_previous_export_sha256 text,p_actor_staff_email text)
 returns table(outcome text,review_id uuid,accepted_at timestamptz)
 language plpgsql security invoker set search_path='' as $$
declare inserted uuid; stamped timestamptz; tip_id uuid; tip_sha text;
 current_owner uuid; first_exception timestamptz; actual_age integer;
 export_tip_id uuid; export_tip_sha text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_transaction_review_id::text,862));
 if not exists(select 1 from public.rosie_master_transaction_review_v855 t
  where t.id=p_transaction_review_id and t.project_id=p_project_id
   and t.booking_id=p_booking_id and t.post_id=p_post_id)
 or not exists(select 1 from public.creative_projects c
  where c.id=p_project_id and c.source_booking_id=p_booking_id
   and (c.consent_status<>'approved_public' or c.public_publish_allowed is distinct from true))
 or not exists(select 1 from public.rosie_recovery_custody_v858 h
  where h.id=p_handoff_858_id and h.kind='conflict_escalation_handoff'
   and h.transaction_review_id=p_transaction_review_id and h.project_id=p_project_id
   and h.booking_id=p_booking_id and h.post_id=p_post_id)
 or not exists(select 1 from public.rosie_incident_continuity_v859 d
  where d.id=p_owner_decision_859_id and d.kind='owner_recovery_decision'
   and d.transaction_review_id=p_transaction_review_id
   and d.handoff_858_id=p_handoff_858_id)
 or not exists(select 1 from public.rosie_external_intake_custody_v860 e
  where e.id=p_owner_exception_860_id and e.kind='owner_continuity_exception_review'
   and e.transaction_review_id=p_transaction_review_id
   and e.owner_decision_859_id=p_owner_decision_859_id)
 or not exists(select 1 from public.rosie_intake_discrepancy_v861 a
  where a.id=p_owner_escalation_861_id and a.kind='owner_hold_escalation_review'
   and a.transaction_review_id=p_transaction_review_id)
 or not exists(select 1 from public.rosie_delivery_conflict_evidence_v856 k
  where k.transaction_review_id=p_transaction_review_id and k.kind='replay_conflict_review')
 then raise exception 'Original revoked-consent and open 855→861 owner HOLD custody required'; end if;
 select a.id into current_owner from public.rosie_intake_discrepancy_v861 a
  where a.transaction_review_id=p_transaction_review_id
   and a.kind='owner_hold_escalation_review'
  order by a.recorded_at desc,a.id desc limit 1;
 if current_owner is distinct from p_owner_escalation_861_id then
  raise exception 'Original 861 owner HOLD tip moved'; end if;
 if p_source_revision !~ '^[a-f0-9]{40}$'
  or p_sla_status not in('OPEN_HOLD','ESCALATION_DUE_HOLD','CRITICAL_HOLD')
  or p_age_hours is null or p_age_hours<0
 then raise exception 'Source-bound non-authorizing age/status required'; end if;
 select e.recorded_at into first_exception
 from public.rosie_external_intake_custody_v860 e
 where e.transaction_review_id=p_transaction_review_id
  and e.kind='owner_continuity_exception_review'
 order by e.recorded_at asc,e.id asc limit 1;
 if first_exception is null then raise exception 'First original owner exception required'; end if;
 actual_age:=greatest(0,floor(extract(epoch from (clock_timestamp()-first_exception))/3600)::integer);
 if abs(p_age_hours-actual_age)>1 or
   (actual_age>=49 and p_sla_status<>'CRITICAL_HOLD') or
   (actual_age between 25 and 47 and p_sla_status<>'ESCALATION_DUE_HOLD') or
   (actual_age<23 and p_sla_status<>'OPEN_HOLD')
 then raise exception 'Original first exception SLA is stale or fabricated'; end if;
 if p_kind='signed_resolution_review_witness' then
  if p_plane not in ('ai-data-platform','rosevear-comms-hub')
   or p_discrepancy_861_id is null or p_receipt_sha256 !~ '^[a-f0-9]{64}$'
   or p_signer_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$'
   or p_owner_action is not null or p_snapshot_sha256 is not null
   or p_previous_id is not null or p_previous_export_id is not null
   or not exists(select 1 from public.rosie_intake_discrepancy_v861 d
     where d.id=p_discrepancy_861_id and d.kind='signed_external_custodian_discrepancy'
     and d.transaction_review_id=p_transaction_review_id and d.plane=p_plane)
  then raise exception 'Independent exact signed review witness required'; end if;
 elsif p_kind='owner_aging_sla_recheck' then
  if p_plane is not null or p_discrepancy_861_id is not null or p_receipt_sha256 is not null
   or p_signer_id is not null or p_snapshot_sha256 is not null
   or p_owner_action not in ('maintain_hold','request_fresh_independent_witness','escalate_to_external_custodians')
   or p_previous_export_id is not null then
   raise exception 'Non-authorizing original owner SLA recheck required'; end if;
  select r.id,r.review_digest_sha256 into tip_id,tip_sha
  from public.rosie_discrepancy_review_v862 r
   where r.transaction_review_id=p_transaction_review_id
    and r.kind='owner_aging_sla_recheck'
   order by r.recorded_at desc,r.id desc limit 1;
  if tip_id is distinct from p_previous_id or tip_sha is distinct from p_previous_sha256
   then raise exception 'SLA review tip moved; fail closed'; end if;
 elsif p_kind='master_hold_custody_export' then
  if p_plane is not null or p_discrepancy_861_id is not null
   or p_receipt_sha256 is not null or p_signer_id is not null
   or p_owner_action is not null or p_snapshot_sha256 !~ '^[a-f0-9]{64}$'
   or not exists(select 1 from public.rosie_discrepancy_review_v862 r
     where r.id=p_previous_id and r.kind='owner_aging_sla_recheck'
      and r.transaction_review_id=p_transaction_review_id
      and r.review_digest_sha256=p_previous_sha256)
  then raise exception 'Exact original owner SLA and private HOLD snapshot required'; end if;
  select r.id,r.review_digest_sha256 into tip_id,tip_sha
   from public.rosie_discrepancy_review_v862 r
   where r.transaction_review_id=p_transaction_review_id and r.kind='owner_aging_sla_recheck'
   order by r.recorded_at desc,r.id desc limit 1;
  if tip_id is distinct from p_previous_id or tip_sha is distinct from p_previous_sha256
  then raise exception 'Owner SLA tip changed before export'; end if;
  select r.id,r.review_digest_sha256 into export_tip_id,export_tip_sha
   from public.rosie_discrepancy_review_v862 r
   where r.transaction_review_id=p_transaction_review_id
    and r.kind='master_hold_custody_export'
   order by r.recorded_at desc,r.id desc limit 1;
  if export_tip_id is distinct from p_previous_export_id or
   export_tip_sha is distinct from p_previous_export_sha256
  then raise exception 'Master HOLD export predecessor changed'; end if;
 else raise exception 'Unsupported 862 HOLD action'; end if;

 insert into public.rosie_discrepancy_review_v862(
  project_id,booking_id,post_id,transaction_review_id,handoff_858_id,owner_decision_859_id,
  owner_exception_860_id,owner_escalation_861_id,discrepancy_861_id,kind,plane,
  source_revision,receipt_sha256,signer_id,review_digest_sha256,review_nonce,
  sla_status,age_hours,owner_action,snapshot_sha256,previous_id,previous_sha256,
  previous_export_id,previous_export_sha256,review_day,actor_staff_email)
 values(p_project_id,p_booking_id,p_post_id,p_transaction_review_id,p_handoff_858_id,
  p_owner_decision_859_id,p_owner_exception_860_id,p_owner_escalation_861_id,
  p_discrepancy_861_id,p_kind,p_plane,p_source_revision,p_receipt_sha256,
  p_signer_id,p_review_digest_sha256,p_review_nonce,p_sla_status,p_age_hours,
  p_owner_action,p_snapshot_sha256,p_previous_id,p_previous_sha256,
  p_previous_export_id,p_previous_export_sha256,
  case when p_kind='owner_aging_sla_recheck' then (clock_timestamp() at time zone 'UTC')::date else null end,
  p_actor_staff_email)
 on conflict do nothing returning id,recorded_at into inserted,stamped;
 if inserted is null then return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
 else return query select 'INSERTED'::text,inserted,stamped; end if;
end $$;
revoke all on function public.rosie862_append_hold_custody(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,uuid,text,text,text,text,text,
 text,integer,text,text,uuid,text,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie862_append_hold_custody(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,uuid,text,text,text,text,text,
 text,integer,text,text,uuid,text,uuid,text,text) to service_role;
comment on table public.rosie_discrepancy_review_v862 is
 'Immutable independent signed review claims, owner SLA reviews and private chained hold export manifests. Never proves delivery, ACK, resolved conflict or Master connected.';
