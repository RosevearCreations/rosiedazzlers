-- Build 681: post-B680 HOLD escalation, separate independent recheck and
-- owner closeout continuity. Deliberately NO customer dispatch/release pathway.
create table public.gift_issuance_hold_continuity_events (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  closeout_event_id uuid not null references public.gift_issuance_review_recheck_events(id),
  reconciliation_event_id uuid not null references public.gift_issuance_audit_alert_events(id),
  source_audit_event_id uuid not null references public.gift_issuance_closeout_audit_events(id),
  event_kind text not null check (event_kind in
    ('hold_escalated','independent_recheck_attested','owner_continuity_closed')),
  escalation_reason text not null check (escalation_reason in
    ('case_reopened','recurrence_reopened','evidence_expired','owner_requested_recheck')),
  actor_staff_user_id uuid not null references public.staff_users(id),
  auditor_staff_user_id uuid not null references public.staff_users(id),
  reference_event_id uuid references public.gift_issuance_hold_continuity_events(id),
  age_minutes integer not null check (age_minutes>=0),
  provider_checked_at timestamptz,
  provider_evidence_sha256 text check (provider_evidence_sha256 ~ '^[0-9a-f]{64}$'),
  certificate_count integer check (certificate_count between 1 and 100),
  receipt_last_seen_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  check ((event_kind='hold_escalated' and reference_event_id is null and
          provider_checked_at is null and provider_evidence_sha256 is null and
          certificate_count is null and receipt_last_seen_at is null)
      or (event_kind<>'hold_escalated' and reference_event_id is not null and
          provider_checked_at is not null and provider_evidence_sha256 is not null and
          certificate_count is not null and receipt_last_seen_at is not null))
);
create index gift_hold_continuity_case_clock_idx on
  public.gift_issuance_hold_continuity_events(case_id,created_at desc,id desc);
create index gift_hold_continuity_auditor_idx on
  public.gift_issuance_hold_continuity_events(auditor_staff_user_id,created_at desc);
alter table public.gift_issuance_hold_continuity_events enable row level security;
revoke all on public.gift_issuance_hold_continuity_events from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_hold_continuity_events to service_role;
create trigger gift_hold_continuity_append_only before update or delete
  on public.gift_issuance_hold_continuity_events for each row
  execute function public.reject_gift_closeout_audit_change();

