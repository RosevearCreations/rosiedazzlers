-- Build 908. Owner-scoped customer review receipts; never public media/quote access.
create table if not exists public.customer_review_receipts_908 (
 id uuid primary key default gen_random_uuid(),
 customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
 subject_kind text not null check(subject_kind in ('quote','media_booking','media_quote')),
 subject_id uuid not null,
 source_revision text not null check(source_revision ~ '^[a-f0-9]{64}$'),
 reviewed_at timestamptz not null default now(),
 unique(customer_profile_id,subject_kind,subject_id,source_revision)
);
create index if not exists customer_review_receipts_908_customer_time
 on public.customer_review_receipts_908(customer_profile_id,reviewed_at desc);
alter table public.customer_review_receipts_908 enable row level security;
revoke all on public.customer_review_receipts_908 from public,anon,authenticated;
grant select,insert on public.customer_review_receipts_908 to service_role;
comment on table public.customer_review_receipts_908 is
 'Build 908 private, source-version-bound acknowledgement only. Not approval, delivery, consent, or payment evidence.';
