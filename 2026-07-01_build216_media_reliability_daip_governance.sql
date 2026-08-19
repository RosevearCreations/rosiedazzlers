-- Rosie Dazzlers Build 216 — media reliability observation/alert foundation and DAIP governance planning support.
-- Apply only after the Build 214 RLS containment migration.
-- This migration adds no DAIP worker, AI processing, public export, or automatic publishing.

begin;

create table if not exists public.media_asset_health_observations (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null,
  label text,
  category text,
  scan_source text not null default 'admin_media_health',
  checked_at timestamptz not null default now(),
  ok boolean not null default false,
  http_status integer not null default 0,
  failure_kind text,
  expected_url text,
  resolved_url text,
  candidate_urls jsonb not null default '[]'::jsonb,
  content_type text,
  width integer,
  height integer,
  dimension_status text not null default 'unknown',
  used_format_fallback boolean not null default false,
  observed_by text,
  created_at timestamptz not null default now(),
  constraint media_asset_health_observations_status_check check (http_status >= 0 and http_status <= 599)
);

create index if not exists media_asset_health_observations_asset_checked_idx
  on public.media_asset_health_observations (asset_key, checked_at desc);
create index if not exists media_asset_health_observations_failures_idx
  on public.media_asset_health_observations (ok, checked_at desc);

create table if not exists public.media_asset_alerts (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  label text,
  category text,
  alert_status text not null default 'active',
  severity text not null default 'high',
  first_failed_at timestamptz not null default now(),
  last_failed_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  consecutive_failures integer not null default 1,
  last_http_status integer not null default 0,
  last_failure_kind text,
  expected_url text,
  resolved_url text,
  acknowledged_at timestamptz,
  acknowledged_by text,
  resolved_at timestamptz,
  resolved_by text,
  updated_at timestamptz not null default now(),
  constraint media_asset_alerts_status_check check (alert_status in ('monitoring','active','acknowledged','resolved','ignored')),
  constraint media_asset_alerts_severity_check check (severity in ('normal','high','urgent')),
  constraint media_asset_alerts_http_check check (last_http_status >= 0 and last_http_status <= 599),
  constraint media_asset_alerts_failure_count_check check (consecutive_failures >= 0)
);

create index if not exists media_asset_alerts_status_idx
  on public.media_asset_alerts (alert_status, severity desc, last_failed_at desc);

alter table public.media_asset_health_observations enable row level security;
alter table public.media_asset_alerts enable row level security;
revoke all on table public.media_asset_health_observations from public, anon, authenticated;
revoke all on table public.media_asset_alerts from public, anon, authenticated;

-- Server-side only. The Cloudflare Functions call this through the Supabase service-role key.
create or replace function public.rosie_record_media_asset_observations(
  p_rows jsonb,
  p_actor text default null,
  p_scan_source text default 'admin_media_health'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  row_value jsonb;
  v_asset_key text;
  v_ok boolean;
  v_status integer;
  v_failure text;
  v_dimension_status text;
  v_severity text;
  v_active integer := 0;
  v_resolved integer := 0;
  v_observations integer := 0;
begin
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'p_rows must be a JSON array';
  end if;

  for row_value in select value from jsonb_array_elements(p_rows)
  loop
    v_asset_key := nullif(trim(coalesce(row_value->>'r2_key', '')), '');
    if v_asset_key is null then
      continue;
    end if;

    v_dimension_status := coalesce(nullif(row_value->>'dimension_status', ''), 'unknown');
    v_ok := coalesce((row_value->>'ok')::boolean, false) and v_dimension_status <> 'too_small';
    v_status := coalesce(nullif(row_value->>'http_status', '')::integer, 0);
    v_failure := nullif(coalesce(row_value->>'failure_kind', ''), '');
    if not v_ok and v_failure is null then
      v_failure := case when v_dimension_status = 'too_small' then 'undersized' else 'unavailable' end;
    end if;

    insert into public.media_asset_health_observations (
      asset_key, label, category, scan_source, ok, http_status, failure_kind,
      expected_url, resolved_url, candidate_urls, content_type, width, height,
      dimension_status, used_format_fallback, observed_by
    ) values (
      v_asset_key,
      nullif(row_value->>'label', ''),
      nullif(row_value->>'category', ''),
      coalesce(nullif(p_scan_source, ''), 'admin_media_health'),
      v_ok,
      v_status,
      v_failure,
      nullif(row_value->>'expected_url', ''),
      nullif(row_value->>'resolved_url', ''),
      coalesce(row_value->'candidate_urls', '[]'::jsonb),
      nullif(row_value->>'content_type', ''),
      nullif(row_value->>'width', '')::integer,
      nullif(row_value->>'height', '')::integer,
      v_dimension_status,
      coalesce((row_value->>'used_format_fallback')::boolean, false),
      nullif(p_actor, '')
    );
    v_observations := v_observations + 1;

    if not v_ok then
      v_severity := case
        when v_failure in ('not_found','not_public','timeout','unreachable','origin_error') then 'high'
        when v_failure = 'undersized' then 'normal'
        else 'normal'
      end;
      insert into public.media_asset_alerts (
        asset_key, label, category, alert_status, severity, first_failed_at, last_failed_at,
        last_checked_at, consecutive_failures, last_http_status, last_failure_kind,
        expected_url, resolved_url, updated_at
      ) values (
        v_asset_key,
        nullif(row_value->>'label', ''),
        nullif(row_value->>'category', ''),
        'monitoring', v_severity, now(), now(), now(), 1, v_status, v_failure,
        nullif(row_value->>'expected_url', ''), nullif(row_value->>'resolved_url', ''), now()
      ) on conflict (asset_key) do update set
        label = excluded.label,
        category = excluded.category,
        alert_status = case
          when public.media_asset_alerts.alert_status = 'acknowledged'
            and public.media_asset_alerts.last_failure_kind = excluded.last_failure_kind then 'acknowledged'
          when public.media_asset_alerts.consecutive_failures + 1 >= 2 then 'active'
          else 'monitoring'
        end,
        severity = excluded.severity,
        last_failed_at = now(),
        last_checked_at = now(),
        consecutive_failures = public.media_asset_alerts.consecutive_failures + 1,
        last_http_status = excluded.last_http_status,
        last_failure_kind = excluded.last_failure_kind,
        expected_url = excluded.expected_url,
        resolved_url = excluded.resolved_url,
        resolved_at = null,
        resolved_by = null,
        updated_at = now();
      v_active := v_active + 1;
    else
      update public.media_asset_alerts
         set alert_status = 'resolved',
             last_checked_at = now(),
             consecutive_failures = 0,
             last_http_status = v_status,
             last_failure_kind = null,
             expected_url = nullif(row_value->>'expected_url', ''),
             resolved_url = nullif(row_value->>'resolved_url', ''),
             resolved_at = coalesce(resolved_at, now()),
             resolved_by = coalesce(nullif(p_actor, ''), resolved_by),
             updated_at = now()
       where asset_key = v_asset_key
         and alert_status <> 'resolved';
      if found then v_resolved := v_resolved + 1; end if;
    end if;
  end loop;

  return jsonb_build_object(
    'observations_saved', v_observations,
    'active_failures_recorded', v_active,
    'alerts_auto_resolved', v_resolved,
    'persistent_alert_rule', 'An alert becomes persistent after two consecutive failed scans; one passing scan resolves it automatically.'
  );
end;
$$;

revoke all on function public.rosie_record_media_asset_observations(jsonb, text, text) from public, anon, authenticated;
grant execute on function public.rosie_record_media_asset_observations(jsonb, text, text) to service_role;

commit;
