-- Rosie Dazzlers 870: source-bound, customer-consented, revocable quotation links.
-- Requires the private Build 868 and 869 detailing intake migrations first.
create table if not exists public.rosie_roadside_quote_shares_v870 (
 id uuid primary key,
 draft_id uuid not null references public.rosie_detailing_intake_v868(id) on delete cascade,
 token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
 quote_snapshot_cents integer not null check (quote_snapshot_cents between 1 and 10000000),
 package_code text check (package_code is null or package_code in
  ('premium_wash','basic_detail','complete_detail','interior_detail','exterior_detail')),
 vehicle_size text check (vehicle_size is null or vehicle_size in ('small','mid','oversize')),
 purpose text not null default 'quote_and_booking_only'
  check (purpose = 'quote_and_booking_only'),
 consent_attested boolean not null default true check (consent_attested),
 consent_recorded_at timestamptz not null,
 created_by_staff text not null check (char_length(created_by_staff) between 3 and 140),
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 check (expires_at > consent_recorded_at and expires_at <= consent_recorded_at + interval '7 days 1 minute'),
 check (revoked_at is null or revoked_at >= created_at)
);
create unique index if not exists rosie870_one_unrevoked_link_per_draft
 on public.rosie_roadside_quote_shares_v870(draft_id) where revoked_at is null;
create index if not exists rosie870_quote_share_expiry
 on public.rosie_roadside_quote_shares_v870(expires_at);
alter table public.rosie_roadside_quote_shares_v870 enable row level security;
revoke all on public.rosie_roadside_quote_shares_v870 from public,anon,authenticated;
grant select,insert,update on public.rosie_roadside_quote_shares_v870 to service_role;

-- An audit of checks, not a mutable payment balance or paid flag on bookings.
create table if not exists public.rosie_roadside_deposit_checks_v870 (
 id uuid primary key,
 draft_id uuid not null references public.rosie_detailing_intake_v868(id) on delete cascade,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 checked_at timestamptz not null default clock_timestamp(),
 checked_by_staff text not null check (char_length(checked_by_staff) between 3 and 140),
 provider text not null check (provider in ('stripe','paypal','gift','unknown')),
 result text not null check (result in
  ('verified_original_deposit','settlement_pending','pending_provider','gift_covered_no_cash_deposit','hold_unverified')),
 source_is_canonical boolean not null default true check (source_is_canonical)
);
create index if not exists rosie870_deposit_checks_booking
 on public.rosie_roadside_deposit_checks_v870(booking_id,checked_at desc);
alter table public.rosie_roadside_deposit_checks_v870 enable row level security;
revoke all on public.rosie_roadside_deposit_checks_v870 from public,anon,authenticated;
grant select,insert on public.rosie_roadside_deposit_checks_v870 to service_role;
comment on table public.rosie_roadside_deposit_checks_v870 is
 'Evidence snapshots only. Payment truth remains with canonical Stripe/PayPal capture, webhooks and booking authority. Refund status is not inferred here.';
