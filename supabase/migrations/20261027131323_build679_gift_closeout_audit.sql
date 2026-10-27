-- Build 679: customer-safe, post-closeout recurrence watch and independent audit.
-- Every operation is an append-only evidence event. It never issues, redeems,
-- emails, refunds, retries, or changes a customer's gift/payment state.
create table public.gift_issuance_closeout_audit_events (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  closeout_event_id uuid not null references public.gift_issuance_review_recheck_events(id),
  event_kind text not null check (event_kind in
    ('watch_opened','evidence_renewed','independent_audit_recorded','owner_audit_acknowledged')),
  actor_staff_user_id uuid not null references public.staff_users(id),
  auditor_staff_user_id uuid not null references public.staff_users(id),
  reference_event_id uuid references public.gift_issuance_closeout_audit_events(id),
  reason_code text not null check (reason_code in
    ('post_closeout_watch','fresh_paid_evidence','independent_verified','owner_no_dispatch_confirmed')),
  provider_evidence_sha256 text check (provider_evidence_sha256 ~ '^[0-9a-f]{64}$'),
  provider_checked_at timestamptz,
  certificate_count integer check (certificate_count between 1 and 100),
  receipt_last_seen_at timestamptz,
  decision_evidence_age_hours integer not null check (decision_evidence_age_hours >= 0),
  created_at timestamptz not null default clock_timestamp(),
  check ((event_kind='watch_opened' and reference_event_id is null
           and provider_evidence_sha256 is null and provider_checked_at is null
           and certificate_count is null and receipt_last_seen_at is null
           and reason_code='post_closeout_watch')
      or (event_kind='evidence_renewed' and reference_event_id is not null
           and reason_code='fresh_paid_evidence')
      or (event_kind='independent_audit_recorded' and reference_event_id is not null
           and reason_code='independent_verified')
      or (event_kind='owner_audit_acknowledged' and reference_event_id is not null
           and reason_code='owner_no_dispatch_confirmed'))
);
create index gift_closeout_audit_case_clock_idx
  on public.gift_issuance_closeout_audit_events(case_id,created_at desc,id desc);
create index gift_closeout_auditor_clock_idx
  on public.gift_issuance_closeout_audit_events(auditor_staff_user_id,created_at desc);
create unique index gift_closeout_one_watch_per_closeout_idx
  on public.gift_issuance_closeout_audit_events(closeout_event_id)
  where event_kind='watch_opened';
create unique index gift_closeout_one_independent_audit_per_renewal_idx
  on public.gift_issuance_closeout_audit_events(reference_event_id)
  where event_kind='independent_audit_recorded';
create unique index gift_closeout_one_owner_ack_per_audit_idx
  on public.gift_issuance_closeout_audit_events(reference_event_id)
  where event_kind='owner_audit_acknowledged';
alter table public.gift_issuance_closeout_audit_events enable row level security;
revoke all on public.gift_issuance_closeout_audit_events from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_closeout_audit_events to service_role;

create or replace function public.reject_gift_closeout_audit_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Gift closeout audit evidence is immutable';
  return null;
end;
$$;
revoke all on function public.reject_gift_closeout_audit_change() from public,anon,authenticated;
create trigger gift_closeout_audit_append_only
  before update or delete on public.gift_issuance_closeout_audit_events
  for each row execute function public.reject_gift_closeout_audit_change();

