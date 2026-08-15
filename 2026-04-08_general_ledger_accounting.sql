-- 2026-04-08 general ledger accounting backend foundation

create table if not exists public.accounting_accounts (
  code text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  label text not null,
  account_type text not null check (account_type in ('asset','liability','equity','revenue','expense')),
  account_group text null,
  normal_balance text not null default 'debit' check (normal_balance in ('debit','credit')),
  is_active boolean not null default true,
  is_system boolean not null default false,
  notes text null
);

create table if not exists public.accounting_journal_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  entry_date date not null default current_date,
  entry_type text not null default 'manual',
  status text not null default 'posted' check (status in ('draft','posted','void')),
  reference_type text null,
  reference_id text null,
  payee_name text null,
  vendor_name text null,
  memo text null,
  subtotal_cad numeric(12,2) not null default 0,
  tax_cad numeric(12,2) not null default 0,
  total_cad numeric(12,2) not null default 0,
  due_date date null,
  paid_at timestamptz null,
  created_by_name text null,
  last_recorded_by_name text null
);

create table if not exists public.accounting_journal_lines (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entry_id uuid not null references public.accounting_journal_entries(id) on delete cascade,
  line_order integer not null default 0,
  account_code text not null references public.accounting_accounts(code),
  direction text not null check (direction in ('debit','credit')),
  amount_cad numeric(12,2) not null default 0,
  memo text null
);

create index if not exists accounting_accounts_type_idx on public.accounting_accounts(account_type, account_group, is_active);
create index if not exists accounting_journal_entries_date_idx on public.accounting_journal_entries(entry_date, status);
create index if not exists accounting_journal_entries_type_idx on public.accounting_journal_entries(entry_type, status);
create index if not exists accounting_journal_lines_entry_idx on public.accounting_journal_lines(entry_id, line_order);
create index if not exists accounting_journal_lines_account_idx on public.accounting_journal_lines(account_code, direction);

insert into public.accounting_accounts (code, sort_order, label, account_type, account_group, normal_balance, is_active, is_system, notes) values
('cash', 10, 'Cash', 'asset', 'current_assets', 'debit', true, true, 'Cash and bank balances.'),
('accounts_receivable', 20, 'Accounts Receivable', 'asset', 'current_assets', 'debit', true, true, 'Amounts owed by customers.'),
('inventory_supplies', 30, 'Inventory & Supplies', 'asset', 'current_assets', 'debit', true, true, 'Consumables and stocked detailing products.'),
('equipment', 40, 'Equipment', 'asset', 'fixed_assets', 'debit', true, true, 'Tools and shop equipment.'),
('accounts_payable', 110, 'Accounts Payable', 'liability', 'current_liabilities', 'credit', true, true, 'Amounts owed to vendors.'),
('sales_tax_payable', 120, 'Sales Tax Payable', 'liability', 'current_liabilities', 'credit', true, true, 'Collected taxes owed to government.'),
('tips_payable', 130, 'Tips Payable', 'liability', 'current_liabilities', 'credit', true, true, 'Tips collected before payout if tracked separately.'),
('owner_equity', 210, 'Owner Equity', 'equity', 'equity', 'credit', true, true, 'Owner equity.'),
('detailing_revenue', 310, 'Detailing Revenue', 'revenue', 'operating_revenue', 'credit', true, true, 'Primary detailing service revenue.'),
('membership_revenue', 320, 'Membership Revenue', 'revenue', 'operating_revenue', 'credit', true, true, 'Membership and recurring customer plans.'),
('other_income', 390, 'Other Income', 'revenue', 'other_revenue', 'credit', true, true, 'Other income.'),
('cost_of_goods_sold', 410, 'Cost of Goods Sold', 'expense', 'cost_of_sales', 'debit', true, true, 'Direct materials used for services.'),
('repairs_maintenance', 510, 'Repairs & Maintenance', 'expense', 'operating_expenses', 'debit', true, true, 'Vehicle or equipment repairs and maintenance.'),
('electricity', 520, 'Electricity', 'expense', 'operating_expenses', 'debit', true, true, 'Electric utility costs.'),
('gas_fuel', 530, 'Gas & Fuel', 'expense', 'operating_expenses', 'debit', true, true, 'Fuel and travel costs.'),
('rent', 540, 'Rent', 'expense', 'operating_expenses', 'debit', true, true, 'Shop or property rent.'),
('insurance', 550, 'Insurance', 'expense', 'operating_expenses', 'debit', true, true, 'Business and vehicle insurance.'),
('advertising_marketing', 560, 'Advertising & Marketing', 'expense', 'operating_expenses', 'debit', true, true, 'Ads, promotions, and marketing spend.'),
('software_subscriptions', 570, 'Software & Subscriptions', 'expense', 'operating_expenses', 'debit', true, true, 'Software and online services.'),
('phone_internet', 580, 'Phone & Internet', 'expense', 'operating_expenses', 'debit', true, true, 'Communication expenses.'),
('shop_supplies', 590, 'Shop Supplies', 'expense', 'operating_expenses', 'debit', true, true, 'General shop and detailing supplies.'),
('vehicle_expense', 600, 'Vehicle Expense', 'expense', 'operating_expenses', 'debit', true, true, 'Vehicle operations not captured elsewhere.'),
('bank_fees', 610, 'Bank & Payment Fees', 'expense', 'operating_expenses', 'debit', true, true, 'Merchant fees and bank charges.'),
('payroll_contractors', 620, 'Payroll & Contractors', 'expense', 'operating_expenses', 'debit', true, true, 'Wages and contractors.'),
('owner_draw', 630, 'Owner Draw', 'expense', 'owner_draws', 'debit', true, true, 'Owner withdrawals.')
on conflict (code) do update set
  sort_order = excluded.sort_order,
  label = excluded.label,
  account_type = excluded.account_type,
  account_group = excluded.account_group,
  normal_balance = excluded.normal_balance,
  is_active = excluded.is_active,
  is_system = excluded.is_system,
  notes = excluded.notes,
  updated_at = now();
