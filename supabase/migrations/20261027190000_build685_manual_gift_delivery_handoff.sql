-- Build 685: receipt validation and an owner-only manual-delivery handoff.
-- This records a decision, never sends a message or changes money/gift state.
create table public.gift_issuance_manual_delivery_handoffs (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  release_event_id uuid not null unique references public.gift_issuance_verified_release_events(id),
  certificate_id uuid not null unique references public.gift_certificates(id),
  actor_staff_user_id uuid not null references public.staff_users(id),
  checkout_line_number integer not null check (checkout_line_number between 1 and 100),
  provider_checked_at timestamptz not null,
  provider_evidence_sha256 text not null check (provider_evidence_sha256 ~ '^[0-9a-f]{64}$'),
  receipt_last_seen_at timestamptz not null,
  event_kind text not null default 'owner_manual_delivery_handoff'
    check (event_kind='owner_manual_delivery_handoff'),
  created_at timestamptz not null default clock_timestamp()
);
create index gift_manual_handoff_case_idx on
  public.gift_issuance_manual_delivery_handoffs(case_id,created_at desc,id desc);
alter table public.gift_issuance_manual_delivery_handoffs enable row level security;
revoke all on public.gift_issuance_manual_delivery_handoffs from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_manual_delivery_handoffs to service_role;
create trigger gift_manual_handoff_append_only before update or delete
  on public.gift_issuance_manual_delivery_handoffs for each row
  execute function public.reject_gift_closeout_audit_change();

