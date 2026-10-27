-- Build 675: append-only, service-role-only decisions; no recovery operation
-- changes certificate balances, receipt holds, payments or notification state.
create table if not exists public.gift_issuance_recovery_decisions (
  id uuid primary key,
  stripe_session_id text not null,
  actor_staff_user_id uuid,
  actor_label text not null check (length(actor_label) between 1 and 100),
  action text not null check (action in ('maintain_hold', 'escalate_review', 'close_verified_no_action')),
  reason_code text not null check (reason_code in
    ('missing_issuance', 'conflicting_evidence', 'provider_pending', 'provider_unavailable',
     'delivery_needs_review', 'verified_no_duplicate', 'other_owner_review')),
  provider_check text not null check (provider_check in ('paid_verified', 'unpaid', 'inconsistent', 'unavailable')),
  provider_payment_status text not null,
  provider_session_status text not null,
  provider_livemode boolean,
  provider_expected_count integer,
  provider_amount_cents bigint,
  provider_payment_intent text,
  provider_currency text,
  evidence_sha256 text not null check (evidence_sha256 ~ '^[a-f0-9]{64}$'),
  receipt_state text,
  receipt_expected_count integer,
  receipt_issued_count integer,
  observed_certificates integer not null,
  held_events integer not null,
  review_required_certificates integer not null,
  checked_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists gift_issuance_recovery_decisions_session_idx
  on public.gift_issuance_recovery_decisions(stripe_session_id, created_at desc);
alter table public.gift_issuance_recovery_decisions enable row level security;
revoke all on public.gift_issuance_recovery_decisions from public, anon, authenticated;
grant select, insert on public.gift_issuance_recovery_decisions to service_role;

-- A single transaction rechecks current database evidence after taking the
-- exact advisory lock used by Build 674's issuance RPC. This eliminates an
-- owner review racing with a signed webhook, and prevents stale closeouts.
create or replace function public.record_gift_issuance_recovery_decision(
  p_id uuid,
  p_session_id text,
  p_actor_id uuid,
  p_actor_label text,
  p_action text,
  p_reason_code text,
  p_provider_check text,
  p_provider_payment_status text,
  p_provider_session_status text,
  p_provider_livemode boolean,
  p_provider_expected_count integer,
  p_provider_amount_cents bigint,
  p_provider_payment_intent text,
  p_provider_currency text,
  p_evidence_sha256 text,
  p_checked_at timestamptz
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_receipt public.gift_issuance_receipts%rowtype;
  v_existing public.gift_issuance_recovery_decisions%rowtype;
  v_certificates integer;
  v_held integer;
  v_delivery_review integer;
  v_bad_lines integer;
begin
  if p_id is null or p_session_id !~ '^cs_(test|live)_[a-zA-Z0-9_-]{8,220}$'
     or nullif(trim(p_actor_label), '') is null or length(p_actor_label) > 100
     or p_action not in ('maintain_hold', 'escalate_review', 'close_verified_no_action')
     or p_reason_code not in ('missing_issuance', 'conflicting_evidence', 'provider_pending',
        'provider_unavailable', 'delivery_needs_review', 'verified_no_duplicate', 'other_owner_review')
     or p_provider_check not in ('paid_verified', 'unpaid', 'inconsistent', 'unavailable')
     or p_evidence_sha256 !~ '^[a-f0-9]{64}$'
     or p_checked_at is null or abs(extract(epoch from (now() - p_checked_at))) > 120 then
    raise exception 'Invalid or stale gift recovery decision';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gift-issue:' || p_session_id, 0));
  select * into v_existing from public.gift_issuance_recovery_decisions where id = p_id;
  if found then
    if v_existing.stripe_session_id <> p_session_id or v_existing.action <> p_action
       or v_existing.reason_code <> p_reason_code
       or v_existing.actor_label <> p_actor_label
       or v_existing.evidence_sha256 <> p_evidence_sha256 then
      raise exception 'Decision identifier reused with different evidence';
    end if;
    return jsonb_build_object('id', p_id, 'action', v_existing.action, 'idempotent', true);
  end if;

  select * into v_receipt from public.gift_issuance_receipts where stripe_session_id = p_session_id for update;
  select count(*),
         count(*) filter (where checkout_line_number is null or checkout_line_number < 1),
         count(*) filter (where purchase_context #>> '{gift_delivery,delivery_status}'
             in ('failed', 'review_required', 'processing'))
    into v_certificates, v_bad_lines, v_delivery_review
    from public.gift_certificates where stripe_session_id = p_session_id;
  select count(*) into v_held from public.gift_issuance_webhook_events
    where stripe_session_id = p_session_id and observed_state = 'hold';
  -- Include mismatched Stripe payment intent in the fail-closed closeout gate.
  -- A zero-line historic or missing-receipt session cannot be closed.
  if p_action = 'close_verified_no_action' then
    if p_provider_check <> 'paid_verified' or p_provider_payment_status <> 'paid'
       or p_provider_session_status <> 'complete'
       or p_provider_livemode is distinct from (p_session_id like 'cs_live_%')
       or p_provider_amount_cents is null or p_provider_amount_cents <= 0
       or nullif(p_provider_payment_intent, '') is null
       or nullif(p_provider_currency, '') is null
       or p_reason_code <> 'verified_no_duplicate'
       or v_receipt.stripe_session_id is null or v_receipt.state <> 'issued'
       or v_receipt.expected_count <> v_certificates or v_receipt.issued_count <> v_certificates
       or v_certificates is distinct from p_provider_expected_count
       or v_certificates < 1 or v_certificates > 100 or v_bad_lines <> 0
       or v_held <> 0 or v_delivery_review <> 0 or
       exists (select 1 from public.gift_certificates
         where stripe_session_id = p_session_id and
         (stripe_payment_intent is distinct from p_provider_payment_intent
          or lower(currency) is distinct from lower(p_provider_currency))) or
       (select count(distinct checkout_line_number) from public.gift_certificates
          where stripe_session_id = p_session_id) <> v_certificates or
       (select coalesce(max(checkout_line_number), 0) from public.gift_certificates
          where stripe_session_id = p_session_id) <> v_certificates or
       not exists (select 1 from public.gift_issuance_webhook_events
         where stripe_session_id = p_session_id and observed_state in ('issued', 'replayed')) then
      raise exception 'Closeout blocked: Stripe payment or atomic issuance evidence is not fully consistent';
    end if;
  end if;

  insert into public.gift_issuance_recovery_decisions (
    id, stripe_session_id, actor_staff_user_id, actor_label, action, reason_code,
    provider_check, provider_payment_status, provider_session_status, provider_livemode,
    provider_expected_count, provider_amount_cents, provider_payment_intent, provider_currency, evidence_sha256,
    receipt_state, receipt_expected_count, receipt_issued_count,
    observed_certificates, held_events, review_required_certificates, checked_at)
  values (p_id, p_session_id, p_actor_id, p_actor_label, p_action, p_reason_code,
    p_provider_check, p_provider_payment_status, p_provider_session_status, p_provider_livemode,
    p_provider_expected_count, p_provider_amount_cents, p_provider_payment_intent, p_provider_currency, p_evidence_sha256,
    v_receipt.state, v_receipt.expected_count, v_receipt.issued_count,
    v_certificates, v_held, v_delivery_review, p_checked_at);
  return jsonb_build_object('id', p_id, 'action', p_action, 'idempotent', false,
    'observed_certificates', v_certificates, 'held_events', v_held,
    'delivery_review', v_delivery_review,
    'owner_hold_continues', p_action <> 'close_verified_no_action');
end;
$$;
revoke all on function public.record_gift_issuance_recovery_decision(
  uuid,text,uuid,text,text,text,text,text,text,boolean,integer,bigint,text,text,text,timestamptz
) from public, anon, authenticated;
grant execute on function public.record_gift_issuance_recovery_decision(
  uuid,text,uuid,text,text,text,text,text,text,boolean,integer,bigint,text,text,text,timestamptz
) to service_role;
