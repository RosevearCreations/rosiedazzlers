-- Build 680: internal-only recurrence alerts, independent renewal aging and
-- owner HOLD reconciliation. No notification dispatch or gift/payment mutation.
create table public.gift_issuance_audit_alert_events (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  closeout_event_id uuid not null references public.gift_issuance_review_recheck_events(id),
  event_kind text not null check (event_kind in
    ('alert_opened','renewal_requested','independent_renewal_attested','owner_hold_reconciled')),
  actor_staff_user_id uuid not null references public.staff_users(id),
  auditor_staff_user_id uuid not null references public.staff_users(id),
  reference_event_id uuid references public.gift_issuance_audit_alert_events(id),
  source_audit_event_id uuid references public.gift_issuance_closeout_audit_events(id),
  alert_reason text not null check (alert_reason in
    ('case_reopened','recurrence_reopened','watch_unassigned','evidence_renewal_missing',
     'independent_review_due','owner_ack_pending','evidence_aging')),
  evidence_age_minutes integer not null check (evidence_age_minutes >= 0),
  provider_checked_at timestamptz,
  provider_evidence_sha256 text check (provider_evidence_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default clock_timestamp(),
  check ((event_kind in ('alert_opened','renewal_requested') and
          provider_checked_at is null and provider_evidence_sha256 is null)
     or (event_kind in ('independent_renewal_attested','owner_hold_reconciled') and
          provider_checked_at is not null and provider_evidence_sha256 is not null))
);
create index gift_audit_alert_case_clock_idx
  on public.gift_issuance_audit_alert_events(case_id,created_at desc,id desc);
create index gift_audit_alert_auditor_clock_idx
  on public.gift_issuance_audit_alert_events(auditor_staff_user_id,created_at desc);
create unique index gift_audit_alert_once_per_source_idx
  on public.gift_issuance_audit_alert_events(closeout_event_id,
    coalesce(source_audit_event_id,'00000000-0000-0000-0000-000000000000'::uuid))
  where event_kind='alert_opened';
alter table public.gift_issuance_audit_alert_events enable row level security;
revoke all on public.gift_issuance_audit_alert_events from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_audit_alert_events to service_role;
create trigger gift_audit_alert_append_only
  before update or delete on public.gift_issuance_audit_alert_events
  for each row execute function public.reject_gift_closeout_audit_change();

create or replace function public.record_gift_audit_alert_event(
  p_event_id uuid,p_case_id uuid,p_closeout_id uuid,p_actor_id uuid,p_auditor_id uuid,
  p_action text,p_reference_id uuid,p_source_audit_id uuid,p_alert_reason text,
  p_provider_check text,p_payment_intent text,p_currency text,p_expected_count integer,
  p_amount_cents bigint,p_evidence_sha256 text,p_checked_at timestamptz
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_closeout public.gift_issuance_review_recheck_events%rowtype;
  v_latest_recheck public.gift_issuance_review_recheck_events%rowtype;
  v_audit public.gift_issuance_closeout_audit_events%rowtype;
  v_last public.gift_issuance_audit_alert_events%rowtype;
  v_prior public.gift_issuance_audit_alert_events%rowtype;
  v_decision public.gift_issuance_recovery_decisions%rowtype;
  v_receipt public.gift_issuance_receipts%rowtype;
  v_reason text;
  v_age integer;
  v_count integer;
  v_bad integer;
  v_held integer;
  v_owner boolean;
  v_reopened boolean;
begin
  if p_event_id is null or p_case_id is null or p_closeout_id is null
     or p_actor_id is null or p_auditor_id is null or p_action not in
       ('alert_opened','renewal_requested','independent_renewal_attested','owner_hold_reconciled')
     or p_alert_reason not in
       ('case_reopened','recurrence_reopened','watch_unassigned','evidence_renewal_missing',
        'independent_review_due','owner_ack_pending','evidence_aging') then
    raise exception 'Malformed gift audit alert';
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Unknown gift case'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gift-issue:'||v_case.stripe_session_id,0));
  select * into v_prior from public.gift_issuance_audit_alert_events where id=p_event_id;
  if found then
    if v_prior.case_id is distinct from p_case_id
       or v_prior.closeout_event_id is distinct from p_closeout_id
       or v_prior.actor_staff_user_id is distinct from p_actor_id
       or v_prior.auditor_staff_user_id is distinct from p_auditor_id
       or v_prior.event_kind is distinct from p_action
       or v_prior.reference_event_id is distinct from p_reference_id
       or v_prior.source_audit_event_id is distinct from p_source_audit_id
       or v_prior.alert_reason is distinct from p_alert_reason
       or v_prior.provider_checked_at is distinct from p_checked_at
       or v_prior.provider_evidence_sha256 is distinct from p_evidence_sha256 then
      raise exception 'Conflicting alert event replay';
    end if;
    return pg_catalog.jsonb_build_object('id',p_event_id,'idempotent',true,
      'event_kind',p_action,'owner_hold',true,'customer_messages_sent',0);
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id for update;
  select * into v_closeout from public.gift_issuance_review_recheck_events
    where id=p_closeout_id and case_id=p_case_id and event_kind='owner_closeout_recorded';
  if v_closeout.id is null then raise exception 'No source-linked owner closeout'; end if;
  select * into v_latest_recheck from public.gift_issuance_review_recheck_events
    where case_id=p_case_id order by created_at desc,id desc limit 1;
  select * into v_audit from public.gift_issuance_closeout_audit_events
    where case_id=p_case_id and closeout_event_id=p_closeout_id
    order by created_at desc,id desc limit 1;
  select * into v_last from public.gift_issuance_audit_alert_events
    where case_id=p_case_id and closeout_event_id=p_closeout_id
    order by created_at desc,id desc limit 1;
  select * into v_decision from public.gift_issuance_recovery_decisions where id=v_case.decision_id;
  v_owner:=exists(select 1 from public.staff_users where id=p_actor_id
    and is_active=true and role_code='admin');
  v_reopened:=exists(select 1 from public.gift_issuance_review_followup_events
    where case_id=p_case_id and event_kind='recurrence_opened'
      and created_at>v_closeout.created_at);
  v_age:=greatest(0,floor(extract(epoch from
    (clock_timestamp()-coalesce(v_audit.provider_checked_at,v_audit.created_at,
      v_closeout.created_at)))/60)::integer);
  if v_case.status<>'ready_for_delivery_review'
     or v_latest_recheck.id is distinct from p_closeout_id then
    v_reason:='case_reopened';
  elsif v_reopened then v_reason:='recurrence_reopened';
  elsif v_audit.id is null then v_reason:='watch_unassigned';
  elsif v_audit.event_kind='watch_opened' then v_reason:='evidence_renewal_missing';
  elsif v_audit.event_kind='evidence_renewed' then v_reason:='independent_review_due';
  elsif v_audit.event_kind='independent_audit_recorded' then v_reason:='owner_ack_pending';
  elsif v_audit.provider_checked_at<clock_timestamp()-interval '2 hours'
     then v_reason:='evidence_aging';
  else v_reason:='no_hold';
  end if;
  if p_action='alert_opened' then
    if not v_owner or v_reason='no_hold' or p_alert_reason is distinct from v_reason
       or p_reference_id is not null or p_source_audit_id is distinct from v_audit.id
       or p_provider_check is not null or p_evidence_sha256 is not null
       or p_checked_at is not null or p_payment_intent is not null
       or p_currency is not null or p_expected_count is not null
       or p_amount_cents is not null or p_auditor_id=p_actor_id
       or p_auditor_id=v_case.assigned_reviewer_id
       or p_auditor_id is distinct from
         (select auditor_staff_user_id from public.gift_issuance_closeout_audit_events
          where case_id=p_case_id and closeout_event_id=p_closeout_id
            and event_kind='watch_opened' limit 1)
       or (v_last.id is not null and (v_last.event_kind<>'owner_hold_reconciled'
           or v_last.source_audit_event_id is not distinct from p_source_audit_id)) then
      raise exception 'Alert requires a new actual owner HOLD and a separate assigned auditor';
    end if;
  else
    if v_last.id is null or p_reference_id is distinct from v_last.id
       or v_last.auditor_staff_user_id is distinct from p_auditor_id
       or v_last.alert_reason is distinct from p_alert_reason then
      raise exception 'Alert handoff references are stale';
    end if;
    if p_action='renewal_requested' then
      if not v_owner or v_last.event_kind<>'alert_opened'
         or p_source_audit_id is distinct from v_audit.id
         or p_provider_check is not null or p_evidence_sha256 is not null
         or p_checked_at is not null or p_payment_intent is not null
         or p_currency is not null or p_expected_count is not null
         or p_amount_cents is not null then
        raise exception 'Only owner can request current independent renewal';
      end if;
    else
      if p_provider_check<>'paid_verified' or p_checked_at is null
         or p_checked_at<clock_timestamp()-interval '5 minutes'
         or p_checked_at>clock_timestamp()+interval '30 seconds'
         or p_payment_intent is distinct from v_decision.provider_payment_intent
         or pg_catalog.lower(p_currency) is distinct from pg_catalog.lower(v_decision.provider_currency)
         or p_expected_count is distinct from v_decision.provider_expected_count
         or p_amount_cents is distinct from v_decision.provider_amount_cents
         or p_evidence_sha256 is null or p_evidence_sha256 !~ '^[0-9a-f]{64}$'
         or v_case.status<>'ready_for_delivery_review'
         or v_latest_recheck.id is distinct from p_closeout_id or v_reopened
         or v_decision.action<>'close_verified_no_action'
         or v_decision.provider_check<>'paid_verified' or
           (select id from public.gift_issuance_recovery_decisions
            where stripe_session_id=v_case.stripe_session_id
            order by created_at desc,id desc limit 1) is distinct from v_decision.id
         or v_audit.provider_checked_at<clock_timestamp()-interval '2 hours'
         or v_audit.provider_evidence_sha256 is distinct from p_evidence_sha256 then
        raise exception 'Live renewal payment or independent evidence is stale: owner HOLD';
      end if;
      select * into v_receipt from public.gift_issuance_receipts
        where stripe_session_id=v_case.stripe_session_id for update;
      select count(*),count(*) filter (where checkout_line_number is null
        or checkout_line_number<1 or recipient_email is null
        or pg_catalog.btrim(recipient_email)=''
        or stripe_payment_intent is distinct from p_payment_intent
        or pg_catalog.lower(currency) is distinct from pg_catalog.lower(p_currency)
        or purchase_context #>> '{gift_delivery,delivery_status}'
          in ('failed','review_required','processing')
        or purchase_context #>> '{gift_delivery,recipient_provider_status}'='failed'
        or purchase_context #>> '{gift_delivery,purchaser_copy_status}'='failed')
        into v_count,v_bad
        from public.gift_certificates where stripe_session_id=v_case.stripe_session_id;
      select count(*) into v_held from public.gift_issuance_webhook_events
        where stripe_session_id=v_case.stripe_session_id and observed_state='hold';
      if v_receipt.stripe_session_id is null or v_receipt.state<>'issued'
         or v_receipt.expected_count<>v_count or v_receipt.issued_count<>v_count
         or v_count<>p_expected_count or v_count<1 or v_count>100
         or v_audit.certificate_count<>v_count
         or v_audit.receipt_last_seen_at is distinct from v_receipt.last_seen_at
         or v_bad<>0 or v_held<>0
         or (select count(distinct checkout_line_number) from public.gift_certificates
           where stripe_session_id=v_case.stripe_session_id)<>v_count
         or (select coalesce(max(checkout_line_number),0) from public.gift_certificates
           where stripe_session_id=v_case.stripe_session_id)<>v_count then
        raise exception 'Certificate or delivery evidence no longer matches: owner HOLD';
      end if;
      if p_action='independent_renewal_attested' then
        if v_owner or p_actor_id is distinct from p_auditor_id
           or p_actor_id=v_case.assigned_reviewer_id
           or p_actor_id=v_closeout.actor_staff_user_id
           or p_actor_id is not distinct from v_decision.actor_staff_user_id
           or not exists(select 1 from public.staff_users where id=p_actor_id
             and is_active=true and role_code in ('senior_detailer','detailer'))
           or v_last.event_kind<>'renewal_requested'
           or v_audit.event_kind<>'independent_audit_recorded'
           or v_audit.created_at<=v_last.created_at
           or p_source_audit_id is distinct from v_audit.id then
          raise exception 'An independent post-request B679 audit is required';
        end if;
      else
        if not v_owner or v_last.event_kind<>'independent_renewal_attested'
           or v_audit.event_kind<>'owner_audit_acknowledged'
           or v_audit.reference_event_id is distinct from v_last.source_audit_event_id
           or v_audit.created_at<=v_last.created_at
           or p_source_audit_id is distinct from v_audit.id then
          raise exception 'Owner HOLD cannot be reconciled without current independent renewal';
        end if;
      end if;
    end if;
  end if;
  insert into public.gift_issuance_audit_alert_events
    (id,case_id,closeout_event_id,event_kind,actor_staff_user_id,auditor_staff_user_id,
     reference_event_id,source_audit_event_id,alert_reason,evidence_age_minutes,
     provider_checked_at,provider_evidence_sha256)
  values(p_event_id,p_case_id,p_closeout_id,p_action,p_actor_id,p_auditor_id,
    p_reference_id,p_source_audit_id,p_alert_reason,v_age,p_checked_at,p_evidence_sha256);
  return pg_catalog.jsonb_build_object('id',p_event_id,'event_kind',p_action,
    'idempotent',false,'owner_hold',true,'customer_delivery_authorized',false,
    'customer_messages_sent',0,'payment_mutations',0,'gift_balance_mutations',0);
end;
$$;
revoke all on function public.record_gift_audit_alert_event(
  uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,text,text,text,text,integer,bigint,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_audit_alert_event(
  uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,text,text,text,text,integer,bigint,text,timestamptz)
  to service_role;
