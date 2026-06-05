-- Build 181 — verified Stripe/PayPal webhooks for quote deposit/payment requests.
-- Apply after Build 180. This keeps staff manual confirmation but allows provider
-- webhooks/captures to mark quote deposits paid automatically and link final bookings.

alter table public.quote_deposit_payment_requests
  add column if not exists webhook_verified_at timestamptz null,
  add column if not exists webhook_processed_at timestamptz null,
  add column if not exists provider_event_id text null,
  add column if not exists provider_event_type text null,
  add column if not exists provider_payment_intent_id text null,
  add column if not exists provider_order_id text null,
  add column if not exists provider_capture_id text null,
  add column if not exists provider_payload jsonb null;

-- Build 180 only allowed manual/stripe. Build 181 adds PayPal.
alter table public.quote_deposit_payment_requests
  drop constraint if exists quote_deposit_payment_requests_provider_check;

alter table public.quote_deposit_payment_requests
  add constraint quote_deposit_payment_requests_provider_check
  check (provider in ('manual','stripe','paypal'));

create index if not exists idx_quote_deposit_payment_requests_external_checkout
  on public.quote_deposit_payment_requests(external_checkout_id);

create index if not exists idx_quote_deposit_payment_requests_provider_event
  on public.quote_deposit_payment_requests(provider, provider_event_id);

create index if not exists idx_quote_deposit_payment_requests_webhook_processed
  on public.quote_deposit_payment_requests(webhook_processed_at desc);

comment on table public.quote_deposit_payment_requests is
  'Quote deposit/payment requests. Build 181 adds verified Stripe/PayPal webhook settlement fields so provider-confirmed payments can mark deposits paid automatically.';
