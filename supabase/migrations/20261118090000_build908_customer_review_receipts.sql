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

-- Independent provider-delivery custody: acceptance alone never means delivered.
create table if not exists public.customer_recovery_delivery_evidence_908 (
 id uuid primary key default gen_random_uuid(),
 customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
 auth_token_id uuid not null references public.customer_auth_tokens(id) on delete cascade,
 purpose text not null check(purpose='password_reset'),
 channel text not null check(channel='email'),
 provider text not null,
 provider_reference text,
 dispatch_state text not null check(dispatch_state in ('provider_accepted','no_provider_reference','provider_unavailable')),
 provider_http_status integer,
 witness_state text not null default 'pending' check(witness_state in ('pending','delivered','bounced','failed')),
 witnessed_at timestamptz,
 created_at timestamptz not null default now(),
 unique(auth_token_id)
);
create unique index if not exists customer_recovery_evidence908_provider_reference_unique
 on public.customer_recovery_delivery_evidence_908(provider_reference) where provider_reference is not null;
create index if not exists customer_recovery_evidence908_owner_created
 on public.customer_recovery_delivery_evidence_908(customer_profile_id,created_at desc);
alter table public.customer_recovery_delivery_evidence_908 enable row level security;
revoke all on public.customer_recovery_delivery_evidence_908 from public,anon,authenticated;
grant select,insert,update on public.customer_recovery_delivery_evidence_908 to service_role;
comment on table public.customer_recovery_delivery_evidence_908 is
 'Only a distinct, enrolled HMAC witness may confirm provider outcomes; initial HTTP acceptance is not delivery.';
