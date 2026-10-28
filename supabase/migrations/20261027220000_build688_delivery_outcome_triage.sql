-- Build 688: owner-only evidence review after the irreversible B687 send slot.
-- Never dispatches, retries, reissues, charges, refunds or changes certificate state.
create table public.gift_issuance_delivery_outcome_reviews (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  certificate_id uuid not null references public.gift_certificates(id),
  attempt_id uuid not null references public.gift_issuance_one_time_dispatch_attempts(id),
  owner_staff_user_id uuid not null references public.staff_users(id),
  event_kind text not null check (event_kind in
    ('owner_provider_outcome_triage','owner_recipient_confirmation','owner_no_resend_escalation')),
  decision_code text not null check (decision_code in
    ('accepted_pending_recipient','rejected_no_resend','unknown_no_resend',
     'in_flight_no_resend','recipient_explicitly_confirmed',
     'recipient_not_confirmed','evidence_conflict','manual_followup_required')),
  evidence_kind text not null check (evidence_kind in
    ('provider_receipt','provider_dashboard_reference','internal_exception_note',
     'recipient_direct_reply','verified_phone_conversation','recipient_reported_missing')),
  evidence_reference text not null check (evidence_reference ~ '^[A-Z0-9_-]{6,64}$'),
  evidence_sha256 text not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  provider_outcome_snapshot text not null check (provider_outcome_snapshot in
    ('in_flight','provider_accepted','provider_rejected','outcome_unknown')),
  provider_receipt_sha256 text,
  notification_status_snapshot text not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(attempt_id,event_kind)
);
create index gift_688_review_case_idx on
  public.gift_issuance_delivery_outcome_reviews(case_id,created_at desc,id desc);
alter table public.gift_issuance_delivery_outcome_reviews enable row level security;
revoke all on public.gift_issuance_delivery_outcome_reviews
  from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_delivery_outcome_reviews to service_role;
create trigger gift_688_review_append_only before update or delete
  on public.gift_issuance_delivery_outcome_reviews for each row
  execute function public.reject_gift_closeout_audit_change();

