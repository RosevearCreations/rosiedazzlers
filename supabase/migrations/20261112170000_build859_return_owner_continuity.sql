-- Rosie Dazzlers 859: original-source independent signed escalation return,
-- non-authorizing owner recovery review and append-only UTC-day continuity.
-- Neither service-only custody nor a signed receipt certifies runtime CONNECTED.
create table public.rosie_incident_continuity_v859 (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete restrict,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 post_id uuid not null references public.social_post_queue(id) on delete restrict,
 transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
 prior_857_readback_id uuid not null references public.rosie_custody_readback_v857(id) on delete restrict,
 handoff_858_id uuid not null references public.rosie_recovery_custody_v858(id) on delete restrict,
 owner_export_858_id uuid not null references public.rosie_recovery_custody_v858(id) on delete restrict,
 kind text not null check(kind in ('signed_escalation_return','owner_recovery_decision','incident_continuity_checkpoint')),
 plane text check(plane in ('ai-data-platform','rosevear-comms-hub')),
 review_source_revision text not null check(review_source_revision ~ '^[a-f0-9]{40}$'),
 receipt_sha256 text check(receipt_sha256 is null or receipt_sha256 ~ '^[0-9a-f]{64}$'),
 signer_id text check(signer_id is null or signer_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'),
 receipt_observed_at timestamptz,
 review_digest_sha256 text not null check(review_digest_sha256 ~ '^[0-9a-f]{64}$'),
 review_nonce text not null unique check(review_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
 conflict_aging_status text not null check(conflict_aging_status in
  ('NO_CONFLICTS_RECORDED','OPEN_WITHIN_TARGET','OPEN_ESCALATION_DUE')),
 open_conflict_count integer not null check(open_conflict_count between 0 and 80),
 owner_action text check(owner_action in
  ('maintain_external_hold','request_independent_master_recheck','escalate_unresolved_conflicts')),
 owner_decision_859_id uuid references public.rosie_incident_continuity_v859(id) on delete restrict,
 previous_checkpoint_id uuid references public.rosie_incident_continuity_v859(id) on delete restrict,
 previous_checkpoint_sha256 text check(previous_checkpoint_sha256 is null or previous_checkpoint_sha256 ~ '^[a-f0-9]{64}$'),
 continuity_status text check(continuity_status in
  ('INITIAL_OWNER_HOLD_CHECKPOINT','CURRENT_HOLD','GAP_REVIEW_REQUIRED')),
 continuity_day date,
 actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
 recorded_at timestamptz not null default clock_timestamp(),
 constraint rosie859_kind_scope check (
  (kind='signed_escalation_return' and plane is not null
   and receipt_sha256 is not null and signer_id is not null
   and receipt_observed_at is not null and owner_action is null
   and owner_decision_859_id is null and previous_checkpoint_id is null
   and previous_checkpoint_sha256 is null and continuity_status is null and continuity_day is null)
  or (kind='owner_recovery_decision' and plane is null and receipt_sha256 is null
   and signer_id is null and receipt_observed_at is null and owner_action is not null
   and owner_decision_859_id is null and previous_checkpoint_id is null
   and previous_checkpoint_sha256 is null and continuity_status is null and continuity_day is null)
  or (kind='incident_continuity_checkpoint' and plane is null and receipt_sha256 is null
   and signer_id is null and receipt_observed_at is null and owner_action is null
   and owner_decision_859_id is not null and continuity_status is not null
   and continuity_day is not null)),
 constraint rosie859_conflict_count_integrity check(
  (open_conflict_count=0 and conflict_aging_status='NO_CONFLICTS_RECORDED')
  or (open_conflict_count>0 and conflict_aging_status in ('OPEN_WITHIN_TARGET','OPEN_ESCALATION_DUE'))),
 constraint rosie859_prev_pair check(
  (previous_checkpoint_id is null and previous_checkpoint_sha256 is null)
  or (previous_checkpoint_id is not null and previous_checkpoint_sha256 is not null))
);
create unique index rosie859_return_dedup
 on public.rosie_incident_continuity_v859(handoff_858_id,plane,receipt_sha256)
 where kind='signed_escalation_return';
create unique index rosie859_owner_decision_unique
 on public.rosie_incident_continuity_v859(transaction_review_id)
 where kind='owner_recovery_decision';
create unique index rosie859_one_daily_checkpoint
 on public.rosie_incident_continuity_v859(transaction_review_id,continuity_day)
 where kind='incident_continuity_checkpoint';
create index rosie859_timeline
 on public.rosie_incident_continuity_v859(project_id,recorded_at desc);
create index rosie859_review_reference
 on public.rosie_incident_continuity_v859(transaction_review_id,kind,recorded_at desc);
alter table public.rosie_incident_continuity_v859 enable row level security;
revoke all on public.rosie_incident_continuity_v859 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_incident_continuity_v859 to service_role;

create function public.rosie859_immutable_reject()
 returns trigger language plpgsql security invoker set search_path='' as $$
begin raise exception 'Rosie 859 original owner incident chain immutable' using errcode='42501'; end; $$;
revoke all on function public.rosie859_immutable_reject() from public,anon,authenticated;
create trigger rosie859_no_rewrite
 before update or delete on public.rosie_incident_continuity_v859
 for each row execute function public.rosie859_immutable_reject();

create function public.rosie859_append_incident_continuity(
 p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
 p_prior_857_readback_id uuid,p_handoff_858_id uuid,p_owner_export_858_id uuid,
 p_kind text,p_plane text,p_review_source_revision text,p_receipt_sha256 text,
 p_signer_id text,p_receipt_observed_at timestamptz,p_review_digest_sha256 text,
 p_review_nonce text,p_conflict_aging_status text,p_open_conflict_count integer,
 p_owner_action text,p_owner_decision_859_id uuid,p_previous_checkpoint_id uuid,
 p_previous_checkpoint_sha256 text,p_continuity_status text,p_actor_staff_email text)
 returns table(outcome text,review_id uuid,accepted_at timestamptz)
 language plpgsql security invoker set search_path='' as $$
declare inserted uuid; stamped timestamptz; conflict_total integer;
 plane_total integer; signer_total integer; digest_total integer;
 current_tip uuid; current_tip_sha text; current_tip_at timestamptz;
 expected_status text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_transaction_review_id::text,859));
 if not exists (select 1 from public.rosie_master_transaction_review_v855 t
  where t.id=p_transaction_review_id and t.project_id=p_project_id
   and t.booking_id=p_booking_id and t.post_id=p_post_id)
 or not exists (select 1 from public.creative_projects p
  where p.id=p_project_id and p.source_booking_id=p_booking_id
   and (p.consent_status<>'approved_public' or p.public_publish_allowed is distinct from true))
 or not exists (select 1 from public.social_post_queue p
  where p.id=p_post_id and p.booking_id=p_booking_id)
 or not exists (select 1 from public.rosie_custody_readback_v857 r
  where r.id=p_prior_857_readback_id and r.transaction_review_id=p_transaction_review_id
   and r.kind='owner_acceptance_readback')
 or not exists (select 1 from public.rosie_recovery_custody_v858 h
  where h.id=p_handoff_858_id and h.transaction_review_id=p_transaction_review_id
   and h.prior_857_readback_id=p_prior_857_readback_id and h.kind='conflict_escalation_handoff'
   and h.project_id=p_project_id and h.booking_id=p_booking_id and h.post_id=p_post_id)
 or not exists (select 1 from public.rosie_recovery_custody_v858 e
  where e.id=p_owner_export_858_id and e.transaction_review_id=p_transaction_review_id
   and e.prior_857_readback_id=p_prior_857_readback_id and e.kind='owner_recovery_acceptance_export'
   and e.project_id=p_project_id and e.booking_id=p_booking_id and e.post_id=p_post_id)
 then raise exception 'Original 855/857/858 source consent and handoff/export evidence required'; end if;

 select count(*)::integer into conflict_total
 from public.rosie_delivery_conflict_evidence_v856 x
 where x.transaction_review_id=p_transaction_review_id and x.kind='replay_conflict_review';
 if conflict_total<>p_open_conflict_count or conflict_total=0 or conflict_total>80
 then raise exception 'Complete still-open original source conflicts required'; end if;
 if p_review_source_revision !~ '^[a-f0-9]{40}$' then
  raise exception 'Current independent review revision required'; end if;

 if p_kind='signed_escalation_return' then
  if p_plane not in ('ai-data-platform','rosevear-comms-hub')
   or p_receipt_sha256 !~ '^[a-f0-9]{64}$'
   or p_signer_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'
   or p_owner_action is not null or p_owner_decision_859_id is not null
   or p_previous_checkpoint_id is not null or p_receipt_observed_at is null
   or p_receipt_observed_at < clock_timestamp()-interval '5 minutes'
   or p_receipt_observed_at > clock_timestamp()+interval '5 minutes'
   or p_receipt_observed_at < (select h.recorded_at-interval '5 minutes'
      from public.rosie_recovery_custody_v858 h where h.id=p_handoff_858_id)
  then raise exception 'Fresh independent signed escalation return required'; end if;
 elsif p_kind='owner_recovery_decision' then
  if p_plane is not null or p_receipt_sha256 is not null or p_signer_id is not null
   or p_receipt_observed_at is not null or p_owner_decision_859_id is not null
   or p_owner_action not in
    ('maintain_external_hold','request_independent_master_recheck','escalate_unresolved_conflicts')
  then raise exception 'Owner action must be non-authorizing HOLD only'; end if;
  select count(distinct r.plane),count(distinct lower(r.signer_id)),
   count(distinct r.receipt_sha256)
   into plane_total,signer_total,digest_total
   from public.rosie_incident_continuity_v859 r
   where r.transaction_review_id=p_transaction_review_id
    and r.handoff_858_id=p_handoff_858_id and r.owner_export_858_id=p_owner_export_858_id
    and r.kind='signed_escalation_return' and r.review_source_revision=p_review_source_revision
    and r.receipt_observed_at>=clock_timestamp()-interval '24 hours';
  if plane_total<>2 or signer_total<2 or digest_total<2 then
   raise exception 'Two distinct independently signed returns within 24 hours required'; end if;
 elsif p_kind='incident_continuity_checkpoint' then
  if p_plane is not null or p_receipt_sha256 is not null or p_signer_id is not null
   or p_receipt_observed_at is not null or p_owner_action is not null
   or not exists(select 1 from public.rosie_incident_continuity_v859 d
    where d.id=p_owner_decision_859_id and d.kind='owner_recovery_decision'
     and d.transaction_review_id=p_transaction_review_id
     and d.handoff_858_id=p_handoff_858_id and d.owner_export_858_id=p_owner_export_858_id)
  then raise exception 'Original owner HOLD review required for continuity'; end if;
  select c.id,c.review_digest_sha256,c.recorded_at into current_tip,current_tip_sha,current_tip_at
    from public.rosie_incident_continuity_v859 c
    where c.transaction_review_id=p_transaction_review_id and c.kind='incident_continuity_checkpoint'
    order by c.recorded_at desc,c.id desc limit 1;
  if current_tip is distinct from p_previous_checkpoint_id
   or current_tip_sha is distinct from p_previous_checkpoint_sha256 then
   raise exception 'Immutable continuity predecessor changed; retry from latest source tip'; end if;
  expected_status:=case when current_tip is null then 'INITIAL_OWNER_HOLD_CHECKPOINT'
   when clock_timestamp()-current_tip_at>interval '48 hours' then 'GAP_REVIEW_REQUIRED'
   else 'CURRENT_HOLD' end;
  if p_continuity_status is distinct from expected_status then
   raise exception 'Original incident continuity gap assessment drifted'; end if;
 else raise exception 'Unsupported owner recovery or incident continuity action'; end if;

 insert into public.rosie_incident_continuity_v859
 (project_id,booking_id,post_id,transaction_review_id,prior_857_readback_id,
  handoff_858_id,owner_export_858_id,kind,plane,review_source_revision,receipt_sha256,
  signer_id,receipt_observed_at,review_digest_sha256,review_nonce,
  conflict_aging_status,open_conflict_count,owner_action,owner_decision_859_id,
  previous_checkpoint_id,previous_checkpoint_sha256,continuity_status,continuity_day,actor_staff_email)
 values
 (p_project_id,p_booking_id,p_post_id,p_transaction_review_id,p_prior_857_readback_id,
  p_handoff_858_id,p_owner_export_858_id,p_kind,p_plane,p_review_source_revision,p_receipt_sha256,
  p_signer_id,p_receipt_observed_at,p_review_digest_sha256,p_review_nonce,
  p_conflict_aging_status,p_open_conflict_count,p_owner_action,p_owner_decision_859_id,
  p_previous_checkpoint_id,p_previous_checkpoint_sha256,p_continuity_status,
  case when p_kind='incident_continuity_checkpoint'
   then (clock_timestamp() at time zone 'UTC')::date else null end,p_actor_staff_email)
 on conflict do nothing returning id,recorded_at into inserted,stamped;
 if inserted is null then
  return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
 else return query select 'INSERTED'::text,inserted,stamped; end if;
end; $$;
revoke all on function public.rosie859_append_incident_continuity(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz,text,
 text,text,integer,text,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.rosie859_append_incident_continuity(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz,text,
 text,text,integer,text,uuid,uuid,text,text,text) to service_role;
comment on table public.rosie_incident_continuity_v859 is
 'Private append-only original incident independent return review, owner HOLD decision and UTC-day continuity; no CONNECTED, SLA closure, provider or receiver action is authorized.';
