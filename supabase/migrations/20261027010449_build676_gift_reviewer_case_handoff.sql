-- Build 676: one active independent-review case per immutable Build 675
-- decision; append-only events, no communication or gift mutations.
create table if not exists public.gift_issuance_review_cases (
  id uuid primary key,
  decision_id uuid not null unique references public.gift_issuance_recovery_decisions(id),
  stripe_session_id text not null,
  assigned_reviewer_id uuid not null references public.staff_users(id),
  assigned_by_staff_user_id uuid references public.staff_users(id),
  assigned_by_actor_label text not null check (length(assigned_by_actor_label) between 1 and 100),
  assigned_at timestamptz not null default now(),
  due_at timestamptz not null,
  status text not null default 'assigned' check (status in ('assigned', 'reviewed_hold', 'ready_for_delivery_review')),
  version integer not null default 1 check (version >= 1),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (assigned_by_staff_user_id is distinct from assigned_reviewer_id)
);
create index if not exists gift_issuance_review_cases_reviewer_due_idx
  on public.gift_issuance_review_cases(assigned_reviewer_id, due_at asc);
create index if not exists gift_issuance_review_cases_session_idx
  on public.gift_issuance_review_cases(stripe_session_id, updated_at desc);
alter table public.gift_issuance_review_cases enable row level security;
revoke all on public.gift_issuance_review_cases from public, anon, authenticated, service_role;
grant select, insert, update on public.gift_issuance_review_cases to service_role;

create table if not exists public.gift_issuance_review_events (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  event_kind text not null check (event_kind in ('assigned', 'reassigned', 'reviewed')),
  actor_staff_user_id uuid references public.staff_users(id),
  actor_label text not null check (length(actor_label) between 1 and 100),
  reviewer_staff_user_id uuid not null references public.staff_users(id),
  outcome text not null check (outcome in ('not_applicable', 'hold_missing_evidence',
    'hold_delivery_check', 'recheck_required', 'handoff_review_ready')),
  reason_code text not null check (reason_code in ('owner_assignment', 'owner_reassignment',
    'evidence_stale', 'unresolved_hold', 'delivery_attention', 'independent_verified', 'other_reviewer_review')),
  evidence_age_hours integer,
  observed_certificates integer,
  held_events integer,
  delivery_attention_count integer,
  created_at timestamptz not null default now()
);
create index if not exists gift_issuance_review_events_case_idx
  on public.gift_issuance_review_events(case_id, created_at asc);
alter table public.gift_issuance_review_events enable row level security;
revoke all on public.gift_issuance_review_events from public, anon, authenticated, service_role;
grant select, insert on public.gift_issuance_review_events to service_role;

create or replace function public.reject_gift_issuance_review_event_change()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  raise exception 'Independent gift review events are append-only';
  return null;
end;
$$;
revoke all on function public.reject_gift_issuance_review_event_change() from public, anon, authenticated;
drop trigger if exists gift_issuance_review_events_append_only on public.gift_issuance_review_events;
create trigger gift_issuance_review_events_append_only
  before update or delete on public.gift_issuance_review_events
  for each row execute function public.reject_gift_issuance_review_event_change();

