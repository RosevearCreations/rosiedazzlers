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

insert into public.customer_tiers (code, sort_order, label, description, is_active, discount_percent, benefits) values
('bronze',10,'Bronze','Default customer tier with standard pricing.',true,0,'[]'::jsonb),
('silver',20,'Silver','Membership tier with selected free upgrades and loyalty benefits.',true,0,'["free upgrade options","member pricing"]'::jsonb),
('gold',30,'Gold','Premium membership tier with stronger loyalty benefits and complimentary cleanings.',true,0,'["free cleanings","priority booking","free upgrades"]'::jsonb)
on conflict (code) do update set
  sort_order = excluded.sort_order,
  label = excluded.label,
  description = excluded.description,
  is_active = excluded.is_active,
  discount_percent = excluded.discount_percent,
  benefits = excluded.benefits,
  updated_at = now();