create function public.record_gift_manual_delivery_handoff(
  p_event_id uuid,p_release_id uuid,p_case_id uuid,p_certificate_id uuid,
  p_actor_id uuid,p_provider_check text,p_payment_intent text,p_currency text,
  p_expected_count integer,p_amount_cents bigint,p_evidence_sha256 text,
  p_checked_at timestamptz
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_release public.gift_issuance_verified_release_events%rowtype;
  v_prior public.gift_issuance_manual_delivery_handoffs%rowtype;
  v_gift public.gift_certificates%rowtype;
  v_renewal public.gift_issuance_hold_renewal_events%rowtype;
  v_followup public.gift_issuance_hold_followup_events%rowtype;
  v_source public.gift_issuance_hold_continuity_events%rowtype;
  v_decision public.gift_issuance_recovery_decisions%rowtype;
  v_receipt public.gift_issuance_receipts%rowtype;
  v_count integer;
  v_bad integer;
begin
  if p_event_id is null or p_release_id is null or p_case_id is null or
     p_certificate_id is null or p_actor_id is null then
    raise exception 'Explicit certificate, release receipt and owner required'; end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Unknown gift recovery case'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'gift-issue:'||v_case.stripe_session_id,0));
  select * into v_prior from public.gift_issuance_manual_delivery_handoffs
    where id=p_event_id or release_event_id=p_release_id or certificate_id=p_certificate_id for update;
  if found then
    if v_prior.id is distinct from p_event_id or
       v_prior.release_event_id is distinct from p_release_id or
       v_prior.case_id is distinct from p_case_id or
       v_prior.certificate_id is distinct from p_certificate_id or
       v_prior.actor_staff_user_id is distinct from p_actor_id or
       v_prior.provider_checked_at is distinct from p_checked_at or
       v_prior.provider_evidence_sha256 is distinct from p_evidence_sha256 then
      raise exception 'Manual handoff already recorded or conflicting replay'; end if;
    return pg_catalog.jsonb_build_object('id',v_prior.id,'idempotent',true,
      'historical_handoff_only',true,'manual_delivery_authorized_now',false,
      'customer_messages_sent',0,'payment_mutations',0);
  end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id for update;
  select * into v_release from public.gift_issuance_verified_release_events
    where id=p_release_id and case_id=p_case_id and certificate_id=p_certificate_id;
  select * into v_gift from public.gift_certificates
    where id=p_certificate_id and stripe_session_id=v_case.stripe_session_id for update;
  select * into v_renewal from public.gift_issuance_hold_renewal_events
    where id=v_release.renewal_event_id and case_id=p_case_id;
  select * into v_followup from public.gift_issuance_hold_followup_events
    where id=v_renewal.followup_event_id and case_id=p_case_id;
  select * into v_source from public.gift_issuance_hold_continuity_events
    where id=v_followup.continuity_event_id and case_id=p_case_id;
  select * into v_decision from public.gift_issuance_recovery_decisions
    where id=v_case.decision_id;
  select * into v_receipt from public.gift_issuance_receipts
    where stripe_session_id=v_case.stripe_session_id for update;
  if not exists(select 1 from public.staff_users
       where id=p_actor_id and role_code='admin' and is_active=true) or
     v_case.status<>'ready_for_delivery_review' or
     v_release.id is null or v_release.event_kind<>'owner_verified_release' or
     v_gift.id is null or v_gift.status<>'active' or
     v_gift.checkout_line_number is distinct from v_release.checkout_line_number or
     v_release.created_at<clock_timestamp()-interval '2 hours' or
     v_renewal.id is null or
     v_renewal.event_kind<>'owner_hold_continuity_acknowledged' or
     v_renewal.recurrence_detected or
     v_renewal.actor_staff_user_id is distinct from v_release.actor_staff_user_id or
     v_renewal.auditor_staff_user_id=v_release.actor_staff_user_id or
     v_renewal.created_at<clock_timestamp()-interval '2 hours' or
     v_renewal.provider_checked_at<clock_timestamp()-interval '2 hours' or
     (select id from public.gift_issuance_hold_renewal_events where case_id=p_case_id
       order by created_at desc,id desc limit 1) is distinct from v_renewal.id or
     v_followup.id is null or v_followup.event_kind<>'owner_followup_closed' or
     (select id from public.gift_issuance_hold_followup_events where case_id=p_case_id
       order by created_at desc,id desc limit 1) is distinct from v_followup.id or
     v_source.id is null or v_source.event_kind<>'owner_continuity_closed' or
     (select id from public.gift_issuance_hold_continuity_events where case_id=p_case_id
       order by created_at desc,id desc limit 1) is distinct from v_source.id or
     (select id from public.gift_issuance_review_recheck_events where case_id=p_case_id
       order by created_at desc,id desc limit 1) is distinct from v_followup.closeout_event_id or
     exists(select 1 from public.gift_issuance_review_followup_events
       where case_id=p_case_id and event_kind='recurrence_opened'
         and created_at>v_followup.created_at) then
    raise exception 'Verified owner release superseded, expired or recurrence reopened'; end if;
  if v_decision.id is null or v_decision.action<>'close_verified_no_action' or
     v_decision.provider_check<>'paid_verified' or
     (select id from public.gift_issuance_recovery_decisions
       where stripe_session_id=v_case.stripe_session_id
       order by created_at desc,id desc limit 1) is distinct from v_decision.id or
     p_provider_check<>'paid_verified' or p_checked_at is null or
     p_checked_at<clock_timestamp()-interval '5 minutes' or
     p_checked_at>clock_timestamp()+interval '30 seconds' or
     p_payment_intent is distinct from v_decision.provider_payment_intent or
     pg_catalog.lower(p_currency) is distinct from pg_catalog.lower(v_decision.provider_currency) or
     p_expected_count is distinct from v_decision.provider_expected_count or
     p_amount_cents is distinct from v_decision.provider_amount_cents or
     p_evidence_sha256 is null or p_evidence_sha256 !~ '^[0-9a-f]{64}$' or
     p_evidence_sha256 is distinct from v_release.provider_evidence_sha256 or
     p_evidence_sha256 is distinct from v_renewal.provider_evidence_sha256 or
     p_evidence_sha256 is distinct from v_followup.provider_evidence_sha256 or
     p_evidence_sha256 is distinct from v_source.provider_evidence_sha256 then
    raise exception 'Payment verification or release fingerprint no longer matches'; end if;
  select count(*), count(*) filter(where checkout_line_number is null or
      checkout_line_number<1 or stripe_payment_intent is distinct from p_payment_intent or
      pg_catalog.lower(currency) is distinct from pg_catalog.lower(p_currency))
    into v_count,v_bad from public.gift_certificates
    where stripe_session_id=v_case.stripe_session_id;
  if v_receipt.stripe_session_id is null or v_receipt.state<>'issued' or
     v_receipt.expected_count<>v_count or v_receipt.issued_count<>v_count or
     v_count<>p_expected_count or v_count<1 or v_count>100 or v_bad<>0 or
     v_release.receipt_last_seen_at is distinct from v_receipt.last_seen_at or
     v_renewal.receipt_last_seen_at is distinct from v_receipt.last_seen_at or
     v_followup.receipt_last_seen_at is distinct from v_receipt.last_seen_at or
     (select count(distinct checkout_line_number) from public.gift_certificates
       where stripe_session_id=v_case.stripe_session_id)<>v_count or
     (select coalesce(max(checkout_line_number),0) from public.gift_certificates
       where stripe_session_id=v_case.stripe_session_id)<>v_count or
     exists(select 1 from public.gift_issuance_webhook_events
       where stripe_session_id=v_case.stripe_session_id and observed_state='hold') then
    raise exception 'Issuance receipt changed or unresolved webhook HOLD'; end if;
  if v_gift.recipient_email is null or pg_catalog.btrim(v_gift.recipient_email)='' or
     v_gift.stripe_payment_intent is distinct from p_payment_intent or
     pg_catalog.lower(v_gift.currency) is distinct from pg_catalog.lower(p_currency) or
     (v_gift.purchase_context #>> '{gift_delivery,delivery_status}') is distinct from 'pending' or
     (v_gift.purchase_context #>> '{gift_delivery,recipient_provider_status}') is distinct from 'not_submitted' or
     (v_gift.purchase_context #>> '{gift_delivery,purchaser_copy_status}') is distinct from 'not_submitted' or
     v_gift.purchase_context #>> '{gift_delivery,sent_at}' is not null or
     v_gift.purchase_context #>> '{gift_delivery,notification_event_id}' is not null or
     v_gift.purchase_context #>> '{gift_delivery,copy_notification_event_id}' is not null or
     exists(select 1 from public.notification_events where payload->>'gift_id'=p_certificate_id::text
       and event_type in ('gift_scheduled_delivery_email','gift_scheduled_delivery_purchaser_copy_email'))
     then raise exception 'Recipient delivery already attempted or cannot be verified'; end if;
  insert into public.gift_issuance_manual_delivery_handoffs
    (id,case_id,release_event_id,certificate_id,actor_staff_user_id,
     checkout_line_number,provider_checked_at,provider_evidence_sha256,receipt_last_seen_at)
  values(p_event_id,p_case_id,p_release_id,p_certificate_id,p_actor_id,
     v_gift.checkout_line_number,p_checked_at,p_evidence_sha256,v_receipt.last_seen_at);
  return pg_catalog.jsonb_build_object('id',p_event_id,'event_kind','owner_manual_delivery_handoff',
    'idempotent',false,'manual_delivery_authorized_now',false,
    'manual_operator_review_ready',true,'customer_messages_sent',0,
    'payment_mutations',0,'gift_balance_mutations',0,'integration_events_dispatched',0,
    'instruction','Handoff recorded for separate, newly verified, explicitly approved manual delivery; this receipt never sends');
end;
$$;
revoke all on function public.record_gift_manual_delivery_handoff(
  uuid,uuid,uuid,uuid,uuid,text,text,text,integer,bigint,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_manual_delivery_handoff(
  uuid,uuid,uuid,uuid,uuid,text,text,text,integer,bigint,text,timestamptz)
  to service_role;
