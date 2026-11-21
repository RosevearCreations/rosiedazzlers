-- Rosie Build 916. Original Rosie Supabase only; fail-closed server-only audit.
-- No external platform deletion or accounting posting is performed by this migration.
create table if not exists public.rosie_supplier_revocations_v916 (
 id uuid primary key default gen_random_uuid(),
 publication_id uuid not null unique references public.rosie_supplier_publication_v914(id),
 project_id uuid not null references public.creative_projects(id),
 reason text not null check (reason in ('customer_consent_withdrawn','supplier_permission_withdrawn','owner_publication_withdrawn','rights_or_safety_concern')),
 initiated_by_staff_id uuid not null references public.staff_users(id),
 recall_state text not null default 'external_recall_pending' check (recall_state='external_recall_pending'),
 created_at timestamptz not null default now()
);
create index if not exists rosie_supplier_revoke_project_v916 on public.rosie_supplier_revocations_v916(project_id);
alter table public.rosie_supplier_revocations_v916 enable row level security;
revoke all on table public.rosie_supplier_revocations_v916 from public, anon, authenticated;
grant select, insert on public.rosie_supplier_revocations_v916 to service_role;

create table if not exists public.rosie_supplier_recall_observations_v916 (
 id uuid primary key default gen_random_uuid(),
 publication_id uuid not null references public.rosie_supplier_publication_v914(id),
 observed_by_staff_id uuid not null references public.staff_users(id),
 provider_status text not null check (provider_status in ('original_post_still_public','external_recall_unverified')),
 probe_reason text not null check (length(probe_reason) between 3 and 100),
 observation_digest text not null check (observation_digest ~ '^[a-f0-9]{64}$'),
 observed_at timestamptz not null default now()
);
create index if not exists rosie_supplier_recall_observations_pub_v916 on public.rosie_supplier_recall_observations_v916(publication_id,observed_at desc);
alter table public.rosie_supplier_recall_observations_v916 enable row level security;
revoke all on table public.rosie_supplier_recall_observations_v916 from public, anon, authenticated;
grant select, insert on public.rosie_supplier_recall_observations_v916 to service_role;

create table if not exists public.rosie_supplier_device_evidence_v916 (
 id uuid primary key default gen_random_uuid(),
 publication_id uuid not null references public.rosie_supplier_publication_v914(id),
 witnessed_by_staff_id uuid not null references public.staff_users(id),
 device_class text not null check (device_class in ('desktop','mobile','tablet')),
 role_tested text not null check (role_tested in ('admin','senior_detailer','detailer','customer')),
 browser_family text not null check (browser_family in ('chromium','firefox','safari','edge')),
 scenario text not null check (scenario in ('consent_revoke','supplier_recall','creative_review','quote_handoff','attribution_privacy')),
 outcome text not null check (outcome in ('passed','failed','blocked')),
 evidence_sha256 text not null check (evidence_sha256 ~ '^[a-f0-9]{64}$'),
 evidence_state text not null default 'staff_reported_unverified' check(evidence_state='staff_reported_unverified'),
 created_at timestamptz not null default now(),
 unique(publication_id,witnessed_by_staff_id,device_class,role_tested,scenario,evidence_sha256)
);
alter table public.rosie_supplier_device_evidence_v916 enable row level security;
revoke all on table public.rosie_supplier_device_evidence_v916 from public, anon, authenticated;
grant select, insert on public.rosie_supplier_device_evidence_v916 to service_role;

create table if not exists public.rosie_supplier_financial_reviews_v916 (
 id uuid primary key default gen_random_uuid(),
 publication_id uuid not null references public.rosie_supplier_publication_v914(id),
 journal_entry_id uuid not null references public.accounting_journal_entries(id),
 reviewed_by_staff_id uuid not null references public.staff_users(id),
 review_state text not null default 'document_review_only' check (review_state='document_review_only'),
 revenue_attributed_cents bigint,
 review_date timestamptz not null default now(),
 unique(publication_id,journal_entry_id),
 check (revenue_attributed_cents is null)
);
alter table public.rosie_supplier_financial_reviews_v916 enable row level security;
revoke all on table public.rosie_supplier_financial_reviews_v916 from public, anon, authenticated;
grant select, insert on public.rosie_supplier_financial_reviews_v916 to service_role;

-- Transaction lock closes publication and inserts a unique revocation.
-- Repeated calls fail closed. A real provider takedown must be evidenced separately.
create or replace function public.rosie_supplier_revoke_v916(
 p_publication_id uuid,p_reason text,p_actor uuid
) returns uuid
language plpgsql security invoker set search_path=''
as $$
declare v_pub public.rosie_supplier_publication_v914%rowtype; v_id uuid;
begin
 select * into v_pub from public.rosie_supplier_publication_v914
 where id=p_publication_id for update;
 if not found or v_pub.publication_state not in ('approved_pending_provider','provider_verified') then
  raise exception 'ALREADY_REVOKED_OR_ORIGINAL_NOT_FOUND'; end if;
 if p_reason not in ('customer_consent_withdrawn','supplier_permission_withdrawn','owner_publication_withdrawn','rights_or_safety_concern')
  or not exists(select 1 from public.staff_users where id=p_actor and is_active is true) then
  raise exception 'ORIGINAL_REVOKER_SCOPE_HOLD'; end if;
 insert into public.rosie_supplier_revocations_v916(publication_id,project_id,reason,initiated_by_staff_id)
 values(p_publication_id,v_pub.project_id,p_reason,p_actor)
 returning id into v_id;
 update public.rosie_supplier_publication_v914
 set publication_state='revoked' where id=p_publication_id and publication_state=v_pub.publication_state;
 if not found then raise exception 'ORIGINAL_REVOKE_CONFLICT_HOLD'; end if;
 return v_id;
end
$$;
revoke all on function public.rosie_supplier_revoke_v916(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.rosie_supplier_revoke_v916(uuid,text,uuid) to service_role;

-- No ledger amount or causal ROAS can be inferred from interest/click attribution.
create or replace function public.rosie_supplier_finance_review_summary_v916(p_publication_id uuid)
returns table(reviewed_documents bigint, unverified_financial_attribution boolean)
language sql stable security invoker set search_path=''
as $$
 select count(*)::bigint,true
 from public.rosie_supplier_financial_reviews_v916 f
 join public.accounting_journal_entries j on j.id=f.journal_entry_id
 where f.publication_id=p_publication_id and f.review_state='document_review_only'
$$;
revoke all on function public.rosie_supplier_finance_review_summary_v916(uuid) from public, anon, authenticated;
grant execute on function public.rosie_supplier_finance_review_summary_v916(uuid) to service_role;

-- Preserve revocation even if a privileged operator attempts to re-enable the publication.
create or replace function public.rosie_supplier_revoked_guard_v916()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
 if exists(select 1 from public.rosie_supplier_revocations_v916 r where r.publication_id=new.id)
 and new.publication_state<>'revoked' then
  raise exception 'REVOKED_PUBLICATION_IS_TERMINAL'; end if;
 return new;
end
$$;
drop trigger if exists rosie_supplier_revoked_guard_v916 on public.rosie_supplier_publication_v914;
create trigger rosie_supplier_revoked_guard_v916
 before update on public.rosie_supplier_publication_v914
 for each row execute function public.rosie_supplier_revoked_guard_v916();
revoke all on function public.rosie_supplier_revoked_guard_v916() from public, anon, authenticated;
