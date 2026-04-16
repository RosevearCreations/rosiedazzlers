-- 2026-04-09 accounting reporting / inventory cost coverage support

create index if not exists accounting_journal_entries_reference_type_date_idx
  on public.accounting_journal_entries(reference_type, entry_date, status);

create index if not exists catalog_inventory_items_active_cost_idx
  on public.catalog_inventory_items(is_active, item_type, cost_cents, qty_on_hand);
