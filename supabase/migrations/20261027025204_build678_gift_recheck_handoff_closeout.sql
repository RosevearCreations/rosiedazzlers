-- Build 678: independent recheck assignment, refreshed handoff and owner closeout.
-- No gift, payment, delivery or message write is authorized by this ledger.
create table public.gift_issuance_review_recheck_events (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  recurrence_event_id uuid not null references public.gift_issuance_review_followup_events(id),
  event_kind text not null check (event_kind in
    ('recheck_assigned','handoff_refreshed','owner_closeout_recorded')),
  actor_staff_user_id uuid not null references public.staff_users(id),
  reviewer_staff_user_id uuid references public.staff_users(id),
  case_version integer not null check (case_version >= 1),
  reference_event_id uuid,
  reason_code text not null check (reason_code in
    ('independent_recheck_requested','fresh_handoff_verified','closed_no_dispatch')),
  due_at_snapshot timestamptz not null,
  decision_evidence_age_hours integer not null check (decision_evidence_age_hours >= 0),
  created_at timestamptz not null default clock_timestamp(),
  check ((event_kind='recheck_assigned' and reference_event_id is null
      and reviewer_staff_user_id is not null and reason_code='independent_recheck_requested')
    or (event_kind='handoff_refreshed' and reference_event_id is not null
      and reviewer_staff_user_id is not null and reason_code='fresh_handoff_verified')
    or (event_kind='owner_closeout_recorded' and reference_event_id is not null
      and reviewer_staff_user_id is not null and reason_code='closed_no_dispatch'))
);
create index gift_review_recheck_case_clock_idx
  on public.gift_issuance_review_recheck_events(case_id,created_at desc,id desc);
create unique index gift_review_one_recheck_per_recurrence_idx
  on public.gift_issuance_review_recheck_events(recurrence_event_id)
  where event_kind='recheck_assigned';
create unique index gift_review_one_handoff_per_review_idx
  on public.gift_issuance_review_recheck_events(reference_event_id)
  where event_kind='handoff_refreshed';
create unique index gift_review_one_closeout_per_handoff_idx
  on public.gift_issuance_review_recheck_events(reference_event_id)
  where event_kind='owner_closeout_recorded';
alter table public.gift_issuance_review_recheck_events enable row level security;
revoke all on public.gift_issuance_review_recheck_events from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_review_recheck_events to service_role;

create or replace function public.reject_gift_review_recheck_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Gift recovery recheck events are immutable';
  return null;
end;
$$;
revoke all on function public.reject_gift_review_recheck_change() from public,anon,authenticated;
create trigger gift_review_recheck_append_only
  before update or delete on public.gift_issuance_review_recheck_events
  for each row execute function public.reject_gift_review_recheck_change();

