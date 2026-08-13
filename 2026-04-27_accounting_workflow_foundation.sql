

-- 2026-04-27 accounting workflow foundation: bank reconciliation, document attachments,
-- recurring expenses, payroll payout reconciliation, and accountant lock / close workflow.
create table if not exists public.accounting_documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  related_type text not null default 'journal_entry',
  related_id text null,
  document_kind text not null default 'attachment',
  title text not null,
  file_url text null,
  storage_path text null,
  mime_type text null,
  size_bytes bigint null,
  notes text null,
  uploaded_by_name text null,
  uploaded_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create index if not exists accounting_documents_related_idx on public.accounting_documents (related_type, related_id, created_at desc);
create index if not exists accounting_documents_kind_idx on public.accounting_documents (document_kind, created_at desc);

create table if not exists public.accounting_recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vendor_name text not null,
  memo text null,
  expense_account_code text not null references public.accounting_accounts(code),
  payment_account_code text not null references public.accounting_accounts(code),
  posting_mode text not null default 'cash' check (posting_mode in ('cash','payable')),
  subtotal_cad numeric(12,2) not null default 0,
  tax_cad numeric(12,2) not null default 0,
  total_cad numeric(12,2) not null default 0,
  cadence text not null default 'monthly',
  next_due_date date not null default current_date,
  auto_post boolean not null default false,
  is_active boolean not null default true,
  notes text null,
  last_posted_at timestamptz null,
  last_posted_entry_id uuid null references public.accounting_journal_entries(id) on delete set null,
  created_by_name text null,
  updated_by_name text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create index if not exists accounting_recurring_expenses_due_idx on public.accounting_recurring_expenses (is_active, next_due_date asc);

create table if not exists public.accounting_bank_reconciliations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  account_code text not null references public.accounting_accounts(code),
  period_start date not null,
  period_end date not null,
  statement_ending_balance_cad numeric(12,2) not null default 0,
  calculated_book_balance_cad numeric(12,2) not null default 0,
  difference_cad numeric(12,2) not null default 0,
  outstanding_count integer not null default 0,
  cleared_journal_entry_ids jsonb null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','review','reconciled','locked')),
  notes text null,
  reconciled_by_name text null,
  reconciled_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create index if not exists accounting_bank_reconciliations_period_idx on public.accounting_bank_reconciliations (account_code, period_start desc, period_end desc);

create table if not exists public.accounting_payroll_payout_reconciliations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payroll_run_id uuid not null references public.staff_payroll_runs(id) on delete cascade,
  payout_date date not null default current_date,
  payment_account_code text not null references public.accounting_accounts(code),
  expected_gross_cad numeric(12,2) not null default 0,
  paid_gross_cad numeric(12,2) not null default 0,
  difference_cad numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','review','reconciled','paid')),
  note text null,
  accounting_entry_id uuid null references public.accounting_journal_entries(id) on delete set null,
  reconciled_by_name text null,
  reconciled_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create unique index if not exists accounting_payroll_payout_reconciliations_run_idx on public.accounting_payroll_payout_reconciliations (payroll_run_id);
create index if not exists accounting_payroll_payout_reconciliations_date_idx on public.accounting_payroll_payout_reconciliations (payout_date desc);

create table if not exists public.accounting_period_closes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  month_start date not null unique,
  status text not null default 'open' check (status in ('open','review','locked','closed')),
  checklist jsonb null,
  notes text null,
  locked_at timestamptz null,
  locked_by_name text null,
  locked_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create index if not exists accounting_period_closes_status_idx on public.accounting_period_closes (status, month_start desc);

-- Pass sync 2026-04-27: pricing review-proof image fallback hard-wired on public proof cards, and the accounting workspace now includes foundational workflows for receipts/documents, recurring expenses, bank reconciliation, payroll payout reconciliation, and accountant period lock / close control.
