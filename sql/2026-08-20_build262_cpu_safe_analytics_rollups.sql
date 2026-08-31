-- Build 262 — move analytics rollup computation out of Cloudflare Worker CPU.
-- Apply in Supabase before using Admin Analytics > Refresh rollups.

begin;

create or replace function public.refresh_site_activity_rollups_cpu_safe(p_days integer default 90)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_days integer := greatest(7, least(coalesce(p_days, 90), 365));
  v_since timestamptz := now() - make_interval(days => greatest(7, least(coalesce(p_days, 90), 365)));
  v_start_date date := (now() - make_interval(days => greatest(7, least(coalesce(p_days, 90), 365))))::date;
  v_event_count integer := 0;
  v_summary_count integer := 0;
  v_dimension_count integer := 0;
  v_funnel_count integer := 0;
begin
  select count(*) into v_event_count
  from public.site_activity_events
  where created_at >= v_since;

  delete from public.site_activity_rollups where period_end >= v_start_date;
  delete from public.site_activity_dimension_daily_rollups where rollup_date >= v_start_date;
  delete from public.site_activity_funnel_daily_rollups where rollup_date >= v_start_date;

  with scoped as (
    select e.*,
           s.service_area_label,
           (e.created_at at time zone 'UTC') as created_utc
    from public.site_activity_events e
    cross join lateral (
      select '__all__'::text as service_area_label
      union all
      select coalesce(nullif(btrim(e.payload->>'service_area_label'), ''), nullif(btrim(e.payload->>'service_area'), ''))
      where coalesce(nullif(btrim(e.payload->>'service_area_label'), ''), nullif(btrim(e.payload->>'service_area'), '')) is not null
    ) s
    where e.created_at >= v_since
  ), periods as (
    select scoped.*,
           p.period_type, p.period_key, p.period_start, p.period_end
    from scoped
    cross join lateral (
      values
        ('day'::text,
         to_char(scoped.created_utc, 'YYYY-MM-DD'),
         date_trunc('day', scoped.created_utc)::date,
         date_trunc('day', scoped.created_utc)::date),
        ('week'::text,
         to_char(scoped.created_utc, 'IYYY-"W"IW'),
         date_trunc('week', scoped.created_utc)::date,
         (date_trunc('week', scoped.created_utc) + interval '6 days')::date),
        ('month'::text,
         to_char(scoped.created_utc, 'YYYY-MM'),
         date_trunc('month', scoped.created_utc)::date,
         (date_trunc('month', scoped.created_utc) + interval '1 month - 1 day')::date),
        ('year'::text,
         to_char(scoped.created_utc, 'YYYY'),
         date_trunc('year', scoped.created_utc)::date,
         (date_trunc('year', scoped.created_utc) + interval '1 year - 1 day')::date)
    ) p(period_type, period_key, period_start, period_end)
  )
  insert into public.site_activity_rollups (
    period_type, period_key, period_start, period_end, service_area_label,
    events, page_views, unique_visitors, unique_sessions,
    booking_starts, booking_completions, cart_snapshots, updated_at
  )
  select
    period_type,
    period_key,
    period_start,
    period_end,
    service_area_label,
    count(*)::integer,
    count(*) filter (where event_type = 'page_view')::integer,
    count(distinct visitor_id) filter (where visitor_id is not null)::integer,
    count(distinct session_id) filter (where session_id is not null)::integer,
    count(*) filter (where event_type = 'checkout_started' or checkout_state = 'started')::integer,
    count(*) filter (where event_type = 'checkout_completed' or checkout_state = 'completed')::integer,
    count(*) filter (where event_type = 'cart_snapshot')::integer,
    now()
  from periods
  group by period_type, period_key, period_start, period_end, service_area_label
  on conflict (period_type, period_key, service_area_label) do update set
    period_start = excluded.period_start,
    period_end = excluded.period_end,
    events = excluded.events,
    page_views = excluded.page_views,
    unique_visitors = excluded.unique_visitors,
    unique_sessions = excluded.unique_sessions,
    booking_starts = excluded.booking_starts,
    booking_completions = excluded.booking_completions,
    cart_snapshots = excluded.cart_snapshots,
    updated_at = now();

  get diagnostics v_summary_count = row_count;

  with base as (
    select e.*,
           (e.created_at at time zone 'UTC')::date as rollup_date,
           coalesce(nullif(btrim(e.payload->>'service_area_label'), ''), nullif(btrim(e.payload->>'service_area'), '')) as event_area
    from public.site_activity_events e
    where e.created_at >= v_since
  ), scoped as (
    select base.*, s.service_area_label
    from base
    cross join lateral (
      select '__all__'::text as service_area_label
      union all
      select base.event_area where base.event_area is not null
    ) s
  ), dims as (
    select rollup_date, service_area_label, d.dimension_type, d.dimension_value
    from scoped
    cross join lateral (
      values
        ('page_path'::text, coalesce(nullif(page_path, ''), '/')),
        ('country'::text, coalesce(nullif(country, ''), 'Unknown')),
        ('region'::text, coalesce(nullif(payload->>'region', ''), 'Unknown')),
        ('city'::text,
          case when nullif(payload->>'city','') is null then 'Unknown'
               else (payload->>'city') || case when nullif(payload->>'region','') is null then '' else ', ' || (payload->>'region') end end),
        ('device_type'::text, coalesce(nullif(payload->>'device_type', ''), 'Unknown')),
        ('referrer'::text, coalesce(nullif(referrer, ''), 'Direct')),
        ('event_type'::text, case when event_type in ('heartbeat','page_focus','page_exit') then null else coalesce(nullif(event_type,''),'unknown') end),
        ('checkout_state'::text, nullif(checkout_state, ''))
    ) d(dimension_type, dimension_value)
    where d.dimension_value is not null
    union all
    select rollup_date, '__all__'::text, 'service_area'::text, event_area
    from base
    where event_area is not null
  )
  insert into public.site_activity_dimension_daily_rollups (
    rollup_date, service_area_label, dimension_type, dimension_value, count, updated_at
  )
  select rollup_date, service_area_label, dimension_type, dimension_value, count(*)::integer, now()
  from dims
  group by rollup_date, service_area_label, dimension_type, dimension_value
  on conflict (rollup_date, service_area_label, dimension_type, dimension_value) do update set
    count = excluded.count,
    updated_at = now();

  get diagnostics v_dimension_count = row_count;

  with base as (
    select e.*,
           (e.created_at at time zone 'UTC')::date as rollup_date,
           coalesce(nullif(btrim(e.payload->>'service_area_label'), ''), nullif(btrim(e.payload->>'service_area'), '')) as event_area
    from public.site_activity_events e
    where e.created_at >= v_since
  ), scoped as (
    select base.*, s.service_area_label
    from base
    cross join lateral (
      select '__all__'::text as service_area_label
      union all
      select base.event_area where base.event_area is not null
    ) s
  )
  insert into public.site_activity_funnel_daily_rollups (
    rollup_date, service_area_label,
    step_1_views, step_2_views, step_3_views, step_4_views, step_5_views,
    service_area_picks, date_picks, package_picks, addon_toggles, customer_continue,
    checkout_started, checkout_completed, updated_at
  )
  select
    rollup_date,
    service_area_label,
    count(*) filter (where event_type='booking_step_view' and case when coalesce(payload->>'step_number','') ~ '^\d+$' then (payload->>'step_number')::integer else 0 end=1)::integer,
    count(*) filter (where event_type='booking_step_view' and case when coalesce(payload->>'step_number','') ~ '^\d+$' then (payload->>'step_number')::integer else 0 end=2)::integer,
    count(*) filter (where event_type='booking_step_view' and case when coalesce(payload->>'step_number','') ~ '^\d+$' then (payload->>'step_number')::integer else 0 end=3)::integer,
    count(*) filter (where event_type='booking_step_view' and case when coalesce(payload->>'step_number','') ~ '^\d+$' then (payload->>'step_number')::integer else 0 end=4)::integer,
    count(*) filter (where event_type='booking_step_view' and case when coalesce(payload->>'step_number','') ~ '^\d+$' then (payload->>'step_number')::integer else 0 end=5)::integer,
    count(*) filter (where event_type='booking_service_area_pick')::integer,
    count(*) filter (where event_type='booking_date_pick')::integer,
    count(*) filter (where event_type='booking_package_pick')::integer,
    count(*) filter (where event_type='booking_addon_toggle')::integer,
    count(*) filter (where event_type='booking_customer_continue')::integer,
    count(*) filter (where event_type='checkout_started' or checkout_state='started')::integer,
    count(*) filter (where event_type='checkout_completed' or checkout_state='completed')::integer,
    now()
  from scoped
  group by rollup_date, service_area_label
  on conflict (rollup_date, service_area_label) do update set
    step_1_views=excluded.step_1_views,
    step_2_views=excluded.step_2_views,
    step_3_views=excluded.step_3_views,
    step_4_views=excluded.step_4_views,
    step_5_views=excluded.step_5_views,
    service_area_picks=excluded.service_area_picks,
    date_picks=excluded.date_picks,
    package_picks=excluded.package_picks,
    addon_toggles=excluded.addon_toggles,
    customer_continue=excluded.customer_continue,
    checkout_started=excluded.checkout_started,
    checkout_completed=excluded.checkout_completed,
    updated_at=now();

  get diagnostics v_funnel_count = row_count;

  return jsonb_build_object(
    'ok', true,
    'days', v_days,
    'since_date', v_start_date,
    'source_event_count', v_event_count,
    'summary_rows', v_summary_count,
    'dimension_rows', v_dimension_count,
    'funnel_rows', v_funnel_count,
    'execution_location', 'supabase_postgres'
  );
end;
$$;

revoke all on function public.refresh_site_activity_rollups_cpu_safe(integer) from public, anon, authenticated;
grant execute on function public.refresh_site_activity_rollups_cpu_safe(integer) to service_role;

commit;
