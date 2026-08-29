-- Rosie Dazzlers Build 267 — role/module hierarchy convergence
-- Reuses public.staff_users.permissions_profile and public.app_management_settings.
-- Critical ordering: existing admin accounts are forced to all internal modules BEFORE role constraints change.

begin;

-- 1) Protect current owners first. An admin can never be stranded by a partial module profile.
update public.staff_users
set permissions_profile = jsonb_set(
  jsonb_set(
    coalesce(permissions_profile, '{}'::jsonb),
    '{module_access}',
    '{"detailer":true,"operations":true,"admin":true,"it":true,"finance":true,"daip":true,"socials":true}'::jsonb,
    true
  ),
  '{module_access_version}',
  '267'::jsonb,
  true
),
updated_at = now()
where lower(coalesce(role_code, '')) = 'admin';

-- Fail closed before changing the role constraint if any current admin did not converge.
do $$
begin
  if exists (
    select 1
    from public.staff_users
    where lower(coalesce(role_code, '')) = 'admin'
      and not (
        coalesce((permissions_profile #>> '{module_access,detailer}')::boolean, false)
        and coalesce((permissions_profile #>> '{module_access,operations}')::boolean, false)
        and coalesce((permissions_profile #>> '{module_access,admin}')::boolean, false)
        and coalesce((permissions_profile #>> '{module_access,it}')::boolean, false)
        and coalesce((permissions_profile #>> '{module_access,finance}')::boolean, false)
        and coalesce((permissions_profile #>> '{module_access,daip}')::boolean, false)
        and coalesce((permissions_profile #>> '{module_access,socials}')::boolean, false)
      )
  ) then
    raise exception 'Build 267 refused to continue: one or more admin accounts do not have all module grants.';
  end if;
end $$;

-- 2) Give pre-module Detailer/Senior Detailer accounts their role-safe defaults only when no module_access profile exists.
update public.staff_users
set permissions_profile = jsonb_set(
  coalesce(permissions_profile, '{}'::jsonb),
  '{module_access}',
  case lower(role_code)
    when 'senior_detailer' then '{"detailer":true,"operations":true}'::jsonb
    else '{"detailer":true}'::jsonb
  end,
  true
),
updated_at = now()
where lower(coalesce(role_code, '')) in ('detailer','senior_detailer')
  and jsonb_typeof(coalesce(permissions_profile, '{}'::jsonb)->'module_access') is null;

-- 3) Expand the existing staff role authority. No parallel role table is introduced.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.staff_users'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role_code%'
  loop
    execute format('alter table public.staff_users drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.staff_users
  add constraint staff_users_role_code_check
  check (role_code in (
    'admin',
    'senior_detailer',
    'detailer',
    'operations_manager',
    'accountant',
    'it_specialist',
    'promoter',
    'daip_manager'
  ));

-- 4) Store the role/module defaults in the existing settings authority for audit/admin tooling.
insert into public.app_management_settings (key, value, updated_at)
values (
  'staff_role_module_defaults',
  jsonb_build_object(
    'build', 267,
    'admin_all_modules_required', true,
    'roles', jsonb_build_object(
      'detailer', jsonb_build_array('detailer'),
      'senior_detailer', jsonb_build_array('detailer','operations'),
      'operations_manager', jsonb_build_array('detailer','operations'),
      'accountant', jsonb_build_array('finance'),
      'it_specialist', jsonb_build_array('it'),
      'promoter', jsonb_build_array('socials'),
      'daip_manager', jsonb_build_array('daip'),
      'admin', jsonb_build_array('detailer','operations','admin','it','finance','daip','socials')
    )
  ),
  now()
)
on conflict (key) do update
set value = excluded.value,
    updated_at = excluded.updated_at;

commit;
