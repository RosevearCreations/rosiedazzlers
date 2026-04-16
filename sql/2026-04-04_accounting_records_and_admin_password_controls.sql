-- 2026-04-04 accounting records and admin password controls

create table if not exists public.accounting_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  record_source text not null default 'booking',
  order_status text not null default 'open',
  accounting_stage text not null default 'open',
  customer_name text null,
  customer_email text null,
  customer_phone text null,
  service_date date null,
  start_slot text null,
  package_code text null,
  vehicle_size text null,
  booking_status text null,
  job_status text null,
  subtotal_cad numeric(12,2) not null default 0,
  total_cad numeric(12,2) not null default 0,
  taxable_amount_cad numeric(12,2) not null default 0,
  tax_cad numeric(12,2) not null default 0,
  deposit_due_cad numeric(12,2) not null default 0,
  deposit_paid_cad numeric(12,2) not null default 0,
  final_paid_cad numeric(12,2) not null default 0,
  tip_cad numeric(12,2) not null default 0,
  refund_cad numeric(12,2) not null default 0,
  other_paid_cad numeric(12,2) not null default 0,
  collected_total_cad numeric(12,2) not null default 0,
  revenue_cad numeric(12,2) not null default 0,
  balance_due_cad numeric(12,2) not null default 0,
  last_finance_event_at timestamptz null,
  last_finance_event_type text null,
  created_by_name text null,
  last_recorded_by_name text null,
  notes text null
);

create index if not exists accounting_records_order_status_idx on public.accounting_records(order_status);
create index if not exists accounting_records_accounting_stage_idx on public.accounting_records(accounting_stage);
create index if not exists accounting_records_service_date_idx on public.accounting_records(service_date);
create index if not exists accounting_records_updated_at_idx on public.accounting_records(updated_at);
