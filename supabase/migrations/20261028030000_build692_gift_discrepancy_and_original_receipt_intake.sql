-- Build 692: fifth independent discrepancy watch and unverified original-receipt intake.
-- Both append-only ledgers stay internal: no gift mutation, gateway contact, or approval.
create table public.gift_issuance_delivery_reopened_discrepancy_watch (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  certificate_id uuid not null references public.gift_certificates(id),
  attempt_id uuid not null references public.gift_issuance_one_time_dispatch_attempts(id),
  fourth_review_id uuid not null references public.gift_issuance_delivery_reopened_exception_reviews(id),
  actor_staff_user_id uuid not null references public.staff_users(id),
  reviewer_staff_user_id uuid not null references public.staff_users(id),
  event_kind text not null check(event_kind in ('owner_discrepancy_watch_opened',
    'independent_discrepancy_reassessed','owner_no_resend_hold_ack')),
  decision_code text not null check(decision_code in ('discrepancy_review_requested',
    'still_disputed','documentary_gap','contradiction_not_resolved','continued_manual_hold')),
  evidence_kind text not null check(evidence_kind in ('internal_exception_note',
    'recipient_direct_reply','verified_phone_conversation','recipient_reported_missing',
    'provider_dashboard_reference')),
  evidence_reference text not null check(evidence_reference ~ '^[A-Z0-9_-]{6,64}$'),
  evidence_sha256 text not null check(evidence_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(attempt_id,event_kind)
);
create index gift_692_discrepancy_case_idx on
  public.gift_issuance_delivery_reopened_discrepancy_watch(case_id,created_at desc);
alter table public.gift_issuance_delivery_reopened_discrepancy_watch enable row level security;
revoke all on public.gift_issuance_delivery_reopened_discrepancy_watch from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_delivery_reopened_discrepancy_watch to service_role;
create trigger gift_692_discrepancy_append_only before update or delete
  on public.gift_issuance_delivery_reopened_discrepancy_watch for each row
  execute function public.reject_gift_closeout_audit_change();

create function public.record_gift_delivery_reopened_discrepancy_watch(
  p_id uuid,p_case_id uuid,p_certificate_id uuid,p_attempt_id uuid,
  p_fourth_review_id uuid,p_actor_id uuid,p_reviewer_id uuid,
  p_event_kind text,p_decision_code text,p_evidence_kind text,
  p_evidence_reference text,p_evidence_sha256 text,p_observed_at timestamptz
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_attempt public.gift_issuance_one_time_dispatch_attempts%rowtype;
  v_approval public.gift_issuance_one_time_dispatch_approvals%rowtype;
  v_original_recheck public.gift_issuance_delivery_followup_reviews%rowtype;
  v_recurrence public.gift_issuance_delivery_closure_recurrence%rowtype;
  v_reopen public.gift_issuance_delivery_reopened_exception_reviews%rowtype;
  v_fourth public.gift_issuance_delivery_reopened_exception_reviews%rowtype;
  v_hold public.gift_issuance_delivery_reopened_exception_reviews%rowtype;
  v_watch public.gift_issuance_delivery_reopened_discrepancy_watch%rowtype;
  v_fifth public.gift_issuance_delivery_reopened_discrepancy_watch%rowtype;
begin
  if p_id is null or p_case_id is null or p_certificate_id is null or
    p_attempt_id is null or p_fourth_review_id is null or p_actor_id is null or
    p_reviewer_id is null or p_evidence_reference !~ '^[A-Z0-9_-]{6,64}$' or
    p_evidence_sha256 !~ '^[0-9a-f]{64}$' or p_observed_at is null or
    p_observed_at>clock_timestamp()+interval '30 seconds' or
    p_observed_at<clock_timestamp()-interval '30 days' then
    raise exception 'Exact original discrepancy and recent evidence are required';end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if v_case.id is null then raise exception 'Original checkout not found';end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('gift-issue:'||v_case.stripe_session_id,0));
  if exists(select 1 from public.gift_issuance_delivery_reopened_discrepancy_watch
    where id=p_id or (attempt_id=p_attempt_id and event_kind=p_event_kind)) then
    raise exception 'Discrepancy review already recorded; duplicate denied';end if;
  select * into v_attempt from public.gift_issuance_one_time_dispatch_attempts
    where id=p_attempt_id and certificate_id=p_certificate_id;
  select * into v_approval from public.gift_issuance_one_time_dispatch_approvals
    where id=v_attempt.approval_id and case_id=p_case_id and certificate_id=p_certificate_id;
  select * into v_original_recheck from public.gift_issuance_delivery_followup_reviews
    where attempt_id=p_attempt_id and event_kind='independent_recipient_recheck';
  select * into v_recurrence from public.gift_issuance_delivery_closure_recurrence
    where attempt_id=p_attempt_id and event_kind='owner_watch_opened';
  select * into v_reopen from public.gift_issuance_delivery_reopened_exception_reviews
    where attempt_id=p_attempt_id and event_kind='owner_exception_reopened';
  select * into v_fourth from public.gift_issuance_delivery_reopened_exception_reviews
    where id=p_fourth_review_id and attempt_id=p_attempt_id and
      event_kind='independent_aging_reassessed';
  select * into v_hold from public.gift_issuance_delivery_reopened_exception_reviews
    where attempt_id=p_attempt_id and event_kind='owner_hold_continuity_ack';
  select * into v_watch from public.gift_issuance_delivery_reopened_discrepancy_watch
    where attempt_id=p_attempt_id and event_kind='owner_discrepancy_watch_opened';
  select * into v_fifth from public.gift_issuance_delivery_reopened_discrepancy_watch
    where attempt_id=p_attempt_id and event_kind='independent_discrepancy_reassessed';
  if v_attempt.id is null or v_approval.id is null or v_original_recheck.id is null or
    v_recurrence.id is null or v_reopen.id is null or v_fourth.id is null or
    v_hold.id is null or v_fourth.actor_staff_user_id<>v_reopen.reviewer_staff_user_id or
    v_hold.actor_staff_user_id<>v_approval.owner_staff_user_id or
    v_fourth.decision_code not in ('evidence_conflicting','new_evidence_not_confirmed') or
    not exists(select 1 from public.gift_certificates
      where id=p_certificate_id and stripe_session_id=v_case.stripe_session_id) or
    exists(select 1 from public.notification_events
      where id=v_attempt.notification_event_id and
      (max_attempts<>1 or next_attempt_at is not null)) then
    raise exception 'Verified conflicting fourth review and permanent no-resend HOLD required';end if;
  if p_event_kind='owner_discrepancy_watch_opened' then
    if p_actor_id<>v_approval.owner_staff_user_id or
      p_reviewer_id in (p_actor_id,v_attempt.operator_staff_user_id,
        v_original_recheck.actor_staff_user_id,v_recurrence.reviewer_staff_user_id,
        v_fourth.actor_staff_user_id) or
      not exists(select 1 from public.staff_users where id=p_actor_id
        and role_code='admin' and is_active=true) or
      not exists(select 1 from public.staff_users where id=p_reviewer_id
        and role_code in ('admin','senior_detailer','detailer') and is_active=true) or
      p_decision_code<>'discrepancy_review_requested' or
      p_evidence_kind<>'internal_exception_note' or
      p_observed_at<v_hold.created_at then
      raise exception 'Only owner can assign fifth distinct independent discrepancy reviewer';end if;
  elsif p_event_kind='independent_discrepancy_reassessed' then
    if v_watch.id is null or p_actor_id<>v_watch.reviewer_staff_user_id or
      p_reviewer_id<>p_actor_id or p_observed_at<v_watch.created_at or
      clock_timestamp()-v_watch.created_at>interval '14 days' or
      p_decision_code not in ('still_disputed','documentary_gap','contradiction_not_resolved') or
      not exists(select 1 from public.staff_users where id=p_actor_id
        and role_code in ('admin','senior_detailer','detailer') and is_active=true) then
      raise exception 'Only assigned fifth reviewer may reassess unresolved discrepancy';end if;
  elsif p_event_kind='owner_no_resend_hold_ack' then
    if v_watch.id is null or v_fifth.id is null or
      p_actor_id<>v_approval.owner_staff_user_id or p_reviewer_id<>v_fifth.actor_staff_user_id or
      p_decision_code<>'continued_manual_hold' or
      p_evidence_kind<>'internal_exception_note' or
      p_observed_at<v_fifth.created_at or
      not exists(select 1 from public.staff_users where id=p_actor_id
        and role_code='admin' and is_active=true) then
      raise exception 'Owner must acknowledge continuing HOLD after fifth review';end if;
  else raise exception 'Invalid discrepancy-watch stage';end if;
  insert into public.gift_issuance_delivery_reopened_discrepancy_watch
    (id,case_id,certificate_id,attempt_id,fourth_review_id,actor_staff_user_id,
     reviewer_staff_user_id,event_kind,decision_code,evidence_kind,
     evidence_reference,evidence_sha256,observed_at)
  values(p_id,p_case_id,p_certificate_id,p_attempt_id,p_fourth_review_id,p_actor_id,
     p_reviewer_id,p_event_kind,p_decision_code,p_evidence_kind,
     p_evidence_reference,p_evidence_sha256,p_observed_at);
  return pg_catalog.jsonb_build_object('id',p_id,'manual_hold',true,
    'discrepancy_unresolved',true,'customer_messages_sent',0,
    'provider_requests',0,'payment_mutations',0,'gift_resends',0);
end;
$$;
revoke all on function public.record_gift_delivery_reopened_discrepancy_watch(
  uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_delivery_reopened_discrepancy_watch(
  uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz)
  to service_role;

-- QL-245/246 original reference IDs may be staged, NEVER asserted genuine by this table.
create table public.rosevear_integration_v1_original_receipt_intake (
  id uuid primary key,
  owner_staff_user_id uuid not null references public.staff_users(id),
  evidence_reference text not null unique check(evidence_reference ~ '^[A-Z0-9_-]{6,64}$'),
  source_system text not null default 'rosiedazzlers' check(source_system='rosiedazzlers'),
  receipt_kind text not null check(receipt_kind in ('health','capabilities','gateway_audit',
    'registered_key','source_challenge','source_proof','independent_pin')),
  original_receipt_reference text not null check(original_receipt_reference ~ '^np-[A-Za-z0-9_-]{6,120}$'),
  source_revision text check(source_revision is null or source_revision ~ '^[0-9a-f]{40}$'),
  evidence_sha256 text not null check(evidence_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  review_state text not null default 'UNVERIFIED_ORIGINAL' check(review_state='UNVERIFIED_ORIGINAL'),
  connection_state text not null default 'DISCONNECTED' check(connection_state='DISCONNECTED'),
  owner_authorization text not null default 'NOT_GIVEN' check(owner_authorization='NOT_GIVEN'),
  created_at timestamptz not null default clock_timestamp()
);
create index rosevear_692_original_intake_created_idx on
  public.rosevear_integration_v1_original_receipt_intake(created_at desc);
alter table public.rosevear_integration_v1_original_receipt_intake enable row level security;
revoke all on public.rosevear_integration_v1_original_receipt_intake from public,anon,authenticated,service_role;
grant select,insert on public.rosevear_integration_v1_original_receipt_intake to service_role;
create trigger rosevear_692_original_intake_append_only before update or delete
  on public.rosevear_integration_v1_original_receipt_intake for each row
  execute function public.reject_gift_closeout_audit_change();
create function public.record_rosevear_integration_v1_original_receipt_intake(
  p_id uuid,p_owner_id uuid,p_evidence_reference text,p_receipt_kind text,
  p_original_receipt_reference text,p_source_revision text,
  p_evidence_sha256 text,p_observed_at timestamptz
) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if p_id is null or p_owner_id is null or p_evidence_reference !~ '^[A-Z0-9_-]{6,64}$' or
    p_receipt_kind not in ('health','capabilities','gateway_audit','registered_key',
      'source_challenge','source_proof','independent_pin') or
    p_original_receipt_reference !~ '^np-[A-Za-z0-9_-]{6,120}$' or
    (p_source_revision is not null and p_source_revision !~ '^[0-9a-f]{40}$') or
    p_evidence_sha256 !~ '^[0-9a-f]{64}$' or
    p_observed_at is null or p_observed_at>clock_timestamp()+interval '30 seconds' or
    p_observed_at<clock_timestamp()-interval '7 days' or
    not exists(select 1 from public.staff_users where id=p_owner_id
      and role_code='admin' and is_active=true) then
    raise exception 'Owner source-reference intake requires nonsecret exact metadata';end if;
  insert into public.rosevear_integration_v1_original_receipt_intake
    (id,owner_staff_user_id,evidence_reference,receipt_kind,
     original_receipt_reference,source_revision,evidence_sha256,observed_at)
  values(p_id,p_owner_id,p_evidence_reference,p_receipt_kind,
     p_original_receipt_reference,p_source_revision,p_evidence_sha256,p_observed_at);
  return pg_catalog.jsonb_build_object('id',p_id,'review_state','UNVERIFIED_ORIGINAL',
    'connection_state','DISCONNECTED','owner_authorization','NOT_GIVEN',
    'authenticated_gateway_requests',0,'gift_resends',0,'payment_mutations',0);
end;
$$;
revoke all on function public.record_rosevear_integration_v1_original_receipt_intake(
  uuid,uuid,text,text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.record_rosevear_integration_v1_original_receipt_intake(
  uuid,uuid,text,text,text,text,text,timestamptz) to service_role;
