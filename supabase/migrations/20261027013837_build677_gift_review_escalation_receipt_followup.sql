-- Build 677: immutable owner escalation, safe handoff receipt, recurrence follow-up.
-- This ledger never sends delivery, changes credit or marks a gift issued.
create table if not exists public.gift_issuance_review_followup_events (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  event_kind text not null check (event_kind in
    ('overdue_escalated','handoff_receipt_confirmed','recurrence_opened','recurrence_followup_recorded')),
  actor_staff_user_id uuid not null references public.staff_users(id),
  case_version integer not null check (case_version >= 1),
  reference_event_id uuid,
  reason_code text not null check (reason_code in
    ('reviewer_overdue','owner_receipt_acknowledged','overdue_review',
     'handoff_not_received','evidence_changed','delivery_attention','recurring_exception',
     'hold_continues','recheck_requested','closed_no_dispatch')),
  due_at_snapshot timestamptz not null,
  decision_evidence_age_hours integer,
  created_at timestamptz not null default clock_timestamp(),
  check ((event_kind = 'overdue_escalated' and reference_event_id is null)
    or (event_kind <> 'overdue_escalated' and reference_event_id is not null))
);
create index if not exists gift_issuance_review_followup_events_case_idx
  on public.gift_issuance_review_followup_events(case_id,created_at desc,id desc);
create unique index if not exists gift_review_one_escalation_per_version_idx
  on public.gift_issuance_review_followup_events(case_id,case_version)
  where event_kind='overdue_escalated';
create unique index if not exists gift_review_one_receipt_per_review_idx
  on public.gift_issuance_review_followup_events(reference_event_id)
  where event_kind='handoff_receipt_confirmed';
alter table public.gift_issuance_review_followup_events enable row level security;
revoke all on public.gift_issuance_review_followup_events from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_review_followup_events to service_role;

create or replace function public.reject_gift_review_followup_change()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  raise exception 'Gift review escalation, receipt and recurrence evidence is append-only';
  return null;
end;
$$;
revoke all on function public.reject_gift_review_followup_change() from public,anon,authenticated;
drop trigger if exists gift_review_followup_append_only on public.gift_issuance_review_followup_events;
create trigger gift_review_followup_append_only
  before update or delete on public.gift_issuance_review_followup_events
  for each row execute function public.reject_gift_review_followup_change();

