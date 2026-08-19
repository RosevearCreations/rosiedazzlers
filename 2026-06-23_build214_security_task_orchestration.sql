-- Build 214 — security containment and owner-task orchestration.
-- Purpose:
-- 1. Lock public-schema tables behind RLS + server-side service-role access.
-- 2. Provide a protected posture report for the Admin Security screen.
-- 3. Add due dates/escalation metadata for owner attention tasks.
--
-- IMPORTANT: Rosie Dazzlers browser pages use Cloudflare Functions for database access.
-- This migration intentionally removes direct anon/authenticated table access. Do not add
-- broad allow-all RLS policies to make an application error disappear; repair the specific
-- Cloudflare Function or create a narrowly protected API instead.

begin;

alter table if exists public.owner_attention_tasks
  add column if not exists due_at timestamptz null,
  add column if not exists escalation_at timestamptz null,
  add column if not exists escalation_status text not null default 'none'
    check (escalation_status in ('none','pending','sent','acknowledged')),
  add column if not exists last_notified_at timestamptz null;

create index if not exists owner_attention_tasks_due_idx
  on public.owner_attention_tasks (status, due_at asc nulls last);
create index if not exists owner_attention_tasks_assignee_idx
  on public.owner_attention_tasks (assigned_to_staff_user_id, status, due_at asc nulls last);

-- Enable RLS on every normal table in public. The Cloudflare Functions use the service role
-- server-side; browser roles receive no direct table privileges. This is deliberate.
do $$
declare row record;
begin
  for row in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', row.tablename);
    execute format('revoke all privileges on table public.%I from anon, authenticated, public', row.tablename);
    execute format('grant all privileges on table public.%I to service_role', row.tablename);
  end loop;
end $$;

revoke all privileges on all sequences in schema public from anon, authenticated, public;
grant all privileges on all sequences in schema public to service_role;

-- Apply safer defaults to future tables created by the SQL Editor's usual postgres owner.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, public;
alter default privileges for role postgres in schema public grant all on tables to service_role;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, public;
alter default privileges for role postgres in schema public grant all on sequences to service_role;

-- Protected security posture report. It is intentionally executable only by service_role;
-- the Cloudflare admin Function validates staff access before invoking it.
create or replace function public.rosie_security_posture_report()
returns table (
  table_name text,
  rls_enabled boolean,
  anon_select boolean,
  anon_write boolean,
  authenticated_select boolean,
  authenticated_write boolean,
  browser_access_risk boolean
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    c.relname::text as table_name,
    c.relrowsecurity as rls_enabled,
    has_table_privilege('anon', c.oid, 'SELECT') as anon_select,
    (
      has_table_privilege('anon', c.oid, 'INSERT')
      or has_table_privilege('anon', c.oid, 'UPDATE')
      or has_table_privilege('anon', c.oid, 'DELETE')
    ) as anon_write,
    has_table_privilege('authenticated', c.oid, 'SELECT') as authenticated_select,
    (
      has_table_privilege('authenticated', c.oid, 'INSERT')
      or has_table_privilege('authenticated', c.oid, 'UPDATE')
      or has_table_privilege('authenticated', c.oid, 'DELETE')
    ) as authenticated_write,
    (
      not c.relrowsecurity
      or has_table_privilege('anon', c.oid, 'SELECT')
      or has_table_privilege('anon', c.oid, 'INSERT')
      or has_table_privilege('anon', c.oid, 'UPDATE')
      or has_table_privilege('anon', c.oid, 'DELETE')
      or has_table_privilege('authenticated', c.oid, 'SELECT')
      or has_table_privilege('authenticated', c.oid, 'INSERT')
      or has_table_privilege('authenticated', c.oid, 'UPDATE')
      or has_table_privilege('authenticated', c.oid, 'DELETE')
    ) as browser_access_risk
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r','p')
  order by c.relname;
$$;
revoke all on function public.rosie_security_posture_report() from public, anon, authenticated;
grant execute on function public.rosie_security_posture_report() to service_role;

comment on function public.rosie_security_posture_report() is
  'Build 214 protected security posture report. Execute only through server-side service_role after staff authorization.';
comment on table public.owner_attention_tasks is
  'Build 214 extends owner tasks with due dates/escalation metadata. Browser roles must not access this table directly.';

commit;
