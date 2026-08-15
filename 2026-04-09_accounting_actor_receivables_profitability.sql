-- 2026-04-09 accounting actor normalization, receivables-aging, and profitability support

alter table if exists public.accounting_journal_entries
  add column if not exists created_by_staff_user_id uuid null references public.staff_users(id) on delete set null;

alter table if exists public.accounting_journal_entries
  add column if not exists last_recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null;

create index if not exists accounting_journal_entries_actor_date_idx
  on public.accounting_journal_entries(created_by_staff_user_id, entry_date);

create index if not exists accounting_records_balance_service_idx
  on public.accounting_records(order_status, service_date, balance_due_cad);
