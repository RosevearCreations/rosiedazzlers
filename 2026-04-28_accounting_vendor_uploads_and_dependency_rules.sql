-- 2026-04-28 accounting vendor defaults, direct document upload metadata,
-- deeper bank reconciliation matching, and expanded payroll payout reconciliation detail.

create table if not exists public.accounting_vendors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vendor_name text not null,
  default_expense_account_code text not null default 'shop_supplies' references public.accounting_accounts(code),
  default_payment_account_code text not null default 'cash' references public.accounting_accounts(code),
  default_posting_mode text not null default 'cash' check (default_posting_mode in ('cash','payable')),
  payment_terms_days integer null,
  contact_name text null,
  contact_email text null,
  contact_phone text null,
  vendor_notes text null,
  is_active boolean not null default true,
  created_by_name text null,
  updated_by_name text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create index if not exists accounting_vendors_name_idx on public.accounting_vendors (vendor_name asc);
create index if not exists accounting_vendors_active_idx on public.accounting_vendors (is_active, vendor_name asc);

alter table if exists public.accounting_documents
  add column if not exists vendor_name text null,
  add column if not exists document_number text null,
  add column if not exists document_date date null,
  add column if not exists file_name text null;
create index if not exists accounting_documents_vendor_idx on public.accounting_documents (vendor_name, document_date desc);

alter table if exists public.accounting_bank_reconciliations
  add column if not exists matched_entry_ids jsonb null default '[]'::jsonb,
  add column if not exists matched_count integer not null default 0;

alter table if exists public.accounting_payroll_payout_reconciliations
  add column if not exists expected_deductions_cad numeric(12,2) not null default 0,
  add column if not exists expected_net_pay_cad numeric(12,2) not null default 0,
  add column if not exists paid_net_pay_cad numeric(12,2) not null default 0,
  add column if not exists source_deductions_remitted_cad numeric(12,2) not null default 0,
  add column if not exists net_difference_cad numeric(12,2) not null default 0;

-- Pass sync 2026-04-28: add-on dependency rules stay JSON-catalog based (no new DB table in this pass),
-- while accounting gains vendor defaults, richer document metadata, reconciliation match storage,
-- expanded payroll payout detail, and direct-upload support via signed upload URLs.
