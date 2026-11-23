-- Rosie 923: original host application protocol challenge and signed evidence custody.
-- No test rows; irreversible records are service_role only. Never auto-certifies field acceptance.
create table if not exists public.rosie_sysop_app_challenges_v923(
 id uuid primary key default gen_random_uuid(),
 health_sample_id uuid not null references public.rosie_sysop_windows_health_v921(sample_id),
 challenge_nonce text not null unique check(challenge_nonce ~ '^[a-f0-9]{64}$'),
 issued_by_staff_id uuid not null references public.staff_users(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '60 seconds'),
 check(expires_at>created_at and expires_at<=created_at+interval '60 seconds')
);
create table if not exists public.rosie_sysop_app_attestations_v923(
 id uuid primary key default gen_random_uuid(),
 challenge_id uuid not null unique references public.rosie_sysop_app_challenges_v923(id),
 health_sample_id uuid not null unique references public.rosie_sysop_windows_health_v921(sample_id),
 attestation_id uuid not null unique,
 host_id text not null check(host_id ~ '^[A-Za-z0-9_-]{6,100}$'),
 boot_id text not null check(boot_id ~ '^[a-f0-9]{32}$'),
 sampled_at_ms bigint not null check(sampled_at_ms>0),
 sampler_commit text not null check(sampler_commit ~ '^[a-f0-9]{40}$'),
 sampler_fingerprint_sha256 text not null check(sampler_fingerprint_sha256 ~ '^[a-f0-9]{64}$'),
 signature_sha256 text not null unique check(signature_sha256 ~ '^[a-f0-9]{64}$'),
 service_states jsonb not null check(jsonb_typeof(service_states)='array' and jsonb_array_length(service_states)=4),
 admitted_by_staff_id uuid not null references public.staff_users(id),
 review_state text not null default 'SIGNED_ORIGINAL_APPLICATION_OBSERVATION_REVIEW'
 check(review_state='SIGNED_ORIGINAL_APPLICATION_OBSERVATION_REVIEW'),
 created_at timestamptz not null default now()
);
create index if not exists rosie_sysop_app_attestations_v923_recent on public.rosie_sysop_app_attestations_v923(created_at desc);
create or replace function public.rosie_sysop_app_attestation_guard_v923()
returns trigger language plpgsql security invoker set search_path=public as $$
declare ch record; hs record;
begin
 perform pg_advisory_xact_lock(923,hashtext(new.challenge_id::text));
 select * into ch from public.rosie_sysop_app_challenges_v923 where id=new.challenge_id;
 select sample_id,host_id,boot_id,sampled_at_ms into hs from public.rosie_sysop_windows_health_v921 where sample_id=new.health_sample_id;
 if ch.id is null or hs.sample_id is null or ch.health_sample_id<>new.health_sample_id
 or ch.expires_at<=now() or ch.created_at>now()
 or hs.host_id<>new.host_id or hs.boot_id<>new.boot_id
 or new.sampled_at_ms<hs.sampled_at_ms or new.sampled_at_ms-hs.sampled_at_ms>60000 then
  raise exception 'ORIGINAL_APP_CHALLENGE_SOURCE_OR_FRESHNESS_REQUIRED';
 end if;
 return new;
end;$$;
revoke all on function public.rosie_sysop_app_attestation_guard_v923() from public,anon,authenticated;
grant execute on function public.rosie_sysop_app_attestation_guard_v923() to service_role;
drop trigger if exists rosie_sysop_app_attestation_guard_t_v923 on public.rosie_sysop_app_attestations_v923;
create trigger rosie_sysop_app_attestation_guard_t_v923 before insert on public.rosie_sysop_app_attestations_v923
for each row execute function public.rosie_sysop_app_attestation_guard_v923();
do $$
declare t text;
begin
 foreach t in array array['rosie_sysop_app_challenges_v923','rosie_sysop_app_attestations_v923'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
  execute format('grant select,insert on public.%I to service_role',t);
 end loop;
end;$$;
