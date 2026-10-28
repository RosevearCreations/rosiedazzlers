-- Build 690: closed-gift recurrence review and no-resend alert audit.
-- This migration cannot contact a customer, dispatch or approve an integration pilot.
create table public.gift_issuance_delivery_closure_recurrence (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  certificate_id uuid not null references public.gift_certificates(id),
  attempt_id uuid not null references public.gift_issuance_one_time_dispatch_attempts(id),
  closure_id uuid not null references public.gift_issuance_delivery_followup_reviews(id),
  actor_staff_user_id uuid not null references public.staff_users(id),
  reviewer_staff_user_id uuid not null references public.staff_users(id),
  event_kind text not null check (event_kind in
    ('owner_watch_opened','independent_recurrence_audited','owner_no_resend_alert_ack')),
  decision_code text not null check (decision_code in
    ('watch_requested','no_recurrence_observed','recurrence_detected',
      'evidence_missing','acknowledged_no_resend')),
  evidence_kind text not null check (evidence_kind in
    ('internal_exception_note','provider_dashboard_reference','recipient_direct_reply',
      'verified_phone_conversation','recipient_reported_missing')),
  evidence_reference text not null check (evidence_reference ~ '^[A-Z0-9_-]{6,64}$'),
  evidence_sha256 text not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  closure_status_snapshot text not null check (closure_status_snapshot in
    ('confirmed_no_resend_closed','unconfirmed_no_resend_closed')),
  created_at timestamptz not null default clock_timestamp(),
  unique(attempt_id,event_kind)
);
create index gift_690_closure_case_idx on
  public.gift_issuance_delivery_closure_recurrence(case_id,created_at desc);
alter table public.gift_issuance_delivery_closure_recurrence enable row level security;
revoke all on public.gift_issuance_delivery_closure_recurrence from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_delivery_closure_recurrence to service_role;
create trigger gift_690_closure_append_only before update or delete
  on public.gift_issuance_delivery_closure_recurrence for each row
  execute function public.reject_gift_closeout_audit_change();

