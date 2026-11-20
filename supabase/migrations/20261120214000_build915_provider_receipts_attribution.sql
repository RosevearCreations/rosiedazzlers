-- Rosie 915: exact original provider receipt, append-only custody, and deduped anonymous engagement.
-- Original Rosie Supabase project only; no financial or live supplier inventory mutation.
create table if not exists public.rosie_supplier_provider_receipts_v915 (
 id uuid primary key default gen_random_uuid(),
 publication_id uuid not null unique references public.rosie_supplier_publication_v914(id),
 channel text not null check(channel in ('youtube','instagram','facebook')),
 provider_object_id text not null check (length(provider_object_id) between 6 and 100),
 provider_owner_id text not null check (length(provider_owner_id) between 6 and 100),
 provider_permalink text not null check (provider_permalink like 'https://%' and length(provider_permalink) between 20 and 900),
 provider_response_sha256 text not null check (provider_response_sha256 ~ '^[a-f0-9]{64}$'),
 verified_by_staff_id uuid not null,
 provider_read_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.rosie_supplier_provider_receipts_v915 enable row level security;
revoke all on table public.rosie_supplier_provider_receipts_v915 from public, anon, authenticated;
grant select, insert on table public.rosie_supplier_provider_receipts_v915 to service_role;

alter table public.rosie_supplier_attribution_v914 add column if not exists event_uuid uuid;
create unique index if not exists rosie_supplier_attribution_event_nonce_v915
 on public.rosie_supplier_attribution_v914(event_uuid) where event_uuid is not null;
-- A caller must be an explicitly authorized server-side service-role application.
revoke all on table public.rosie_supplier_attribution_v914 from public, anon, authenticated;
grant select, insert on table public.rosie_supplier_attribution_v914 to service_role;

create or replace function public.rosie_supplier_attribution_rollup_v915(p_publication_id uuid)
returns table(source text,event_kind text,event_day date,events bigint)
language sql stable security invoker set search_path = ''
as $$
 select a.source,a.event_kind,a.event_day,count(*)::bigint
 from public.rosie_supplier_attribution_v914 a
 join public.rosie_supplier_publication_v914 p on p.id=a.publication_id
 where a.publication_id=p_publication_id and p.publication_state='provider_verified'
 group by a.source,a.event_kind,a.event_day
 having count(*)>=5
 order by a.event_day desc,a.source,a.event_kind
 limit 1000
$$;
revoke all on function public.rosie_supplier_attribution_rollup_v915(uuid) from public, anon, authenticated;
grant execute on function public.rosie_supplier_attribution_rollup_v915(uuid) to service_role;
