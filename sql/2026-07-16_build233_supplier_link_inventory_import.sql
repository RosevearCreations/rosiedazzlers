-- Build 233: provider-neutral supplier-link inventory intake, Amazon first.
create table if not exists public.catalog_supplier_import_audit (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  provider text not null, source_url text not null, external_product_id text null,
  parse_status text not null check (parse_status in ('parsed','partial','failed')), warning_text text null,
  duplicate_item_key text null, actor_name text null
);
create index if not exists catalog_supplier_import_audit_created_idx on public.catalog_supplier_import_audit(created_at desc);
alter table public.catalog_supplier_import_audit enable row level security;
revoke all on table public.catalog_supplier_import_audit from anon, authenticated;
grant all on table public.catalog_supplier_import_audit to service_role;
