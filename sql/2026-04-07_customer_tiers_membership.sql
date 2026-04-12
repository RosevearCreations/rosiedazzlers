-- sql/2026-04-07_customer_tiers_membership.sql

create table if not exists public.customer_tiers (
  code text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  label text not null,
  description text null,
  is_active boolean not null default true,
  discount_percent numeric(6,2) null default 0,
  benefits jsonb not null default '[]'::jsonb
);

alter table public.customer_tiers
  add column if not exists created_at timestamptz not null default now();

alter table public.customer_tiers
  add column if not exists updated_at timestamptz not null default now();

alter table public.customer_tiers
  add column if not exists sort_order integer not null default 0;

alter table public.customer_tiers
  add column if not exists label text;

alter table public.customer_tiers
  add column if not exists description text null;

alter table public.customer_tiers
  add column if not exists is_active boolean not null default true;

alter table public.customer_tiers
  add column if not exists discount_percent numeric(6,2) null default 0;

alter table public.customer_tiers
  add column if not exists benefits jsonb not null default '[]'::jsonb;

update public.customer_tiers
set label = initcap(code)
where label is null or btrim(label) = '';

insert into public.customer_tiers (
  code,
  sort_order,
  label,
  description,
  is_active,
  discount_percent,
  benefits
) values
(
  'bronze',
  10,
  'Bronze',
  'Default customer tier with standard pricing.',
  true,
  0,
  '[]'::jsonb
),
(
  'silver',
  20,
  'Silver',
  'Membership tier with selected free upgrades and loyalty benefits.',
  true,
  0,
  '["free upgrade options","member pricing"]'::jsonb
),
(
  'gold',
  30,
  'Gold',
  'Premium membership tier with stronger loyalty benefits and complimentary cleanings.',
  true,
  0,
  '["free cleanings","priority booking","free upgrades"]'::jsonb
)
on conflict (code) do update set
  sort_order = excluded.sort_order,
  label = excluded.label,
  description = excluded.description,
  is_active = excluded.is_active,
  discount_percent = excluded.discount_percent,
  benefits = excluded.benefits,
  updated_at = now();
