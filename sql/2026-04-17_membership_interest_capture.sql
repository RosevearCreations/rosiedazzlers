-- April 17, 2026 recurring-plan interest capture
create table if not exists membership_interest_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text,
  postal_code text,
  vehicle_count integer not null default 1,
  preferred_cycle text,
  notes text,
  source_url text,
  status text not null default 'new'
);

create index if not exists membership_interest_requests_created_at_idx on membership_interest_requests (created_at desc);
create index if not exists membership_interest_requests_email_idx on membership_interest_requests (email);
