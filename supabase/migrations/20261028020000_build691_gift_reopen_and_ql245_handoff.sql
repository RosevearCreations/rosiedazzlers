-- Build 691 — evidence-only gift recurrence reopening and QL-245 gateway HOLD intake.
-- Neither API can initiate delivery, charge, issue a gift or authorize integration.
create table public.gift_issuance_delivery_reopened_exception_reviews (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  certificate_id uuid not null references public.gift_certificates(id),
  attempt_id uuid not null references public.gift_issuance_one_time_dispatch_attempts(id),
  recurrence_review_id uuid not null references public.gift_issuance_delivery_closure_recurrence(id),
  actor_staff_user_id uuid not null references public.staff_users(id),
  reviewer_staff_user_id uuid not null references public.staff_users(id),
  event_kind text not null check(event_kind in ('owner_exception_reopened',
    'independent_aging_reassessed','owner_hold_continuity_ack')),
  decision_code text not null check(decision_code in ('reopen_recurrence_detected',
    'reopen_missing_evidence','still_unresolved','new_evidence_not_confirmed',
    'evidence_conflicting','manual_hold_acknowledged')),
  evidence_kind text not null check(evidence_kind in ('internal_exception_note',
    'provider_dashboard_reference','recipient_direct_reply','verified_phone_conversation',
    'recipient_reported_missing')),
  evidence_reference text not null check(evidence_reference ~ '^[A-Z0-9_-]{6,64}$'),
  evidence_sha256 text not null check(evidence_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(attempt_id,event_kind)
);
create index gift_691_reopened_case_idx on
  public.gift_issuance_delivery_reopened_exception_reviews(case_id,created_at desc);
alter table public.gift_issuance_delivery_reopened_exception_reviews enable row level security;
revoke all on public.gift_issuance_delivery_reopened_exception_reviews from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_delivery_reopened_exception_reviews to service_role;
create trigger gift_691_reopened_append_only before update or delete
  on public.gift_issuance_delivery_reopened_exception_reviews for each row
  execute function public.reject_gift_closeout_audit_change();

create function public.record_gift_delivery_reopened_exception_review(
  p_id uuid,p_case_id uuid,p_certificate_id uuid,p_attempt_id uuid,
  p_recurrence_review_id uuid,p_actor_id uuid,p_reviewer_id uuid,
  p_event_kind text,p_decision_code text,p_evidence_kind text,
  p_evidence_reference text,p_evidence_sha256 text,p_observed_at timestamptz
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_attempt public.gift_issuance_one_time_dispatch_attempts%rowtype;
  v_approval public.gift_issuance_one_time_dispatch_approvals%rowtype;
  v_audit public.gift_issuance_delivery_closure_recurrence%rowtype;
  v_watch public.gift_issuance_delivery_closure_recurrence%rowtype;
  v_recheck public.gift_issuance_delivery_followup_reviews%rowtype;
  v_reopen public.gift_issuance_delivery_reopened_exception_reviews%rowtype;
  v_independent public.gift_issuance_delivery_reopened_exception_reviews%rowtype;
begin
  if p_id is null or p_case_id is null or p_certificate_id is null or
    p_attempt_id is null or p_recurrence_review_id is null or
    p_actor_id is null or p_reviewer_id is null or
    p_evidence_reference !~ '^[A-Z0-9_-]{6,64}$' or
    p_evidence_sha256 !~ '^[0-9a-f]{64}$' or
    p_observed_at is null or p_observed_at>clock_timestamp()+interval '30 seconds' or
    p_observed_at<clock_timestamp()-interval '30 days' then
    raise exception 'Exact, current, nonpersonal reopening proof required';end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Unknown original checkout';end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('gift-issue:'||v_case.stripe_session_id,0));
  if exists(select 1 from public.gift_issuance_delivery_reopened_exception_reviews
    where id=p_id or (attempt_id=p_attempt_id and event_kind=p_event_kind)) then
    raise exception 'Reopened exception action already recorded; no replay';end if;
  select * into v_attempt from public.gift_issuance_one_time_dispatch_attempts
    where id=p_attempt_id and certificate_id=p_certificate_id;
  select * into v_approval from public.gift_issuance_one_time_dispatch_approvals
    where id=v_attempt.approval_id and case_id=p_case_id and certificate_id=p_certificate_id;
  select * into v_audit from public.gift_issuance_delivery_closure_recurrence
    where id=p_recurrence_review_id and case_id=p_case_id
      and certificate_id=p_certificate_id and attempt_id=p_attempt_id
      and event_kind='independent_recurrence_audited';
  select * into v_watch from public.gift_issuance_delivery_closure_recurrence
    where attempt_id=p_attempt_id and event_kind='owner_watch_opened';
  select * into v_recheck from public.gift_issuance_delivery_followup_reviews
    where attempt_id=p_attempt_id and event_kind='independent_recipient_recheck';
  select * into v_reopen from public.gift_issuance_delivery_reopened_exception_reviews
    where attempt_id=p_attempt_id and event_kind='owner_exception_reopened';
  select * into v_independent from public.gift_issuance_delivery_reopened_exception_reviews
    where attempt_id=p_attempt_id and event_kind='independent_aging_reassessed';
  if v_attempt.id is null or v_approval.id is null or v_audit.id is null or
    v_watch.id is null or v_recheck.id is null or
    v_audit.decision_code not in ('recurrence_detected','evidence_missing') or
    v_audit.actor_staff_user_id<>v_watch.reviewer_staff_user_id or
    not exists(select 1 from public.gift_certificates
      where id=p_certificate_id and stripe_session_id=v_case.stripe_session_id) or
    exists(select 1 from public.notification_events
      where id=v_attempt.notification_event_id and
        (max_attempts<>1 or next_attempt_at is not null)) then
    raise exception 'Original one-time delivery and independently detected recurrence must match';end if;
  if p_event_kind='owner_exception_reopened' then
    if p_actor_id<>v_approval.owner_staff_user_id or
      not exists(select 1 from public.staff_users where id=p_actor_id
        and is_active=true and role_code='admin') or
      p_reviewer_id in (p_actor_id,v_attempt.operator_staff_user_id,
        v_recheck.actor_staff_user_id,v_watch.reviewer_staff_user_id) or
      not exists(select 1 from public.staff_users where id=p_reviewer_id
        and is_active=true and role_code in ('admin','senior_detailer','detailer')) or
      (v_audit.decision_code='recurrence_detected' and
        p_decision_code<>'reopen_recurrence_detected') or
      (v_audit.decision_code='evidence_missing' and
        p_decision_code<>'reopen_missing_evidence') or
      p_evidence_kind<>'internal_exception_note' or
      p_observed_at<v_audit.created_at then
      raise exception 'Owner must reopen the detected exception for a distinct fourth reviewer';end if;
  elsif p_event_kind='independent_aging_reassessed' then
    if v_reopen.id is null or p_actor_id<>v_reopen.reviewer_staff_user_id or
      p_reviewer_id<>p_actor_id or p_observed_at<v_reopen.created_at or
      clock_timestamp()-v_reopen.created_at>interval '14 days' or
      p_decision_code not in ('still_unresolved','new_evidence_not_confirmed','evidence_conflicting') or
      not exists(select 1 from public.staff_users where id=p_actor_id
        and is_active=true and role_code in ('admin','senior_detailer','detailer')) then
      raise exception 'Only fourth independent reviewer may reassess current aging evidence';end if;
  elsif p_event_kind='owner_hold_continuity_ack' then
    if v_reopen.id is null or v_independent.id is null or
      p_actor_id<>v_approval.owner_staff_user_id or
      p_reviewer_id<>v_independent.actor_staff_user_id or
      p_decision_code<>'manual_hold_acknowledged' or
      p_evidence_kind<>'internal_exception_note' or
      p_observed_at<v_independent.created_at or
      not exists(select 1 from public.staff_users where id=p_actor_id
        and is_active=true and role_code='admin') then
      raise exception 'Separate owner HOLD acknowledgment must follow fourth independent review';end if;
  else raise exception 'Unknown reopened-exception action';end if;
  insert into public.gift_issuance_delivery_reopened_exception_reviews
    (id,case_id,certificate_id,attempt_id,recurrence_review_id,actor_staff_user_id,
     reviewer_staff_user_id,event_kind,decision_code,evidence_kind,
     evidence_reference,evidence_sha256,observed_at)
  values(p_id,p_case_id,p_certificate_id,p_attempt_id,p_recurrence_review_id,
    p_actor_id,p_reviewer_id,p_event_kind,p_decision_code,p_evidence_kind,
    p_evidence_reference,p_evidence_sha256,p_observed_at);
  return pg_catalog.jsonb_build_object('id',p_id,'decision',p_decision_code,
    'case_reopened_for_manual_review',true,'reopened_exception_still_held',true,
    'owner_attention_required',true,'original_send_slot_consumed',true,
    'customer_messages_sent',0,'provider_dispatches',0,'payment_mutations',0,
    'automatic_resend_permitted',false);
end;
$$;
revoke all on function public.record_gift_delivery_reopened_exception_review(
  uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_delivery_reopened_exception_review(
  uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz)
  to service_role;

-- QL-245: persist evidence inventory truth only. No signatures/keys/gateway proofs are invented.
create table public.rosevear_integration_v1_ql245_owner_handoffs (
  id uuid primary key,
  owner_staff_user_id uuid not null references public.staff_users(id),
  source_revision text check(source_revision is null or source_revision ~ '^[0-9a-f]{40}$'),
  evidence_reference text not null check(evidence_reference ~ '^[A-Z0-9_-]{6,64}$'),
  evidence_sha256 text not null check(evidence_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  negative_denials jsonb not null,
  readiness_state text not null default 'EVIDENCE_PENDING' check(readiness_state='EVIDENCE_PENDING'),
  connection_state text not null default 'DISCONNECTED' check(connection_state='DISCONNECTED'),
  owner_authorization text not null default 'NOT_GIVEN' check(owner_authorization='NOT_GIVEN'),
  independent_witness_state text not null default 'UNVERIFIED' check(independent_witness_state='UNVERIFIED'),
  signer_state text not null default 'NOT_PROVISIONED' check(signer_state='NOT_PROVISIONED'),
  created_at timestamptz not null default clock_timestamp(),
  unique(owner_staff_user_id,evidence_reference)
);
create index rosevear_691_handoff_created_idx on
  public.rosevear_integration_v1_ql245_owner_handoffs(created_at desc);
alter table public.rosevear_integration_v1_ql245_owner_handoffs enable row level security;
revoke all on public.rosevear_integration_v1_ql245_owner_handoffs from public,anon,authenticated,service_role;
grant select,insert on public.rosevear_integration_v1_ql245_owner_handoffs to service_role;
create trigger rosevear_691_handoff_append_only before update or delete
  on public.rosevear_integration_v1_ql245_owner_handoffs for each row
  execute function public.reject_gift_closeout_audit_change();
create function public.record_rosevear_integration_v1_ql245_owner_handoff(
  p_id uuid,p_owner_id uuid,p_source_revision text,p_evidence_reference text,
  p_evidence_sha256 text,p_observed_at timestamptz,p_negatives jsonb
) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if p_id is null or p_owner_id is null or
    p_evidence_reference !~ '^[A-Z0-9_-]{6,64}$' or
    p_evidence_sha256 !~ '^[0-9a-f]{64}$' or
    (p_source_revision is not null and p_source_revision !~ '^[0-9a-f]{40}$') or
    p_observed_at is null or p_observed_at>clock_timestamp()+interval '30 seconds' or
    p_observed_at<clock_timestamp()-interval '7 days' or
    pg_catalog.jsonb_typeof(p_negatives)<>'object' or
    (select count(*) from pg_catalog.jsonb_object_keys(p_negatives))<>7 or
    not (p_negatives ?& array['nonce_replay','stale_request','wrong_business',
      'wrong_tenant','revoked_key','prohibited_write','prohibited_dispatch']) or
    exists(select 1 from pg_catalog.jsonb_each(p_negatives) where value<>'false'::jsonb) or
    not exists(select 1 from public.staff_users
      where id=p_owner_id and is_active=true and role_code='admin') then
    raise exception 'Only a real owner may record all-seven-unverified QL-245 HOLD intake';end if;
  insert into public.rosevear_integration_v1_ql245_owner_handoffs
    (id,owner_staff_user_id,source_revision,evidence_reference,evidence_sha256,
     observed_at,negative_denials)
  values(p_id,p_owner_id,p_source_revision,p_evidence_reference,p_evidence_sha256,
    p_observed_at,p_negatives);
  return pg_catalog.jsonb_build_object('id',p_id,'readiness_state','EVIDENCE_PENDING',
    'connection_state','DISCONNECTED','owner_authorization','NOT_GIVEN',
    'independent_witness_state','UNVERIFIED','signer_state','NOT_PROVISIONED',
    'gateway_requests_sent',0,'customer_messages_sent',0,'writes_executed',0);
end;
$$;
revoke all on function public.record_rosevear_integration_v1_ql245_owner_handoff(
  uuid,uuid,text,text,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.record_rosevear_integration_v1_ql245_owner_handoff(
  uuid,uuid,text,text,text,timestamptz,jsonb) to service_role;
