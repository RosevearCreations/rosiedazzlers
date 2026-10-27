-- Build 683: append-only, server-only evidence renewal and recurrence HOLD audit.
-- No customer communication, issuance, balance, refund, charge, or hold release.
create table public.gift_issuance_hold_renewal_events (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  followup_event_id uuid not null references public.gift_issuance_hold_followup_events(id),
  event_kind text not null check (event_kind in
    ('owner_renewal_requested','independent_recurrence_reassessed','owner_hold_continuity_acknowledged')),
  reason text not null check (reason in
    ('recurrence_reopened','source_superseded','followup_proof_aged','owner_requested_renewal')),
  actor_staff_user_id uuid not null references public.staff_users(id),
  auditor_staff_user_id uuid not null references public.staff_users(id),
  reference_event_id uuid references public.gift_issuance_hold_renewal_events(id),
  evidence_age_minutes integer not null check (evidence_age_minutes >= 0),
  recurrence_detected boolean not null,
  provider_checked_at timestamptz,
  provider_evidence_sha256 text check (provider_evidence_sha256 ~ '^[0-9a-f]{64}$'),
  certificate_count integer check (certificate_count between 1 and 100),
  receipt_last_seen_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  check ((event_kind='owner_renewal_requested' and reference_event_id is null
       and provider_checked_at is null and provider_evidence_sha256 is null
       and certificate_count is null and receipt_last_seen_at is null)
     or (event_kind<>'owner_renewal_requested' and reference_event_id is not null
       and provider_checked_at is not null and provider_evidence_sha256 is not null
       and certificate_count is not null and receipt_last_seen_at is not null))
);
create index gift_hold_renewal_case_clock_idx on
  public.gift_issuance_hold_renewal_events(case_id,created_at desc,id desc);
create index gift_hold_renewal_auditor_clock_idx on
  public.gift_issuance_hold_renewal_events(auditor_staff_user_id,created_at desc);
alter table public.gift_issuance_hold_renewal_events enable row level security;
revoke all on public.gift_issuance_hold_renewal_events from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_hold_renewal_events to service_role;
create trigger gift_hold_renewal_append_only before update or delete
  on public.gift_issuance_hold_renewal_events for each row
  execute function public.reject_gift_closeout_audit_change();

