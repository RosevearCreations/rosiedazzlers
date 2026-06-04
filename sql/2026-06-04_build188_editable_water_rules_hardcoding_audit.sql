-- Build 188 editable water-restriction authority and hard-coded content audit — 2026-06-04
-- Creates a DB-first source for municipal/county water-use rules.
-- The bundled data/water_restriction_rules.json file remains the deploy-safe fallback.

create table if not exists public.water_restriction_rules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  county text,
  effective_dates text,
  effective_start text,
  effective_end text,
  rule_summary text,
  address_rule text,
  residential_hours jsonb not null default '[]'::jsonb,
  commercial_industrial_hours jsonb not null default '[]'::jsonb,
  applies_to text,
  verified_sources jsonb not null default '[]'::jsonb,
  local_pages jsonb not null default '[]'::jsonb,
  towns jsonb not null default '[]'::jsonb,
  local_page_rules jsonb not null default '{}'::jsonb,
  source_summary text,
  verified_at date,
  next_review_at date,
  version text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_water_restriction_rules_active_county
  on public.water_restriction_rules (is_active, county, sort_order);

create index if not exists idx_water_restriction_rules_next_review
  on public.water_restriction_rules (next_review_at);

alter table public.service_area_rules
  add column if not exists water_rule_key text;

create index if not exists idx_service_area_rules_water_rule_key
  on public.service_area_rules (water_rule_key);

comment on table public.water_restriction_rules is
  'Editable DB-first authority for seasonal municipal/county outdoor water-use rules. Public APIs and local landing pages fall back to data/water_restriction_rules.json when DB rows are unavailable.';

comment on column public.water_restriction_rules.local_page_rules is
  'Optional JSON object keyed by landing-page slug for page-specific wording and official-source links.';

comment on column public.service_area_rules.water_rule_key is
  'Reference key used to enrich service-area rows from public.water_restriction_rules without duplicating mutable water-rule text.';

-- Recommended deployment order:
-- 1) Apply this migration.
-- 2) Use /api/admin/water_restriction_rules or Admin Content/App Management to save
--    the rules from data/water_restriction_rules.json.
-- 3) Update service_area_rules.water_rule_key for rows where a county rule applies.
-- 4) Keep data/water_restriction_rules.json as the bundled fallback only.

-- Seed the verified Build 188 rules as editable rows. Future changes should be made through
-- the admin editor/table and then synchronized back to the stable fallback JSON.
insert into public.water_restriction_rules (
  key, label, county, effective_dates, rule_summary, address_rule,
  residential_hours, commercial_industrial_hours, applies_to, verified_sources,
  local_pages, towns, verified_at, next_review_at, version, sort_order, is_active, updated_at
) values
(
  'oxford-county-seasonal',
  'Oxford County seasonal outdoor water-use rule',
  'Oxford County',
  'May 1 to September 30',
  'Oxford County outdoor water-use reminder: May 1 to September 30, outdoor water use by hose or attachment, including vehicle washing and power washing, follows address parity. Even-numbered addresses use even-numbered days; odd-numbered addresses use odd-numbered days. Residential windows are 6:00–9:00 a.m. or 6:00–9:00 p.m.; commercial/industrial windows are 8:00–10:00 a.m. or 3:00–5:00 p.m. Confirm current municipal/county notices before exterior work.',
  'Even-numbered addresses on even-numbered days; odd-numbered addresses on odd-numbered days.',
  '["6:00 a.m. to 9:00 a.m.","6:00 p.m. to 9:00 p.m."]'::jsonb,
  '["8:00 a.m. to 10:00 a.m.","3:00 p.m. to 5:00 p.m."]'::jsonb,
  'Outdoor water use by hose or attachment, including vehicle washing and power washing.',
  '[{"label":"Town of Tillsonburg water restrictions","url":"https://www.tillsonburg.ca/living-here/water-and-wastewater/water-restrictions/"},{"label":"Oxford County water conservation","url":"https://www.oxfordcounty.ca/services-for-you/water-and-wastewater/drinking-water/water-conservation/"},{"label":"City of Woodstock watering restrictions","url":"https://www.cityofwoodstock.ca/living-in-woodstock/water-and-utilities/water/watering-restrictions-and-conservation/"}]'::jsonb,
  '["tillsonburg-auto-detailing","woodstock-ingersoll-auto-detailing","norwich-otterville-auto-detailing","zorra-thamesford-embro-auto-detailing"]'::jsonb,
  '["Embro","Ingersoll","Norwich","Otterville","Thamesford","Tillsonburg","Woodstock","Zorra"]'::jsonb,
  '2026-06-04', '2027-04-15', '188', 0, true, now()
),
(
  'norfolk-county-seasonal',
  'Norfolk County seasonal outdoor water-use rule',
  'Norfolk County',
  'May 15 to September 15',
  'Norfolk County outdoor water-use reminder: May 15 to September 15, outdoor water use is allowed only 9:00–11:00 a.m. and 7:00–10:00 p.m.; odd-numbered houses use odd calendar days and even-numbered houses use even calendar days. Confirm current County notices before exterior work.',
  'Odd-numbered houses on odd calendar days; even-numbered houses on even calendar days.',
  '["9:00 a.m. to 11:00 a.m.","7:00 p.m. to 10:00 p.m."]'::jsonb,
  '[]'::jsonb,
  'Outdoor water use under Norfolk County''s seasonal watering restriction by-law.',
  '[{"label":"Norfolk County watering restrictions","url":"https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/"}]'::jsonb,
  '["simcoe-delhi-auto-detailing","port-dover-auto-detailing","waterford-vittoria-auto-detailing","port-rowan-turkey-point-auto-detailing"]'::jsonb,
  '["Delhi","Port Dover","Port Rowan","Simcoe","Turkey Point","Vittoria","Waterford"]'::jsonb,
  '2026-06-04', '2027-05-01', '188', 1, true, now()
)
on conflict (key) do update set
  label = excluded.label,
  county = excluded.county,
  effective_dates = excluded.effective_dates,
  rule_summary = excluded.rule_summary,
  address_rule = excluded.address_rule,
  residential_hours = excluded.residential_hours,
  commercial_industrial_hours = excluded.commercial_industrial_hours,
  applies_to = excluded.applies_to,
  verified_sources = excluded.verified_sources,
  local_pages = excluded.local_pages,
  towns = excluded.towns,
  verified_at = excluded.verified_at,
  next_review_at = excluded.next_review_at,
  version = excluded.version,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

update public.service_area_rules
set water_rule_key = case
  when lower(coalesce(county, '')) = 'oxford county' then 'oxford-county-seasonal'
  when lower(coalesce(county, '')) = 'norfolk county' then 'norfolk-county-seasonal'
  else water_rule_key
end
where lower(coalesce(county, '')) in ('oxford county', 'norfolk county');