create function public.record_gift_hold_continuity_event(
  p_event_id uuid,p_case_id uuid,p_closeout_id uuid,p_reconciliation_id uuid,
  p_source_audit_id uuid,p_actor_id uuid,p_auditor_id uuid,p_action text,
  p_reason text,p_reference_id uuid,p_provider_check text,p_payment_intent text,
  p_currency text,p_expected_count integer,p_amount_cents bigint,
  p_evidence_sha256 text,p_checked_at timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_closeout public.gift_issuance_review_recheck_events%rowtype;
  v_latest_recheck public.gift_issuance_review_recheck_events%rowtype;
  v_b680 public.gift_issuance_audit_alert_events%rowtype;
  v_latest_b680 public.gift_issuance_audit_alert_events%rowtype;
  v_audit public.gift_issuance_closeout_audit_events%rowtype;
  v_latest_audit public.gift_issuance_closeout_audit_events%rowtype;
  v_last public.gift_issuance_hold_continuity_events%rowtype;
  v_prior public.gift_issuance_hold_continuity_events%rowtype;
  v_decision public.gift_issuance_recovery_decisions%rowtype;
  v_receipt public.gift_issuance_receipts%rowtype;
  v_owner boolean;
  v_reopened boolean;
  v_reason text;
  v_age integer;
  v_count integer;
  v_bad integer;
  v_held integer;
  v_aging_clock timestamptz;
begin
  if p_event_id is null or p_case_id is null or p_closeout_id is null
     or p_reconciliation_id is null or p_source_audit_id is null
     or p_actor_id is null or p_auditor_id is null
     or p_action not in ('hold_escalated','independent_recheck_attested','owner_continuity_closed')
     or p_reason not in ('case_reopened','recurrence_reopened','evidence_expired','owner_requested_recheck')
  then raise exception 'Malformed gift HOLD continuity request'; end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Unknown gift HOLD case'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gift-issue:'||v_case.stripe_session_id,0));
  select * into v_prior from public.gift_issuance_hold_continuity_events where id=p_event_id;
  if found then
    if v_prior.case_id is distinct from p_case_id
       or v_prior.closeout_event_id is distinct from p_closeout_id
       or v_prior.reconciliation_event_id is distinct from p_reconciliation_id
       or v_prior.source_audit_event_id is distinct from p_source_audit_id
       or v_prior.actor_staff_user_id is distinct from p_actor_id
       or v_prior.auditor_staff_user_id is distinct from p_auditor_id
       or v_prior.event_kind is distinct from p_action
       or v_prior.escalation_reason is distinct from p_reason
       or v_prior.reference_event_id is distinct from p_reference_id
       or v_prior.provider_checked_at is distinct from p_checked_at
       or v_prior.provider_evidence_sha256 is distinct from p_evidence_sha256
    then raise exception 'Conflicting HOLD continuity replay'; end if;
    return pg_catalog.jsonb_build_object('id',p_event_id,'event_kind',p_action,
      'idempotent',true,'owner_hold',true,'customer_delivery_authorized',false);
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id for update;
  select * into v_closeout from public.gift_issuance_review_recheck_events
    where id=p_closeout_id and case_id=p_case_id and event_kind='owner_closeout_recorded';
  select * into v_latest_recheck from public.gift_issuance_review_recheck_events
    where case_id=p_case_id order by created_at desc,id desc limit 1;
  select * into v_b680 from public.gift_issuance_audit_alert_events
    where id=p_reconciliation_id and case_id=p_case_id and closeout_event_id=p_closeout_id
      and event_kind='owner_hold_reconciled';
  select * into v_latest_b680 from public.gift_issuance_audit_alert_events
    where case_id=p_case_id and closeout_event_id=p_closeout_id
    order by created_at desc,id desc limit 1;
  select * into v_audit from public.gift_issuance_closeout_audit_events
    where id=p_source_audit_id and case_id=p_case_id and closeout_event_id=p_closeout_id
      and event_kind='owner_audit_acknowledged';
  select * into v_latest_audit from public.gift_issuance_closeout_audit_events
    where case_id=p_case_id and closeout_event_id=p_closeout_id
    order by created_at desc,id desc limit 1;
  select * into v_last from public.gift_issuance_hold_continuity_events
    where case_id=p_case_id and closeout_event_id=p_closeout_id
    order by created_at desc,id desc limit 1;
  select * into v_decision from public.gift_issuance_recovery_decisions where id=v_case.decision_id;
  v_owner:=exists(select 1 from public.staff_users where id=p_actor_id
    and is_active=true and role_code='admin');
  v_reopened:=exists(select 1 from public.gift_issuance_review_followup_events
    where case_id=p_case_id and event_kind='recurrence_opened'
      and created_at>v_closeout.created_at);
  v_aging_clock:=coalesce(v_last.provider_checked_at,v_audit.provider_checked_at,v_audit.created_at,
    v_closeout.created_at);
  v_age:=greatest(0,floor(extract(epoch from
    (clock_timestamp()-v_aging_clock))/60)::integer);
  if v_case.status<>'ready_for_delivery_review'
     or v_latest_recheck.id is distinct from p_closeout_id then v_reason:='case_reopened';
  elsif v_reopened then v_reason:='recurrence_reopened';
  elsif v_age>=120 then v_reason:='evidence_expired';
  else v_reason:='owner_requested_recheck'; end if;
  if v_closeout.id is null or v_b680.id is null or v_audit.id is null
     or v_latest_b680.id is distinct from v_b680.id
     or v_b680.source_audit_event_id is distinct from v_audit.id
     or v_b680.auditor_staff_user_id is distinct from p_auditor_id
     or v_latest_audit.id is distinct from v_audit.id
     or not exists(select 1 from public.staff_users where id=p_auditor_id
       and is_active=true and role_code in ('detailer','senior_detailer'))
     or p_auditor_id=v_closeout.actor_staff_user_id
     or p_auditor_id=v_case.assigned_reviewer_id
     or p_auditor_id is not distinct from v_decision.actor_staff_user_id
  then raise exception 'HOLD source, separate auditor or reconciliation changed'; end if;

  if p_action='hold_escalated' then
    if not v_owner or p_actor_id=p_auditor_id or p_reference_id is not null
       or p_reason is distinct from v_reason
       or (v_last.id is not null and v_last.event_kind<>'owner_continuity_closed')
       or p_provider_check is not null or p_payment_intent is not null
       or p_currency is not null or p_expected_count is not null
       or p_amount_cents is not null or p_evidence_sha256 is not null
       or p_checked_at is not null
    then raise exception 'Owner escalation requires current role, evidence and HOLD reason'; end if;
  else
    if v_last.id is null or p_reference_id is distinct from v_last.id
       or v_last.auditor_staff_user_id is distinct from p_auditor_id
       or v_last.reconciliation_event_id is distinct from p_reconciliation_id
       or v_last.source_audit_event_id is distinct from p_source_audit_id
       or v_last.escalation_reason is distinct from p_reason
       or v_case.status<>'ready_for_delivery_review'
       or v_latest_recheck.id is distinct from p_closeout_id or v_reopened
       or v_decision.action<>'close_verified_no_action'
       or v_decision.provider_check<>'paid_verified'
       or (select id from public.gift_issuance_recovery_decisions
         where stripe_session_id=v_case.stripe_session_id
         order by created_at desc,id desc limit 1) is distinct from v_decision.id
       or p_provider_check<>'paid_verified' or p_checked_at is null
       or p_checked_at<clock_timestamp()-interval '5 minutes'
       or p_checked_at>clock_timestamp()+interval '30 seconds'
       or p_payment_intent is distinct from v_decision.provider_payment_intent
       or pg_catalog.lower(p_currency) is distinct from pg_catalog.lower(v_decision.provider_currency)
       or p_expected_count is distinct from v_decision.provider_expected_count
       or p_amount_cents is distinct from v_decision.provider_amount_cents
       or p_evidence_sha256 is null or p_evidence_sha256 !~ '^[0-9a-f]{64}$'
       or p_evidence_sha256 is distinct from v_audit.provider_evidence_sha256
       or p_evidence_sha256 is distinct from v_b680.provider_evidence_sha256
    then raise exception 'Current case or paid provider proof failed: HOLD retained'; end if;
    select * into v_receipt from public.gift_issuance_receipts
      where stripe_session_id=v_case.stripe_session_id for update;
    select count(*),count(*) filter (where checkout_line_number is null
      or checkout_line_number<1 or recipient_email is null or pg_catalog.btrim(recipient_email)=''
      or stripe_payment_intent is distinct from p_payment_intent
      or pg_catalog.lower(currency) is distinct from pg_catalog.lower(p_currency)
      or purchase_context #>> '{gift_delivery,delivery_status}'
        in ('failed','review_required','processing')
      or purchase_context #>> '{gift_delivery,recipient_provider_status}'='failed'
      or purchase_context #>> '{gift_delivery,purchaser_copy_status}'='failed')
      into v_count,v_bad from public.gift_certificates
      where stripe_session_id=v_case.stripe_session_id;
    select count(*) into v_held from public.gift_issuance_webhook_events
      where stripe_session_id=v_case.stripe_session_id and observed_state='hold';
    if v_receipt.stripe_session_id is null or v_receipt.state<>'issued'
       or v_receipt.expected_count<>v_count or v_receipt.issued_count<>v_count
       or v_count<>p_expected_count or v_count<1 or v_count>100
       or v_bad<>0 or v_held<>0 or v_audit.certificate_count<>v_count
       or v_audit.receipt_last_seen_at is distinct from v_receipt.last_seen_at
       or (select count(distinct checkout_line_number) from public.gift_certificates
         where stripe_session_id=v_case.stripe_session_id)<>v_count
       or (select coalesce(max(checkout_line_number),0) from public.gift_certificates
         where stripe_session_id=v_case.stripe_session_id)<>v_count
    then raise exception 'Certificate issuance or delivery changed: keep HOLD'; end if;
    if p_action='independent_recheck_attested' then
      if v_owner or p_actor_id is distinct from p_auditor_id
         or p_actor_id=v_closeout.actor_staff_user_id
         or p_actor_id=v_case.assigned_reviewer_id
         or p_actor_id is not distinct from v_decision.actor_staff_user_id
         or v_last.event_kind<>'hold_escalated'
      then raise exception 'Independent recheck must be signed by separate auditor'; end if;
    else
      if not v_owner or v_last.event_kind<>'independent_recheck_attested'
         or v_last.provider_checked_at<clock_timestamp()-interval '2 hours'
         or v_last.provider_evidence_sha256 is distinct from p_evidence_sha256
         or v_last.certificate_count is distinct from v_count
         or v_last.receipt_last_seen_at is distinct from v_receipt.last_seen_at
      then raise exception 'Owner closure requires fresh independent recheck'; end if;
    end if;
  end if;
  insert into public.gift_issuance_hold_continuity_events
    (id,case_id,closeout_event_id,reconciliation_event_id,source_audit_event_id,
     event_kind,escalation_reason,actor_staff_user_id,auditor_staff_user_id,
     reference_event_id,age_minutes,provider_checked_at,provider_evidence_sha256,
     certificate_count,receipt_last_seen_at)
  values(p_event_id,p_case_id,p_closeout_id,p_reconciliation_id,p_source_audit_id,
    p_action,p_reason,p_actor_id,p_auditor_id,p_reference_id,v_age,p_checked_at,
    p_evidence_sha256,case when p_action='hold_escalated' then null else v_count end,
    case when p_action='hold_escalated' then null else v_receipt.last_seen_at end);
  return pg_catalog.jsonb_build_object('id',p_event_id,'event_kind',p_action,
    'idempotent',false,'owner_hold',true,'customer_delivery_authorized',false,
    'customer_messages_sent',0,'payment_mutations',0,'gift_balance_mutations',0);
end;
$$;
revoke all on function public.record_gift_hold_continuity_event(
  uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,uuid,text,text,text,integer,bigint,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_hold_continuity_event(
  uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,uuid,text,text,text,integer,bigint,text,timestamptz)
  to service_role;
