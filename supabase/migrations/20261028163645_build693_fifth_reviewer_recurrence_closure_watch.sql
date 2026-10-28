-- Build 693: fifth-reviewer discrepancy recurrence closure WATCH (not delivery closure).
-- A distinct sixth witness may report continued risk; the original gift remains HOLD/no-resend.
create table public.gift_issuance_delivery_fifth_recurrence_closure_watch (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  certificate_id uuid not null references public.gift_certificates(id),
  attempt_id uuid not null references public.gift_issuance_one_time_dispatch_attempts(id),
  fifth_review_id uuid not null references public.gift_issuance_delivery_reopened_discrepancy_watch(id),
  actor_staff_user_id uuid not null references public.staff_users(id),
  reviewer_staff_user_id uuid not null references public.staff_users(id),
  event_kind text not null check(event_kind in (
    'owner_fifth_recurrence_watch_opened','independent_closure_risk_checked','owner_continued_hold_ack')),
  decision_code text not null check(decision_code in (
    'recurrence_watch_requested','discrepancy_still_open','new_discrepancy_detected',
    'original_evidence_missing','continued_manual_hold')),
  evidence_kind text not null check(evidence_kind in (
    'internal_exception_note','recipient_direct_reply','verified_phone_conversation',
    'recipient_reported_missing','provider_dashboard_reference')),
  evidence_reference text not null check(evidence_reference ~ '^[A-Z0-9_-]{6,64}$'),
  evidence_sha256 text not null check(evidence_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(attempt_id,event_kind)
);
create index gift_693_fifth_recurrence_case_idx on
  public.gift_issuance_delivery_fifth_recurrence_closure_watch(case_id,created_at desc);
alter table public.gift_issuance_delivery_fifth_recurrence_closure_watch enable row level security;
revoke all on public.gift_issuance_delivery_fifth_recurrence_closure_watch from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_delivery_fifth_recurrence_closure_watch to service_role;
create trigger gift_693_fifth_recurrence_append_only before update or delete
  on public.gift_issuance_delivery_fifth_recurrence_closure_watch for each row
  execute function public.reject_gift_closeout_audit_change();

create function public.record_gift_delivery_fifth_recurrence_closure_watch(
  p_id uuid,p_case_id uuid,p_certificate_id uuid,p_attempt_id uuid,
  p_fifth_review_id uuid,p_actor_id uuid,p_reviewer_id uuid,
  p_event_kind text,p_decision_code text,p_evidence_kind text,
  p_evidence_reference text,p_evidence_sha256 text,p_observed_at timestamptz
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_attempt public.gift_issuance_one_time_dispatch_attempts%rowtype;
  v_approval public.gift_issuance_one_time_dispatch_approvals%rowtype;
  v_original public.gift_issuance_delivery_followup_reviews%rowtype;
  v_third public.gift_issuance_delivery_closure_recurrence%rowtype;
  v_fourth public.gift_issuance_delivery_reopened_exception_reviews%rowtype;
  v_fifth_watch public.gift_issuance_delivery_reopened_discrepancy_watch%rowtype;
  v_fifth public.gift_issuance_delivery_reopened_discrepancy_watch%rowtype;
  v_fifth_hold public.gift_issuance_delivery_reopened_discrepancy_watch%rowtype;
  v_watch public.gift_issuance_delivery_fifth_recurrence_closure_watch%rowtype;
  v_independent public.gift_issuance_delivery_fifth_recurrence_closure_watch%rowtype;
begin
  if p_id is null or p_case_id is null or p_certificate_id is null or
    p_attempt_id is null or p_fifth_review_id is null or p_actor_id is null or
    p_reviewer_id is null or p_evidence_reference !~ '^[A-Z0-9_-]{6,64}$' or
    p_evidence_sha256 !~ '^[0-9a-f]{64}$' or p_observed_at is null or
    p_observed_at>clock_timestamp()+interval '30 seconds' or
    p_observed_at<clock_timestamp()-interval '30 days' then
    raise exception 'Exact recent nonpersonal fifth-review evidence required';end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if v_case.id is null then raise exception 'Original checkout unavailable';end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('gift-issue:'||v_case.stripe_session_id,0));
  if exists(select 1 from public.gift_issuance_delivery_fifth_recurrence_closure_watch
    where id=p_id or (attempt_id=p_attempt_id and event_kind=p_event_kind)) then
    raise exception 'Fifth recurrence event already recorded; replay denied';end if;
  select * into v_attempt from public.gift_issuance_one_time_dispatch_attempts
    where id=p_attempt_id and certificate_id=p_certificate_id;
  select * into v_approval from public.gift_issuance_one_time_dispatch_approvals
    where id=v_attempt.approval_id and case_id=p_case_id and certificate_id=p_certificate_id;
  select * into v_original from public.gift_issuance_delivery_followup_reviews
    where attempt_id=p_attempt_id and event_kind='independent_recipient_recheck';
  select * into v_third from public.gift_issuance_delivery_closure_recurrence
    where attempt_id=p_attempt_id and event_kind='owner_watch_opened';
  select * into v_fourth from public.gift_issuance_delivery_reopened_exception_reviews
    where attempt_id=p_attempt_id and event_kind='owner_exception_reopened';
  select * into v_fifth_watch from public.gift_issuance_delivery_reopened_discrepancy_watch
    where attempt_id=p_attempt_id and event_kind='owner_discrepancy_watch_opened';
  select * into v_fifth from public.gift_issuance_delivery_reopened_discrepancy_watch
    where id=p_fifth_review_id and attempt_id=p_attempt_id and
      event_kind='independent_discrepancy_reassessed';
  select * into v_fifth_hold from public.gift_issuance_delivery_reopened_discrepancy_watch
    where attempt_id=p_attempt_id and event_kind='owner_no_resend_hold_ack';
  select * into v_watch from public.gift_issuance_delivery_fifth_recurrence_closure_watch
    where attempt_id=p_attempt_id and event_kind='owner_fifth_recurrence_watch_opened';
  select * into v_independent from public.gift_issuance_delivery_fifth_recurrence_closure_watch
    where attempt_id=p_attempt_id and event_kind='independent_closure_risk_checked';
  if v_attempt.id is null or v_approval.id is null or v_original.id is null or
    v_third.id is null or v_fourth.id is null or v_fifth_watch.id is null or
    v_fifth.id is null or v_fifth_hold.id is null or
    v_fifth.actor_staff_user_id<>v_fifth_watch.reviewer_staff_user_id or
    v_fifth_hold.actor_staff_user_id<>v_approval.owner_staff_user_id or
    v_fifth_hold.reviewer_staff_user_id<>v_fifth.actor_staff_user_id or
    v_fifth.decision_code not in ('still_disputed','documentary_gap','contradiction_not_resolved') or
    not exists(select 1 from public.gift_certificates
      where id=p_certificate_id and stripe_session_id=v_case.stripe_session_id) or
    exists(select 1 from public.notification_events
      where id=v_attempt.notification_event_id and
        (max_attempts<>1 or next_attempt_at is not null)) then
    raise exception 'Fifth unresolved review, owner HOLD and consumed send required';end if;
  if p_event_kind='owner_fifth_recurrence_watch_opened' then
    if p_actor_id<>v_approval.owner_staff_user_id or
      p_reviewer_id in (p_actor_id,v_attempt.operator_staff_user_id,
        v_original.actor_staff_user_id,v_third.reviewer_staff_user_id,
        v_fourth.reviewer_staff_user_id,v_fifth.actor_staff_user_id) or
      not exists(select 1 from public.staff_users where id=p_actor_id
        and role_code='admin' and is_active=true) or
      not exists(select 1 from public.staff_users where id=p_reviewer_id
        and role_code in ('admin','senior_detailer','detailer') and is_active=true) or
      p_decision_code<>'recurrence_watch_requested' or
      p_evidence_kind<>'internal_exception_note' or p_observed_at<v_fifth_hold.created_at then
      raise exception 'Owner must assign distinct sixth witness after fifth HOLD';end if;
  elsif p_event_kind='independent_closure_risk_checked' then
    if v_watch.id is null or p_actor_id<>v_watch.reviewer_staff_user_id or
      p_reviewer_id<>p_actor_id or p_observed_at<v_watch.created_at or
      clock_timestamp()-v_watch.created_at>interval '14 days' or
      p_decision_code not in ('discrepancy_still_open','new_discrepancy_detected','original_evidence_missing') or
      not exists(select 1 from public.staff_users where id=p_actor_id
        and role_code in ('admin','senior_detailer','detailer') and is_active=true) then
      raise exception 'Only assigned sixth witness may record unresolved closure risk';end if;
  elsif p_event_kind='owner_continued_hold_ack' then
    if v_watch.id is null or v_independent.id is null or
      p_actor_id<>v_approval.owner_staff_user_id or
      p_reviewer_id<>v_independent.actor_staff_user_id or
      p_decision_code<>'continued_manual_hold' or
      p_evidence_kind<>'internal_exception_note' or
      p_observed_at<v_independent.created_at or
      not exists(select 1 from public.staff_users where id=p_actor_id
        and role_code='admin' and is_active=true) then
      raise exception 'Owner HOLD acknowledgment must follow sixth independent witness';end if;
  else raise exception 'Unknown fifth recurrence closure-watch event';end if;
  insert into public.gift_issuance_delivery_fifth_recurrence_closure_watch
    (id,case_id,certificate_id,attempt_id,fifth_review_id,actor_staff_user_id,
     reviewer_staff_user_id,event_kind,decision_code,evidence_kind,
     evidence_reference,evidence_sha256,observed_at)
  values(p_id,p_case_id,p_certificate_id,p_attempt_id,p_fifth_review_id,p_actor_id,
    p_reviewer_id,p_event_kind,p_decision_code,p_evidence_kind,
    p_evidence_reference,p_evidence_sha256,p_observed_at);
  return pg_catalog.jsonb_build_object('id',p_id,'closure_risk_unresolved',true,
    'manual_hold',true,'original_send_slot_consumed',true,
    'customer_messages_sent',0,'provider_requests',0,'gift_resends',0,
    'payment_mutations',0,'connection_state','DISCONNECTED');
end;
$$;
revoke all on function public.record_gift_delivery_fifth_recurrence_closure_watch(
  uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_delivery_fifth_recurrence_closure_watch(
  uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz)
  to service_role;
