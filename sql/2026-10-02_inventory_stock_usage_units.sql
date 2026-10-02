-- Rosie Dazzlers inventory stock/usage separation.
-- Additive compatibility migration: unit_label remains available for existing callers.
alter table public.catalog_inventory_items
  add column if not exists stock_unit text,
  add column if not exists usage_unit text,
  add column if not exists usage_units_per_stock_unit numeric(12,4) not null default 1;

update public.catalog_inventory_items
set stock_unit = nullif(trim(unit_label), '')
where (stock_unit is null or trim(stock_unit) = '')
  and unit_label is not null
  and trim(unit_label) <> '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'catalog_inventory_items_usage_units_positive'
      and conrelid = 'public.catalog_inventory_items'::regclass
  ) then
    alter table public.catalog_inventory_items
      add constraint catalog_inventory_items_usage_units_positive
      check (usage_units_per_stock_unit > 0);
  end if;
end $$;
