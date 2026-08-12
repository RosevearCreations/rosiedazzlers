-- Build 217 — secure, revocable final-balance payment links and Stripe settlement metadata.
-- Apply after Builds 211 and 214. This migration does not add browser table grants.

alter table if exists public.final_balance_payment_requests
  add column if not exists expires_at timestamptz,
  add column if not exists access_token_rotated_at timestamptz,
  add column if not exists link_sent_at timestamptz,
  add column if not exists link_sent_count integer not null default 0,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_reason text,
  add column if not exists cancelled_by_staff_user_id uuid,
  add column if not exists cancelled_by_staff_name text,
  add column if not exists paid_amount_cents integer,
  add column if not exists provider_payment_intent_id text,
  add column if not exists provider_event_id text;

create index if not exists final_balance_payment_requests_open_expiry_idx
  on public.final_balance_payment_requests (status, expires_at)
  where paid_at is null and cancelled_at is null;

create index if not exists final_balance_payment_requests_booking_created_idx
  on public.final_balance_payment_requests (booking_id, created_at desc);

comment on column public.final_balance_payment_requests.token_hash is
  'Build 217 stores only SHA-256 hashes of random public payment-link tokens. Never expose this value to browsers.';
comment on column public.final_balance_payment_requests.expires_at is
  'Build 217 secure public payment-link expiry. Expiry blocks the app status page; it does not independently refund or cancel a provider checkout.';
comment on column public.final_balance_payment_requests.cancelled_reason is
  'Staff-safe cancellation note only. Do not store card data, private dispute details, or sensitive personal information.';

-- Build 214 RLS containment remains authoritative. Do not restore anon/authenticated/PUBLIC grants.
