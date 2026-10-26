-- Build 674: signed, paid gift webhook writes are serialized by checkout session.
-- Additive migration: legacy certificates are never deduplicated or deleted.
alter table public.gift_certificates
  add column if not exists checkout_line_number integer;

create unique index if not exists gift_certificates_checkout_line_unique
  on public.gift_certificates (stripe_session_id, checkout_line_number)
  where stripe_session_id is not null and checkout_line_number is not null;

create table if not exists public.gift_issuance_receipts (
  stripe_session_id text primary key,
  first_event_id text not null,
  last_event_id text not null,
  payload_digest text not null,
  expected_count integer not null check (expected_count between 1 and 100),
  issued_count integer not null default 0 check (issued_count >= 0),
  state text not null check (state in ('issued', 'hold')),
  hold_reason text,
  replay_count integer not null default 0 check (replay_count >= 0),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
alter table public.gift_issuance_receipts enable row level security;
revoke all on public.gift_issuance_receipts from public, anon, authenticated;
grant select, insert, update on public.gift_issuance_receipts to service_role;

create table if not exists public.gift_issuance_webhook_events (
  event_id text primary key,
  stripe_session_id text not null references public.gift_issuance_receipts(stripe_session_id),
  event_type text not null,
  payload_digest text not null,
  observed_state text not null check (observed_state in ('issued', 'replayed', 'hold')),
  delivery_count integer not null default 1 check (delivery_count >= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists gift_issuance_webhook_events_session_idx
  on public.gift_issuance_webhook_events(stripe_session_id, last_seen_at desc);
alter table public.gift_issuance_webhook_events enable row level security;
revoke all on public.gift_issuance_webhook_events from public, anon, authenticated;
grant select, insert, update on public.gift_issuance_webhook_events to service_role;

-- SECURITY INVOKER: only the server-side service role may execute this RPC.
-- One PostgREST RPC is one Postgres transaction; any insert error rolls back all
-- certificates, the receipt and the event evidence together.
create or replace function public.issue_gift_certificates_atomic(
  p_session_id text,
  p_event_id text,
  p_event_type text,
  p_payload_digest text,
  p_rows jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_expected integer;
  v_existing integer;
  v_inserted integer := 0;
  v_receipt public.gift_issuance_receipts%rowtype;
  v_outcome text := 'issued';
  v_reason text;
begin
  if nullif(trim(p_session_id), '') is null or length(p_session_id) > 255
     or nullif(trim(p_event_id), '') is null or length(p_event_id) > 255
     or p_event_type not in ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
     or p_payload_digest !~ '^[a-f0-9]{64}$'
     or jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'Invalid verified gift issuance request';
  end if;
  v_expected := jsonb_array_length(p_rows);
  if v_expected < 1 or v_expected > 100 then
    raise exception 'Gift issuance item limit exceeded';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_rows) with ordinality as x(item, line)
    where item->>'stripe_session_id' is distinct from p_session_id
       or (item->>'checkout_line_number')::integer is distinct from x.line::integer
       or nullif(item->>'code', '') is null
       or coalesce((item->>'face_value_cents')::integer, 0) <= 0
       or (item->>'remaining_cents')::integer is distinct from (item->>'face_value_cents')::integer
       or item->>'status' is distinct from 'active'
  ) then
    raise exception 'Inconsistent certificate issuance items';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gift-issue:' || p_session_id, 0));
  if exists (select 1 from public.gift_issuance_webhook_events
             where event_id = p_event_id and stripe_session_id <> p_session_id) then
    raise exception 'Conflicting Stripe event identity';
  end if;
  select count(*) into v_existing from public.gift_certificates where stripe_session_id = p_session_id;
  select * into v_receipt from public.gift_issuance_receipts where stripe_session_id = p_session_id for update;

  if found then
    if v_receipt.state = 'hold' then
      v_outcome := 'hold';
      v_reason := v_receipt.hold_reason;
    elsif v_receipt.payload_digest = p_payload_digest
      and v_receipt.expected_count = v_expected
      and v_receipt.issued_count = v_existing then
      v_outcome := 'replayed';
    else
      v_outcome := 'hold';
      v_reason := 'payload_or_certificate_count_mismatch';
    end if;
    update public.gift_issuance_receipts
      set state = case when v_outcome = 'hold' then 'hold' else state end,
          hold_reason = coalesce(v_reason, hold_reason),
          replay_count = replay_count + 1,
          last_event_id = p_event_id,
          last_seen_at = now()
      where stripe_session_id = p_session_id;
  elsif v_existing > 0 then
    v_outcome := 'hold';
    v_reason := 'preexisting_issuance_requires_owner_reconciliation';
    insert into public.gift_issuance_receipts
      (stripe_session_id, first_event_id, last_event_id, payload_digest, expected_count, issued_count, state, hold_reason)
    values (p_session_id, p_event_id, p_event_id, p_payload_digest, v_expected, v_existing, 'hold', v_reason);
  else
    insert into public.gift_certificates
      (code, sku, type, currency, face_value_cents, remaining_cents, package_code, vehicle_size,
       status, purchaser_email, recipient_name, recipient_email, stripe_session_id, stripe_payment_intent,
       expires_at, purchase_context, checkout_line_number)
    select code, sku, type, currency, face_value_cents, remaining_cents, package_code, vehicle_size,
           status, purchaser_email, recipient_name, recipient_email, stripe_session_id, stripe_payment_intent,
           expires_at, purchase_context, checkout_line_number
    from jsonb_to_recordset(p_rows) as r (
      code text, sku text, type text, currency text, face_value_cents integer, remaining_cents integer,
      package_code text, vehicle_size text, status text, purchaser_email text,
      recipient_name text, recipient_email text, stripe_session_id text, stripe_payment_intent text,
      expires_at timestamptz, purchase_context jsonb, checkout_line_number integer
    );
    get diagnostics v_inserted = row_count;
    if v_inserted <> v_expected then raise exception 'Incomplete atomic certificate issuance'; end if;
    v_existing := v_inserted;
    insert into public.gift_issuance_receipts
      (stripe_session_id, first_event_id, last_event_id, payload_digest, expected_count, issued_count, state)
    values (p_session_id, p_event_id, p_event_id, p_payload_digest, v_expected, v_inserted, 'issued');
  end if;

  if v_outcome = 'hold' then
    -- A hold freezes only unsent/pending delivery. Balances and previously
    -- submitted emails remain untouched until authorized reconciliation.
    update public.gift_certificates
      set purchase_context = jsonb_set(purchase_context, '{gift_delivery,delivery_status}', '"review_required"'::jsonb, true)
      where stripe_session_id = p_session_id
        and purchase_context #>> '{gift_delivery,delivery_status}' = 'pending';
  end if;

  insert into public.gift_issuance_webhook_events
    (event_id, stripe_session_id, event_type, payload_digest, observed_state)
  values (p_event_id, p_session_id, p_event_type, p_payload_digest, v_outcome)
  on conflict (event_id) do update
    set delivery_count = public.gift_issuance_webhook_events.delivery_count + 1,
        last_seen_at = now(),
        observed_state = case when excluded.observed_state = 'hold' then 'hold' else public.gift_issuance_webhook_events.observed_state end;

  return jsonb_build_object(
    'outcome', v_outcome,
    'issued_count', case when v_outcome = 'issued' then v_inserted else 0 end,
    'existing_count', v_existing,
    'hold_reason', v_reason
  );
end;
$$;

revoke all on function public.issue_gift_certificates_atomic(text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.issue_gift_certificates_atomic(text,text,text,text,jsonb) to service_role;
