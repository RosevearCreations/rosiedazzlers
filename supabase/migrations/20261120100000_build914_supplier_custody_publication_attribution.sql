-- Build 914. Private server-only records. Never grant anon/authenticated access.
create table if not exists public.rosie_supplier_custody_v914 (
 id uuid primary key default gen_random_uuid(),
 supplier_review_id uuid not null references public.rosie_supplier_reviews_v911(id),
 custody_kind text not null check (custody_kind in ('purchased','gifted','loaned','review_sample')),
 evidence_reference text not null check (length(evidence_reference) between 8 and 180),
 received_at timestamptz not null,
 custody_note text not null check (length(custody_note) between 10 and 600),
 witnessed_by_staff_id uuid not null,
 witnessed_at timestamptz not null default now()
);
create index if not exists rosie_supplier_custody_review_v914 on public.rosie_supplier_custody_v914(supplier_review_id);
alter table public.rosie_supplier_custody_v914 enable row level security;
revoke all on table public.rosie_supplier_custody_v914 from public, anon, authenticated;
grant select, insert on table public.rosie_supplier_custody_v914 to service_role;

create table if not exists public.rosie_supplier_publication_v914 (
 id uuid primary key default gen_random_uuid(),
 supplier_review_id uuid not null references public.rosie_supplier_reviews_v911(id),
 custody_id uuid not null references public.rosie_supplier_custody_v914(id),
 project_id uuid not null references public.creative_projects(id),
 consent_record_id uuid not null,
 channel text not null check(channel in ('youtube','instagram','facebook')),
 approved_asset_ids uuid[] not null check (cardinality(approved_asset_ids)>0),
 approved_by_staff_id uuid not null,
 creative_reviewed_at timestamptz not null,
 disclosure_confirmed boolean not null,
 publication_state text not null default 'approved_pending_provider' check (publication_state in ('approved_pending_provider','provider_verified','revoked','failed')),
 provider_video_url text,
 provider_receipt_reference text,
 approved_at timestamptz not null default now(),
 unique (supplier_review_id, channel, consent_record_id)
);
alter table public.rosie_supplier_publication_v914 enable row level security;
revoke all on table public.rosie_supplier_publication_v914 from public, anon, authenticated;
grant select, insert, update on table public.rosie_supplier_publication_v914 to service_role;

create table if not exists public.rosie_supplier_attribution_v914 (
 id uuid primary key default gen_random_uuid(),
 publication_id uuid not null references public.rosie_supplier_publication_v914(id),
 source text not null check (source in ('youtube','instagram','facebook')),
 event_kind text not null check (event_kind in ('landing','product_interest','quote_started')),
 occurred_at timestamptz not null default now(),
 -- Aggregation uses no client identity, IP, URL params, or other raw customer information.
 event_day date generated always as ((occurred_at at time zone 'UTC')::date) stored
);
create index if not exists rosie_supplier_attr_group_v914 on public.rosie_supplier_attribution_v914(publication_id,event_day,event_kind);
alter table public.rosie_supplier_attribution_v914 enable row level security;
revoke all on table public.rosie_supplier_attribution_v914 from public, anon, authenticated;
grant select, insert on table public.rosie_supplier_attribution_v914 to service_role;
