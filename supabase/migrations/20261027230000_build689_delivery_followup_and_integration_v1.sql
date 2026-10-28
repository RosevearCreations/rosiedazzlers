-- Build 689: independent recipient evidence review and owner no-resend closure.
-- Does not dispatch, charge, reissue or change a gift's customer state.
create table public.gift_issuance_delivery_followup_reviews (
  id uuid primary key,
  case_id uuid not null references public.gift_issuance_review_cases(id),
  certificate_id uuid not null references public.gift_certificates(id),
  attempt_id uuid not null references public.gift_issuance_one_time_dispatch_attempts(id),
  actor_staff_user_id uuid not null references public.staff_users(id),
  reviewer_staff_user_id uuid references public.staff_users(id),
  event_kind text not null check (event_kind in
    ('owner_followup_assignment','independent_recipient_recheck','owner_no_resend_closeout')),
  decision_code text not null check (decision_code in
    ('review_assigned','recipient_evidence_supported','recipient_not_confirmed',
     'conflicting_evidence','confirmed_no_resend_closed','unconfirmed_no_resend_closed')),
  evidence_kind text not null check (evidence_kind in
    ('internal_exception_note','provider_dashboard_reference','recipient_direct_reply',
     'verified_phone_conversation','recipient_reported_missing')),
  evidence_reference text not null check (evidence_reference ~ '^[A-Z0-9_-]{6,64}$'),
  evidence_sha256 text not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  prior_review_sha256 text not null check (prior_review_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default clock_timestamp(),
  unique(attempt_id,event_kind)
);
create index gift_689_followup_case_idx on
  public.gift_issuance_delivery_followup_reviews(case_id,created_at desc,id desc);
alter table public.gift_issuance_delivery_followup_reviews enable row level security;
revoke all on public.gift_issuance_delivery_followup_reviews from public,anon,authenticated,service_role;
grant select,insert on public.gift_issuance_delivery_followup_reviews to service_role;
create trigger gift_689_followup_append_only before update or delete
  on public.gift_issuance_delivery_followup_reviews for each row
  execute function public.reject_gift_closeout_audit_change();

create function public.record_gift_delivery_followup_review(
  p_id uuid,p_case_id uuid,p_certificate_id uuid,p_attempt_id uuid,p_actor_id uuid,
  p_reviewer_id uuid,p_event_kind text,p_decision_code text,p_evidence_kind text,
  p_evidence_reference text,p_evidence_sha256 text,p_observed_at timestamptz
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_case public.gift_issuance_review_cases%rowtype;
  v_attempt public.gift_issuance_one_time_dispatch_attempts%rowtype;
  v_approval public.gift_issuance_one_time_dispatch_approvals%rowtype;
  v_triage public.gift_issuance_delivery_outcome_reviews%rowtype;
  v_confirmation public.gift_issuance_delivery_outcome_reviews%rowtype;
  v_escalation public.gift_issuance_delivery_outcome_reviews%rowtype;
  v_assignment public.gift_issuance_delivery_followup_reviews%rowtype;
  v_recheck public.gift_issuance_delivery_followup_reviews%rowtype;
  v_snapshot text;
  v_actor_role text;
begin
  if p_id is null or p_case_id is null or p_certificate_id is null or p_attempt_id is null or
     p_actor_id is null or p_evidence_reference is null or
     p_evidence_reference !~ '^[A-Z0-9_-]{6,64}$' or
     p_evidence_sha256 is null or p_evidence_sha256 !~ '^[0-9a-f]{64}$' or
     p_observed_at is null or p_observed_at > clock_timestamp()+interval '30 seconds' or
     p_observed_at < clock_timestamp()-interval '30 days' then
    raise exception 'One current bounded evidence reference is required'; end if;
  select * into v_case from public.gift_issuance_review_cases where id=p_case_id;
  if not found then raise exception 'Unknown gift case'; end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('gift-issue:'||v_case.stripe_session_id,0));
  if exists(select 1 from public.gift_issuance_delivery_followup_reviews
    where id=p_id or (attempt_id=p_attempt_id and event_kind=p_event_kind)) then
    raise exception 'Independent follow-up already recorded; no duplicate review'; end if;
  select * into v_attempt from public.gift_issuance_one_time_dispatch_attempts
    where id=p_attempt_id and certificate_id=p_certificate_id;
  select * into v_approval from public.gift_issuance_one_time_dispatch_approvals
    where id=v_attempt.approval_id and case_id=p_case_id and certificate_id=p_certificate_id;
  select * into v_triage from public.gift_issuance_delivery_outcome_reviews
    where attempt_id=p_attempt_id and event_kind='owner_provider_outcome_triage';
  select * into v_confirmation from public.gift_issuance_delivery_outcome_reviews
    where attempt_id=p_attempt_id and event_kind='owner_recipient_confirmation';
  select * into v_escalation from public.gift_issuance_delivery_outcome_reviews
    where attempt_id=p_attempt_id and event_kind='owner_no_resend_escalation';
  select * into v_assignment from public.gift_issuance_delivery_followup_reviews
    where attempt_id=p_attempt_id and event_kind='owner_followup_assignment';
  select * into v_recheck from public.gift_issuance_delivery_followup_reviews
    where attempt_id=p_attempt_id and event_kind='independent_recipient_recheck';
  select role_code into v_actor_role from public.staff_users
    where id=p_actor_id and is_active=true;
  if v_attempt.id is null or v_approval.id is null or v_triage.id is null or
     v_triage.case_id<>p_case_id or v_triage.certificate_id<>p_certificate_id or
     v_approval.owner_staff_user_id=v_attempt.operator_staff_user_id or
     not exists(select 1 from public.gift_certificates where id=p_certificate_id
       and stripe_session_id=v_case.stripe_session_id) or
     v_actor_role is null or v_attempt.status is distinct from v_triage.provider_outcome_snapshot or
     exists(select 1 from public.notification_events
       where id=v_attempt.notification_event_id and (max_attempts<>1 or next_attempt_at is not null)) then
    raise exception 'Exact gift one-time dispatch and source evidence continuity required'; end if;
  -- This digest binds the follow-up to the original B688 triage and its observed source.
  v_snapshot:=pg_catalog.encode(extensions.digest(
    v_triage.id::text||':'||v_triage.evidence_sha256||':'||
    coalesce(v_confirmation.id::text,'-')||':'||
    coalesce(v_escalation.id::text,'-'),'sha256'),'hex');
  if p_event_kind='owner_followup_assignment' then
    if p_actor_id<>v_approval.owner_staff_user_id or v_actor_role<>'admin' or
       p_decision_code<>'review_assigned' or p_evidence_kind<>'internal_exception_note' or
       p_reviewer_id is null or p_reviewer_id in (p_actor_id,v_attempt.operator_staff_user_id) or
       not exists(select 1 from public.staff_users where id=p_reviewer_id and is_active=true
          and role_code in ('admin','senior_detailer','detailer')) then
      raise exception 'Owner must assign a different active independent reviewer'; end if;
  elsif p_event_kind='independent_recipient_recheck' then
    if v_assignment.id is null or v_assignment.prior_review_sha256 is distinct from v_snapshot or
       p_actor_id<>v_assignment.reviewer_staff_user_id or
       p_reviewer_id is distinct from p_actor_id or
       p_actor_id in (v_approval.owner_staff_user_id,v_attempt.operator_staff_user_id) or
       p_decision_code not in ('recipient_evidence_supported','recipient_not_confirmed','conflicting_evidence') or
       (p_decision_code='recipient_evidence_supported' and
         (v_confirmation.id is null or
          p_evidence_kind not in ('recipient_direct_reply','verified_phone_conversation'))) or
       (p_decision_code='recipient_not_confirmed' and v_confirmation.id is not null) or
       p_observed_at<v_assignment.created_at or
       clock_timestamp()-v_assignment.created_at>interval '14 days' then
      raise exception 'Assigned independent reviewer and matching recipient evidence required'; end if;
  elsif p_event_kind='owner_no_resend_closeout' then
    if p_actor_id<>v_approval.owner_staff_user_id or v_actor_role<>'admin' or
       v_recheck.id is null or v_recheck.prior_review_sha256 is distinct from v_snapshot or
       p_reviewer_id is distinct from v_recheck.actor_staff_user_id or
       v_recheck.decision_code='conflicting_evidence' or
       p_observed_at<v_recheck.created_at or
       clock_timestamp()-v_recheck.created_at>interval '24 hours' or
       (p_decision_code='confirmed_no_resend_closed' and
         (v_confirmation.id is null or v_recheck.decision_code<>'recipient_evidence_supported')) or
       (p_decision_code='unconfirmed_no_resend_closed' and
         (v_escalation.id is null or v_confirmation.id is not null or
          v_recheck.decision_code<>'recipient_not_confirmed')) or
       p_decision_code not in ('confirmed_no_resend_closed','unconfirmed_no_resend_closed') or
       p_evidence_kind<>'internal_exception_note' then
      raise exception 'Owner cannot close until recent independent recipient evidence is consistent'; end if;
  else
    raise exception 'Unknown follow-up event kind'; end if;
  insert into public.gift_issuance_delivery_followup_reviews
    (id,case_id,certificate_id,attempt_id,actor_staff_user_id,reviewer_staff_user_id,
     event_kind,decision_code,evidence_kind,evidence_reference,evidence_sha256,
     observed_at,prior_review_sha256)
  values(p_id,p_case_id,p_certificate_id,p_attempt_id,p_actor_id,p_reviewer_id,
     p_event_kind,p_decision_code,p_evidence_kind,p_evidence_reference,p_evidence_sha256,
     p_observed_at,v_snapshot);
  return pg_catalog.jsonb_build_object('id',p_id,'event_kind',p_event_kind,
    'decision_code',p_decision_code,'original_attempt_consumed',true,
    'customer_messages_sent',0,'provider_dispatches',0,'payment_mutations',0,
    'automatic_resend_permitted',false);
end;
$$;
revoke all on function public.record_gift_delivery_followup_review(
  uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.record_gift_delivery_followup_review(
  uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz) to service_role;

-- Integration v1 QL-243: nonproduction durable replay and sanitized audit only.
-- No cross-app gateway, owner approval, external credentials or live dispatch is created.
create table public.rosevear_integration_v1_nonce_registry (
  id uuid primary key,
  source_system text not null check (source_system='ai-data-platform'),
  business_id text not null check (business_id='rosiedazzlers'),
  tenant_key text not null check (tenant_key='-'),
  environment text not null check (environment='nonproduction'),
  key_id text not null check (key_id ~ '^[a-zA-Z0-9_-]{8,80}$'),
  nonce_sha256 text not null check (nonce_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null default clock_timestamp(),
  unique(source_system,business_id,tenant_key,environment,key_id,nonce_sha256)
);
create index rosevear_v1_nonce_age_idx on public.rosevear_integration_v1_nonce_registry(observed_at);
alter table public.rosevear_integration_v1_nonce_registry enable row level security;
revoke all on public.rosevear_integration_v1_nonce_registry from public,anon,authenticated,service_role;
grant select,insert on public.rosevear_integration_v1_nonce_registry to service_role;
create trigger rosevear_v1_nonce_append_only before update or delete
  on public.rosevear_integration_v1_nonce_registry for each row
  execute function public.reject_gift_closeout_audit_change();

create table public.rosevear_integration_v1_probe_audit (
  id uuid primary key,
  path text not null check (path in ('/api/integration/v1/health','/api/integration/v1/capabilities')),
  method text not null check (method in ('GET','OTHER')),
  decision text not null check (decision in ('accepted','denied','replay_denied')),
  reason_code text not null check (reason_code in ('ok','invalid_identity','bad_signature','stale',
    'wrong_method','wrong_path','query_denied','disabled','replayed')),
  key_id text,
  nonce_sha256 text check (nonce_sha256 is null or nonce_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default clock_timestamp()
);
create index rosevear_v1_probe_age_idx on public.rosevear_integration_v1_probe_audit(created_at desc);
alter table public.rosevear_integration_v1_probe_audit enable row level security;
revoke all on public.rosevear_integration_v1_probe_audit from public,anon,authenticated,service_role;
grant select,insert on public.rosevear_integration_v1_probe_audit to service_role;
create trigger rosevear_v1_probe_append_only before update or delete
  on public.rosevear_integration_v1_probe_audit for each row
  execute function public.reject_gift_closeout_audit_change();

create function public.record_rosevear_integration_v1_probe(
  p_id uuid,p_path text,p_method text,p_reason text,p_key_id text,
  p_nonce_sha256 text,p_claim_nonce boolean
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_claimed uuid;v_decision text;
begin
  if p_id is null or p_path not in ('/api/integration/v1/health','/api/integration/v1/capabilities') or
     p_method not in ('GET','OTHER') or p_reason not in
       ('ok','invalid_identity','bad_signature','stale','wrong_method','wrong_path',
        'query_denied','disabled') or
     (p_nonce_sha256 is not null and p_nonce_sha256 !~ '^[0-9a-f]{64}$') then
    raise exception 'Invalid bounded nonproduction probe';end if;
  if p_reason='ok' and p_claim_nonce=true and p_method='GET' and
     p_key_id ~ '^[a-zA-Z0-9_-]{8,80}$' and p_nonce_sha256 is not null then
    insert into public.rosevear_integration_v1_nonce_registry
      (id,source_system,business_id,tenant_key,environment,key_id,nonce_sha256)
    values(p_id,'ai-data-platform','rosiedazzlers','-','nonproduction',p_key_id,p_nonce_sha256)
    on conflict do nothing returning id into v_claimed;
    v_decision:=case when v_claimed is null then 'replay_denied' else 'accepted' end;
  else
    v_decision:='denied';
  end if;
  insert into public.rosevear_integration_v1_probe_audit
    (id,path,method,decision,reason_code,key_id,nonce_sha256)
  values(p_id,p_path,p_method,v_decision,
    case when v_decision='replay_denied' then 'replayed' else p_reason end,
    case when p_key_id ~ '^[a-zA-Z0-9_-]{8,80}$' then p_key_id else null end,
    p_nonce_sha256);
  return pg_catalog.jsonb_build_object('receipt_id',p_id,'decision',v_decision,
    'connection_status','HOLD','customer_messages_sent',0,'write_capabilities',0);
end;
$$;
revoke all on function public.record_rosevear_integration_v1_probe(
  uuid,text,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.record_rosevear_integration_v1_probe(
  uuid,text,text,text,text,text,boolean) to service_role;
