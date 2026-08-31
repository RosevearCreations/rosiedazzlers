-- Rosie Dazzlers Build 267 — role/module hierarchy convergence (schema-tolerant fix)
-- Reuses public.staff_users.permissions_profile and public.app_management_settings.
-- Supports historical Development databases where permissions_profile/value are TEXT,
-- as well as fresh/canonical databases where they are JSONB.
-- Critical ordering: existing admin accounts are forced to all internal modules
-- BEFORE role constraints change.

begin;

create or replace function pg_temp.rosie_build267_safe_jsonb(p_value text)
returns jsonb
language plpgsql
as $$
begin
  if p_value is null or btrim(p_value) = '' then return '{}'::jsonb; end if;
  begin return p_value::jsonb;
  exception when others then return jsonb_build_object('_legacy_permissions_profile_text', p_value);
  end;
end;
$$;

do $$
declare v_profile_type text;
begin
  select c.udt_name into v_profile_type from information_schema.columns c
  where c.table_schema='public' and c.table_name='staff_users' and c.column_name='permissions_profile';
  if v_profile_type is null then
    raise exception 'Build 267 refused to continue: public.staff_users.permissions_profile does not exist.';
  elsif v_profile_type='jsonb' then
    update public.staff_users set permissions_profile=pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)||jsonb_build_object('module_access',jsonb_build_object('detailer',true,'operations',true,'admin',true,'it',true,'finance',true,'daip',true,'socials',true),'module_access_version',267),updated_at=now()
    where lower(coalesce(role_code,''))='admin';
  elsif v_profile_type in ('text','varchar','bpchar') then
    update public.staff_users set permissions_profile=(pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)||jsonb_build_object('module_access',jsonb_build_object('detailer',true,'operations',true,'admin',true,'it',true,'finance',true,'daip',true,'socials',true),'module_access_version',267))::text,updated_at=now()
    where lower(coalesce(role_code,''))='admin';
  else raise exception 'Build 267 refused to continue: unsupported permissions_profile type: %',v_profile_type;
  end if;
end $$;

do $$
begin
  if exists(select 1 from public.staff_users where lower(coalesce(role_code,''))='admin' and not(
    coalesce((pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)#>>'{module_access,detailer}')::boolean,false) and
    coalesce((pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)#>>'{module_access,operations}')::boolean,false) and
    coalesce((pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)#>>'{module_access,admin}')::boolean,false) and
    coalesce((pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)#>>'{module_access,it}')::boolean,false) and
    coalesce((pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)#>>'{module_access,finance}')::boolean,false) and
    coalesce((pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)#>>'{module_access,daip}')::boolean,false) and
    coalesce((pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)#>>'{module_access,socials}')::boolean,false))) then
    raise exception 'Build 267 refused to continue: one or more admin accounts do not have all module grants.';
  end if;
end $$;

do $$
declare v_profile_type text;
begin
  select c.udt_name into v_profile_type from information_schema.columns c
  where c.table_schema='public' and c.table_name='staff_users' and c.column_name='permissions_profile';
  if v_profile_type='jsonb' then
    update public.staff_users set permissions_profile=pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)||jsonb_build_object('module_access',case lower(role_code) when 'senior_detailer' then jsonb_build_object('detailer',true,'operations',true) else jsonb_build_object('detailer',true) end,'module_access_version',267),updated_at=now()
    where lower(coalesce(role_code,'')) in('detailer','senior_detailer') and pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)->'module_access' is null;
  elsif v_profile_type in('text','varchar','bpchar') then
    update public.staff_users set permissions_profile=(pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)||jsonb_build_object('module_access',case lower(role_code) when 'senior_detailer' then jsonb_build_object('detailer',true,'operations',true) else jsonb_build_object('detailer',true) end,'module_access_version',267))::text,updated_at=now()
    where lower(coalesce(role_code,'')) in('detailer','senior_detailer') and pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)->'module_access' is null;
  else raise exception 'Build 267 refused to continue: unsupported permissions_profile type: %',v_profile_type;
  end if;
end $$;

do $$
declare c record;
begin
  for c in select conname from pg_constraint where conrelid='public.staff_users'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%role_code%'
  loop execute format('alter table public.staff_users drop constraint %I',c.conname); end loop;
end $$;

alter table public.staff_users add constraint staff_users_role_code_check check(role_code in('admin','senior_detailer','detailer','operations_manager','accountant','it_specialist','promoter','daip_manager'));

do $$
declare v_value_type text; v_payload jsonb;
begin
  v_payload:=jsonb_build_object('build',267,'admin_all_modules_required',true,'roles',jsonb_build_object('detailer',jsonb_build_array('detailer'),'senior_detailer',jsonb_build_array('detailer','operations'),'operations_manager',jsonb_build_array('detailer','operations'),'accountant',jsonb_build_array('finance'),'it_specialist',jsonb_build_array('it'),'promoter',jsonb_build_array('socials'),'daip_manager',jsonb_build_array('daip'),'admin',jsonb_build_array('detailer','operations','admin','it','finance','daip','socials')));
  select c.udt_name into v_value_type from information_schema.columns c where c.table_schema='public' and c.table_name='app_management_settings' and c.column_name='value';
  if v_value_type is null then raise exception 'Build 267 refused to continue: public.app_management_settings.value does not exist.';
  elsif v_value_type='jsonb' then
    insert into public.app_management_settings(key,value,updated_at) values('staff_role_module_defaults',v_payload,now()) on conflict(key) do update set value=excluded.value,updated_at=excluded.updated_at;
  elsif v_value_type in('text','varchar','bpchar') then
    insert into public.app_management_settings(key,value,updated_at) values('staff_role_module_defaults',v_payload::text,now()) on conflict(key) do update set value=excluded.value,updated_at=excluded.updated_at;
  else raise exception 'Build 267 refused to continue: unsupported app_management_settings.value type: %',v_value_type;
  end if;
end $$;

commit;

select id,email,role_code,pg_typeof(permissions_profile) as permissions_profile_type,pg_temp.rosie_build267_safe_jsonb(permissions_profile::text)->'module_access' as module_access from public.staff_users where lower(coalesce(role_code,''))='admin' order by email;
select key,pg_typeof(value) as value_type,value from public.app_management_settings where key='staff_role_module_defaults';