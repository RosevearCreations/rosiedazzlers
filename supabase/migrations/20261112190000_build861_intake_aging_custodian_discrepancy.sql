-- Rosie 861. Original-owner-only immutable signed claims and non-authorizing HOLD
-- history. Neither this table nor this RPC can prove a live external delivery or ACK.
create table public.rosie_intake_discrepancy_v861 (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete restrict,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 post_id uuid not null references public.social_post_queue(id) on delete restrict,
 transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
 handoff_858_id uuid not null references public.rosie_recovery_custody_v858(id) on delete restrict,
 owner_decision_859_id uuid not null references public.rosie_incident_continuity_v859(id) on delete restrict,
 owner_exception_860_id uuid not null references public.rosie_external_intake_custody_v860(id) on delete restrict,
 intake_860_id uuid references public.rosie_external_intake_custody_v860(id) on delete restrict,
 kind text not null check(kind in ('signed_external_custodian_discrepancy','owner_hold_escalation_review')),
 plane text check(plane in ('ai-data-platform','rosevear-comms-hub')),
 source_revision text not null check(source_revision ~ '^[a-f0-9]{40}$'),
 receipt_sha256 text check(receipt_sha256 is null or receipt_sha256 ~ '^[a-f0-9]{64}$'),
 disputed_sha256 text check(disputed_sha256 is null or disputed_sha256 ~ '^[a-f0-9]{64}$'),
 discrepancy_code text check(discrepancy_code in ('INTAKE_DIGEST_DISPUTED','INTAKE_OBSERVATION_STALENESS_DISPUTED')),
 signer_id text check(signer_id is null or signer_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$'),
 review_digest_sha256 text not null check(review_digest_sha256 ~ '^[a-f0-9]{64}$'),
 review_nonce text not null unique check(review_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
 age_hours integer check(age_hours is null or age_hours between 0 and 1000000),
 aging_status text not null check(aging_status in
  ('CRITICAL_HOLD','ESCALATION_DUE_HOLD','REVIEW_DUE_HOLD','OPEN_UNRESOLVED_HOLD')),
 issue_codes text[] not null default '{}'::text[],
 owner_action text check(owner_action in
  ('maintain_hold','request_independent_custodian_reconciliation','escalate_original_owner_incident')),
 previous_id uuid references public.rosie_intake_discrepancy_v861(id) on delete restrict,
 previous_sha256 text check(previous_sha256 is null or previous_sha256 ~ '^[a-f0-9]{64}$'),
 review_day date,
 actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
 recorded_at timestamptz not null default clock_timestamp(),
 constraint rosie861_kind_shape check(
  (kind='signed_external_custodian_discrepancy' and plane is not null and
   intake_860_id is not null and receipt_sha256 is not null and disputed_sha256 is not null and
   discrepancy_code is not null and signer_id is not null and owner_action is null and
   previous_id is null and previous_sha256 is null and review_day is null)
  or (kind='owner_hold_escalation_review' and plane is null and
   intake_860_id is null and receipt_sha256 is null and disputed_sha256 is null and
   discrepancy_code is null and signer_id is null and owner_action is not null and
   review_day is not null)),
 constraint rosie861_previous_pair check(
  (previous_id is null and previous_sha256 is null) or
  (previous_id is not null and previous_sha256 is not null))
);
create unique index rosie861_signed_discrepancy_replay
 on public.rosie_intake_discrepancy_v861(intake_860_id,plane,receipt_sha256)
 where kind='signed_external_custodian_discrepancy';
create unique index rosie861_daily_owner_hold
 on public.rosie_intake_discrepancy_v861(transaction_review_id,review_day)
 where kind='owner_hold_escalation_review';
create index rosie861_owner_history on public.rosie_intake_discrepancy_v861
 (transaction_review_id,kind,recorded_at desc);
create index rosie861_custodian_history on public.rosie_intake_discrepancy_v861
 (transaction_review_id,plane,recorded_at desc);
alter table public.rosie_intake_discrepancy_v861 enable row level security;
revoke all on public.rosie_intake_discrepancy_v861 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_intake_discrepancy_v861 to service_role;

create function public.rosie861_no_rewrite()
 returns trigger language plpgsql security invoker set search_path='' as $$
begin raise exception 'Original owner HOLD and custodian claims are immutable' using errcode='42501'; end $$;
revoke all on function public.rosie861_no_rewrite() from public,anon,authenticated;
create trigger rosie861_immutable before update or delete on public.rosie_intake_discrepancy_v861
 for each row execute function public.rosie861_no_rewrite();

create function public.rosie861_append_discrepancy_escalation(
 p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
 p_handoff_858_id uuid,p_owner_decision_859_id uuid,p_owner_exception_860_id uuid,
 p_intake_860_id uuid,p_kind text,p_plane text,p_source_revision text,
 p_receipt_sha256 text,p_disputed_sha256 text,p_discrepancy_code text,p_signer_id text,
 p_review_digest_sha256 text,p_review_nonce text,p_age_hours integer,
 p_aging_status text,p_issue_codes text[],p_owner_action text,p_previous_id uuid,
 p_previous_sha256 text,p_actor_staff_email text)
 returns table(outcome text,review_id uuid,accepted_at timestamptz)
 language plpgsql security invoker set search_path='' as $$
declare inserted uuid; stamped timestamptz; tip_id uuid; tip_sha text; tip_exception uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_transaction_review_id::text,861));
 if not exists(select 1 from public.rosie_master_transaction_review_v855 t
   where t.id=p_transaction_review_id and t.project_id=p_project_id
    and t.booking_id=p_booking_id and t.post_id=p_post_id)
 or not exists(select 1 from public.creative_projects p
   where p.id=p_project_id and p.source_booking_id=p_booking_id
    and (p.consent_status<>'approved_public' or p.public_publish_allowed is distinct from true))
 or not exists(select 1 from public.rosie_recovery_custody_v858 h
   where h.id=p_handoff_858_id and h.kind='conflict_escalation_handoff'
    and h.transaction_review_id=p_transaction_review_id and h.project_id=p_project_id)
 or not exists(select 1 from public.rosie_incident_continuity_v859 d
   where d.id=p_owner_decision_859_id and d.kind='owner_recovery_decision'
    and d.transaction_review_id=p_transaction_review_id and d.handoff_858_id=p_handoff_858_id)
 or not exists(select 1 from public.rosie_external_intake_custody_v860 e
   where e.id=p_owner_exception_860_id and e.kind='owner_continuity_exception_review'
    and e.transaction_review_id=p_transaction_review_id
    and e.handoff_858_id=p_handoff_858_id and e.owner_decision_859_id=p_owner_decision_859_id)
 or not exists(select 1 from public.rosie_delivery_conflict_evidence_v856 c
   where c.transaction_review_id=p_transaction_review_id and c.kind='replay_conflict_review')
 then raise exception 'Original revoked consent, open conflict and exact 855→860 owner lineage required'; end if;
 select e.id into tip_exception from public.rosie_external_intake_custody_v860 e
  where e.transaction_review_id=p_transaction_review_id
   and e.kind='owner_continuity_exception_review'
  order by e.recorded_at desc,e.id desc limit 1;
 if tip_exception is distinct from p_owner_exception_860_id then
  raise exception 'Original 860 owner exception tip moved; HOLD'; end if;
 if p_source_revision !~ '^[a-f0-9]{40}$'
  or p_aging_status not in ('CRITICAL_HOLD','ESCALATION_DUE_HOLD','REVIEW_DUE_HOLD','OPEN_UNRESOLVED_HOLD')
  or p_age_hours is null or p_age_hours<0
  or p_issue_codes is null or cardinality(p_issue_codes)>6
  or exists(select 1 from unnest(p_issue_codes) code where code not in
    ('MISSING_ORIGINAL_OWNER_EXCEPTION','MISSING_INDEPENDENT_INTAKE',
     'STALE_INDEPENDENT_INTAKE','UNRESOLVED_CUSTODIAN_DISCREPANCY',
     'OPEN_EXCEPTION_OVER_48H','OPEN_EXCEPTION_OVER_24H'))
 then raise exception 'Bounded original owner HOLD aging evidence required'; end if;
 if p_kind='signed_external_custodian_discrepancy' then
  if p_plane not in ('ai-data-platform','rosevear-comms-hub') or p_intake_860_id is null
   or p_receipt_sha256 !~ '^[a-f0-9]{64}$'
   or p_disputed_sha256 !~ '^[a-f0-9]{64}$'
   or p_discrepancy_code not in ('INTAKE_DIGEST_DISPUTED','INTAKE_OBSERVATION_STALENESS_DISPUTED')
   or (p_discrepancy_code='INTAKE_DIGEST_DISPUTED' and exists(
      select 1 from public.rosie_external_intake_custody_v860 i
      where i.id=p_intake_860_id and i.receipt_sha256=p_disputed_sha256))
   or p_signer_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$'
   or p_owner_action is not null or p_previous_id is not null
   or not exists(select 1 from public.rosie_external_intake_custody_v860 i
     where i.id=p_intake_860_id and i.kind='signed_external_intake_correlation'
      and i.plane=p_plane and i.transaction_review_id=p_transaction_review_id
      and i.handoff_858_id=p_handoff_858_id and i.owner_decision_859_id=p_owner_decision_859_id)
  then raise exception 'Exact independent external signed discrepancy claim required'; end if;
 elsif p_kind='owner_hold_escalation_review' then
  if p_plane is not null or p_intake_860_id is not null or p_receipt_sha256 is not null
   or p_disputed_sha256 is not null or p_signer_id is not null or p_discrepancy_code is not null
   or p_owner_action not in
    ('maintain_hold','request_independent_custodian_reconciliation','escalate_original_owner_incident')
  then raise exception 'Only non-authorizing original owner escalation allowed'; end if;
  select r.id,r.review_digest_sha256 into tip_id,tip_sha
   from public.rosie_intake_discrepancy_v861 r
   where r.transaction_review_id=p_transaction_review_id
    and r.kind='owner_hold_escalation_review'
   order by r.recorded_at desc,r.id desc limit 1;
  if tip_id is distinct from p_previous_id or tip_sha is distinct from p_previous_sha256
  then raise exception 'Original owner HOLD escalation chain changed; recheck tip'; end if;
 else raise exception 'Unsupported 861 evidence kind'; end if;

 insert into public.rosie_intake_discrepancy_v861(
  project_id,booking_id,post_id,transaction_review_id,handoff_858_id,
  owner_decision_859_id,owner_exception_860_id,intake_860_id,
  kind,plane,source_revision,receipt_sha256,disputed_sha256,discrepancy_code,
  signer_id,review_digest_sha256,review_nonce,age_hours,aging_status,issue_codes,
  owner_action,previous_id,previous_sha256,review_day,actor_staff_email)
 values(p_project_id,p_booking_id,p_post_id,p_transaction_review_id,p_handoff_858_id,
  p_owner_decision_859_id,p_owner_exception_860_id,p_intake_860_id,
  p_kind,p_plane,p_source_revision,p_receipt_sha256,p_disputed_sha256,p_discrepancy_code,
  p_signer_id,p_review_digest_sha256,p_review_nonce,p_age_hours,p_aging_status,p_issue_codes,
  p_owner_action,p_previous_id,p_previous_sha256,
  case when p_kind='owner_hold_escalation_review'
   then (clock_timestamp() at time zone 'UTC')::date else null end,p_actor_staff_email)
 on conflict do nothing returning id,recorded_at into inserted,stamped;
 if inserted is null then return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
 else return query select 'INSERTED'::text,inserted,stamped; end if;
end $$;
revoke all on function public.rosie861_append_discrepancy_escalation(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,text,text,
 text,text,integer,text,text[],text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.rosie861_append_discrepancy_escalation(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,text,text,
 text,text,integer,text,text[],text,uuid,text,text) to service_role;
comment on table public.rosie_intake_discrepancy_v861 is
 'Signed original-source discrepancy claims and daily chained owner HOLD reviews; no operational ACK or CONNECTED authority.';
