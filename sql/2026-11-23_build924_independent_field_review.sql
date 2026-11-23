-- Rosie 924: original-only independent Windows service-identity evidence and owner final review.
-- Append-only, private, no synthetic field evidence, no autonomous certification.
create table if not exists public.rosie_sysop_identity_challenges_v924 (
 id uuid primary key default gen_random_uuid(),
 app_attestation_id uuid not null references public.rosie_sysop_app_attestations_v923(id),
 challenge_nonce text not null unique check (challenge_nonce ~ '^[a-f0-9]{64}$'),
 issued_by_staff_id uuid not null references public.staff_users(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '90 seconds'),
 check (expires_at>created_at and expires_at<=created_at+interval '90 seconds')
);
create table if not exists public.rosie_sysop_identity_witness_v924 (
 id uuid primary key default gen_random_uuid(),
 challenge_id uuid not null unique references public.rosie_sysop_identity_challenges_v924(id),
 app_attestation_id uuid not null unique references public.rosie_sysop_app_attestations_v923(id),
 inspection_id uuid not null unique,
 host_id text not null check (host_id ~ '^[A-Za-z0-9_-]{6,100}$'),
 boot_id text not null check (boot_id ~ '^[a-f0-9]{32}$'),
 observed_at_ms bigint not null check (observed_at_ms>0),
 inspector_commit text not null check (inspector_commit ~ '^[a-f0-9]{40}$'),
 inspector_fingerprint_sha256 text not null check (inspector_fingerprint_sha256 ~ '^[a-f0-9]{64}$'),
 signature_sha256 text not null unique check (signature_sha256 ~ '^[a-f0-9]{64}$'),
 service_states jsonb not null check (jsonb_typeof(service_states)='array' and jsonb_array_length(service_states)=4),
 recorded_by_staff_id uuid not null references public.staff_users(id),
 review_state text not null default 'INDEPENDENT_SERVICE_IDENTITY_REVIEW_HOLD'
  check (review_state='INDEPENDENT_SERVICE_IDENTITY_REVIEW_HOLD'),
 created_at timestamptz not null default now()
);
create table if not exists public.rosie_sysop_owner_final_reviews_v924 (
 id uuid primary key default gen_random_uuid(),
 identity_witness_id uuid not null references public.rosie_sysop_identity_witness_v924(id),
 owner_staff_id uuid not null references public.staff_users(id),
 owner_role text not null check (length(owner_role) between 3 and 64),
 owner_signer_fingerprint_sha256 text not null check (owner_signer_fingerprint_sha256 ~ '^[a-f0-9]{64}$'),
 review_id uuid not null unique,
 case_digest_sha256 text not null check (case_digest_sha256 ~ '^[a-f0-9]{64}$'),
 decision text not null check (decision in ('APPROVE_REVIEW','HOLD')),
 observed_at_ms bigint not null check (observed_at_ms>0),
 signature_sha256 text not null unique check (signature_sha256 ~ '^[a-f0-9]{64}$'),
 review_state text not null default 'OWNER_SIGNED_REVIEW_NOT_FIELD_CERTIFICATION'
  check (review_state='OWNER_SIGNED_REVIEW_NOT_FIELD_CERTIFICATION'),
 created_at timestamptz not null default now(),
 unique (identity_witness_id,owner_staff_id)
);
create or replace function public.rosie_sysop_identity_insert_guard_v924()
returns trigger language plpgsql security invoker set search_path=public as $$
declare ch record; app record;
begin
 perform pg_advisory_xact_lock(924,hashtext(new.challenge_id::text));
 select * into ch from public.rosie_sysop_identity_challenges_v924 where id=new.challenge_id;
 select id,host_id,boot_id into app from public.rosie_sysop_app_attestations_v923 where id=new.app_attestation_id;
 if ch.id is null or app.id is null or ch.app_attestation_id<>new.app_attestation_id
 or ch.expires_at<=now() or ch.created_at>now()
 or app.host_id<>new.host_id or app.boot_id<>new.boot_id then
  raise exception 'ORIGINAL_924_CHALLENGE_ATTESTATION_OR_BOOT_MISMATCH';
 end if;
 return new;
end; $$;
revoke all on function public.rosie_sysop_identity_insert_guard_v924() from public,anon,authenticated;
grant execute on function public.rosie_sysop_identity_insert_guard_v924() to service_role;
drop trigger if exists rosie_sysop_identity_insert_guard_t_v924 on public.rosie_sysop_identity_witness_v924;
create trigger rosie_sysop_identity_insert_guard_t_v924 before insert on public.rosie_sysop_identity_witness_v924
for each row execute function public.rosie_sysop_identity_insert_guard_v924();
create index if not exists rosie_sysop_identity_witness_v924_recent on public.rosie_sysop_identity_witness_v924(created_at desc);
create index if not exists rosie_sysop_owner_reviews_v924_recent on public.rosie_sysop_owner_final_reviews_v924(created_at desc);
do $$
declare t text;
begin
 foreach t in array array['rosie_sysop_identity_challenges_v924','rosie_sysop_identity_witness_v924','rosie_sysop_owner_final_reviews_v924'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
  execute format('grant select,insert on public.%I to service_role',t);
 end loop;
end $$;
