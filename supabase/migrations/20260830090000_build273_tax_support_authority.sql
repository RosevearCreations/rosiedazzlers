-- Build 273 — persistent tax-support authority for accountant/T2125 readiness.
-- Additive only. Existing ledger, booking and inventory authorities remain canonical.

create table if not exists public.accounting_business_vehicles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  label text not null,
  vehicle_year integer null check (vehicle_year is null or vehicle_year between 1900 and 2100),
  make text null,
  model text null,
  ownership_type text not null default 'personal' check (ownership_type in ('personal','business','leased','other')),
  acquisition_date date null,
  placed_in_service_date date null,
  capital_cost_cad numeric(12,2) null check (capital_cost_cad is null or capital_cost_cad >= 0),
  cca_class text null,
  active boolean not null default true,
  notes text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create table if not exists public.accounting_vehicle_tax_years (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vehicle_id uuid not null references public.accounting_business_vehicles(id) on delete cascade,
  tax_year integer not null check (tax_year between 2020 and 2100),
  opening_odometer_km numeric(12,1) null check (opening_odometer_km is null or opening_odometer_km >= 0),
  closing_odometer_km numeric(12,1) null check (closing_odometer_km is null or closing_odometer_km >= 0),
  total_km numeric(12,1) null check (total_km is null or total_km >= 0),
  business_km numeric(12,1) not null default 0 check (business_km >= 0),
  business_use_pct numeric(7,4) null check (business_use_pct is null or (business_use_pct >= 0 and business_use_pct <= 100)),
  status text not null default 'draft' check (status in ('draft','review','ready')),
  notes text null,
  reviewed_at timestamptz null,
  reviewed_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  unique(vehicle_id, tax_year),
  check (closing_odometer_km is null or opening_odometer_km is null or closing_odometer_km >= opening_odometer_km),
  check (total_km is null or business_km <= total_km)
);

create table if not exists public.accounting_mileage_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vehicle_id uuid not null references public.accounting_business_vehicles(id) on delete cascade,
  trip_date date not null,
  booking_id uuid null references public.bookings(id) on delete set null,
  purpose text not null,
  origin_label text null,
  destination_label text null,
  start_odometer_km numeric(12,1) null check (start_odometer_km is null or start_odometer_km >= 0),
  end_odometer_km numeric(12,1) null check (end_odometer_km is null or end_odometer_km >= 0),
  total_km numeric(12,1) not null check (total_km >= 0),
  business_km numeric(12,1) not null check (business_km >= 0),
  parking_cad numeric(12,2) not null default 0 check (parking_cad >= 0),
  tolls_cad numeric(12,2) not null default 0 check (tolls_cad >= 0),
  document_id uuid null references public.accounting_documents(id) on delete set null,
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed','reviewed','excluded')),
  notes text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  check (business_km <= total_km),
  check (end_odometer_km is null or start_odometer_km is null or end_odometer_km >= start_odometer_km)
);

