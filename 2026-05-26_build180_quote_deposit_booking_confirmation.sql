-- Build 180 — accepted quote → deposit/payment request → final booking confirmation.
-- Apply after Build 174 quote_proposal_drafts SQL and Builds 175-179 conversion/acceptance SQL.

create table if not exists public.quote_deposit_payment_requests (
  id uuid primary key default gen_random_uuid(),
  quote_proposal_draft_id uuid not null references public.quote_proposal_drafts(id) on delete cascade,
  lead_id uuid null references public.public_inquiry_leads(id) on delete set null,
  lead_conversion_draft_id uuid null references public.lead_conversion_drafts(id) on delete set null,
  booking_id uuid null references public.bookings(id) on delete set null,
  confirmed_booking_id uuid null references public.bookings(id) on delete set null,
  status text not null default 'requested',
  payment_status text not null default 'pending',
  provider text not null default 'manual',
  provider_status text null,
  amount_cents integer not null default 0,
  paid_amount_cents integer null,
  currency text not null default 'CAD',
  customer_name text null,
  customer_email text null,
  public_payment_url text null,
  checkout_url text null,
  external_checkout_id text null,
  token_hash text not null,
  public_note text null,
  internal_note text null,
  payment_method text null,
  payment_reference text null,
  requested_at timestamptz not null default now(),
  paid_at timestamptz null,
  booking_confirmed_at timestamptz null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_deposit_payment_requests_status_check check (status in ('requested','payment_link_created','paid_needs_booking','paid_booking_confirmed','cancelled','expired')),
  constraint quote_deposit_payment_requests_payment_status_check check (payment_status in ('pending','paid','failed','refunded','cancelled')),
  constraint quote_deposit_payment_requests_provider_check check (provider in ('manual','stripe')),
  constraint quote_deposit_payment_requests_amount_check check (amount_cents >= 0)
);

create index if not exists idx_quote_deposit_payment_requests_quote on public.quote_deposit_payment_requests(quote_proposal_draft_id, updated_at desc);
create index if not exists idx_quote_deposit_payment_requests_lead on public.quote_deposit_payment_requests(lead_id, updated_at desc);
create index if not exists idx_quote_deposit_payment_requests_conversion on public.quote_deposit_payment_requests(lead_conversion_draft_id, updated_at desc);
create index if not exists idx_quote_deposit_payment_requests_booking on public.quote_deposit_payment_requests(booking_id, updated_at desc);
create index if not exists idx_quote_deposit_payment_requests_status on public.quote_deposit_payment_requests(status, payment_status);
create index if not exists idx_quote_deposit_payment_requests_token_hash on public.quote_deposit_payment_requests(token_hash);

alter table public.quote_proposal_drafts
  add column if not exists deposit_request_status text not null default 'not_requested',
  add column if not exists deposit_requested_at timestamptz null,
  add column if not exists deposit_paid_at timestamptz null,
  add column if not exists final_booking_confirmed_at timestamptz null,
  add column if not exists final_booking_id uuid null references public.bookings(id) on delete set null,
  add column if not exists latest_deposit_payment_request_id uuid null references public.quote_deposit_payment_requests(id) on delete set null;

alter table public.lead_conversion_drafts
  add column if not exists latest_deposit_payment_request_id uuid null references public.quote_deposit_payment_requests(id) on delete set null;

create index if not exists idx_quote_proposal_drafts_deposit_status on public.quote_proposal_drafts(deposit_request_status, updated_at desc);