create or replace function public.record_gift_closeout_audit_event(
  p_event_id uuid,p_case_id uuid,p_closeout_id uuid,p_actor_id uuid,p_auditor_id uuid,
  p_action text,p_reference_id uuid,p_provider_check text,
  p_payment_intent text,p_currency text,p_expected_count integer,
  p_amount_cents bigint,p_evidence_sha256 text,p_checked_at timestamptz
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_closeout public.gift_issuance_review_recheck_events%rowtype;
  v_latest_closeout public.gift_issuance_review_recheck_events%rowtype;
  v_decision public.gift_issuance_recovery_decisions%rowtype;
  v_receipt public.gift_issuance_receipts%rowtype;
  v_prior public.gift_issuance_closeout_audit_events%rowtype;
  v_last public.gift_issuance_closeout_audit_events%rowtype;
  v_renewal public.gift_issuance_closeout_audit_events%rowtype;
  v_count integer;
  v_bad integer;
  v_attention integer;
  v_held integer;
  v_age integer;
  v_reason text;
  v_owner boolean;
begin
  if p_event_id is null or p_case_id is null or p_closeout_id is null or p_actor_id is null
     or p_auditor_id is null
     or p_action not in ('watch_opened','evidence_renewed',
       'independent_audit_recorded','owner_audit_acknowledged') then
    raise exception 'Malformed closeout audit event';
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Unknown gift recovery review case'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gift-issue:' || v_case.stripe_session_id,0));
  select * into v_prior from public.gift_issuance_closeout_audit_events where id=p_event_id;
  if found then
    if v_prior.case_id is distinct from p_case_id
       or v_prior.closeout_event_id is distinct from p_closeout_id
       or v_prior.actor_staff_user_id is distinct from p_actor_id
       or v_prior.auditor_staff_user_id is distinct from p_auditor_id
       or v_prior.event_kind is distinct from p_action
       or v_prior.reference_event_id is distinct from p_reference_id
       or v_prior.provider_evidence_sha256 is distinct from p_evidence_sha256
       or v_prior.provider_checked_at is distinct from p_checked_at then
      raise exception 'Conflicting closeout audit event replay';
    end if;
    return pg_catalog.jsonb_build_object('id',p_event_id,'idempotent',true,
      'event_kind',p_action,'customer_messages_sent',0);
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id for update;
  select * into v_closeout from public.gift_issuance_review_recheck_events
    where id=p_closeout_id and case_id=p_case_id and event_kind='owner_closeout_recorded';
  select * into v_latest_closeout from public.gift_issuance_review_recheck_events
    where case_id=p_case_id order by created_at desc,id desc limit 1;
  select * into v_decision from public.gift_issuance_recovery_decisions where id=v_case.decision_id;
  v_owner:=exists (select 1 from public.staff_users
    where id=p_actor_id and is_active=true and role_code='admin');
  if v_closeout.id is null or v_latest_closeout.id is distinct from p_closeout_id
     or v_case.status<>'ready_for_delivery_review'
     or v_decision.action<>'close_verified_no_action'
     or v_decision.provider_check<>'paid_verified'
     or (select id from public.gift_issuance_recovery_decisions
       where stripe_session_id=v_case.stripe_session_id order by created_at desc,id desc limit 1)
        is distinct from v_decision.id
     or exists(select 1 from public.gift_issuance_review_followup_events
       where case_id=p_case_id and event_kind='recurrence_opened'
         and created_at>v_closeout.created_at) then
    raise exception 'Recurrence reopened or superseded closeout: retain owner hold';
  end if;
  v_age:=greatest(0,floor(extract(epoch from (now()-v_decision.checked_at))/3600)::integer);
  select * into v_last from public.gift_issuance_closeout_audit_events
    where case_id=p_case_id and closeout_event_id=p_closeout_id
    order by created_at desc,id desc limit 1;

  if p_action='watch_opened' then
    if not v_owner or v_last.id is not null or p_reference_id is not null
       or p_auditor_id=v_case.assigned_reviewer_id
       or p_auditor_id=p_actor_id
       or p_auditor_id is not distinct from v_decision.actor_staff_user_id
       or not exists(select 1 from public.staff_users where id=p_auditor_id
          and is_active=true and role_code in ('senior_detailer','detailer'))
       or p_provider_check is not null or p_payment_intent is not null
       or p_currency is not null or p_expected_count is not null
       or p_amount_cents is not null or p_evidence_sha256 is not null
       or p_checked_at is not null then
      raise exception 'Watch requires a new, owner-only closeout and no provider mutation';
    end if;
  else
    if v_last.auditor_staff_user_id is distinct from p_auditor_id
       or p_provider_check<>'paid_verified' or p_checked_at is null
       or p_checked_at<now()-interval '5 minutes'
       or p_checked_at>now()+interval '30 seconds'
       or p_payment_intent is distinct from v_decision.provider_payment_intent
       or pg_catalog.lower(p_currency) is distinct from pg_catalog.lower(v_decision.provider_currency)
       or p_expected_count is distinct from v_decision.provider_expected_count
       or p_amount_cents is distinct from v_decision.provider_amount_cents
       or p_evidence_sha256 is null or p_evidence_sha256 !~ '^[0-9a-f]{64}$'
       or p_reference_id is distinct from v_last.id then
      raise exception 'Stale, mismatched or unlinked live Stripe evidence';
    end if;
    select * into v_receipt from public.gift_issuance_receipts
      where stripe_session_id=v_case.stripe_session_id for update;
    select count(*),count(*) filter (where checkout_line_number is null
        or checkout_line_number<1 or recipient_email is null
        or pg_catalog.btrim(recipient_email)=''
        or stripe_payment_intent is distinct from p_payment_intent
        or pg_catalog.lower(currency) is distinct from pg_catalog.lower(p_currency)),
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
       or v_count<>p_expected_count or v_count<1 or v_count>100
       or v_bad<>0 or v_attention<>0 or v_held<>0
       or (select count(distinct checkout_line_number) from public.gift_certificates
         where stripe_session_id=v_case.stripe_session_id)<>v_count
       or (select coalesce(max(checkout_line_number),0) from public.gift_certificates
         where stripe_session_id=v_case.stripe_session_id)<>v_count then
      raise exception 'Current certificate, delivery or receipt evidence changed: owner hold';
    end if;
  end if;

  if p_action='watch_opened' then
    v_reason:='post_closeout_watch';
  elsif p_action='evidence_renewed' then
    if not v_owner or (v_last.event_kind not in ('watch_opened','evidence_renewed')
         and (v_last.event_kind not in
             ('independent_audit_recorded','owner_audit_acknowledged')
           or v_last.provider_checked_at>=now()-interval '2 hours')) then
      raise exception 'Owner renewal requires a watch or an aged prior audit';
    end if;
    v_reason:='fresh_paid_evidence';
  elsif p_action='independent_audit_recorded' then
    if v_owner or p_actor_id is distinct from p_auditor_id
       or p_actor_id=v_case.assigned_reviewer_id
       or p_actor_id=v_closeout.actor_staff_user_id
       or p_actor_id is not distinct from v_decision.actor_staff_user_id
       or not exists(select 1 from public.staff_users where id=p_actor_id and is_active=true
           and role_code in ('senior_detailer','detailer'))
       or v_last.event_kind<>'evidence_renewed'
       or v_last.provider_checked_at<now()-interval '2 hours'
       or v_last.provider_evidence_sha256 is distinct from p_evidence_sha256
       or v_last.certificate_count is distinct from v_count
       or v_last.receipt_last_seen_at is distinct from v_receipt.last_seen_at then
      raise exception 'Independent auditor is unavailable or renewed evidence is stale';
    end if;
    v_reason:='independent_verified';
  else
    if not v_owner or v_last.event_kind<>'independent_audit_recorded'
       or v_last.provider_checked_at<now()-interval '2 hours'
       or v_last.provider_evidence_sha256 is distinct from p_evidence_sha256
       or v_last.certificate_count is distinct from v_count
       or v_last.receipt_last_seen_at is distinct from v_receipt.last_seen_at then
      raise exception 'Owner acknowledgment requires current independent evidence';
    end if;
    v_reason:='owner_no_dispatch_confirmed';
  end if;
  insert into public.gift_issuance_closeout_audit_events
    (id,case_id,closeout_event_id,event_kind,actor_staff_user_id,auditor_staff_user_id,reference_event_id,
     reason_code,provider_evidence_sha256,provider_checked_at,certificate_count,
     receipt_last_seen_at,decision_evidence_age_hours)
  values (p_event_id,p_case_id,p_closeout_id,p_action,p_actor_id,p_auditor_id,p_reference_id,
    v_reason,p_evidence_sha256,p_checked_at,
    case when p_action='watch_opened' then null else v_count end,
    case when p_action='watch_opened' then null else v_receipt.last_seen_at end,v_age);
  return pg_catalog.jsonb_build_object('id',p_event_id,'event_kind',p_action,
    'idempotent',false,'owner_recovery_hold',p_action<>'owner_audit_acknowledged',
    'no_customer_action',true,'customer_messages_sent',0,'payment_mutations',0,
    'gift_balance_mutations',0);
end;
$$;
revoke all on function public.record_gift_closeout_audit_event(
  uuid,uuid,uuid,uuid,uuid,text,uuid,text,text,text,integer,bigint,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_closeout_audit_event(
  uuid,uuid,uuid,uuid,uuid,text,uuid,text,text,text,integer,bigint,text,timestamptz)
  to service_role;