create or replace function public.record_gift_review_followup_event(
  p_event_id uuid,p_case_id uuid,p_actor_id uuid,p_action text,
  p_reason_code text,p_expected_version integer,p_reference_event_id uuid
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_owner public.gift_issuance_recovery_decisions%rowtype;
  v_prior public.gift_issuance_review_followup_events%rowtype;
  v_last public.gift_issuance_review_followup_events%rowtype;
  v_review public.gift_issuance_review_events%rowtype;
  v_receipt public.gift_issuance_receipts%rowtype;
  v_count integer;
  v_bad integer;
  v_attention integer;
  v_held integer;
  v_age integer;
begin
  if p_event_id is null or p_case_id is null or p_actor_id is null
    or p_expected_version is null or p_expected_version < 1
    or p_action not in ('overdue_escalated','handoff_receipt_confirmed',
      'recurrence_opened','recurrence_followup_recorded') then
    raise exception 'Invalid gift review follow-up request';
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Independent review case absent'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gift-issue:' || v_case.stripe_session_id,0));
  select * into v_prior from public.gift_issuance_review_followup_events where id=p_event_id;
  if found then
    if v_prior.case_id is distinct from p_case_id
       or v_prior.actor_staff_user_id is distinct from p_actor_id
       or v_prior.event_kind is distinct from p_action
       or v_prior.reason_code is distinct from p_reason_code
       or v_prior.case_version is distinct from p_expected_version
       or v_prior.reference_event_id is distinct from p_reference_event_id then
      raise exception 'Follow-up event replay does not match original evidence';
    end if;
    return pg_catalog.jsonb_build_object('event_id',p_event_id,'case_id',p_case_id,
      'event_kind',p_action,'idempotent',true,'customer_messages_sent',0);
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id for update;
  select * into v_owner from public.gift_issuance_recovery_decisions where id=v_case.decision_id;
  if v_case.version <> p_expected_version or not exists (
    select 1 from public.staff_users
    where id=p_actor_id and is_active=true and role_code='admin')
    or (select id from public.gift_issuance_recovery_decisions
        where stripe_session_id=v_case.stripe_session_id
        order by created_at desc,id desc limit 1) is distinct from v_owner.id then
    raise exception 'Stale case, unverified owner or superseded payment decision';
  end if;
  v_age:=greatest(0,floor(extract(epoch from (now()-v_owner.checked_at))/3600)::integer);
  select * into v_last from public.gift_issuance_review_followup_events
    where case_id=p_case_id order by created_at desc,id desc limit 1;

  if p_action='overdue_escalated' then
    if p_reason_code <> 'reviewer_overdue' or p_reference_event_id is not null
       or v_case.due_at >= now() or v_case.status not in ('assigned','reviewed_hold')
       or exists (select 1 from public.gift_issuance_review_followup_events
         where case_id=p_case_id and event_kind='overdue_escalated' and case_version=v_case.version) then
      raise exception 'Overdue escalation requires a currently overdue, unacknowledged case version';
    end if;
  elsif p_action='handoff_receipt_confirmed' then
    select * into v_review from public.gift_issuance_review_events
      where case_id=p_case_id and event_kind='reviewed'
      order by created_at desc,id desc limit 1;
    if p_reason_code <> 'owner_receipt_acknowledged' or p_reference_event_id is distinct from v_review.id
       or v_review.outcome <> 'handoff_review_ready'
       or v_case.status <> 'ready_for_delivery_review' or v_case.due_at <= now()
       or v_owner.action <> 'close_verified_no_action' or v_owner.provider_check <> 'paid_verified'
       or v_age > 24
       or exists (select 1 from public.gift_issuance_review_followup_events
         where case_id=p_case_id and event_kind='recurrence_opened'
           and created_at >= v_review.created_at)
       or exists (select 1 from public.gift_issuance_review_followup_events
         where event_kind='handoff_receipt_confirmed' and reference_event_id=v_review.id) then
      raise exception 'Delivery-review handoff receipt blocked or already confirmed';
    end if;
    select * into v_receipt from public.gift_issuance_receipts
      where stripe_session_id=v_case.stripe_session_id for update;
    select count(*),count(*) filter (where checkout_line_number is null
        or checkout_line_number < 1 or recipient_email is null or pg_catalog.btrim(recipient_email)=''
        or stripe_payment_intent is distinct from v_owner.provider_payment_intent
        or pg_catalog.lower(currency) is distinct from pg_catalog.lower(v_owner.provider_currency)),
      count(*) filter (where purchase_context #>> '{gift_delivery,delivery_status}'
        in ('failed','review_required','processing')
        or purchase_context #>> '{gift_delivery,recipient_provider_status}'='failed'
        or purchase_context #>> '{gift_delivery,purchaser_copy_status}'='failed')
      into v_count,v_bad,v_attention from public.gift_certificates
      where stripe_session_id=v_case.stripe_session_id;
    select count(*) into v_held from public.gift_issuance_webhook_events
      where stripe_session_id=v_case.stripe_session_id and observed_state='hold';
    if v_receipt.stripe_session_id is null or v_receipt.state <> 'issued'
       or v_receipt.issued_count <> v_count or v_receipt.expected_count <> v_count
       or v_count is distinct from v_owner.provider_expected_count or v_count < 1 or v_count > 100
       or v_bad <> 0 or v_attention <> 0 or v_held <> 0
       or (select count(distinct checkout_line_number) from public.gift_certificates
            where stripe_session_id=v_case.stripe_session_id) <> v_count
       or (select coalesce(max(checkout_line_number),0) from public.gift_certificates
            where stripe_session_id=v_case.stripe_session_id) <> v_count then
      raise exception 'Receipt refused: paid issuance or delivery evidence no longer matches';
    end if;
  elsif p_action='recurrence_opened' then
    if p_reason_code not in ('overdue_review','handoff_not_received','evidence_changed',
        'delivery_attention','recurring_exception') or p_reference_event_id is null
       or (v_last.id is not null and
         (v_last.id is distinct from p_reference_event_id or v_last.event_kind='recurrence_opened')) then
      raise exception 'Recurrence needs a current, concrete independent review or follow-up predecessor';
    end if;
    if v_last.id is null then
      select * into v_review from public.gift_issuance_review_events
        where case_id=p_case_id and event_kind='reviewed'
        order by created_at desc,id desc limit 1;
      if v_review.id is null or v_review.id is distinct from p_reference_event_id then
        raise exception 'First recurrence must reference the last independent review';
      end if;
    end if;
  elsif p_action='recurrence_followup_recorded' then
    if p_reason_code not in ('hold_continues','recheck_requested','closed_no_dispatch')
       or v_last.id is null or v_last.event_kind <> 'recurrence_opened'
       or v_last.id is distinct from p_reference_event_id
       or v_last.case_version <> v_case.version then
      raise exception 'Follow-up requires an open recurrence on this exact case version';
    end if;
  end if;
  insert into public.gift_issuance_review_followup_events
    (id,case_id,event_kind,actor_staff_user_id,case_version,reference_event_id,
     reason_code,due_at_snapshot,decision_evidence_age_hours)
  values (p_event_id,p_case_id,p_action,p_actor_id,p_expected_version,p_reference_event_id,
    p_reason_code,v_case.due_at,v_age);
  return pg_catalog.jsonb_build_object('event_id',p_event_id,'case_id',p_case_id,
    'event_kind',p_action,'idempotent',false,'case_version',v_case.version,
    'owner_recovery_hold',p_action<>'handoff_receipt_confirmed',
    'handoff_disposition','owner_review_only_no_dispatch','customer_messages_sent',0,
    'payment_mutations',0,'gift_balance_mutations',0);
end;
$$;
revoke all on function public.record_gift_review_followup_event(uuid,uuid,uuid,text,text,integer,uuid)
  from public,anon,authenticated;
grant execute on function public.record_gift_review_followup_event(uuid,uuid,uuid,text,text,integer,uuid)
  to service_role;
