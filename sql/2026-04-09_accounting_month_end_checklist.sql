-- 2026-04-09 accounting month-end checklist support
create table if not exists public.accounting_month_end_checklists (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  month_start date not null unique,
  remittance_reviewed boolean not null default false,
  payables_reviewed boolean not null default false,
  receivables_reviewed boolean not null default false,
  statements_exported boolean not null default false,
  inventory_costs_reviewed boolean not null default false,
  profitability_reviewed boolean not null default false,
  notes text null,
  updated_by_name text null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create index if not exists accounting_month_end_checklists_month_start_idx
  on public.accounting_month_end_checklists(month_start);
