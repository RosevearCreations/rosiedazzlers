-- Rosie 899. Additive, internal, append-only review registers. Does NOT change stock,
-- purchase status, accounting, customer/payment state or approval authority.
create table if not exists public.rosie_equipment_service_v899 (
 id uuid primary key default gen_random_uuid(),
 client_request_id uuid not null unique,
 inventory_item_id uuid not null references public.catalog_inventory_items(id) on delete restrict,
 event_kind text not null check (event_kind in ('planned','staff_reported')),
 service_type text not null check (service_type in ('inspection','cleaning','filter_service','calibration','repair','preventive')),
 due_date date not null,
 service_note text not null check (char_length(service_note) between 8 and 500),
 staff_user_id uuid not null,
 recorded_at timestamptz not null default now(),
 staff_report_unverified boolean not null default true check (staff_report_unverified),
 owner_verified boolean not null default false check (not owner_verified),
 actual_equipment_service_certified boolean not null default false check (not actual_equipment_service_certified)
);
create index if not exists rosie_equipment_service_v899_item_due_idx
 on public.rosie_equipment_service_v899 (inventory_item_id, due_date desc, recorded_at desc);

create table if not exists public.rosie_inventory_count_reviews_v899 (
 id uuid primary key default gen_random_uuid(),
 client_request_id uuid not null unique,
 inventory_item_id uuid not null references public.catalog_inventory_items(id) on delete restrict,
 review_kind text not null check (review_kind in ('cycle_count','before_job','after_job','recount')),
 observed_qty numeric(14,3) not null check (observed_qty >= 0 and observed_qty <= 100000000),
 catalog_qty_snapshot numeric(14,3) not null,
 observed_on date not null,
 staff_note text not null check (char_length(staff_note) between 8 and 500),
 staff_user_id uuid not null,
 recorded_at timestamptz not null default now(),
 staff_report_unverified boolean not null default true check (staff_report_unverified),
 owner_approved boolean not null default false check (not owner_approved),
 stock_adjustment_applied boolean not null default false check (not stock_adjustment_applied)
);
create index if not exists rosie_inventory_count_reviews_v899_item_date_idx
 on public.rosie_inventory_count_reviews_v899 (inventory_item_id, recorded_at desc);
alter table public.rosie_equipment_service_v899 enable row level security;
alter table public.rosie_inventory_count_reviews_v899 enable row level security;
revoke all on table public.rosie_equipment_service_v899, public.rosie_inventory_count_reviews_v899 from public, anon, authenticated;
grant select,insert on table public.rosie_equipment_service_v899, public.rosie_inventory_count_reviews_v899 to service_role;
-- No policies for anon/authenticated; no client/API mutation path, updates or deletes.
comment on table public.rosie_equipment_service_v899 is 'Internal staff-reported planning/service evidence only; never physical verification or accounting authority.';
comment on table public.rosie_inventory_count_reviews_v899 is 'Proposed original physical count evidence, without stock adjustment or owner signoff.';
