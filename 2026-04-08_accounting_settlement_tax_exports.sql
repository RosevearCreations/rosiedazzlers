-- 2026-04-08 accounting settlement, tax reporting, owner-equity reporting, exports, and COGS linkage

alter table if exists public.accounting_journal_entries
  add column if not exists settlement_of_entry_id uuid null references public.accounting_journal_entries(id) on delete set null;

create index if not exists accounting_journal_entries_settlement_idx
  on public.accounting_journal_entries(settlement_of_entry_id, entry_type, status);

comment on column public.accounting_journal_entries.settlement_of_entry_id is
  'When populated, this entry settles or partially settles the referenced payable entry.';