create function public.record_gift_delivery_closure_recurrence(
  p_id uuid,p_case_id uuid,p_certificate_id uuid,p_attempt_id uuid,p_closure_id uuid,
  p_actor_id uuid,p_reviewer_id uuid,p_event_kind text,p_decision_code text,
  p_evidence_kind text,p_evidence_reference text,p_evidence_sha256 text,
  p_observed_at timestamptz
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_closure public.gift_issuance_delivery_followup_reviews%rowtype;
  v_recheck public.gift_issuance_delivery_followup_reviews%rowtype;
  v_attempt public.gift_issuance_one_time_dispatch_attempts%rowtype;
  v_approval public.gift_issuance_one_time_dispatch_approvals%rowtype;
  v_watch public.gift_issuance_delivery_closure_recurrence%rowtype;
  v_audit public.gift_issuance_delivery_closure_recurrence%rowtype;
begin
  if p_id is null or p_case_id is null or p_certificate_id is null or
     p_attempt_id is null or p_closure_id is null or p_actor_id is null or
     p_reviewer_id is null or p_evidence_reference !~ '^[A-Z0-9_-]{6,64}$' or
     p_evidence_sha256 !~ '^[0-9a-f]{64}$' or
     p_observed_at is null or p_observed_at>clock_timestamp()+interval '30 seconds' or
     p_observed_at<clock_timestamp()-interval '30 days' then
    raise exception 'Exact dated and bounded closure evidence required'; end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Unknown gift case';end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('gift-issue:'||v_case.stripe_session_id,0));
  if exists(select 1 from public.gift_issuance_delivery_closure_recurrence
    where id=p_id or (attempt_id=p_attempt_id and event_kind=p_event_kind)) then
    raise exception 'Closure recurrence action already recorded; no replay';end if;
  select * into v_closure from public.gift_issuance_delivery_followup_reviews
    where id=p_closure_id and attempt_id=p_attempt_id and case_id=p_case_id
    and certificate_id=p_certificate_id and event_kind='owner_no_resend_closeout';
  select * into v_recheck from public.gift_issuance_delivery_followup_reviews
    where attempt_id=p_attempt_id and event_kind='independent_recipient_recheck';
  select * into v_attempt from public.gift_issuance_one_time_dispatch_attempts
    where id=p_attempt_id and certificate_id=p_certificate_id;
  select * into v_approval from public.gift_issuance_one_time_dispatch_approvals
    where id=v_attempt.approval_id and case_id=p_case_id and certificate_id=p_certificate_id;
  select * into v_watch from public.gift_issuance_delivery_closure_recurrence
    where attempt_id=p_attempt_id and event_kind='owner_watch_opened';
  select * into v_audit from public.gift_issuance_delivery_closure_recurrence
    where attempt_id=p_attempt_id and event_kind='independent_recurrence_audited';
  if v_closure.id is null or v_recheck.id is null or v_attempt.id is null or
     v_approval.id is null or
     not exists(select 1 from public.gift_certificates where id=p_certificate_id
       and stripe_session_id=v_case.stripe_session_id) or
     v_closure.decision_code not in ('confirmed_no_resend_closed','unconfirmed_no_resend_closed') or
     v_closure.actor_staff_user_id<>v_approval.owner_staff_user_id or
     exists(select 1 from public.notification_events
       where id=v_attempt.notification_event_id and (max_attempts<>1 or next_attempt_at is not null)) then
    raise exception 'Original irreversible gift closure continuity mismatch';end if;
  if p_event_kind='owner_watch_opened' then
    if p_decision_code<>'watch_requested' or p_evidence_kind<>'internal_exception_note' or
       p_actor_id<>v_approval.owner_staff_user_id or
       p_reviewer_id in (p_actor_id,v_attempt.operator_staff_user_id,
                         v_recheck.actor_staff_user_id) or
       not exists(select 1 from public.staff_users where id=p_actor_id and is_active=true and role_code='admin') or
       not exists(select 1 from public.staff_users where id=p_reviewer_id and is_active=true
         and role_code in ('admin','senior_detailer','detailer')) then
      raise exception 'Owner must assign a third distinct active recurrence reviewer';end if;
  elsif p_event_kind='independent_recurrence_audited' then
    if v_watch.id is null or p_actor_id<>v_watch.reviewer_staff_user_id or
       p_reviewer_id<>p_actor_id or p_observed_at<v_watch.created_at or
       clock_timestamp()-v_watch.created_at>interval '14 days' or
       p_decision_code not in ('no_recurrence_observed','recurrence_detected','evidence_missing') or
       not exists(select 1 from public.staff_users where id=p_actor_id and is_active=true) then
      raise exception 'Only the assigned third reviewer may recheck current recurrence evidence';end if;
  elsif p_event_kind='owner_no_resend_alert_ack' then
    if v_watch.id is null or v_audit.id is null or
       p_actor_id<>v_approval.owner_staff_user_id or
       p_reviewer_id<>v_audit.actor_staff_user_id or
       p_decision_code<>'acknowledged_no_resend' or
       p_evidence_kind<>'internal_exception_note' or
       p_observed_at<v_audit.created_at or
       not exists(select 1 from public.staff_users where id=p_actor_id
         and is_active=true and role_code='admin') then
      raise exception 'Owner must separately acknowledge independent recurrence alert; never resend';end if;
  else raise exception 'Unknown closure recurrence kind';end if;
  insert into public.gift_issuance_delivery_closure_recurrence
    (id,case_id,certificate_id,attempt_id,closure_id,actor_staff_user_id,
     reviewer_staff_user_id,event_kind,decision_code,evidence_kind,
     evidence_reference,evidence_sha256,observed_at,closure_status_snapshot)
  values(p_id,p_case_id,p_certificate_id,p_attempt_id,p_closure_id,p_actor_id,
     p_reviewer_id,p_event_kind,p_decision_code,p_evidence_kind,
     p_evidence_reference,p_evidence_sha256,p_observed_at,v_closure.decision_code);
  return pg_catalog.jsonb_build_object('id',p_id,'decision',p_decision_code,
    'recurrence_requires_manual_attention',
    (p_decision_code in ('recurrence_detected','evidence_missing')),
    'original_send_slot_consumed',true,'customer_messages_sent',0,
    'provider_dispatches',0,'payment_mutations',0,'automatic_resend_permitted',false);
end;
$$;
revoke all on function public.record_gift_delivery_closure_recurrence(
  uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_delivery_closure_recurrence(
  uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz) to service_role;

-- QL-243: owner can record ONLY a HOLD readiness inventory, not pilot authorization.
create table public.rosevear_integration_v1_owner_readiness_reviews (
  id uuid primary key,
  owner_staff_user_id uuid not null references public.staff_users(id),
  source_revision text check (source_revision is null or source_revision ~ '^[0-9a-f]{40}$'),
  evidence_reference text not null check (evidence_reference ~ '^[A-Z0-9_-]{6,64}$'),
  evidence_sha256 text not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  configuration_snapshot jsonb not null,
  connection_status text not null default 'HOLD' check (connection_status='HOLD'),
  pilot_authorized boolean not null default false check (pilot_authorized=false),
  created_at timestamptz not null default clock_timestamp(),
  unique(owner_staff_user_id,evidence_reference)
);
create index rosevear_690_readiness_age_idx on
  public.rosevear_integration_v1_owner_readiness_reviews(created_at desc);
alter table public.rosevear_integration_v1_owner_readiness_reviews enable row level security;
revoke all on public.rosevear_integration_v1_owner_readiness_reviews from public,anon,authenticated,service_role;
grant select,insert on public.rosevear_integration_v1_owner_readiness_reviews to service_role;
create trigger rosevear_690_readiness_append_only before update or delete
  on public.rosevear_integration_v1_owner_readiness_reviews for each row
  execute function public.reject_gift_closeout_audit_change();

create function public.record_rosevear_integration_v1_owner_readiness(
  p_id uuid,p_owner_id uuid,p_source_revision text,p_evidence_reference text,
  p_evidence_sha256 text,p_observed_at timestamptz,p_snapshot jsonb
) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if p_id is null or p_owner_id is null or
     p_evidence_reference !~ '^[A-Z0-9_-]{6,64}$' or
     p_evidence_sha256 !~ '^[0-9a-f]{64}$' or
     (p_source_revision is not null and p_source_revision !~ '^[0-9a-f]{40}$') or
     p_observed_at is null or p_observed_at>clock_timestamp()+interval '30 seconds' or
     p_observed_at<clock_timestamp()-interval '7 days' or
     pg_catalog.jsonb_typeof(p_snapshot)<>'object' or
     (select count(*) from pg_catalog.jsonb_object_keys(p_snapshot))<>7 or
     not (p_snapshot ?& array['mode_configured','origin_configured','key_id_configured',
       'hmac_key_configured','gateway_audit_verified','witness_verified','pilot_authorized']) or
     (p_snapshot->>'gateway_audit_verified')::boolean is distinct from false or
     (p_snapshot->>'witness_verified')::boolean is distinct from false or
     (p_snapshot->>'pilot_authorized')::boolean is distinct from false or
     not exists(select 1 from public.staff_users where id=p_owner_id
       and is_active=true and role_code='admin') then
    raise exception 'Owner may record only a current seven-field HOLD checklist';end if;
  insert into public.rosevear_integration_v1_owner_readiness_reviews
    (id,owner_staff_user_id,source_revision,evidence_reference,
     evidence_sha256,observed_at,configuration_snapshot)
  values(p_id,p_owner_id,p_source_revision,p_evidence_reference,
    p_evidence_sha256,p_observed_at,p_snapshot);
  return pg_catalog.jsonb_build_object('id',p_id,'connection_status','HOLD',
    'pilot_authorized',false,'gateway_receipt_claimed',false,
    'customer_messages_sent',0,'external_gets_executed',0,'write_operations',0);
end;
$$;
revoke all on function public.record_rosevear_integration_v1_owner_readiness(
  uuid,uuid,text,text,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.record_rosevear_integration_v1_owner_readiness(
  uuid,uuid,text,text,text,timestamptz,jsonb) to service_role;
