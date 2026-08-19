-- Build 182 — webhook event history, replay controls, receipt emails, and refund tracking.
-- Apply after: sql/2026-05-26_build181_payment_webhooks_quote_deposits.sql

create table if not exists public.quote_payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  provider_event_type text not null,
  quote_deposit_payment_request_id uuid null references public.quote_deposit_payment_requests(id) on delete set null,
  booking_id uuid null,
  payment_reference text null,
  status text not null default 'received',
  replay_status text not null default 'not_replayed',
  replay_count integer not null default 0,
  last_replayed_at timestamptz null,
  last_error text null,
  raw_payload jsonb null,
  processed_payload jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_payment_webhook_events_provider_check check (provider in ('stripe','paypal','manual','system','provider')),
  constraint quote_payment_webhook_events_status_check check (status in ('received','verified','ignored','settled','failed','refund_recorded','unverified','replayed','replay_failed')),
  constraint quote_payment_webhook_events_replay_status_check check (replay_status in ('not_replayed','queued','replayed','failed','blocked')),
  constraint quote_payment_webhook_events_replay_count_check check (replay_count >= 0),
  constraint quote_payment_webhook_events_unique_provider_event unique (provider, provider_event_id)
);

create index if not exists idx_quote_payment_webhook_events_provider_event
  on public.quote_payment_webhook_events(provider, provider_event_id);
create index if not exists idx_quote_payment_webhook_events_payment_request
  on public.quote_payment_webhook_events(quote_deposit_payment_request_id, created_at desc);
create index if not exists idx_quote_payment_webhook_events_status
  on public.quote_payment_webhook_events(status, replay_status, created_at desc);

create table if not exists public.quote_deposit_refund_records (
  id uuid primary key default gen_random_uuid(),
  quote_deposit_payment_request_id uuid not null references public.quote_deposit_payment_requests(id) on delete cascade,
  quote_proposal_draft_id uuid null references public.quote_proposal_drafts(id) on delete set null,
  lead_id uuid null references public.public_inquiry_leads(id) on delete set null,
  booking_id uuid null,
  provider text not null default 'manual',
  provider_refund_id text null,
  provider_event_id text null,
  provider_event_type text null,
  refund_status text not null default 'succeeded',
  refund_amount_cents integer not null default 0,
  currency text not null default 'CAD',
  reason text null,
  provider_payload jsonb null,
  refunded_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_deposit_refund_records_provider_check check (provider in ('manual','stripe','paypal','provider')),
  constraint quote_deposit_refund_records_status_check check (refund_status in ('requested','pending','succeeded','failed','cancelled','partial_refund','refunded')),
  constraint quote_deposit_refund_records_amount_check check (refund_amount_cents >= 0),
  constraint quote_deposit_refund_records_unique_provider_refund unique (provider, provider_refund_id)
);
create index if not exists idx_quote_deposit_refund_records_payment_request
  on public.quote_deposit_refund_records(quote_deposit_payment_request_id, created_at desc);
create index if not exists idx_quote_deposit_refund_records_booking
  on public.quote_deposit_refund_records(booking_id, created_at desc);

alter table public.quote_deposit_payment_requests
  add column if not exists refunded_amount_cents integer not null default 0,
  add column if not exists refund_status text null,
  add column if not exists latest_refund_id uuid null references public.quote_deposit_refund_records(id) on delete set null,
  add column if not exists latest_refund_at timestamptz null,
  add column if not exists receipt_email_status text null,
  add column if not exists receipt_email_queued_at timestamptz null,
  add column if not exists receipt_notification_event_id uuid null;

alter table public.quote_deposit_payment_requests
  drop constraint if exists quote_deposit_payment_requests_payment_status_check;

alter table public.quote_deposit_payment_requests
  add constraint quote_deposit_payment_requests_payment_status_check
  check (payment_status in ('pending','paid','failed','refunded','partial_refund','cancelled'));

alter table public.quote_proposal_drafts
  add column if not exists deposit_receipt_status text null,
  add column if not exists latest_refund_status text null,
  add column if not exists refunded_amount_cents integer not null default 0;

comment on table public.quote_payment_webhook_events is
  'Build 182: Stripe/PayPal quote-deposit webhook event history with replay status and processed payload metadata.';
comment on table public.quote_deposit_refund_records is
  'Build 182: refund and partial-refund tracking records for quote deposit/payment requests.';
