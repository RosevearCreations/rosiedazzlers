-- Rosie Build 912. Private original-source retail catalog, staffed handoff, time-scoped specials and first-party interest receipts.
-- No payment capture, refund, tax journal, DAIP publication or stock deduction is authorized by these tables.
create table if not exists public.rosie_retail_products_v912 (
 id uuid primary key default gen_random_uuid(),
 sku text not null unique check (sku ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$'),
 title text not null check (length(title) between 4 and 140),
 description text not null default '' check (length(description)<=1000),
 category text not null default 'general' check (length(category) between 1 and 50),
 price_cents integer not null check (price_cents between 1 and 10000000),
 stock_on_hand integer not null default 0 check (stock_on_hand between 0 and 1000000),
 active boolean not null default false,
 publish_approved boolean not null default false,
 supplier_review_id uuid references public.rosie_supplier_reviews_v911(id) on delete set null,
 created_by_staff_user_id uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists rosie_retail_products_v912_live_idx on public.rosie_retail_products_v912(active,publish_approved);

create table if not exists public.rosie_retail_locations_v912 (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(name) between 4 and 120),
 mode text not null check (mode in ('pickup','stand','remote_service')),
 service_area text not null check (length(service_area) between 3 and 120),
 customer_directions text not null default '' check (length(customer_directions)<=400),
 active boolean not null default false,
 starts_at timestamptz,
 ends_at timestamptz,
 created_at timestamptz not null default now(),
 check (ends_at is null or starts_at is null or ends_at>starts_at)
);
create table if not exists public.rosie_retail_specials_v912 (
 id uuid primary key default gen_random_uuid(),
 code text not null unique check (code ~ '^[A-Z0-9_-]{4,30}$'),
 title text not null check (length(title) between 4 and 140),
 location_id uuid not null references public.rosie_retail_locations_v912(id),
 percent_off integer not null check (percent_off between 1 and 50),
 active boolean not null default false,
 quote_required boolean not null default true check (quote_required=true),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 created_at timestamptz not null default now(),
 check (ends_at>starts_at)
);
create index if not exists rosie_retail_specials_v912_active_idx on public.rosie_retail_specials_v912(active,starts_at,ends_at);

create table if not exists public.rosie_retail_order_requests_v912 (
 id uuid primary key default gen_random_uuid(),
 customer_profile_id uuid not null references public.customer_profiles(id),
 idempotency_key uuid not null,
 request_digest text not null check (request_digest ~ '^[a-f0-9]{64}$'),
 mode text not null check (mode in ('pickup','stand')),
 location_id uuid not null references public.rosie_retail_locations_v912(id),
 lines jsonb not null check (jsonb_typeof(lines)='array' and jsonb_array_length(lines) between 1 and 12),
 subtotal_cents integer not null check (subtotal_cents between 1 and 10000000),
 estimated_hst_cents integer not null check (estimated_hst_cents between 0 and 1300000),
 status text not null default 'awaiting_staff_review'
   check (status in ('awaiting_staff_review','quoted','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(customer_profile_id,idempotency_key)
);
create index if not exists rosie_retail_order_v912_customer_idx
 on public.rosie_retail_order_requests_v912(customer_profile_id,created_at desc);
create index if not exists rosie_retail_order_v912_staff_idx
 on public.rosie_retail_order_requests_v912(status,created_at desc);

create table if not exists public.rosie_retail_interest_v912 (
 id uuid primary key default gen_random_uuid(),
 customer_profile_id uuid not null references public.customer_profiles(id),
 product_id uuid not null references public.rosie_retail_products_v912(id),
 interest_kind text not null check (interest_kind in ('view','save','cart')),
 event_day date not null default current_date,
 created_at timestamptz not null default now(),
 unique(customer_profile_id,product_id,interest_kind,event_day)
);
create index if not exists rosie_retail_interest_v912_rollup_idx
 on public.rosie_retail_interest_v912(event_day,product_id,interest_kind);

alter table public.rosie_retail_products_v912 enable row level security;
alter table public.rosie_retail_locations_v912 enable row level security;
alter table public.rosie_retail_specials_v912 enable row level security;
alter table public.rosie_retail_order_requests_v912 enable row level security;
alter table public.rosie_retail_interest_v912 enable row level security;
revoke all on public.rosie_retail_products_v912,public.rosie_retail_locations_v912,
 public.rosie_retail_specials_v912,public.rosie_retail_order_requests_v912,
 public.rosie_retail_interest_v912 from public,anon,authenticated;
grant select,insert,update on public.rosie_retail_products_v912,public.rosie_retail_locations_v912,
 public.rosie_retail_specials_v912,public.rosie_retail_order_requests_v912 to service_role;
grant select,insert on public.rosie_retail_interest_v912 to service_role;
comment on table public.rosie_retail_order_requests_v912 is
 'Original, server-priced customer intent: not a paid order, inventory reservation, invoice, HST filing, stand POS payment or shipping confirmation.';
comment on table public.rosie_retail_interest_v912 is
 'Private deduplicated first-party interest; only bounded anonymous aggregate totals may leave the staff boundary.';