create or replace function public.record_gift_recovery_recheck_event(
  p_event_id uuid,p_case_id uuid,p_actor_id uuid,p_action text,p_reason_code text,
  p_expected_version integer,p_recurrence_event_id uuid,p_reference_event_id uuid,
  p_reviewer_id uuid,p_due_at timestamptz
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_decision public.gift_issuance_recovery_decisions%rowtype;
  v_prior public.gift_issuance_review_recheck_events%rowtype;
  v_last public.gift_issuance_review_recheck_events%rowtype;
  v_recurrence public.gift_issuance_review_followup_events%rowtype;
  v_followup public.gift_issuance_review_followup_events%rowtype;
  v_review public.gift_issuance_review_events%rowtype;
  v_receipt public.gift_issuance_receipts%rowtype;
  v_age integer;
  v_count integer;
  v_bad integer;
  v_attention integer;
  v_held integer;
  v_new_version integer;
begin
  if p_event_id is null or p_case_id is null or p_actor_id is null
     or p_recurrence_event_id is null or p_expected_version is null
     or p_expected_version < 1 or p_action not in
       ('recheck_assigned','handoff_refreshed','owner_closeout_recorded')
     or (p_action='recheck_assigned' and
          (p_reason_code <> 'independent_recheck_requested' or p_reference_event_id is not null))
     or (p_action='handoff_refreshed' and
          (p_reason_code <> 'fresh_handoff_verified' or p_reference_event_id is null))
     or (p_action='owner_closeout_recorded' and
          (p_reason_code <> 'closed_no_dispatch' or p_reference_event_id is null)) then
    raise exception 'Invalid owner recheck evidence request';
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Independent case absent'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gift-issue:' || v_case.stripe_session_id,0));
  select * into v_prior from public.gift_issuance_review_recheck_events where id=p_event_id;
  if found then
    if v_prior.case_id is distinct from p_case_id
       or v_prior.actor_staff_user_id is distinct from p_actor_id
       or v_prior.event_kind is distinct from p_action
       or v_prior.reason_code is distinct from p_reason_code
       or v_prior.recurrence_event_id is distinct from p_recurrence_event_id
       or v_prior.reference_event_id is distinct from p_reference_event_id
       or v_prior.reviewer_staff_user_id is distinct from p_reviewer_id
       or v_prior.case_version is distinct from
          (case when p_action='recheck_assigned' then p_expected_version+1 else p_expected_version end)
       or (p_action='recheck_assigned' and v_prior.due_at_snapshot is distinct from p_due_at) then
      raise exception 'Recheck evidence event replay does not match original';
    end if;
    return pg_catalog.jsonb_build_object('event_id',p_event_id,'idempotent',true,
      'event_kind',p_action,'customer_messages_sent',0);
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id for update;
  select * into v_decision from public.gift_issuance_recovery_decisions where id=v_case.decision_id;
  if v_case.version <> p_expected_version or not exists
       (select 1 from public.staff_users where id=p_actor_id and is_active=true and role_code='admin')
     or (select id from public.gift_issuance_recovery_decisions
          where stripe_session_id=v_case.stripe_session_id
          order by created_at desc,id desc limit 1) is distinct from v_decision.id then
    raise exception 'Stale case, unauthorized owner or superseded decision';
  end if;
  select * into v_recurrence from public.gift_issuance_review_followup_events
    where id=p_recurrence_event_id and case_id=p_case_id and event_kind='recurrence_opened';
  if not found then raise exception 'Recheck requires a valid recurrence'; end if;
  select * into v_followup from public.gift_issuance_review_followup_events
    where case_id=p_case_id order by created_at desc,id desc limit 1;
  if v_followup.event_kind <> 'recurrence_followup_recorded'
     or v_followup.reason_code <> 'recheck_requested'
     or v_followup.reference_event_id is distinct from p_recurrence_event_id then
    raise exception 'Latest owner recurrence must explicitly request independent recheck';
  end if;
  v_age:=greatest(0,floor(extract(epoch from (now()-v_decision.checked_at))/3600)::integer);
  select * into v_last from public.gift_issuance_review_recheck_events
    where case_id=p_case_id order by created_at desc,id desc limit 1;

  if p_action='recheck_assigned' then
    if v_last.id is not null and v_last.created_at >= v_recurrence.created_at
       or p_reviewer_id is null or p_reviewer_id=v_case.assigned_reviewer_id
       or p_reviewer_id=p_actor_id or p_reviewer_id is not distinct from v_decision.actor_staff_user_id
       or not exists (select 1 from public.staff_users where id=p_reviewer_id and is_active=true)
       or p_due_at is null or p_due_at < now()+interval '1 hour'
       or p_due_at > now()+interval '14 days' then
      raise exception 'Independent recheck assignment conflicts with prior evidence or reviewer';
    end if;
    update public.gift_issuance_review_cases
      set assigned_reviewer_id=p_reviewer_id,assigned_by_staff_user_id=p_actor_id,
          assigned_by_actor_label=p_actor_id::text,assigned_at=clock_timestamp(),
          due_at=p_due_at,status='assigned',last_reviewed_at=null,
          version=version+1,updated_at=clock_timestamp()
      where id=p_case_id returning version into v_new_version;
    v_case.version:=v_new_version;
    v_case.due_at:=p_due_at;
  else
    if p_reviewer_id is distinct from v_case.assigned_reviewer_id or p_due_at is not null
       or p_actor_id=v_case.assigned_reviewer_id or v_case.status<>'ready_for_delivery_review'
       or v_case.due_at <= now() or v_age>24
       or v_decision.action<>'close_verified_no_action' or v_decision.provider_check<>'paid_verified'
       or (select count(*) from public.gift_issuance_review_followup_events
          where case_id=p_case_id and event_kind='recurrence_opened'
            and created_at>v_recurrence.created_at)>0 then
      raise exception 'Fresh owner handoff or closeout is no longer safe';
    end if;
    if p_action='handoff_refreshed' then
      if v_last.event_kind <> 'recheck_assigned'
         or v_last.recurrence_event_id is distinct from p_recurrence_event_id then
        raise exception 'Fresh handoff requires the assigned recheck predecessor';
      end if;
      select * into v_review from public.gift_issuance_review_events
        where case_id=p_case_id and event_kind='reviewed'
        order by created_at desc,id desc limit 1;
      if v_review.id is null or v_review.id is distinct from p_reference_event_id
         -- Build 676 timestamps use transaction-start time while this ledger
         -- uses wall-clock time; case version is the reliable ordering proof.
         or v_case.version <> v_last.case_version + 1
         or v_review.outcome <> 'handoff_review_ready'
         or v_review.reviewer_staff_user_id is distinct from p_reviewer_id
         or v_review.actor_staff_user_id is distinct from p_reviewer_id then
        raise exception 'New independent reviewer did not verify fresh handoff';
      end if;
    else
      if v_last.event_kind <> 'handoff_refreshed'
         or v_last.recurrence_event_id is distinct from p_recurrence_event_id
         or v_last.id is distinct from p_reference_event_id
         or v_last.case_version <> p_expected_version then
        raise exception 'Closeout requires the current refreshed handoff receipt';
      end if;
    end if;
    -- Recheck actual paid issuance and delivery state when evidence is refreshed
    -- AND again at closeout; prior receipts alone never authorize delivery.
    select * into v_receipt from public.gift_issuance_receipts
      where stripe_session_id=v_case.stripe_session_id for update;
    select count(*),count(*) filter (where checkout_line_number is null
        or checkout_line_number<1 or recipient_email is null or pg_catalog.btrim(recipient_email)=''
        or stripe_payment_intent is distinct from v_decision.provider_payment_intent
        or pg_catalog.lower(currency) is distinct from pg_catalog.lower(v_decision.provider_currency)),
      count(*) filter (where purchase_context #>> '{gift_delivery,delivery_status}'
         in ('failed','review_required','processing')
         or purchase_context #>> '{gift_delivery,recipient_provider_status}'='failed'
         or purchase_context #>> '{gift_delivery,purchaser_copy_status}'='failed')
      into v_count,v_bad,v_attention from public.gift_certificates
      where stripe_session_id=v_case.stripe_session_id;
    select count(*) into v_held from public.gift_issuance_webhook_events
      where stripe_session_id=v_case.stripe_session_id and observed_state='hold';
    if v_receipt.stripe_session_id is null or v_receipt.state<>'issued'
       or v_receipt.expected_count<>v_count or v_receipt.issued_count<>v_count
       or v_count is distinct from v_decision.provider_expected_count
       or v_count<1 or v_count>100 or v_bad<>0 or v_attention<>0 or v_held<>0
       or (select count(distinct checkout_line_number) from public.gift_certificates
          where stripe_session_id=v_case.stripe_session_id)<>v_count
       or (select coalesce(max(checkout_line_number),0) from public.gift_certificates
          where stripe_session_id=v_case.stripe_session_id)<>v_count then
      raise exception 'Paid issuance or delivery evidence changed; retain owner hold';
    end if;
  end if;
  insert into public.gift_issuance_review_recheck_events
    (id,case_id,recurrence_event_id,event_kind,actor_staff_user_id,reviewer_staff_user_id,
     case_version,reference_event_id,reason_code,due_at_snapshot,decision_evidence_age_hours)
  values (p_event_id,p_case_id,p_recurrence_event_id,p_action,p_actor_id,p_reviewer_id,
    v_case.version,p_reference_event_id,p_reason_code,v_case.due_at,v_age);
  return pg_catalog.jsonb_build_object('event_id',p_event_id,'case_id',p_case_id,
    'event_kind',p_action,'case_version',v_case.version,'idempotent',false,
    'owner_recovery_hold',p_action<>'owner_closeout_recorded',
    'handoff_disposition','internal_evidence_only_no_dispatch',
    'customer_messages_sent',0,'payment_mutations',0,'gift_balance_mutations',0);
end;
$$;
revoke all on function public.record_gift_recovery_recheck_event(uuid,uuid,uuid,text,text,integer,uuid,uuid,uuid,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_recovery_recheck_event(uuid,uuid,uuid,text,text,integer,uuid,uuid,uuid,timestamptz)
  to service_role;
