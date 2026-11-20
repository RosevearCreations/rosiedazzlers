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

-- Atomic transaction: one original live provider corroboration, no replay / cross-tenant promotion.
create or replace function public.rosie_supplier_confirm_provider_v915(
 p_publication_id uuid,p_provider_object_id text,p_provider_owner_id text,
 p_provider_permalink text,p_response_hash text,p_staff_id uuid
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare v_pub public.rosie_supplier_publication_v914%rowtype; v_receipt uuid; v_matched int;
begin
 select * into v_pub from public.rosie_supplier_publication_v914
 where id=p_publication_id for update;
 if not found or v_pub.publication_state<>'approved_pending_provider' then
  raise exception 'ORIGINAL_PUBLICATION_NOT_PENDING';
 end if;
 if not exists (
 select 1 from public.creative_projects pr
 where pr.id=v_pub.project_id and pr.consent_status='approved_public'
 and pr.public_publish_allowed is true and pr.consent_reviewed is true
 and pr.content_package_status='approved' and pr.archived_at is null
 and (pr.consent_expires_at is null or pr.consent_expires_at>now())
 ) then raise exception 'CURRENT_ORIGINAL_PROJECT_CONSENT_HOLD'; end if;
 select count(*) into v_matched from public.daip_project_media_assets a
 where a.project_id=v_pub.project_id and a.id=any(v_pub.approved_asset_ids)
 and a.story_review_status='selected' and a.consent_status='approved_public'
 and a.upload_status='uploaded';
 if v_matched<>cardinality(v_pub.approved_asset_ids) then
  raise exception 'CURRENT_ASSET_CONSENT_HOLD';
 end if;
 if not exists (
 select 1 from public.rosie_supplier_reviews_v911 sr
 join public.rosie_supplier_custody_v914 custody
  on custody.supplier_review_id=sr.id
 where sr.id=v_pub.supplier_review_id and sr.daip_project_id=v_pub.project_id
 and custody.id=v_pub.custody_id and sr.received_verified is true
 ) then raise exception 'PHYSICAL_SUPPLIER_RECEIPT_HOLD'; end if;
 insert into public.rosie_supplier_provider_receipts_v915 (
  publication_id,channel,provider_object_id,provider_owner_id,
  provider_permalink,provider_response_sha256,verified_by_staff_id
 ) values (v_pub.id,v_pub.channel,p_provider_object_id,p_provider_owner_id,
  p_provider_permalink,p_response_hash,p_staff_id) returning id into v_receipt;
 update public.rosie_supplier_publication_v914 set
 publication_state='provider_verified',provider_video_url=p_provider_permalink,
 provider_receipt_reference=v_receipt::text
 where id=v_pub.id and publication_state='approved_pending_provider';
 if not found then raise exception 'PROVIDER_PUBLICATION_RACE_HOLD'; end if;
 return v_receipt;
end
$$;
revoke all on function public.rosie_supplier_confirm_provider_v915(uuid,text,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.rosie_supplier_confirm_provider_v915(uuid,text,text,text,text,uuid) to service_role;