create function public.record_gift_hold_renewal_event(
  p_event_id uuid,p_case_id uuid,p_followup_id uuid,p_actor_id uuid,p_auditor_id uuid,
  p_action text,p_reason text,p_reference_id uuid,p_provider_check text,
  p_payment_intent text,p_currency text,p_expected_count integer,p_amount_cents bigint,
  p_evidence_sha256 text,p_checked_at timestamptz
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_followup public.gift_issuance_hold_followup_events%rowtype;
  v_latest_followup public.gift_issuance_hold_followup_events%rowtype;
  v_closeout public.gift_issuance_review_recheck_events%rowtype;
  v_latest_recheck public.gift_issuance_review_recheck_events%rowtype;
  v_source public.gift_issuance_hold_continuity_events%rowtype;
  v_latest_source public.gift_issuance_hold_continuity_events%rowtype;
  v_reconciliation public.gift_issuance_audit_alert_events%rowtype;
  v_audit public.gift_issuance_closeout_audit_events%rowtype;
  v_decision public.gift_issuance_recovery_decisions%rowtype;
  v_receipt public.gift_issuance_receipts%rowtype;
  v_last public.gift_issuance_hold_renewal_events%rowtype;
  v_prior public.gift_issuance_hold_renewal_events%rowtype;
  v_owner boolean;
  v_recurring boolean;
  v_source_current boolean;
  v_reason text;
  v_age integer;
  v_count integer;
  v_bad integer;
  v_held integer;
begin
  if p_event_id is null or p_case_id is null or p_followup_id is null or
     p_actor_id is null or p_auditor_id is null or
     p_action not in ('owner_renewal_requested','independent_recurrence_reassessed',
       'owner_hold_continuity_acknowledged') or
     p_reason not in ('recurrence_reopened','source_superseded',
       'followup_proof_aged','owner_requested_renewal')
  then raise exception 'Invalid gift HOLD renewal request'; end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Unknown gift HOLD renewal case'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'gift-issue:'||v_case.stripe_session_id,0));
  select * into v_prior from public.gift_issuance_hold_renewal_events where id=p_event_id;
  if found then
    if v_prior.case_id is distinct from p_case_id or
       v_prior.followup_event_id is distinct from p_followup_id or
       v_prior.actor_staff_user_id is distinct from p_actor_id or
       v_prior.auditor_staff_user_id is distinct from p_auditor_id or
       v_prior.event_kind is distinct from p_action or
       v_prior.reason is distinct from p_reason or
       v_prior.reference_event_id is distinct from p_reference_id or
       v_prior.provider_checked_at is distinct from p_checked_at or
       v_prior.provider_evidence_sha256 is distinct from p_evidence_sha256
    then raise exception 'Conflicting gift HOLD renewal replay'; end if;
    return pg_catalog.jsonb_build_object('id',p_event_id,'idempotent',true,
      'event_kind',p_action,'owner_hold',true,'customer_delivery_authorized',false);
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id for update;
  select * into v_followup from public.gift_issuance_hold_followup_events
    where id=p_followup_id and case_id=p_case_id and event_kind='owner_followup_closed';
  select * into v_latest_followup from public.gift_issuance_hold_followup_events
    where case_id=p_case_id order by created_at desc,id desc limit 1;
  select * into v_last from public.gift_issuance_hold_renewal_events
    where case_id=p_case_id order by created_at desc,id desc limit 1;
  select * into v_closeout from public.gift_issuance_review_recheck_events
    where id=v_followup.closeout_event_id and case_id=p_case_id
      and event_kind='owner_closeout_recorded';
  select * into v_latest_recheck from public.gift_issuance_review_recheck_events
    where case_id=p_case_id order by created_at desc,id desc limit 1;
  select * into v_source from public.gift_issuance_hold_continuity_events
    where id=v_followup.continuity_event_id and case_id=p_case_id
      and event_kind='owner_continuity_closed';
  select * into v_latest_source from public.gift_issuance_hold_continuity_events
    where case_id=p_case_id and closeout_event_id=v_closeout.id
    order by created_at desc,id desc limit 1;
  select * into v_reconciliation from public.gift_issuance_audit_alert_events
    where id=v_source.reconciliation_event_id and case_id=p_case_id
      and event_kind='owner_hold_reconciled';
  select * into v_audit from public.gift_issuance_closeout_audit_events
    where id=v_source.source_audit_event_id and case_id=p_case_id
      and event_kind='owner_audit_acknowledged';
  select * into v_decision from public.gift_issuance_recovery_decisions
    where id=v_case.decision_id;
  v_owner:=exists(select 1 from public.staff_users where id=p_actor_id
    and is_active=true and role_code='admin');
  v_recurring:=exists(select 1 from public.gift_issuance_review_followup_events
    where case_id=p_case_id and event_kind='recurrence_opened'
      and created_at>v_followup.created_at);
  v_source_current:=v_latest_followup.id is not distinct from p_followup_id and
    v_latest_source.id is not distinct from v_source.id and
    v_latest_recheck.id is not distinct from v_closeout.id;
  v_age:=greatest(0,floor(extract(epoch from (clock_timestamp()-
    coalesce(v_last.provider_checked_at,v_followup.provider_checked_at,
      v_followup.created_at)))/60)::integer);
  if v_recurring then v_reason:='recurrence_reopened';
  elsif not v_source_current or v_case.status<>'ready_for_delivery_review'
    then v_reason:='source_superseded';
  elsif v_age>=120 then v_reason:='followup_proof_aged';
  else v_reason:='owner_requested_renewal'; end if;
  if v_followup.id is null or v_closeout.id is null or v_source.id is null or
     v_reconciliation.id is null or v_audit.id is null or
     v_source.auditor_staff_user_id is distinct from p_auditor_id or
     v_followup.auditor_staff_user_id is distinct from p_auditor_id or
     v_reconciliation.auditor_staff_user_id is distinct from p_auditor_id or
     not exists(select 1 from public.staff_users where id=p_auditor_id
       and is_active=true and role_code in ('detailer','senior_detailer')) or
     p_auditor_id=v_closeout.actor_staff_user_id or
     p_auditor_id=v_case.assigned_reviewer_id or
     p_auditor_id is not distinct from v_decision.actor_staff_user_id
  then raise exception 'Independent gift HOLD renewal source or auditor changed'; end if;
  if p_action='owner_renewal_requested' then
    if not v_owner or p_actor_id=p_auditor_id or p_reference_id is not null or
       p_reason is distinct from v_reason or
       (v_last.id is not null and v_last.event_kind<>'owner_hold_continuity_acknowledged') or
       p_provider_check is not null or p_payment_intent is not null or
       p_currency is not null or p_expected_count is not null or
       p_amount_cents is not null or p_evidence_sha256 is not null or
       p_checked_at is not null
    then raise exception 'Owner renewal must open a new internal HOLD case'; end if;
  else
    if v_last.id is null or p_reference_id is distinct from v_last.id or
       v_last.followup_event_id is distinct from p_followup_id or
       v_last.reason is distinct from p_reason or p_reason is distinct from v_reason or
       v_last.auditor_staff_user_id is distinct from p_auditor_id or
       not v_source_current or
       (v_case.status<>'ready_for_delivery_review' and not v_recurring) or
       v_decision.action<>'close_verified_no_action' or
       v_decision.provider_check<>'paid_verified' or
       (select id from public.gift_issuance_recovery_decisions
         where stripe_session_id=v_case.stripe_session_id
         order by created_at desc,id desc limit 1) is distinct from v_decision.id or
       p_provider_check<>'paid_verified' or p_checked_at is null or
       p_checked_at<clock_timestamp()-interval '5 minutes' or
       p_checked_at>clock_timestamp()+interval '30 seconds' or
       p_payment_intent is distinct from v_decision.provider_payment_intent or
       pg_catalog.lower(p_currency) is distinct from pg_catalog.lower(v_decision.provider_currency) or
       p_expected_count is distinct from v_decision.provider_expected_count or
       p_amount_cents is distinct from v_decision.provider_amount_cents or
       p_evidence_sha256 is null or p_evidence_sha256 !~ '^[0-9a-f]{64}$' or
       p_evidence_sha256 is distinct from v_followup.provider_evidence_sha256 or
       p_evidence_sha256 is distinct from v_source.provider_evidence_sha256 or
       p_evidence_sha256 is distinct from v_reconciliation.provider_evidence_sha256 or
       p_evidence_sha256 is distinct from v_audit.provider_evidence_sha256
    then raise exception 'Gift recurrence, source or paid evidence changed: HOLD'; end if;
    select * into v_receipt from public.gift_issuance_receipts
      where stripe_session_id=v_case.stripe_session_id for update;
    select count(*),count(*) filter (where checkout_line_number is null or
      checkout_line_number<1 or recipient_email is null or pg_catalog.btrim(recipient_email)='' or
      stripe_payment_intent is distinct from p_payment_intent or
      pg_catalog.lower(currency) is distinct from pg_catalog.lower(p_currency) or
      purchase_context #>> '{gift_delivery,delivery_status}'
        in ('failed','review_required','processing') or
      purchase_context #>> '{gift_delivery,recipient_provider_status}'='failed' or
      purchase_context #>> '{gift_delivery,purchaser_copy_status}'='failed')
      into v_count,v_bad from public.gift_certificates
      where stripe_session_id=v_case.stripe_session_id;
    select count(*) into v_held from public.gift_issuance_webhook_events
      where stripe_session_id=v_case.stripe_session_id and observed_state='hold';
    if v_receipt.stripe_session_id is null or v_receipt.state<>'issued' or
       v_receipt.expected_count<>v_count or v_receipt.issued_count<>v_count or
       v_count<>p_expected_count or v_count<1 or v_count>100 or v_bad<>0 or v_held<>0 or
       v_followup.certificate_count<>v_count or
       v_followup.receipt_last_seen_at is distinct from v_receipt.last_seen_at or
       v_source.certificate_count<>v_count or
       v_source.receipt_last_seen_at is distinct from v_receipt.last_seen_at or
       (select count(distinct checkout_line_number) from public.gift_certificates
         where stripe_session_id=v_case.stripe_session_id)<>v_count or
       (select coalesce(max(checkout_line_number),0) from public.gift_certificates
         where stripe_session_id=v_case.stripe_session_id)<>v_count
    then raise exception 'Gift certificate or delivery evidence changed: HOLD'; end if;
    if p_action='independent_recurrence_reassessed' then
      if v_owner or p_actor_id is distinct from p_auditor_id or
         p_actor_id=v_closeout.actor_staff_user_id or
         p_actor_id=v_case.assigned_reviewer_id or
         p_actor_id is not distinct from v_decision.actor_staff_user_id or
         v_last.event_kind<>'owner_renewal_requested'
      then raise exception 'Separate assigned auditor must reassess the recurrence'; end if;
    else
      if not v_owner or v_last.event_kind<>'independent_recurrence_reassessed' or
         v_last.provider_checked_at<clock_timestamp()-interval '2 hours' or
         v_last.provider_evidence_sha256 is distinct from p_evidence_sha256 or
         v_last.certificate_count is distinct from v_count or
         v_last.receipt_last_seen_at is distinct from v_receipt.last_seen_at or
         v_last.recurrence_detected is distinct from v_recurring
      then raise exception 'Fresh separate reassessment required for owner HOLD continuity'; end if;
    end if;
  end if;
  insert into public.gift_issuance_hold_renewal_events
    (id,case_id,followup_event_id,event_kind,reason,actor_staff_user_id,
     auditor_staff_user_id,reference_event_id,evidence_age_minutes,
     recurrence_detected,provider_checked_at,provider_evidence_sha256,
     certificate_count,receipt_last_seen_at)
  values(p_event_id,p_case_id,p_followup_id,p_action,p_reason,p_actor_id,p_auditor_id,
    p_reference_id,v_age,v_recurring,p_checked_at,p_evidence_sha256,
    case when p_action='owner_renewal_requested' then null else v_count end,
    case when p_action='owner_renewal_requested' then null else v_receipt.last_seen_at end);
  return pg_catalog.jsonb_build_object('id',p_event_id,'event_kind',p_action,
    'idempotent',false,'recurrence_hold',v_recurring,'owner_hold',true,
    'customer_delivery_authorized',false,'customer_messages_sent',0,
    'payment_mutations',0,'gift_balance_mutations',0,
    'integration_events_dispatched',0);
end;
$$;
revoke all on function public.record_gift_hold_renewal_event(
  uuid,uuid,uuid,uuid,uuid,text,text,uuid,text,text,text,integer,bigint,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_hold_renewal_event(
  uuid,uuid,uuid,uuid,uuid,text,text,uuid,text,text,text,integer,bigint,text,timestamptz)
  to service_role;