-- Owner assignment/reassignment serialized against Build 674 and Build 675.
-- No assignment can nominate the original decision maker or the assigner.
create or replace function public.assign_gift_issuance_independent_reviewer(
  p_event_id uuid, p_case_id uuid, p_decision_id uuid, p_reviewer_id uuid,
  p_assigner_id uuid, p_assigner_label text, p_due_at timestamptz
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_decision public.gift_issuance_recovery_decisions%rowtype;
  v_case public.gift_issuance_review_cases%rowtype;
  v_prior public.gift_issuance_review_events%rowtype;
  v_kind text := 'assigned';
begin
  if p_event_id is null or p_case_id is null or p_decision_id is null or p_reviewer_id is null
     or nullif(trim(p_assigner_label), '') is null or length(p_assigner_label) > 100
     or p_due_at is null or p_due_at < now() + interval '1 hour'
     or p_due_at > now() + interval '14 days' then
    raise exception 'Invalid independent review assignment or due date';
  end if;
  select * into v_decision from public.gift_issuance_recovery_decisions where id = p_decision_id;
  if not found then raise exception 'Owner decision does not exist'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gift-issue:' || v_decision.stripe_session_id, 0));
  select * into v_prior from public.gift_issuance_review_events where id = p_event_id;
  if found then
    if v_prior.case_id <> p_case_id or v_prior.reviewer_staff_user_id <> p_reviewer_id
       or v_prior.actor_label <> p_assigner_label
       or v_prior.event_kind not in ('assigned','reassigned') then
      raise exception 'Assignment event identifier reused with different evidence';
    end if;
    return jsonb_build_object('case_id',p_case_id,'event_id',p_event_id,'idempotent',true);
  end if;
  if not exists (select 1 from public.staff_users where id = p_reviewer_id and is_active = true)
     or p_reviewer_id is not distinct from p_assigner_id
     or p_reviewer_id is not distinct from v_decision.actor_staff_user_id then
    raise exception 'Assigned reviewer must be active and independent of both owners';
  end if;
  if (select id from public.gift_issuance_recovery_decisions
      where stripe_session_id = v_decision.stripe_session_id
      order by created_at desc,id desc limit 1) is distinct from p_decision_id then
    raise exception 'A newer owner decision superseded this assignment';
  end if;
  select * into v_case from public.gift_issuance_review_cases where decision_id = p_decision_id for update;
  if found then
    if v_case.id <> p_case_id or v_case.status = 'ready_for_delivery_review'
       or v_case.assigned_reviewer_id = p_reviewer_id then
      raise exception 'Assignment conflicts with an active or closed independent case';
    end if;
    v_kind := 'reassigned';
    update public.gift_issuance_review_cases
      set assigned_reviewer_id=p_reviewer_id,assigned_by_staff_user_id=p_assigner_id,
          assigned_by_actor_label=p_assigner_label,assigned_at=now(),due_at=p_due_at,
          status='assigned',version=version+1,updated_at=now()
      where id=p_case_id;
  else
    insert into public.gift_issuance_review_cases
      (id,decision_id,stripe_session_id,assigned_reviewer_id,
       assigned_by_staff_user_id,assigned_by_actor_label,due_at)
    values (p_case_id,p_decision_id,v_decision.stripe_session_id,p_reviewer_id,
      p_assigner_id,p_assigner_label,p_due_at);
  end if;
  insert into public.gift_issuance_review_events
    (id,case_id,event_kind,actor_staff_user_id,actor_label,reviewer_staff_user_id,outcome,reason_code)
  values (p_event_id,p_case_id,v_kind,p_assigner_id,p_assigner_label,p_reviewer_id,
    'not_applicable',case when v_kind='assigned' then 'owner_assignment' else 'owner_reassignment' end);
  return jsonb_build_object('case_id',p_case_id,'event_id',p_event_id,'kind',v_kind,'idempotent',false);
end;
$$;
revoke all on function public.assign_gift_issuance_independent_reviewer(uuid,uuid,uuid,uuid,uuid,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.assign_gift_issuance_independent_reviewer(uuid,uuid,uuid,uuid,uuid,text,timestamptz)
  to service_role;

-- Only the currently assigned, separately authenticated reviewer may record a
-- finding. "Ready" means an owner can review delivery separately, never send.
create or replace function public.record_gift_issuance_reviewer_outcome(
  p_event_id uuid, p_case_id uuid, p_actor_id uuid,
  p_outcome text, p_reason_code text, p_expected_version integer
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_decision public.gift_issuance_recovery_decisions%rowtype;
  v_prior public.gift_issuance_review_events%rowtype;
  v_age integer;
  v_count integer;
  v_bad_lines integer;
  v_delivery_attention integer;
  v_held integer;
  v_receipt public.gift_issuance_receipts%rowtype;
begin
  if p_event_id is null or p_case_id is null or p_actor_id is null
     or p_outcome not in ('hold_missing_evidence','hold_delivery_check','recheck_required','handoff_review_ready')
     or p_reason_code not in ('evidence_stale','unresolved_hold','delivery_attention','independent_verified','other_reviewer_review')
     or p_expected_version is null or p_expected_version < 1 then
    raise exception 'Invalid independent reviewer decision';
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Independent review case not found'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gift-issue:' || v_case.stripe_session_id, 0));
  select * into v_prior from public.gift_issuance_review_events where id = p_event_id;
  if found then
    if v_prior.case_id <> p_case_id or v_prior.actor_staff_user_id <> p_actor_id
       or v_prior.outcome <> p_outcome or v_prior.reason_code <> p_reason_code then
      raise exception 'Reviewer event identifier reused with different evidence';
    end if;
    return jsonb_build_object('case_id',p_case_id,'event_id',p_event_id,'idempotent',true);
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id for update;
  select * into v_decision from public.gift_issuance_recovery_decisions where id=v_case.decision_id;
  if v_case.assigned_reviewer_id <> p_actor_id
     or v_case.assigned_by_staff_user_id is not distinct from p_actor_id
     or v_decision.actor_staff_user_id is not distinct from p_actor_id
     or not exists(select 1 from public.staff_users where id=p_actor_id and is_active=true)
     or v_case.version <> p_expected_version
     or v_case.status = 'ready_for_delivery_review' then
    raise exception 'Reviewer identity, independence, case version or status rejected';
  end if;
  v_age := greatest(0,floor(extract(epoch from (now()-v_decision.checked_at))/3600)::integer);
  select * into v_receipt from public.gift_issuance_receipts
    where stripe_session_id=v_case.stripe_session_id for update;
  select count(*),
     count(*) filter (where checkout_line_number is null or checkout_line_number < 1
       or recipient_email is null or trim(recipient_email) = ''
       or stripe_payment_intent is distinct from v_decision.provider_payment_intent
       or lower(currency) is distinct from lower(v_decision.provider_currency)),
     count(*) filter (where purchase_context #>> '{gift_delivery,delivery_status}'
       in ('failed','review_required','processing')
       or purchase_context #>> '{gift_delivery,recipient_provider_status}' = 'failed'
       or purchase_context #>> '{gift_delivery,purchaser_copy_status}' = 'failed')
    into v_count,v_bad_lines,v_delivery_attention
    from public.gift_certificates where stripe_session_id=v_case.stripe_session_id;
  select count(*) into v_held from public.gift_issuance_webhook_events
    where stripe_session_id=v_case.stripe_session_id and observed_state='hold';
  if p_outcome='handoff_review_ready' then
    if p_reason_code <> 'independent_verified'
       or v_decision.action <> 'close_verified_no_action'
       or v_decision.provider_check <> 'paid_verified'
       or v_age > 24
       or (select id from public.gift_issuance_recovery_decisions
         where stripe_session_id=v_case.stripe_session_id order by created_at desc,id desc limit 1)
         is distinct from v_decision.id
       or v_receipt.stripe_session_id is null or v_receipt.state <> 'issued'
       or v_receipt.expected_count <> v_count or v_receipt.issued_count <> v_count
       or v_count is distinct from v_decision.provider_expected_count
       or v_count < 1 or v_count > 100 or v_bad_lines <> 0
       or v_delivery_attention <> 0 or v_held <> 0
       or (select count(distinct checkout_line_number) from public.gift_certificates
            where stripe_session_id=v_case.stripe_session_id) <> v_count
       or (select coalesce(max(checkout_line_number),0) from public.gift_certificates
            where stripe_session_id=v_case.stripe_session_id) <> v_count then
      raise exception 'Safe delivery review handoff blocked by aged or conflicting evidence';
    end if;
  end if;
  update public.gift_issuance_review_cases
    set status=case when p_outcome='handoff_review_ready'
      then 'ready_for_delivery_review' else 'reviewed_hold' end,
      last_reviewed_at=now(),version=version+1,updated_at=now()
    where id=p_case_id;
  insert into public.gift_issuance_review_events
    (id,case_id,event_kind,actor_staff_user_id,actor_label,reviewer_staff_user_id,
     outcome,reason_code,evidence_age_hours,observed_certificates,held_events,delivery_attention_count)
  values (p_event_id,p_case_id,'reviewed',p_actor_id,p_actor_id::text,p_actor_id,
    p_outcome,p_reason_code,v_age,v_count,v_held,v_delivery_attention);
  return jsonb_build_object('case_id',p_case_id,'event_id',p_event_id,
     'idempotent',false,'outcome',p_outcome,'evidence_age_hours',v_age,
     'handoff_disposition',case when p_outcome='handoff_review_ready'
       then 'delivery_review_only' else 'hold_no_customer_contact' end,
     'customer_messages_sent',0);
end;
$$;
revoke all on function public.record_gift_issuance_reviewer_outcome(uuid,uuid,uuid,text,text,integer)
  from public, anon, authenticated;
grant execute on function public.record_gift_issuance_reviewer_outcome(uuid,uuid,uuid,text,text,integer)
  to service_role;