create function public.record_gift_delivery_outcome_review(
  p_id uuid,p_case_id uuid,p_certificate_id uuid,p_attempt_id uuid,p_owner_id uuid,
  p_event_kind text,p_decision_code text,p_evidence_kind text,
  p_evidence_reference text,p_evidence_sha256 text,p_observed_at timestamptz
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_attempt public.gift_issuance_one_time_dispatch_attempts%rowtype;
  v_approval public.gift_issuance_one_time_dispatch_approvals%rowtype;
  v_gift public.gift_certificates%rowtype;
  v_event public.notification_events%rowtype;
  v_receipt public.gift_issuance_one_time_dispatch_receipts%rowtype;
  v_expected text;
  v_review public.gift_issuance_delivery_outcome_reviews%rowtype;
begin
  if p_id is null or p_case_id is null or p_certificate_id is null or
     p_attempt_id is null or p_owner_id is null or p_evidence_reference is null or
     p_evidence_reference !~ '^[A-Z0-9_-]{6,64}$' or
     p_evidence_sha256 is null or p_evidence_sha256 !~ '^[0-9a-f]{64}$' or
     p_observed_at is null or p_observed_at>clock_timestamp()+interval '30 seconds' or
     p_observed_at<clock_timestamp()-interval '30 days' then
    raise exception 'One bounded and dated external evidence reference is required'; end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Unknown gift case'; end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('gift-issue:'||v_case.stripe_session_id,0));
  if exists(select 1 from public.gift_issuance_delivery_outcome_reviews
      where id=p_id or (attempt_id=p_attempt_id and event_kind=p_event_kind)) then
    raise exception 'This evidence decision was already recorded; never replay it'; end if;
  select * into v_attempt from public.gift_issuance_one_time_dispatch_attempts
    where id=p_attempt_id and certificate_id=p_certificate_id for update;
  select * into v_approval from public.gift_issuance_one_time_dispatch_approvals
    where id=v_attempt.approval_id and case_id=p_case_id and certificate_id=p_certificate_id;
  select * into v_gift from public.gift_certificates
    where id=p_certificate_id and stripe_session_id=v_case.stripe_session_id;
  select * into v_event from public.notification_events
    where id=v_attempt.notification_event_id;
  select * into v_receipt from public.gift_issuance_one_time_dispatch_receipts
    where attempt_id=p_attempt_id;
  if v_attempt.id is null or v_approval.id is null or v_gift.id is null or
     v_event.id is null or v_event.event_type<>'gift_scheduled_delivery_email' or
     v_event.payload->>'gift_id' is distinct from p_certificate_id::text or
     v_event.payload->>'attempt_id' is distinct from p_attempt_id::text or
     v_gift.purchase_context #>> '{gift_delivery,notification_event_id}'
       is distinct from v_event.id::text or
     v_approval.owner_staff_user_id is distinct from p_owner_id or
     v_attempt.operator_staff_user_id=p_owner_id or
     not exists(select 1 from public.staff_users where id=p_owner_id
       and role_code='admin' and is_active=true) then
    raise exception 'Exact gift, one-time receipt or signed independent owner mismatch'; end if;
  v_expected:=case when v_attempt.status='provider_accepted' then 'sent'
    when v_attempt.status='in_flight' then 'processing' else 'failed' end;
  if v_event.status is distinct from v_expected or
     v_event.attempt_count>1 or v_event.max_attempts<>1 or
     v_event.next_attempt_at is not null or
     (v_attempt.status='in_flight' and v_receipt.attempt_id is not null) or
     (v_attempt.status<>'in_flight' and
       (v_receipt.attempt_id is null or
        v_receipt.provider_outcome is distinct from v_attempt.status or
        v_receipt.provider_receipt_sha256 is distinct from v_attempt.provider_receipt_sha256)) then
    raise exception 'Provider/notification receipt drift; escalate externally without retry'; end if;
  if p_event_kind='owner_provider_outcome_triage' then
    if p_decision_code is distinct from (case v_attempt.status
      when 'provider_accepted' then 'accepted_pending_recipient'
      when 'provider_rejected' then 'rejected_no_resend'
      when 'outcome_unknown' then 'unknown_no_resend'
      else 'in_flight_no_resend' end) or
      p_evidence_kind not in ('provider_receipt','provider_dashboard_reference','internal_exception_note') then
      raise exception 'Triage decision must match the immutable provider outcome'; end if;
  elsif p_event_kind='owner_recipient_confirmation' then
    if p_decision_code<>'recipient_explicitly_confirmed' or
       p_evidence_kind not in ('recipient_direct_reply','verified_phone_conversation') or
       p_observed_at<v_attempt.created_at or
       not exists(select 1 from public.gift_issuance_delivery_outcome_reviews
         where attempt_id=p_attempt_id and event_kind='owner_provider_outcome_triage') then
      raise exception 'Recipient confirmation requires explicit independent recipient evidence after triage'; end if;
  elsif p_event_kind='owner_no_resend_escalation' then
    if p_decision_code not in ('recipient_not_confirmed','evidence_conflict','manual_followup_required') or
       p_evidence_kind not in ('provider_receipt','provider_dashboard_reference',
          'internal_exception_note','recipient_reported_missing') or
       not exists(select 1 from public.gift_issuance_delivery_outcome_reviews
         where attempt_id=p_attempt_id and event_kind='owner_provider_outcome_triage') then
      raise exception 'No-resend escalation requires triage and an exception reason'; end if;
  else
    raise exception 'Unknown outcome review kind'; end if;
  insert into public.gift_issuance_delivery_outcome_reviews
    (id,case_id,certificate_id,attempt_id,owner_staff_user_id,event_kind,
     decision_code,evidence_kind,evidence_reference,evidence_sha256,observed_at,
     provider_outcome_snapshot,provider_receipt_sha256,notification_status_snapshot)
  values(p_id,p_case_id,p_certificate_id,p_attempt_id,p_owner_id,p_event_kind,
    p_decision_code,p_evidence_kind,p_evidence_reference,p_evidence_sha256,p_observed_at,
    v_attempt.status,v_receipt.provider_receipt_sha256,v_event.status);
  return pg_catalog.jsonb_build_object('id',p_id,'event_kind',p_event_kind,
    'provider_outcome_retained',v_attempt.status,'manual_recipient_evidence_only',true,
    'customer_messages_sent',0,'provider_dispatches',0,'payment_mutations',0,
    'gift_balance_mutations',0,'automatic_resend_permitted',false,
    'instruction','The original one-time dispatch slot remains consumed; verify provider/recipient offline');
end;
$$;
revoke all on function public.record_gift_delivery_outcome_review(
  uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_delivery_outcome_review(
  uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz) to service_role;