create table if not exists public.accounting_home_office_workpapers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tax_year integer not null unique check (tax_year between 2020 and 2100),
  allocation_method text not null default 'area' check (allocation_method in ('area','area_and_time','reasonable_other')),
  workspace_area_sqft numeric(12,2) null check (workspace_area_sqft is null or workspace_area_sqft >= 0),
  home_area_sqft numeric(12,2) null check (home_area_sqft is null or home_area_sqft > 0),
  exclusive_business_use boolean not null default false,
  shared_hours_per_day numeric(6,2) null check (shared_hours_per_day is null or (shared_hours_per_day >= 0 and shared_hours_per_day <= 24)),
  shared_days_per_week numeric(6,2) null check (shared_days_per_week is null or (shared_days_per_week >= 0 and shared_days_per_week <= 7)),
  shared_weeks_per_year numeric(6,2) null check (shared_weeks_per_year is null or (shared_weeks_per_year >= 0 and shared_weeks_per_year <= 53)),
  eligible_costs jsonb not null default '{}'::jsonb,
  prior_carryforward_cad numeric(12,2) not null default 0 check (prior_carryforward_cad >= 0),
  net_income_limit_cad numeric(12,2) null check (net_income_limit_cad is null or net_income_limit_cad >= 0),
  allocation_pct numeric(7,4) null check (allocation_pct is null or (allocation_pct >= 0 and allocation_pct <= 100)),
  eligible_cost_total_cad numeric(12,2) null check (eligible_cost_total_cad is null or eligible_cost_total_cad >= 0),
  calculated_candidate_cad numeric(12,2) null check (calculated_candidate_cad is null or calculated_candidate_cad >= 0),
  suggested_current_year_deduction_cad numeric(12,2) null check (suggested_current_year_deduction_cad is null or suggested_current_year_deduction_cad >= 0),
  suggested_carryforward_cad numeric(12,2) null check (suggested_carryforward_cad is null or suggested_carryforward_cad >= 0),
  claim_amount_cad numeric(12,2) null check (claim_amount_cad is null or claim_amount_cad >= 0),
  review_status text not null default 'draft' check (review_status in ('draft','review','ready')),
  notes text null,
  reviewed_at timestamptz null,
  reviewed_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create table if not exists public.accounting_capital_assets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  asset_name text not null,
  inventory_item_id uuid null references public.catalog_inventory_items(id) on delete set null,
  acquisition_date date not null,
  available_for_use_date date null,
  disposition_date date null,
  capital_cost_cad numeric(12,2) not null check (capital_cost_cad >= 0),
  proceeds_cad numeric(12,2) null check (proceeds_cad is null or proceeds_cad >= 0),
  cca_class text null,
  prior_ucc_cad numeric(12,2) null check (prior_ucc_cad is null or prior_ucc_cad >= 0),
  business_use_pct numeric(7,4) not null default 100 check (business_use_pct >= 0 and business_use_pct <= 100),
  current_year_cca_claim_cad numeric(12,2) null check (current_year_cca_claim_cad is null or current_year_cca_claim_cad >= 0),
  document_id uuid null references public.accounting_documents(id) on delete set null,
  review_status text not null default 'draft' check (review_status in ('draft','review','ready','disposed')),
  notes text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create table if not exists public.accounting_tax_year_support (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tax_year integer not null unique check (tax_year between 2020 and 2100),
  opening_inventory_cad numeric(12,2) null check (opening_inventory_cad is null or opening_inventory_cad >= 0),
  closing_inventory_cad numeric(12,2) null check (closing_inventory_cad is null or closing_inventory_cad >= 0),
  inventory_valuation_method text null,
  direct_cost_adjustment_cad numeric(12,2) not null default 0,
  filing_status text not null default 'collecting' check (filing_status in ('collecting','review','accountant_ready','filed')),
  notes text null,
  accountant_notes text null,
  reviewed_at timestamptz null,
  reviewed_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create index if not exists accounting_mileage_logs_vehicle_date_idx
  on public.accounting_mileage_logs(vehicle_id, trip_date desc);
create index if not exists accounting_mileage_logs_booking_idx
  on public.accounting_mileage_logs(booking_id) where booking_id is not null;
create index if not exists accounting_vehicle_tax_years_year_idx
  on public.accounting_vehicle_tax_years(tax_year, vehicle_id);
create index if not exists accounting_capital_assets_status_idx
  on public.accounting_capital_assets(review_status, acquisition_date);

alter table public.accounting_business_vehicles enable row level security;
alter table public.accounting_vehicle_tax_years enable row level security;
alter table public.accounting_mileage_logs enable row level security;
alter table public.accounting_home_office_workpapers enable row level security;
alter table public.accounting_capital_assets enable row level security;
alter table public.accounting_tax_year_support enable row level security;

comment on table public.accounting_business_vehicles is 'Build 273 business-use vehicle master for tax-support records; not customer vehicle inventory.';
comment on table public.accounting_vehicle_tax_years is 'Build 273 annual odometer/business-use reconciliation supporting T2125 vehicle allocation.';
comment on table public.accounting_mileage_logs is 'Build 273 business mileage evidence; trips never infer commuting or deductibility automatically.';
comment on table public.accounting_home_office_workpapers is 'Build 273 business-use-of-home factual workpaper with allocation and carry-forward support.';
comment on table public.accounting_capital_assets is 'Build 273 capital asset factual register supporting review-first CCA schedules.';
comment on table public.accounting_tax_year_support is 'Build 273 annual tax-support state including inventory/COGS workpaper inputs and accountant readiness.';

insert into public.app_management_settings(key, value, updated_at)
values (
  'business_tax_profile',
  jsonb_build_object(
    'schema_version', 1,
    'jurisdiction_country', 'CA',
    'jurisdiction_province', 'ON',
    'tax_workpaper', 'T2125',
    'entity_type', 'unconfirmed',
    'primary_business_activity', 'Mobile auto detailing',
    'gst_hst_registered', null,
    'business_number_masked', null,
    'gst_hst_number_masked', null,
    'fiscal_year_end_month', 12,
    'fiscal_year_end_day', 31,
    'accounting_method', 'accrual_review',
    'identifiers_policy', 'masked_only',
    'notes', 'Build 273 tax profile. Confirm entity type, GST/HST registration and masked identifiers before filing use.'
  ),
  now()
)
on conflict (key) do nothing;
